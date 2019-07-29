---
title: RubyConf Taiwan 2019 會後感想、議程概覽
date: 2019-07-29 15:03:01
tags: [RubyConfTW, Ruby, 感想, 心得]
thumbnail: https://blog.frost.tw/images/2019-07-29-my-experience-after-rubyconf-taiwan-2019/thumbnail.jpg
---

跟前幾年一樣基本上就是工作人員，這幾年參加研討會也都比較沒有在仔細聽了，所以大多是邊顧邊寫點程式。

比較不一樣的大概是今年更累了，從週四下午場佈到 Pre Party 然後兩天的活動、Official Party 最後到今年嘗試的 After Hack 幾乎是四天左右的連續接力，每天早上醒來都要先懷疑自己是否能撐過這一天。

<!-- more -->

基本上就跟之前差不多，照時間來看整個活動。

## Pre Party

今年是由 [PicCollage](https://piccollage.com/) 贊助 Pre Party 的活動，去到活動場地的時候很確定以前去過幾次，但是一直沒有想起來是到哪間公司。不過以前有一次的 RubyConf Taiwan 也是在這棟大樓的某間公司辦過 Party 的樣子。

PicCollage 準備的食物真的好評，非常好吃。然後 Ruby 社群舉辦這種 Party 活動的重點是跟人交流，這場除了有抓新同事去跟 Matz 打個招呼之外，基本上就都還是講中文。蠻意外的是兩年前跟女人迷合作的聊天機器人講座來參加的人，都已經畢業變成 PicCollage 的員工，看起來我離學生時代越來越遠了⋯⋯

第一天晚上基本上算是暖身，大概就是稍微閒聊，然後跟一些認識的朋友打個招呼就這樣結束了。

## The Future of Ruby

這場因為早上狀況蠻多的所以沒有聽到太多，尤其是 [Tamashii](https://tamashii.io) 打卡機遇到了一些狀況，雖然都是很好排除的問題，不過大概也凸顯了過去一年都沒有維護的情況，幾乎都是平常沒有使用跟調整造成的問題。

Matz 這幾年講的 Keynote 都偏向 Ruby 3 的目標跟方向，還有 Ruby Commiter 努力的成果。這次有投稿 [Ruby World Conference](https://2019.rubyworld-conf.org) 所以就看看能不能在十一月再聽一次。

## Rethinking the View Layer with Components

這場因為[幕凡](https://ryudo.tw/)在今年 [RubyKaigi](https://rubykaigi.org/2019) 有跟我提過，所以大概是有一個概念的。今年感覺都沒有很集中，但是又感覺都大概懂，很微妙的狀態。

簡單來說是在討論 Rails 在 View 層的實作，目前我們的測試都是仰賴 Feature 之類的去驗證畫面是否正常的。
這邊是將 View 分解成 Component（元件）的形式，將一些細碎的部分用 Ruby 來實作，有點類似 Decorator 的感覺，但更接近 React 的元件概念。

利用這種方式我們就可以針對性地對 View 做單元測試，以後端來說算是很先進的想法。

## Ruby with types

因為我在 1001 負責錄影，所以都是聽這間的。這場主要在討論對 Ruby 增加型別支援會是怎樣子的，雖然有考慮蠻多東西的。不過我覺得整體上跟 Stripe 提出的 [Sorbet](https://sorbet.org/) 比起來讓 Ruby 的語法整個變複雜難懂很多。反而是 Sorbet 這種有點選用類型的 DSL 能保有一定程度的相容性，又可以改善一些開發上的問題。

> 不過 Sorbet 的難點可能會變成在一些 IoT 類型的應用要導入需要一些 Cross Compile 的處理，有可能會變成卡住的點。但是這方面又是 IoT 應用的一個尷尬的地方，很多地方都是需要利用 C Extension 去做才能盡可能的在 Ruby 裡面做事情。

## Protect Your Copyrighted Ruby Code in Distribution

這場我沒怎麼跟上，反正後面就變成瑪力歐了，大致上是在講有什麼方式可以讓 Ruby 原始碼不會被直接的看到這件事情。

不過我個人是認為這算是一種一體兩面的東西吧，尤其是現在很多應用都轉到 Web 和雲端的情況下，這種套裝軟體的模式是否是合適的。

> 對一些商用的 Gem 可能會有影響，不過沒有聽很詳細所以就這樣吧 XD

## Scalable Applications with JRuby

這場我沒在聽（印象薄弱）不過感覺有點是在介紹 JRuby 之後的一些發展吧，像是會要把 Fiber 之類的加進去支援。

## Road to white mages

到這個時候我已經開始在寫新的 Gem 了，這場主要是在講怎麼 Debug 程式。其實 Ruby 在這幾年針對 Debug 的輔助增加了不少特性，用來解決一些問題的時候是真的滿重要的技巧。

比較簡單的就是現在大多數時候可以直接問 Ruby 某個 Method 是在哪裡定義的（尤其是接手專案又被魔改 Patch 的情況）

```ruby
method(:puts).source_location
```

用法大概像這樣，這場介紹不少這類技巧，我大概要之後補看影片了 XD

## The Journey to One Million

聽說很精彩，因為我也沒在聽所以不太清楚發生什麼事情。不過講者 Samuel 大概是我今年講最多話的外國人了 XD

主要是在講用 Ruby Fiber 機制開發的 Web Server 能達到處理 100 萬連線的過程，這幾天仔細看 Ruby Core 的 Mailing List 才發現是 Commiter 等級的超級大大。

裡面有一段是一結束就被幕凡問，我後面跑去問了好幾個熟人也都不知道。

Fiber 我當初會有興趣是因為他跟 Goroutine 很類似，所以我就跑去研究，去年到日本員工旅遊的時候有去參加 [Asakusa.rb](https://asakusarb.doorkeeper.jp/) 活動的時候有問了一下那邊的大大，然後再經過幾個月的整理歸納出一個大概的概念，才剛好能搞懂這段問題。

> 去年是寫了好幾篇關於 [Fiber](https://blog.frost.tw/posts/2018/06/26/Talk-about-ruby-s-fiber-Part-1/) 的文章，不過現在回去看其實我的了解還是很不足的。

其實 Fiber 有一個問題是他要做 Context Switch 而做這件事情是有代價的，這種機制（在一個 Thread 內做切換）叫做 Coroutine（協程）在 C 或是 C++ 都能實作出來，而他的特色是會把 Context 保存下來，因為要這樣才能確保切換回去的時候還是在同一個狀態下繼續執行。

而這件事情就會跟記憶體使用有關係，如果頻繁地切換就會有效能問題，也就是這樣切換的代價是否比開 Thread 還低。

像是 Context 是怎麼保存的（Ruby 有一個 context 資料結構，他可能不是整個 Ruby 保存而是以 Block 為單位之類的）還有要在什麼時機點做切換，如果我們都沒有 I/O Blocking 的狀況下，切換是否有效益等等。

簡單來說就是你使用 Fiber 跑出來的效果好不好，取決於你對 Process / Thread 這些東西的機制了解有多少，然後因為 Fiber 還很不成熟，所以你要自己做一些原本 OS 會幫你做的事情，才能讓 Fiber 跑得很快。

## Official Party

今年感覺已經完全可以無視語言障礙，反正聽不懂就乾杯，所以可以比較順的跟外國人交流。

比較特別的大概是以前的同時有的已經是掛 Director、主管或是跑去 Google 這種看起來就超厲害的公司工作，相比起來我好像蠻普通的（笑）

這場有跟 Pixiv 的 CTO 稍微聊到天，不過有點可惜大概是對不太到點所以沒能聊起來，但這大概也跟我英文聽力還不夠好有關係，不然感覺應該都是能聊技術才對。

另外就是有去找 Samuel 問關於 Fiber 的問題，因為之前做的 [Fiber 改善 HTTP 效能](https://blog.frost.tw/posts/2018/08/21/Does-the-Fiber-have-any-benefit-for-Ruby/) 測試，我後來做了很多檢驗都跟我預期的結果差異不少。

這次綜合了前面的演講和我的猜測，算是獲得一個驗證就是之前少測試了一個情況，而這個情況應該才是 Fiber 表現最好的情況。之後有空大概還是得再次實作出來做一次測試，才能檢驗我的假設是否正確。

## Compacting GC for MRI

網站上的講題不知道是不是當天的講題，因為這次很忙所以我只能在這個時間對口譯所以是完全沒聽到的。

> 聽說有人在 Offical Party 跟大神許願，所以題目是早上突然改變的⋯⋯

## 從 Enumerator 看 Ruby 的迭代器

我的講題，其實當我完成簡報最後的部分（在前一天晚上）我就知道這場大概是要絕望了 XD

整體上來說有一種 JavaScript 到處亂跳的 Callback 的感覺，所以我很難解釋，又沒有時間讓我思考怎樣畫圖才能動作，所以最後就是台下大家一臉呆滯。

簡單說就是討論 Enumerator 是怎麼來餓，然後 Enumerator::Generator 和 Enumerator::Yielder 為什麼要存在，以及 Enumerator::Lazy 是怎樣應運用跟運作，結束後還好有 [c9s](https://medium.com/@c9s) 大大提問，雖然只是確認一些細節，但是至少讓我感覺到安慰，畢竟後面這種混亂的狀態還有人能搞懂⋯⋯

> 總而言之，之後我會想辦法再寫幾篇文章討論這個，然後盡可能的詳細一點。

## 開拓者們建立鐵道的辛酸血淚史

這場我沒有很認真聽，不過講者的公司真的是蠻拼的去嘗試這些東西。

> 其實我覺得 Trailblazer 的問題是他的文件停留在 1.0 版，然後又蠻囉唆的，其實能適用的情況不一定是我們想像那麼美好。但是想法上是很不錯的，很值得學習。

## Suit up for frontend and backend development

大概是一場不用認真聽也知道在講什麼的演講，因為這就是目前我在做的專案辛酸血淚史的統合。雖然演講中沒有提到太多那個專案，不過裡面大部分的經驗跟技巧都是從那個專案學到很多教訓後整理出來的。

主要就是在討論怎麼拆分 Form / Presenter 等物件，之前才寫一篇的[關於 Rails 中的 Form Object / Presenter 這些物件該怎麼用](https://blog.frost.tw/posts/2019/05/28/How-to-use-Form-Object-and-others-for-Rails/)系列文章其實也是在講這個，只是看的角度不太一樣，之後也會繼續的補完這系列。

> 關於那個很崩潰的專案，給我的感覺是太久沒寫超糟的程式，所以回去反思到底是怎樣變糟的。雖然客戶方面的問題蠻多的，但是也反過來讓我把很多過去難以釐清跟不知道怎麼判斷的東西理解出來，算是把整個架構技能向上提升了一個等級吧 XD

## Using AWS Lambda with Ruby on a large-scale system

我沒認真聽，大致上就是在想說在 Lambda 上跑 Ruby 的故事。

## What's new in Rails 6?

一樣沒認真聽，雖然原本是想要認真聽一下 Rails 6 有什麼新功能的，不過跟前面那一場差不多都是我心流狀態，已經完全集中在寫 Gem 了 XD

## Virtual Machines: their common parts and what makes them special

最後一場，這場我就有比較專注一點在聽。我覺得厲害的地方是能把蠻難搞懂的概念，用很簡單的例子舉出來。不過蠻可惜的是這段知識因為前幾年的 RubyKaigi 有在討論 Register Based VM 應用在 Ruby 上的可能性，所以我算是有去補充了這塊知識，嚴格說起來就是演講的內容剛好都在我懂的範圍內。

不過有拿 PHP7 改善效能後的設計來跟 Ruby 比較我覺得是很好的，因為我們大多只關注 Ruby 本身，但是也許其他語言有相同的問題需要解決，而且已經找到一個好方案如果沒有去看看的話，可能就浪費時間在某些沒有太大意義的地方上。

## After Hack Day

這場活動主要是希望讓台灣的開發者可以多嘗試開發一些東西，或者對 Ruby 相關專案做貢獻。另外就是藉由這次機會，讓大家可以跟國外的開發者做技術上的交流，很多都是在台灣不容易遇到的高手。

上午主要是自我介紹跟簡單展示一下專案，雖然完全沒有照我跟 [Stan](https://medium.com/@st0012) 預想的情況進行，不過我覺得因為算是一個非正式活動，大家能交流跟互動是最好的。就結果上來說，我個人認為是還不錯的，大家都有稍微跟身邊的外國人互動、提問。

因為 RubyConf Taiwan 兩天我都在寫 Gem 但是還沒有測試，所以我今天大部分時間都在把 [Hahamut](https://github.com/elct9620/hahamut) 這個 Gem 的測試補完，主要是發現如果設計得夠好，其實測試會很容易寫。這大概也驗證了我開始了解測試怎麼寫的時候，認為如果測試發現很難測，那就一定是設計上有問題要改進。

後面大概四點快五點，我跑去翻 Samuel 寫的 Async Gem 裡面有一個關於 Enumerator 的問題被特別提出來，因為我的主題就是討論 Enumerator 所以就打開來看了一下，但是又沒有跟上討論的點就只好去問本人。

然後就這樣得到了一個半小時的 Commiter 一對一教學的機會，這個問題是一個在所有 Ruby 版本（1.9 之後有 Fiber）都會有的問題，他又很剛好是我在讀 Enumerator 原始碼的部分被我跳過的部分，簡單說就是 Enumerator 其實是有用 Fiber 的。

但是，因為 Ruby 目前的 Fiber 機制不夠完善，造成了下面的情況

```ruby
def iterate(&block)
  yield 1
  Fiber.yield 2
end

f = Fiber.new do
  to_enum(:iterate).to_a
end

f.resume
```

照 Fiber 的邏輯，應該是要 `#to_a` 得到 `[1]` 然後 `f.resume` 得到一個 `2` 的回傳值，但是因為 `to_enum` 會產生一個 Fiber 區段，造成 `Fiber.yield` 實際上是跟 `yield 1` 的效果一樣，結果就變成 `#to_a` 得到 `[1, 2]` 然後 `f.resume` 是 `nil` 的狀況。

後面的討論（應該是單方面聽解說）就是圍繞在這個情境下要怎麼處理，還有 Samuel 的 [PR]https://github.com/ruby/ruby/pull/2002) 怎麼暫時性的解決，而這個解法其實不算好。就再講到 `Fiber.yield` 和 `#resume` 的行為是怎樣實作的，以及目前 Ruby 缺少了怎樣的機制才造成這個問題的發生等等。

非常有趣，不過我想大概也不是我目前能幫忙解決的 XD

## 總結

整體上來說，經過這幾年參加國外研討會跟在台灣能有跟外國人交流的機會。其實有慢慢體會到 Ruby 社群文化的優點，這大概是相比其他語言社群一個很棒的優點。就是我們是盡量嘗試去跟外國的工程師接觸跟交流的，雖然還是要看個人，不過至少以[五倍紅寶石](https://5xruby.tw)本身公司文化來說，我們內部員工會盡量做這件事情是好的。

其實這樣說起來，以前大學參加研討會會嘗試跟講者、外國人交流，也許是從 RubyConf Taiwan 學來的，雖然整體下來我可能花了五六年才能達到完全不怕去跟外國人對話，但是就結果上來說是很棒的。而且能跟參與語言本身開發的工程師討論技術，收穫是遠比自己研究多上非常多的。

另外就是解釋技術的技巧，外國講者在解釋上我認為都有不少很用心的地方，盡可能讓這些東西能更容易被理解。至少相比之下，我的簡報跟演講大概就沒有這麼好懂了⋯⋯