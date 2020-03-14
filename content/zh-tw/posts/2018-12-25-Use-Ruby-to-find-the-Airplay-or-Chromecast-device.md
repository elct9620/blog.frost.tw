---
title: 用 Ruby 來尋找區網中的 Airplay、Chromecast
publishDate: 2018-12-25 18:42:06
tags: [Ruby, mDNS, DNS-SD, 心得]
thumbnail: https://blog.frost.tw/images/2018-12-25-use-ruby-to-find-the-airplay-or-chromecast-device/thumbnail.jpg
---

從雲端開始熱門起來後，為了能能讓提供不同服務的伺服器能夠被自動的偵測，我們在許多雲端相關的工具都會看到 Service Discovery 這個名詞。

不過，除了雲端上的服務能夠透過這樣的機制互相「發現」對方，我們也可以在區網中用類似的方法找到「提供服務」的裝置。

這就要從 mDNS (Multicast DNS) 和 DNS-SD (DNS-based Service Discovery) 開始談起。

<!--more-->

## 概觀

想要可以發現區網的裝置，我們需要先搞懂 mDNS 和 DNS-SD 這兩個東西在做些什麼。簡單來說 mDNS 就是對區網做「廣播」而廣播的內容則是我們熟悉的 DNS Query。當其他有在關注 mDNS 的裝置注意到之後，就會把回應廣播回區網上。也因為這樣的特性，我們不需要特別在區網架設一個 DNS 伺服器，因為我們會直接在這個區網中交換有興趣的訊息。

而 DNS-SD 其實是由 Apple 所提出的，如果看到 Bonjour 大致上他們可能是同一個東西。簡單來說就是基於 mDNS 在區網用特定的規則「查詢」和「回應」就能讓某個裝置辨識出另一個裝置有提供的服務，從而做到 Service Discovery 的功能。

> Bonjour 是不是相等 DNS-SD 資料不多，所以我不太敢直接斷定是同樣的東西，不過 DNS-SD 文件上是會出現 Bonjour 這個名詞的。

## Ruby 的 Resolv 標準函式庫

基本上 `Resolv` 這個函式庫存在感低到我都懷疑他為什麼一直在 Ruby 原始碼中活得好好的，沒有被切割出來。不過如果我們想產生 DNS 查詢的封包，就得靠他來實現。

