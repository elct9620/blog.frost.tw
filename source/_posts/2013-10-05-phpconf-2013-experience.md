---
layout: post
title: 'PHPConf 2013 會後心得'
date: 2013-10-05 15:30
comments: true
tags: [生活, 心得, PHPConf]
---
仔細想想，從 2011 年的 PHPConf 到現在也已經第三年了⋯⋯

第一年是會眾，第二年是工作人員，第三年是作者（投稿文章）每年參加 PHPConf 大概是我的例行公事。
在資訊相關的歷程中，陪伴我最長時間的程式語言就是 PHP 一直都有一份無法割捨的感情，即使已經很少用 PHP 開發東西了⋯⋯

不過，在我學習過這麼多種程式語言（PHP, JavaScript, ActionScript, Lua, Ruby, Java, etc） 之後，其實我認為各種語言大多有它特別的性質，有愛就好，而 PHP 大概就是對於「新入門的網站開發者」有著不錯的親和力。

那麼，今年的 PHPConf 如何呢？

<!-- more -->

### 報到

今年很多活動都是搭好友 Poka 便車過去（大部份時候都是去同一個地方）一早我們就慢慢的過去（笑）而且 Poka 還跟我說，他原本想下午在過去，因為他在下午才演講。不過為了第一場 Keynote 只好早起了 XDD

今年用活動通的 QR Code 報到，其實是非常快的。不過很可惜的是像是 Poka 為講師，但是都沒有被詢問或者使用特殊的 QR Code 報到（結果他就把攜伴用的 VIP Code 給自己刷了，可以吃兩份便當 XDD）

而我則是作者，拿的是 VIP 票，不過也能夠拿到 T-Shirt (沒有印章很傷心，明年一定要轉職講者 XDD) 但是報到時也沒有被告知（我猜是 QR Code 沒有提供區分功能）

這部分是挺可惜的地方（晚宴也是手動被登記上去，總覺得雖然作者貢獻沒有講者的大，但是也還是一起印上去比較好吧 QAQ）

### 矛盾大對決 - 能入侵任何網站的駭客 vs. 絕對不會被入侵的網站

我想今年最大的賣點肯定就是這場了！一定有很多人為了來聽這場而早起（笑）
不過這場只有一個重點「看！駭客就是這樣黑掉你網站的！」
我猜，一定很多人都得了一種會在 PHP 網站的網址列加上 ?-s 的病，這東西實在是太愉悅了 XDD

攻擊方 - Orange
<script async class="speakerdeck-embed" data-id="b2c3d1d00f980131db540ec6a19e6e26" data-ratio="1.33333333333333" src="//speakerdeck.com/assets/embed.js"></script>

防守方 - Allen Own
<script async class="speakerdeck-embed" data-id="7d5ca8400f9b01319db11e8df61cf546" data-ratio="1.33333333333333" src="//speakerdeck.com/assets/embed.js"></script>

這兩份投影片很清楚的說明 PHP 網站最基本會有的漏洞，我想這些都處理好基本上就不會被 ?-s 病患者之類的騷擾了吧 XDD

### 實戰 Phalcon Kernel

