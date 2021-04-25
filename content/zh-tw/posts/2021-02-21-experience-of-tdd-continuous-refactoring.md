---
title: "TDD 與持續重構課程心得"
publishDate: 2021-02-21T22:07:21+08:00
date: 2021-02-21T22:07:21+08:00
tags: ["TDD", "重構", "心得"]
toc: true
thumbnail: https://blog.frost.tw/images/2021-02-21-experience-of-tdd-continuous-refactoring/thumbnail.jpg
credit: Startup Stock Photos from Pexels
---

年初上完[針對遺留代碼加入單元測試的藝術](https://blog.frost.tw/posts/2021/01/10/experience-of-unit-testing-effectively-with-legacy-code/)後，這週末又上了另一門相關的課程。在開始上課後發現很大的突破自己以往的觀念，同時也多出很多想法以及想嘗試的事情。

<!--more-->

## 課程節奏、內容{#content}

跟上一篇文章一樣，先來介紹一下課程的內容跟節奏。內容的話其實跟大家想像的差異蠻大的，寫測試的時間本身不多反而是更著重在為何而寫測試這件事情上面。節奏來說其實非常緊湊，這陣子又有一點精神上的狀況所以上課起來更加吃力一些，兩天的課程基本上就是講解概念跟實戰的搭配，不要認為自己會跟不上就不去報名。除了會因為太熱門要排到明年之外，這門課光是課堂上的練習跟回到工作中練習使用，就會有很大的改善跟幫助。

就我自己的感想來看，以我自己在[五倍紅寶石軟體開發](https://5xruby.com)的經驗，其實已經有應用到一部分的概念但是非常的零碎，而在台灣目前很難有系統地學習這方面的知識，不論是想讓自己更近一步或者導入到工作中都是很不錯的。

## 從理解需求開始

第一個練習是實作 [91 哥](https://www.facebook.com/91agile)經常會在 Facebook 上分享的 Tennis 的練習，在不知道詳細的規格的前提下，我們需要從 Product Owner（講師）身上問出更多的細節，像是網球中每一個分數都會有自己的專有名詞、勝負的判定條件等等，以及「功能」上的要求是怎樣的，有些我們想到的功能可能是「超出需求」範圍的，如何拿捏好該確認的訊息來幫助開發，就變成很重要的關鍵。

## Pair Programming

跟大多數課程形式不同的地方在於我們會採取「小組」的方式安排座位，同時需要跟附近的人進行 Pair Programming 進行開發，在這樣的過程中就會觀察到習慣的差異、思考方向的不同等等，原本自己一個人可以獨立完成的任務變得更花時間，但相對的在 Pair Programming 中我們有更多的討論以及對規格、需求的理解，假設我們已經非常熟悉 Pair Programming 的狀況下，也許能更好的完成任務。

在課程的設計中，每一次的 Pair Programming 基本上都是無法完成任務的，中途也會逐漸增加難度。從一個人引導另一個人撰寫，到隔一段時間就要換人寫來模擬出一個專案被多次接手之後的狀況。

## Test Driven Development

這一次的課程大概讓大家對「TDD」的誤會大大地解開，在過去我們只要聽到 TDD 就會想到「要先寫測試」然後就開始因為時程壓力或者對撰寫測試不熟悉而開始排斥，但「先寫測試」這件事情雖然是「TDD」的一部分，但並不是全部。

我們在練習中通常只對「關鍵物件」進行測試，也就是重構過程產生的一些輔助物件是不做測試的。

這其實非常的顛覆以往我們對於 TDD 的想像，我們要測試的應該是「最有價值」的功能，在「單元測試的藝術」課後補充雖然有提到，但是在這門課中反而有實際的體會到「最有價值」的概念。除此之外，那些被我們拆分出去的物件因為會被「關鍵物件」使用跟呼叫，實際上還是有被覆蓋到的。

從這樣的角度來看，我們針對那些對產品是非常核心或者不能出問題的「程式碼」進行測試，從理解需求轉換成測試程式碼，再進一步透過實作一步步驗證每一個需求細節的理解正確，對軟體的保護是遠遠高出我們過去直接去實作商業邏輯來的安全且嚴謹。

## 重構{#refactor}

在第一天的課程中並沒有硬性規定要使用 TDD 來練習，而是讓我們「儘可能完成要求」當作目標去開發，從很短的時間內還要 Pair Programming 跟換人操作，中途有很多混亂的發生而導致我們無法如期完成。到了第二天，講師挑選出第一天「勉強完成」的專案，然後開始對程式碼進行重構。

雖然我們經常會說「重構」也對很多重構的「術語」非常熟悉，但實際上重構本身是怎麼進行和運作的可能很多人也說不清楚，在課程中講師用很實際的示範告訴我們該怎麼做。

在第一天我們為了交付程式碼，因此大多數的組別都是將一個超大的方法作為核心商業邏輯提交出去。講師透過補完測試來對原本的商業邏輯進行保護，再一步一步的將這個方法重構到可以在善用語言特性的前提下，只需要一行就能完成的方法。

中間應用了很多我們熟悉的技巧，像是將方法分離出來等等。不過也有很多重新將方法統合回去變成更大方法的處理，這是為了找出「重複」的邏輯並且合併，這剛好跟 TDD 裡面的技巧相互呼應，在講師推薦的 [Kent Beck 的測試驅動開發](https://www.tenlong.com.tw/products/9789864345618?list_name=i-r-zh_tw)這本書中就建議我們「小步前進」也因此在重構的「過程」中會出現很多我們認為「不好」的實現，但這些動作最後都會變成我們消除 Code Smell（程式碼壞味道）的線索，以課堂上的例子來看就因為過早抽取方法（Extract Method）而造成重複的程式碼產生。

這也是我會推薦這堂課的原因之一，因為即使我們知道了所有對應的技巧，只要無法用恰當的方式應用還是會造成有壞味道的程式碼。

## 練習{#practice}

當我們對 TDD 和重構理解後，最後一個階段就是先以 TDD 的精神再一次分析需求，一步一步從客戶了解每一個需求並且依照「實作的複雜程度」拆分成小的步驟，然後再接著將這些需求依序寫成測試並且加入實際的程式碼，這個過程中會實作非常多「未完成」的程式，像是直接回傳可以「通過」測試的數值。

在我們的理解中這是一個很奇怪的事情，不是要讓程式碼變成「綠燈」嗎？但這樣寫死難道不會有問題？

不過這也是我們對於 TDD 理解的誤區，當我們加入下一個測試案例時必定會因為前一次的實作「不完整」而失敗，也因此我們需要再進一步的重構原本的程式來完善功能，隨著每一步實現功能到完善後，就得到了一份「可以被改善」但是「符合需求」的程式碼，最後我們只需要在測試的保護下放心的重構就可以將這一次實作的功能完成。

## 小結{#conclusion}

這一次的課程內容蠻難用一些範例程式碼去說明，與之相對的裡面更多的是一種「心法」的感覺，從我第一次聽到 91 哥的演講後就一直有這樣的感覺。我自己是一個很靠直覺去寫程式的人，大多數的經驗都是靠無數字重複的實踐來做到的，所以大部分時候都很難有系統的去說明一些經驗技巧。

這樣的問題也反應在我自己在學習過程中不容易去找出缺少的技能，這次的課程讓我有非常多新想法想要導入公司來應用。而且這些技巧不單純是工程師適合，在接案公司接觸需求的第一線人員是我們的 PM 也很適合學習分析需求的技巧，我們在需求分析中其實是沒有討論「程式實作」而是更多地用「實際案例」去比對，逐步的探索出客戶真實的需求。

像這樣的技能也可以很大的幫助 PM 在不完全理解技術的前提下向客戶確認詳細的需求，同時工程師也能基於這樣的資訊開發。