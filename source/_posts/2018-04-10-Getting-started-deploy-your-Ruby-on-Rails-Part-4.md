---
title: 部署你的第一個 Ruby on Rails 網站（四）
date: 2018-04-10 16:54:22
tags: [教學,DevOps,Ruby on Rails]
---

從[第一篇](https://blog.frost.tw/posts/2018/03/20/Getting-started-deploy-your-Ruby-on-Rails-Part-1/)到[第二篇](https://blog.frost.tw/posts/2018/03/23/Getting-started-deploy-your-Ruby-on-Rails-Part-2/)的說明，加上[第三篇](https://blog.frost.tw/posts/2018/03/23/Getting-started-deploy-your-Ruby-on-Rails-Part-3/)我想大家已經對編譯自己的環境稍為熟悉。

為了要可以用 Passenger 作為網站伺服器，我們需要自行編譯 Nginx 讓他可以使用 Passenger 模組。

<!-- more -->

不過因為 Passenger 已經針對這方面做好對應的處置，所以我們只需要按照 Passenger 提供的解決方案一步一步的進行編譯即可。

> Passenger 提供了從原始碼安裝跟透過 Ruby Gem 安裝兩種，為了好維護跟升級，這篇文章會採取從原始碼安裝的方式。

## 取得原始碼

Passenger 除了開放原始碼的版本，也有企業版。從[官網](https://www.phusionpassenger.com/)可以找到開放原始碼版本的下載點，而且貼心的提供了像下面截圖的安裝指南。

![螢幕快照 2018-04-10 上午12.13.04.png](https://blog.frost.tw/images/getting-started-deploy-your-ruby-on-rails-part-4/screenshot1.jpg)

因為要從原始碼安裝，所以要先選擇其他作業系統。

![螢幕快照 2018-04-10 上午12.13.30.png](https://blog.frost.tw/images/getting-started-deploy-your-ruby-on-rails-part-4/screenshot2.jpg)

因為要和 Nginx 搭配，要記得將 `Standalone` 改為 `Nginx` 才能得到正確的安裝指南。

> 不過 Standalone 模式似乎也會變編譯一個 Nginx 來運行，只是不會顯示給使用者。

對頁面上的「Download tarball」按鈕點選右鍵複製連結，會得到類似下面的連結。

```
https://www.phusionpassenger.com/latest_stable_tarball
```

因為 Passenger 不像 Ruby 安裝完畢後會複製到某個指定的資料夾，所以我們可以參考 Homebrew 的方式，在 `/usr/local/passenger` 裡面放置檔案。

```bash
mkdir /usr/local/passenger
cd /usr/local/passenger
wget https://www.phusionpassenger.com/latest_stable_tarball
```

> 這邊建議用 `root` 來進行這個動作，因為 Passenger 安裝過程會需要 `root` 權限之外，`/usr/local` 目錄要新增資料夾也是需要有 `root` 權限的。

## 安裝 Passenger

首先把我們下載回來的 Passenger 解壓縮。

```bash
tar -zxvf latest_stable_tarball
```

> 用 `wget` 不知道原因並沒有自動轉成檔名，不過能夠解壓縮就就不需要太在意細節。

解壓縮後應該會得到一個最新版的 Passenger 目錄（本文撰寫時是 5.2.3 版）

```bash
[root@deploy-example passenger]# ls
latest_stable_tarball  passenger-5.2.3
```

接著進入 `passenger-5.2.3` 這個目錄，執行 Passenger 的安裝程式。因為 Passenger 是有使用 Ruby 的，如果上一篇文章介紹的設定沒有正確的話，可能會無法執行。

```bash
export PATH=/usr/local/passenger/passenger-5.2.3/bin:$PATH
passenger-install-nginx-module
```

依照文件，我們跟上次設定 Ruby 的時候一樣先暫時讓 Passenger 的執行檔都可以執行。安裝中途也會嘗試呼叫這個目錄的其他執行檔，所以在安裝階段先這樣設定會讓後續流暢不少。

> 執行 `passenger-install-nginx-module` 會中斷好幾次，主要是 Passenger 會建議我們把一些設定改善後再繼續。

開始後，會先出現類似下面的詢問訊息：

```bash
[root@deploy-example passenger-5.2.3]# passenger-install-nginx-module
Welcome to the Phusion Passenger Nginx module installer, v5.2.3.

This installer will guide you through the entire installation process. It
shouldn't take more than 5 minutes in total.

Here's what you can expect from the installation process:

 1. This installer will compile and install Nginx with Passenger support.
 2. You'll learn how to configure Passenger in Nginx.
 3. You'll learn how to deploy a Ruby on Rails application.

Don't worry if anything goes wrong. This installer will advise you on how to
solve any problems.

Press Enter to continue, or Ctrl-C to abort.
```

因為有好幾次詢問，所以如果後面沒有特別提醒的話，請自己按 Enter 繼續執行即可。

開始後會先詢問要支援哪些語言，因為 Passenger 後來陸續增加了 Python 和 Node.js 的支援，如果需要的話，也可以用方向鍵和空白鍵選取起來。

```bash
Which languages are you interested in?

Use <space> to select.
If the menu doesn't display correctly, press '!'

 ‣ ⬢  Ruby
   ⬡  Python
   ⬡  Node.js
   ⬡  Meteor
```

下一步會檢查相依性，如果出現類似下面的訊息，就表示有缺少一些程式。按下 Enter 之後 Passenger 會給出安裝指令，我們再複製來使用即可。

```bash
Checking for required software...

 * Checking for C compiler...
      Found: yes
      Location: /usr/bin/cc
 * Checking for C++ compiler...
      Found: no
 * Checking for A download tool like 'wget' or 'curl'...
      Found: yes
      Location: /usr/bin/wget
 * Checking for Curl development headers with SSL support...
      Found: no
      Error: Cannot find the `curl-config` command.
 * Checking for OpenSSL development headers...
      Found: yes
      Location: /usr/include/openssl/ssl.h
 * Checking for Zlib development headers...
      Found: yes
      Location: /usr/include/zlib.h
 * Checking for Rake (associated with /usr/local/ruby-2.4.3/bin/ruby)...
      Found: yes
      Location: /usr/local/ruby-2.4.3/bin/ruby /usr/local/ruby-2.4.3/bin/rake
 * Checking for OpenSSL support for Ruby...
      Found: yes
 * Checking for RubyGems...
      Found: yes
 * Checking for Ruby development headers...
      Found: yes
      Location: /usr/local/ruby-2.4.3/include/ruby-2.4.0/ruby.h
 * Checking for rack...
      Found: no

Some required software is not installed.
But don't worry, this installer will tell you how to install them.
Press Enter to continue, or Ctrl-C to abort.
```

提示的安裝指令如下

```bash
--------------------------------------------

Installation instructions for required software

 * To install C++ compiler:
   Please install it with yum install gcc-c++

 * To install Curl development headers with SSL support:
   Please install it with yum install libcurl-devel

 * To install rack:
   Please make sure RubyGems is installed, then run /usr/local/ruby-2.4.3/bin/ruby /usr/local/ruby-2.4.3/bin/gem install rack

If the aforementioned instructions didn't solve your problem, then please take
a look at our documentation for troubleshooting tips:

  https://www.phusionpassenger.com/library/install/nginx/
  https://www.phusionpassenger.com/library/admin/nginx/troubleshooting/
```

既然缺少了，那們我們就先執行對應的指令將缺少的套件安裝完成。

```bash
yum install gcc-c++ libcurl-devel
gem install rack
```

完成之後，我們重新執行 `passenger-install-nginx-module` 指令，前面的檢查選項就可以通過。這時候就會詢問我們要自己將 Passenger 加入 Nginx 編譯，還是讓 Passenger 幫我們自動編譯 Nginx。

```bash
Automatically download and install Nginx?

Nginx doesn't support loadable modules such as some other web servers do,
so in order to install Nginx with Passenger support, it must be recompiled.

Do you want this installer to download, compile and install Nginx for you?

 1. Yes: download, compile and install Nginx for me. (recommended)
    The easiest way to get started. A stock Nginx 1.12.2 with Passenger
    support, but with no other additional third party modules, will be
    installed for you to a directory of your choice.

 2. No: I want to customize my Nginx installation. (for advanced users)
    Choose this if you want to compile Nginx with more third party modules
    besides Passenger, or if you need to pass additional options to Nginx's
    'configure' script. This installer will  1) ask you for the location of
    the Nginx source code,  2) run the 'configure' script according to your
    instructions, and  3) run 'make install'.

Whichever you choose, if you already have an existing Nginx configuration file,
then it will be preserved.

Enter your choice (1 or 2) or press Ctrl-C to abort: 1
```

輸入 1 之後按下 Enter 就會開始把 Nginx 下載並且安裝摟！如果被詢問安裝目錄，基本上保持預設值就好，只是會跟透過 yum 安裝的位置不太一樣，所以要稍微記一下。

```bash
Where do you want to install Nginx to?

Please specify a prefix directory [/opt/nginx]:
```

> 要注意的是如果選用的主機規格太小 Passenger 會建議換大一點的主機，至少要有 1G 以上的記憶體比較適合。

如果中間都沒有出錯的話，我們會看到像下面這樣的訊息，也就表示安裝成功了。

```bash
Nginx with Passenger support was successfully installed.

The Nginx configuration file (/opt/nginx/conf/nginx.conf)
must contain the correct configuration options in order for Phusion Passenger
to function correctly.

This installer has already modified the configuration file for you! The
following configuration snippet was inserted:

  http {
      ...
      passenger_root /usr/local/passenger/passenger-5.2.3;
      passenger_ruby /usr/local/ruby-2.4.3/bin/ruby;
      ...
  }

After you start Nginx, you are ready to deploy any number of Ruby on Rails
applications on Nginx.

Press ENTER to continue.
```

## 開啟 Nginx

不過到目前為止，我們其實只是把 Passenger 和 Nginx 編譯完成，但是並沒有把 Nginx 打開。也因此，其他人是無法連上這台伺服器上的網站。

為了方便管理，我們可以使用 `systemd` 功能，透過撰寫設定檔，來使用 `systemctl` 指令觀看狀態，或者重新啟動。

在 Nginx 官網有提供一份[範例](https://www.nginx.com/resources/wiki/start/topics/examples/systemd/)，基本上只要修改範例上的路徑到正確的位置，我們就可以使用 `systemctl` 來控制 Nginx 的開啟跟關閉。

透過 `vi` 編輯 `/lib/systemd/system/nginx.service` 這個檔案。

```
vi /lib/systemd/system/nginx.service
```

然後把下面的內容貼上，如果有修改 Nginx 的安裝路徑，要把 `/opt/nginx` 替換掉。

```ini
[Unit]
Description=The NGINX HTTP and reverse proxy server
After=syslog.target network.target remote-fs.target nss-lookup.target

[Service]
Type=forking
PIDFile=/opt/nginx/logs/nginx.pid
ExecStartPre=/opt/nginx/sbin/nginx -t
ExecStart=/opt/nginx/sbin/nginx
ExecReload=/bin/kill -s HUP $MAINPID
ExecStop=/bin/kill -s QUIT $MAINPID
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

> 還記得怎麼編輯嗎？按下 `i` 進入插入模式，貼上後用 `Esc` 退出，然後用 `:wq` 指令存檔離開。

完成之後，我們就可以用 `systemctl` 指令來開啟或者關閉 Nginx 了，不過在這之前我們會希望在意外當機後重開機時，能夠自動地把 Nginx 啟動。

```bash
systemctl enable nginx
```

利用 `enable` 功能，把 Nginx 設定為開機自動啟動的項目。

接下來用 `start` 指令把 Nginx 打開，並且用 `status` 指令看看是不是變成 `running` 的運行狀態。

```bash
systemctl start nginx
systemctl status nginx
```

如果想檢查看看能不能連上，可以利用 `curl` 指令。

```bash
curl localhost
```

如果有 HTML 語法出現，基本上就是安裝成功了！

> 如果找不到 `curl` 指令可以執行，嘗試看看自己用 `yum` 安裝吧！

## 小結

其實文章到這邊，安裝伺服器的部分就告一段落。下一階段會介紹怎麼設定 Ruby on Rails 專案，用 Capistrano 這個 Gem 幫助你把網站部署到這台伺服器。

不過，伺服器的設定其實還沒有完成，只是這些小問題會讓你在維護上不太方便。在後面的教學中，會陸續介紹跟提供解決的方案。