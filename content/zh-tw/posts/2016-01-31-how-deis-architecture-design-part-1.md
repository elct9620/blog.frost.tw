---
layout: post
title: 'Deis 架構分析（一）'
publishDate: 2016-01-31 14:28
comments: true
tags: [CoreOS, Deis, 雲端, PaaS, 筆記, 心得]
---
最近隨著 Container 技術的成熟，以及 CoreOS 等工具的出現。開始有一些 PaaS 的工具出現，而 [Deis](https://deis.io) 就是其中一個。

Deis 本身是受到 [Heroku](https://heroku.com) 所啟發的開源 PaaS 專案，透過 Deis 可以輕鬆的建構 Heroku-like 的 PaaS 環境，若是有能夠管理伺服器的人員，其實可以考慮以這種方式部屬網站。相對 Heroku 來說，基本的 CoreOS Cluster 只要三台機器，以 Linode 2GB 的方案來看，甚至還比 Heroku 單個 2x dyno 還便宜呢！

關於 Deis 的架構，在官方的[文件](https://docs.deis.io/en/latest/understanding_deis/architecture/)已經有做出說明，所以這系列的文章著重在閱讀原始碼以及探討關於 Deis 是如何實踐 Heroku-like 的 PaaS 環境。

> 我本身是 Heroku 的重度使用者，因為透過 git 管理以及豐富的 Addon 在開發時其實是非常方便的。
> 不過有時候還是會受到一些限制，這時候 Deis 就提供了很大的幫助。不過這類 PaaS 工具其實還不能說非常成熟，使用上還是會有不少問題，透過了解底層的機制來建構一個自己的版本，在某些情境反而更加容易控制跟維護。

<!--more-->

本篇文章會透過概觀的方式去介紹 Deis 所使用到的技術，以及實際上的應用層面。

### CoreOS

[CoreOS](https://coreos.com/) 是針對 Docker 設計的 Linux 作業系統，其中的特色就是內建了 Docker 以及容易的叢集（Cluster）管理功能。
透過 `etcd` 這個 Key-Value 的設定檔管理工具，CoreOS 可以利用 Discovery 服務登記每一個 Node 並且互相知道對方的存在。

> Discovery 是 etcd2 的新功能，主要是 CoreOS 官方提供的免費 etcd2 Server 供初次建立叢集時使用
> 這邊要注意的是 Discovery 使用完畢後最好切到自己的 etcd 伺服器，不然常常會有節點重開機後無法重新加入叢集的問題。

### etcd

etcd 同樣是由 CoreOS 團隊所開發的工具，是一個非常容易使用的 Key-Value 設定檔服務，在叢集的設定上也是非常容易。
在 CoreOS 安裝完成的同時，就會將 etcd 設定完畢，並且加入透過 Discovery 服務（功能）所紀錄的叢集中。
而透過 CoreOS 內建的 Docker 產生的 Container 也能夠直接存取到 etcd 的 REST API 來讀取設定值。

### fleet

fleet 也是 CoreOS 團隊所開發的工具，是一個類似 `upstart` 的 init 工具，但是是用來啟動 Container 的。
使用方式跟一般的 init 工具類似，撰寫預先設定好的設定檔，然後啟動即可。

> 這樣的好處是不用每次都重新啟動 Container 以及啟動時的設定值不用重新輸入，另一方面 fleet 也有專門的管理工具可以管理 Container 開啟狀況。

### flannel

flannel 依舊還是 CoreOS 團隊所開發的工具，透過 flannel 可以讓不同 Container 之間建立一個虛擬網路。

> 使用過 Docker 的人都知道要透過指定 link 的 Container 讓兩者可以溝通，但是當我們無法預先得知需要和哪些 Container 網路互通時，使用 flannel 就很方便了！

### confd

confd 是一個設定檔管理工具，可以透過讀取 etcd 的設定值更動，然後基於預先撰寫好的樣板檔案更新設定檔並且重啟伺服器。

> 在包成 image 時，要更新設定檔不是重新包就是製作新的 image 其實非常不方便。透過 confd 就可以動態的更新設定檔（透過訂閱 etcd 的變動）
> 而這種方式也對於動態產生設定檔是非常有幫助的。

---

上述這些就是 Deis 所使用到的技術，其實大多都還是基於 CoreOS 底下的專案。
從這點看來，其實 Deis 在學習應用 CoreOS 也算是一個非常優秀的範例。

這篇文章只是先簡單地將 Deis 所應用到的一些工具列舉出來，下一篇文章我們會從 Deis 的 Router 功能來看看是怎們應用這些工具的。

> 從 Router 開始一方面是比較簡單，另一方面是 Router 即使是在自己的 Container 中應用也是非常方便的。
