---
layout: post
title: '在忙，也要寫一下 NKO 2013'
publishDate: 2013-11-11 09:37
comments: true
tags: [JavaScript, Node.js, Hackathon, Flash, ActionScript3]
---
這篇必須是短文 XD

其實 NKO 2013 結束之後，我依舊還有著不少東西得完成⋯⋯

Ex. NKO 2013 的作品是學校的一項作業，還得繼續完善。

廢話不多說，趕緊來講講今年的 NKO 2013 吧 XD

<!--more-->

雖然 NKO 2013 從去年到今年，都是為數不多的隊伍然後聚在一起寫程式，跟其他 Knockout / Hackatho 比起來規模真的小太多了！

但是每次都是過最開心的活動，尤其是 Demo 的時候，更是快樂。

跟其他 Hackathon 比起來，雖然有排名之類的，但是其實少了很多那種「必須做個什麼厲害的東西」那種感覺，反而是是「做個有趣的東西」更能吸引大家的注意，所以在 Demo 的時候總是會有不少好笑或者有趣的事情。

像是喂食正妹也會增加飽食度的貓、在 Demo 的時候被其他人亂入還拿到了 Perfect 的成績等等，很多的意外，也很有趣。
至少大家都非常捧場，雖然我覺得去年比較開心拉 XD

不過比較可惜的部分我覺得反而是食物，便當對我來說有點太油了 XD （而且又是燒臘之類的，我幾乎沒辦法吃 QAQ）
另外不知道是不是空調太強還是空調機種問題，今年過了一天眼睛就非常乾燥而且不舒服，即使喝了不少水還是一樣，挺痛苦的 XD
（半夜找水喝想說為啥這麼燙，早上一看才發現飲水機寫說那個時間是消毒時間，我可能喝到消毒水了 XDD）

至於我們的作品，其實今年也趕不上國際的 NKO 很可惜。

我到現在也還是持續的 Debug 中，畢竟 NKO Demo 完畢，週三上課還得給老師個交代 XD

總之，先來一張開發中畫面給大家過過乾癮。

**注意，成品是 APP 以下截圖為使用 Flash 製作時的畫面**

![螢幕快照 2013-11-11 下午5.49.29.png](https://user-image.logdown.io/user/52/blog/52/post/159560/kCyN4Y91SpKaPsL6LaWS_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202013-11-11%20%E4%B8%8B%E5%8D%885.49.29.png)

![螢幕快照 2013-11-11 下午5.49.39.png](https://user-image.logdown.io/user/52/blog/52/post/159560/X1hxKxF3SXuDCq3aNYhy_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202013-11-11%20%E4%B8%8B%E5%8D%885.49.39.png)

![螢幕快照 2013-11-11 下午5.50.05.png](https://user-image.logdown.io/user/52/blog/52/post/159560/PThjct8lR8mSzQPRnwRd_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202013-11-11%20%E4%B8%8B%E5%8D%885.50.05.png)

其實現在已經可以看到連線狀態下的其他使用者，不過移動還有問題（像是會卡住或者不斷切換方向等問題）

這部分大概就是週三前得完成的部分，以及 Deploy 到線上的伺服器（目前預定是最近開始支援 Websocket 的 Heroku）

至於技術部分，伺服器今年有認真做出可以使用者認證的功能。

一樣採用 Socket.io 不過加入了 Passoprt & Mongoose 來做使用者驗證和資料儲存。

而客戶端部分則用 Flash 雖然大家覺得他不太行，但是 Adobe AIR 對設計師來說仍是個好工具，運用得宜的話其實可以省下不少力氣。

註：像是我們的紙娃娃系統就是直接在 Flash 裡面處理成動畫，待我們的動畫師完成後，我只需要用程式去切換每一個部件對應的動畫即可。

關於這方面的技術我想之後會找時間寫一篇「元件化的 Flash 互動設計」來討論，像是動畫師完成後會出成為一個 swc ( 類似於 dll 或者 so 檔 ) 而開發者可以直接透過 new ClassName 的方式把某個組件產生出來。

之後應該還會做一些進階的測試，像是透過 Flash Builder 產生 SWC 後，讓動畫師在 Flash 套用，並且重新輸出成新的 swc 而成為一個能夠自我管理的物件之類的。

好了，繼續來忙作業跟除錯 XDD
