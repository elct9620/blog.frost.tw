---
layout: post
title: 'Travis CI 的 Deploy 功能'
date: 2014-02-25 06:00
comments: true
tags: [Github, Heroku, CI, PaaS, 筆記]
---
最近收到一個 Issue 是關於我製作的 [Heroku Buildpacks](https://Github.com/elct9620/Heroku-buildpacks-PHP-with-phalcon) 有問題，沒辦法使用 Travis CI 的 Deploy 功能。

因為寫 Test 的習慣養成挺困難的，再加上獨自開發與大多是半遊玩性質的關係，其實幾乎沒有使用 Travis CI 的習慣，不過這次因為這個 Issue 我稍微研究了 Travis CI 的功能以及 Deploy 功能。

這算是一個很方便的功能，尤其是網站專案來說，如果在 Deploy 後馬上就發生問題，也是非常不方便。那麼，一般 Git 的專案來說，我們通常都是直接進行 Deploy 即使在本機事先做過一次測試，但是總是會有忘記的時候。

此時，透過持續整合服務的自動 Deploy 功能來協助，就可以在確保所有測試都沒問題的狀況下才進行 Deploy 也比較能夠自動化。

<!-- more -->

那麼，我們該如何開始呢？

如果已經在使用 Travis CI 可以直接打開 `.travis.yml` 檔案加入 `deploy` 的設定項。

```yml .travis.yml
deploy:
  provider: Heroku
  api_key: xxx
  app: my-auto-deploy-app
```

或者安裝 Travis CI 的 [Command Line Tools](https://Github.com/travis-ci/travis) 使用 `travis setup Heroku` 來自動生成。
不過這需要先有 `.travis.yml` 檔案存在，如果沒有的話可先使用 `travis init` 來進行初始化。

不過，如果直接將 API Key 以明碼儲存在 Public 的 Repository 上其實有點不妥，因此可以使用 `travis encrypt` 先行加密。

> travis encrypt travis encrypt $(Heroku auth:token)

我們就會得到一串加密的字串（大概是用 Travis CI 上面的 Public Key 加密的，因此不用擔心會被解開，擁有 Private Key 的只有 Travis CI 本身。）

之後修改 `.travis.yml` 即可。

```yml .travis.yml
deploy:
  provider: Heroku
  api_key:
  	secure: encrypted-api-key
  app: my-auto-deploy-app
```

上面基本上就是最為基本的使用，不過要注意的是，假設測試的版本有多個（Ex. PHP 5.4, PHP 5.5）那麼這個動作也會被執行兩次（預設情況）

後面就來談談[官方文件](http://docs.travis-ci.com/user/deployment/Heroku/)上所敘述的其他運用方式吧！
（這個 Deploy 功能也支援像是 OpenShift, AWS 等，可以依照情況使用。）

### 不同 Branch Deploy 到不同 Heroku APP

這個情況像是有 Production 之外，也許還會有 Staging 供內部測試時，就很方便。

```yml .travis.yml
deploy:
  provider: Heroku
  api_key:
  	secure: encrypted-api-key
  app: 
  	production: production-app
    staging: staging-app
```

其實概念挺簡單好懂的，就是 `branch: app` 的格式。
（也支援 Deploy 到不同 Heroku 帳號，用法一樣只是改為寫在 `api_key` 項目下。）

### 僅有部分 Branch 需要 Deploy

一般來說我們的 Development 不會需要 Deploy 出去，但是每次跑 CI 的時候都會用 Development 去 Deploy 非常不方便，因此可以使用 `on` 來做設定。

```yml .travis.yml
deploy:
  provider: Heroku
  api_key:
  	secure: encrypted-api-key
  app: my-auto-deploy-app
  on: production
```

使用 `travis setup Heroku` 的話，會發現預設是 `on` 一個 `repo` 不過文件上似乎沒有詳細敘述，不過這個選項是支援多選的。

### Deploy 後運行某些 Command

像是 Rails / Laravel 這類 Framework 在產生 Migration 一段時間後進入 Deploy 程序，就很容易忘記下 `migrate` 這個指令，我自己就碰過因為忘記下而讓網站死掉的情況⋯⋯

Travis CI 也很貼心地提供這個功能（甚至還有 `after_deploy` 可以做後續處理）

```yml .travis.yml
deploy:
  provider: Heroku
  api_key:
  	secure: encrypted-api-key
  app: my-auto-deploy-app
 	run:
  	- "rake db:migrate"
    - "rake assets:precompile"
```

如果只需要 `rake db:migrate` 直接寫在 `run` 後面就可以了。

整體來說很好理解，不過這個功能卻解決了網站在 Deploy 上的問題。
（像是需要使用 Capistrano 之類的來輔助才能完成之類的，如果是 PHP 專案也可以用 FTP 來上傳。）
