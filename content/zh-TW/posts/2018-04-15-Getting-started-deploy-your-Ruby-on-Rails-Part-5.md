---
title: 部署你的第一個 Ruby on Rails 網站（五）
date: 2018-04-15 22:04:14
tags: [DevOps, 教學, Ruby on Rails]
thumbnail: https://blog.frost.tw/images/getting-started-deploy-your-ruby-on-rails-part-5/thumbnail.png
---

到[第四篇](https://blog.frost.tw/posts/2018/04/10/Getting-started-deploy-your-Ruby-on-Rails-Part-4/)為止，我們已經有了可以運行 Ruby on Rails 的環境，不過到底該怎麼在伺服器上跑起來呢？

絕對不是**把程式碼複製到伺服器**這種簡單的做法，或者說這樣的做法在更新上是很沒有效率的！

<!--more-->

在 Ruby 中，有一個非常好用的 Ruby Gem 叫做 Capistrano 可以自動地幫我們完成網站部署。運作起來其實也很簡單，就是幫我們 SSH 到伺服器上，執行相對應的指令。

這跟自己複製到伺服器上有什麼差別呢？假設我們現在要部署到四五十台的伺服器，難道要一台一台複製嗎？

有這些工具的輔助，就能夠下完指令就去泡咖啡等部署完成拉 XD

> 最近打算學一下 Ansible 怎麼使用，也許下次會分享用 Ansible 部署多台 Ruby on Rails 伺服器的方法。

## 安裝 Capistrano

首先，先在我們的 `Gemfile` 加上

```ruby
group :development do
  gem 'capistrano', '~> 3.10', require: false
end
```

因為 Capistrano 可能會因為版本升級而改變一些設定，所以大多會限制版本。另外就是這是一個擴充的指令，所以可以設定為 `require: false` 來避免在運行 Ruby on Rails 的時候將它讀取進來。

接下來，我們要執行 `install` 指令，將 Capistrano 所需的設定檔生成。

```bash
bundle exec cap install
```

當我們看到多出了 `Capfile` 和一些檔案後，就算是將 Capistrano 安裝完畢了！

## 設定 Capistrano

雖然安裝好了 Capistrano 但是我們還沒有針對 Capistrano 設定該如何取得原始碼、上傳到哪台伺服器上面。

首先，因為是 Ruby on Rails 專案，所以我們先在 `Capfile` 裡面做一些修改，讓 Capistrano 能夠自動幫我們針對一些 Ruby on Rails 特有的行為做處理。

下面這些是預設被註解掉的選項，我們在部署的時候會需要用到，所以都將他取消註解。

```ruby
require "capistrano/bundler"
require "capistrano/rails/assets"
require "capistrano/rails/migrations"
require "capistrano/passenger"
```

然後我們需要設定要部署的伺服器，預設 Capistrano 會區分 Production（正式）和 Staging（測試）環境，所以我們需要對這兩個環境個別設定。

> 不過現實上我們可能還是很小的專案，只有一台伺服器。也是可以設定在同一台上的，這篇文章也會示範部署在同一台的方式。

首先，我們先針對 Staging 環境做設定，打開 `config/deploy/staging.rb` 這個檔案，修改成下面這樣。

```ruby
server '伺服器 IP', user: 'deploy', roles: %w{app web db}
set :deploy_to, '/home/deploy/staging'
```

如果忘記 IP 的話可以到 Digital Ocean 找看看，因為要分別部署 Production 和 Staging 兩個網站，所以我們針對 `deploy_to` 做設定，讓他複製到不同的資料夾下面。

> 一般這種我會習慣用網址當資料夾名稱，像是 `/home/deploy/beta.rookie.works` 這樣子，比較好區分。

至於 `config/deploy/production.rb` 的設定，基本上就是複製 Staging 設定後做修改。

接下來，我們需要設定如何部署。

打開 `config/deploy.rb` 來進行設定，我們先將原始碼的位置指定給 Capistrano。

```ruby
set :application, 'deploy-example'
set :repo_url, 'git@github.com:elct9620/deploy-example.git'
```

最重要的是 `repo_url` 需要正確的設定，如果還不知道怎麼使用 Git 跟上傳自己的專案到 Github 的話，可以參考像是[為你自己學 Git](https://gitbook.tw/) 這類書籍來了解。

最後，我們要針對 Ruby on Rails 一些共用的設定檔做一些設定。

```ruby
# Default value for :linked_files is []
append :linked_files, 'config/secrets.yml'

# Default value for linked_dirs is []
append :linked_dirs, 'log', 'tmp/pids', 'tmp/cache', 'tmp/sockets', 'node_modules', 'public/shared', 'public/uploads'

# Default value for default_env is {}
set :default_env, { path: '/usr/local/ruby-2.4.3/bin:$PATH' }
```

首先，因為 `config/secrets.yml` 會影響到 Rails 的加密機制，所以我們都會先在伺服器上放好 `config/secrets.yml` 這個檔案，並預先寫死在裡面，以免被其他人直接取得。

> 像是 Github 偶爾還是能找到一些帳號密碼，像是這類敏感資訊要記得不要 Commit 到 Git 裡面。


至於 `linked_dirs` 則是針對一些常用的資料夾，像是上傳檔案的目錄、紀錄檔等等。

## 小結

整體上來說 Capistrano 的設定還是相對簡單的，不過前面在設定伺服器的時候可能還會看到像是 `role` 之類的設定，這是在不同伺服器扮演網頁伺服器或者資料庫伺服器時，可以個別執行不同動作的設計。

下一篇文章我們會回到伺服器上的設定，將使用 Capistrano 部署到伺服器上的必要條件設定起來。

