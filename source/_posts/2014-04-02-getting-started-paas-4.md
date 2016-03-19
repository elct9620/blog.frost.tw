---
layout: post
title: 'PaaS 入門指南（四）'
date: 2014-04-02 13:21
comments: true
tags: [介紹, 雲端, PaaS, 入門]
---
終於，要到完結篇了（誤
這篇介紹完 Heroku 之後，就會開始寫進階運用的部分。
（其實已經冒出幾篇，基本上不會針對 PaaS 而是一些在 Heroku 上面的運用做討論。）

不過，寫這篇之前，其實我很想寫一下 Unreal Engine 4 collaboration with SVN 這篇，因為最近 UE4 推出，雖然台灣地區還沒開放購買（月費約台幣六百，買一次就可以拿到該月版本，可不續費更新）但是同學硬是找到原始碼（其實就在 Github 只不過付費用戶才能看到）

經過幾番波折，就這樣成功在 Windows / Mac 上跑起來，於是就開始了 UE4 研究之旅。
總之，下一篇大概就是 UE4 的 SVN （各種雷，完全找不到「SVN update」的功能⋯⋯卻可以 commit 啊）

<!-- more -->

關於 Heroku 的預先環境配置，在 [PaaS 入門指南（二）](http://blog.frost.tw/posts/2014/01/21/getting-started-PaaS-2)已經有跟大家提過，這邊先來簡單的回憶一下。
（驚悚的 Windows 體驗，真心建議大家裝個 VM 用 Ubuntu 還是比較方便⋯⋯）

使用 Heroku 來說，其實方便很多，因為有 [Toolbelt](https://toolbelt.Heroku.com/) 可以輔助，預先安裝好下列的套件：
* Ruby
* Heroku Command Line Tool
* Foreman
* Git

基本上 Mac / Windows 用戶都一樣是安裝這個（Mac 有 RVM 似乎也是會幫你裝好塞進去，太久沒裝沒印象了 XD）

完成之後先做登入動作，這也會順便把本機的 SSH Key 上傳（假設遠端沒有目前這台電腦的話）

> Heroku login

輸入信箱與密碼即可，非常簡單。

之後就可以使用 `Heroku` 相關的指令（不過除了從網站上去掉的環境變數設定外，其他透過網頁界面操作會比較輕鬆一些）

接下來就是 Deploy 一個網站上去，這邊用 Ruby on Rails 來做示範，畢竟 Ruby 是 Heroku 的主場。

> Rails new my_app

先產生一個新專案（沒有裝過 `Rails` 可以透過 `gem install rails` 來安裝）

> cd my_app
> git init

切進去後，初始化 git 專案（Heroku 是利用 git 來管理，也提供退回版本的功能。）

再將新專案的檔案加入 git 之前，我們先編輯 Gemfile

```Ruby Gemfile
source 'https://Rubygems.org'
Ruby '2.0.0'

# Bundle edge Rails instead: gem 'Rails', Github: 'rails/rails'
gem 'Rails', '4.0.2'
```

在 `source 'http://Rubygems.org'` 後面加入 `ruby '2.0.0'` 來告訴 Heroku 要使用的版本。
（這與 RVM 相容，大家可以不用擔心相容性）

註：如果 Mac 使用者有使用 `pow` 套用後卻因為 Ruby 版本發生問題無法順利啟動，可以加入 `.powrc` 這個檔案，內容如下

```shell .powrc
if [ -f "$rvm_path/scripts/rvm" ]; then
  source "$rvm_path/scripts/rvm"
  rvm use .
fi
```

如此一來 `pow` 就可以自動切換到對應的 Ruby 版本。

另外 Rails 預設可能是使用 SQLite 但是 Heroku 不支援，我們將它調整為 `pgsql` 作為 `production` 環境的資料庫。

```Ruby Gemfile
# Use sqlite3 as the database for Active Record
gem 'sqlite3', group: :development
gem 'pg', group: :production
```

透過設定使用時機的群組，讓本機可以使用 SQLite 開發省去資料庫設定的麻煩，而遠端則能夠支援 PostgreSQL 來運行。
（不過建議測試環境也使用 PostgreSQL 來盡可能確保運行環境的一致）

> bundle install

安裝套件，並且讓 `Gemfile.lock` 更新到最新的套件資訊。（單純修改 Gemfile 而沒有安裝套件是無法順利運行的。）

> git add .
> git commit -m "Initialize Project"

接下來就是把所有檔案加入 git 的管理，完成專案的初始化。

> Heroku create my-Rails-on-heroku

基本上可以直接運行 `Heroku create` 的動作，不過如果想指定 Application 的名稱，就可以後面加上「名稱」否則 Heroku 會以亂數產生一組名稱給你（實際上不影響，只是難以辨識）

完成後，Heroku 會自動將名為 `Heroku` 的 remote 加入到你的 git 中，此時只要上傳就可以看到網站了！

> git push Heroku master

接下來會看到一些來自遠端 git 的訊息，大致上就是切換版本、安裝 gems、做 assets 的 precompile 等動作。

假設都沒有出現 `[reject]` 之類的訊息，應該是成功了！
（第一次應該會在成功時看到來自 git 的訊息 `* [new branch]      master -> master`）

> Heroku open

我們可以利用這個方便的指令，快速打開剛剛的更新完畢的網站。

註：在沒有設定 `config/routes.rb` 裏面 `root` 的狀況下，打開應該是 Heroku 的錯誤頁面，開始撰寫你的 Rails Framework 之後就不會有問題了！

那麼，這一系列的文章在我分心許久後，終於完成拉！
