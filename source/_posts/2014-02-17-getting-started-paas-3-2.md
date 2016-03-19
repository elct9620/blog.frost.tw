---
layout: post
title: 'PaaS 入門指南（三）之二'
date: 2014-02-17 12:08
comments: true
tags: [介紹, 雲端, PaaS, 入門]
---
據說[PaaS 入門指南（三）](http://blog.frost.tw/posts/2014/02/04/getting-started-PaaS-3)網址設錯，我要開始寫才發現 XD

這篇文章會來示範如何用 OpenShift 架設 WordPress 網誌，在此之前要先告知大家。
最近 AppFog 決定改變方針，已經註冊的用戶免費方案降為 512MB 而之後不開放免費方案申請（假設經驗是對的，過幾年 AppFog 的免費用戶大概就會被停了吧 XD 上次是取消網址⋯⋯）

也因此，之後的文章講完基本運用後，就不會另外提 AppFog 的使用（畢竟我目標再讓大家先免費體驗，然後選擇喜歡的付費嘛～）
當然，我主要還是討論 Heroku 的運用（不過那是進階了，需要有一定基礎知識的人才能夠玩起來～）

那麼，我們進入正題。

<!-- more -->

![螢幕快照 2014-02-17 下午8.17.14.png](http://user-image.logdown.io/user/52/blog/52/post/179066/645f8alkQUOeeV3PVJj1_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-02-17%20%E4%B8%8B%E5%8D%888.17.14.png)

進入官網點選右上角的「MY APPS」應該會是這個畫面（除非你建過 Application 這樣～）

接下來肯定沒有可以選，點「Create your first application now」繼續摟 XD

![螢幕快照 2014-02-17 下午8.19.27.png](http://user-image.logdown.io/user/52/blog/52/post/179066/VMvgNN0ET2qRUOzPyKCR_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-02-17%20%E4%B8%8B%E5%8D%888.19.27.png)

基本上跟 AppFog 流程一樣，我們去找出 WordPress 來使用。

![螢幕快照 2014-02-17 下午8.20.50.png](http://user-image.logdown.io/user/52/blog/52/post/179066/UezeOxHQSfK25xE0kUva_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-02-17%20%E4%B8%8B%E5%8D%888.20.50.png)

點下去之後，全部都不動也是可以繼續的。
（Scaling 如果有選擇，會消耗你創建的 Application 數量，也就是 Gear 值，如果打算在上面經營你的網誌，建議選起來可以負荷比較多的訪客。）

接下來按下「Create Application」等待 OpenShift 開完你的 Application 就可以了⋯⋯

![螢幕快照 2014-02-17 下午8.30.05.png](http://user-image.logdown.io/user/52/blog/52/post/179066/cVFrLdNYTpKyYvt5YJo6_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-02-17%20%E4%B8%8B%E5%8D%888.30.05.png)

跑完之後會給你 MySQL 的管理員帳號密碼，記得備份起來（上圖我裁掉了，雖然之後我會刪掉拉 XD）

![螢幕快照 2014-02-17 下午8.31.31.png](http://user-image.logdown.io/user/52/blog/52/post/179066/B71hEB12TwKjbGn58iLg_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-02-17%20%E4%B8%8B%E5%8D%888.31.31.png)

回到 Application 管理界面打開網址，就會看到熟悉的 WordPress 安裝畫面，我們先來安裝一下語言包。

![螢幕快照 2014-02-17 下午8.32.28.png](http://user-image.logdown.io/user/52/blog/52/post/179066/Wvwlep1rSAOnsyYNWaKJ_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-02-17%20%E4%B8%8B%E5%8D%888.32.28.png)

管理界面右邊有一個「Source Code」的項目，記得複製下來，馬上就會用到。
（前面的文章有教過安裝 Git 了，這次是真的要實際使用摟～）

輸入指令
> git clone ssh://5301ff004382ec91a100019e@wp-aotoki.rhcloud.com/~/git/wp.git/

後面的 `ssh://5301ff004382ec91a100019e@wp-aotoki.rhcloud.com/~/git/wp.git/` 可別照著我打，要貼上剛剛複製的那段喔！

註：之前的文章沒有寫 OpenShift 的安裝，這邊其實會出錯。
如果你有安裝好 Ruby 環境，可以先用 `gem install rhc` 然後 `rhc setup` 來讓 OpenShift 專用客戶端幫你設定好喔！
（Windows 用戶，我就不能保證如此順利了⋯⋯）

裝完 `rhc` 工具後，也可以透過下面的指令 Clone 下來（貼心設計 XD）
> rhc git-clone wp

（因為我產生 Application 時填寫的是 `wp` 所以這邊我就用 `wp` 來複製）

註：沒想到 OpenShift 竟然是用 Shell Script 安裝 WordPress 那麼我們也用如此潮的方式安裝中文版吧 XD

打開 `.openshift/action_hooks/build` 來做修改。
（Mac/Linux 用戶預設看不到，請注意 XD）

首先我們會看到 `install_version="3.8.1` 看起來是最新版 WordPress 所以不用擔心。
其他的部分可以不用管，我們來到下面這行：

```sh
curl -s http://wordpress.org/wordpress-${install_version}.tar.gz > wordpress-${install_version}.tar.gz
```

目前是從 WordPress 官網下載的，所以是非正體中文版，我們替換一下這段語法從台灣官網下載。

```sh
curl -s http://tw.wordpress.org/wordpress-${install_version}-zh_TW.tar.gz > wordpress-${install_version}.tar.gz
```

仔細往下看這堆 Shell Script 發現還會檢查 MD5 是否正確（以防下載到偽裝的 WordPress）
所以這行也要改為對應中文版的 MD5 檢查碼。

```sh
wordpress_md5=$(curl -s http://wordpress.org/wordpress-${install_version}.tar.gz.md5)
```

改為下面這樣（其實就是網址改掉 XD）

```sh
wordpress_md5=$(curl -s http://tw.wordpress.org/wordpress-${install_version}-zh_TW.tar.gz.md5)
```

看起來沒有其他需要修正，存檔收工！

接下來要把這個修改 Commit 並且上傳到 OpenShift 上面。

> git commit -am "Update# change build script to zh_TW version"

commit 類似 git 存檔的動作（認可這些修改） 而 -a 表示全部的檔案， -m 則是直接附加編輯訊息。
（這部分就請大家自行研究其中的奧秘摟～）

接下來，我們要幫 `wp-config.PHP` 設定為中文語系。

打開檔案 `.openshift/config/wp-config.PHP` 然後找到下面這行

```PHP
define('WPLANG', '');
```

改為

```PHP
define('WPLANG', 'zh_TW');
```

然後一樣做一下 Commit 的動作儲存這次修改。

> git commit -am "Update# set wp-config.PHP WPLANG to zh_TW"

不過，剛剛的 `.openshift/action_hooks/build` 裡面似乎寫著這這樣的訊息：

```sh
#
# If WordPress is already installed in the current gear, there
# is nothing to build :-)
#
```

也就是說，我們現在上傳是沒有意義的。

不過，我們可以透過修正 Shell Script 的運作來達成「自動更新」的功能。
（關於這部分的運作，相對的複雜，會在進階篇內討論 OpenShift 的運作機制）

我們再次打開 `.openshift/action_hooks/build` 這個檔案。

找到
```sh
[ -d "${current_version_dir}" ] && exit 0
```

改為
``` sh
rm -rf ${current_version_dir}
```

這個動作會讓你每次上傳時重新安裝一次 WordPress 的檔案（但是不用擔心圖檔備份問題）

然後接著在下面加入這三行語法
```sh
if [ -d "${install_dir}" ]; then
  rm -rf $install_dir
fi
```

這個動作會刪除已經存在的 WordPress 版本資料夾。
這邊文章撰寫時 OpenShift 預設使用 3.8.1 但是最新版也是，我們要用中文版蓋過去就得刪除安裝時產生的 3.8.1 版本。

這樣就能夠在每次安裝時更新到最新安裝的 WordPress 版本（缺點是上傳時間會略微增長，因為每次都要重新安裝一次）

接下來找到這一段（檔案最後面）
```sh
# Copy the OpenShift wp-config.PHP file
#
cp -f ${OPENSHIFT_REPO_DIR}.openshift/config/wp-config.PHP ${install_dir}/wp-config.PHP
```

大家應該可以猜到這是把 WordPress 設定檔複製的動作，我們在下面做一個修正（讓插件和佈景可以順利更新）
加入下面三行 Shell Script 更新。

```sh
# Clear plugins and themes directory
rm -rf ${OPENSHIFT_DATA_DIR}plugins
rm -rf  ${OPENSHIFT_DATA_DIR}themes
```

這三行主要是因為第一次安裝時 OpenShift 會把原本 WordPress 的資料夾移出，然後把最新的插件和佈景放入。
但是每次都安裝 WordPress 會因為 OpenShift 偵測到已經有這兩個目錄而跳過這個動作，那麼複製最新的插件和佈景這個動作就會發生問題。

註：實際運作方式與上述的有差異，這邊以大家較能理解的方式說明。

當然，每次修改完都要 Commit 一次。
> git commit -am "Update# let openshift reinstall wordpress each push"

最後我們將這些變更上傳上去。

> git push origin

push 就是上傳，而 pull 就是下載，很好懂對吧？

到了這個階段，我們打開網站就會看到熟悉的中文版 WordPress 安裝畫面。
剩下的我想不需要多加說明，希望大家都可以順利完成安裝。

註：往後想安裝新的插件、佈景，記得放到 `.openshift/plugins` 和 `.openshift/themes` 裡面，就會自動放到 WordPress 對應的目錄中。

### 後記

這次寫的有點亂，對 OpenShift 還不是很熟悉。
不過 OpenShift 大概是少數跟 Heroku 有高度客製化能力的 PaaS 平台，而且各有特色。
詳細的運作，我想得再之後較為深入的討論中才能和大家分享。

至於官方預設的方式某種層面上來說其實較為適合（因為 WordPress 本身具備自我更新能力）
而這種修改方式單純是為了可以直接安裝 WordPress 中文版，如果各位害怕之後操作錯誤，可以把後續的修改還原，那麼就不會遭遇這個問題。
（感覺選錯方式，不過這也是其中一種解法就是了 XD）
