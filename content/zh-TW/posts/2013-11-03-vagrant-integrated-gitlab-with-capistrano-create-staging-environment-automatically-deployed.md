---
layout: post
title: '用 Vagrant 整合 GitLab 與 Capistrano 做 Staging 環境自動部署'
date: 2013-11-03 01:38
comments: true
tags: [Ruby, Rails, Vagrant, GitLab, 心得, 筆記, Capistrano]
---
<del>這標題超級長的說（崩潰</del>

最近因為有實習生要來，所以把老爸公司設定好 GitLab 和 Gitlba-CI 來作為內部的版本本控制和自動化測試環境。
不過原本規劃的 Staging 環境也是在這檯主機上（當初就很淡定把記憶體和處理器加高，因為我會狂開 VM XD）但是會有 SSH 權限上的問題，原本想利用 Git 的 Hook 之類的來處理，但是感覺似乎不太好。

剛好這次看到 GitLab / GitLab-CI 的介紹文，我又再次嘗試安裝，過程上順利、簡單很多。
不過上次不順利肯定是我把整個環境裝在 NAS 裡面的關係 XDD

從我建好 GitLab / GitLab-CI 到設定 Capistrano 到自動部署，其實花費不少時間，而且有很多「差點忘記」的部分，因此決定來寫一篇文章做筆記！

<!--more-->

以下是我的環境配置（只有一台電腦）

* **Host 主機**  
	GitLab Server / GitLab CI Server
	* **GitLab Runner VM** (一台)
  * **Staging VM** （一台）
  
Runner 因為可能會跑 PHP / Ruby 等其他程式語言，避免污染 Host 主機的環境，所以改為開設 VM 運行。
（Host 主機使用 Ubuntu 13.04 Server 僅安裝 Nginx 和 GitLab / GitLab CI 與所需環境）

以下所有 VM 都是設定 Private 並且以 `10.0.100.100/255.255.255.0` 的規則設定，起始 IP 為 100。

