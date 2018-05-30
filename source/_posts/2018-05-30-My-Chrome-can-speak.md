---
title: 我的 Chrome 會說話
date: 2018-05-30 12:44:30
tags: [筆記, JavaScript]
---

這是很多年前的事情了，當時看到別人的 Chrome 竟然會說話，讓我震驚了很久。但是花了很多年都沒有找到要怎麼做，不過最近因為一些關係，我終於知道了他的秘密！

<!-- more -->

首先，這不是鬼故事！這篇文章要討論的是 Web Speech API 這個由 Google 所提交的功能。主要就是做「語音轉文字」跟「文字轉語音」兩件事情，像是有在玩遊戲可能有用過 Discord 這種類似 Slack 的通訊軟體，裡面提供的朗讀功能應該就是透過這個 API 實作的。

## Web Speech API

在 Web Speech API 裡面其實只有兩個功能「語音轉文字」跟「文字轉語音」兩種。文字轉語音的功能可能比較常見，我們可以在像是在一些地方看到。

像是 Google 搜尋右邊的「麥克風」圖示，就是利用 Web Speech API 所製作的功能，讓我們可以利用講話的方式直接輸入搜尋的關鍵字。

![Google 搜尋的語音框](https://blog.frost.tw/images/my-chrome-can-speak/screenshot.png)

另外就是將文字念出來，也就是這篇文章要討論的內容。

## Hello World

那麼，要怎麼讓 Chrome （或者 Firefox 發出聲音呢？）

```js
var msg = new SpeechSynthesisUtterance('Hello World');
window.speechSynthesis.speak(msg);
```

首先，我們要產生出一個 `SpeechSynthesisUntterance` 物件，把要講的東西放進去。然後再透過 `speechSynthesis` 提供的 `speak` 把他唸出來。

```js
var msg = new SpeechSynthesisUtterance('世界你好！');
window.speechSynthesis.speak(msg);
```

當然，講中文也是完全沒有問題的。

> 主要是這個 API 預設會用作業系統（Ex. macOS 的 VoiceOver 功能）所以不管是哪個瀏覽器預設都會用同樣的聲音講話。

## 調整語音

因為作業系統中可能會針對各種國家的語言提供語音，所以同樣是中文，我們也可以從 `zh-TW` 切換到 `zh-HK` 讓他用廣東話的方式念出來。

```js
var voices = window.speechSynthesis.getVoices();
var msg = new SpeechSynthesisUtterance('世界你好！');
msg.voice = voices[35]; // 每台電腦/瀏覽器結果可能略有不同

window.speechSynthesis.speak(msg);
```

> 目前似乎只有 Safari 可以正常使用，其他瀏覽器不一定可以用。

另外就是 `SynthesisUtterance` 還有幾個參數可以玩。

* `pitch` - 語調 0 ~ 2 設定，越大音越高
* `volume` - 音量

## 小結

這個功能在某些應用情境，像是聊天機器人。或者類似 Discord 這種通訊軟體，算是很有用的。不過似乎很少人在討論，就算是 Google 查詢「Speech API」也還不一定會看到，不過作為一個有趣的小功能倒是值得一試。

> 印象中可以選擇男聲或者女聲，但是找不到。也許是 Chrome 裡面提供的語音包才有，不過目前 Chrome (66.0) 似乎切換語音不太正常，就暫時無法測試。

---

## 參考文章

* http://blog.zhusee.in/post/56286985943/web-speech-api-part-i-using-speech-synthesis-to-make-bro
* https://developers.google.com/web/updates/2014/01/Web-apps-that-talk-Introduction-to-the-Speech-Synthesis-API
