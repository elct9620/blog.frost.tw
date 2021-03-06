---
layout: post
title: 'RubyConf TW 2014 會後心得'
publishDate: 2014-04-26 15:40
comments: true
tags: [Ruby, 心得]
---
接觸 Rails 快三年，今年終於有機會參加 RubyConf 了！
除了 PHP 之外，其實 Ruby 對我來說也算是一個有特別感情的語言，主要是國中時期的 RPG Maker 跟剛開始學習 PHP 的時候還分不出語言，也買了幾本 Ruby 跟 Rails 的書。

今年的 RubyConf 似乎蠻多新的工作人員，所以第一天有點不順。
（不過對我來說是可以接受的範圍，議程品質非常高，不過我想這也會是許多 Conference 未來會碰到的問題。）

然後不知道是不是錯覺，我整個覺得 RubyConf 給我一種蠻優雅的感覺 XD
（其他 Conference 各有特色，但是第一次有這種感覺真的蠻有趣的 XD）

<!--more-->

## Day1

週五，寧願被學校處罰也要來聽 XD
（學校偏偏選這週週會，週二才知道，馬上去問才發現只能請病假，所以就只好曠課拉⋯⋯）

不過其實當天也有點不舒服 XD

### Understanding Typing, Understanding Ruby

這場開場其實蠻棒的，我印象比較深刻的是關於 [DuckTyping](https://zh.wikipedia.org/wiki/%E9%B8%AD%E5%AD%90%E7%B1%BB%E5%9E%8B) 的部分，其實過去真的沒有思考過以這種方式的運用。
算是蠻大的啟發（在 Ruby 中用 `respond_to?` 去檢測是否有此方法，有的話就運行）

另外就是對 Dynamic Typing 跟 Static Typing 的重新認識，很難得有機會這樣實際上了解兩種做法上背後的一些思考方式。兩者其實都還是有做型別檢查，只是先後的時機不同。而 Dynamic Typing 大多時候都得自己檢查。
（其實我個人也是蠻偏好在指定參數的時候就一併確定型別，真的可以避免不少錯誤。）

### RubyMotion Gets A Cool New Friend: mRuby on iOS
<del>其實我只記得大腸包小腸也是一種嵌入式</del>

主要是在介紹 RubyMotion 以及搭配上 mRuby 的時候可以做些什麼（不過我只記得可以利用 mruby 讓原本 iOS 不太接受的 Script 在程式中被接受這樣，至少講者用 mruby 編過就沒碰到被警告這樣 XD）

不過主要還是兩者分開講，至於 RubyMotion 我還是挺希望以後也有個 Android 的解決方案。
而 mRuby 挺有興趣的，之後應該會去玩玩看 XD

### Practice: Refactoring with tests
<del>中午剛吃飽似乎沒有印象，糟糕</del>

這場不知道印象為什麼有點模糊，不過還好還有記得一些。
講者提到 User 跟 Book 的關係，當 User 要 `buy` 一個 Book 時，是否真的適合實作在方法在裡面嗎？
之後是用 Service 的概念去解，最近也開始用這個概念，透過這個範例倒是讓我稍微清楚我該怎麼做。

另外的收獲是 [rspec-given](https://Github.com/jimweirich/rspec-given) 這套工具，我馬上就感受到這對寫 Test 幫助有多大（尤其是悲劇的目前專案還不能順利的上 Test 啊～～～）

不過講者說的部分我也很認同，想要安心的重構有 Test 會比較安心。
<del>我家實習生就會改完 Code 忘記檢查是不是真的會動</del>

### Matz: Keynote

Ruby 之父，無視學校週會最大的動力就是這個（週會的收獲程度一定無限小於所有議程啊⋯⋯）
<del>聽英文還是會有點放空，還好大部份都能聽懂</del>

基本上是在講 Ruby 的物件，然後我又重新認識了一次 Module 這個東西的運用（不過我印象都還是只有 Module 啊 XDD）
除了 `include` 之外，還有 `prepend` 的用法，而這會改變物件的繼承順序（這樣形容嗎？）而讓預設拿到的方法不同。

### RubyQC -- A conceptual QuickCheck library for Ruby

講者自己製作的測試工具，基本上就是一個 API 所以可以讓各種類型的測試工具搭配使用。
主要是動態產生測資，而非預先寫好的測試條件，也因此可以讓測試幾乎無限的接近實際運用時的情境。
（感覺有點類似之前一款前端的「猴子測試套件」模擬猴子亂按來看哪些地方操作或有問題這樣 XD）

### Tell a good story with Ruby

其實我覺得這是一個非常棒的主題，但是講者不時的聲音太小 <del>然後不小心中途昏睡了一下</del>
大致上是在講說故事跟寫 Ruby 的關係，其實也是一個不錯的技巧。

當初在看 C++ 螞蟻書的時候，也是會教說可以先用描述性的方式寫出來，然後再慢慢轉成程式語言。
這場就有點類似進階版，從一個完整的 Story 去換成程式。

### 10 Things to Make API Users Like You.

這場有點放空，不過提到不少 RESTful 無法解決的一些問題。
像是該用 /users/:id/settings 還是 /settings 當作網址，結論是後者，因為這樣使用者就不會誤以為可以透過更改 ID 去存取其他人的設定值。
因此一個好的 API 是能夠讓開發者馬上了解該做些什麼，以及他能做些什麼。

另外有討論分頁方式（offset 跟 page 兩種）不過其實可以的話兩種都支援是會比較好的，裡面有比較兩者的差異。
（像是刪除一篇留言後，某些相關內容因為無法顯示在同一頁而讓使用者無法關聯內容）

### Make Your Rails Backstage Better.

其實聽完之後，我還是覺得用原本的解法好了 XD
（裡面用了一些技巧去改善後台的製作）

不過我覺得主要的收獲是思考的方式，去設計後台的時候怎麼思考會比較好。

### Day1 總結

議程非常的精彩，與其他 Conf 最大的不同是議程已經超越單純技術的層次，大部份的講者都將一種「思考方式」傳達給聽眾，讓我感覺到這已經不是單純的學習技術，而是真正的把「經驗」學回去。
（雖然似乎沒辦法快速的提升，但是總覺得獲得一股力量 XD）

## Day2

今天全程英文，讓我感受到超級國際化的 XD
以下的內容就可能比較少一點，一方面是我英文聽力只能勉強理解而已，講者講太快或者太複雜的概念會讓我因為無法同時做翻譯跟理解而放空。

### Cores unleashed - Exploiting Parallelism in Ruby with STM (and a new VM)

這場我明明很清醒，但是不知道為什麼我現在完全沒有印象 XD
找了簡報回顧一下，發現還是不太懂在幹嘛 XDD
不過大致上應該是在討論執行緒的 Lock 問題吧⋯⋯

然後講者有做了一個 VM 不過還沒公開這樣 XD

### How the Principles of Ruby Inspired the Rails Girls Community

Rails Girls 的發起人 Linda 跟 Terence 的演講（其實我不太認識 Terence QAQ）
不過英文講很快，所以我中間幾乎放空掉，只能大概知道就是在想 Rails Girls 的緣起，還有一些關於這個活動的事情這樣～～
（為什麼放空？想像一下 CPU 100% 的時候就知道了⋯⋯）

### Implement beautiful DSL for iOS using Ruby

這場各種妙，大概就是 iOS 7.0 有了 JavaScript 支援，但是 Objective-C 做 DSL 不方便，然後 Ruby 的 DSL 超讚的（我也這樣覺得～～～～）

於是就開始了一場 Ruby > JavaScript > iOS app 的冒險之旅（誤

不過 DSL 化的 Web Parser 看起來就超讚的，還我想把爬學校的課程資料的工具用這改寫一次 XD
然後可以把 Ruby 轉 JS 神奇工具 [Opal](https://Github.com/opal/opal) 之後應該也會拿來玩 XD

### Functional Programming in Ruby

自從 Batman.js 事件後，我看到會中文的外國人都會嚇一跳（誤

大致上就是介紹 Functional Programing 的部分，不過我覺得特別的地方是一個物件導向的語言也能夠以這種方式來寫，真的蠻棒的，在適當的時候運用，應該是很不錯的 XD

另外講者有一本書在講 Lambda 大家可以看看：[HappyLambda](https://leanpub.com/happylambda)

### Ruby & Friends: Taking Go as an example

個人蠻有興趣的一個主題，因為本身有在寫 Golang 所以就超有興趣 XD

大致上就是在講 Ruby 跟 Golang 該怎麼溝通，主要是透過 Worker 的方式。
其中就介紹了幾個套件，像是 [go-workers](https://Github.com/jrallison/go-workers) 跟 [goworker](https://www.goworker.org/) 等，把一些 Worker 用 Golang 感覺似乎蠻不錯的，效能有不少的提升啊 XD

另外也有介紹一下 RPC 的溝通方式，有 JSON 跟 Msgpack 兩種。不過我個人蠻偏好 Msgpack 的，用 Binary 的方式傳輸，不過另一點蠻棒的地方是語言的支援性真的不錯。

### Growing Up - Bringing Concurrency to Ruby

這場我基本上除了剛開始自我介紹有懂外，幾乎都不懂在幹嘛啊 XDD
<del>然後中途就睡著了</del>

後來醒來就是看到一些工具，我就記錄一下像是 [recap](https://gofreerange.com/recap/docs/recap.html) 跟 [celluloid](https://Github.com/celluloid/celluloid) 看起來跟早上第一場討論的東西有點類似。

後來結束後 Denny 說是在講平行運算之類的，我才比較有頓悟是在幹嘛 XD

### Extreme Makeover - Rubygems Edition

主要在講 Bundler 的維護心路歷程吧 XDD
就是介紹被攻擊、速度慢然後怎麼去解決這些問題。

不過我根本只有注意最後說會變很快這樣（雖然現在也蠻快的 XD）

### sweaters as a service - adventures in electronic knitting

根據 Twitter Wall 表示，這是用裝可愛掩飾硬派技術。
簡單說就是一個簡易的紡織機可以自動織出圖案，只要把圖案丟進去就可以了（最多支援四色）

總之就是超強，剛開始我其實沒進入狀況 XD

### Improve and refactor Ruby code easier

昨天因為 Delay 延到今天的議程（然後因為今天沒有翻譯就跟風變英文議程 XD）
主要是介紹講者做的工具 [Synvert](https://Github.com/xinminlabs/synvert) 可以做不少自動轉換的工具，我真是超恨我沒有早點知道這套。

前幾個月老爸公司從 Rails 3.2 升級到 Rails 4.0 的時候，我手動找了好多舊版改新版，結果竟然有工具可以自動話更新這些東西啊（崩潰

### Lightning Talk

LT 部分就選幾個比較有印象的吧 XD

龍哥介紹台灣的 Rails Girls 讓我想嘗試報名一下當教練（可是我覺得我超弱 XD）
但是想到有機會和不同領域的人交流我就蠻高興的，而且當教練還可以認識更多大大～～～

另外就是前面講 Functional Programing 的講者 Arne Brasseur 為了學中文用 Ruby 寫了一套 [Command Line Tool](https://Github.com/plexus/analects) 整個超強的，大家可以玩一下。

還有一場講者介紹了他們的服務 [Lingo](https://www.lingohq.com/) 根本是超強的網站建制工具，看了我都想用了啊 XD
不過考慮到現實面，就是台灣應該沒幾個人能用，所以還是當玩具玩玩看吧 XD

另外還有像是嘗試把 Rails Deploy 到 Windows Server 2003 with IIS 這種恐怖的經驗分享（大概很恐怖吧 XD）
其中比較可惜的是講 Angular.js 跟 Rails 搭配的只提到幾個很簡單就可以解的問題，其實我覺得像是 Devise 沒辦法用 Ajax 登入比較困擾 XD

---

其實說真的，整體來說很不錯。而且我對 Ruby 的信仰值直接被點滿 XD
雖然在餐飲跟報到有一點小差錯，不過我覺得都是可以忍受的（我們只是被其他活動那超高品質的團隊服侍習慣了 XD）
不過議程上，我真的覺得超用心幾乎都是非常精彩，而且不是只有技術上的分享，還有經驗上的。
這部分就是我目前很少能在其它 Conference 體驗到的部分。

期待下一次的 RubyConf 會更好 XD
