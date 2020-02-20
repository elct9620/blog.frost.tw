---
layout: post
title: 'ZyXEL GS1910-24 的 Port Base VLAN 設定'
date: 2013-08-17 02:43
comments: true
tags: [網管, VLAN]
---
老爸公司的網路線也漸漸的配置完成，也因此需要將 Switch 和 UTM 等設備都設定好。

在朋友的建議下，決定使用 Port Base 的 VLAN 不過，遭遇的不少困難。

<del>像是朋友知道有 VLAN 這東西但是 Port Base 的設定完全不熟之類的</del>

**注意，本篇文章為個人理解，有錯誤或者建議請告知修正**

<!--more-->

在網路上雖然有非常多相關的資料，但是針對 ZyXEL 的 Switch 資訊不多，而官方手冊也沒有細寫關於 Port Base 的設定問題。

在花了將近八小時都設定失敗的狀況下，終於從其他文章中摸索出了看似「正確」的設定。

雖然很順利的可以回家睡覺，但是第二天醒來還是渾身不舒服，因此決定一定要來「搞清楚狀況」用手機（前一天晚上只帶手機回家）刻苦地搜尋資料，並且順利了找到討論 Port Base VLAN 的文章。

[VID 和 PVID 的區別](https://576642026.blog.51cto.com/1353191/811386)

---

一直都無法順利設定的原因，主要就出在我對於 VID (VLAN ID) 和 PVID (Port-Base VLAN ID) 這兩個數值沒有詳細的理解，以及對於 VLAN 的運作沒有完全清楚的關係。

首先，要先知道 VLAN 的運作方式，以下是我的理解。

（其實我不確定 Tag 附加於封包還是 IP Address 不過推測應該是判斷兩個設備時才會帶上 Tag 之後建立連接後則不管）

當一個使用者被標記 (Tag) 後，則在網路設備中的 IP Addres 則會長成類似這樣。
`[1] 192.168.1.25` （這是假設的狀況，實際上長怎樣我不清楚）
而一個使用者沒有被標記 (Untag)，則 IP Address 並不會有附加什麼特別資訊。
`192.168.1.35` （和一般正常看到的 IP Address 一樣）

現在假設 `192.168.1.35` (B) 嘗試對 `[1] 192.168.1.25` (A) 進行連線，但是網路設備卻發現 B 跟 A 的 VLAN ID 不同，那麼就會把 B 發出的封包都封鎖掉。

假設此時 B 被加入了 VLAN 1 那麼 IP Address 就會轉變為 `[1] 192.168.1.35` 此時網路設備發現都是 VLAN ID = 1 的狀況，因此允許將封包互相傳送。

註：當為相同 VLAN 的狀態時，則發出去的資料不會帶有 Tag。

---

此時，以 Port Base 的 VLAN 被設定了，我們對每一個 Port 都設定好一個 PVID。

而 PVID 的用途是什麼呢？就是假設目前的使用者為 Untag 狀態時，對其他使用者發出封包，自動依據目前使用者的 Port 來補上 VLAN ID。

（從參考的文章來看，說成一個 Default 的 VLAN ID 可能會更適當。）

假設目前 `192.168.1.35` 使用了 Port 4 (PVID = 2) 那麼當嘗試對 `[1] 192.168.1.25` 發出封包時，會從原本比較 `192.168.1.35` 和 `[1] 192.168.1.25` 的狀態轉變為 `[2] 192.168.1.35` 跟 `[1] 192.168.1.25` 來做比較。

這是 Port Base VLAN 設定 PVID 的原因，從這點可以觀察到，當某一組 Port 都設定為相同的 PVID 時就能夠互通，反之則不行。

---

那麼，就開始來設定 Port Base 的 VLAN 吧！

![螢幕快照 2013-08-18 下午3.40.42.png](https://user-image.logdown.io/user/52/blog/52/post/87501/9Is7MPIZRcS5ZxmWuMNv_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202013-08-18%20%E4%B8%8B%E5%8D%883.40.42.png)

我們要先來建立 VLAN 來繼續設定。

上圖中我一共設定了 4 個 VLAN 並且 VLAN ID 依序為 1, 2, 3, 4。

以下是能夠發送和接收封包的 Port (可以預設讓某個 VLAN 本來就無法發送到特定的 Port)
VLAN 1: 1-24 Port
VLAN 2: 1-8, 21-24 Port
VLAN 3: 9-16, 1-24 Port
VLAN 4: 17-24 Port

VLAN 1 主要是 WAN 所使用的 VLAN
而 VLAN 2 假設是一般使用者 VLAN 3 則是管理者。
VLAN 4 用於網路設備 Ex. 無線 AP

**註：這裡將 Port 24 設定為 WAN 用的 Port**

現在依序將 Port 設定上對應的 VLAN 卻發現除非是相同的 PVID 否則是無法連上網的。
（註：ZyXEL 預設每個 Port 發出封包時都 Untag PVID）

1-8 -> 2
9-16 -> 3
17-20 -> 4
21-24 -> 1 (對外網路 / 共用的網路設備 Ex. NAS)

也因此，實際狀況其實是這樣：

Port 1 的使用者連接 > 嘗試向外部連接 > 因為沒有 Tag 拿到預設的 VLAN ID = 2 > 對 Port 24 (WAN) 發出封包
**Port 24 接收資料 > 因為沒有 Tag 拿到預設的 VLAN ID = 1 > 因為與 Port 1 所屬 VLAN 不同，放棄接收**

以上是我推測的情況，實際運作因為沒有方便的封包檢測軟體也不敢確定。
（從文章所說，當兩者 VID 不同時，回應會加上 Tag 而設備檢查的是 VLAN 是否相同，因此發生錯誤）

![螢幕快照 2013-08-18 下午3.40.57.png](https://user-image.logdown.io/user/52/blog/52/post/87501/QBjF9xz4R2eGgwWL1my0_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202013-08-18%20%E4%B8%8B%E5%8D%883.40.57.png)
（Port 23 是下一台 Switch 的 Port 因此把相關的 VID 都一起送過去）

此時將全部 Port 發出的封包都改為 Untag 的狀態，也就是發出封包時都是沒有 Tag 的狀態。

此時 Port 1 嘗試對 WAN Port 的 Port 24 發出封包，當回應時，也是 Untag 的狀態，那麼 Port 1 和 Port 24 的溝通就順利完成了！

不過，假設 VLAN 2 和 VLAN 3 嘗試進行溝通，不就會因為沒有 Tag 而能夠互相溝通了呢？

此時，前面對 VLAN 設定其下可發送和接收封包的 Port 就會發會功效了！

Port 1 (VLAN 2) 嘗試對 Port 9 (VLAN3) 發出封包 > 因為 Port 1 預設屬於 VLAN 2 因此對可發出封包的 Port 做檢查，發現 Port 9 不屬於同一組 Port 因此拒絕發送封包。

---

這邊稍為總結一下。

互相傳送資料的條件

* 所屬相同的 VLAN
* Port 屬於相同的 VLAN Membership

所以 Port A <> Port B 的連線是否可以開始，取決於 Membership 的設定。
Port A <> Port B 的連線開始後，是否能順利接收，取決於是否帶有相同的 VLAN ID。

因此要讓 WAN Port 能順利接收需要全部的 Port 都已 Untag 的狀態發送，而區分 VLAN 是否能傳送資料則由 Membership 來決定。

---

**不過我還是覺得有奇怪的地方，希望有專家可以補充解釋。我也會繼續思考這些地方的合理性和問題。**


