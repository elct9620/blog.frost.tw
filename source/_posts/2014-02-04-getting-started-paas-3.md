---
layout: post
title: 'PaaS 入門指南（三）'
date: 2014-02-04 06:13
comments: true
tags: [介紹, 雲端, PaaS, 入門]
---
過年我就淡定放假不寫文了（被拖走
根據 Google Analytic 統計，週二的這篇文章會讓訪客增長 XD

上一篇極其混亂的 [PaaS 入門指南（二）](https://blog.frost.tw/posts/2014/01/21/getting-started-paas-2)已經簡易的向大家介紹相關工具的安裝（各種痛苦啊那個，感覺 AppFog 的對 Windows 比較友善⋯⋯）

這篇我們先休息一下，因為我發現字太多我寫很累看的人好像也很累 XD
先來簡易介紹一下 AppFog / OpenShift 的快速安裝功能。

<!-- more -->

## AppFog

先從 AppFog 來介紹，畢竟這孩子比較友善 XD

![螢幕快照 2014-02-04 下午2.19.23.png](https://user-image.logdown.io/user/52/blog/52/post/177923/uxy4nCYNTR6Ork7X93VC_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-02-04%20%E4%B8%8B%E5%8D%882.19.23.png)

登入後，應該會看到類似的畫面（我的上面已經有開一個，那個是特殊用途以後再討論 XD）
我們先點選「New App」的按鈕，來產生一個 Application （對 PaaS 來說，通常不是用 Server 來作為單位，而是一個 Web Application 也就是說，我們只負責把做好的網站放上去，而不用管伺服器設定的意思。）

![螢幕快照 2014-02-04 下午2.22.37.png](https://user-image.logdown.io/user/52/blog/52/post/177923/ZMzLEePeQba7TW5h70sY_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-02-04%20%E4%B8%8B%E5%8D%882.22.37.png)

第一步是選擇 Application 我們先選 WordPress 來當這次教學的範例。
（對 AppFog 來說 Ruby on Rails 之類的，都可以當作是一種 Application 反正不管他，要解釋也可以解釋個什麼出來 XD）

![螢幕快照 2014-02-04 下午2.25.15.png](https://user-image.logdown.io/user/52/blog/52/post/177923/ziKFll03QaCOqTf6CVjT_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-02-04%20%E4%B8%8B%E5%8D%882.25.15.png)

第二和第三步分別是選伺服器的位置以及域名（只支援子域名，而且很長，是 名字.(伺服器區域).af.cm 的格式。）

右邊會顯示這個 Application 最基本消耗的 RAM 跟 Service (資料庫) 印象中 WordPress 基本是 256M 之後都可以調整。
完成後點選「Create App」產生即可。

![螢幕快照 2014-02-04 下午2.28.01.png](https://user-image.logdown.io/user/52/blog/52/post/177923/6LyQ1AXRBihdwsz6VTdG_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-02-04%20%E4%B8%8B%E5%8D%882.28.01.png)

接下來會出現安裝中的畫面，稍微等 AppFog 設定即可。

![螢幕快照 2014-02-04 下午2.29.04.png](https://user-image.logdown.io/user/52/blog/52/post/177923/xKHSmUxSSuCY3Y2ZvG2L_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-02-04%20%E4%B8%8B%E5%8D%882.29.04.png)

看到這個畫面其實就是成功了，右上角的「View Live Site」就可以看到準備安裝的 WordPress 網誌。
（註：不知道是哪裡卡到，我這邊測試打開是一遍空白，如果各位有類似情況我們先放到一邊，安裝語言包先～）

**如果想要先升級 WordPress 可以先不要做安裝的動作。**

首先先下載 WordPress 的原始碼到電腦。
（註：AppFog 使用的 WordPress 阪本很舊，有需要可以下載新版的 WordPress 覆蓋過去，但是要確保 `wp-config.PHP` 沒有被蓋掉。）

```
af pull <APP 名稱> <下載的位置>
```

![螢幕快照 2014-02-04 下午2.44.07.png](https://user-image.logdown.io/user/52/blog/52/post/177923/ZGdpsEm2SV2YmLj9EiBy_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-02-04%20%E4%B8%8B%E5%8D%882.44.07.png)

APP 名稱就是這個，我的就是 `aotoki-blog` 這會因為你的選擇而改變。
下載的位置就是你電腦的目錄，例如我用 `cd ~/Desktop` 然後用 `af pull aotoki-blog blog` 那就會存到我桌面上的 `blog` 資料夾裡面。

（Windows 用戶沒有 ~ 符號，印象中是 %HOME_PATH% 或者 %HOMEPATH% 可以自己嘗試看看）

接著打開 `wp-include/version.PHP` 來查看版本。

![螢幕快照 2014-02-04 下午2.46.39.png](https://user-image.logdown.io/user/52/blog/52/post/177923/OZ6MTvW0RXehiYHpFnRW_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-02-04%20%E4%B8%8B%E5%8D%882.46.39.png)

這邊看到的是 3.4.2 版，寫這篇文章的時候已經是 3.8.1 版，太舊了，到 [WordPress 正體中文](https://tw.wordpress.org/) 的官方網站下載最新版，然後覆蓋掉整個 WordPress （除了 `wp-config.PHP` 之外）

註：如果不想升級，必須自己到方網站下載 zh_TW.mo 檔案，然後放到 `wp-content/languages` 資料夾中。

接著編輯 `wp-config.PHP` 檔案。

找到
```PHP
define('WP_LANG', '');
```

改為
```PHP
define('WP_LANG', 'zh_TW');
```

簡單說就是指定使用的語言。

然後上傳回 AppFog。

```
af update <APP 名稱>
```

註：有另一個叫做 `push` 的指令看起來好像跟 `pull` 是一對的，但是不是（千萬別用錯，我就踩到這雷⋯⋯）

![螢幕快照 2014-02-04 下午2.54.33.png](https://user-image.logdown.io/user/52/blog/52/post/177923/cJYQyDZ4RveMfNlggUBX_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-02-04%20%E4%B8%8B%E5%8D%882.54.33.png)

其實這個步驟會要稍微等一下，不過不會太久。
（上傳失敗或有錯誤應該也蠻好懂的，不是全部 OK 應該就是有壞掉 XD）

![螢幕快照 2014-02-04 下午2.56.26.png](https://user-image.logdown.io/user/52/blog/52/post/177923/pyeQ1ks9QjujDBC3s3KW_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-02-04%20%E4%B8%8B%E5%8D%882.56.26.png)

一切如預期一般，打開就是中文的安裝畫面。

之後完成安裝就可以得到一個 WordPress 了！

至於 OpenShift 的部分容許我拆成第二部分，我已經花了一小時在寫這一段了 XD

關於使用 PaaS 檔案相關機制時也有注意事項，以下務必記得：

* 任何從 WordPress 後台（或者你的程式）上傳的檔案，都有可能在下次更改時被刪除或者不見（請看附註）
* 所有的程式碼都是 PaaS 透過類似版本管理的方式控管的，除此之外的變更是無法控制的
* 程式碼容量有上限，非這個 Application 所需的圖片、檔案都應該放置在 Amazon S3 之類的檔案儲存服務上

也就是說，像是佈景、插件，雖然你可以透過 WordPress 的後台安裝，但是下次你更新 WordPress 時都會不見（一旦運行了 `af update`）因此正確的做法是 `af pull` 後，在自己電腦更改，然後 `af update` 到 AppFog 或者其他平台（依照其指令）

關於這些 PaaS 的限制原因，我會在入門篇寫完後，撰寫進階篇時將我過去研究和探索的經驗分享給大家。
