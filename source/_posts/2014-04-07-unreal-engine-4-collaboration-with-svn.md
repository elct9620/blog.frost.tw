---
layout: post
title: 'Unreal Engine 4 collaboration with SVN'
date: 2014-04-07 07:16
comments: true
tags: [SVN, 遊戲, 心得, VCS]
---
這幾年來 3D 遊戲的門檻隨著 Unity3D 的出現，從原本 Open Source 的 Ogre Engine 等，層次一口氣提高到了「商業運用」的等級，支付一定的費用給引擎公司，也許就可以用到 3A 遊戲等級的引擎。只要有付費，許多問題與麻煩都可以交給引擎公司，相較 Open Source 的形式，某種意義上也是更加容易的製作遊戲（至少不會有問題找不到解法，大絕就是呼叫客服）

自從 UE3 開放免費下載（抽成形式）後，這次的 UE4 稍微改了模式，月費制加抽成（5%）並且在最近公佈下載與付費的方式。

而我的同學長久以來就有著要用 Unreal Engine 的怨念，但因為我一直以「在 Mac 上不方便」為理由，讓他乖乖選擇 Unity3D 不過 UE4 來勢洶洶的支援了 Mac 我也不得不認命⋯⋯

<!-- more -->

雖然台灣尚未開放付費，但是所謂的 Source Code （付費用戶可以取得，不過也得要可以拿到，因為要用它來 Compile 出遊戲⋯⋯）卻已經可以透過網路上下載（總是會有人想公佈出來嘛～～ XD）

說到 Unreal Engine 我一直以來都覺得這架構很奇葩，雖然 UE4 有做過調整有了 Project 概念（上一代完全像是在做 MOD 一樣超痛苦）也換成了 C++ 撰寫（別亂來，還能夠支援 Mac / Win 不改程式 Compile 成功）各方面來說都是個吸引人的引擎。

順帶一提，月費定價很便宜，台幣六百左右（重點是拿到就可以不更新，付費只是更新用的，軟體不會被鎖住不能開 XDD）

那麼，既然要用這麼大型的引擎做遊戲，我們又不可能不回家，就只好找出線上協作的方案拉！
（這邊是用 SVN 不過實際用過 UE4 就會感受到大型遊戲公司的開發環境實在是太好了，光是 Compile 時間就可以看出設備的差異 XDD）

首先，既然要用 SVN 就要有 SVN Server 這問題很簡單，隨便一檯電腦，或者 Synology 或者 QNAP 的 NAS 都行，不過用 NAS 的好處是比較省電，而 SVN 伺服器跟裝 APP 一樣簡單，又是設計給儲存的。
（UE4 範例遊戲專案開設完畢就是 600MB 上 SVN 抓回來就是 1GB 各種愉悅 XD）

然後，以下是雷點（SNV Plugin 雖然官方提供，但是 Epic Game 自己不用，所以根本不知道這 Plugin 根本殘障⋯⋯）

### 開設專案

首先，我們要有一個正常的 Game Project 大家都懂的⋯⋯
註：第一次用 SVN 所以都是基本技能 XD

> cd ~/Documents/Unreal Projects/myUE4Project
> SVN import . svn://my-svn.server.com/myUE4Project

個人習慣是這樣（跟 Git 做法一樣）總之就是先 Import 然後丟到遠端就對了⋯⋯
（不知道是不是因為我在 LAN 所以超級快就傳完了 0w0）

> cd ..
> rm -rf myUE4Project

各位沒看錯，就是要把這 Project 刪掉，因為 `SVN import .` 會在 myUE4Project 裡面開一個目錄也叫 myUE4Project 然後裡面才有 .svn 的目錄。
（沒試過把 .SVN 拉出來就是了 XD）

> SVN co svn://my-svn.server.com/myUE4Project

重新抓下來，這樣就算是做完 `git init` 這動作了吧（趴

### 跳過不必要的檔案

有一些檔案要 ignore 掉，因為是快取跟沒有用的檔案。

> SVN propedit svn:ignore .

然後會打開預設編輯器（大概是 VIM 之類的⋯⋯）

內容就這這幾個目錄
```
Saved
Intermediate
build
DerivedDataCache
```

然後，就是很悲劇的要來清理這些目錄拉⋯⋯
註：build 會失敗，很奇怪 XD

> SVN delete --keep-local Saved
> SVN delete --keep-local Intermediate
> SVN delete --keep-local build
> SVN delete --keep-local DerivedDataCache
> SVN commit

完成後就算是做好一個乾淨的專案了～

### UE4 設定

![螢幕快照 2014-04-07 下午3.38.12.png](http://user-image.logdown.io/user/52/blog/52/post/192743/xm6y9WhGTqW17rgurYPw_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-04-07%20%E4%B8%8B%E5%8D%883.38.12.png)

基本上就是右上角有個紅色叉叉（選單可以找到，但是我竟然找不到）點開後設定好，就會變成綠色箭頭。

### 編輯與上傳

編輯就跟一般編輯一樣（不過可以先去對要編輯的檔案 右鍵 > Check Out 鎖住不讓其他人同時編輯）存檔時會一併做這些動作，並且 Check In 進去。

最後就是 File > Submit to Source Control 選則需要的檔案（這也很怪，遊戲引擎整個也混入 QAQ）然後 Submit 上去（要打說明，跟一般 Commit 一樣）

### 同步

這個大雷，竟然完全沒有辦法「同步」所以就是手動跑 `SVN update` 去解了（不過至少還能看知道現在的 Rev 已經不是 HEAD 了就是⋯⋯）

用 Mac 的用戶 XCode 支援，可以從那邊跑。
至於 Win 的用戶，可以安裝 TortoiseSVN 來做 Update 的動作。

以上是目前搞 SVN 協作的小小心得，簡單說就是⋯⋯
「很雷」

另外要 Mac / Win 這樣就可以協作了，不過有寫 Module （裡面有 C++ 程式）是要分別 Compile dylib 跟 dll 先丟上 SVN 不然會告訴你找不到 Module 不給開 XD
