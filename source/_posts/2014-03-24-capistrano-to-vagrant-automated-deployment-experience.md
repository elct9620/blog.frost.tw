---
layout: post
title: 'Capistrano to Vagrant 自動部署心得'
date: 2014-03-24 09:32
comments: true
tags: [Ruby, Rails, Vagrant, 心得, 筆記, Capistrano]
---
之前寫過一篇關於 [Vagrant + Capistrano + Gitlab](http://blog.frost.tw/posts/2013/11/03/Vagrant-integrated-gitlab-with-capistrano-create-staging-environment-automatically-deployed) 的自動化部署介紹。

不過當時因為一些問題，卡著沒有繼續完成測試。
最近因為某些原因，需要一個 Nightly-like (不一定會每日更新，取決于 commit) 的環境，所以只好硬著頭皮把全部的問題解決了⋯⋯

<!-- more -->

關於安裝與建制的部分就不多做討論，讓我們直接「切入核心」來討論 `cap deploy` 失敗的主要原因吧！

首先，來看看本次環境的設定（基本上跟上次差不多）

* **Ubuntu 13.10 (Server)**
  * **Gitlab**
  * **Gitlab CI**
  * VMs
  		* **Gitlab CI Runner#1**
	  	* **Nightly Server**
 
那麼，主要會發生問題的部分其實大多是在 CI Runner 跟 Nightly Server 上。
首先，我們要確定兩個環境都有正確可運作的 Ruby 版本。
（這邊是用 RVM 進行處理）

因為是跑 Rails 所以需要對應的 JS 套件，我選用的是 Node.JS （但是預設版本非常舊）所以採用第三方套件安裝較新的版本。

```
sudo add-apt-repository ppa:chris-lea/node.js
sudo apt-get update
sudo apt-get install nodejs
```

在安裝 JS 相關套件的時候，就不會發生錯誤。
假設使用的是 MySQL 的話，則要一並安裝對應的 Library 上去。

```
sudo apt-get install libmysqlclient-dev
```

至於使用的 Capistrano Gem 則有一些改變。
```Ruby Gemfile
  # Capistrano Deploy
  gem 'capistrano'
  gem 'capistrano-Rails'
  gem 'capistrano3-puma'
  gem 'rvm1-capistrano3', require: false
```

關於官方的 `capistrano-bundler` 會選擇安裝在 `shared` 目錄，一直導致安裝失敗。
因此不使用（也會和 `rvm1-capistrano3` 衝突）

這次使用 Puma 作為 Web Server 所以加入了 Puma 的部分（主要是自動啟動伺服器的關係）
而 `rvm1-capistrano3` 目前是 Host 在 rvm 的 Github 下，雖然 Capistrano 官方也有一套 rvm 用的外掛，但是就是不會切換 Ruby 版本，所以只好改為這套。

註：Capfile 請記得更改去 require 對應的套件。

到這邊，就剩下 Shell Script 的部分。
不過在這之前，我們得先做一下簡易的 Setup 讓 Nightly Server 正常運作。

（以下操作是在 Gitlab-Runner 上）

```
git clone git@example.com:my-repo
cd my-repo
git checkout develop
bundle install
cap nightly deploy:check # nightly 是我另外在 config/deploy 新增的 nightly.rb 檔案
cap nightly puma:config
```

基本上，應該要 `deploy:check` 正常，以及 `puma:config` 上傳正確的檔案才能夠順利運作。
（`puma:config` 會自動在遠端產生 `shared/puma.rb` 設定檔，請確定跟預期的設定相同）

然後強烈建議先跑過 `rvm1:install:gems` 這個指令。

```
cap nightly rvm1:install:gems
```
然後把一些相依的 Gem 問題都解掉。

註：雖然可以在 `config/deploy.rb` 裡面加入 `before :deploy, "rvm1:install:gems"` 但是似乎會召喚 `rspec` 出來跑，即使沒有安裝（反而會出錯）

`rvm1:install:Ruby` 也可以跑看看，確定程式預期的 Ruby 版本跟我們安裝的是相同的。
（一般來說用 `rvm install 2.0.0` 就可以裝到對應的版本）

註：`rvm1:install:Ruby` 似乎因為 `rvm install .` 有問題，而無法自動安裝 Ruby

到目前為止，就剩下一些設定了！
以下建議 Rails 使用者打開（但是要預先設定好檔案）

```Ruby config/deploy.rb
# Default value for :linked_files is []
set :linked_files, %w{config/database.yml}

# Default value for linked_dirs is []
set :linked_dirs, %w{bin log tmp/pids tmp/cache tmp/sockets vendor/bundle public/system}
```

可以先編輯 `shared/config/database.yml` 設定好資料庫的連接。
（建議用 MySQL / Postgresql 因為 SQLte 每次都會重設⋯⋯）

最後是撰寫 CI 的測試 Shell Script 了！
（這邊只是參考，因為目前系統還有部分沒有整併 Script 的版本，所以暫時將測試部分分離出來）

Gitlab CI 中只要這樣設定即可：`./script/gitlab_ci`

然後我們產生一個名為 `gitlab_ci` 的檔案。

```shell
touch script/gitlab_ci
chmod +x script/gitlab_ci
```

要確定有給予執行全縣，不然在 Gitlab CI Runner 上會跑不起來。
（`script/` 目錄是 Rails 放置一些 Shell Script 或者直接執行的程式用的目錄）

```shell
#!/usr/bin/env bash

# 使用 RVM 切換到對應版本
# -- 因為我 Deploy 到 Heroku 有在 Gemfile 裡面指定版本
rvm use .

# 安裝 Gems
# -- 沒有 without development 是因為 capistrano 在這個 group 裡面
bundle install --without production

# 進行測試
bundle exec rake db:create RAILS_ENV=test
bundle exec rake db:migrate RAILS_ENV=test
bundle exec rake spec RAILS_ENV=test

# 進行 Nightly 的 Deploy
# -- 我只希望對 "develop" branch 實行，所以透過 Gitlab CI 的環境變數判斷
if [ "$CI_BUILD_REF_NAME" == "develop" ]; then
bundle exec cap nightly rvm1:install:gems # 預先安裝 Gems
bundle exec cap nightly deploy # 發佈（同時也會 restart puma 不過 env 不會改變，要注意）
fi

exit 0
```

只後只要 `develop` branch 有變動，就可以自動地將最新版本的程式發佈到 Nightly Server 上面了！
（只是建議 Ruby 版本變更等情況，最好預先跑過 `rvm1:install:gems` 不然會吃到一次 Faild 的 Test 喔 XD）

目前 Gitlab 還不支援 Success Script 所以只能先這樣土炮一下了 XD

註： Puma 預設是 Unix Socket 建議搭配 Nginx 使用，還有 Port Forward 轉出來給 Host 主機處理。