### 安裝 GitLab
[安裝教學](https://Github.com/gitlabhq/gitlabhq/blob/master/doc/install/installation.md)
### 安裝 GitLab CI
[安裝教學](https://Github.com/gitlabhq/gitlab-ci/blob/master/doc/installation.md)

上述這兩者安裝都非常簡單，按照官方的文件 Step by Step 即可。

比較特別的部分是因為 GitLab / GitLab CI 都安裝在同一台主機，要另外修改一下 Nginx 設定檔。

把 GitLab CI 的 Niginx 設定檔中 `listen 80 default_server` 的 `default_server` 刪除，這樣才不會發生錯誤（那是設定預設開啟哪個網站的設定，只能有一個）

### 安裝 GitLab CI Runner
[安裝教學](https://Github.com/gitlabhq/gitlab-ci-runner#installation)

基本上也是按照官方的教學處理即可，不過因為是在 VM 所以要先做以下步驟找出 Host 主機的 IP Address 來設定。

``` shell
# Ubuntu 新版改用 ip addr show，而非 ifconfig 指令
ip addr show
```

找到之後修改 `/etc/hosts` 來追加對應的 hostname 給 VM 辨識（測試過大部分 Vagrant 的 Plugin 都無法自動設定）

``` conf /etc/hosts
127.0.0.1 localhost
# 我的 Host IP 是 10.0.100.1 而 gitlab 和 gitlab-ci 的 nginx 設定的 server_name 如下
10.0.100.1 gitlab.vm ci.gitlab.vm
```

確定完成後就運行 `bundle exec ./bin/setup` 指令設定 Runner 註冊到 CI Server 裡面。

到目前為止，所有設定都是 GitLab 會設定好的。

---

### 安裝 Staging VM

``` shell HOST

Vagrant init
# 修改設定（private_network, hostname 等）
vim Vagrantfile
Vagrant up
Vagrant ssh

```

``` shell StagingVM

# 修改 Mirror (我是習慣改為 mirror://mirrors.ubuntu.com/mirrors.txt 自動抓取)
sudo vim /etc/apt/sources.list
# 更新
sudo apt-get update
sudo apt-get upgrade
# 安裝 RVM / Ruby
\curl -L https://get.rvm.io | bash -s stable
# exit / Vagrant ssh (重新連線，讓 rvm 在 login 時就可用)
#安裝相依
rvm requirements
# 安裝所需的 Ruby 版本 / 設定為預設
rvm install 2.0.0
rvm use 2.0.0 --default
# 安裝 JavaScript Runtime (NodeJS)
# 版本太就可以自己編譯，不要用 nvm 會找不到
sudo apt-get install nodejs
# 安裝 Bundler
gem install bundler
# 更新 Rake 到最新版本 or 指定版本
# Capistrano 跑 Rails Migration 的時候不會加上 bundle exec 會讓你的 deploy 被中斷
gem update rake
# 安裝其他運行伺服器所需的套件
```

接下來要設定 Staging VM 可以 Clone 要 Deploy 的網站。

``` conf /etc/hosts
127.0.0.1 localhost
# 和前面設定 Runner 一樣，讓 VM 認出 Host 上面的 GitLab
10.0.100.1 gitlab.vm ci.gitlab.vm
```

接著產生一組 SSH Key 給 GitLab 辨識（如果是 Public Project 基本上不需要）
```
ssh-keygen -t rsa
# 複製 id_rsa.pub 的內容貼到 GitLab 的 Deploy Key 裡面
cat ~/.ssh/id_rsa.pub 
```

然後切回 Runner 把他的 Public Key 也複製起來，切到 Staging VM 加入 Authorized Keys 裡面讓 Runner 可以直接 SSH 連到 Staging VM 裡面。

``` shell GitLab CI Runner
cat ~/.ssh/id_rsa.pub
```

``` shell Staging VM
echo "ssh-rsa ......" > ~/.ssh/authorized_keys
```

記得測試 Runner 是可以正常連上 Staging VM 的狀態～

### 設定 Capistrano

先在 Gemfile 加入所需的檔案（有使用 rvm 就得加入 rvm 這個項目）
``` Ruby Gemfile
group :development do
	gem 'capistrano'
  gem 'capistrano-Rails'
  gem 'capistrano-rvm'
  gem 'capistrano-bundler'
end
```

```
# 安裝 capistrano 套件
bundle install
# 產生設定檔
cap install
```

先修改 Capfile 來把所需的 bundler / rvm 等都 require 進來。
（目前的版本會都幫你列好，只要 Gemfile 有確定加好，解除註解就會正常了～）

``` Ruby Capfile
# Load DSL and Setup Up Stages
require 'capistrano/setup'

# Includes default deployment tasks
require 'capistrano/deploy'

# Includes tasks from other gems included in your Gemfile
#
# For documentation on these, see for example:
#
#   https://Github.com/capistrano/rvm
#   https://Github.com/capistrano/rbenv
#   https://Github.com/capistrano/chRuby
#   https://Github.com/capistrano/bundler
#   https://Github.com/capistrano/Rails/tree/master/assets
#   https://Github.com/capistrano/Rails/tree/master/migrations
#
require 'capistrano/rvm'
# require 'capistrano/rbenv'
# require 'capistrano/chRuby'
require 'capistrano/bundler'
# require 'capistrano/Rails/assets'
require 'capistrano/Rails/migrations'

# Loads custom tasks from `lib/capistrano/tasks' if you have any defined.
Dir.glob('lib/capistrano/tasks/*.cap').each { |r| import r }
```

然後修改 `config/deploy/staging.rb` 設定 SSH 連線資訊

``` Ruby config/deploy/staging.rb
server '10.0.100.102', user: 'Vagrant', roles: %w{web app}

set :ssh_options, {
  keys: %w(/home/Vagrant/.ssh/id_rsa),
  forward_agent: false,
  auth_methods: %w(publickey)
}
```

我這邊是直接設定 IP Address 如果你有在 `/etc/hosts` 加入對應的 Hostname 可以改用 Hostname 比較漂亮。
（Roles 部分我還沒搞懂，有高人請指點一下。基本上我也是把 example.com 一起換成 IP 就是了⋯⋯）

然後修改一下 `config/deploy.rb` 的設定（依照你的情況）

``` Ruby config/deploy.rb
# 設定 Branch 為這次 Push 的 Branch / Commit
branch = 'staging'
branch = ENV['CI_BUILD_REF'] if ENV['CI_BUILD_REF']

set :branch, branch
```

這邊用的 CI_BUILD_REF 是 GitLab CI 提供的環境變數，可以用輔助來決定是 Deploy 最新的 Commit 還是某個 Branch 上的最新 Commit （CI_BUILD_REF_NAME + CI_BUILD_REF）這部分可以研究 GitLab CI 的文件來調整。

完成之後就是開 Repoistory 然後設定好 GitLab / GitLab CI 的 Server 設定，接著修改 GitLab CI 要跑的 Script 就完成了！

參考用的 Script 語法
``` shell scripts
bundle install
bundle exec rake db:create RAILS_ENV=test
bundle exec rake db:migrate RAILS_ENV=test
bundle exec rake spec RAILS_ENV=test
cap staging deploy
```

假設 Rspec 測試沒過，就不會 Deploy 還算不錯，有興趣的可以另外寫成 Shell Script 或者其他東西做更加智慧的判斷 XDD

