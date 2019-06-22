---
layout: post
title: 'The CSS3 Transition'
date: 2012-05-08 21:02
comments: true
tags: 
---


好久沒寫，今天來分享一下應該是我本業的網頁設計相關文章 XDD

前幾天在 Google Reader 上看到 [Zespia](https://zespia.tw/) 換了新佈景，原本的佈景也是目前這個網誌用的 [Slash](https://zespia.tw/Octopress-Theme-Slash/index_tw.html) 不過因為使用者越來越多，所以站長決定換新佈景～

接著，我看到那中間的 "Z" 字 Logo 那透明度緩緩的恢復的效果非常的有興趣，於是，我開始了調查……

<!-- more -->

原本以為是用 JavaScript 所製作的效果（像是 jQuery 就有 Fade IN/OUT 的效果）不過仔細一看原始碼，就發現「我錯了！」

裡面用著一個名為 transition 的屬性，好奇心一來就開始 Google 使用方法。

嘗試幾次後，大概了解使用了！
（中文叫做「漸變」用途大概就是在 CSS 設定值變化時提供一個漸進的變化）

不過以目前瀏覽器大戰的情況來看，用純 CSS 撰寫實在吃力不討好，於是我就用了 [Compass](https://compass-style.org) 稍微輔助。

``` sCSS site.css.scss

@import "compass";
@import "compass/reset";
@import "compass/CSS3"; //屬於 CSS3 的功能

@include global-reset; //CSS Reset

body {
	padding: 10pxl
}

//漸變方塊
.box {
	background: adjust-lightness(blue, 30);
	width: 50px;
	height: 50px;
	@include opacity(0.7); //透明度 30%
	@include border-radius(50%); //呈現球體
}

.box:hover {
	@include opacity(1); //透明度 0% (不透明)
	@include transition-duration(0.3s); //0.3秒完成漸變
}

```

之後在業面上套用屬性，游標一過去之後就會發生變化～

``` html

<div class="box"></div>

```

假設漸變設定在 .box 而非 .box:hover 上，那麼漸變的情會如下：

1. 瀏覽器初始化元素
2. 瀏覽器套用 CSS 屬性 (第一次漸變，會從 0px * 0px 漸變成 50px * 50 px)
3. 觸碰觸發漸變（透明度 30% > 0% ）

假設是如上述程式碼來做，那麼第二步驟（變大）的建變就不會有。
所以依照這個原理，在構成頁面區塊時只要設定上建變，就會出現開打開網頁，內容區塊會放大到相應大小的情況。
> 不過我想只限於內容少於區塊大小的狀態

大致上就是這樣摟～

最近感覺繪畫上的能力進步不少，之後應該也會針對 Illustrator 多加努力，希望之後可以有一套自己風格的網頁設計～ 
