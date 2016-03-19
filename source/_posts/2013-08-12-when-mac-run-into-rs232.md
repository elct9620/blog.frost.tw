---
layout: post
title: '當 Mac 碰上 RS232'
date: 2013-08-12 13:40
comments: true
tags: [Mac, 網管]
---
最近被<del>損友</del>推坑，配合老爸公司轉移地點到車站。順便進了一些比較專業的網路設備<del>然後就大失血了</del>

第一次碰到需要使用 RS232 (COM) 進行管理的設備，雖然備有 Web 界面，但是 Console 界面總是不怕進不去，也多了一分自己好像是網管人員的神秘感（誤

不過，身為 Mac 使用者，跟<del>萬惡的</del> Windows 使用者比起來，卻多了許多困難。

<!-- more -->

老爸公司這次在網路設備上買了兩台 Switch 和一台 UTM 畢竟不是大公司，不過租用的點有三樓半左右，二三樓是辦公區域，而一樓作為教室使用。目前迫切需要的是二三樓的網路配置，因此一台 UTM 和 Switch 放置於機房，而二樓主要辦公區域則另外配置一台 Switch 使用。

前幾天在朋友解說之下，買了一條 RS232 <> USB 的轉接頭，然後開始了我的 Console 管理之路（遠望

那麼，使用 Mac 連上 Console 需要有以下條件

* 一條轉接頭（選用 RS232 <> USB）
* 轉接頭的驅動
* 連上 Console 所需的軟體
* 設備所需的相關數值設定

轉接頭除了網路購物可以找到外，中壢地區應該電子材料行比較容易取得。

接下來是驅動，就目前來看似乎主要以 [Prolific](http://www.prolific.com.tw/) 這家為主流，我所購買的轉接頭官網上提供的驅動也是這家的（包裝盒內有光碟，但是小光碟 MBP 無法讀取）

不過，很不幸的即使使用廠商官網上的 v1.0.9 驅動還是官方的 v1.5.0 抑或其它第三方驅動，都無法順利找到裝置。

此時，我在另一篇文章發現如何找到適當驅動的方法，我去確認一下正在連接的 USB 轉接頭到底是什麼晶片組。

![蒼時弦也的 USB 資訊](http://user-image.logdown.io/user/52/blog/52/post/84766/AB5mIrZSPeOTDYPWg8dn_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202013-08-13%20%E4%B8%8A%E5%8D%8810.47.59.png)

製造商是 FDTI(http://www.ftdichip.com/) 這家公司，而非前面大家最常使用的 Prolific 這家廠商。

不過，很不幸的是 FDTI 官網雖然寫著 Drivers 下載，但是抓下來卻是 Library 和 Header 的 SDK⋯⋯

不過，在經過努力的 Google 之後，發現了[這個頁面](http://pbxbook.com/other/Mac-tty.html)

裡面可以下載到正確的 FDTI 以及 Mac 可用於連接 Console 的適當軟體，如果有興趣也可以參考看看。

安裝完成後，我在另一篇文章發現 Mac / Linux 其實可以使用一個大家可能很熟悉的指令 `screen` 來作為 Console 的模擬器。（在 Windows 上可以使用 Putty 我認為其實就是 Terminal 就對了！）

[這篇文章](https://blogs.oracle.com/blogsagainbynight/entry/terminal_to_serial_usb_devices)敘述了關於如何找到裝置，以及使用 `screen` 指令連接的資訊，另一方面還提供了當有需要傳入其他 Options 時，該如何輸入的方法（雖然不完整）

當我確認好設備使用的是 115200 這個頻率後，我開始嘗試連接。

`ls /dev/tty.` > `ls /dev/tty.usbserial-FTAJNHLA` 取得 USB 轉接頭的裝置名稱（在 Mac 應該還會看到藍牙的裝置）

`screen /dev/tty.usbserial-FTAJNHLA 115200` 輸入後就會發現畫面一片空白，如果最底下沒有訊息而且沒有被跳出，先嘗試輸入 Switch / UTM 這些設備的管理員賬號，運氣好就會有東西跑出來。

![螢幕快照 2013-08-13 上午11.00.10.png](http://user-image.logdown.io/user/52/blog/52/post/84766/woHgLO0jT6ShkcIN78Vf_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202013-08-13%20%E4%B8%8A%E5%8D%8811.00.10.png)

接下來只要輸入正確的賬號密碼就可以順利登入了！

![螢幕快照 2013-08-13 上午11.00.58.png](http://user-image.logdown.io/user/52/blog/52/post/84766/sNT4NKw2TAq2fmhxBdnX_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202013-08-13%20%E4%B8%8A%E5%8D%8811.00.58.png)

這部分的操作本身並不困難，不過網路上的資料大多停留在 10.6 左右的版本，也沒有細說驅動程式有兩種晶片組的差異，很容易就因為裝錯驅動而無法使用。

希望可以幫助大家解決 USB 與 RS232 轉接頭無法順利使用的問題。
