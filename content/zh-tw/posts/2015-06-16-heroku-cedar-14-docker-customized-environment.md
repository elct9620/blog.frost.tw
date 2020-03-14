---
layout: post
title: 'Heroku Cedar 14 - 用 Docker 客製化環境'
publishDate: 2015-06-16 06:12
comments: true
tags: [Heroku, Docker, 筆記]
---
最近 Heroku 推出了 [Docker 支援](https://blog.Heroku.com/archives/2015/5/5/introducing_heroku_Docker_release_build_deploy_heroku_apps_with_docker)，也因此我馬上就去試玩了這個功能。

這篇文章會簡單介紹 Heroku Docker 的運作，以及可以運用的方式。

文章大致上會涵蓋這些內容：

* Heroku Docker Plugin 的運作
* 建構客製化環境的 Dockerfile
* 利用 Docker 製作 Buildpacks

<!--more-->

### Docker Plugin

這是一個 Open Source 的專案，放在 Heroku 官方的 [Github](https://Github.com/Heroku/heroku-Docker) 上面，任何人都可以進行 Pull Request 對其新增語言支援。

目前支援的語言只有 Scala, Ruby, Node.js, Python 這幾種，細看 Dockerfile 的撰寫其實就可以推測出大多是不相依於 Apache/Nginx 的類型。

> 因為我自己在維護 PHP 的 Phalcon Buildpacks 這篇文章正好是我支援 Docker 後才寫的，在撰寫 Dockerfile 時就碰到了「設定檔」問題

基本使用很簡單，使用下面的指令安裝 Heroku Command Line Tool 的擴出：

```bash
Heroku plugins:install heroku-Docker
```

之後就可以使用 `Heroku Docker:[action]` 去做一些應用。

#### init

```bash
Heroku Docker:init
```

一開始要對自己原本的專案加上 Docker 支援，只要運行這個指令就可以了！
他會自動產生一個 Dockerfile 並且在裡面配置好「所需」的環境（其實就是把 Buildpacks 複製進去）

這邊簡單把 Heroku Docker 跟 Buildpacks 的流程做比較：

|       | Docker | Buildpacks|
|-------|--------|----------------------|
|偵測環境| Docker:init | bin/detect      |
|建構環境| Dockerfile 運行 | bin/compile |
|執行應用| Procfile 定義（必要）| Procfile (建構時有預設值) |

其實會發現基本上就是把 Buildpacks 的任務本地化而已。

> `bin/detech` 是 Shell Script 用來檢查有沒有必要的檔案，而 `Docker:init` 則是掃描目錄有沒有對應的檔案 Ex. Gemfile
> `bin/compile` 跟 Dockerfile 在建構 Ruby 環境都是下載相同的檔案解壓縮（這是為了加速，直接寫入編譯程式也是可以的）

唯一的不同點在於 Docker 版本預設不會自動生成 Procfile 所以必須自行指定像是 `Rails server` 之類的指令。

> 原始碼中有指出： Procfile 必要，並且要有一個 web node 存在

#### exec

用途跟 `Heroku run` 一樣，不過要注意的是 Dockerfile 裡面所寫的 `ONBUILD` 是不會執行的。

> 他是直接跑你的 image 而不是產生新的 image 去執行（下一段的 `start` 會提到）

#### start

可以在本機測試 Deploy 後的情況，相對過去要 Deploy 到 Heroku 上測試比起來，真的好太多了！

> 執行的時候可以看一下目錄，會發現多出一個 `Dockerfile-(一段應該是 SHA1 的字串)` 的檔案，內容就是 `FROM 剛剛的 Image` 也因此會觸發 `ONBUILD` 去設定環境

這樣做的原因大概可以推測是為了避免在跑 `exec` 的時候還要先裝完相依這些執行時用不到的檔案吧 XD

#### release

跟 `git push Heroku master` 差不多的意思，他會把剛剛的環境壓縮成一個 Gzip 檔然後上傳到 Heroku。
這個 Gzip 檔就是過去用 Buildpacks 跑完後產生的 `slug` 也就是說，如果專案加上相依有 100MB 那就得上傳 100MB 的相依上去。

> 我自己維護的 PHP + Phalcon 專案壓縮後就有 49MB 非常的大，這也是我後來沒有改用 Docker 的原因。

### clean

這個指令會把產生的 image 跟 container 清除，以確保環境是乾淨的（超貼心 XD）

---

那麼這有什麼用呢？大致上可以歸類為以下幾點：

1. 私有的 Source Code 需要 Compile 後 Deploy
2. 高度客製化的環境（而且無法製成 Buildpacks）或者不希望其他人使用這個環境
3. 需要自行安裝 Heroku 的 `cedar` 不支援的相依
4. 用來輔助本地測試
5. 用來製作 Buildpacks

### Dockerfile 的撰寫

假設我需要編譯一些檔案好 Deploy 到 Heroku 上面，只要改寫 Dockerfile 就可以了！

這邊就以我自己維護的 Buildpacks 所用的 Dockerfile 作為範例來講解。

> 在撰寫 Dockerfile 的時候以方便為主，不需要優化 Docker Image 的大小（我寫完 Buildpacks 才發現）
> 主要是 Heroku 不會跑任何 Dockerfile 所以壓縮的再小也沒有意義，也不會節省任何時間。

首先要引用 Heroku 預先準備好的 `cedar` image 來當作基底（跟 Heroku 實際環境一樣，不用再猜了 XD）
```Docker Dockerfile
FROM Heroku/cedar:14
```

之後就是很淡定的開始跑各種指令拉（節錄部分 Dockerfile）
```Dockerfile Dockerfile
RUN useradd -d /app -m app
USER app
RUN mkdir /app/build
RUN mkdir /app/src
WORKDIR /app/src

# Environment
ENV HOME /app
ENV BUILD_HOME /app/build
ENV APACHE_ROOT ${HOME}/apache
ENV PCRE_ROOT ${HOME}/libs/pcre

ENV APACHE_VERSION 2.4.12
ENV APR_VERSION 1.5.2
ENV APR_UTIL_VERSION 1.5.4
ENV LIBPCRE_VERSION 8.37

ENV APACHE_URL https://www.us.apache.org/dist/httpd/httpd-${APACHE_VERSION}.tar.gz
ENV APR_URL https://www.us.apache.org/dist/apr/apr-${APR_VERSION}.tar.gz
ENV APR_UTIL_URL https://www.us.apache.org/dist/apr/apr-util-${APR_UTIL_VERSION}.tar.gz
ENV PCRE_URL ftp://ftp.csx.cam.ac.uk/pub/software/programming/pcre/pcre-${LIBPCRE_VERSION}.tar.gz

ENV APACHE_DIR httpd-${APACHE_VERSION}
ENV APR_DIR apr-${APR_VERSION}
ENV APR_UTIL_DIR apr-util-${APR_UTIL_VERSION}
ENV PCRE_DIR pcre-${LIBPCRE_VERSION}

ENV CURL_FLAGS --location --silent

# Compile

RUN cd $BUILD_HOME && \
			 curl $CURL_FLAGS "$APACHE_URL" | tar zx && \
       curl $CURL_FLAGS "$APR_URL" | tar zx && \
       curl $CURL_FLAGS "$APR_UTIL_URL" | tar zx && \
       curl $CURL_FLAGS "$PCRE_URL" | tar zx
       
RUN cd $BUILD_HOME/$PCRE_DIR && \
    ./configure --prefix=$PCRE_ROOT && \
    make && make install
    
RUN cd $BUILD_HOME && \
		mv $APR_DIR $APACHE_DIR/srclib/apr && \
    mv $APR_UTIL_DIR $APACHE_DIR/srclib/apr-util && \
    cd $APACHE_DIR && \
    ./configure --prefix=$APACHE_ROOT --with-pcre=$PCRE_ROOT --enable-rewrite && \
    make && make install
```

這邊很重要的訣竅就是 Compile 的時候可以分開為單獨的 `RUN` 因為 Docker 在 Build 的時候會把一個指令當成一個 `layer` 也就是說，中間如果失敗（寫 Script 總是會失誤）就不用整個重新 Compile 過，而是只需要重新跑部分的指令而已。

> 這會節省非常多時間，我自己的 Macbook Pro Retina 15" 就要花上十幾分鐘完整編譯。
> 這邊最重要的是自行編譯的檔案都要放到 `/app` 目錄，因為包成 Slug 的時候是不會壓縮這個目錄以外的檔案。

至於設定檔的部分，我則是這樣設定的（利用 `sed` 去置換預設的設定檔）

```Dockerfile Dockerfile
# Configure
RUN sed -ire 's/^Listen.*$/Listen \${PORT}/g' $APACHE_ROOT/conf/httpd.conf && \
    sed -ire 's/^DocumentRoot.*$/DocumentRoot\ "\/app\/src"/g' $APACHE_ROOT/conf/httpd.conf && \
    sed -ire 's/<Directory "\/app\/apache\/htdocs">/<Directory "\/app\/src">/g' $APACHE_ROOT/conf/httpd.conf && \
    sed -ire 's/AllowOverride\ None/AllowOverride\ All/g' $APACHE_ROOT/conf/httpd.conf
RUN echo "<IfModule dir_module>\nDirectoryIndex index.html index.PHP\n</IfModule>" >> $APACHE_ROOT/conf/httpd.conf && \
    echo "<FilesMatch \.PHP$>\nSetHandler application/x-httpd-PHP\n</FilesMatch>" >> $APACHE_ROOT/conf/httpd.conf
RUN echo "zend_extension=opcache.so" >> $PHP_ROOT/PHP.ini && \
    echo "extension=phalcon.so" >> $PHP_ROOT/PHP.ini && \
    echo "extension=mongo.so" >> $PHP_ROOT/PHP.ini && \
    echo "extension=redis.so" >> $PHP_ROOT/PHP.ini
```

這樣做的原因是如果未來要相容在 Docker Plugin 時，就可以省去問題（Plugin 只會把 Template 丟出來，並不支援 ADD 之類的增加檔案）

> 不過後來想想，包個 Buildpacks 給 Plugin 下載比較實在 XD

最後是 Deploy 的時候會用到的 `ONBUILD` 部分（其實就是把 Source Code 複製進去而已）

```Dockerfile Dockerfile
# Copy SourceCode
ONBUILD COPY . /app/src
ONBUILD USER root
ONBUILD RUN chown -R app /app
ONBUILD USER app

# Setup Dependency
ONBUILD RUN if [ -f /app/src/composer.json ]; then \
            curl --silent --max-time 60 --location "$COMPOSER_URL" > $HOME/src/composer.phar; \
            PHP $HOME/src/composer.phar install --prefer-dist; \
            rm $HOME/src/composer.phar; \
            fi

# Configure Profile
ONBUILD USER app
ONBUILD RUN mkdir -p /app/.profile.d
ONBUILD RUN echo "export PATH=\"$PATH:$PHP_ROOT/bin:$APACHE_ROOT/bin\"" > /app/.profile.d/PHP.sh
ONBUILD RUN echo "cd /app/src" >> /app/.profile.d/PHP.sh

ONBUILD EXPOSE 3000
```

裡面跑了 `composer install` 至於需不需要跑就看專案摟～
（像是 PHP/Node.js 的相依都會被一起複製到，其實也不用這麼在意拉⋯⋯）

至於 Port 一律都是 3000 所以 `EXPOSE` 到 3000 就沒問題了。

### 輔助 Buildpacks 製作

稍微修改一下 Dockerfile 放點輔助的 Script 進去就可以了。

我是寫了一個叫做 `package.sh` 的 Shell Script 幫我把 `/app` 的環境包出來。

```sh package.sh
mkdir /tmp/package
cd /app
tar cfvz /tmp/package/libs.tar.gz libs
tar cfvz /tmp/package/PHP.tar.gz PHP
tar cfvz /tmp/package/apache.tar.gz apache

cd /tmp/package
tar cvfz /tmp/slug.tar.gz libs.tar.gz PHP.tar.gz apache.tar.gz
```

做了些什麼呢？其實就是包 `slug` 但是跳過原始碼部分。

另外因為 Docker Plugin 不能幫我做把包好的 `slug` 拉出來，所以我另外寫了 `build_Docker.sh` 幫我複製出來。

```sh build_Docker.sh
#!/bin/bash

if [ -f slug.tar.gz ]; then
  rm slug.tar.gz
fi

# Build Image
Docker build -t PHP-with-phalcon .  # Run docker
CONTAINER_ID=$(Docker run -d PHP-with-phalcon /app/package.sh)
Docker wait $CONTAINER_ID
Docker cp $CONTAINER_ID:/tmp/slug.tar.gz .
Docker rm -f $CONTAINER_ID

# Remove image
Docker rmi PHP-with-phalcon
```

因為會產生額外的 Image 跟 Container 所以在執行玩的時候都清理掉，確保乾淨。

> 不過目前還在想該怎麼解決 Image Tag 的問題（怕重複到）

這個 Buildpacks 的原始碼在 [Github](https://Github.com/elct9620/Heroku-buildpacks-PHP-with-phalcon) 上面，歡迎大家協助改進跟維護。

> 我有預裝好 Mongodb / Redis Extension 但是 Memcached 因為相依的 `libmemcached` 放在 Ubuntu 的版本管理系統上，卻很難判斷原始碼下載網址，因此我放棄了⋯⋯
