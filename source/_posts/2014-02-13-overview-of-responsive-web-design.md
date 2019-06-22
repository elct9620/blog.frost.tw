---
layout: post
title: '概觀響應式網頁設計'
date: 2014-02-13 11:10
comments: true
tags: [Web, 經驗, 設計, RWD]
---
這周都在忙 SITCON 的網站，結果就錯過週二寫 PaaS 入門指南的時間了（剛剛看 GA 還發現大家都已經習慣週二來晃～）
這篇文章其實是順便當寒假作業（雖然老師沒強制，不過剛好可以複習跟檢視我對 RWD 的熟悉度）

其實我一直對 W3C 標準跟歷史不太熟，所以沒辦法像許多高手根據標準跟歷史來討論這些網頁技術上的問題。
不過還好，我多少算是有經驗跟實作，以下就從我所「知道」的 Responsive Web Design 來談談吧！

這邊文章大致上會從這些方向去討論：
* Responsive Web Design 的過去
* Responsive Web Design 的現在
* Responsive Web Design 的工具
* Responsive Web Design 的運用

我想又會是篇很長的文章，大家就泡個茶慢慢讀吧 XD

<!-- more -->

## 過去

原本是想找以前曾讀過的一篇文章來當佐證，不過看起來似乎是無法找到。

這個小節，我想討論的是在 CSS3 還未出現前，是否有實作 RWD 的可能性呢？（在我印象中，有類似的技巧可以做到，不過並沒有現在 CSS3 所處理的如此完善。）

在 CSS3 的 Media Query 出現之前，我們能怎樣做最基本的 RWD 呢？

* width
* float

我想大概就是運用這兩者來做出對應的效果。

過去在 RWD 出現前，我們通常習慣用以下這種結構來設計網站。

* wrapper (width: 1000px)
	* header
  * main-frame
	  	* content (float: left)
  		* sidebar (float: right)
  * footer
  
也就是說，寬度是固定內容再依照寬度劃分。
其實這在手機、平板出現前，大部份人的電腦螢幕都是 1024 x 768 解析度的情況下，非常合理。
當時我真的覺得這種方式「太好了！」因為少了寬度的對應，很多編排方式會變得簡單。

不過只能使用 `witdh` 和 `float` 的情況下，實作 RWD 的可能性還有嗎？
扣掉單欄式的設計，我想起我的第一本 HTML / CSS 書上面並不是用這種方式教我設計版面的，書上的做法是用百分比設定寬度。

* container (width: 100%)
	* header (width: 100%)
  * main-frame (clear: both)
  		* content (width: 75%, float: left)
      * sidebar (width: 25%, float: left)
  * footer (width: 100%)
  
以這個情形來看，至少在不同大小的顯示器上，多少能夠縮放了！
不過，各方面來說都很不人性化，到了極小的螢幕，側邊欄也許都變成只能容下一個字的大小。

雖然腦內模擬了各種方法，但是還是找不出適當的方法能夠在適當時機將內容拆爲上下兩部分。
（即使可行，也會受到 wrapper 的阻撓啊 XD）

