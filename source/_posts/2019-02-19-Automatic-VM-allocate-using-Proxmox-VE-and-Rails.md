---
title: Rails 串接 ProxmoxVE API 自動化教學用虛擬機分配
date: 2019-02-19 19:41:59
tags: [Ruby, Proxmox VE, 虛擬化, Rails]
thumbnail: https://blog.frost.tw/images/2019-02-19-automatic-vm-allocate-using-proxmox-ve-and-rails/thumbnail.jpg
---

之前有一段時間因為用 KVM 手動管理[五倍](https://5xruby.tw)的虛擬機花上不少時間，評估之後我們就調整成 ProxmoxVE 來管理，至少在大多數的情況有 GUI 是很方便的。

不過使用的權限還是限制在有權限管理機器的人身上，最近剛好有不少新同事加入，想讓他們練習部署伺服器。

所以就有了這樣的問題：

**可以讓同事自己申請虛擬機來練習嗎？**

<!-- more -->

其實算是很簡單的，只要會最基本的 Ruby 就能夠把這些東西串起來。不過因為有一些非同步操作，所以我們會需要把一些「觀念」放下，才可以在快速打造原型的時候用最簡單的方式呈現。

開始之前先看一下週末大概一天多的快速原型長怎樣

![螢幕快照 2019-02-18 上午12.34.25.png](https://blog.frost.tw/images/2019-02-19-automatic-vm-allocate-using-proxmox-ve-and-rails/B1C5927BAA75A6CBB07D220E20B5E687.png)

> ProxmoxVE 的 Rollback 機制似乎連選項都會 Rollback 所以正在跑那台又被改回去原本設定的名字了⋯⋯

![螢幕快照 2019-02-18 上午12.34.37.png](https://blog.frost.tw/images/2019-02-19-automatic-vm-allocate-using-proxmox-ve-and-rails/6A5F3F8546357A6AC62C7EB32DC5033D.png)

## ProxmoxVE 的 Ticket 機制

我們以往在串接 API 時會很習慣用 API Token 之類的呼叫 API 但是 ProxmoxVE 用了一個有點微妙的方式，就是提供了一個「可以得到 Cookie 的 API」讓我們來生成叫做 Ticket 的東西。

簡單說我們要用 Ticket API 用帳號密碼登入，然後拿到一段 Cookie 的數值在需要登入的 API 時一起送過去。

```ruby
require 'net/http'
rquire 'oj'

uri = URI('https://192.168.100.220:8006/api2/json/access/ticket')
req = Net::HTTP::Post.new
req['Content-Type'] = 'application/x-www-form-urlencoded'
req.body = URI.encode_www_form(username: 'xxx@pve', password: 'xxx')

token = {}
Net::HTTP.start(uri.host, uri.port, use_ssl: true) do |http|
  res = http.request(req)

  token = Oj.load(res.body)&.fetch('data', {})
end

puts token['ticket'] # => XXXX
puts token['CSRFPreventionToken'] # => XXX
```

大致上使用方式就是，如果是 GET 請求只要在 Cookie 中帶有回傳的 Ticket 數值即可，如果是 POST 請求的話，還要額外在 Header 加上 CSRFPreventionToken 才行。

> 這邊有幾點要注意跟可以善用：
> 1. 如果你的 ProxmoxVE 跟我們一樣是在內網，你需要讓 Ruby 的 Net::HTTP 不要見證 SSL
> 2. ProxmoxVE 有提供 ACL 的機制，所以我先針對可以用的機器開了專用的群組分配了足夠的權限，避免影響其他人

## 呼叫其他 API

可以順利取得 Token 後，就可以參考[官方的文件](https://pve.proxmox.com/pve-docs/api-viewer/index.html)來實作各類的 API 雖然有點說明不清楚，但是透過幾次嘗試多少還是堪用的。

為了要可以正常的呼叫，我們需要對 Request 補上 Cookie 資訊：

```ruby
# 略

req = Net::HTTP::Get.new(uri)
req['Cookie'] = "PVEAuthCookie=#{token['ticket']}"

# 略
```

其實很簡單，在 HTTP 請求裡面 `Cookie` Header 表示的是用戶已知的 Cookie 資訊，用來傳給伺服器。而收到回應時 `Set-Cookie` 則是要求用戶更新 Cookie 資訊。

掌握好之後，在寫一些網路爬蟲的時候，就能很簡單的做到模擬登入的效果。

如果是要發送 POST 類型的請求，則是在補上 CSRF 對應的 Header 即可

```ruby
# 略

req = Net::HTTP::Post.new(uri)
req['Cookie'] = "PVEAuthCookie=#{token['ticket']}"
req['CSRFPreventionToken'] = token['CSRFPreventionToken']

# 略
```

礙於篇幅的關係，在這之前我已經簡單封裝好了一個叫做 `Proxmox::API` 來管理 API 請求，以及幾個「假 Model」來封裝成對應的行為，像是上一段提到的 Ticket 變成像這樣

```ruby
Proxmox::API.ticket = Proxmox::Ticket.create('user@pve', 'password')
```

後面的文章會直接用這個封裝過的行為來示範，如果想知道細節的話我們可以在其他文章中再做討論。

## 非同步行為

不過，像是虛擬機的開關機其實都是非同步的行為。

也就是說，像是我做了這樣的呼叫：

```ruby
Proxmox::API.post('nodes/pve/100/status/start')
            .fetch(:data)
# => UPID:pve:00001560:3C9C598C:5C6944F7:qmstart:100:user@pve:
```

> 裡面的 `pve` 是節點的名稱，而 `100` 是虛擬機的編號

會得到一個叫做 UPID 的回傳，而這個回傳數值是表示在 ProxmoxVE 中的某個 Task （任務）我們可以透過兩種 API 來查詢：

1. `cluster/tasks`
2. `nodes/{node}/tasks/{upid}/status`

要注意的是第一種只會得到大概，而且最近（一段時間後會被刪掉）的任務資訊，而第二個需要知道確切的 Node 和 UPID 才能夠拿到。

也就是說，我們想知道「開機」有沒有執行完成，需要做像這樣的設計

```ruby
def task(node, upid)
  Proxmox::API.get("nodes/#{node}/tasks/#{upid}/status")
              .dig(:data, :status)
end

upid = start('pve', '100') # 開機
loop do
  status = task('pve', upid)
  break if status['exitstatus'] == 'OK'
  sleep 1
end

# 開機完成
```

不過這會遇到一個問題，就是「如果錯誤或者沒有結果」那麼我們的程式就會被卡在無限迴圈之中，這樣在 Rails 端就會有一個 HTTP 請求被卡住。

這時候我們可以利用 Ruby 的 `Timeout` 機制

```ruby
require 'timeout'

# 略
Timeout::timeout(30) do
 loop do
   # 略
 end
end
# 略
```

如此一來，假設執行超過 30 秒，就會因為收到 `Timeout::Error` 的超時錯誤，強制終止這段程式。

> 超時之後可以再對機器下過像是 `stop` 之類的指令關機，避免佔用資源

## 自動還原

ProxmoxVE 裡面提供了 Backup 和 Snapshot 兩種備份方式，不過 API 只有 Snapshot 可以選用。

要注意的是在製作 Snapshot 之前除了機器要安裝好之外，也要記得將像是 Options 裡面的各項設定都調整好，不然我們會因為在 Rollback 的過程中，讓設定跑回原本的舊設定。

Snapshot 還原的 API 會是像這樣：`nodes/{node}/qemu/{vmid}/snapshot/{name}/rollback`

因為我們是練習用的虛擬機，所以直接在設定好的環境下，製作一個叫做 `initialize_state` 的 Snapshot 統一還原回去就可以了！

> 或者你會想要做更複雜的管理，不過對我們來說這樣就是堪用的。

```ruby
upid = Proxmox::API.post('nodes/pve/qemu/100/snapshot/initialize_state/rollback')
# 等待完成
```

做 Snapshot 的 Rollback 是非同步的（要先關機再把資料寫回去）所以會比開機之類的還要等稍微久一點，不過用跟上一段提到的 `Timeout` 機制就可以做到在還原會繼續動作的設計。

## 自動安裝 SSH Key

另外一個難題是裝好的機器其實誰都 SSH 不進去，對我們來說 VNC 串接似乎也比較麻煩。

還好使用 Qemu 有一個叫做 Qemu Guest Agent 的背景程序，我們可以透過安裝這個程序進行「裡應外合」讓我們可以存取到和操作虛擬機內的部分功能。

因為我們習慣使用 CentOS 所以可以用 YUM 來安裝。

```ruby
sudo yum install qemu-guest-agent
```

重開機後如果在 ProxmoxVE 上看到這樣的訊息，就算是成功了！

![螢幕快照 2019-02-18 上午1.09.10.png](https://blog.frost.tw/images/2019-02-19-automatic-vm-allocate-using-proxmox-ve-and-rails/912F134AB7BBA01EFA083119460302AB.png)

不過，要能自動寫入 SSH Key 還有一個問題，因為 Qemu Guest Agent 雖然提供寫入檔案的功能，但是會受到以下限制：

1. 設定檔預設不開放使用
2. SELinux 會阻止你寫入某些檔案
3. 必須是存在的檔案（至少讀取是）

所以我們要先做幾件事情：

1. 修改 `/etc/sysconfig/qemu-ga` 把 BLACKLIST 註解掉（練習用的機器安全性就放一邊吧！）
2. 修改 `/etc/selinux/config` 把 SELinux 設定成 `disabled` 狀態
3. 產生一個空的 `/root/.ssh/authorized_keys` 檔案

> 要確定 `/root/.ssh` 目錄權限是 700 而 `authorized_keys` 檔案權限是 600 不然 SSH 是會因為權限設定錯誤而無法登入！

前置動作就緒，也重開機讓設定確實生效之後，就可以透過 API 來寫入檔案

```ruby
Proxmox::API
  .post(
    'nodes/pve/qemu/100/agent/file-write',
    file: '/root/.ssh/authorized_keys',
    content: '...'
  )
```

大家可能會好奇 SSH Key 要從哪裡取得？因為五倍有自己的 GitLab 來放各種專案，所以在設計的時候透過 OmniAuth GitLab 直接讓員工登入，然後直接透過 GitLab 的 API 把大家設定的 SSH Key 讀取出來使用。

畢竟大部分的人都會把預設的 SSH Key 當作 Git 用的 Key 一般來說會直接通用。

> 做完之後記得重新設置一次 Snapshot 確保新設定都能在被重設的時候吃到！

## 自動產生乾淨環境

結合以上所有的技巧，我們可以封裝成像是這樣的 Service Object 在使用者點選「使用」的時候初始化這台虛擬機。

以下是真實實作的程式碼：

```ruby
# frozen_string_literal: true

require 'timeout'

class HoldVMService
  attr_reader :vmid, :user

  def initialize(vmid, user)
    @vmid = vmid
    @user = user
  end

  def perform
    # rubocop:disable Style/ColonMethodCall
    Timeout::timeout(30) do
      vm = Proxmox::VM.find(@vmid)
      wait_task vm.reinitialize!
      wait_task vm.start!
      install(vm, @user.keys)
      true
    end
    # rubocop:enable Style/ColonMethodCall
  rescue Timeout::Error
    false
  end

  private

  def wait_task(id)
    # TODO: Use nodes/{node}/tasks/{upid}/status instead pull all tasks
    loop do
      tasks = Proxmox::Task.all
      break if tasks.find { |t| t.upid == id && t.status == 'OK' }
      sleep 0.5
    end
  end

  def install(machine, keys)
    machine.install_authorized_keys(keys)
  rescue Proxmox::API::ServerError
    retry
  end
end
```

因為在看文件時沒仔細看，所以還是用到了 `cluster/tasks` 的方式來讀取 Task 可能會跟文章上面介紹的方式有點出入（直接讀取對應的 UPID 會比這個方式好）

雖然跟文章介紹的有不少出入（像是 `Proxmox::VM` 封裝）但是整體上可以看出來，想要製作一個自動設定好乾淨環境的虛擬機提供同事練習，其實不困難：

1. 安裝並設定好虛擬機
2. 利用迴圈不斷檢查處理狀態
3. 利用 Qemu Guest Agent 寫入檔案設定 SSH Key
4. 開始使用！

## 總結

說好的 Rails 在哪裡？目前其實除了是用 Rails 當基底之外，其實還沒使用到 Rails 的功能。不過後續會加上「限制其他使用者搶走虛擬機」之類的權限管理，就會要靠 Rails 跟資料庫的串接了。

這篇文章只是很簡單、快速的帶過整個在設計跟思考上的過程是怎樣運行的。

實際上是很考驗使用 Ruby 的經驗跟技巧，不過我們身為 Ruby 使用者其實常常因為 Rails 的關係限制住了視野，透過這樣的方式練習用不同的思考方式去做一些看起來不能做的機制或者功能，其實是很有趣的。

尤其是這只是很簡單的 API 串接技巧，最早有這個想法的時候是想要用 `libvirt` 去跟 KVM 的底層互動，不過因為太花時間就先暫時放棄。
