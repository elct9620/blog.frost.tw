---
title: 使用 Fiber 能給 Ruby 帶來好處嗎？
date: 2018-08-21 18:08:56
tags: [Ruby,Concurrency,Thread,Coroutine]
thumbnail: https://blog.frost.tw/images/2018-08-21-does-the-fiber-have-any-benefit-for-ruby/thumbnail.jpg
---

關於 Fiber 的[系列文](https://blog.frost.tw/posts/2018/06/26/Talk-about-ruby-s-fiber-Part-1/)寫到現在也已經一個半月了，除了分享自己在使用 Fiber 的經驗之外，我也更加的熟悉 Fiber 的使用。

不過，這真的是有益於現有的專案嗎？

<!-- more -->

為了確認是否有實際的效益，我就針對當初會考慮 Fiber 的其中一個原因 - 大量 HTTP 請求處理當作方向，設計了幾個測試。

## 情境

這些測試包含了這幾種情況，唯一會改變的是使用 Fiber 實作的方式，其他都是固定的。

1. 純 [Net::HTTP](https://ruby-doc.org/stdlib-2.5.1/libdoc/net/http/rdoc/Net/HTTP.html) 的實現
2. 使用 Thread 將 HTTP 請求平行處理的實現
3. 對 Net::HTTP 採取 Keep-Alive 的方式處理的實現

其實還應該加入使用 Keep-Alive 在 Thread 中處理的版本，但是目前還沒有實作到那部分。

## 測試案例

以下會貼出好幾種不同 Fiber 實現情境下的測試案例，來讓大家參考跟比較。

### 一、單純的非同步請求

原始碼可以在這個 [Gits](https://gist.github.com/elct9620/9651456ff3abf820065b1e1f98da37ff) 找到，可能會跟目前的版本有一點誤差。

```
Warming up --------------------------------------
               Fiber     1.000  i/100ms
           Net::HTTP     1.000  i/100ms
       [P] Net::HTTP     1.000  i/100ms
Calculating -------------------------------------
               Fiber      0.173  (± 0.0%) i/s -      1.000  in   5.787644s
           Net::HTTP      0.173  (± 0.0%) i/s -      1.000  in   5.766318s
       [P] Net::HTTP      0.162  (± 0.0%) i/s -      1.000  in   6.155530s

Comparison:
           Net::HTTP:        0.2 i/s
               Fiber:        0.2 i/s - 1.00x  slower
       [P] Net::HTTP:        0.2 i/s - 1.07x  slower

Calculating -------------------------------------
               Fiber     1.147M memsize (    55.746k retained)
                         5.681k objects (   356.000  retained)
                        50.000  strings (    50.000  retained)
           Net::HTTP     2.276M memsize (     5.416k retained)
                         1.656k objects (    50.000  retained)
                        50.000  strings (    50.000  retained)
       [P] Net::HTTP     5.457M memsize (     5.343k retained)
                         1.876k objects (    51.000  retained)
                        50.000  strings (    50.000  retained)

Comparison:
               Fiber:    1146951 allocated
           Net::HTTP:    2276040 allocated - 1.98x more
       [P] Net::HTTP:    5457467 allocated - 4.76x more
```

這邊要注意的是原始碼使用的是 `read_nonblock(1)` 會造成非常大量的記憶體浪費，因為他會產生非常多破碎的字串（緩衝區）來暫存，直到處理完才釋放。
所以將 `read_nonblock(1)` 修改為 `read_nonblock(102400)` 之後，因為一次最大可以讀取 10K 的資料，所以通常一次性的分配就能完成操作，記憶體會和 `[P] Net::HTTP` （Thread 版）的差異達到 100 倍的差異。

> 不過要注意的是，這邊只是單純的把回應的內容擷取出來，跟 `Net::HTTP` 做的事情少了很多，碰到有 Chunk（分塊）的資料，也無法正確處理。這也是記憶體使用差距極大的原因。

而且我們可以看到，使用 Fiber 其實並沒有「比較快」

### 二、使用 Keep-Alive 的 Fiber

原始碼可以在這個 [Gits](https://gist.github.com/elct9620/1330b47d71a5fbbb31867989a47cff17) 找到。

```
Warming up --------------------------------------
               Fiber     1.000  i/100ms
           Net::HTTP     1.000  i/100ms
       [P] Net::HTTP     1.000  i/100ms
Calculating -------------------------------------
               Fiber      0.152  (± 0.0%) i/s -      1.000  in   6.578475s
           Net::HTTP      0.116  (± 0.0%) i/s -      1.000  in   8.648963s
       [P] Net::HTTP      0.162  (± 0.0%) i/s -      1.000  in   6.175362s

Comparison:
       [P] Net::HTTP:        0.2 i/s
               Fiber:        0.2 i/s - 1.07x  slower
           Net::HTTP:        0.1 i/s - 1.40x  slower

Calculating -------------------------------------
               Fiber    83.919k memsize (     1.162k retained)
                       279.000  objects (     9.000  retained)
                        44.000  strings (     9.000  retained)
           Net::HTTP     9.085M memsize (    12.385k retained)
                         5.827k objects (   117.000  retained)
                        50.000  strings (    50.000  retained)
       [P] Net::HTTP    17.466M memsize (    11.139k retained)
                         5.849k objects (   110.000  retained)
                        50.000  strings (    50.000  retained)

Comparison:
               Fiber:      83919 allocated
           Net::HTTP:    9084994 allocated - 108.26x more
       [P] Net::HTTP:   17466200 allocated - 208.13x more
```

這次我們將 `read_nonblock` 設定到正確數值後，可以看到記憶體的使用急遽的下降。而且在使用 Keep-Alive （連線後不馬上關閉）的機制後，節省下來的 TCP Handshake 時間讓他的速度跟 Thread 的時間更加接近，但是在實質上順利的比原本的 `Net::HTTP` 還更快。

### 三、使用 Net::HTTP 非同步處理 Fiber

原始碼可以在這個 [Gits](https://gist.github.com/elct9620/e2eadcb8cf431f30a1b080bdee4077a1) 找到。

```
Warming up --------------------------------------
               Fiber     1.000  i/100ms
           Net::HTTP     1.000  i/100ms
       [K] Net::HTTP     1.000  i/100ms
       [P] Net::HTTP     1.000  i/100ms
Calculating -------------------------------------
               Fiber      0.153  (± 0.0%) i/s -      1.000  in   6.553764s
           Net::HTTP      0.104  (± 0.0%) i/s -      1.000  in   9.656557s
       [K] Net::HTTP      0.109  (± 0.0%) i/s -      1.000  in   9.196089s
       [P] Net::HTTP      0.145  (± 0.0%) i/s -      1.000  in   6.877551s

Comparison:
               Fiber:        0.2 i/s
       [P] Net::HTTP:        0.1 i/s - 1.05x  slower
       [K] Net::HTTP:        0.1 i/s - 1.40x  slower
           Net::HTTP:        0.1 i/s - 1.47x  slower

Calculating -------------------------------------
               Fiber   633.129k memsize (     8.289k retained)
                         5.040k objects (    82.000  retained)
                        50.000  strings (    50.000  retained)
           Net::HTTP     9.057M memsize (    11.527k retained)
                         5.834k objects (   116.000  retained)
                        50.000  strings (    50.000  retained)
       [K] Net::HTTP     4.777M memsize (    11.078k retained)
                         4.794k objects (   113.000  retained)
                        50.000  strings (    50.000  retained)
       [P] Net::HTTP    17.440M memsize (    11.047k retained)
                         5.874k objects (   107.000  retained)
                        50.000  strings (    50.000  retained)

Comparison:
               Fiber:     633129 allocated
       [K] Net::HTTP:    4776761 allocated - 7.54x more
           Net::HTTP:    9056946 allocated - 14.31x more
       [P] Net::HTTP:   17440446 allocated - 27.55x more
```

這一次的測試我也額外的補上了使用 Keep-Alive 的 Net::HTTP 實作，不過速度上的變化變得有點微妙，應該是測試還不完善造成的數據不太準確。不過我們可以觀察到記憶體的差距並沒有原本的那麼巨大，主要是因為 Net::HTTP 分配了很多物件在處理，另外因為有一部分的功能是重複的（有兩個緩衝區），也造成有多餘的記憶體被分配。

### 四、修改 Net::HTTP 採用 Fiber 模式

這部分還不完整所以就沒有把程式碼放到 Gits 上了，整個實驗成功的話會製作一個新的 Ruby Gem 來提供這個功能。

```
Warming up --------------------------------------
               Fiber     1.000  i/100ms
           [K] Fiber     1.000  i/100ms
            Net:HTTP     1.000  i/100ms
       [K] Net::HTTP     1.000  i/100ms
       [P] Net::HTTP     1.000  i/100ms
   [P + K] Net::HTTP     1.000  i/100ms
Calculating -------------------------------------
               Fiber      0.320  (± 0.0%) i/s -      2.000  in   6.260364s
           [K] Fiber      0.469  (± 0.0%) i/s -      3.000  in   6.401384s
            Net:HTTP      0.247  (± 0.0%) i/s -      2.000  in   8.122089s
       [K] Net::HTTP      0.314  (± 0.0%) i/s -      2.000  in   6.408347s
       [P] Net::HTTP      0.365  (± 0.0%) i/s -      2.000  in   5.867113s
   [P + K] Net::HTTP      0.393  (± 0.0%) i/s -      2.000  in   5.091580s

Comparison:
           [K] Fiber:        0.5 i/s
   [P + K] Net::HTTP:        0.4 i/s - 1.19x  slower
       [P] Net::HTTP:        0.4 i/s - 1.29x  slower
               Fiber:        0.3 i/s - 1.47x  slower
       [K] Net::HTTP:        0.3 i/s - 1.49x  slower
            Net:HTTP:        0.2 i/s - 1.90x  slower

Calculating -------------------------------------
               Fiber     8.738M memsize (   148.484k retained)
                         2.893k objects (   347.000  retained)
                        50.000  strings (    43.000  retained)
           [K] Fiber     4.490M memsize (    72.864k retained)
                         1.860k objects (   147.000  retained)
                        50.000  strings (    33.000  retained)
            Net:HTTP     9.019M memsize (    11.607k retained)
                         5.476k objects (   114.000  retained)
                        50.000  strings (    50.000  retained)
       [K] Net::HTTP     5.796M memsize (     9.899k retained)
                         4.568k objects (   103.000  retained)
                        50.000  strings (    50.000  retained)
       [P] Net::HTTP    17.436M memsize (    10.764k retained)
                         5.522k objects (   108.000  retained)
                        50.000  strings (    50.000  retained)
   [P + K] Net::HTTP     8.990M memsize (    10.812k retained)
                         4.805k objects (   106.000  retained)
                        50.000  strings (    50.000  retained)

Comparison:
           [K] Fiber:    4490290 allocated
       [K] Net::HTTP:    5796367 allocated - 1.29x more
               Fiber:    8737780 allocated - 1.95x more
   [P + K] Net::HTTP:    8989723 allocated - 2.00x more
            Net:HTTP:    9019075 allocated - 2.01x more
       [P] Net::HTTP:   17436128 allocated - 3.88x more

```

這次加入了更多的測試項目進來，而且可以發現就是在這個情境之下 Fiber (Keep-Alive) 版本其實相對於 Thread 版本還要快，但是在記憶體使用上幾乎就佔不到什麼優勢。

## 總結

首先要強調一件事情，這些測試數據都還是不完整的。而且條件其實不太對等，因此只能作為參考使用，並不能當作評估的依據。

不過我們也可以觀測到幾件事情，就是 Net::HTTP 在處理網路連線的部分，其實並不慢（Socket / IO 都是 C 語言實作）而當我們開始處理資料（緩衝）的時候，因為有許多檢查所以才造成的記憶體的浪費，如果沒有需要做很多處理的話，自己使用 TCPSocket 處理可能會節省非常多的記憶體使用。

而 Net::HTTP 理論上來說會比 Fiber 的版本比較慢，主要是因為 Net::BufferedIO 會在讀取 Body 的時候 Blocking 住，雖然這個過程是使用 Nonblocking 的行為，但是並無法像 Fiber 一樣在遇到 Blocking 的時候先讓其他人處理。

數字上看起來接近可能是因為網路其實都是順暢而且資料都不大的狀況下，才能有這樣的結果。
