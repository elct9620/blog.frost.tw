---
title: "TGONext: 規劃高併發服務"
publishDate: 2020-02-23T15:54:37+08:00
tags: [心得, TGONext, 架構]
series: TGONext
toc: true
thumbnail: https://blog.frost.tw/images/2020-02-23-tgonext-the-plan-for-high-concurrency/thumbnail.jpg
---

昨天是 [TGONext](https://next.tgonetworks.org/) 的第一次聚會，在這個活動中我們會向台灣的一些高階主管學習。在開場結束後我們的導師 [Ant](https://blog.gcos.me/) 讓我們投票選出幾個想在這半年的時間內討論的題目。基本上我們預定討論四個主題，而「高併發」是我們的第一個主題。

<!--more-->

## 什麼是高併發 {#what-is-high-concurrency}

再開始的時候，我們的導師問了我們這個問題。

> 要怎麼定義高併發？

基本上大家都是知道高併發簡單來說就是有大量使用者在使用我們服務的情況，不過要怎麼明確定義反而是從沒有仔細思考過的。

不過定義上其實相對的單純，但是透過導師的引導我們開始思考更多東西。

> 在短時間內能處理的請求就是併發，而這個短時間通常是以秒為單位。

基於這樣的定義，實際上最重要的事情就是

> 我們需要確保我們的服務可以處理足夠的請求數否則就就沒有意義

## 如何評估併發數 {#how-to-measure-the-concurrency}

為了確保能處理大兩請求或者配合行銷團隊給我們的目標，我們需要正確的去測量我們的系統所能承受的併發數量，因此我們的導師請我們列出一些曾經用過或者聽過的工具。

* [ab](https://httpd.apache.org/docs/2.4/programs/ab.html)
* [wrk](https://github.com/wg/wrk)
* [wrk2](https://github.com/giltene/wrk2)
* [JMeter](https://jmeter.apache.org/)
* SaaS (提供類似功能的雲端服務)

因為這些工具其實還蠻常見的，我自己反而沒有在第一時間把他跟測量工具聯想起來。

然後導師馬上問我們一個問題：「這些工具的結果是否會有差異？」

我們基本上都沒有考慮過這個小細節，但是這卻對我們最後測量出來的結果很重要。

舉例來說，像是 `ab` 會在發出請求之前把所有的 Thread 產生好，再一次性的發送出去。這很容易造成我們取得比較差的成績，而且很可能不符合真實的使用情況。

> 在測量併發能力的時候，我們需要注意是否符合真實世界的使用情況。

除此之外，還有一些東西需要在測試的時候小心處理。

### 硬體上的限制 {#the-test-machines-limit}

假設我們想要模擬高併發請求在某一台機器上，但實際上為了達到這個併發量要產生的 Thread 數量已經超過機器的上限。那麼我們只會得到錯誤的結果，這時候我們可能就需要使用支援在多台機器上運作的工具，或者製作一些能控制工具的腳本來同時觸發某個測量工具在多台機器上面執行。

### 網路環境 {#the-network-environment}

如果我們在 LAN 發出請求去測試，實際上發出去的請求跟壓力都會遠大於實際的情況。因此我們至少要將測試的機器部署在其他區域（Zone）並且考慮實際使用者所在的位置。

> 另外一個被提到的地方是，我們在測試的是「能力」而不是「壓力」因此目的並不是為了要對伺服器施加壓力這兩種測試實際上是不太一樣的。

### 工具的計算方式 {#the-toolss-calculator-method}

在前面我們其實已經大致上討論過，但是導師還是特別將 `wrk2` 提出來討論。因為有些工具並不是計算從請求發起到收到回應的這個時間差，這表示有些時候並不會完全符合真實的情況。

另外，導師告訴我們 `wrk2` 使用 [Coordinated Omission](https://medium.com/@siddontang/the-coordinated-omission-problem-in-the-benchmark-tools-5d9abef79279) 這個演算法，是相對接近真實世界的計算方式。

### 過度美好的結果 {#the-perfect-result}

假設我們得到非常漂亮的結果，我們就需要去注意測試的方法跟工具。因為這表示我們可能在一些地方是我們沒有預期到的，因而提供了不同的結果給我們。

## 從 MAU 換算成 QPS {#from-mau-to-qps}

在現實世界中，QPS（每秒查詢次數）通常不是由開發團隊來決定的，他大多是仰賴於行銷團隊的目標或者老闆的計畫。

這雨表示我們通常只會得到 MAU（每月活躍用戶數）而不是一個明確的 QPS 數值。

舉例來說，如果行銷團隊告訴我們下個月他們計畫讓每月活躍用戶成長到 100 萬人，至少要多少的 QPS 才能夠滿足行銷團隊的需求呢？

經過短暫的討論跟推測，我們注意到了一些跟 Request 有關的線索。

* 使用者並不會隨時在線上
* 一個使用者的操作後面會有多個請求產生
* 大部分的使用者會集中在特定的時間操作（Ex. 活動）

假設我們使用 80-20 法則來推斷有 80% 的使用者只會在 20% 的時間使用我們的服務。

然後我們要定義每秒鐘使用者最大會產生的請求數，在這部分導師告訴我們從經驗上來看選擇「最常見的操作」並計算這個操作會產生的請求數會是一個比較合適的選擇。

到此為止我們就獲得了有限的情報足以從 MAU 來計算 QPS 應有的數值。

* MAU: 100 百萬
* 每秒使用者請求數: 每個動作 3 個 API Request
* 活躍時間: 約集中在每天的 20% 時間內

所以我們就可以像這樣計算：

> (1 million * 3 API Request) / (30 * 0.2 * 86400) * 0.8 ~= 4.6 QPS

轉換成公式的話類似這樣：

> (每月活躍人數 * 請求數) / (一個月 * 20% 的時間 * 1 天 (以秒為單位)) * 80% 的使用者 ~= QPS

最後的結果遠低於我們預期的數字，但是他確實是基於數據而且有說服力的。

因此，要達到目標我們設計的架構至少要允許每秒大於 4.6 的 QPS 才能夠滿足行銷團隊的需求。

> 不過導師也提醒我們這個比例會因為不同情況而改變，但是我們可以透過網路上公開的報告來評估自己所在的產業或服務適合採取怎樣的比例配置。

## 結論 {#onclusion}

這是我們第一部分的討論，雖然只花了一個半小時左右但是情報量其實已經非常的多。

後面剩下的時間我們開始討論 SLI/SLO/SLA 和可用性造成的 QPS 下降，但是因為只剩下比較短的時間所以我們應該會在線上或者下次的聚會繼續討論，基本上我也會在討論完後稍微整理記錄下來。

在這約兩小時跟導師和其他成員的討論後，我依舊認為在 TGONext 這個活動最重要的是跟導師學習他們在面對問題時的觀點。

在這個高併發的討論中，我們從定義「高併發」到專注在技術上的「QPS」來檢視我們需要的目標，最後再將我們的經驗連結其他部門讓合作得以達成。

這幾年不時會有「頭銜不重要」的說法出現，不過當你跟 TGONext 裡面的這些 CTO 或者其他高階人才學習後，你會發現我們跟他們的差別在於我們常常關注在錯誤的問題上，而且並不清楚該用什麼方法正確的處理。

也因此我是很感謝 [TGONextworks](https://tgonetworks.org/) 提供這樣的機會給我們一個類似路標一樣的方向去學習更高階的技巧，而非因為自己在公司有個不錯的頭銜而自我滿足。