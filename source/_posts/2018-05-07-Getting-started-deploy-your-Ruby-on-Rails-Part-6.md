---
title: 部署你的第一個 Ruby on Rails 網站（六）
date: 2018-05-07 09:59:38
tags: [DevOps, 教學, Ruby on Rails]
---

經過前面五篇的教學，我們距離將 Ruby on Rails 部署到伺服器上越來越接近了。上一階段我們在本機段將部署的設定做完之後，這一篇文章會回到伺服器將部署所需的設定補齊，讓 Capistrano 可以正確的將程式碼部署到伺服器。

<!-- more -->

在[上一篇](https://blog.frost.tw/posts/2018/04/10/Getting-started-deploy-your-Ruby-on-Rails-Part-5/)裡面，我們設定了部署到 Staging 的使用者為 `deploy` 所以我們要先在伺服器上增加這個使用者。

> 我們會習慣開設一個沒有 `sudo` 權限和密碼的使用者，只用於部署。

## 新增部署用帳號

```bash
useradd deploy
```

如果還記得我們在[第一篇](https://blog.frost.tw/posts/2018/04/10/Getting-started-deploy-your-Ruby-on-Rails-Part-1/)裡面提到的新增使用者方法，後續的動作基本上是大同小異的。

> 有些 Linux 系統不一定會在做完 `useradd` 後自動新增 `/home/deploy` 可以自己用 `mkdir /home/deploy` 後做 `chown -R deploy:deploy /home/deploy` 來手動設定。

接下來，我們切換到 `deploy` 使用者，並且設定使用金鑰登入。

```bash
sudo su - deploy
mkdir ~/.ssh
chmod 700 ~/.ssh
```

複製本機的 `id_rsa.pub` 內容，並且貼到伺服器上的 `~/.ssh/authorized_keys` 上，如果忘記步驟可以回第一篇看。


## 安裝資料庫

一般情況下我們在 Ruby on Rails 專案大多採用 PostgreSQL 來做為資料庫，不過在 CentOS 上不一定會提供我們所希望的版本，所以需要先到 [PostgreSQL 官網](https://www.postgresql.org/download/linux/redhat/)取得對應的套件設定。

![螢幕快照 2018-04-22 下午9.02.44.png](quiver-image-url/947E30127205650F228B211EF7CFBE67.png =960x540)

根據官網選擇所需的資料庫版本（目前大多是使用 9.5 ~ 9.7）然後取得安裝的指令。

```bash
# 安裝 PostgreSQL 10 為例

sudo yum install https://download.postgresql.org/pub/repos/yum/10/redhat/rhel-7-x86_64/pgdg-centos10-10-2.noarch.rpm
sudo yum install postgresql10-server
```

因為我們需要的是伺服器，所以就可以不安裝客戶端的部分。不過我們可能會使用一些 PostgreSQL 的 Extension 以及 Ruby 需要有 PostgreSQL 的部分原始碼來編譯，所以我們需要再額外追加另外幾個套件。

```bash
sudo yum install postgresql-contrib postgresql-devel postgresql-client
```

最後，將 PostgreSQL 伺服器開啟，並且設定為開機自動啟動。

```bash
sudo systemctl enable postgresql-10
sudo systemctl start postgresql-10
```

## 創建資料庫

剛安裝好的狀況下，是只有 `postgres` 這個使用者可以使用的。而我們希望可以在不特別設定密碼的狀況下連上資料庫，所以我們可以透過以下的方法。

* 建立 `deploy` 資料庫使用者
* 給予 `deploy` 使用者建立資料庫權限
* 由 `deploy` 使用者建立資料庫（等同擁有者）

> 其實應該是開好資料庫後指定 `deploy` 資料庫使用者為所有者，不過步驟會稍微複雜一些。

```bash
sudo su - postgres
createuser --createdb deploy
```

完成之後，我們就可以回到 `deploy` 使用者上開設資料庫。

```bash
sudo su - deploy
createdb example_db
```

> `example_db` 記得替換成你的專案的名稱，像是 `mystore_production` 之類的。

##  準備設定檔

在上一篇我們設定了 `config/secrets.yml` 為設定檔，所以我們需要先建立起來，以免在部屬的時候找不到。

舉例來說，如果我們設定了 `deploy_to` 為  `/home/deploy/staging` 的話，需要先建立好 `shared` 目錄並把檔案放進去。

```bash
sudo su - deploy
mkdir -p /home/deploy/staging/shared/config
```

然後用 Vim 編輯 `config/secrets.yml` 這個檔案，將必要的內容放進去。

```yaml
staging:
  secret_key_base: SECRET_KEY_BASE
```

> `secret_key_base` 的值可以用 `rake secret` 指令產生。

如果有使用資料庫的話，也別忘記將 `config/database.yml` 設定好放到 `/home/deploy/staging/shared/config` 目錄裡面。

> 前面用的創建資料庫方法可以只寫下資料庫名稱，帳號跟密碼會自動被偵測到。

## 小結

到此為止，我們基本上已經將 Capistrano 設定完畢。下一篇我們要讓 GitHub （或是你自己的 Git 伺服器）允許我們的伺服器可以將專案下載下來，最後再將 Nginx 對應的 Passenger 設定補上，就可以完成第一次的部署了！
