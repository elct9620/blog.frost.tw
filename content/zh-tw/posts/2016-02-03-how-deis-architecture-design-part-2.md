---
layout: post
title: 'Deis 架構分析（二）'
publishDate: 2016-02-03 15:54
comments: true
tags: [Deis, PaaS, 筆記, 雲端, CoreOS]
---
延續[上一篇](https://blog.frost.tw/posts/2016/01/31/how-deis-architecture-design-part-1/)的內容，這篇文章要先來討論比較好懂的 `Router` 部分。

首先，在 Deis 的設計裡面，基本上所有的服務都是包成一個 Image 作為 Continaer 在 CoreOS 運行的。就這點來看，其實是非常符合 Mircoservice 架構的設計。同時我們也可以很輕鬆地將這些服務獨立出來使用，這篇文章討論的 `Router` 除了原本的用途外，也很適合用來學習透過 etcd 部署自動化更新設定檔的環境。

Deis 的原始碼都放在一起，其中 [Router](https://github.com/deis/deis/tree/master/router) 部分是裡面的一個子目錄，那麼就讓我們開始了解運行的架構吧！

<!--more-->

### Dockerfile

```dockerfile
FROM alpine:3.2

# install common packages
RUN apk add --update-cache \
  bash \
  curl \
  geoip \
  libssl1.0 \
  openssl \
  pcre \
  sudo \
  && rm -rf /var/cache/apk/*

# install confd
RUN curl -sSL -o /usr/local/bin/confd https://s3-us-west-2.amazonaws.com/opdemand/confd-git-73f7489 \
  && chmod +x /usr/local/bin/confd

# add nginx user
RUN addgroup -S nginx && \
  adduser -S -G nginx -H -h /opt/nginx -s /sbin/nologin -D nginx

COPY rootfs /

# compile nginx from source
RUN build

CMD ["boot"]
EXPOSE 80 2222 9090

ENV DEIS_RELEASE 1.13.0-dev
```

透過 Dockerfile 可以簡單了解到這個服務是怎麼啟動的，整體上來說非常簡單，除了安裝 confd 之外。就是把名為 `rootfs` 的目錄加進去，並且編譯客製化的 Nginx 接著啟動伺服器。

> 這邊比較特別的地方是客製化編譯 Nginx 的部份，主要是因為 Deis 除了基本的 Nginx 功能外，也增加了防火牆模組（[NAXSI](https://github.com/nbs-system/naxsi)）跟一些模組在裡面，有興趣的可以自行閱讀 `rootfs/bin/build` 這個檔案的內容。

### boot

我想大家會覺得奇怪，為什麼不是直接執行 Nginx 而是執行一個名為 `boot` 的指令呢？
這是因為 Deis 除了啟動 Nginx 之外，還要將像是 confd 之類的服務也一併啟動。

> 這邊比較有趣的是，一般會用 Shell Script 來處理。但是 Deis 使用 Golang 來做處理。

從 Makefile 可以看出 `boot` 這個檔案是透過 Golang 的 Cross-compile 功能所編譯後，再構出 Docker 的 Image 來使用。

```makefile
build: check-docker
  GOOS=linux GOARCH=amd64 CGO_ENABLED=0 godep go build -a -installsuffix -v -ldflags '-s' -o $(BINARY_DEST_DIR)/boot cmd/boot/boot.go || exit 1
  @$(call check-static-binary,rootfs/bin/boot)
  docker build -t $(IMAGE) .
  rm rootfs/bin/boot
```

> 所以如果要自己封裝，記得要用 `make build` 的指令，而不是直接 `docker build` 否則是會包出無法執行的 Image。

從 `cmd/boot/boot.go` 可以發現引用了 `logger/stdout_formatter.go` 這個檔案，基本上就是統一格式化 Deis 輸出的紀錄檔訊息，因此這邊就不多做討論。

```golang
func main() {
  // 略

  log.Debug("reading environment variables...")
  host := getopt("HOST", "127.0.0.1")

  etcdPort := getopt("ETCD_PORT", "4001")

  etcdPath := getopt("ETCD_PATH", "/deis/router")

  hostEtcdPath := getopt("HOST_ETCD_PATH", "/deis/router/hosts/"+host)

  externalPort := getopt("EXTERNAL_PORT", "80")

  client := etcd.NewClient([]string{"https://" + host + ":" + etcdPort})

  // wait until etcd has discarded potentially stale values
  time.Sleep(timeout + 1)

  log.Debug("creating required defaults in etcd...")
  mkdirEtcd(client, "/deis/config")
  mkdirEtcd(client, "/deis/controller")
  mkdirEtcd(client, "/deis/services")
  mkdirEtcd(client, "/deis/domains")
  mkdirEtcd(client, "/deis/builder")
  mkdirEtcd(client, "/deis/certs")
  mkdirEtcd(client, "/deis/router/hosts")
  mkdirEtcd(client, "/deis/router/hsts")

  setDefaultEtcd(client, etcdPath+"/gzip", "on")

  log.Info("Starting Nginx...")

  go tailFile(nginxAccessLog)
  go tailFile(nginxErrorLog)

  nginxChan := make(chan bool)
  go launchNginx(nginxChan)
  <-nginxChan

  // FIXME: have to launch cron first so generate-certs will generate the files nginx requires
  go launchCron()

  waitForInitialConfd(host+":"+etcdPort, timeout)

  go launchConfd(host + ":" + etcdPort)

  go publishService(client, hostEtcdPath, host, externalPort, uint64(ttl.Seconds()))

  log.Info("deis-router running...")

  exitChan := make(chan os.Signal, 2)
  signal.Notify(exitChan, syscall.SIGTERM, syscall.SIGINT)
  <-exitChan
  tail.Cleanup()
}
```

基本上，整個 `main()` 分為兩個部分。

第一個部分是讀取環境變數的部份（透過 `getopt()` 方法），第二個部分則是啟動各項服務的部份。這邊比較特別的是利用 Golang 的 Channel 功能，做出依序啟動服務的效果。

> Golang 的 Channel 在做 `receive` 動作時，會阻止程式繼續運作。

最後的 `signal.Notify` 可以設定當接收到一些 Signal 時要做出什麼對應的處理。

> 這邊接受的是常見的中斷訊號，一般就是 Ctrl + C 會送過去的訊號。

另外，這邊透過 [tail](https://github.com/hpcloud/tail) 這個函式庫將 Nginx 的記錄檔讀取出來，並且格式化後輸出到 stdout 顯示。

> 使用 Docker 的好習慣就是要將當前運行的程式輸出一律導向 stdout / stderr 讓 Docker 來幫忙做記錄，否則所有的 Log 都會被存在 Container 裡面反而難以除錯。

### confd

confd 會監聽 etcd 的 key-value 變動情況，然後動態的執行一些指令。

```toml
[template]
src   = "nginx.conf"
dest  = "/opt/nginx/conf/nginx.conf"
uid = 0
gid = 0
mode  = "0644"
keys = [
   "/deis/config",
   "/deis/services",
   "/deis/router",
   "/deis/domains",
   "/deis/controller",
   "/deis/builder",
   "/deis/store/gateway",
   "/deis/certs",
]
check_cmd  = "check {{ .src }}"
reload_cmd = "/opt/nginx/sbin/nginx -s reload"
```

以 Nginx 的重起來說，當上述指定的 Key （如 `/deis/domains`）有更動，那麼就會先從樣板檔案產生新的設定檔，並且重新啟動 Nginx。

有興趣的話可以去看看 `rootfs/etc/confd` 的設定檔是如何撰寫的。

比較有趣的是 `/bin/generate-certs` 這個指令，他也是透過 confd 去產生的。

```sh
#!/usr/bin/env bash

# create or truncate the file
> /etc/ssl/deis_certs

{{ range $cert := ls "/deis/certs" }}
echo {{ $cert }} >> /etc/ssl/deis_certs
{{ end }}

CERT_PATH=/etc/ssl/deis/certs
KEY_PATH=/etc/ssl/deis/keys

# clean up all certs
rm -rf $CERT_PATH
rm -rf $KEY_PATH

# ...then re-create the paths
mkdir -p $CERT_PATH
mkdir -p $KEY_PATH

{{ if gt (len (lsdir "/deis/certs")) 0 }}
while read etcd_path; do
   {{ range $cert := ls "/deis/certs" }}
   if [[ "$etcd_path" == "{{ $cert }}" ]]; then
     cat << EOF > "$CERT_PATH/$etcd_path.cert"
{{ getv (printf "/deis/certs/%s/cert" $cert) }}
EOF
     cat << EOF > "$KEY_PATH/$etcd_path.key"
{{ getv (printf "/deis/certs/%s/key" $cert) }}
EOF
   fi{{ end }}
done < /etc/ssl/deis_certs
{{ else }}
# there is no certificates to generate
{{ end }}
```

這邊很有趣的是，他會從 etcd 裡面讀取每一組 SSL 的 Private Key / Certificates 並且依照 Key 產生一組檔案來寫入檔案。

> 如此一來每一個不同 Domain 所需的 SSL 設定就可以透過 etcd 來做管理。不過其實另一方面來看，這個檔案其實會不斷地增長⋯⋯
> 在 `/bin/boot` 中，初次執行會設定一個 Cron Job 去執行這個指令，理由還不清楚不過應該是為了修正檔案沒有順利產生之類的問題吧（就註解來看是一個修正）

---

到此為止，基本上一個簡單的 Router 就算是設定完成了。
如果對防火牆設定有興趣的話，可以參考 `rootfs/opt/nginx` 裡面的設定是如何撰寫的。

大致上剩下的都是設定檔的部份，稍微詳讀之後就可以瞭解其背後運作的原理。
若要建構自己的簡易 Router 參考這樣的方式設計，其實也沒有想像中的困難。