不過，關於[響應式網頁設計](https://zh.wikipedia.org/wiki/%E5%93%8D%E5%BA%94%E5%BC%8F%E7%BD%91%E9%A1%B5%E8%AE%BE%E8%AE%A1)其實也是這幾年才被提出來的，很新的概念。

對過去的設計師來說，用百分比的方式規劃寬度，算是一種相對彈性的做法而已。

## 現在

這幾年智慧型手機、平板的普及，也讓許多網站不得不考慮手機版，或者製作一個 App 來給使用者使用。而其中一種看似較為容易的解決方式，響應式網頁設計也被提出，並且加到 CSS3 裡面（雖然我認為要做好 RWD 其實並不簡單）

不過 RWD 的概念其實是非常容易理解的，前面在討論以過去的方法實做 RWD 的時候，我們遭遇了一個問題「寬度」當寬度大於螢幕的時候，就會產生橫向的捲軸，但是這違反大家操作的習慣。因此我們不希望出現橫向的捲軸，但是一旦設定了 wrapper 就無法做出對應，即使改用百分比，也會因為比例關係而被壓縮過度。

因此，我們在 CSS3 使用 [@media](https://developer.mozilla.org/en-US/docs/Web/CSS/@media) 來作出調整，其實這是一個被我們遺忘一段時間的 CSS 語法，在 RWD 的時代中，被賦予了全新的[意義](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Media_queries)。

我們透過判斷 `min-width` 與 `max-width` 來對不同「大小」的顯示器做出對應。

```CSS
@media only screen and (max-width: 480px) {
 /* Some CSS for screen width less than 480px */
}
```

這下寬度的問題解決了，我們只要依照數種解析度設置 wrapper 的寬度即可。
Ex. 480px > 400px, 1024px > 1000px

只要能夠針對「顯示裝置」可顯示的大小來調整寬度，那麼問題就迎刃而解了！

不過，同時也衍生出了新的問題。

* 我的選單放置在側邊欄（Sidebar) 但是這樣畫面就被占滿了！
* 兩欄式的架構對小螢幕來說依舊吃力
* 資訊太多了，在小螢幕上難以閱讀
* 圖片大大，小螢幕根本無法看到全圖

還有各式各樣的問題，過去那個針對 1024x768 解析度的技巧都不管用。我們已經習慣了精美而華麗的視覺呈現，但是現在卻要在極小的解析度下，完成這些任務。內容元素的控制、按鈕的大小、選單的呈現都變成新的難題。

關於這些問題，可以參考 [evendesign blog 的文章](https://blog.evendesign.tw/post/48853824439/rwd-test)上面列出了幾項較為常見的問題，不過我想很快就會碰到超出以上的問題，這些都還是基本，問題會隨著我們的想像力與創意而增長。

這是我們的現況，也是必須面對的問題。

而且，我們也必須意識到我們實際上面對的螢幕解析度，可能有數百種以上，而這些解析度也許會因為 1em (以預設值來說是 16px) 的誤差，而讓畫面的呈現有所差異。

甚至，我們還必須面對 Protrait （直立）和 Landscape （橫放）兩種方式瀏覽的使用者，在那小小的螢幕中，所看到不一樣的世界而做出各種對應。

註：以我自己的例子來說，因為還有不少網站沒有 RWD 所以有些朋友就習慣橫放來瀏覽網站，因為手機的縮放是以寬度為基準，橫放的縮小比例較低，通常能讓文字呈現在可閱讀的範圍。但是也很可惜的，橫放的狀況下，許多選單設計都會變成操作上的障礙，更糟糕的是可能連內容都出現閱讀障礙。

## 工具

不過，撰寫 Media Query 其實非常累人，而且是「每一種螢幕大小一個檔案」的形式在撰寫，各種意義上都非常吃力。
（假設我想調整 wrapper 的寬度，但我卻得在三四個檔案中切換、修改，這非常的吃力。）

當然，這樣吃力不討好的問題大了！隨著 RWD 的需求越來越多、越來越高，甚至需要針對數十種解析度設計，這樣對我們來說已經超越個人能夠處理了，同時 CSS 的複雜度也不是過去能比的（十年前我們可能就是設定色塊、字體大小和顏色，現在連陰影、漸層、動畫都在 CSS 中設計），因此出現了 CSS Preprocessor (預處理器) 來輔助這項工作。

當然，你可以選擇不使用。但是當一個網站規模非常大的時候，我認為善用預處理器會幫上你不少忙。
（以我最近的作品來說，轉換回 CSS 就有 1600 行之多，我想不論是誰都會對編輯這樣龐大的檔案感到吃力，而我實際上卻只寫了 500 ~ 800 行左右，相對來說速度快上一倍。）

關於預處理器，市面上就有 [SASS](https://sass-lang.com/)、[LESS](https://lessCSS.org/)、[Stylus](https://learnboost.Github.io/stylus/) 數種，我個人則是習慣使用 SASS 作為輔助工具。

那麼，每次都要寫 `@media only screen and (min-width: 480px)` 肯定是非常浪費時間的，透過預處理器的巨集（我這樣形容會比較恰當，像是 SASS 中就稱為 Mixin）功能，我們可以將不少重複性的動作簡化成一行。

關於將 Media Query 製作成 Mixin 的方法，可以參考 WebConf 2013 年 hlb 大大演講的[簡報](https://speakerdeck.com/hlb/maintainable-CSS-with-sass-and-compass)雖然只是其中一頁，但是非常有用。

不過，我們仍有更快速的方法可以達到目的。
使用 SASS 的擴充 - [SUSY](https://susy.oddbird.net/) 能讓我們快速的建構擁有 RWD 功能的網站。
關於使用的技巧，建議參考 Even Wu 大大在 2013 年 COSCUP 的 Hands-on 活動的[簡報](https://speakerdeck.com/evenwu/rwd-xiao-shi-jiu-shang-shou)裡面清楚了說明最基本的使用技巧。

不過，這些工具也都需要有相應的知識才能運用自如，我目前也還對這些工具的運用不太熟練。但是，使用了這些工具，能夠協助你更快完成工作，而且是隨著熟練程度而加快。

## 運用

終於寫完三個小節，我想內容也有一定的量。
大家稍作休息後，我們來看看如何運用 RWD 讓網頁能夠自動適應各種螢幕大小吧！

以下的範例會使用 SUSY 來撰寫，順便補足前面提到的「分散檔案」的解決辦法，也能夠順便觀察到預處理器的優點。

下圖是今年 SITCON 2014 的截圖，分別是使用電腦（27寸螢幕）以及手機（寬度 640px 左右）的呈現。

![螢幕快照 2014-02-13 下午8.35.29.png](https://user-image.logdown.io/user/52/blog/52/post/178816/WdsE5XaaShtUvip7zfyR_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-02-13%20%E4%B8%8B%E5%8D%888.35.29.png)

![螢幕快照 2014-02-13 下午8.35.57.png](https://user-image.logdown.io/user/52/blog/52/post/178816/aTqIJyEfRJynPMzTi4Az_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-02-13%20%E4%B8%8B%E5%8D%888.35.57.png)

除了選單收和之外，也注意到內容的呈現也有些許不同。

透過 RWD 我們可以做到這些事情：

* 顯示、隱藏元素
* 改變大小
* 改變資訊流
* 改變顯示的方式

也許還有我沒有想到的，不過我們可以透過 RWD 在適當的情況隱藏資訊或者調整呈現的形式。

那麼，馬上用兩段語法來實作觀看效果會比較容易。

```html example.html
<!DOCTYPE html>
<html>
	<head>
  	<title>Responsive Web Design Example</title>
		<link href="example.CSS" rel="stylesheet">
  </head>
  <body>
  	<header>
    	<h1>Example</h1>
    </header>
    <div id="main">
   		<aside id="sidebar">
      </aside>
      <section id="content">
      </section>
    </div>
    <footer>
    	&copy; 2014 Frost.tw.
    </footer>
 	</body>
</html>
```

假設我們有一個如上結構的網頁。
* header
	* main (wrapper)
  		* sidebar (4 columns )
    	* content ( 8 columns )
* footer

接著我們也許會想在 PC 上將 Sidebar / Content 以左右區分出來（分別是四欄與八欄）

以下用 SCSS (SASS) 作為範例，我習慣使用類似 CSS 的格式，但一樣都是 SASS。
```sCSS example.scss
@import "susy";

header {}
#main {
	@include container; /* 產生容器，寬度 59em */
}

#sidebar {
	@include span-columns(4 omega); /* 四欄，並且 float: right; */
}

#content {
	@include span-columns(8); /* 八欄，並且 float: left; */
}

footer {}

```

我想大致上跟過去的做法差不多，不過似乎省略了不少語法（像是 `margin: 0 auto;` `clear: both;` 之類的）

那麼，假設我們希望在手機時隱藏側邊欄，讓身為重點的內容留下。

```sCSS example.scss
@import "susy";

$total-columns: 4; /* 預設四欄 */
$pc: 59em 12;

header {}
#main {
	@include container; /* 產生容器，寬度 19em */
  @include at-breakpoint($pc) {
  	@include container; /* 產生容器，寬度 59em */
  }
}

#sidebar {
	display: none;
  @include at-breakpoint($pc) {
  	display: block;
		@include span-columns(4 omega); /* 四欄，並且 float: right; */
  }
}

#content {
	@include span-columns(4); /* 四欄 */
  @include at-breakpoint($pc) {
		@include span-columns(8); /* 八欄，並且 float: left; */
  }
}

footer {}
```

我們只要設置 `at-breakpoint` 就可以完成對不同裝置的設定。

不過我想大家可能會有所疑惑，為什麼是「由小到大」的設定呢？這是因為 SUSY 是一款「Mobile First」的 Grid System 所以預設的「寬度」是以 `min-width` 來計算，也因此觸發不同解析度設定的情況就是「螢幕大小大於 N」所以才會從小到大設定。

不過 Mobile First 也是一門學問，大家有空也可以去研究看看這個「理論」是怎麼看待手機到電腦，甚至電視的網頁設計。
（簡單來說，就是從最小的螢幕開始設計，並且不斷增加內容與顯示的資訊）

這部分也可以稱之為「漸進式增強」大家可能在前面的 Wiki 說明看到，推薦一個[演講](https://www.youtube.com/watch?v=hdTxeR90_1E&list=PLtOt4SBR2JYDDXnH9ZFnnhe4AyEK6hohF&index=1)可以了解到關於這個概念。
（大概來看，網頁設計也是有層次的，依照裝置的支援性，呈現不同等級的內容）

不過，其實很多時候都是以 PC 版為主，之後才補上 RWD 的部分。除非是已經事前確定要支援 RWD 不然初版大多都是 PC 版本。但這並不影響 SUSY 的使用，預設是 59em + 12 column 剛好接近大家習慣的 960gs 的規格，等 PC 版完成後，將總欄數調低然後將 PC 版特有的部分移動到 `at-breakpoint` 規則中，也是非常快速的。

總而言之，選擇適當、習慣的方式處理就可以了！

## 小結

不知不覺又是幾小時過去，差不多是給這篇文章做一個簡單的結尾的時候。

在我的印象中，大約兩年前左右有 RWD 的網站對大家來說都還是「好炫！」的狀態，不過到了一年前，就變成「這傢伙沒做 RWD 真不應該！」可見這個時代對 RWD 的需求是非常高的。

畢竟有些網站使用平板、手機拜訪的使用者，可能遠大於使用電腦的使用者。
（有不少網站都挺適合在搭車或者工作時休息稍微看一下，像是新聞網站我就覺得很常用手機看）

也因此，掌握 RWD 的技巧對一個網頁設計師來說幾乎是必備的技能。

不過，使用 RWD 的時候，我們也該重新思考網站的意義與定位。
在手機上，我們只有非常有限的解析度可以使用，也因此內容的呈現變得非常重要。

另一方面，因為使用點擊螢幕的操作方式，也讓網站的互動方式產生改變，在規劃 RWD 的時候也必須考慮到這些問題。
（我想大家都有用手機點擊按鈕無法順利按下去的情況，這也是我們必須考慮的項目之一。）

希望這篇文章可以讓大家對 RWD 有一個比較初步的了解。
