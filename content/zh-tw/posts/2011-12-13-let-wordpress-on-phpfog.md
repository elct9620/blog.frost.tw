---
layout: post
title: '在PHPFog上架設WordPress(中文版)'
date: 2011-12-13 20:05
comments: true
tags: 
---


###前言
---
你還在默默的找免空嗎？別再耗費精力啦！<br />
在PHPFog上安裝一個WordPress是非常簡單又容易的，趕緊申請一個帳號，開始你的「雲端網誌」吧！

<!--more-->

###申請帳號
---
首先，我們打開 [PHPFog](https://PHPfog.com) 官方網站。<br />
稍微往下捲動就會發現有三個輸入框，依序輸入信箱、密碼、確認密碼即可。<br />
[![螢幕快照 2011\-12\-13 下午7\.07\.35](https://farm8.staticflickr.com/7035/6504679843_9b48808e6c.jpg)](https://www.flickr.com/photos/elct9620/6504679843/)

點擊Get Started後，就會出現 Create new App 的畫面（第一次會這樣）<br />
[![螢幕快照 2011\-12\-13 下午7\.08\.04](https://farm8.staticflickr.com/7017/6504679987_49a8694545.jpg)](https://www.flickr.com/photos/elct9620/6504679987/)

###安裝
---

既然我們是要 WordPress Application 就選擇 WordPress<br />
[![螢幕快照 2011\-12\-13 下午7\.08\.13](https://farm8.staticflickr.com/7154/6504680061_5773351807.jpg)](https://www.flickr.com/photos/elct9620/6504680061/)

接著會要我們輸入一些資本資訊（管理員帳號、密碼、網址）<br />
[![螢幕快照 2011\-12\-13 下午7\.08\.37](https://farm8.staticflickr.com/7015/6504680155_67bde8968f.jpg)](https://www.flickr.com/photos/elct9620/6504680155/)
>如果你的帳號是 Beta 時就申請的，那麼 Custom Domain 是 Free 的，但是如果你是新用戶，想要 Custom Domain 就得支付每月 $5 的費用。

點選 Create App 之後，會進入該 Application 的管理畫面，此時會看到亮紅燈，寫著 Starting, Preparing App 之類的訊息。<br />
[![螢幕快照 2011\-12\-13 下午7\.09\.05](https://farm8.staticflickr.com/7033/6504680281_2df5c56394.jpg)](https://www.flickr.com/photos/elct9620/6504680281/)

###安裝Git
---
>Mac OS, Linux 的使用者我想應該都非常熟悉了，所以特地為 Windows 的使用者撰寫這部份的使用教學。<br />

首先，到 [Git官方網站](https://git-scm.com/) 下載Git來安裝。<br />
[![螢幕快照 2011\-12\-13 下午7\.12\.13](https://farm8.staticflickr.com/7013/6504680553_7fb16c0491.jpg)](https://www.flickr.com/photos/elct9620/6504680553/)

[![螢幕快照 2011\-12\-13 下午7\.12\.35](https://farm8.staticflickr.com/7170/6504680645_3d7173b3e0.jpg)](https://www.flickr.com/photos/elct9620/6504680645/)

下載好安裝檔後，直接執行並且安裝。<br />
> 基本上只要不斷 Next 即可。

[![螢幕快照 2011\-12\-13 下午7\.13\.50](https://farm8.staticflickr.com/7168/6504680727_542a7f3b7c.jpg)](https://www.flickr.com/photos/elct9620/6504680727/)

[![螢幕快照 2011\-12\-13 下午7\.14\.13](https://farm8.staticflickr.com/7004/6504680813_f221e74250.jpg)](https://www.flickr.com/photos/elct9620/6504680813/)

[![螢幕快照 2011\-12\-13 下午7\.21\.02](https://farm8.staticflickr.com/7024/6504680881_b586d314f0.jpg)](https://www.flickr.com/photos/elct9620/6504680881/)

###設定SSH Key
---

此時，我們的WordPress應該已經安裝好，呈現 Running 的狀態。<br />
[![螢幕快照 2011\-12\-13 下午7\.10\.36](https://farm8.staticflickr.com/7162/6504680377_8008996209.jpg)](https://www.flickr.com/photos/elct9620/6504680377/)
>建議各位先打開來看看，因為弦也中文化完畢後卻發生 404 找不到的錯誤，可能是 PHPFog 有問題，因此建議先檢查好在繼續動作。

如果你的帳號沒有任何SSH Key系統會提醒你新增一個（每台電腦都不同，也可以重新新增，類似鑰匙和鑰匙孔的關係）<br />
[![螢幕快照 2011\-12\-13 下午7\.11\.42](https://farm8.staticflickr.com/7169/6504680463_a6f3784357.jpg)](https://www.flickr.com/photos/elct9620/6504680463/)

打開你的 Git Bash<br />
[![螢幕快照 2011\-12\-13 下午7\.22\.01](https://farm8.staticflickr.com/7018/6504680937_02fb1a3322_t.jpg)](https://www.flickr.com/photos/elct9620/6504680937/)
>弦也教同學時使用 Git GUI 結果無法正常 Clone 檔案，因此建議還是用 Command Line 這種優良的傳統用法吧！（而且還可以耍帥讓同學覺得你很威！）

[![螢幕快照 2011\-12\-13 下午7\.23\.34](https://farm8.staticflickr.com/7023/6504681027_53e28807e3.jpg)](https://www.flickr.com/photos/elct9620/6504681027/)

輸入指令產生 SSH Key
<pre><code>$ ssh-keygen -t rsa</code></pre>
[![螢幕快照 2011\-12\-13 下午7\.24\.02](https://farm8.staticflickr.com/7008/6504681111_6e1861f7ae.jpg)](https://www.flickr.com/photos/elct9620/6504681111/)

會出現詢問，問你要將 SSH Key 存在哪裡（預設不用改動）<br />
[![螢幕快照 2011\-12\-13 下午7\.24\.11](https://farm8.staticflickr.com/7160/6504681193_6c0e6c0e33.jpg)](https://www.flickr.com/photos/elct9620/6504681193/)

接下來會問你是否設定密碼，可以不填寫按下Enter跳過（第一次輸入，第二次確認）<br />
[![螢幕快照 2011\-12\-13 下午7\.24\.18](https://farm8.staticflickr.com/7024/6504681263_cfc2ee4282.jpg)](https://www.flickr.com/photos/elct9620/6504681263/)

[![螢幕快照 2011\-12\-13 下午7\.24\.26](https://farm8.staticflickr.com/7145/6504681369_049d280698.jpg)](https://www.flickr.com/photos/elct9620/6504681369/)

[![螢幕快照 2011\-12\-13 下午7\.24\.32](https://farm8.staticflickr.com/7171/6504681467_42d7a8449a.jpg)](https://www.flickr.com/photos/elct9620/6504681467/)

完成後打開所在目錄
> 弦也的是 C:/Users/Adminstrator/.ssh (Windows7 會把 Users 顯示成 「使用者」)

[![螢幕快照 2011\-12\-13 下午7\.25\.16](https://farm8.staticflickr.com/7162/6504681583_2a239da451.jpg)](https://www.flickr.com/photos/elct9620/6504681583/)

雙擊 id_rsa.pub 檔案開啟（或者用 Notepad++ 之類的軟體開啟都可以）<br />
[![螢幕快照 2011\-12\-13 下午7\.25\.29](https://farm8.staticflickr.com/7035/6504681655_6a8942e06d.jpg)](https://www.flickr.com/photos/elct9620/6504681655/)

[![螢幕快照 2011\-12\-13 下午7\.25\.41](https://farm8.staticflickr.com/7166/6504681743_309eb6155e.jpg)](https://www.flickr.com/photos/elct9620/6504681743/)

全選裡面的內容，然後複製（千萬別剪下，然後存檔，這樣就不能用了！）<br />
[![螢幕快照 2011\-12\-13 下午7\.25\.52](https://farm8.staticflickr.com/7013/6504681825_4b910e9fc0.jpg)](https://www.flickr.com/photos/elct9620/6504681825/)

接著打開 PHPFog 的頁面，剛剛點擊了 Setup SSH Key 的連結，應該會出現如下的畫面。
<pre>Nickname 可以隨便填寫，如 My Computer 之類的，而 Public Key 則貼上你剛剛複製的東西</pre>

[![螢幕快照 2011\-12\-13 下午7\.26\.16](https://farm8.staticflickr.com/7033/6504681949_75d383ebd2.jpg)](https://www.flickr.com/photos/elct9620/6504681949/)

最後儲存即可！<br />
[![螢幕快照 2011\-12\-13 下午7\.26\.36](https://farm8.staticflickr.com/7004/6504682031_59527426b2.jpg)](https://www.flickr.com/photos/elct9620/6504682031/)


###下載原始碼
---
這樣和PHPFog溝通的程序就完成了，接著我們要把PHPFog安裝好的WordPress下載下來修改（新增中文化）

先回到App的管理介面<br />
[![螢幕快照 2011\-12\-13 下午7\.26\.56](https://farm8.staticflickr.com/7005/6504682111_e5b31713c9.jpg)](https://www.flickr.com/photos/elct9620/6504682111/)

選擇 Source Code 查看 git 要 clone 的位址<br />
[![螢幕快照 2011\-12\-13 下午7\.27\.20](https://farm8.staticflickr.com/7166/6504682195_b9c3ec48bb.jpg)](https://www.flickr.com/photos/elct9620/6504682195/)

將 git clone … 這行記錄起來，待會會用來下載。<br />
[![螢幕快照 2011\-12\-13 下午7\.27\.25](https://farm8.staticflickr.com/7172/6504682291_e41b2beb96.jpg)](https://www.flickr.com/photos/elct9620/6504682291/)

回到 Git Bash<br />
[![螢幕快照 2011\-12\-13 下午7\.27\.46](https://farm8.staticflickr.com/7035/6504682375_7dba14f155.jpg)](https://www.flickr.com/photos/elct9620/6504682375/)
>弦也打算把資料放在桌面，所以 cd Desktop 切換到桌面。

輸入剛剛的 git clone … 指令<br />
[![螢幕快照 2011\-12\-13 下午7\.28\.03](https://farm8.staticflickr.com/7170/6504682475_77af174f0e.jpg)](https://www.flickr.com/photos/elct9620/6504682475/)
>第一次連線會運你說確定要繼續連接（未知的遠端伺服器）此時輸入 yes 就可以繼續

連上之後就會開始下載 WordPress 原始碼<br />
[![螢幕快照 2011\-12\-13 下午7\.28\.10](https://farm8.staticflickr.com/7160/6504682575_82856fdcba.jpg)](https://www.flickr.com/photos/elct9620/6504682575/)

###中文化
---

在等待下載的時間，我們可以先到 [WordPress正體中文](https://tw.wordpress.org) 下載 WordPress 繁體中文版。<br />
[![螢幕快照 2011\-12\-13 下午7\.28\.40](https://farm8.staticflickr.com/7009/6504682639_1f6e064759.jpg)](https://www.flickr.com/photos/elct9620/6504682639/)

此時，剛剛下載的 WordPress 原始碼應該完成了，打開資料夾看一下。<br />
[![螢幕快照 2011\-12\-13 下午7\.33\.02](https://farm8.staticflickr.com/7148/6504682945_1e61552374.jpg)](https://www.flickr.com/photos/elct9620/6504682945/)
> 正常情況會看到一個 .git 資料夾，那是 git 的資料，千萬不要誤刪

解壓縮剛剛下載好的 WordPress 繁體中文版，然後都切換到 wp-content 資料夾準備複製語言包。<br />
[![螢幕快照 2011\-12\-13 下午7\.33\.28](https://farm8.staticflickr.com/7016/6504683105_c261ceb101.jpg)](https://www.flickr.com/photos/elct9620/6504683105/)

將 WordPress 正體中文版的 wp-content/languages 資料夾複製到 App 的 wp-content 資料夾裡面。<br />
[![螢幕快照 2011\-12\-13 下午7\.33\.46](https://farm8.staticflickr.com/7157/6504683333_10358897bc.jpg)](https://www.flickr.com/photos/elct9620/6504683333/)

接著打開 wp-config.PHP (根目錄下) 編輯(記事本或Notepad++等各種編輯器)。<br />
[![螢幕快照 2011\-12\-13 下午7\.34\.30](https://farm8.staticflickr.com/7020/6504683421_d44843f0a1.jpg)](https://www.flickr.com/photos/elct9620/6504683421/)

找到以下程式碼：
<pre><code> define('WPLANG', ''); </code></pre>
然後改為：
<pre><code> define('WPLANG', 'zh_TW'); </code></pre>
結果如下圖，然後存檔。<br />
[![螢幕快照 2011\-12\-13 下午7\.34\.42](https://farm8.staticflickr.com/7172/6504683533_db92225df8.jpg)](https://www.flickr.com/photos/elct9620/6504683533/)

###上傳
---
接著，我們先切換到 App 的目錄下，這樣才可以進行上傳（因為才有 .git 資料夾可以知道伺服器位置等等資訊）<br />
[![螢幕快照 2011\-12\-13 下午7\.30\.27](https://farm8.staticflickr.com/7164/6504682767_f5537b5d92.jpg)](https://www.flickr.com/photos/elct9620/6504682767/)
> 弦也的 App 網址為 elct9620.PHPfogapp.com 但各位的不是，請不要打錯喔！

輸入指令，新增要更新的檔案：
<pre><code> $ git add . </code></pre>
> . 就是全部的意思，這樣比較快可以完成選取檔案

[![螢幕快照 2011\-12\-13 下午7\.35\.03](https://farm8.staticflickr.com/7028/6504683665_de5d82236b.jpg)](https://www.flickr.com/photos/elct9620/6504683665/)

接著輸入指令，註記這次更新是什麼情況：
<pre><code> $ git commit -m "Add Chinese Language"</code></pre>
> " 裡面的訊息可以自己輸入，因為這是中文化，所以輸入 Add Chinese Language

[![螢幕快照 2011\-12\-13 下午7\.35\.22](https://farm8.staticflickr.com/7157/6504683841_250fb37842.jpg)](https://www.flickr.com/photos/elct9620/6504683841/)

之後會列出這次更新的檔案，檢查一下是否有檔案漏掉。<br />
[![螢幕快照 2011\-12\-13 下午7\.35\.31](https://farm8.staticflickr.com/7167/6504683975_f7a82881e6.jpg)](https://www.flickr.com/photos/elct9620/6504683975/)

全部都OK之後，再次輸入指令將中文化好的 WordPress 上傳。
<pre><code> $ git push </code></pre>
[![螢幕快照 2011\-12\-13 下午7\.35\.39](https://farm8.staticflickr.com/7167/6504684109_5ef1f6a1ea.jpg)](https://www.flickr.com/photos/elct9620/6504684109/)

完成後，回到 [PHPFog](https://PHPfog.com) 管理頁面，再次打開 WordPress 就會發現被中文化了！<br />
[![螢幕快照 2011\-12\-13 下午7\.36\.00](https://farm8.staticflickr.com/7033/6504684203_90477fbf73.jpg)](https://www.flickr.com/photos/elct9620/6504684203/)

呼呼！好久沒有寫這麼長的文章了，還挺累的，不過希望大家都可以輕鬆架設出自己的 WordPress on PHPFog 喔！

>其實用心經營一段時間後，網誌的廣告費大概也夠支付 $5/month 的 Custom Domain 和 Domain 的費用。不過想用 Sliver 這些付費方案，可能就要更加努力才行了！
