---
layout: post
title: 'PaaS 入門指南（二）'
publishDate: 2014-01-21 03:14
comments: true
tags: [介紹, 雲端, PaaS, 入門]
---
在第一篇文章 [PaaS 入門指南（一）](https://blog.frost.tw/posts/2014/01/15/getting-started-paas-1/)已經簡單介紹了 PaaS 的基本概念，還有一些常見的 PaaS 服務。

這篇文章，則會介紹使用 PaaS 所需的基本技能以及軟體。雖然使用 PaaS 的方式大多在服務提供者的網站上會有簡易的介紹，但是如果想要體驗各式的 PaaS 最好還是能夠熟悉這些工具的基本操作。

<!--more-->

## 軟體套件

在前一篇介紹的 Heroku、AppFog 等，大多會需要預先安裝一些軟體套件來使用。
（像是 AppFog 的管理工具使用 Ruby 所撰寫，那麼我們就需要事先安裝 Ruby）

### Ruby

基本上 Mac 的使用者，在購買時就已經內建好 Ruby 在作業系統中。如果沒有特殊需求，可以直接使用（一般來說開發者會透過安裝 [RVM](https://rvm.io/) 來管理版本，不過我想身為開發者大多已經安裝，應該不需要另外講解。）

而 Windows 的使用者，則可以透過 Ruby 官方網站上的 [Ruby Installer](https://Rubyinstaller.org/) 來安裝 Ruby 的運行環境。

#### Windows 安裝 Ruby

![螢幕快照 2014-01-21 上午11.29.57.png](https://user-image.logdown.io/user/52/blog/52/post/176797/pVJi41WSSL6RJz4IZeHU_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-01-21%20%E4%B8%8A%E5%8D%8811.29.57.png)
進入官網後，點選 Download 下載。

![螢幕快照 2014-01-21 上午11.30.12.png](https://user-image.logdown.io/user/52/blog/52/post/176797/lrpLkIb2QiOeENW2uP7V_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-01-21%20%E4%B8%8A%E5%8D%8811.30.12.png)
選擇適當的 Ruby 版本（這邊我使用的是 Ruby 2.0.0 的 x64 版本，使否使用 x64 版本取決于你的作業系統是否為 64 位元）

![螢幕擷取畫面_012114_115541_AM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/cfOD2AlJTESw0RStINtG_%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2_012114_115541_AM.jpg)
開啟安裝程式安裝 Ruby 執行環境。

![螢幕擷取畫面_012114_115703_AM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/bZuW5lnnQwGQGThB2m5S_%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2_012114_115703_AM.jpg)
特別要注意的是圖中標記的選項，這對之後使用的方便程度會有影響。
（註：沒有勾選，每次執行 Ruby 指令會變得非常不方便。）

![全螢幕_012114_115950_AM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/EFWsAcjQiKErH6I41aSr_%E5%85%A8%E8%9E%A2%E5%B9%95_012114_115950_AM.jpg)
完成之後可以打開命令提示字元檢查是否設置正確（ Windows8 之前版本可以用 開始 > 執行 > cmd 開啟 ）

![螢幕擷取畫面_012114_120118_PM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/GUVaYH5XSKWxDuJBFVe0_%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2_012114_120118_PM.jpg)
運行 `Ruby --version` 以及 `gem` 指令檢查使用 PaaS 所需功能是否完善。

如果你想使用像是 Nodejitsu 之類的服務，可以到 Node.js 的[官方網站](https://nodejs.org/)下載安裝檔，與 Ruby 不同的是個作業系統都已經有安裝檔可用，非開發人員都可以很輕易的安裝。步驟上跟 Ruby 應該是差不多的。

### SourceTree

一款挺推薦的 Git (版本管理工具) 軟體，像是 Heroku 與 Pagodabox 都仰賴 Git 去更新 PaaS 上的程式碼版本。
（使用像是 Git 這類工具的好處，就是有一些錯誤或者問題時，能夠很輕鬆的還原到上次版本。）

#### Windows 安裝 SourceTree

實際在 Windows 安裝感覺步驟非常繁複，請大家耐心一步一步的安裝。
（如果是 Mac 用戶，基本上會問類似的問題，但是因為所需套件基本上都有內建，較不會有這些問題。）

先到[官方網站](https://www.sourcetreeapp.com)下載 SourceTree 來安裝，安裝基本上不會有問題，真正的問題在於第一次開啟軟體時有非常多繁複的步驟需要處理。

![螢幕擷取畫面_012114_120258_PM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/7NOlRWXTCSzrTWzq2hR9_%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2_012114_120258_PM.jpg)
如果電腦過去沒有安裝過 Git 會提出這個問題，選擇第一個項目自動安裝即可。
（SourceTree 也支援另一套名為 Mercurial 的版本管理工具，如果你不確定未來是否會用到選擇完畢後，詢問關於 Mercurial 時，也可以選擇下載。）

![螢幕擷取畫面_012114_120505_PM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/LglU8GkgQpqZrPwwcJLj_%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2_012114_120505_PM.jpg)
完成後會詢問名字與信箱（版本管理工具會利用這個來辨識某次修改的使用者，也可以填選暱稱，信箱則最好使用常用信箱）

![螢幕擷取畫面_012114_120529_PM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/Y0ZW2iQ0Oxdsu1ZUSbEA_%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2_012114_120529_PM.jpg)
接下來會有一些關於設定的問題，大多選擇 Yes 即可。

以下開始的安裝，看看就好⋯⋯
（不過可以先選 OpenSSH 但是後續步驟還是很麻煩拉 QAQ）
<del>因為等一下 Heroku 會說你 Public Key 出錯，我們還是認命讓 Heroku 治百病吧</del>
![螢幕擷取畫面_012114_120546_PM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/ib8FLMJMSpuvc7f4gDL9_%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2_012114_120546_PM.jpg)
之後會有 SSH 的設定，依照建議選擇 Putty 的選項。
（其實個人覺得，在 Windows 上不管選哪個都有點麻煩⋯⋯）

![螢幕擷取畫面_012114_120604_PM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/eN4OP7RfSqSk3vNTeIic_%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2_012114_120604_PM.jpg)
因為 Git 使用 SSH Key 來確認使用者是否有權限，所以會問你要不要讀取現有的。
（如果沒有，選擇 No 就對了，前面選擇的是 Putty 所以這邊讀取的會是 .ppk 的 private key）

![螢幕擷取畫面_012114_120656_PM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/qgzttgXBRfybVoy02K7X_%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2_012114_120656_PM.jpg)
沒有帳號就 Skip 掉，有的話會自動幫你連線。

![全螢幕_012114_120759_PM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/VKYAwIiYRrCmm4980AY7_%E5%85%A8%E8%9E%A2%E5%B9%95_012114_120759_PM.jpg)
開啟軟體後，我們要先把剛剛沒有的 SSH Key 生成出來。

![螢幕擷取畫面_012114_120828_PM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/namwEMGQbyZwfZQiGzQg_%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2_012114_120828_PM.jpg)
點選 Generate 生成即可。（他會請你在畫面空白處移動滑鼠，當做生成密碼的亂數加密）

![螢幕擷取畫面_012114_120932_PM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/EHM5lTl8QJCTAPKH8Ifr_%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2_012114_120932_PM.jpg)
接下來你會生成兩把 Key 一把 Public (給其他人) 另一把 Private (自己用) 先把這兩個檔案存到一個安全的地方。
註：Public 建議命名為 PaaS.pub 之類的，而 Private 則是檔名一樣副檔名不同如 paas.ppk (一定要是 .ppk 不然待會找不到)

![未命名的擷取_012114_121235_PM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/7Zympn1SMeS11oFKn6B6_%E6%9C%AA%E5%91%BD%E5%90%8D%E7%9A%84%E6%93%B7%E5%8F%96_012114_121235_PM.jpg)

![螢幕擷取畫面_012114_121301_PM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/5g7HIhjDRbCgCyKAwuei_%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2_012114_121301_PM.jpg)
接著把剛剛設定的 Private Key 告訴 Source Tree。如此一來 Git 便能正常使用。

後記：這堆設定還真是麻煩 Orz （所以大家還是趕緊換 Unix 系的作業系統吧 XDD）

## Git

前面有稍微提過一些關於 Git 的概念，就是「版本管理工具」那麼什麼是版本管理工具呢？這邊會簡單的介紹，以及 SSH Key 的用途與為什麼 Git 需要這個工具，還有基本的 Git 概念。

### SSH Key

Key - 鑰匙。我想大家都知道這個非常簡單的單字意思，那麼 SSH Key 的概念上就跟鑰匙一樣。通常是兩把鑰匙一把 Public 和一把 Private。我們可以想像，你買了一間房子，並且有了一把鑰匙（Private）而你拷貝了一份，給你最好的朋友（Public）現在你們都可以進入這一間房子，使用裡面的東西，或者把東西放到裡面。

不過，你也可以拷貝多個鑰匙給好幾個朋友（複製多份 Public Key）這也是 OK 的，最重要的是自己的鑰匙不能弄丟。

註：不過這只是比較簡單的描述，我們使用的是 RSA-Key 關於詳細的就可以到[維基百科](https://zh.wikipedia.org/wiki/RSA%E5%8A%A0%E5%AF%86%E6%BC%94%E7%AE%97%E6%B3%95)或者去 Google 看看 SSH Key 的運作原理，有更多高手可以解釋得更清晰、明白。

### 版本管理

各位有沒有不小心把報告刪除，就再也找不回來的經驗呢？或者玩遊戲時，突然當機，好幾個小時的遊戲記錄都消失的經驗？
在文字檔案（程式）的維護上，這就變得很重要的。

生活中類似的經驗就有像是 Dropbox 的過去編輯記錄，或者是遊戲提供 100 個記錄檔，你可以把遊戲進度分成 100 份，隨時回到某個影響結局的地方重新來過一樣。

![螢幕快照 2014-01-21 下午12.49.21.png](https://user-image.logdown.io/user/52/blog/52/post/176797/RWA7Gqu2ThmtgFWDzO3y_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-01-21%20%E4%B8%8B%E5%8D%8812.49.21.png)
Dropbox 的「版本」功能就非常接近 Git 的版本管理功能（標示使用者，以及上一次存檔的版本）

簡單來說，就是協助你管理每一個單位（不一定是檔案）的編輯記錄。

也因為都會被記錄下來，如果有密碼、敏感資訊等，也都要避免儲存在被版本管理的檔案中。

### Git 基本運用

要能夠使用 PaaS 只要學會最基本的 Git 使用就好了！

大致上就是 Commit（存檔）、Push（上傳）、Pull（下載）至於其他複雜的操作，大家可以參考網路上的文章。
（如：鐵人賽中，Will 保哥的[系列教學](https://ithelp.ithome.com.tw/ironman6/player/doggy/dev/1)）

#### Commit

Push / Pull 其實只是一個按鈕的動作，主要是 Commit 比較多步驟一點。
以下會用 SourceTree 來示範。

![螢幕快照 2014-01-21 下午1.16.50.png](https://user-image.logdown.io/user/52/blog/52/post/176797/1UIHJIEJRFORwhHA2wNm_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-01-21%20%E4%B8%8B%E5%8D%881.16.50.png)
在一個 Repository (Git 專案的單位) 裡面新增一個檔案，而這些檔案都還沒有被追蹤，所以會在 Working Tree 中，我們先將他從下面的視窗拉到上方。

![螢幕快照 2014-01-21 下午1.20.35.png](https://user-image.logdown.io/user/52/blog/52/post/176797/NJspKV7S1akUZovGmy0A_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-01-21%20%E4%B8%8B%E5%8D%881.20.35.png)
前方會從問號變為加號，表示這個檔案已經被追蹤，可以被 Commit 了！
註：為了呈現 Commit 可以同時多檔案，因此我另外新增了 README 檔案

![螢幕快照_2014-01-21_下午1_22_23-4.png](https://user-image.logdown.io/user/52/blog/52/post/176797/6P3xy4RtRyKmR8dVFFlJ_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7_2014-01-21_%E4%B8%8B%E5%8D%881_22_23-4.png)
每個 Commit 都需要有一個 Message 來標記這次做了什麼，右下角的 master 表示目前使用的分支（一般上傳到 PaaS 會以 master 的作為運行的版本一句）
註：為了呈現 Commit 不需要把全部檔案都加到 Staged 狀態，我再次新增一個檔案。

![螢幕快照 2014-01-21 下午1.29.16.png](https://user-image.logdown.io/user/52/blog/52/post/176797/Qo4N5N1eS66OAUnh8bNs_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-01-21%20%E4%B8%8B%E5%8D%881.29.16.png)
完成後左方 Branch 會多出 master 標示粗體（目前的 Branch）裡面可以看到剛剛的 Commit 被加上，而且只有被選擇的兩個檔案。
註：Uncommit changes 是剛剛新增的 README.rst 因為沒有被 commit 所以會這樣標記。

![螢幕快照 2014-01-21 下午1.31.40.png](https://user-image.logdown.io/user/52/blog/52/post/176797/UIsGQSMSn9mEQplLMigK_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-01-21%20%E4%B8%8B%E5%8D%881.31.40.png)
若未來有機會碰到較為大型的專案，就可以看到蠻精彩的 Commit 發展。
（不過亂漲有時候也挺讓人頭痛的 XD）

### Push / Pull

點選 Pull 後，可以看到如下的畫面。
註：遠端伺服器上與本機的 Branch 不一定要相同名稱，不過通常會使用相同的名稱。

![螢幕快照 2014-01-21 下午1.33.28.png](https://user-image.logdown.io/user/52/blog/52/post/176797/0HLVYKIQN6bSucXnysZQ_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-01-21%20%E4%B8%8B%E5%8D%881.33.28.png)

點選 OK 後，就可以把遠端的變更（Commit 記錄）抓到本機。
不過使用 PaaS 大多是將本機上傳到遠端。

![螢幕快照 2014-01-21 下午1.35.25.png](https://user-image.logdown.io/user/52/blog/52/post/176797/xyZFYbDMQGGHagj1kAyb_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-01-21%20%E4%B8%8B%E5%8D%881.35.25.png)
Push 可以一次選取多個 Branch 上傳。

以上都還是非常基本的使用，如果真的有興趣，建議將完整的概念補齊。
至於 Git 其實是非常好用的工具，如果有再寫程式或者網頁這類經常會修改的文字檔案，也建議使用會比較好。

## Command Line

這邊會介紹 Command Line 的使用，以 Heroku 的登入與 Appfog 輔助工具的安裝為例子。

### 開啟終端機（命令提示字元）

Mac 的用戶可以在其他 > 終端機裡面找到（OSX 10.9 的情況）不過一般會建議安裝 [iTerm2](https://www.iterm2.com/#/section/home) 這套終端機軟體，能夠比較好用。

而 Windows 的使用者在前面安裝 Ruby 時已經開啟過命令提示字元，用同樣方式開啟即可。
（Window 8 使用者找不到可以按下 Win 鍵，進入動態磚界面直接打 cmd 可以快速搜尋出來）

### Appfog 的 Command Line Tool 安裝

以下會用 Windows 作為示範，畢竟 Windows 通常會被雷炸到（笑）

> gem update --system
> gem install af

根據 AppFog 官方的[文件](https://docs.appfog.com/getting-started/af-cli)表示 `gem update --system` 是 Windows 用戶才要做的，不過我猜是因為 Windows 用 Ruby Installer 安裝好還沒更新的關係。
（通常 Mac / Linux 用戶裝好都會被更新到最新版本拉～～）

![螢幕擷取畫面_012114_014655_PM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/BxQfR9lQSKWmDXiyEZxn_%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2_012114_014655_PM.jpg)
總之跑了一大堆東西就裝好了，沒有炸掉（笑）

註：Windows 這視窗寬度被限制了，對視窗的外框點右鍵然後調整裡面有個叫做「視窗大小」的設定，把 80 改大就可以了。不然 AppFog 傳回來的訊息被切斷超悲劇的～

> af login

![螢幕擷取畫面_012114_014757_PM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/BL4eYMVuQmSXy0BOvGUI_%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2_012114_014757_PM.jpg)

安裝成功就可以用這指令登入啦！（沒辦帳號可以去辦，沒興趣可以跳過 XD）
註：Mac / Linux 使用這密碼欄位不會出現星號，打錯不用怕，會讓你重新輸入 XD

然後就可以用一些指令操作（這次就只到這邊，下面是個範例，可以列出你在 AppFog 上開設的 App 有哪些）

![螢幕擷取畫面_012114_015004_PM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/iOHIFeRtQleSVNz2hmM4_%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2_012114_015004_PM.jpg)

<del>有沒有開始覺得自己是駭客的幻覺，你已經比鄉土劇的駭客厲害了⋯⋯</del>

### Heroku 的 Command Line Tool 安裝

很久以前，我們也是用 `gem install Heroku` 來安裝的，但是似乎大家還是喜歡有下一步，所以 Heroku 改成一個軟體讓你裝喔～～
（Mac 用戶一樣，裝完就能跑了，以下針對 Windows 用戶貼心示範）

![螢幕擷取畫面_012114_015750_PM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/nqpliCPHRgOT7CwjNYLg_%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2_012114_015750_PM.jpg)

![螢幕擷取畫面_012114_015813_PM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/k9126EUmSO6rkljfplrd_%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2_012114_015813_PM.jpg)

熟悉的畫面⋯⋯
註：原來 Heroku 連 Ruby 都一起裝了，不過為了前面的 AppFog 和安裝快些就先不管了 XD

![螢幕擷取畫面_012114_015910_PM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/rBXLKbjHQwClSdiXaQWd_%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2_012114_015910_PM.jpg)
連 Git 一起裝（然後 SourceTree 的慘案就此開始，後面會說明可以運作的步驟 XDD）

![螢幕擷取畫面_012114_015956_PM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/w4AetoCQwaMtV0kXrbCw_%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2_012114_015956_PM.jpg)
裝好重開終端機（命令提示字元）打一下 Heroku 就會看到這個⋯⋯

![螢幕擷取畫面_012114_020045_PM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/DNKwKRHsRPGbmkw1CkiQ_%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2_012114_020045_PM.jpg)
然後登入（Mac 用戶似乎會問你說，沒有 SSH Key 是否生成，按下 Yes 無腦 Enter 也會成功。）

![螢幕擷取畫面_012114_020455_PM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/050QbeccTgyhjcXKD5pp_%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2_012114_020455_PM.jpg)
然後 Windows 用戶嘗試把剛剛生成的鑰匙給 Heroku 結果被拒絕，說你鑰匙長得怪怪的不能用⋯⋯

![未命名的擷取_012114_121235_PM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/7Zympn1SMeS11oFKn6B6_%E6%9C%AA%E5%91%BD%E5%90%8D%E7%9A%84%E6%93%B7%E5%8F%96_012114_121235_PM.jpg)

![螢幕擷取畫面_012114_021709_PM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/V9aJ1OSQSrvopAhf6iwF_%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2_012114_021709_PM.jpg)
先回到 SourceTree 把 Git 設定為系統的 Git (Heroku 安裝的版本)

![螢幕擷取畫面_012114_021801_PM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/4bJMLTytSVq5rOjJ0JfG_%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2_012114_021801_PM.jpg)
然後點選 Terminal 開啟 Git 的終端機界面來生成 SSH Key （趴

![螢幕擷取畫面_012114_021844_PM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/1xqtGcJNSjywVcZijrrP_%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2_012114_021844_PM.jpg)

用 `ssh-keygen -t rsa` 來生成（一定得進 Git 終端機才能抓到，肯定是個軟體安裝順序問題⋯⋯）

![螢幕擷取畫面_012114_022033_PM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/nY2BvRSQMS6RHY4zz5Yl_%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2_012114_022033_PM.jpg)
如果前面選到 Putty 就改回 OpenSSH 然後選擇我們剛剛生成的 Private Key。

![螢幕擷取畫面_012114_021943_PM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/y3EGvGreR5yZUxGf6sF4_%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2_012114_021943_PM.jpg)
預設會存到 `C:\Users\帳號\.ssh` 找不到先點「桌面」然後把 `Desktop` 改成 `.ssh` 就對了～

![螢幕擷取畫面_012114_022108_PM.jpg](https://user-image.logdown.io/user/52/blog/52/post/176797/eakL6y4RyqxIO2QUoMHT_%E8%9E%A2%E5%B9%95%E6%93%B7%E5%8F%96%E7%95%AB%E9%9D%A2_012114_022108_PM.jpg)
然後回去 Heroku 就能順利把 Key 加進去⋯⋯

<del>搞得我好累，下次開始我都用 Mac 寫可不可以啊？</del>

下次就是實際把網站放到雲端上摟！

後記：偷偷去查了一下 Heroku on Windows 看起來 SSH Key 還是要分開獨立做生成，認命～～
