---
title: "TGONext: 資料庫變遷跟架構改變"
publishDate: 2020-04-03T21:14:56+08:00
date: 2020-04-03T21:14:56+08:00
tags: ["TGONext", "架構", "資料庫", "心得"]
series: TGONext
toc: true
thumbnail: https://blog.frost.tw/images/2020-04-03-tgonext-database-migration-and-architecture-changing/thumbnail.jpg
credit: Photo by panumas nikhomkhai from Pexels
---

這次在開始討論關於架構的主題之前，我們的倒是讓我們提出一些問題。

剛好在兩次聚會的期間，我的客戶因為一些錯誤的計畫讓 Migration 失敗了，所以我提出了關於在不停機的狀況下做 Migration 的規劃問題。

<!--more-->

## 不停機的 Migration {#migrate-database-without-downtime}

實際上，在我的工作中大多客戶都是能接受停止一段時間來更新資料庫的新創公司類型。

不過對於比較大的服務，將伺服器停止後進行更新基本上是很難被接受的。

> 尤其是越來越多提供全球使用的服務，即使我們可以在某個區域暫停來停機，對於其他區域來說也不一定能被接受。

### 參與者的經驗 {#the-mentee-s-experience}

我認為包含我的大部分工程師都知道怎麼做，不過應該是有很多細節我們沒有預期到的。

導師讓我們分享各自的經驗：

* 不要去移除欄位
* 避免框架的 Migration 移除東西
* 複製並且重新命名資料表
* 使用 Trigger 複製資料

其實大部分的做法我都在網路上看過，大家提出比較常見的作法就是避免去移除或者更改欄位名稱。

### 資料庫真的有版本控制嗎？{#does-the-database-has-version-control}

有些人提到因為在 Migiration 的過程中不能遺失資料，所以他們大多不刪除欄位或者在 Rollback （回滾）的時候刪除任何東西。也因此在討論的過程中，我們的導師點出了這樣一個問題。

以原始碼來說我們可以跳到任一個版本而不會有任何副作用，這是因為原始碼大多是無狀態的。但是我們嘗試去改變資料庫的版本從 `2020-03-28` 到 `2020-01-01` 然後我們可能再次跳回 `2020-03-28` 的版本而能讓所有跟 Rollback 之前完全一樣嗎？

基本上這沒有一個準確的解答，大多會仰賴於我們的服務對這些資料的重視程度。不過在我們設計 Migration 的時候，確實應該要小心的選擇一個比較安全的做法。

### 效能損失 {#the-performance-lost}

既然我們不會去刪除欄位，資料庫就會需要去讀取一個更大的 Row 來查詢東西而這可能會讓資料庫變慢。

基本上這是因為 RDBMS 的資料庫大多是以 Row 為基礎來設計的才會有這樣的特性。而 NoSQL 通常以 Column 為基礎設計，因此 NoSQL 通常不會遇到這類問題。

不過我們也有其他的選擇，像是透過修改重新命名資料表的方式來避免長成大表。先建立一個暫時的資料表套用變更後再去替換這個資料表。

