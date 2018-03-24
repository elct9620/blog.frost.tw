---
title: 使用 Turbolinks 時 Google Analytics 並沒有正確運作
date: 2018-03-24 10:28:21
tags: [筆記,Ruby on Rails,JavaScript]
---

最近因為在[五倍紅寶石](https://5xruby.tw)配合同事做官網的 SEO 優化，比較常見的行銷工具像是 Google Analytics 之類的就一起拿出來玩。

實驗的對象首選當然是自己的網站，不過在調整的時候卻發現有一些情況有點異常。

<!-- more -->

當我使用 [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna?hl=zh-TW) 去看我的部落格（這個網站）的時候，換頁完全沒有任何事件被紀錄進去。

很明顯的，這是 Google Analytics 的 PageView 事件沒有被偵測到。而第一個應該要被檢查的，就是很多人在 Ruby on Rails 推出 Turbolinks 因為**不會使用**通常會搶先關掉的這個功能。

Turbolinks 本身是一個對 UX（使用者體驗）改善的套件，可以將網頁的切換變得比較平順。簡單來說，就是**利用 Ajax 載入**新頁面後，再替換掉改變的內容。

也就是說，實際上我們並沒有觸發真實的換頁行為。也就不會將 Google Analytics 的 JavaScript 重新讀取，自然就不存在紀錄頁面瀏覽事件（PageView）這件事情。

解決方案其實很簡單，我們只需要像處理最多人不太熟悉的 jQuery + Turbolinks 無法搭配運作的問題一樣，正確的設定頁面讀取事件即可。

也就是從普通的綁定 `DOMContentLoaded` 事件，改為

```js
// jQuery Version
$(document).on('turbolinks:load', function() {
  // ...
})

// Pure JavaScript Version
document.addEventListener('turbolinks:load', function() {
  // ...
})
```

因為 JavaScript 已經正確載入了，所以只需要重新把 Google Analytics 的行為重現出來。

```js
document.addEventListener('turbolinks:load', function() {
  ga('create', 'UA-XXXXXXX');
  ga('set', 'location', location.pathname);
  ga('send', 'pageview');
})
```

不過，假設還想加上像是 Facebook Pixel 之類的追蹤程式碼，每個都設定大概是找到頭暈。所以比較好的方式，其實是改用 Google Tag Manager 來處理。

先讓每次 Turbolinks 讀取後，都發送一個自訂事件給 Google Tag Manager 來統一觸發事件。

```js
document.addEventListener('turbolinks:load', function() {
    if (typeof dataLayer !== "undefined" && dataLayer !== null) {
        dataLayer.push({
            'event':'turbolinks:load',
            'virtualUrl': event.data.url
        });
    }
})
```

接著在 Google Tag Manager 上面新增 Trigger 追蹤 `turbolinks:load`（這是自訂事件的名字）並把有需要紀錄頁面瀏覽的 Tag 加上這個 Trigger 即可。

另外現在回去看目前這個使用 Turbolinks 的網站版本，在換上去後轉換率有明顯的往下降，可能就是這個關係。

![Google Analytics 分析資料](images/google-analytics-not-correct-when-using-turbolinks/ratio.png)

最近會在關注一下轉換率有沒有提高，或者跳出率下降之類的。雖然跳出率如果沒有下降，還蠻傷心的 XD