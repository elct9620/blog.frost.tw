---
title: 部署你的第一個 Ruby on Rails 網站（三）
date: 2018-03-27 21:30:15
tags: [教學,DevOps,Ruby on Rails]
thumbnail: https://blog.frost.tw/images/getting-started-deploy-your-ruby-on-rails-part-3/thumbnail.png
---

經過[第一篇](https://blog.frost.tw/posts/2018/03/20/Getting-started-deploy-your-Ruby-on-Rails-Part-1/)和[第二篇](https://blog.frost.tw/posts/2018/03/23/Getting-started-deploy-your-Ruby-on-Rails-Part-2/)的說明，我想大家現在應該都有辦法順利的透過 SSH 進入自己的伺服器。

在第二篇的最後，我們針對 Ruby 環境預先做了準備，接下來就是安裝 Ruby 環境的時候了！

<!-- more -->

## 計畫

隨著專案的發展，我們通常都會需要更新 Ruby 版本。這次我們選擇使用的是 Passenger + Ruby  的解決方案，好處是可以透過設定檔指定 Ruby 版本。為了這個優點，我們可以透過自行編譯 Ruby 來管理多個版本的 Ruby。

如果覺得自行編譯麻煩的話，也可以選擇 RVM 或者 rbenv 這兩套常見的 Ruby 版本管理工具，不過在經驗上編譯 Ruby 環境其實非常的容易，所以也就不一定需要了！

> 使用這種方法是需要管理的主機不多，或者是自己使用（需要放多個網站）的情況才會這樣做，當主機多的時候，採用 Chef / Ansible 這種部署工具，一台機器針對一個網站配置，更新版本時就採取直接安裝新的伺服器後轉移過去，反而會比較好管理。

## 編譯 Ruby

首先，我們要確定是在自己的使用者下執行，而非 `root` 使用者。看一下輸入指令的地方是顯示類似 `elct9620@deploy-example` 而不是 `root@deploy-example` 就能夠分辨現在使用的帳號是哪一個。

`@` 前面是「使用者」後面的部分叫做 Hostname（主機名稱）可以用來分辨是在哪一台伺服器上，所以在設定的時候好好取名是很重要的。

> 不論是寫程式或設定伺服器，用容易理解的命名都是一個好習慣。

這次的範例會編譯 Ruby 2.4 版本，我們要先到 Ruby 官方網站的[下載頁面](https://www.ruby-lang.org/zh_tw/downloads/)來取得原始碼的壓縮檔。

![螢幕快照 2018-03-26 下午10.17.13.png](https://blog.frost.tw/images/getting-started-deploy-your-ruby-on-rails-part-3/screenshot.jpg)

如圖上顯示的一樣，目前最新的 Ruby 2.4.3 是我們想安裝的版本，所以對他點選右鍵後選擇「複製連結網址」就可以取得像是下面的下載位址。

```
https://cache.ruby-lang.org/pub/ruby/2.4/ruby-2.4.3.tar.gz
```

接下來我們到伺服器上用 `wget`（WWW Get）指令來下載檔案，除了 `curl` 這個之後會介紹的指令外，是在 Linux 上很常用來下載檔案的指令。

```bash
wget https://cache.ruby-lang.org/pub/ruby/2.4/ruby-2.4.3.tar.gz
```

> 如果發現沒有 `wget` 指令的話，可以利用上次介紹過的 `sudo yum install wget -y` 來安裝。

下載完畢後，如果不確定操作是否正確，我們可以用 `ls` (List) 指令來看看現在這個目錄（資料夾）下面有沒有這個檔案。

```bash
ls
```

結果會類似下面這樣

```bash
[elct9620@deploy-example ~]$ ls
ruby-2.4.3.tar.gz
```

既然這是一個壓縮檔，我們理所當然的要下指令對他解壓縮了！

在 Linux 中，我們通常會把檔案做成一個 `tar` 格式的檔案，然後再搭配上一個壓縮的格式（例如 Gzip 或者 Bzip2）所以才會有叫做 `.tar.gz` 或者 `.tgz` 這樣的副檔名。

而 `tar` 也是 Linux 中的一個指令，可以用來壓縮或者解壓縮檔案。下面的指令同時做了 `-z` （用 Gzip 壓縮格式）`-x`（解壓縮）`-v`（顯示檔案內容）`-f`（指定檔案）來進行解壓縮，統合起來就是「用 Gzip 格式解壓縮 `ruby-2.4.3.tar.gz` 這個檔案，並顯示內容」


```bash
tar -zxvf ruby-2.4.3.tar.gz
```

執行完畢後，再次用 `ls` 看一次，會發現多出了 `ruby-2.4.3` 這個資料夾。

```bash
[elct9620@deploy-example ~]$ ls
ruby-2.4.3  ruby-2.4.3.tar.gz
```

為了編譯 Ruby 方便下指令，我們要先用 `cd`（Change Directory）指令，切換到 `ruby-2.4.3` 這個目錄下。

```bash
cd ruby-2.4.3
```

同時可能會發現原本輸入指令左方的 `~` 符號變成了 `ruby-2.4.3`，這是表示你目前所在的資料夾，透過這樣的方式就不怕迷失在 Linux 的資料夾中。

> `~` 符號是一個代號，表示這個使用者的家目錄，一般 Linux 的使用者都會在 `/home` 資料夾下面有一個對應自己帳號的資料夾。

預設的 Ruby 會安裝到 `/usr/local` 這個位置，但是如果我們希望能管理多個版本的 Ruby 就需要明確的指定位置。

我們可以透過執行 `configure` 這個檔案來對 Ruby 編譯時的行為做設定。

```bash
./configure --prefix=/usr/local/ruby-2.4.3
```

不同的軟體會有不同的設定選項，如果有興趣的話可以去研究看除了指定資料夾之外還有哪些選擇。

> 如果沒有跑出任何東西，麻煩回到第二篇（有修正過指令）目前 DigitalOcean 上面的 gcc 似乎只有舊版的 4 但是一樣可以使用。

接下來，就是編譯 Ruby 了，因為 Ruby 採用了大部分 Linux 都會有的 `make`（類似 `rake` 可以幫我們自動執行各種指令） 所以我們就不需要另外的去安裝像是 `CMake` 或者 `Ninja` 之類的編譯工具。

```bash
make
```

這邊會比較花時間，完成之後我們可以用 `install` 動作請 `make` 幫我們放到正確的位置。

```bash
make install
```

不過這樣操作實際上是會發生錯誤的，因為 `/usr/local` 實際上還是所屬 `root` 我們可以用 `sudo` 指令提升權限。

```bash
sudo make install
```

如此一來就能順利的在系統中把 Ruby 安裝進去了！

可以透過手動執行 `ruby` 這個執行檔來確認 `ruby` 是正確執行的。

```bash
/usr/local/ruby-2.4.3/bin/ruby -v
```

如果能看到版本號，就是我們正確的安裝 Ruby 了。不過每次都要指定位置是很不方便的，我們可以透過改變 `PATH` 環境設定來簡化操作。

```bash
export PATH=/usr/local/ruby-2.4.3/bin:$PATH
```

上面的 `export` 指令表示「從此之後都套用」後面我們將 `/usr/local/ruby-2.4.3/bin` 放在原本的 `PATH` 前面，表示優先從這個目錄開始找。

如此一來就能用 `ruby -v` 直接執行 Ruby 進行操作，不過當下次登入 SSH 因為沒有執行這段指令，就會無法使用這個功能。

如果大部分的情況都會採用 Ruby 2.4.3 的話，可以在 `/etc/profile.d` 這個資料夾放一個叫做 `ruby.sh` 的檔案。

```
sudo vi /etc/profile.d/ruby.sh
```

進入 Vim 後按下 `i` 進入編輯模式，輸入以下指令

```
export PATH=/usr/local/ruby-2.4.3/bin:$PATH
```

再按下 `:wq` 進行存檔，如此一下下次預設就會採用 Ruby 2.4.3 做為預設的 Ruby 執行了。

> 在 `/etc` 目錄下面的變更是對整個伺服器的修改，以後不管是誰打開都會預設使用 Ruby 2.4.3 這點需要注意。

## 小結

這篇文章花了不少時間在處理編譯上，不過當掌握了編譯的方法後，不論是 Nginx 或者 PHP 還是其他的程式，都能夠用相同的方式編譯出來。

在遇到無法使用套件的情況下，會是非常有用的技巧。

下一篇會開始把 Passenger 和 Nginx 安裝起來，因為是透過 Passenger 提供的安裝工具，所以會比這一篇輕鬆很多。