其實說真的，最近幾年寫 PHP 的人的確感覺越來越少了⋯⋯
因此今年的主題都落在如何讓 PHP 逆襲這件事情，前哨戰就由阿土伯介紹的 [Zephir](https://zephir-lang.com/) 這套神兵來解決了！

Zephir 是什麼？簡單說就是用 Very (Super) like PHP syntax to write a PHP Extension.
用非常類似於 PHP 的語法方式去寫一套 PHP Extension (原本需要用 C 但是現在你不用了！)

結束後實際嘗試了一下，只能說 It is magic! 之後會寫一篇文章來分享這個東西⋯⋯

### SiteTag 系統窮人調校法經驗談

這場真的是非常扎實的調校和各種「窮人」的解決方案分享。
不過我似乎開始放空（前有 Zephir 不玩一下怎行呢 XDD）

不過裡面也提到了很多特別的使用技巧，這真的是要靠創意和靈感才能發現的。
像是把 CDN 當 NoSQL 的方式來使用（透過把網址當 Key 產生檔案，就能做出不會死還很穩定的 API）雖然僅限於非完全即時的 API 就是了～

講者 [Tsung](https://blog.longwin.com.tw/) 也是大家查資料經常會找到的高手，今年也終於有機會看到本人了！

### 進擊的快取 - 以 Drupal 的快取核心為例

今年只有這場跑到 R2 聽，畢竟我挺好奇 Drupal 這麼複雜的系統到底怎麼做快取的。
沒想到 Drupal 幾乎把全部的東西都快取，不過也許真的是被迫於效能瓶頸，必須這樣做才能取得平衡吧！

大概是午飯剛吃飽的關係，放空很多。不過大致上就是⋯⋯ Drupal 什麼都能快取得感覺（被拖走

### 5 Easy Ways To Speed Up Your Web Application

英文演講，所以大家都跑光了吧（笑）
剩下的除了有興趣就是想練習英文聽力的朋友，雖然我根本不在意聽不聽懂就是了⋯⋯
（因為外國人來演講比考試的聽力講得還好懂 Orz）

原本以為是會講一些很神奇的技巧（畢竟標五年經驗以上）結果還是告訴大家⋯⋯
「乖乖做好那些一講再講的基本優化技巧！」

像是圖片壓縮、減少請求、設定正確的 Header 等等，看起來不管怎樣，基礎做好還是最重要的～

### 實戰 AssetToolkit

c9s 大神的演講，一定要來聽一下。 
<del>所以我就沒有去亂 Poka 問他為什麼都是貓了！雖然有沒有貓我不知道 XDD</del>

不過結束後我除了發現 c9s/Onion 這個專案原來可以很方便包 phar 之外，好像還是不懂 AssetToolkit 該怎麼用比較好（撞牆）

不過 Onion 確實是個神奇的專案，大家可以裝看看（雖然 README 的安裝方法不能用，但是可以直接 clone 下來）
就我目前觀察到的 AssetToolkit, 後面 LT 的 PHPBrew 都是用 Onion 包的，神推薦要做 CLI 用這套（誤

### PHP 也是可以很 event - 用 PHP 打造一個 Realtime Web

開始的時候 PHP 逆襲一次，結束的時候再來一次！

「不管怎樣，用 C(4) 就可以解決！」 裡面介紹 PHP 的 Event (libevent) 套件，可以讓 PHP 得到不科學的效能。
不過 PHP 確實也是個很妙的語言，平常就是個表現普普的語言，但是有了神裝（PHP Extension） 戰鬥力馬上破錶 XDD

之後還有示範 [PHPSocketIO](https://Github.com/RickySu/PHPsocket.io) 這個套件，用 PHP 實作 Socket.io 的功能。

所以我得出一個結論「只要有 C，人人都可以成為大神（誤」
PHP Extension 還是一塊未被發掘的新大陸，現在有了新工具，我想 PHP 也會開始有所改變吧！

### Lighting Talk

PHPBrew - 不解釋，神裝。還沒裝的馬上安裝就對了⋯⋯
向 PHP Framework 邁進 - 沒有 Slider 的演講，不過確實給大家一個往 PHP Framework 的道路給了一個方向
寫好前端，不要搞瘋你的 PHP 後端工程師 - 很有趣的演講，其實不管前端後端，只要一邊沒弄好就是搞瘋大家 XDD
當 Nexmo 遇上 PHP - 聽風太緊張了拉 XDD 不過語音的部分沒成功有點可惜，但是能說中文是爆點好像忘記提醒一下了 XDD
我的密碼沒加密，你的呢？ - 糟糕，我有幾組舊密碼在得獎名單上啊 Orz

---

### 會眾狀況

今年雖然歡樂氣氛仍舊在，但是感覺變冷清。連 IRC 的 Log 都沒有以往的多，挺可惜的⋯⋯
明年希望可以變回以往的熱鬧氣氛 XDD

### 晚宴

<del>除了沒有印章的遺憾，我就沒有其他遺憾了</del>

晚宴真的是驚人的高級，不過最重要的是我們 SITCON (學生計算機年會) 竟然已經佔了講師/工作人員的 10% ~ 15% 左右。
我想再過幾年，我們 SITCON 的成員大概會變成各大 Conference 的重要成員了吧！

其實這是很不錯的開始，從學生開始學習經營社群，然後投入到各大社群裡面。之後 SITCON 也會慢慢和各社群合作，這種相輔相成的感覺很棒，也希望之後這些社群的活動能夠更蓬勃，然後做出更多改變。

---

噢耶！我寫完了耶！
