---
title: RubyKaigi 2018 會後心得
date: 2018-06-12 21:28:36
tags: [心得, RubyKaigi, Ruby]
---

今年的 RubyKaigi 比去年提早不少，作為 Ruby 開發者最大的盛會，今年也不意外的延續去年探討 Ruby 3 的可能性跟更多 Ruby 的深度應用。也因次，不意外的讓大家都聽的似懂非懂，而且還讓我感覺一年比一年的難度更高。

總之，來看看今年的 RubyKaigi 吧！

<!-- more -->

## 第一天

因為飛機的關係，我們提早一天飛到日本。雖然跟平常上班一樣時間出門，不過從機場候機到旅館，已經是晚上七八點了。所以我們就在旅館附近找間燒肉店稍微吃了一下。

![2018-05-29 21.05.30.jpg](https://blog.frost.tw/images/the-rubykaigi-2018-experience/EE88DB6FB245BFAEC9D20ED81425CC10.jpg)

## 第二天

因為提早一天，所以今天基本上就是體驗在日本遠端工作的感覺。不過實際上其實能做的事情不多，再加上中午去吃完仙台有名的牛舌後，馬上跑去附近買衣服。因為這次的旅館剛好都沒有可以投幣洗衣，送洗的話一件大概可以買一件新衣服，因為回來的路上順路就順便買了一下。

![2018-05-30 13.52.02-1.jpg](https://blog.frost.tw/images/the-rubykaigi-2018-experience/95C6311914F56CD7F7A815208649A0CA.jpg)

晚上則是 Pre-Party 簡單來說就是從這個時間點開始，喝酒！

## 第三天

依照慣例，都是由 Ruby 之父 Matz 進行開場，而口譯也是跟往年一樣讓人非常想睡。

> 因為讓人很想睡的原因，所以以下就盡量依照記憶紀錄一下。

## Analyzing and Reducing Ruby Memory Usage

算是非常實用的一場演講，裡面介紹了一些方法去分析在 Ruby 裡面跟怎麽去分析記憶體使用的方法。不過很明顯的，中間那段都睡死了，幾乎沒有印象。只有很零碎的記憶，大概需要靠看投影片或者錄影才能回憶起來了。

## 午餐

其實跟京都（2016）年比起來，我覺得便當品質差了很多。但是也可能是因為京都那邊對這種精緻食品比較擅長吧，去年因為是自由覓食，附近又有商店街所以反而沒有這樣的問題。

![2018-05-31 11.52.27.jpg](https://blog.frost.tw/images/the-rubykaigi-2018-experience/10B903ACACBB43486711ACACFEFEA2FD.jpg)

## TTY - Ruby alchemist’s secret potion

如果有用過 Google 的 Fastlane 來自動化 App 的打包跟部屬的話，講者花了五年所寫的 `tty` gem 就是背後的元件之一，這個 `tty` gem 裡面有非常多不同的功能，像是顯示表格、進度條等等。

如果想要寫一些 Command Line 工具卻不知道該怎麼下手的話，可以考慮使用這系列的 Gem 來輔助。

> 自己是習慣在不使用 Gem 的狀況下開發，不過有很多功能透過這套 Gem 來協助可以得到比較好的使用者體驗。

## Lightning Talk

因為要準備 Lightning Talk 所以錯過了幾場，雖然今年還是沒有順利的投稿上。但是運氣不錯還是獲得了五分鐘讓我發表 `tamashii-bluetooth` 這個新的 Gem 給大家。

雖然原本想作為 2019 年的主題之一，不過趁著還沒有被忘記就趕快上台發表一下這個從 BLE (Bluetooth Low Engery) 技術所衍伸的 iBeacon / EddenStone 應用，透過 `tamashii-bluetooth` 就可以輕鬆實現像是 LINE Beacon 之類的功能。

## Offical Party

依照慣例會有 Offical Party 跟當地的特色食物跟酒，不過依舊是日本人立場強大。不過有碰到客戶公司的工程師，合作半年多這麼久第一次見面。倒是客戶對我的工作狀況蠻滿意的讓我很意外，畢竟總覺得因為一直在解 Bug 感覺進度一直都不多。

## Controlling Droids™ with mruby & Go

這場原本還蠻期待看到 mruby 跟 C 語言搭配使用，不過現場聽了之後反而有點失望。單純只是利用 Golang 來處理底層的問題，至於 mruby 只是作為一個腳本語言嵌入到 Golang 裡面來實作。

不過也得到一個靈感，就是明年可以考慮把 `tamashii-bluetooth` 更加完善，然後提供一個純 C 跟 Ruby 的實作。

## Guild Prototype

這場在 RubyElixirConf 2018 其實也有講，不過因為作為工作人員所以無法聽到。不過因為大致上的實作在台灣朋友都跟我解釋過，所以對 Guild 已經比較有概念。

## mruby can be more lightweight

這場比較失望，原本以為會有一些關於 mruby 優化調整或者修改的部分，不過大多還是針對 Matz 在設計 mruby 上可調整的選項上來做處理，所以實際上並沒有什麼太多的突破。

## Firmware programming with mruby/c

這場就讓我比較驚訝，在台灣蠻有名的獺祭清酒的相關監控，就是透過這套 mruby/c 的 IoT 裝置來做監控，而且不像是 mruby 是設計給 CPU 等級的硬體，而是給 MCU 這種幾乎只有非常小的記憶體可以使用的硬體。

![2018-06-01 14.45.00.jpg](https://blog.frost.tw/images/the-rubykaigi-2018-experience/13538EFCE8A9329EBB787B50C63CA73B.jpg)

## ESM Drink-up

再來就是據說清酒很強的 ESM 贊助商 Party 了，這兩年都有機會去到算是運氣蠻不錯的。不過還是一樣有強大的日本人力場在，讓人不禁地覺得應該要學一下日文才行。

![2018-06-01 19.15.40.jpg](https://blog.frost.tw/images/the-rubykaigi-2018-experience/DB871BE6142FE005F2C5170398539BBA.jpg)

## 第三天

因為很想睡（一般來說第二天會特別狂歡）所以上午幾乎都在睡，下午有印象的大概就只有一場。

## Three Ruby performance projects

算是去年比較震撼的一場，講者是 RedHat 的工程是 GCC 的貢獻者，所以在 Compiler 上面有非常多不同獨到的見解，不過每次也是最為燒腦的議程。每年也可以學到一些不一樣的知識，不過大多都非常難以理解，以及回到台灣後需要查詢不少資料才能搞懂。

## After Party

晚上的 After Party 是在一間蠻大的酒吧，原本是想早點回去，畢竟日文立場還是很強大的。後來幾位同事想要去唱日本的卡拉 OK 想想覺得可以順便練習一下日文，就跟著過去。

![2018-06-02 23.26.58.jpg](https://blog.frost.tw/images/the-rubykaigi-2018-experience/ED4E33737BF002BDF65739EAB77D58B5.jpg)

## 東京

因為要去拜訪客戶所以還安排了到東京的行程，在地圖上感覺是往北結果是往南。到了東京才發現仙台的天氣真的超讚，在台灣可能有三十幾度的溫度下，在仙台還是只有二十幾度，非常的舒適。

比較特別的就是同事有預約到 Persona 5 的主題餐廳，以及在秋葉原終於理解夾娃娃機該怎麼夾。

![2018-06-03 18.35.42.jpg](https://blog.frost.tw/images/the-rubykaigi-2018-experience/F87A7CB27AB13B8B604F16B071BA7CEC.jpg)

![2018-06-04 11.35.43.jpg](https://blog.frost.tw/images/the-rubykaigi-2018-experience/5C138CFC021AA9946D6907837313D5C8.jpg =3096x5504)

最後則是去拜訪一下客戶，然後就結束這次的日本行程。

另外比較的別的是日本有不少電腦書都是動漫風格的，有漫畫的電腦書超想要的！！

![2018-06-04 14.11.51.jpg](https://blog.frost.tw/images/the-rubykaigi-2018-experience/BEFCEC952C4A354900876931339F3EC0.jpg =3096x5504)

## 後記

每年參加完 RubyKaigi 之後都會覺得蠻熱血的，因為有不少新的技術跟想法被提出來。不過每年都要提早一個月，填坑都來不及了還要想辦法投稿，大概也是另一種壓力來源吧。

> 希望明年投稿之前可以把要投稿的題目實作出來。
