---
layout: post
title: 'Heroku Buildpacks - 客制化你的 Heroku 環境'
date: 2012-11-04 20:51
comments: true
tags: 
---


PHPConf 結束後，就很想寫點程式阿（掩面

雖然這次是志工，不過運氣很好聽到了不少很棒的演講。其中我還是對於像是 PhalconPHP 和 Composer 在雲端環境上的使用。

先排除一般虛擬主機支援可能性，再來就到了 PaaS 上的問題。因為 PaaS 相對於 IaaS 使用上簡單，也不需要額外的去做設定，很多時候 Deploy 網站還是會先以 PaaS 為主（而且很多 PaaS 有提供免費額度）

我先針對幾個個人比較關注支援 PHP 環境的 PaaS 進行搜集資料，再繼續確認支援情況。

AppFog, Heroku, PagodaBox 三個是我主要的確認項目，其中 AppFog 沒辦法找到什麼可靠的資訊，而 PagodaBox 在印象中討論區曾經有討論過關於 Composer 方面的問題，最後是 Heroku 今天的主角，也是讓我「大吃一驚」的 PaaS 服務。

<!-- more -->

其實 Heroku 算是個很早期的服務，也很早就有提供免費額度。在加上很多方面他都有這不錯的支援，個人認為是個很棒的 PaaS 提供商。

先來討論 PhalconPHP 在 Heroku 上的支援好了⋯⋯

在過去的經驗，要在 Heroku 上的 PHP 使用 Mongo 是需要額外修改的，而且非常簡單。<br />
在 Github 上的這個 Gits 說明了方法：<a href="https://gist.Github.com/1288447" target="_blank">Sample PHP+Mongo app on Heroku</a>

其實只要把編譯好的 PhalconPHP 的 Extension 上傳上去就好了，非常簡單。

**不過本機與遠端的環境不一樣怎麼辦？**

因此，接下來透過 Composer 的自動配置與手動編譯環境，就可以解決這個問題。

在 Heroku 上提供了名為 <a href="https://devcenter.Heroku.com/categories/buildpacks" target="_blank">Buildpacks</a> 的功能，讓我們可以自定義 Dyno (Instance) 的配置。

其中 Vulcan 是 Heroku 提供給使用者在 Heroku 上編譯環境的工具。
（他會建立一個新的 Application 並且透過 vulcan build 將原始碼上傳後編譯，然後打包下載回本地）

透過 Buildpacks 以及 Vulcan 我們就可以替 PHP 加上所需的 Extension 以及配置自己的環境。

### Buildpacks API
---

其實可以把它當作 Git Pre Commit Hook 來看待（基本上這部分跑起來有問題你的 git push 會被打槍）

基本上，在 Heroku 上會坐三個動作 Detect, Compild, Release

#### Detect
簡單來說就是偵測，他負責檢查是否有這個「環境」所需的檔案。

```bash bin/detect

#!/bin/sh

# this pack is valid for apps with a hello.txt in the root
if [ -f $1/hello.txt ]; then
  echo "HelloFramework"
  exit 0
else
  exit 1
fi

```

從官網範例來看，他會檢查使用者 push 上來的檔案中是否含有 hello.txt 這個檔案，如果有那就回傳他的環境形態（這可以自己取拉～～）反之則離開。

關於這部分 0 就是驗證成功，反之 1 就是失敗。

#### Compile

再來是編譯，大致上是最主要的部分。其實就是安裝環境、放置檔案之類的動作拉～～

```bash bin/compile
#!/bin/sh

indent() {
  sed -u 's/^/       /'
}

echo "-----> Found a hello.txt"

# if hello.txt has contents, display them (indented to align)
# otherwise error

if [ ! -s $1/hello.txt ]; then
  echo "hello.txt was empty"
  exit 1
else
  echo "hello.txt is not empty, here are the contents" | indent
  cat $1/hello.txt
fi | indent
``` 

接下來會進入 Compile 部分，我們會在這邊下載&解壓縮必要的檔案 Ex. Apache, PHP 並且移動目錄等動作。

這部分可以參考一下 Heroku 的官方環境範例：<a href="https://Github.com/Heroku/heroku-buildpack-PHP/blob/master/bin/compile" target="_blank">Heroku Buildpacks PHP</a>

（至於為什麼沒有出現在官方文件列表，我也不知道⋯⋯）

註：看官方範例就知道有時候他跑一段時間其實是下載檔案，但是你看不到所以⋯⋯

#### Release

至於這部分，其實就是設定一些預設的 Add-on, 環境變數 等等

```bash bin/release
#!/bin/sh

cat << EOF
---
addons:
  - shared-database:5mb
config_vars:
  NODE_ENV:production
default_process_types:
  web: bin/node server.js
EOF
```

當以上都完成後，客制化的環境建制就完成了！

不過，如果我們需要 Apache, PHP 等預先編譯好的檔案呢？

此時就要 Vulcan 出場摟！

### Vulcan
---

> gem install vulcan

沒錯，安裝就是如此簡單！

完成後馬上建制自己專用的 Vulcan Application （其實就是個 Heroku Application）

> vulcan create APP_NAME

當然，輸入什麼 vulcan 或者與現存 App 重複的名稱是會被打槍的⋯⋯

再來，就是進行編譯的動作。

官方的範例就是⋯⋯

1. 下載 Source Code
2. 解壓縮
3. 進入目錄
4. vulcan build

沒錯，就這樣⋯⋯結束了！

不過，當我下載 PHP-5.4.8 之後，立馬被打槍⋯⋯

實際上，需要 ./configure 的只需要改成如下：

> vulcan build -v -c "./configure --prefix=/app/PHP --with-config-file-path=/app/PHP" -p /app/php

就可以了！

（註：當編譯完成的路徑非當下目錄時，得額外設定 -p 告訴 vulcan 去哪裡打包壓縮）

至於 -v 是顯示記錄，可以在 Debug 時使用。

不過大家又會有疑問了⋯⋯

編譯 Apache + PHP 相依問題怎麼解決？

1. 用 -c "./amp.sh" 丟個 Shell Script 上去跑
2. -d=預先編譯好的Apache網址

不過第一個方法我沒成功過（牆角

註：這個網址可以透過 Vulcan 編譯完畢後吐給你的網址 Ex. http://vulcan-aotoki.Herokuapp.com/output/4a669895-5308-4846-8a72-28d78d46a999 來代替（超神奇噢！？

至於實際上邊議會有什麼地雷我都不知道啊！

因此請大家永遠長是踩地雷吧！（遭毆

至於 Compile 的 Shell Script 其實可以用

> curl --location "http://vulcan-aotoki.Herokuapp.com/output/4a669895-5308-4846-8a72-28d78d46a999" | tar zx

這樣的方式來替代將下載下來的 tgz 又放到其他地方，然後再 Download 下來。
（不過這些 Output 會被保留到何時並沒有人知道⋯⋯）

後面好像有點敷衍？不管了 XDD