> 原本我是看著這篇[文章](https://routley.io/tech/2017/12/28/hand-writing-dns-messages.html)透過 Python 來實作產生和解析封包的功能，但是想起來我曾經對 Ruby 送過 PR 剛好就是 Resolv 相關的。

先來一段 `Resolv::DNS` 的官方使用，讓我們快速了解一下怎麼送出 DNS 查詢。

```ruby
require 'resolv'

Resolv::DNS.new
           .each_resource('frost.tw', Resolv::DNS::Resource::IN::A) do |record|
             pp record
           end
```

如此一來就可以查詢到 `frost.tw` 的 A 紀錄有哪些，那麼從前面的介紹來看假設 mDNS 也是使用 DNS 封包來互動的話，是不是就表示 `Resolv::DNS` 已經提供了足夠我們實現 mDNS 和 DNS-SD 的必要實作了呢？

## 監聽 mDNS 封包

跟我們平常使用的 `Socket` 功能比起來要正確的設定 `UDPSocket` 才能夠順利加入一個 [Multicast 群組](https://en.wikipedia.org/wiki/Multicast)，然後接收裡面的訊息。

根據 [mDNS 定義](https://en.wikipedia.org/wiki/Multicast_DNS)的 Multicast IPv4 位置，我們需要監聽 `224.0.0.251` 上的 `5353` 埠就可以收到 mDNS 的封包，剛開始我們可能會覺得像這樣實作應該就可以了。

```ruby
require 'socket'

socket = UDPSocket.new
socket.bind('224.0.0.251', 5353)
```

不過馬上就會得到 `Errno::EADDRINUSE (Address already in use - bind(2) for "224.0.0.251" port 5353)` 這樣的錯誤訊息，所以我們需要對這個 UDPSocket 做一些設定，讓他以「加入 Multicast 群組成員」的形式運作。

```ruby
membership = IPAddr.new('224.0.0.251').hton + IPAddr.new('0.0.0.0').hton
socket = UDPSocket.new

socket.setsockopt(:IPPROTO_IP, :IP_ADD_MEMBERSHIP, membership)
socket.setsockopt(:SOL_SOCKET, :SO_REUSEPORT, 1)

socket.bind('0.0.0.0', 5353)
```

上述的程式碼簡單來說做了這幾件事情：

1. 設定 Socket 要加入 `224.0.0.251` 作為成員
2. 設定 Socket 允許重複使用 5353 這個 Port

設定 5353 Port 可以被重複使用是因為在這個裝置上可能還有其他服務存在，他也會需要關注 mDNS 或者做出廣播，所以我們可能會跟其他人共用這個 Port。

而加入 `224.0.0.251` 成員就相對不容易理解了，對沒學過網路相關知識的人來說還真的不太好好懂（所以特地查了一下資料）

我們先看 `setsockopt` 在 Ruby 原始碼做了什麼，才會知道上面這段的意思。

```c
# 略
if (setsockopt(fptr->fd, level, option, v, vlen) < 0)
        rsock_sys_fail_path("setsockopt(2)", fptr->pathv);

    return INT2FIX(0);
```

在實作上 Ruby 會直接去呼叫 C API 來做這件事情，而 `level`, `option`, `v` 就是我們從 Ruby 傳入的數值。

接下來再看看我查到的 `IP_ADDD_MEMBERSHIP` 的 C API [使用說明](https://www.tldp.org/HOWTO/Multicast-HOWTO-6.html)（嚴格上來說是 Multicast 的說明）

```c
struct ip_mreq
{
        struct in_addr imr_multiaddr;   /* IP multicast address of group */
        struct in_addr imr_interface;   /* local IP address of interface */
};
```

```c
setsockopt (socket, IPPROTO_IP, IP_ADD_MEMBERSHIP, &mreq, sizeof(mreq));
```

實際上跟 Ruby 的版本幾乎沒有差別，最主要的是 `ip_mreq` 是一個資料結構，我們要怎樣才能夠正確的傳遞進去呢？

先看看 `IPAddr.new('224.0.0.251').hton` 執行後會得到什麼？

```bash
irb(main):003:0> IPAddr.new('224.0.0.251').hton
=> "\xE0\x00\x00\xFB"
```

那麼跟 `0.0.0.0` 的 `IPAddr#hton` 相加之後，因為是字串所以會變成像這樣

```bash
irb(main):004:0> IPAddr.new('224.0.0.251').hton + IPAddr.new('0.0.0.0').hton
=> "\xE0\x00\x00\xFB\x00\x00\x00\x00"
```

我們再回去看 Ruby 在 `setsockopt` 實作中，遇到 `String` 時，會怎樣處理

```c
char *v;

# 略

    switch (TYPE(val)) {
      # 略
      default:
        StringValue(val);
        v = RSTRING_PTR(val);
        vlen = RSTRING_SOCKLEN(val);
        break;
    }
    
# C API 呼叫處
```

簡單說就是直接弄成一段 `char` 陣列，基本上我們在 C 裡面只要大小一樣直接對到結構上基本上是會運作的，於是我們就很自然的利用 Ruby 的字串變成一個在 C 裡面的 `ip_mreq` 資料結構，順利的傳遞進去了。

至於 `#hton` 是什麼呢？他是 `Host Byte Order to Network Byte Order` 的縮寫，簡單說在處理網路封包的時候需要知道 IP 位置，所以有一個特殊的格式，但是因為作業系統差異，存位置的規格可能有差異，所以送到網路上時會統一轉成網路用的位元順序。

總而言之，我們目前可以順利的接收到來自 mDNS 的廣播封包拉！

## 解析封包

首先，我們先把上面的程式碼簡單重構成下面這樣的結構

```ruby
require 'socket'
require 'resolv'
require 'awesome_print'

MDNS_PORT = 5353
MDNS_ADDRESS = '224.0.0.251'.freeze
BIND_ADDRESS = '0.0.0.0'.freeze

M_MEMBERSHIP = IPAddr.new(MDNS_ADDRESS).hton + IPAddr.new(BIND_ADDRESS).hton

# :nodoc:
class MDNS
  include Enumerable

  def initialize
    @socket = UDPSocket.new
    @socket.setsockopt(:IPPROTO_IP, :IP_ADD_MEMBERSHIP, M_MEMBERSHIP)
    @socket.setsockopt(:SOL_SOCKET, :SO_REUSEPORT, 1)
    @socket.bind(BIND_ADDRESS, MDNS_PORT)
  end

  def each(&_block)
    loop do
      yield @socket.recvfrom(4096)
    end
  end
end

mdns = MDNS.new
mdns.each do |packet|
  ap packet
end
```

執行之後，稍微等待一段時間就可以收到類似像這樣的封包資訊

```ruby
[
    [0] "\x00\x00\x84\x00\x00\x00\x00\x02\x00\x00\x00\x01\aAndroid\x05local\x00\x00\x01\x80\x01\x00\x00\x00x\x00\x04\xAC\x1F\x01\xC0\xC0\f\x00\x1C\x80\x01\x00\x00\x00x\x00\x10\xFE\x80\x00\x00\x00\x00\x00\x00\xAEc\xBE\xFF\xFE\xC21;\xC0\f\x00/\x80\x01\x00\x00\x00x\x00\b\xC0\f\x00\x04@\x00\x00\b",
    [1] [
        [0] "AF_INET",
        [1] 5353,
        [2] "172.31.1.192",
        [3] "172.31.1.192"
    ]
]
```

那麼我們該如何解析呢？因為封包內容其實就是 DNS 查詢（或者回應）所以我們只需要透過 `Resolv::DNS::Message` 的 `#decode` 去解析就可以知道內容了！

> 比較痛苦的大概是 `Resolv::DNS` 本身是 Class 所以無法用 `include` 進來使用，要打很長 Class Name XD

我們稍微調整讀取封包的程式，改成這個樣子

```ruby
mdns = MDNS.new
mdns.each do |packet, _addr|
  ap Resolv::DNS::Message.decode(packet)
end
```

執行後就可以看到 `Resolv::DNS::Message` 物件被產生，然後裡面包含了各種類型的 DNS 查詢。

```ruby
#<Resolv::DNS::Message:0x00007ff3dc0b8420 @id=0, @qr=0, @opcode=0, @aa=0, @tc=0, @rd=0, @ra=0, @rcode=0, @question=[[#<Resolv::DNS::Name: _airplay._tcp.local.>, Resolv::DNS::Resource::Generic::Type12_Class32769]], @answer=[[#<Resolv::DNS::Name: _airplay._tcp.local.>, 4487, #<Resolv::DNS::Resource::IN::PTR:0x00007ff3de822790 @name=#<Resolv::DNS::Name: \xE8\x87\xA5\xE5\xAE\xA4._airplay._tcp.local.>, @ttl=4487>]], @authority=[], @additional=[]>
#<Resolv::DNS::Message:0x00007ff3de820ff8 @id=0, @qr=0, @opcode=0, @aa=0, @tc=0, @rd=0, @ra=0, @rcode=0, @question=[[#<Resolv::DNS::Name: _airplay._tcp.local.>, Resolv::DNS::Resource::IN::PTR]], @answer=[[#<Resolv::DNS::Name: _airplay._tcp.local.>, 4486, #<Resolv::DNS::Resource::IN::PTR:0x00007ff3dc0e3198 @name=#<Resolv::DNS::Name: \xE8\x87\xA5\xE5\xAE\xA4._airplay._tcp.local.>, @ttl=4486>]], @authority=[], @additional=[]>
```

不過有些是查詢，有些則是回應，我們先把回應區分出來。

```ruby
mdns = MDNS.new
mdns.each do |packet, _addr|
  message = Resolv::DNS::Message.decode(packet)
  next if message.qr.zero?

  ap message
end
```

在 `Resolve::DNS::Message` 物件上有一個叫做 `qr` 的屬性，當他是 0 的時候表示這是一個「查詢」而 1 的時候，就是回應，所以只需要排除是 0 的訊息。

## 根據 DNS-SD 篩選出 Airplay / Chromecast 裝置

首先我們要先搞懂幾個 DNS-SD 的規則，才能夠找到我們希望找到的資訊。

1. DNS-SD 的 FQDN 結構
2. DNS-SD 會使用的 Record

關於 FQDN 結構，我們會看到三種

1. < Service >.< Domain >
2. < Instance >.< Service >.< Domain >
3. < Hostname >

扣掉第三種不算，因為他就是 Host Name 之外，以 Airplay 裝置會這樣表示

```
_airplay._tcp_.local
```

基本上在區網使用 `.local` 是必然的，然後 `_tcp` 暴露出了他是透過 TCP 連線，而 `_airplay` 就是這個服務的類型。

以我的房間為例，我有一台 Sonos One 音響叫做「臥室」那在 mDNS 中就可以查到 `臥室._airplay._tcp.local` 這個 DNS 紀錄。

至於會用到的 DNS Record 則有四種

1. PTR (Pointer Record)
2. SRV (Service Record)
3. A (Address Record)
4. TXT (Text Record)

簡單說 PTR 是一個指標，他會回應一個 Instance 給我們，讓我們知道該去問誰要這個 Service 的資訊，而 SRV / TXT 則提供了這個 Service 的 Port & Hostname 資訊，以及一些 Metadata 讓我們可以了解這個服務。

最後 A (or AAAA) 則會在我們詢問 Hostname 時回應區網的 IP 位置，讓我們知道該連到哪裡。

> 這個機制看起來很聰明，有興趣的話可以參考 Spotify 的 [DNS-SD](https://labs.spotify.com/2017/03/31/spotifys-lovehate-relationship-with-dns/) 文章，跟這個其實很像。

所以整體流程會變成像這樣

1. 詢問 `PTR _airplay._tcp.local` 獲得 `_airplar._tcp.local PTR 臥室._airplay_.tcp.local` 的回答
2. 詢問 `SRV 臥室._airplay_.tcp.local` 獲得 `臥室._airplay_.tcp.local SRV 0 0 7000 Sonos-0xAF.local` 的回答
3. 詢問 `A Sonos-0xAF.local` 獲得 `Sonos-0xAF.local A 172.31.1.166` 的回答

基於這些情報，我們可以彙整出：

1. 有一個裝置叫做「臥室」
2. IP 位置是 `172.31.1.166`
3. 使用 7000 Port 可以和他建立連線

那麼，我們稍微調整一下程式碼讓我們可以拿到 PTR 來顯示詳細資訊。

> DNS-SD 的 [RFC6763](https://tools.ietf.org/html/rfc6763) 提到回應 PTR 時要把 SRV / TXT / A 都一起回覆，理論上我們是不太需要重複詢問 SRV / TXT / A 的，不過因為除了 PTR 會把 TTL 設定的比較長，其他都會設定為短時間，好在一段時間後確認 IP 是否有變動之類的。

我們先稍微重構一下，讓 `MDNS` 可以指篩選出我們有興趣的 PTR Record 回應給我們。

```ruby
# :nodoc:
class MDNS
  include Enumerable

  # 略

  def listen
    return if @thread

    @thread = Thread.new do
      loop do
        packet, = @socket.recvfrom(4096)
        reply = Resolv::DNS::Message.decode(packet)
        next if reply.qr.zero?
        next if ptr?(reply)

        @replies << reply
      end
    end
  end

  def each(&_block)
    loop do
      yield @replies.shift until @replies.empty?
      sleep 1
    end
  end

  private

  def ptr?(reply)
    reply.answer.reduce(true) do |prev, (_, _, data)|
      prev & data.is_a?(Resolv::DNS::Resource::IN::PTR)
    end
  end
end

mdns = MDNS.new
mdns.listen
mdns.each do |reply|
  reply.each_answer do |name, _, _|
    ap name
  end
end
```

執行後會獲得類似這樣的的訊息，因為 PTR 回應的是 Instance Name 所以是預期的結果。

```
#<Resolv::DNS::Name: 臥室._airplay._tcp.local.>
#<Resolv::DNS::Name: Sonos-7828CAC4542C.local.>
#<Resolv::DNS::Name: 7828CAC4542C@臥室._raop._tcp.local.>
```

如此一來，我們只要稍加修改就可以篩選出是提供 Airplay / Chromecast 的裝置。

```ruby
# Airplay 有兩種
airplay = Resolv::DNS::Name.create('_airplay._tcp.local.')
raop = Resolv::DNS::Name.create('_raop._tcp.local.')
# Chromecast
chromecast = Resolv::DNS::Name.create('_googlecast._tcp.local.)

mdns.each do |reply|
  reply.each_answer do |name, _, _|
    next unless name.subdomain_of?(airplay)
    next unless name.subdomain_of?(raop)
    next unless name.subdomain_of?(chromecast)
    
    ap name
  end
end
```

> 另外我們可以透過 `reply.each_addationial` 獲取更多資訊，不過可惜的是 `Resolv::DNS::Message` 在解析時可能因為某些關係只能知道他是 `PTR` 但是無法正確解析，就會獲得 `Generic::Type12_XXXX` 這種類型的物件，反而不好處理。

## 小結

在做這個技術測試的時候，發現蠻多情境下大家都是串 C API 然後去呼叫作業系統提供的 DNS-SD 機制來實作，不過在了解原理的狀況下，其實我們還是可以靠純 Ruby 的方式實現一定程度的 DNS-SD 機制。

那麼，這個技術有什麼用途嗎？在五倍的 IoT 專案 [Tamashii](https://tamashii.io) 當時因為裝置很多的關係，我們就有研究過透過 DNS-SD 去找到區網內的裝置，然後讓他能夠一次性的套用或者修改設定，不過礙於各種因素就暫時沒有把他實作出來。

這次重新審視之後發現其實還是非常有用的，近期應該會更新一個在 Tamashii 專案下可以使用的 DNS-SD Gem 吧！

> 礙於篇幅，其實還有下篇 - 偽裝成 Airplay 裝置的系列，不過就先到這裡告一段落吧！
