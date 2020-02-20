---
title: 如何在沒有任何設定下產生 Rails 的 Docker Image
date: 2019-03-20 23:37:22
tags: [Ruby, Docker, Rails, Gem]
thumbnail: https://blog.frost.tw/images/2019-03-20-the-zero-configure-dockerfile-for-rails/thumbnail.jpg
---

前陣子看到 [Throughbot](https://thoughtbot.com/) 這間在 Ruby 圈 算是蠻有名的公司做了一個叫做 [Suspenders](https://github.com/thoughtbot/suspenders) 的 Gem 主要是對 Rails 擴充，簡單說就是基於原本的 `rails new` 做了一個替代品，而這個替代品會自動幫你先做好一些原本要手動做的事情。

像是安裝好常用的 Gem、套版之類的，想了一下覺得[五倍](https://5xruby.tw)其實也很需要，不少新專案也都是從我這邊經手初始化的，有一個這樣的工具會省下不少時間。

所以 [Bankai](https://github.com/5xRuby/bankai) （卍解） 這個 Gem 就樣做出來了，裡面基本上就是設置好在五倍大多數時候用的標配 Ex. GitLab CI 設定、RSpec 等等

但是又發現好像不太夠用，有些時候有 Docker 會方便很多，但是 Bankai 現在做不到！

<!--more-->

所以 Bankai Docker 這個外掛就這樣在一週左右完成原型的製作，作為 Bankai 的額外擴充被支援了！

## 特色

Bankai Docker 目前功能還很陽春，不過對於大多數情況應該都是夠用的。

產生的 Docker Image 大小會落在 180MB 上下，主要是因為 Ruby + Node.js 約 80MB 剩下的則是安裝的 Gem 所佔用的，以一個 Docker Image 來說不算輕量，但也在可以接受的範圍內。

主要的特色是**不用任何設定**，也就是說在安裝好 Bankai Docker 後，直接執行 `rake docker:build` 你的專案就會自動被打包好，而且馬上可以使用。

## 使用

目前還在考慮是否要能獨立運作，不過預設是相依 Bankai 的：

```bash
# 安裝 Bankai
gem install bankai

# 開啟新專案
bankai dockerize
```

這樣就能產生一個全新的 Rails 專案（五倍版）目前還沒有支援 `rails g bankai:docker` 的選項，所以先手動把 `bankai-docker` 加入到 Gemfile 裡面。

```ruby
group :development do
 # ... 略
 gem 'bankai'
 gem 'bankai-docker'
end
```

接下來跑一下 `bundle install` 就安裝完畢了！

```bash
# 安裝 Bankai Docker 到專案中
bundle install

# 打包 Docker Image
rake docker:build
```

好像什麼事情都沒做就產生 Docker Image 對吧？我想要的就是這種感覺！！

## DSL

自動化的設定總是會有限制，所以在設計的時候已經預先想好可以透過 `config/docker.rb` 這個設定檔來寫 DSL 用來修改原本的行為。

```bash
rails g bankai:docker:install
```

這個指令可能會替換掉，跑完之後會把原本放在 Gem 裡面的 `docker.rb` 放到 `config/docker.rb` 裡面，然後我們就可以安心的來修改了！

像是預設的 Docker Image 會是 `$(whoami)/APP_NAME` 以剛剛的範例就會是 `elct9620/dockerize` 一般情況可能沒什麼問題，但是如果像我想要用五倍內部的 Registry 伺服器，這個命名就不適合了！

```ruby
Bankai::Docker.setup do
  name 'registry.5xruby.tw/elct9620/dockerize'
  
  # 略
end
```

簡單來說，要在預設的 DSL 設定裡面補上這個 `name` 設定，就可以修改預設的 Docker Image 名稱，大致上就是這樣使用的。

因為新版本的 Docker 多了叫做 Multi Stage 的機制，所以我們可以把 `bundle install` 的步驟放到一個單獨的 `stage` 編譯好後再複製到主體，這樣就可以省下很多空間（因為不用安裝額外的套件）

所以 DSL 的結構就會像這樣：

```ruby
Bankai::Docker.setup do
  stage :gem do
   # ...
  end
  
  # ...
  
  main do
   # ...
  end
end
```

在 Stage 中就可以使用對應 Docker 原本有的指令，像是 `RUN bundle install` 會對應成 `run 'bundle install` 目前大多數都支援，還有少部分之後會慢慢補齊。

如此一來，我們就可以很簡單的去修改原本 Docker 建置的過程。

> 目前還不支援預設值，後續的改版會簡化為如果不修改 gem / node / main 三個預設設定，就不用寫出來去覆蓋。

## Auto Package

有一些 Gem 會需要先安裝好一些套件才能使用，像是 `pg` 和 `mysql2` 這兩個大家常用的資料庫套件，為了可以無視這些設定，所以透過「工人智慧」我們可以用 DSL 去定義偵測條件，自動的安裝套件。

```ruby
Bankai::Docker.setup do
  detect_package :database, :gem do |package|
    if pg?
      package.add_dependency 'postgresql-dev', runtime: false
      package.add_runtime_dependency 'postgresql-libs'
    end

    if mysql?
      package.add_dependency 'mariadb-dev', runtime: false
      package.add_runtime_dependency 'mariadb-client-libs'
    end
  end
end
```

像是上面這樣，我們可以在 `gem` 這個階段增加 `postgresql-dev` 套件，而實際執行的時候只使用 `postgresql-libs` 如此一來就可以盡可能的縮小最後產出的檔案大小。

> 上面是節錄自 [templates/auto_package.rb](https://github.com/5xRuby/bankai-docker/blob/master/templates/auto_package.rb) 這個檔案，如果有一些常用的套件需要增加，可以送 PR 給我們。

## COPY FROM

另外一個比較困擾的是 `COPY --from=gem` 這指令，如果要手動下在 `main` 的話其實有點麻煩，所以就提供了 `produce` 這個 DSL 來輔助。

```ruby
  stage :node, from: 'node:10.15.2-alpine' do
    run 'mv /opt/yarn-v${YARN_VERSION} /opt/yarn'

    produce '/usr/local/bin/node'
    produce '/opt/yarn'
  end
```

像是這邊我們處理好 Node.js 之後，要讓最後產出能有 `/usr/local/bin/node` 這個檔案和 `/opt/yarn` 目錄，我們就可以用 `produce` 告訴 Bankai Docker 要在最後產出時自動給這樣指令。

```
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /opt/yarn /opt/yarn
```

如此一來就省事很多，在處理 Docker Image 生成的不少小細節都已經先在 Bankai Docker 做掉（像是 `.dockerignore` 的設定等等）使用起來就比自己寫 Dockerfile 快上非常多。

## 總結

以前常想「資深工程師」有哪些特質，其中一個我認為有的特質就是能製作「順手」的工具，畢竟當你有自己的一套方法現有的預設做法或者一些設定，就不一定符合需求。雖然能製作自己使用的工具不代表有資深工程師的實力，不過開始有這樣的需求時，應該就是走在這條路上了吧！

當這個 Gem 成型之後，其實後面還有更厲害的組合應用還沒完成，下次有機會的話會再跟大家分享怎麼用這樣的特性做 DevOps 來改善開發流程。
