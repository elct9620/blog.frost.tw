---
layout: post
title: 'PaaS 入門指南（一）'
date: 2014-01-15 03:32
comments: true
tags: [介紹, 雲端, PaaS, 入門]
---
這一系列的文章是準備寫給對雲端有興趣，或者想嘗試架設網站的人。

內容的部分，這篇文章會對幾家常見的 PaaS 平台進行簡介。後續會以 Heroku 為主軸繼續介紹，從產生一個 Application 到發佈以及客製化都會一起介紹。文章中也會將我所理解的 PaaS 概念與架構一併說明，讓大家可以更加了解關於 PaaS 的使用，以及優缺點。

至於這一系列的文章，會以「免費、無負擔」的前提下撰寫，選用以及介紹的 PaaS 可能有付費也可能有免費，但是會讓大家在盡可能不花費的狀況下體驗與使用。

那麼，正文開始。

<!--more-->

## 簡介

在我接觸雲端時，接觸到幾個相關的詞，那就是 IaaS, PaaS, SaaS 這幾項，依序就是 基礎作為服務、平台作為服務、軟體作為服務。

也很剛好的，他們也剛好是層層遞進的關係。以 IaaS 來說就類似你買的一台伺服器（主機）而 PaaS 就類似於事先設定好了環境（買主機幫你裝好作業系統）而 SaaS 則是連軟體都安裝完畢，可以直接使用（買來的電腦附贈了 Office 可以使用）

對於網站來說 PaaS 就是一個「預先」配置好作業系統，並且可以運行你的軟體（網站）的服務。

## 平台介紹

接下來，我會依序介紹我所知道的 PaaS 服務。這幾年其實大部份的 PaaS 服務商都已經提供多種語言的支援，比較少針對單一語言，而 PaaS 也會因為服務商架構設計上的不同，能夠使用的範圍也不一樣。

另外要**注意**的就是服務商免費方案大多是「開發用」的等級，如果要切換到「生產力環境」請務必做好付費的準備。
（而 PaaS 的收費比 IaaS 高出不少，主要是節省了網管人員的人事費用。不過這個差異是否適合自己的團隊，也是需要謹慎評估。）

### Heroku

假設說 IaaS 世界有著非常完善的 Amazon AWS 服務，那麼 PaaS 世界，我想 Heroku 擁有這樣的稱號應該也不為過。雖然 PaaS 平台都差不多，但是 Heroku 卻有著驚人的特性讓我對的評分增加不少。

官方網站：[https://www.Heroku.com](https://www.heroku.com/)

* 豐富的 Add-on 功能
* 可客製化的 PaaS 運行環境
* 使用 Git 進行版本管理（可線上 Rollback 版本）
* 完整的管理界面
* 支援自定域名（免費）

唯一小小的缺點是目前沒有 MySQL 的 Add-on （開發用方案）可以使用（對一個 PHP Developer 來說）

### AppFog

原本是 PHPFog 後來使用 VMWare 開發的 CloudFoundry 而轉變為一個支援多種語言的 PaaS 服務。特色是可以自由分配 VM 的設計，而且免費方案非常大方（有 2GB 記憶體任你分配使用到每台 VM 上）

官方網站：[https://www.appfog.com/](https://www.appfog.com/)

* 可自由分配記憶體
* 資料庫服務無需額外付費

基本上和 Heroku 其實就是差在免費方案的使用上限上，比較可惜的是後來將免費方案的 Custom Domain 功能取消。

### OpenShift

由 RedHat 主導的 PaaS 平台，現在加入了完善的網頁管理界面後，變成非常適合新手使用的 PaaS 平台。有著 One Click 就能完成 Load Blancing 配置的方便功能。

官方網站：[https://openshift.redhat.com/](https://openshift.redhat.com/)

* 支援自定域名
* 設定 Load Blancing 非常簡單
* 提供 Jenkins 在 Deploy 後進行測試，避免出問題的網站上線
* 可客製化的 PaaS 運行環境

其實我還沒怎麼玩過，不過 CI 服務非常吸引人，另外就是收費其實不高。只是看起來這個服務，似乎不是給一般人使用的，最高的方案應該還不夠給大企業用，大概是要另外洽談吧⋯⋯

### dotCloud

應該是這幾家裡面唯一一個一開始就要付費的服務，特別提出來是背後的 IaaS 建構有 OpenSource 而且也已經可以在 Github 上找 Open Source 的方案建構 Heroku Like 的服務方式。

官方網站:[https://www.dotcloud.com/](https://www.dotcloud.com/)

因為沒有使用過，所以也沒辦法給出優點。如果有興趣的朋友，可以嘗試玩看看。

### CloudFoundry

其實說是一個 Open Source 的 PaaS 解決方案會比較適合，不過官方網站也提供了免費試用，想要體驗的人也是可以拿來使用或者架設。是 VMWare 所開發的 Open Source 專案（印象中是透過社群營運）

官方網站：[https://www.cloudfoundry.com/](https://www.cloudfoundry.com/)

優點部分，因為是解決方案所以沒有太多可以討論的（實際上也不建議拿來當上線的服務主機）

### PagodaBox

單純的 PHP PaaS 服務，不過特別提出來是因為他有一個 Store 可以讓大家寫好一些設定讓其他使用者付費安裝（或者免費）這個機制很特殊，也使少數提供 SFTP 可以讓不會 Git 的使用者也能輕鬆使用的 PaaS 服務。

官方網站：[https://pagodabox.com](https://pagodabox.com)

* 提供 Store 機制（Ex. WordPress 的預先設定版本）
* 提供 SFTP
* 支援自定域名

基本上算是個蠻容易上手的 PaaS 平台，不過僅限 PHP Developer 或者一般架站玩家了。

---

其實還有一些 PaaS 沒想到，這邊介紹比較多是 PHP / Ruby 的環境，不過像是 [Nodejitsu](https://www.nodejitsu.com/) 之類的，也都不錯。（剛剛還發現 Nodejitsu 竟然提供 Open Source 的 Hosting 寫 Node 的朋友快上 XD）

下一篇文章會介紹玩 PaaS 要會的基本技能（Ex. Git, Command Line, SSH 等）希望這一系列文章結束後，大家都可以輕鬆玩雲端服務 XD