像是 GitHub 就有一個叫做 [gh-host](https://github.com/github/gh-ost) 的工具可以讓我們不用自己實作上面的流程。

> 不過我們的導師也提醒我們，如果 Migration 的過程會花費很多時間我們可能會想要中途暫停，但是 `gh-ost` 並不支援這樣的機制。

除了效能問題之外，我們也還有像是 Table-lock 和其他問題需要注意。

> 在討論中我發現其實有很多資料庫的行為是我們已經知道的，但是在選擇方案時並沒有將這些東西連結起來去確認可能存在的風險。

## 資料庫的擴充性 {#the-database-scalability}

這算是前面問題的延伸，當我們討論到 RDBMS 和 NoSQL 有不同特性時，我們開始比較 MySQL/PostgreSQL 和 MongoDB 的設計。

在 RDBMS 中我們通常會使用 B+ Tree 來建立 Index（索引），而我們的導師向我們提出問題：「為什麼 MongoDB 會選擇使用 B Tree 來建立索引？」

為了加快查詢資料，其中一種方法是減少總查詢的筆數。在 RDBMS 我們通常會選擇使用 Shard（分片）或者 Partition（分區）來建立一個比較小的資料表子集合。

在 B+ Tree 裡面，資料節點通常會連接著下一筆資料，這表示我們在 RDBMS 能有快速的範圍查詢。不過如果我們需要去建立一個 Shard 或者將資料切割到不同的資料庫，這反而變成一個讓 RDBMS 感到困難的問題，因為很難確定要將哪些資料節點放在一起切割出來同時還要考慮資料節點的連結關係。

因為 MongoDB 使用了 B Tree，這表示可以非常容易的選出一個子樹就能切割，因為不需要擔心資料節點會連結在另一個子樹上的資料節點上。

這種特性讓 MongoDB 更容易被拓展，但是同時缺點就包含了範圍查詢相對的慢，以及 Shard 機制可能因為某些原因頻繁的移動資料而造成 Disk I/O 上的壓力。

> 這個討論其實給我了一些在未來建議其他人選用資料庫的靈感，每一個小的設計細節都會改變行為跟優缺點。

## 架構的改變 {#the-architecture-changing}

這其實是我們這次聚會預定討論的主題，我們的導師先讓我們分享一些當服務無法處理增加的請求時要怎麼做的想法。

大致上歸納整理後，我們大概有這幾種方式：

* 垂直升級 (像是增加記憶體、處理器)
* 水平拓展 (增加更多同質的實體)
* 加入快取
* 加入隊列（Queue）
* 增加限流機制（像是次數或者流量限制）
* 將單機服務分割成不同的實體

接下來我們的導師讓我們分享何時會從其中一種模式換到另外一種，網路上有很多公司分享過他們的經驗，但是這些並不一定符合我們的情況。

如同每一次的聚會，我們從討論每一種選擇的缺點開始。像是水平拓展雖然看似是一個不錯的選擇，但是假設我們有超過 300 台或者更多機器時，管理上是容易的嗎？進行改版時要花多久才能全部更新完畢？

因此我們可能會想要合併或者減少我們所管理的總實體數量，我們的導師也讓我們思考一些使用 Microservice 的知名公司總共有多少微服務以及是否有一個管理數量的極限存在。

我們也針對上面幾種模式討論各種選擇的優點跟缺點，這邊我選了幾個比較有趣的跟大家分享。

> 在現實世界中我們大多不會只用一種模式，我覺得比較像是當作積木的感覺去組合或者分解來配合我們的業務需求。

## Queue

這是我們討論比較多的部分，最開始我們是討論使用 Queue 的時機。

舉例來說，如果我們有一些服務是非常要求即時回應的。那麼 Queue 的非同步特性可能會造成一些問題，而這樣的特性跟 Thread 是類似的。

在現實中我們常常需要讓寫入資料庫的動作是依序執行的來避免 Race-Condition（競爭條件）也因此 Queue 通常會是依序執行的。

另一方面，Queue 也通常會有一個容量的上限，如果我們接收了超過上限的請求就需要反過來阻塞使用者。

這表示我們雖然可以透過使用 Queue 可以為資料庫爭取到緩衝，但同時也可能變成其他服務的瓶頸。

> 這其實也符合在上一次聚會我的感想，不同的選項會有不同的缺點，而我們的工作是要小心地在這些選項中選擇一個恰當的方案。

### RabbitMQ

我們也討論了幾個 Queue 服務的解決方案。RabbitMQ 是用 Erlang 所撰寫的，而 Erlang 有著能從失敗的 Process 恢復的特性。這表示在大多數情況下我們的 Queue 會需要兩倍的記憶體來確保能夠正確的恢復，因為我們有另一份備份在記憶體中，來確保失敗的 Process 可以被復原。

### Kafka

我們的導師問我們，Kafka 是用 Java 寫的但是為什麼他跑得非常快？是什麼原因讓 Java 會慢？

其中一個原因是 GC 會造成一些效能的問題，不過 Java 也提供了 `Off-Heap` 的機制讓我們自己管理記憶體，因此 Kafka 能比正常狀況更快。

而 Kafka 是由 Linkedin 所開發，主要專注在吞吐量（Throughput）上，這是因為對 Linkedin 來說吞吐量比較重要。我們的導師告訴我們，有些比較是沒有意義的因為他們嘗試比較同類型的服務，但是並沒有注意到這些服務想解決的問題不同。

## 區域 {#region}

另一個有趣的討論是關於區域，在垂直升級的選項中哪個通常是難以升級的？通常是網路，也因此像是 AWS、GCP 和大多數大型的全球公司都會嘗試搭建他們自己的海纜或者機房在不同的國家。

為了能夠在兩個區域高速交換資料，我們很難用購買 CPU、記憶體或者應䩞的方式改善。

另一個問題是當我們有高可用性（High-Avalability）或者 Master-Master 架構的時候，如果我們其中一個資料中心停止運作的時候，有多少問題需要我們去解決？

我們可能會有一些資料並沒有同步到另一個資料中心，假設主要的機房恢復的狀況下，要怎麼確保資料是一致的

？以及我們主要的機房停止的狀況下，備援的機房是否有相同的硬體可以去支撐原本的請求呢？

## 結論 {#conclusion}

在這次的聚會中我認為學到了一些關於選擇方案的技巧，在過去我經常很難去回答別人像是為什麼要使用 PostgreSQL 或者 MySQL 或是為什麼要使用 Ruby 這類問題。

剛開始我認為這是因為我不夠專業的關係，不過我想原因可能是因為我並沒有去注意特性跟那些隱藏在功能後的細節。

其實這是很好的機會去練習在缺點中去尋找更多資訊，我現在也嘗試改變我的習慣跟流程去實踐這個做法。