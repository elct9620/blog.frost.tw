---
title: 為什麼要學習 Bootstrap 呢？
publishDate: 2018-11-27 21:07:50
tags: [心得,前端,Bootstrap,CSS]
thumbnail: https://blog.frost.tw/images/2018-11-27-why-we-choose-the-bootstrap/thumbnail.jpg
---

最近在工作上或者跟有在做網站開發的朋友聊天，都剛好會討論到 [Bootstrap](https://getbootstrap.com/) 這個 CSS 框架。

在業界，我想大部分的公司也大多會以 Bootstrap 為基礎來開發網站，而這幾年網路上可以買到的版型也多以 Bootstrap 為主。

從這些跡象看起來，會使用 Bootstrap 很重要，中間的過程跟原因是什麼呢？

<!--more-->

## 很久以前

最早的時候，我們在製作網頁大多還是透過像是 `<table>` 跟 `float: left` 等等變化去組合網頁，當時其實大多沒什麼概念，能跟後端的程式搭配起來就好了。

像是 PHP 早期就會將 HTML 和 PHP 混合在一起撰寫，而很多程式語言最初也都是用類似的方式動態的組合 HTML 並且將它輸出到網頁上。

不過，當專案越來越大的時候，這看起來就不太好維護了！

## 樣板引擎

像是 Ruby 中有 `ERB`、`slim` 可以使用，或者 PHP 有 `Twig`、`Smarty` 等等，為了能將程式的邏輯部分跟顯示的部分分離出來，開始出現了樣版引擎這種類型的工具，讓我們可以將工作區分為負責邏輯部分以及顯示部分兩個區塊，只要數值能對應起來，就可以正常顯示。

> 此時，都還是後端工程師在製作這些網頁，沒有前後端之分。

## JavaScript 的時代

大概在 Gmail 使用了 Ajax 技術之後，大家開始注意到網頁的可能性。透過 JavaScript 以及各種 CSS/HTML 組合的技巧，網頁開始豐富了起來。

這也為之後的 HTML5 發展揭開了序幕。

## 分工的變化

我們從將 HTML 和程式混合在一起，發展到了樣版引擎，又發展到了更加複雜且豐富的 HTML5 時代，原本簡單的 HTML 也變得不簡單，也因此我們需要耗費更多力氣在 HTML 和 CSS 上，這也是前端被切割出來的原因之一。

> 最早的時候大概只會分設計跟後端而已，而且設計給的圖片就由後端想辦法實現。

## 互相卡住的分工

當我們有了設計、前端跟後端，分工變的精細，卻也因此被其他人的工作進度卡住。因為後端總是要等前端提供可操作的網頁，整合到後端上才能夠進行測試。而前端又需要等待設計提供設計圖，才能夠依照設計圖切出對應的版型。

所以這個分工組合剛開始出現時，我們很容易就變成「等設計」「等前端」再「等後端」的流程，讓效率變得非常差。

以前我也常思考能不能優化這個流程，而這也是當時大家偶爾會思考到的問題，一些大公司到底有什麼作法呢？我們也不一定有機會知道。

## 標準化

不過同時間，設計跟前端的工作量也逐漸變大，而且 UX 的意識也逐漸出現，為了應對這些問題，我們開始看到一些大公司整理了 Design Pattern（不是程式上的，是 UI 設計上的模式）來將常見的網頁排版歸納。

基於這樣的的改念，我們開始看到了「元件化」概念的出現，而 Bootstrap 從這樣的時空背景下，將 Twitter 製作網站的 UI 元件搜集起來，基於這樣的概念，我們發現了一個重要的事情。

## 缺少的東西

Bootstrap 提供了我們以往很少完整規劃的 UI 元件組合，而大家也開始注意到如果有一個統一的「標準」不論是設計、前端或者後端，我們都能夠在不互相干擾的前提之下「同時作業」

以設計的工作來看，設計只要能夠提供與 Bootstrap UI 元件對應的樣式風格，即使再怎麼調整或者修改，前端都有辦法在不影響原有的進度下，根據設計提供的元件繼續的擴充或者修改。

而後端要測試系統的操作，也只需要使用符合 Bootstrap 規範的 HTML 結構即可，在未來只要由前端調整或者直接使用，那麼就可以使用。

有了這樣的機制，我們就能夠減少很多溝通跟調整的時間成本，進而專注在自己應該專注的任務上。

## 小結

簡單的從網頁的發展的幾個里程碑變化來看 Bootstrap 的出現原因就能夠大概發現他的優點，其實最近工作上也有遇到客戶的前端切版出來後因為不是使用 Bootstrap 而切版的方式幾乎是換一頁就無法重複利用元件，反而造成困擾的狀況。雖然問題不是出在沒有使用 Bootstrap 上，但是不完整的元件切割跟高度耦合頁面呈現，都讓開發人員在套用版型上遇到了很大的困難，反而讓效率下降很多。

實際上使用 Bootstrap 並不是重要的關鍵，像是 Material UI 也是可以採用的選項，不過因為 Bootstrap 已經非常普及，再加上大部分的人都能夠使用，所以在開發專案有時程壓力的情況下，使用 Bootstrap 大多是容易調整跟減少溝通時間的最佳方案。


