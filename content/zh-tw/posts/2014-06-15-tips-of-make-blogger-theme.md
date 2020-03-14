---
layout: post
title: '自製 Blogger 佈景的小技巧'
publishDate: 2014-06-15 06:04
comments: true
tags: [CSS, 前端, 心得]
---
據說自從期末開始後，就很久沒有寫網誌了⋯⋯

就在期末快結束的某一天晚上，高中同學傳訊息問我：「有在忙嗎？」
於是，我就這樣開始拯救快被<del>二一</del>的好朋友拉 XD

老師：「阿你們就回去改一改 Blogger 佈景當期末」

從以前開始，我就一直覺得 Blogger 的佈景超難改，那鬼一般的 XML 總是讓我的網誌東少一塊西少一塊（崩潰
不過為了拯救同學，我只好開始重新面對它⋯⋯
（至於我一直都沒有用 Blogger 當網誌，有很大的原因就是這東西 Orz）

<!--more-->

先來偷曬一下<del>好基友</del>的作業最後長怎樣 XDD
（據說是從晚上 10 點開始，做到凌晨 4 點，不過對我來說算是品質不太夠拉，畢竟中間要講解 Orz）

![螢幕快照 2014-06-15 下午3.45.22.png](https://user-image.logdown.io/user/52/blog/52/post/206151/WvbhbDOR4eJ87uWvW0fQ_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-06-15%20%E4%B8%8B%E5%8D%883.45.22.png)

其實整體來說還算不錯，有不少地方需要透過一些 CSS 小技巧來把原本的設計元素置換掉⋯⋯
（Blogger 很多元件的生成會讓你想哭啊 XDD）

### Step1. 選擇適合的佈景

如果設計力滿點其實就不用，不然我會各種建議到佈景網站選一個看起來不錯的佈景當參考⋯⋯

因為十點左右還在跟同學用 Skype 開會，所以我先請朋友到 [ThemeForest](https://themeforest.net/) 挑選一個適合的布景。最後選定的是名為 [Agazine](https://themeforest.net/item/agazine-premium-retina-magazine-wordpress-theme/7664423?WT.ac=category_thumb&WT.z_author=BloomPixel) 的佈景。

> 據說朋友原本想用窄版的設計，但是被我坑了變成 Full-Width 因為他跟我說老師希望有 jQuery 效果，那我就想說套 Slider 用 Full-Width 比較潮啊，結果沒有（淚

總之，先設計好你的視覺吧！
（等一下就知道 Blogger 的 HTML 是非常可怕的！）

### Step2. 清理 Blogger 的 HTML 與 XML

這一個階段對我來說算是最討厭的部分，以前的經驗就是常常不小心清到 XML 然後造成整個 Layout 毀滅性的崩潰。
不過可能是最近比較有耐心，所以就失誤率降低（也許是 Google 有加入檢查功能）

![螢幕快照 2014-06-19 上午10.03.25.png](https://user-image.logdown.io/user/52/blog/52/post/206151/ywvwq8vaQcivDHO1b65w_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-06-19%20%E4%B8%8A%E5%8D%8810.03.25.png)

預設的佈景大概是長這樣，我們先到 Blogger 的後台 > 範本 > 編輯 HTML 來做一些清理。

![螢幕快照 2014-06-19 上午10.04.37.png](https://user-image.logdown.io/user/52/blog/52/post/206151/xwCwHyY7QESQNzeFZuVn_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-06-19%20%E4%B8%8A%E5%8D%8810.04.37.png)

打開後，會看到非常多類似下面的 HTML 結構。

```html
<div class='body-fauxcolumns'>
    <div class='fauxcolumn-outer body-fauxcolumn-outer'>
    <div class='cap-top'>
      <div class='cap-left'/>
      <div class='cap-right'/>
    </div>
    <div class='fauxborder-left'>
    <div class='fauxborder-right'/>
    <div class='fauxcolumn-inner'>
    </div>
    </div>
    <div class='cap-bottom'>
      <div class='cap-left'/>
      <div class='cap-right'/>
    </div>
    </div>
  </div>
```

基本上，這個主要是 Blogger 用於輔助顯示以及後台「版面配置」的「小工具」排版所使用的（自己撰寫就用不到）

![螢幕快照 2014-06-19 上午10.06.46.png](https://user-image.logdown.io/user/52/blog/52/post/206151/v6tF55GORzasob84gjxE_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-06-19%20%E4%B8%8A%E5%8D%8810.06.46.png)

預設是這樣，清理掉之後基本上這個排版就會直接解散掉，不過基本上還是能夠使用。
不過開始嘗試自定 HTML 的話，大多數情況還是會選擇去編輯小工具的 XML + HTML 呈現，因此大多時候只是輔助新增而已。

![螢幕快照 2014-06-19 上午10.09.14.png](https://user-image.logdown.io/user/52/blog/52/post/206151/fWp0aGM1S1WJGbtNnlcT_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-06-19%20%E4%B8%8A%E5%8D%8810.09.14.png)

有些人可能不喜歡這一條導覽列，一般可能會用 CSS 去除，不過其實可以在 HTML 裡面找到，直接刪除即可。

![螢幕快照 2014-06-19 上午10.09.01.png](https://user-image.logdown.io/user/52/blog/52/post/206151/gXDt8iSryAqEBZFL8psQ_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-06-19%20%E4%B8%8A%E5%8D%8810.09.01.png)

就是上述的語法片段（黑色箭頭代隱藏了數行，因為行數偏多所以就只用圖片呈現）

之後就是儘量不去動淺綠色的部分（可以展開看內容是什麼，來決定是否更動，更動風險是比較大的）
把整個 HTML 清理到堪用的程度（不過幾千行肯定是免不了的，而 JavaScript 的部分也要小心不要動到）

基本上刪掉必要的 XML 或者 HTML 有問題，都會有錯誤提示。這時候用 Ctrl + Z (Cmd + Z) 就可以還原，可以安心的修改。
但是還是建議定時存檔跟備份，比較保險，以免心血毀掉。

![螢幕快照 2014-06-19 上午10.12.04.png](https://user-image.logdown.io/user/52/blog/52/post/206151/TcXnPUA9QCW802OOkTjR_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-06-19%20%E4%B8%8A%E5%8D%8810.12.04.png)

錯誤提示大致上如上（裡面有一個 `template-skin` 的 XML 區段，是可以刪掉的，估計跟前面提到的版面配置有關。）

另外要注意的是有些 HTML/XML 可能會在原始碼底部，有些可能會是 Widget (小工具) 的定義，總之有一部分會是不合原有 HTML 結構的邏輯，是需要注意的。

在修改與整理的時候，建議參照 Blogger 的[說明](https://support.google.com/blogger/answer/46995?hl=zh-Hant)會比較好。

註：其實挺費力的，大概要花上一兩個小時才能整理出來，不輸手動設計網站的工作量，但是規劃好會有助於後續 CSS 的撰寫。

### Step3. 撰寫 CSS 的技巧

大致清理完 HTML 調整成自己需要的結構後，大概會看到類似這樣的畫面。

![螢幕快照 2014-06-20 下午9.24.43.png](https://user-image.logdown.io/user/52/blog/52/post/206151/rOFRRSMJTwGLfRTSsaZJ_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-06-20%20%E4%B8%8B%E5%8D%889.24.43.png)

因為 Google 預設會加上一些樣式，的設定所以並不是完全的無樣式狀態。
不過這也是還沒有做過 CSS Reset 的狀態，所以最好在 HTML 中透過一些 CDN 服務提供的 CSS Reset 來做一次基本的重設。

註：我習慣用 CDNJS 的 [Normalize.CSS](https://cdnjs.com/libraries/normalize) 來做 CSS Reset

![螢幕快照 2014-06-20 下午9.31.16.png](https://user-image.logdown.io/user/52/blog/52/post/206151/QkXjDj9R9COqCYKgov1A_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-06-20%20%E4%B8%8B%E5%8D%889.31.16.png)

如果想要更乾淨，可以考慮把 `<b:skin>` 到 `</b:skin>` 裡面的 CSS 一並清除，就可以獲得如上圖的呈現（可以看到還有一些內距設定是預設就存在的）

![螢幕快照 2014-06-20 下午9.33.40.png](https://user-image.logdown.io/user/52/blog/52/post/206151/7LHOCt6VTzS3Rq0FVJRK_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-06-20%20%E4%B8%8B%E5%8D%889.33.40.png)

雖然進行了清理，不過混入了 Blogger 產生的 HTML 後其實有時候也是難以分辨的。
因此建議搭配瀏覽器的 Inspect 功能來找出需要修改的元素，然後一步一步的做修改。

後面基本上就是一個前端（設計師）的 CSS 技巧展現，我就把當時教同學的內容一步一步用圖片重現。
註：當時基本上是以整體、頁首、頁尾、側欄、內容依序往複雜的部分修改，跟截圖的順序是差不多的。

![螢幕快照 2014-06-20 下午9.36.47.png](https://user-image.logdown.io/user/52/blog/52/post/206151/bVVhttPQ1aUJrbwOHiZt_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-06-20%20%E4%B8%8B%E5%8D%889.36.47.png)

基本的配色跟設定（其實配色是後來有調整的，原本是直接拿參考佈景的配色）

![螢幕快照 2014-06-20 下午9.39.21.png](https://user-image.logdown.io/user/52/blog/52/post/206151/XoG8ofV4QMiXygl1iCJZ_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-06-20%20%E4%B8%8B%E5%8D%889.39.21.png)

頁首的配置，使用了換圖技巧把標題替換（不過現在看不出來，Blogger 的預覽有些地方跟實際呈現不同）
（標題呈現不正常，主要是因為首頁這個標題不會呈現連結效果，但是一般都是針對連結做設定，可以修改 HTML 修正）

![螢幕快照 2014-06-20 下午9.40.34.png](https://user-image.logdown.io/user/52/blog/52/post/206151/yV899t2MRaO0csP9LEbp_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-06-20%20%E4%B8%8B%E5%8D%889.40.34.png)

選單，上面其實有加了一些漸變。

![螢幕快照 2014-06-20 下午9.41.48.png](https://user-image.logdown.io/user/52/blog/52/post/206151/8nRoRmDQvek6Swq08SA5_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-06-20%20%E4%B8%8B%E5%8D%889.41.48.png)

頁尾（少寫一行，不過基本上就是這樣調整出樣式）

![螢幕快照 2014-06-20 下午9.43.49.png](https://user-image.logdown.io/user/52/blog/52/post/206151/ZTDOiQYeRTmQqWEkzYrB_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-06-20%20%E4%B8%8B%E5%8D%889.43.49.png)

主要內容的部分，基本上就是分欄跟上底色。

![螢幕快照 2014-06-20 下午9.48.24.png](https://user-image.logdown.io/user/52/blog/52/post/206151/AdHuUA4zSlyUEVr1Mrc0_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-06-20%20%E4%B8%8B%E5%8D%889.48.24.png)

小工具的部分，我有用 ICON Font 做一些修改，至於會並排事組件的排列設定關係，修改後就會正常。

![螢幕快照 2014-06-20 下午9.51.12.png](https://user-image.logdown.io/user/52/blog/52/post/206151/LiOvZ4A3SNebv4O6WGkO_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-06-20%20%E4%B8%8B%E5%8D%889.51.12.png)

最後是文章部分，其實時間應該擺到下面，不過要花一點時間調整 HTML 就沒有做了。

### 後續處理

之後其實就是針對 RWD 的處理，這部分可能要另外研究（Blogger 似乎是會另外生成 HTML 來呈現）
其實還有很多細節，不過主要的重點還是在於需要非常耐心的把 Blogger 的 HTML 清理乾淨，然後一步一步的把 CSS 套用上去。
（其實我真的很希望可以用 SASS 之類的去寫，效率上會高出非常多啊⋯⋯ ）
