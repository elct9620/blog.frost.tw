---
title: 部署你的第一個 Ruby on Rails 網站（八）
date: 2018-05-28 14:54:19
tags: [教學, DevOps, Ruby on Rails]
thumbnail: https://blog.frost.tw/images/getting-started-deploy-your-ruby-on-rails-part-8/thumbnail.jpg
---

前面幾篇文章已經把所有關於 Ruby 和資料庫都設定完成，最後一個階段就是要把 Nginx 設定好，並且讓 Let's Encrypt 可以正確的被設定，讓網站支援 SSL 功能。

<!--more-->

在開始設定之前，因為 Let's Encrypt 針對非 Wildcard 類型可以使用檔案驗證，也是一般情況比較多使用的方式。但是第一次的驗證需要透過 HTTP 來進行，所以我們會先設定好 Let's Encrypt 後才繼續。

> Wildcard 需要用 DNS 驗證，這是第二代的 API 才新增的功能，過去第一代都是透過放置驗證檔案來認證。

## Let's Encrypt 設定

目前最簡單的設定方式就是透過 Certbot 來驗證，可以到官網的 [CentOS 7](https://certbot.eff.org/lets-encrypt/centosrhel7-other) 頁面獲取安裝的指令。

```bash
sudo yum install certbot
```

> 如果找不到 `certbot` 的套件，請先安裝 EPEL `yum install epel-release` 來獲得支援，不過在 PostgreSQL 安裝的步驟應該是已經安裝過了。

> 這邊不使用 `certbot-nginx` 版本的原因是我們自己 Compile 了 Nginx 可能會互相影響。

接下來要對 Nginx 做設定，一般來說如果伺服器上預定要安裝多個網站，我們會在 `/opt/nginx/conf` 下面增加像是 `sites-enabled` 之類的資料夾放置。不過稍微複雜，這篇文章會以直接編輯 `nginx.conf` 的方式介紹。

我們先找到檔案中 `server {` 這一段，類似下面的地方。

```conf
  server {
    listen 80;
    server_name localhost;
    
    # ...
  }
```

然後加入 Let's Encrypt 需要的設定。

```conf
  server {
    listen 80;
    server_name localhost;
    
    location ~ /.well-known {
      allow all;
      root /opt/nginx/html;
    }

    # ...
  }
```

這個設定會讓遇到 `~/.well-known` 開頭的頁面，都使用 `/opt/nginx/html` 這個目錄，如此一來就能夠讓 Certbot 把驗證用的檔案放在這裡面，讓 Let's Encrypt 可以驗證到。

> 如果有使用像是 OpenID 之類的，可能會互相干擾，需要調整設定值。

完成設定後，我們用 Certbot 執行產生 SSL 憑證的指令，將網站需要的憑證生成。

```
sudo certbot certonly --webroot -w /opt/nginx/html -d example.frost.tw
```

> 記得把 `-d` 後面的設定改為自己網站的網址。

第一次執行的話會問一些基本的問題，像是信箱之類的用來之後通知快要過期跟一些重要訊息。

```
Saving debug log to /var/log/letsencrypt/letsencrypt.log
Plugins selected: Authenticator webroot, Installer None
Enter email address (used for urgent renewal and security notices) (Enter 'c' to
cancel):
```

中間會有使用者條款，輸入 `A` 即可，至於要不要同意接收一些來自 EFF 組織的訊息，就看個人。

接下來如果沒有出現其他錯誤，應該會看到類似下面的訊息。

```
IMPORTANT NOTES:
 - Congratulations! Your certificate and chain have been saved at:
   /etc/letsencrypt/live/example.frost.tw/fullchain.pem
   Your key file has been saved at:
   /etc/letsencrypt/live/example.frost.tw/privkey.pem
   Your cert will expire on 2018-08-26. To obtain a new or tweaked
   version of this certificate in the future, simply run certbot
   again. To non-interactively renew *all* of your certificates, run
   "certbot renew"
 - If you like Certbot, please consider supporting our work by:

   Donating to ISRG / Let's Encrypt:   https://letsencrypt.org/donate
   Donating to EFF:                    https://eff.org/donate-le


```

## 設定 Nginx

回到 `nginx.conf` 設定檔，因為我們只有監聽 80 埠，所以只能接受 HTTP 請求。所以現在我們要做幾個修改，讓網站隨時處於 HTTPS 的安全連線狀態。

* 把 HTTP 轉到 HTTPS
* 啟用 HTTPS

先在原本 `location ~/.well-known {` 區段的下面增加轉跳到 HTTPS 的設定，類似這樣。

```conf
  server {
    listen 80;
    server_name example.frost.tw;
    
    location ~ /.well-known {
      allow all;
      root /opt/nginx/html;
    }

    return 301 https://$server_name$request_uri;
  }
```

> `server_name` 要記得改成你的網域名稱，不然在做轉跳時會因為跟申請的 SSL 憑證不符合而無法正常開啟。


然後在這個區段下方，應該會看到一段被 `#` 註解的區塊，也就是預設的 HTTPS 設定範例。
我們將註解取消，然後補上需要的設定。

```conf
server {
  listen       443 ssl;
  server_name  example.frost.tw;

  ssl on;
  ssl_certificate      /etc/letsencrypt/live/example.frost.tw/fullchain.pem;
  ssl_certificate_key  /etc/letsencrypt/live/example.frost.tw/privkey.pem;
}
```

> 以上是最基本的設定，有興趣的話可以參考 [Digital Ocean 的教學](https://www.digitalocean.com/community/tutorials/how-to-create-a-self-signed-ssl-certificate-for-nginx-in-ubuntu-16-04)裡面有一些建議的 SSL 設定可以參考。

然後我們要指定一下 Passenger 在這個網站啟用，以及程式碼所在的位置，所以修改成類似下面這樣的設定。

```
server {
  listen       443 ssl;
  server_name  example.frost.tw;

  ssl on;
  ssl_certificate      /etc/letsencrypt/live/example.frost.tw/fullchain.pem;
  ssl_certificate_key  /etc/letsencrypt/live/example.frost.tw/privkey.pem;
  
  location ~ /.well-known {
    allow all;
    root /opt/nginx/html;
  }
  
  root /home/deploy/example.frost.tw/current/public;
  passenger_enabled on;
}
```

最後我們用 Nginx 指令來檢查一下。

```bash
sudo /opt/nginx/sbin/nginx -t
```

如果沒有發生錯誤，就可以用 `systemctl` 指令重開伺服器，並且看到正常運作的 Rails 網站摟！

```bash
sudo systemctl restart nginx
```

## 總結

這一次的系列文章就到這邊結束了，其實還有不少小細節沒辦法在文章中提到。而且這些都會隨著時間或者有更好的方法而改變，舉例來說 Linux 系統有一個 Cron Job 的功能可以定時的執行某些指令，而 Let's Encrypt 的憑證一般來說會在三個月左右過期。

如果不希望自己每次都手動操作的話，就會利用 Cron Job 功能自動執行 `certbot renew` 任務，並且重新啟動 Nginx 將可能被更新的憑證重新讀取進去。

部署網站除了使用現有雲端服務之外，更多的時候都會採取這樣的方式來執行，因為可以控制的部分相對的多。也比較能針對專案做適合的配置，畢竟以目前 VPS 收費一個月 $5 美金的價格來說，相比 Heroku 的性價比是高上不少的。

下次有機會的話應該會試著寫一系列使用 Chef 或 Ansible 的部署教學，這系列的方式只有個位數的伺服器需要管理可能還行得通，但是當有數十台以上的時候，就不會是什麼有效率的方法，更何況要服務客戶協助他們部署的時候。
