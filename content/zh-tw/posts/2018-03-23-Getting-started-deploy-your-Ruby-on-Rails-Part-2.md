---
title: 部署你的第一個 Ruby on Rails 網站（二）
publishDate: 2018-03-23 09:15:32
tags: [教學,DevOps,Ruby on Rails]
---

延續[上一篇](https://blog.frost.tw/posts/2018/03/20/Getting-started-deploy-your-Ruby-on-Rails-Part-1/)文章的內容，我們需要先在伺服器上進行設定，讓伺服器可以正確的安裝 Ruby 環境。如此一來，我們才能夠將 Ruby on Rails 部署到伺服器上面。

為了完成這些前置作業，我們還需要針對伺服器的設定進行完善的準備才行。

<!--more-->

## 無密碼使用 Sudo

在完成上一篇的操作後，大家可能會發現用自己的帳號登入伺服器後，使用 `sudo` 指令是需要輸入密碼的。但是我們再新增使用者的時候，並沒有對這個帳號設定密碼，也因此無法使用。

一般來說，我們會選擇：

* 設定密碼
* 讓沒有密碼也可以做 `sudo`

如果想要設定密碼，我們可以先用 `root` 連線到伺服器，使用下面的指令：

```bash
passwd elct9620
```

透過 `passwd` (Password) 指令，針對 `elct9620` 這個使用者進行密碼設定，如此一來就可以使用密碼來進行 `sudo` 的動作。

如果想要使用無密碼的模式，我們可以讓所有屬於 `wheel` 這個群組的使用者賦予 `NOPASSWD` 的設定，讓所有指令都可以在不輸入密碼的狀態下使用。

我們會需要用 Vim 模式進入 `sudo` 設定

```bash
visudo
```

找下面這行：

```bash
# %wheel  ALL=(ALL)       NOPASSWD: ALL
```

對 `#` 按 `x`（Delete）鍵再連續按下 `:wq` 存檔，就可以把註解刪掉，讓 `NOPASSWD` 的設定被啟用。

接下來用自己的帳號 SSH 到伺服器，就可以利用 `sudo` 下達任何指令，而不需要輸入密碼。

> 為什麼不直接在 `root` 狀態下管理，主要是因為使用 `sudo` 指令可以提醒我們現在做的操作會「影響系統」，同樣的道理也可以適用在關閉密碼確認這件事情上。如何方便的管理伺服器，又不失安全性是作為一名伺服器管理員需要仔細考慮的事情。

## 安裝套件

在 Linux 中，沒有任何 GUI（圖形介面）的情況下該如何安裝軟體呢？那就要透過 Linux 的套件管理程式，這跟我們平常使用的 `gem` 指令類似。如果是使用 Mac 的話也許會用過 Homebrew 來幫忙安裝開發環境，簡單說就是「幫忙安裝軟體」的工具。

在不同的 Linux 作業系統中，用來安裝套件的工具也有所差異，以下簡單列出幾種我知道的類型。

* RedHat / CentOS / Fedora - `yum`
* Debian / Ubuntu - `apt`(`apt-get`)
* Arch Linux - `pacman`

不同的套件管理工具有不一樣的指令，類似於我們用 `gem` 和 `npm` 會有一些指令上的差距一樣，這系列文章使用的 CentOS 是採用 `yum` 來安裝。不過就使用上的容易程度來說，其實 `apt-get` 算是比較簡單的，不過這些安裝指令在網路上其實都能找到，即使忘記怎麼使用只要善用 Google 也還是能很快的瞭解怎麼使用。

為了要能夠在伺服器上運行 Ruby 我們除了可以透過 `yum` 安裝之外，也能夠自行下載 Ruby 的原始碼來編譯。不同的做法有不同的優缺點，以這次的計畫，我們希望能夠自行管理 Ruby 版本。所以採取自行編譯 Ruby 原始碼的方式來安裝環境，因此我們需要先有可以編譯 Ruby 環境的套件。

參考 [rbenv/ruby-build](https://github.com/rbenv/ruby-build/wiki) 上面的說明，我們可以透過下面的指令簡單地將編譯 Ruby 所需套件找出來。

```bash
yum install -y gcc bzip2 openssl-devel libyaml-devel libffi-devel readline-devel zlib-devel gdbm-devel ncurses-devel
```

上述安裝的 `gcc` 套件是用來編譯的，而 `-devel` 結尾的套件是讓程式「編譯」的時候能夠找到原始碼資訊的對應資訊。

> 一般安裝軟體的時候我們會希望儘可能節省空間，所以只會把 Binary（二進位可執行檔）的部分安裝進來。但是當我想要自行編譯某個程式的時候，就需要有一個參考去對應他的功能，而這些參考（ex. Header）就可以透過 `devel` 類型的套件來補足。

當執行完成這個指令後，我們就算是準備好編譯 Ruby 了！

> 如果你使用 AWS EC2 練習的話，上面的指令可能不會運作。因為 Amazon Linux 2 提供支援的 `gcc` 已經是 `gcc-7` 了！

## 小結

到目前為止，我們基本上算是將安裝伺服器的「前置動作」完成。下一篇文章就會正式的開始把 Ruby 和 Passenger 透過最簡單的方式進行手動編譯，將它安裝到我們的伺服器上。

如此一來，就算是擁有一個可以執行 Ruby 程式的伺服器了！
