---
layout: post
title: 'Nitrous.io - 網站開發協作平台'
date: 2013-09-08 02:53
comments: true
tags: [Rails, 雲端, VPS, 教學]
---
會寫這篇文章，主要是最近收到 [Nitrous.io] 的信，而我意外地想到一個特別的用途，那就是透過線上協作功能教我妹寫 Ruby on Rails。

註：本文連結都帶有 [Nitrous.io] 的邀請碼，如果不喜歡請直接輸入 Nitrous.io 進入網站註冊

---

### 什麼是 Nitrous.io

這大概要追溯到三、四年前，一個叫做 Action.io 的服務了⋯⋯
那時還是高中生的我，意外的申請了一個叫做 Action.io 的 Beta 計劃，然後開始等待邀請碼。
（根據噗浪訊息，直到今年我才收到 Beta 邀請碼）

當時的 Action.io 展示了一個功能「線上協作」而引起我的興趣。

至於線上協作是什麼形式的呢？昨晚上測試的結果是只要啓動「協作模式」就能夠立即得看到其他人的編輯，並且附有聊天室的功能。
不過如果單純是這樣，那麼用最近幾年出現的線上編輯器不是也可以達到嗎？不過，既然有辦法推出這個服務，總是會有他的過人之處，那就是他直接提供了你一個接近 VPS 的環境。（推測是 Amazon EC2）

<!--more-->

### 註冊

