---
title: "GitLab 是如何讓 SSH Server 和 Git 並存而不影響安全性"
publishDate: 2020-06-29T00:43:26+08:00
date: 2020-06-29T00:43:26+08:00
tags: ["Git", "GitLab", "Ruby"]
toc: true
thumbnail: https://blog.frost.tw/images/2020-06-29-how-to-secure-ssh-server-when-gitlab-add-git-user/thumbnail.jpg
credit: 攝影師：Engin Akyurt，連結：Pexels
---

這次第四屆的 [Astro Camp](https://astro.5xruby.tw/) 有學員嘗試做了 GitHub 的架構，也就是能夠在遠端建立 Git 專案並且能夠在本機上傳檔案。

不過在和當助教的同事跟學員聊到 `git` 使用者可以登入伺服器進行任意操作的安全性問題時，在前陣子的一些測試發現實際上我自己的假設（特製的 SSH Server）是有問題的，而這個解決方法實際上也比我們想像的還容易。

<!--more-->

## 可能的解法 {#possible-solution}

因為我以前曾經讀過 GitLab 的部分原始碼，所以大概有個印象猜測是使用一個獨立的 SSH Server 來處理這件事情，透過限制可以執行的動作來達到安全的效果。不過這個假設在最近我登入 [Open Unlight](https://unlight.app) 的 GitLab 伺服器時，發現實際上還是基於 OpenSSH 的。

同事也有提出一些不同的假設，像是將 `git` 設定為 `/usr/sbin/nologin` 之類的，不過這些方法都造成了無法正常使用 Git 相關的操作。

> 在寫這篇文章的時候已經在[掘金](https://juejin.im/post/5cf686b85188253cec305fa7)的文章有分析過，不過裡面提到的東西已經從 Ruby 替換成 Golang 實作，但是並不影響我們繼續進行研究跟討論。

## 相關的推理 {#related-reasoning}

既然發現了 SSH Server 是共用的，那麼肯定在使用者登入的時候有做過一些處理。

大多數情況我們會先去查詢 `/etc/passwd` 來看使用者預設的 Shell 使什麼，而 `git` 的使用者是 `/usr/bin/bash` 也就表示是可以正常登入的，實際上如果被設定為特殊的 Shell 或者 `/usr/sbin/noling` 的話，也會造成我們無法使用 `git` 使用者來進行一些操作，而像是備份之類的操作還是會需要透過 `git` 使用者。

既然不是對使用者的 Bash 進行處理，難道是登入的時候會有什麼特殊處理嗎？依照可能性跟相關的機制，我去檢查了 `~/.ssh/authorized_keys` 這個檔案，然後發現了一些線索。

```bash
# ...
command="/opt/gitlab/embedded/service/gitlab-shell key-10",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty ssh-rsa [SSH-KEY]
```

看到這邊就再次對自己對於 Linux 或者 SA (System Admin) 的熟練不足，原來在 `authorized_keys` 這個檔案是可以指定執行的指令以及能夠使用的特性，透過這樣的方式原本的 `/usr/bin/bash` 就會被替換成 GitLab 特製的 `gitlab-shell` 這個檔案，並且加以限制 `no-` 系列的選項讓透過這把 Key 登入的使用者不能進行各種操作，來防止預期外的操作（像是將某個內部 Port 導向到本機）

> 這邊簡單補充一下，Port Forwarding 我們通常會拿來模擬像是 Ngrok 的功能，不過反過來說我們也可以讓原本隱藏在伺服器不對外的資料庫建立起連線，讓我們能夠在自己的電腦連上，那麼就會有額外的風險出現。

看到這邊基本上已經知道安全性的問題如何解決，不過該如何用 Ruby 來實現這個機制呢？

## 實驗 {#experiment}

這次我是使用我家裡用來測試的伺服器（Proxmox VE）來搭建虛擬環境，大家可以利用 Digital Ocean 或者 Virtual Box 等工具來實驗這件事情。

為了模擬這件事情，我們需要先有一個 Ruby 跟 Git 的環境，再啟動虛擬機之後請先安裝。

```bash
# RHEL
yum install git ruby -y

# Ubuntu
apt install git ruby -y
```

因為是實驗用的，基本上我們不太需要去管 `git` 和 `ruby` 的版本。

> 目前安裝到的 Ruby 大概會是 2.5 基本上是夠新的。

首先我們先產生 `git` 使用者，以及他的家目錄（Home Directory）

```bash
useradd -m -d /opt/git git
```

接下來我們就仿造 GitLab 的方式把我們自己的 SSH Key 加入到 `/opt/git/.ssh/authorized_keys` 裡面，另外別忘記將檔案設定成正確的權限（600）

```bash
sudo su - git
mkdir -p ~/.ssh
chmod 700 ~/.ssh
vim ~/.ssh/authorized_keys
# 插入 command="/opt/git/bin/shell aotoki",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty [YOUR_PUBLIC_KEY]
chmod 600 ~/.ssh/authorized_keys
```

這邊我們做了幾個調整，第一個是將指令的位置設定為 `/opt/git/bin/shell` 來使用等一下我們會自己撰寫的 Ruby 腳本，而 `key-10` 這個則替代成使用者可以存取的目錄，在 GitLab 的設計是會透過 API 去查詢資料庫對應的 SSH Key 來取得使用者，並以此作為基準判斷是否能執行某個動作（Ex. `git pull`）

### Shell 腳本 {#shell-script}

首先先產生 `/opt/git/bin/shell` 這個檔案，並且賦予可以執行的權限。

```bash
mkdir -p ~/bin
touch ~/bin/shell
chmod +x ~/bin/shell
```

接著編輯 `/opt/git/bin/shell` 讓他印出 `Hello World!` 的訊息

```ruby
#!/usr/bin/env ruby

puts "Hello World!"
```

我們可以用 `ssh -T` 指令來實驗，如果我們對 GitHub 或者 GitLab 下這個指令的話，也會得到一串歡迎訊息。

```bash
ssh -T git@[YOUR_SERVER]
```

到這邊為止我們就順利獲取到了自訂的訊息，下一步就是解析怎麼執行 Git 相關的操作，這部分因為參考文章已經有了，所以我們直接利用已知的線索來進行後續的操作。

```bash
#!/usr/bin/env ruby

puts ENV.fetch('SSH_ORIGINAL_COMMAND', 'noop')
```

稍微修改我們的 `shell` 執行檔後，就可以知道現在 SSH 客戶端想執行的指令是什麼，像是我們用

```bash
ssh -T git@[YOUR_SERVER] cat /etc/passwd
```

就會得到 `cat /etc/passwd` 這個指令，這也表示在沒有使用自定義的 Shell 之前，我們可以很簡單地將伺服器的一些重要資訊呈現出來。

### Git 指令實作 {#git-command-implementation}

如果直接使用 `git clone git@[YOUR_SERVER]:dummy/repo` 的話，會發現出現錯誤訊息，這是因為 `git` 在這個階段會透過我們輸出的資訊來抓取資料，如果不是預期的格式就會發生問題。

因此我們只需要稍微調整一下程式，將每次執行 `git` 指令的資訊寫入到 Log 檔裡面即可。

```ruby
#!/usr/bin/env ruby

require 'json'
require 'logger'

logger = Logger.new('/opt/git/shell.log')
logger.info(ENV.to_h.to_json)
```

這樣我們就可以確認到 `git clone` 實際上會嘗試執行怎樣的指令，反推回來後會發現使用的是 `git-upload-pack` 這個指令（前面提到的文章已經有驗證過）

那麼我們就先在 `/opt/git/repos/dummy/repo` 產生一個 Bare Repo 來供我們測試。

```bash
mkdir -p ~/repos/dummy/repo
cd ~/repos/dummy/repo
git init --bare
```

接下來在原本的 `/opt/git/bin/shell` 增加一些處理針對 `git-upload-pack` 來修正指令並且透過 `exec` 直接執行

```ruby
command, *args = ENV.fetch('SSH_ORIGINAL_COMMAND', 'nohup').split(' ')

case command
when 'git-upload-pack'
  path = "#{Dir.pwd}/repos/#{args[0][/'(.+)'/, 1]}"
  exec("git-upload-pack #{path}")
end
```

上面的程式碼做了幾項處理：

1. 將指令拆分出來，後面是執行的參數
2. 利用正規表達式把參數的 `'` 去除
3. 因為參數是路徑，改成絕對路徑設定（否則會找不到）
4. 用 `exec` 方法執行

這次我們再次嘗試 `git clone` 指令就能夠正常抓到這個空的專案，繼續使用同樣的方式測試跟檢驗把對應的指令實作出來。

```ruby
command, path, *args = ENV.fetch('SSH_ORIGINAL_COMMAND', 'nohup').split(' ')
path = "#{Dir.pwd}/repos/#{path[/'(.+)'/, 1]}"

case command
when 'git-upload-pack'
  exec("git-upload-pack #{path}")
when 'git-receive-pack'
  exec("git-receive-pack #{path}")
else
  exit 1
end
```

基本上我們只會使用到 `git-upload-pack` 和 `git-receive-pack` 兩個指令，而且參數都是 `path` 因此稍微改寫了程式碼成為這個樣子，最基本的 Git Push/Pull 操作就能正常運作。

> 在 Ruby 裡面我們可以選用像是 `system` 或者 `exec` 等方法來執行系統指令，不過 `exec` 的特性是會代替現在的正在執行的程序，也就是說我們是在確認可以執行指令後直接轉交給 Git 指令處理，是最容易實作的方式。

### 權限檢查 {#permission-check}

在前面的規劃中，我們希望可以針對該 SSH Key 進行權限檢查，像是參數是 `aotoki` 的狀況下應該只能存取 `aotoki/` 以下的 Repo 而不應該下載到 `dummy/` 的專案，因此我們可以再針對前面的程式碼做簡單的修改，利用 Ruby 的 `start_with?` 方法做簡易的檢查。

```ruby
# ...

command, path, *args = ENV.fetch('SSH_ORIGINAL_COMMAND', 'nohup').split(' ')
exit 1 unless path.start_with?("'#{ARGV[0]}/") # 因為還沒去除雙引號要補上
path = "#{Dir.pwd}/repos/#{path[/'(.+)'/, 1]}"

# ...
```

我們在原本修正路徑的前一行，先針對傳入的 `dummy/repo` 這個參數做檢查，如果是 `aotoki/` 開頭的，表示跟這把 SSH Key 的所有者一致，那麼就會繼續執行。否則我們直接回傳 `1` 的狀態碼結束程式，同時表示在存取的過程中發生了錯誤。

接下來製作一個跟 SSH Key 配套的 Repo 出來，比較看看是否是只能下載 `aotoki/` 而無法下載 `dummy/` 了呢？

```bash
git clone git@[YOUR_SERVER]:dummy/repo
# fatal: Could not read from remote repository.

git clone git@[YOUR_SERVER]:aotoki/repo
# warning: You appear to have cloned an empty repository.
```

## 總結 {#conclusion}

雖然這個知識在大多數情況下可能沒有太多的幫助，不過透過這樣的探討也能讓我們看到在 Linux 上還有許多我們不熟悉的地方。作為網站工程師在前後端可能是很熟練的，不過實際上我們對於 Linux 和系統管理實際上還是受限的，除了增加知識的範圍之外，透過這樣在同個領域不同專業的交流，說不定能設計出更多不一樣的設計。

同理來看，容器技術實際上也是需要同時了解 Linux 和軟體開發才能夠得以實現，很多時候我們並不是單純的使用單一的技術在解決問題，而是基於對不同專業的理解來架構我們所期望的軟體系統。
