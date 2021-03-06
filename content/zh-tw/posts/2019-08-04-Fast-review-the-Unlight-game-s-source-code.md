---
title: 快速閱讀頁遊 Unlight 開源後的原始碼
publishDate: 2019-08-04 18:44:09
tags: [Ruby, Unlight, Game, ActionScript, 筆記]
thumbnail: https://blog.frost.tw/images/2019-08-04-fast-review-the-unlight-game-source-code/thumbnail.png
---

最近一款有點年紀的頁遊 [Unlight](https://zh.wikipedia.org/zh-tw/Unlight) 在停止營運後幾年，突然公佈說要開放原始碼跟圖片素材。

這款遊戲嚴格說起來並沒有像我們熟悉的端遊、手遊之類的那樣華麗，但是非常有特色的人物設計跟對戰系統倒是讓很多玩家即使在好幾年後仍然在期待他能復活。

作為一個曾經的玩家，其實也是非常期待的，不過這次的開放原始碼路線大概是復活無望。不過從這幾天公開的資料來看，圖片、音效到客戶端和伺服端都公開的狀況下，還是很有希望被熱血的玩家復活的。

另一方面，既然伺服器是透過 Ruby 撰寫的，身為使用 Ruby 的開發者在遊戲類應用不常見的狀況下，能可以作為學習素材肯定是要看過一遍的。

<!--more-->

## 概觀

大概是在七月底的時候 Unlight 的 [官網](https://unlight-world.com) 突然復活，並且出現了一些開放素材的資訊。大約在昨天半夜（8/3 ~ 8/4）有人貼出了 [Unlight 的 GitHub](https://github.com/unlightcpa) 就此大家就開始期待是否有人能夠將他重建出來。

開始使用之前，需要先確認授權的形式。

* 原始碼 - MIT 授權
* 素材（圖片、音樂）- CC BY-ND 4.0

以原始碼來說基本上算是可以自由使用跟修改，算是很寬鬆的條款。而圖片素材部分則是需要註明作者，主要受限的地方是「禁止改作」的部分，因為目前釋出的檔案大多以 SWF 為主（裡面含有一些動畫檔案）所以如果想要抽取出圖片後修改為適合手遊、HTML5 的應用時，是否不會跟授權牴觸就是需要注意的部分。

## 架構、語言

原始碼部分包含了 [ActionScript 3.0](https://zh.wikipedia.org/zh-tw/ActionScript) 和 [Ruby](https://www.ruby-lang.org/zh_tw/) 兩個部分，AS3 的部分主要是用於客戶端，而 Ruby 則是提供伺服器。 

> 考慮到 Unlight 的時代背景，採用 Flash + Ruby 的方式其實跟目前大家熟悉的 HTML5 頁遊是比較不一樣的，他比較接近於端遊的類型在伺服器和客戶端之間溝通，網頁部分可以視為下載客戶端的載體。

客戶端部分目前推測「缺少非常多檔案」因為看起來有使用一些第三方的套件，官方也沒有提供任何文件說明，所以看起來是暫時無法「產出客戶端」的情況。而伺服端就看起來比較容易設定起來，至少有 `Gemfile` 描述了需要安裝的 Ruby 套件，可以輕鬆的設定起來。

## 客戶端

目前從 `app/client` 目錄下看到的資訊來看，是一些原始的 ActionScript 原始碼，但是假設要編譯的話基本上會需要透過像是 [Flash Builder](https://zh.wikipedia.org/zh-tw/Adobe_Flash_Builder) 或者 [Flex SDK](https://www.adobe.com/devnet/flex/flex-sdk-download.html) 來做編譯，但是前者目前基本上是無法正常取得（可以透過 Creative Cloud 的知識庫找到載點）後者雖然可以取得，但是只能編譯單個 ActionScript 檔案。

但是目錄下目前並沒有關於如何編譯的說明，唯一知道的是在 GitHub 上的 [Issue](https://github.com/unlightcpa/Unlight/issues/2)（推測是原作者）表示無法在比較新版的 Flex 編譯，不過實際上要怎麼編譯還是未知的。

> 我在我自己的 macOS 上安裝了 Flash Builder 但是 Java 版本已經過新無法啟動，網路上提供的手動指定 JVM 路徑的方式也無法正常開啟，網路上有一個說法是透過 Flash Builder 打開專案之後就能夠自動編譯。

另外一個疑點是 Client 端裡面的檔案，像是 `Config.as` 或者 `News.as` 這類檔案，都可以看到讀取某些 XML 設定檔的資訊，像是下面這段節錄。

```actionscript
    public class Config extends XMLData
    {
        private static const _TRANS_CONFIG_URL	:String = "/public/config.xml";
        private static const __URL:String = _TRANS_CONFIG_URL
        private static const __VERSION:String = "multi_servers_111003"

```

這些檔案我們都會看到像是 `import flash.net.URLRequest;` 的片段，明顯是用來抓取某些資料的，不過目前卻不知道這些 XML 資料需要提供哪些資訊，以及似乎沒有實際呼叫的地方，表示可能有一些行為是還未完善的。

> 在寫這篇文章時發現是從 `XMLData` 繼承來的，不過即使能夠呼叫並讀取設定檔等資訊，實際上要怎麼運行還是個問題。

另一方面是在伺服器端（待會會提到）的地方有設計一個加密機制，玩家跟伺服器交換資料的時候是會經過加密的（保護及防止作弊）而實際上玩家的每一個動作都會被轉會成 Command（指令）的概念去跟伺服器互動，但是目前在客戶端裡面找不到任何編碼指令的程式碼。

> 前面提到 Unlight 比較類似傳統端遊的做法是因為他不是透過 HTTP 請求（網頁）的方式連線，而是直接透過 TCP 連線對伺服器連線後互動，考慮這種方式在 Flash 遊戲還盛行的時期，還算是合理且常見的作法。

另外就是客戶端理論上要有讀取前面素材包裡面的 SWF 檔案的片段，目前看起來也暫時還沒有發現是在哪裡定義的（也可能是透過使用的外部套件）

### 伺服端

這部分算是我比較熟悉的部分，目前工作大部分時間都是使用 Ruby 來開發，所以把它跑起來算是相對客戶端輕鬆的。

先看 `Gemfile` 這個檔案，我們可以大概知道他使用了哪些技術（從目錄結構上可以馬上判斷出不是採用 Ruby on Rails 開發的）

```ruby
source :rubygems
gem 'dalli', '~>2.0.2'
gem 'eventmachine'
gem 'mysql2','~>0.3.7'
gem 'oauth','~>0.4.5'
gem 'RocketAMF','~>0.2.1'
gem 'rspec','~>2.11.0'
gem 'sequel','~>4.0'
gem 'RubyInline','~>3.12.4'
gem 'sqlite3','~>1.3.11'
gem 'daemons'
gem 'gmp'
```

寫法上來說很明顯是相對舊版本的 Ruby 所開發的，不過 Ruby 核心團隊對於「向下相容性」的堅持，我們使用較新的 Ruby 2.6.3 都還是能正常使用。

裡面大概可以看出來使用了 Memcached / MySQL / OAuth 等技術，實際上用的第三方套件不多，這點我個人就蠻佩服日本的遊戲開發者，他們在這類技術上都是很扎實的一點一點製作出來。

> 不過以比較商業的角度上來看，善用套件是很有用的，有不少日本手遊公司都是使用 Ruby on Rails 來開發。不過礙於遊戲相關的程式碼在技術圈是相對封閉的，所以很多時候都會依賴很多電腦科學的基礎知識來架構出遊戲。

因為是快速導讀，所以就不贅述這些套件的應用。從 `Gemfile` 我們是可以大致上看出來使用的資料庫、優化技術跟串些的應用（Ex. OAuth 大概是跟當年跑在 Facebook 上用來串接的機制有關）

接下來看一下目錄結構

* `bin/` - 各種啟動伺服器的指令
* `data/` - 遊戲的資料（伺服器的紀錄檔也會在這）
* `db/` - 空的，根據原始碼的說明使用 `csv` 模式當資料庫會放在這
* `lib/` - 空的，專案中有一些計算是利用 C 輔助的，他會在執行時產生一些 C 相關的檔案置入
* `script/` -  一些輔助腳本，像是匯入遊戲資料（Ex. 道具、角色素質等）
* `src/` - 伺服器的本體

一般來說我會先找可以描述整個資料結構的目錄看，所以先稍微看了一下 `data/` 和 `src/model` 兩個目錄，裡面大致上就是描述了 Unlight 這款遊戲是怎樣做數值設定跟紀錄玩家的操作，根據我工作的經驗設計的好壞其實很大的影響整個系統的穩定和維護，另外最重要的是這是最快可以大致瞭解作者想法的方式。

## 目錄：bin/

裡面看起來很多檔案，但是不要被嚇到，大部分的檔案機制都是類似的。會這樣設定可能是方便在不同伺服器上面開設不同的服務，或者做簡易的分流用的。

> 印象中當時停止營運的時候我有用當時負責的客戶（手遊公司）的營運花費，用等比例的方式推算 Unlight 的遊戲規模，大概推算是一個月營運大概會是花費 100 ~ 200 萬台幣左右，這個目錄下大概有 100 個檔案左右，假設每個檔案都是獨立一台伺服器我們用 [Amazon AWS](https://aws.amazon.com/tw/) 上面的雲端伺服器數字非常不精確的推算一下，用一般正式伺服器可能會選用的 m 系列機器的 m4.large 規格，大概會花到 20 萬左用（[試算](https://calculator.s3.amazonaws.com/index.html?nc2=h_ql_pr#r=NRT&s=EC2&key=files/calc-8d0494a1ee2ae3d0f1a990397358bd3f1e581769&v=ver20190731tO)）這可能還不包過資料庫、當時的伺服器單價相對高等問題，加上人事跟營運成本，一個月營運的花費確實有機會接近到 100 萬台幣。

那麼這些檔案內容是怎樣的，我們用登入伺服器（`authserver`）這個檔案看看。

```ruby
#!/usr/local/bin/ruby
# -*- coding: utf-8 -*-
require 'rubygems'
require 'daemons'
  options = { 
    :app_name   => "ul_authserver",
    :dir_mode   => :normal,
    :dir        => 'pids',
    :backtrace  => true,
#     :monitor    => true,
    :log_output    => true
}
f =  File.join(File.expand_path(__FILE__).gsub!("/bin/authserver",""), "/src")
Dir.chdir(File.join(File.expand_path(__FILE__).gsub!("authserver","")))
Daemons.run("#{f}/authentication.rb",options)
```

基本上結構的規則都是差不多的，提供這個伺服器的基本設定，然後用 `Daemons` 這個套件把伺服器啟動（常駐執行）而執行的檔案就是裡面指定的像是 `authentication.rb` 這些檔案，等一下我們會再討論 `src/` 目錄時一起看。

## 目錄：script/

我們把非程式的部分跳過，因為那些都是一些數據資料，雖然人類直接閱讀會有點吃力。但是習慣之後還是能閱讀的部分，大多數遊戲公司的企劃應該都有能力閱讀和修改。

這部分主要是維運需要的的腳本，因為比較雜亂就不特別討論，我們稍微看一下 `import_csv_data.rb` 這個檔案，假設我們想要將遊戲設定起來，就需要將 `data/` 目錄下面的遊戲資料匯入，就會需要呼叫這個檔案。

```ruby
if `pwd`.chomp == "/home/unlight/svn/trunk/app/server"
  puts "このスクリプトはここで使用してはいけません"
  exit
end
opt = OptionParser.new

$VER_OVERWRITE = false
$VER_NUMBERING = false
$VER_RESTART = false
over_text = "（ドロップモード：すべて捨てて作り直します。時間がかかりますが正確です ）"
opt.on('-n', '--numbering') {|v|
  $VER_NUMBERING = true
  over_text = "（ナンバリングモード：数値で指定されたファイルのみ更新します）"
}
opt.on('-r', '--restart') {|v|
  $VER_RESTART = true
  over_text = "（再開モード：数値で指定されたファイル以降を更新します）"
}

opt.parse!(ARGV)

if $VER_NUMBERING && $VER_RESTART
  puts "Option n, r は同時に指定出来ません。"
  exit
end

$arg = ARGV.shift
puts "serverに存在するcsvdataでインポートしますか (sb)"+over_text
$arg = gets.chomp
@m_set = []
LANGUAGE_SET = /_tcn$|_en$|_scn$|_kr$|_fr$|_ina$|_thai$/
MESSAGES={ "sb" => "SandBox"}
DATABASES={
  "192.168.1.14:5001"=>"SandBox",
}
```

前面這段主要只是一些讀取匯入設定相關的資訊，我在試跑的時候遇到的問題其實是說明跟描述都不太明確，反而沒有搞懂操作，之後詳細閱讀之後再細看。

```ruby
def csv_import(dir, local)

  Find.find('./data/csv') do |f|
    next if File.directory?(f)
  # ...
```

這段就是匯入的本體，會將檔案找出來後匯入，基本上匯入程式大多大同小異就是了⋯⋯

> `script/` 目錄下的東西大多很雜，其實也不會試運行伺服器馬上會需要的部分，實際上可以先略過，除了匯入資料的部分。不過經過測試發現過程中會呼叫某個方法，而這個方法目前是找不到的，這也表示有可能除了匯入會失敗之外，遊戲運行在某些情況下也會失敗。

## 目錄：src/

這個目錄下還有不少資料夾，我們可以稍微看一下

* `constants/` - 遊戲中的常數，也就是一些固定的數值（Ex. 新手任務的編號）
* `controller/` - 遊戲的控制器，目前還不確定用途，不過主要是跟玩家操作有關（Ex. 發送聊天訊息）
* `model/` - 遊戲資料的處理程式，用來讀取玩家、怪物等資料，以及數值的更新（Ex. 等級提升）
* `net/` - 伺服器跟客戶端溝通的機制，基本上只是處理一段加密的操作
* `protocol/` - 伺服器的本體，裡面定義了各種類型的伺服器 Ex. 登入伺服器、戰鬥伺服器等
* `rule/` - 遊戲的規則，基本上是描述一些像是 AI、抽卡的機制

基本上蠻多檔案內容都蠻多的，這邊只簡單介紹伺服器啟動的部分（目前有讀的部分）

基本上不管是哪種伺服器，都會繼承 `Unlight` 這個物件（`src/protocol/unlight.rb`）

```ruby
module Unlight
  module Protocol
    class ULServer < EventMachine::Connection

      # これ以上前に反応していなかった切る
      CONNECT_LIVE_SEC = 3600   # 1時間

      # 何回のコマンドエラーで切断するか
      COMMAND_ERROR_MAX = 3   #

      attr_accessor :player,:last_connect
      # クラスの初期化
```

Unlight 使用的是當時 Ruby 用來做一些連線機制常用的 `EventMachine` 套件，所以會直接繼承 `EventMachine::Connection` 實作，基本上是為了借用 EventMachine 的一些機制。

> 因為筆者本身沒有使用 EventMachine 所以無法太詳細描述，不過以當時的時間點來看，使用 EventMachine 是一個很不錯的選擇，因為能負擔的玩家數量是遠比其他方式更高，而且也更好用。

在 `unlight.rb` 檔案中會看到這段

```ruby
      # データの受信
      def receive_data data
        a = data2command(data)
        @command_list += a unless a.empty?
        do_command
      end
```

簡單說不管是哪種伺服器，在收到資料後會做一個「解碼」的動作將客戶端傳輸的指令（Command）轉換成像是 `[:register, 'xxx@example.com', 'Aotoki']` 的格式，再由不同伺服器（Ex. AuthServer）來處理。

我們在看到 `src/` 目錄下的這些 Ruby 檔案，其實大多是將前面提到的 `EventMachine` 啟動的部分（也就是前面 `bin/` 呼叫的檔案）以「大廳（Lobby）」這個檔案為例子（`src/lobby.rb`）

```ruby
module Unlight
  include Protocol

  port = 12002
  EM.set_descriptor_table_size(10000) # ソケットMaxを設定
  EM.epoll                            # Epollを使用するように設定。
  EM.run do
    LobbyServer.setup
    EM.start_server "0.0.0.0", SV_PORT, LobbyServer
    SERVER_LOG.info("LobbyServer Start: port[#{SV_PORT}]")
    # タイマの制度を上げる
    EM.set_quantum(10)

    # 1分に一回でソケットの生き死にをチェック
    EM::PeriodicTimer.new(60, proc {
                            begin
                              LobbyServer.check_connection
                            rescue =>e
                              SERVER_LOG.fatal("LobbyServer: [check_connection:] fatal error #{e}:#{e.backtrace}")
                            end
                                   })

    if DB_CONNECT_CHECK
      # 7時間に一回でDBとの接続をチェック
      EM::PeriodicTimer.new(60*60*7, proc {
                              begin
                                LobbyServer.check_db_connection
                              rescue =>e
                                SERVER_LOG.fatal("LobbyServer: [check_db_connection:] fatal error #{e}:#{e.backtrace}")
                              end
                            })
    end
  end
end
```

這段就是將 EventMachine 跑起來，然後根據伺服器類型（Ex. LobbyServer）去做呼叫，並且執行對應的任務。

最後我們看一下 `src/net` 下面的檔案，裡面用了一個叫做 [SRP](http://srp.stanford.edu/design.html) 的演算法實作，他會用在登入伺服器的時候加密玩家的登入密碼，而其他一般指令則會用 `crypt.rb` 這個檔案做編碼處理，如果想要保護伺服器的互動避免外掛或者惡意玩家，可以嘗試改變這個檔案的計算機制。

## 運作

大致上看過一輪伺服器跟客戶端之後，我們來總結一下整個伺服器的運作。

* `bin/authserver` => 啟動伺服器，呼叫 `authentication.rb` 等待連線
* `authentication.rb` => 等待連線，有資料的話透過 `AuthServer` 處理
* `AuthServer` => 收到操作後基於指令轉換為方法（一般定義在 Controller 裡面）
* Controller => 根據指令執行動作，可能會呼叫 Model / Rule 協助處理
* `AuthServer` => 發送結果給玩家

> `AuthServer` 因為指令比較少所以沒有定義 Controller 但是像是 LobbyServer 之類的就有定義

到此為止我們大致上對伺服端有一個概念，另外值得一提的是前面在看 `Gemfile` 看到的 `RocketAMF` 套件，似乎可以直接轉換 Ruby 的資料變成 Flash 可以讀取的格式，不過目前還暫時看不出來在哪裡有被使用，也可能是透過指令帶入給客戶端值些呼叫（類似伺服器的行為）

## 後記

雖然是很粗略的掃過一次原始碼，不過大致上對整個伺服器的運作已經有一個大致上的概念。回到現實面來看，以目前公開的資訊想要用現有的檔案去重新建置一個 Unlight 伺服器大概是蠻困難的，但是如果基於目前已知的程式跟運作，重新開發過一套有類似或者改進的系統，應該已經是有可能的。

跟單機遊戲不同的地方是連線遊戲為了保證公平性，需要將遊戲的規則判定都坐在伺服器上面，即使目前看起來不管是伺服端還是客戶端都有缺少部分檔案，但是整體上來說伺服器已經算是最接近完整的部分，至少大部分遊戲的邏輯跟機制都能夠被找到。

九月左右還有鐵人賽，最近應該會評估一下 30 天左右要寫什麼主題，也許基於 Unlight 的伺服器來討論開發遊戲伺服器會是個不錯的題目。