![螢幕快照 2013-09-08 下午1.02.44.png](https://user-image.logdown.io/user/52/blog/52/post/110431/3esmMA92SaSW49BKyL1v_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202013-09-08%20%E4%B8%8B%E5%8D%881.02.44.png)

直接在首頁填入個人訊息即可。

![螢幕快照 2013-09-08 下午1.03.14.png](https://user-image.logdown.io/user/52/blog/52/post/110431/KRuqld13QJ6XTwgCSesC_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202013-09-08%20%E4%B8%8B%E5%8D%881.03.14.png)

假設你使用我的推薦連結，那麼會多出一個預先填好的欄位（主要是雙方都可以得到額外的 NO<sub>2</sub> 關於這個之後會解釋）

需要填入的欄位依序是：

* 帳號
* 信箱
* 密碼

完成後會在信箱收到一封認證信，記得點選連結啓用帳號。

![螢幕快照 2013-09-08 下午1.06.52.png](https://user-image.logdown.io/user/52/blog/52/post/110431/dBQVfU1pSxiJqCCe4HeN_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202013-09-08%20%E4%B8%8B%E5%8D%881.06.52.png)
第一次登入會有 [Nitrous.io] 的簡介，如果不想看可以點選 `Skip Intro` 跳過，基本上就是介紹他們的運作機制。

### 創建盒子

官方用 `Box` 來稱呼每一個單位，其實當作是一個 Project 就好了，不過有趣的是其實裡面想開設幾個 Project 都不成問題，主要差別是每個 `Box` 都有其記憶體和容量限制而已。

![螢幕快照 2013-09-08 下午1.06.52.png](https://user-image.logdown.io/user/52/blog/52/post/110431/oKvf5qZTvSo7NfpxqbQX_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202013-09-08%20%E4%B8%8B%E5%8D%881.06.52.png)

登入後點選 `New Box` 就可以創建一個 `Box` 出來。

![螢幕快照 2013-09-08 下午1.13.07.png](https://user-image.logdown.io/user/52/blog/52/post/110431/R53USivaSdqAhsF4dIh4_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202013-09-08%20%E4%B8%8B%E5%8D%881.13.07.png)

裡面會要你選擇 `Stack` 目前支援 Ruby on Rails, Node.js, Python, Go 四種語言/框架。

之後依序把 名稱、地區、記憶體大小、容量設定好之後就可以點選 `Create Box` 之後稍微等一下就能夠使用了！

### NO<sub>2</sub>

在創建 `Box` 的時候，大家會注意到餘剩的 NO<sub>2</sub> 的量，這是 [Nitrous.io] 主要的收費方式，透過購買額外的 NO<sub>2</sub> 用於建立更大容量或者記憶體的 `Box` 不過剛註冊應該就會拿到 150 NO<sub>2</sub> 是足夠創建一個約有 700 MB RAM 的 `Box` 用於一般專案開發其實非常足夠。

![螢幕快照 2013-09-08 下午1.18.27.png](https://user-image.logdown.io/user/52/blog/52/post/110431/wt6bx2uaQeLFcPKR1Xfr_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202013-09-08%20%E4%B8%8B%E5%8D%881.18.27.png)

點選選單上自己 NO<sub>2</sub> 之後會看到這個頁面，透過實踐這些動作（大多是跟 Github, Facebook 等網站合作和安裝對應的工具）就可以獲得額外的 NO<sub>2</sub>  大致上來說可以在獲得約 150 NO<sub>2</sub> 的量，而剩下的都要依靠邀請朋友，不過僅有前十位朋友是 +10 NO<sub>2</sub> 之後似乎只會 +1 NO<sub>2</sub>。

### 功能概覽

![Nitrous.IO-4.png](https://user-image.logdown.io/user/52/blog/52/post/110431/4zFAKYDUSXqpG376mdBY_Nitrous.IO-4.png)

點開 `Box` 之後，可以選擇進入線上的 IDE 還是 Terminal 兩者都是非常不錯的（至少使用上來說都很順暢）

註：上圖是我用來教我妹的 `Box` 右邊多出了人的 ICON 就是協作的專案，而由對方加入你的專案並不會額外收取 NO<sub>2</sub> 不過缺點就是 Terminal 也都會使用同一個使用者

![螢幕快照 2013-09-08 下午1.25.30.png](https://user-image.logdown.io/user/52/blog/52/post/110431/iXPmSyqpReyz6X2mYMUK_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202013-09-08%20%E4%B8%8B%E5%8D%881.25.30.png)

Terminal 用起來非常順暢，大部份你想得到用於開發上的指令也都能夠使用，但是沒有 `sudo` 的權限。

至於 vim 和 eMacs 也都已經內建好，只需要將習慣的編輯器設定進去，都能夠輕鬆使用。

![螢幕快照 2013-09-08 下午1.36.28.png](https://user-image.logdown.io/user/52/blog/52/post/110431/nUhG6yhQGylqn7uBhME7_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202013-09-08%20%E4%B8%8B%E5%8D%881.36.28.png)

不過很可惜的，系統內的 ctags 似乎沒辦法讓我搭配 vim 的 taglist 使用（雖然我今天才發現我一直沒用這好用的插件）

身為協作平台，一定不會少 Git 的功能，而且很貼心的做過調整讓大家可以清楚目前的分支狀況。

![螢幕快照 2013-09-08 下午1.37.49.png](https://user-image.logdown.io/user/52/blog/52/post/110431/NC9uVodRsS85xJBgJloS_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202013-09-08%20%E4%B8%8B%E5%8D%881.37.49.png)

---

至於 IDE 大概除了程式碼區塊右上方有 `Collab Mode` 協作模式的按鈕外，沒有太多特別的地方。

![螢幕快照 2013-09-08 下午1.39.43.png](https://user-image.logdown.io/user/52/blog/52/post/110431/ul7JLRFZSKSpptjYX8wO_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202013-09-08%20%E4%B8%8B%E5%8D%881.39.43.png)

註：這個按鈕要雙方都點了才有效果，好處是可以看到其他人編輯狀況，但是不怎麼好用，只能知道有人跟你編輯同一個檔案。而且需要每個檔案都點選才能用（泛淚

右邊是聊天室，下面也有 Terminal 可供輸入。

點選聊天室上方的 ICON （協作狀態 `Box` 會多的那個 ICON） 可以設定其他協作者。
<del>不過他這似乎是 Bug 照理講我不是 Owner 應該是沒辦法設定的</del>

![螢幕快照 2013-09-08 下午1.42.27.png](https://user-image.logdown.io/user/52/blog/52/post/110431/ihsTwfs1QrqdcSkAnBuX_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202013-09-08%20%E4%B8%8B%E5%8D%881.42.27.png)

### 感想

其實還有很多地方需要改進，不過整體上來說有 Chatroom / Collab Mode 拿來教人非常好用，而且負責教授者也不需要消耗 NO<sub>2</sub> 就教學性質來說用途很大。

（可以搭配 Skype 之類的服用，直接講解 Code 和示範運作成果，多讚 XDD）

如果大家還有發現什麼有趣的功能也務必告知我一下喔 XDD


[Nitrous.io]: https://www.nitrous.io/join/kVSxoqwlyLw
