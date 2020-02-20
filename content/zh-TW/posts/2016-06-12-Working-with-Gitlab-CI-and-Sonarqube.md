---
title: 使用 GitLab CI 整合 SonarQube
date: 2016-06-12 15:12:10
tags: ["GitLab", "心得", "Android"]
---

之前都在偷懶沒有寫網誌，剛好這次端午連假比較長。
所以想做測試跟實驗的部分都做完了，就來寫一篇關於 GitLab CI 整合的經驗分享。

文章中大致上會涵蓋這些部分：

* GitLab CI 基本使用
* Rancher建置環境
* SonarQube 基本使用
* GitLab CI 整合環境

文章會以我在建構 CI 環境的過程中來講解，一些安裝跟配置的部分會直接跳過。

<!--more-->

### 硬體環境

因為我主要是幫老爸公司建構這個環境的，所以這些配置是基於一個很小的開發團隊（不足十人）的情況去設置的，如果團隊比較大或者有其他需求，不一定會適用。

這個環境會出現兩台機器，不過實際上使用的只有一台。

* Synology DS1512+
* Server 等級 :: i7-3820 3.6GHz / 8G RAM

目前裡面只有使用這兩台 Server 下面那台是自行組的，放在一個小機櫃這樣 XD

> 內部網路環境用的是 1Gbps 的 Switch 這樣

伺服器因為組了也有三四年，裡面用的是單顆 SSD 原本是 96GB 的前陣子換成 256GB 的 SSD，不過為了避免容量爆炸所以透過 NAS 設定了 ISCSI 給 Server 用，容量是 1TB 這樣。

> 不過體驗到了 Docker Pull 的慢速，所以 ISCSI 只用在 Container 本身的資料保存。

### 軟體環境

伺服器上用的是 Ubuntu 14.04 版本，裡面只安裝以下三個套件。

* Nginx - 做反向代理
* Docker
* Rancher - Container 管理

所有的服務都是透過 Docker 架設，對外的 Web 介面則用 Nginx 導出。

> Production 不能這樣玩，像是 Database 會有效能貧頸等等問題。

### 開發環境

一張圖解釋 XD

![Rancher 配置](/images/working-gitlab-ci-with-sonarqube/rancher.png)

Fluentd 是拿來玩的，至於配置的話都是使用 `docker-compose.yml` 上傳設定來處理的。

```yaml gitlab.yml
postgresql:
  restart: always
  image: sameersbn/postgresql:9.4-18
  environment:
    - DB_USER=gitlab
    - DB_PASS=[hidden]
    - DB_NAME=gitlabhq_production
    - DB_EXTENSION=pg_trgm
  volumes:
    - /srv/gitlab/postgresql:/var/lib/postgresql
gitlab:
  restart: always
  image: sameersbn/gitlab:8.6.4
  links:
    - redis:redisio
    - postgresql:postgresql
  ports:
    - "10080:80"
    - "10022:22"
  environment:
    - DEBUG=false
    - TZ=Asia/Taipei
    - GITLAB_TIMEZONE=Taipei

    - GITLAB_SECRETS_DB_KEY_BASE=[hidden]

    - GITLAB_HOST=localhost
    - GITLAB_PORT=10080
    - GITLAB_SSH_PORT=10022
    - GITLAB_RELATIVE_URL_ROOT=

    - GITLAB_NOTIFY_ON_BROKEN_BUILDS=true
    - GITLAB_NOTIFY_PUSHER=false

    - GITLAB_EMAIL=notifications@moho.com.tw
    - GITLAB_EMAIL_REPLY_TO=noreply@moho.com.tw
    - GITLAB_INCOMING_EMAIL_ADDRESS=gitlab@moho.com.tw

    - GITLAB_BACKUP_SCHEDULE=daily
    - GITLAB_BACKUP_TIME=01:00

    - SMTP_ENABLED=true
    - SMTP_DOMAIN=moho.com.tw
    - SMTP_HOST=192.168.100.230
    - SMTP_PORT=587
    - SMTP_USER=gitlab
    - SMTP_PASS=[hidden]
    - SMTP_STARTTLS=true
    - SMTP_AUTHENTICATION=login

    - IMAP_ENABLED=true
    - IMAP_HOST=192.168.100.230
    - IMAP_PORT=993
    - IMAP_USER=gitlab
    - IMAP_PASS=[hidden]
    - IMAP_SSL=true
    - IMAP_STARTTLS=false
  volumes:
    - /srv/gitlab/gitlab:/home/git/data
redis:
  restart: always
  image: sameersbn/redis:latest
  volumes:
    - /srv/gitlab/redis:/var/lib/redis
```

基本上沒什麼特別，就是照 Docker Image 的範例修改環境變數跟設定而已。

> 用 Rancher 的好處是之後升級可以用 Upgrade 修改 Image 的版本 Tag 就能夠升級了～

SonarQube 的部分也一樣

```yaml sonarqube.yml
postgresql:
  restart: always
  image: sameersbn/postgresql:9.4-18
  environment:
    - DB_USER=sonar
    - DB_PASS=[hidden]
    - DB_NAME=sonar
    - DB_EXTENSION=pg_trgm
  volumes:
    - /srv/sonarqube/postgresql:/var/lib/postgresql
sonarqube:
  restart: always
  image: sonarqube
  links:
    - postgresql:postgresql
  ports:
    - "10081:9000"
  environment:
    - SONARQUBE_JDBC_URL=jdbc:postgresql://postgresql:5432/sonar
    - SONARQUBE_JDBC_PASSWORD=[hidden]
  volumes:
    - /srv/sonarqube/extensions:/opt/sonarqube/extensions
```

這樣一來就能跑起來了，至於像是 Nginx 的反向代理我就不另外敘述摟～～

### GitLab CI 入門

安裝部分就參考官方的[文件](https://gitlab.com/gitlab-org/gitlab-ci-multi-runner)來安裝，基本上不難。
之後就是把它 Register 到 GitLab 上面，有趣的是他可以登記到多個 GitLab 而不限一個，我自己是開一個 Container 去跑，然後給權限讓他能在 Host 上面開新的 Container (Runner) 這樣。

那麼，先來講幾個關鍵的點吧 XD

#### NAT 問題

因為路由器設定的問題，所以在 Runner 去 Clone 專案的時候會有些障礙。

假設我的 GitLab Host 是 `gitlab.xxx.com.tw` 那麼網路設定大概是這樣。

LAN ----> NAT -----> WAN

不過 LAN 裡面又有不同的機器，而老爸公司用的是固定 IP （五組）所以我就透過 IP 去分要導去哪台。

59.x.x.49 ---> NAS
59.x.x.50 ---> Server

這是透過 Public IP 設定的，但是在 Server 裡面會變成

LAN IP ----> NAT -----> Server

結果 NAT 就不覺得 Server 裡面是走 59.x.x.50 進來的（崩潰）

所以只好對 GitLab Runner 動手腳 XD

> GitLab CI 的 Runner 有一個全域的設定檔，我們給他改造一下

```toml /etc/gitlab-runner/config.tmol
[[runners]]
  name = "ruby-2.1-docker"
  url = "https://CI/"
  token = "TOKEN"
  limit = 0
  executor = "docker"
  builds_dir = ""
  shell = ""
  environment = ["ENV=value", "LC_ALL=en_US.UTF-8"]
  disable_verbose = false
```

上面是設定為 Docker 模式的 Runner，我們現在要讓 Host 的 `gitlab.xxx.com.tw` 直接用 Host IP 而不是 Public IP 讓他跳過 NAT 的解析。

```toml /etc/gitlab-runner/config.tmol
[runners.docker]
  // 略
  extra_hosts = ["gitlab.xxx.com.tw:127.10.0.1"]
```

在 `runners.docker` 的部分，可以直接告訴他 `/etc/hosts` 要新增哪幾筆資料。

#### 設定檔

接下來就是學 `.gitlab-ci.yml` 怎麼寫了，如果用過 Travis CI 之類的服務應該都是可以駕輕就熟拉 XD

```yaml .gitlab-ci.yml
before_script:
  - export GRADLE_USER_HOME=`pwd`/.gradle
  - mkdir -p $GRADLE_USER_HOME
  - echo "org.gradle.daemon=true" >> $GRADLE_USER_HOME/gradle.properties
  - echo "org.gradle.jvmargs=-Xmx2048m -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8" >> $GRADLE_USER_HOME/gradle.properties
  - echo "org.gradle.parallel=true" >> $GRADLE_USER_HOME/gradle.properties
  - echo "org.gradle.configureondemand=true" >> $GRADLE_USER_HOME/gradle.properties

cache:
  paths:
    - .gradle/caches
    - .gradle/wrapper

junit:
  image: elct9620/gitlab-android-junit
  script:
    - ./gradlew test

sonar:
  image: elct9620/gitlab-sonar-scanner
  script:
    - "/bin/true"
```

先看一下我目前用的 GitLab CI 設定檔。

基本上分為兩種

* Job
* Config

如果是關鍵字，就會被分類成 Config 像是 `cache` `before_script` 這種，如果寫在 Job 外面就是 Global 的，寫在裡面就只對某個 Job 生效。

> 因為這是 Java 專案，所以我讓所有的 Task 都支援 Gradle 的設定（SonarQube 怎麼上 Cache 還沒找到⋯⋯）

至於該怎麼寫，大致上就是這樣的格式：

```yaml

job:
  config:
    - xxx
    - xxx
```

例如我要用 ruby-2.3 然後跑 rspec 並且快取 `cache` 目錄

```yml
rspec: # 新增 RSpec 任務
  image: ruby:2.3 # 設定 Docker Image 沒有則用預設值
  script:
    - bundle exec rspec # 執行指令
  cache:
    paths:
    - cache # 快取目錄
```

這邊基本上不難，但是要注意幾點

* Working Directory 是在 GitLab 設定的目錄
* Script 跟 Entrypoint 不相容，他是真實一段 Shell Script 注入你的 Script
* Cache 只在 Working Directory 中可以運作

> 關於 Cache 官方的 Issue 上面有人說如果是 `/root` 的形式，可以運作。但是 `/root/gradle` 就不行。

---

其他部分看文件就好了，最基本的使用其實就這樣 XD
然後放到專案的根目錄下就會自動被 GitLab 偵測然後自動運行。

> 關於 Pipline 等等就等之後有機會再跟大家分享拉 XD

### SonarQube

前面已經裝好了，其實不需要再多做設定。
這邊簡單分享一下自製 Docker Image 的心得這樣。

因為只是單純的需要 Docker 環境，所以只要使用官方的 `java:8-jre-alpine` 版本就可以了！

```dockerfile
FROM java:8-jre-alpine
MAINTAINER 蒼時弦也 docker@frost.tw

ENV SONAR_SCANNER_VERSION 2.6.1
ENV SONAR_SCANNER_HOME /opt/sonar-scanner-${SONAR_SCANNER_VERSION}
ENV SONAR_SCANNER_PACKAGE sonar-scanner-${SONAR_SCANNER_VERSION}.zip
ENV HOME ${SONAR_SCANNER_HOME}

WORKDIR /opt

RUN apk update \
  && apk add bash wget ca-certificates unzip \
  && wget https://sonarsource.bintray.com/Distribution/sonar-scanner-cli/${SONAR_SCANNER_PACKAGE} \
  && unzip ${SONAR_SCANNER_PACKAGE} \
  && rm ${SONAR_SCANNER_PACKAGE}

RUN addgroup sonar \
  && adduser -D -s /usr/sbin/nologin -h ${SONAR_SCANNER_HOME} -G sonar sonar \
  && chown -R sonar:sonar ${SONAR_SCANNER_HOME} \
  && mkdir -p /data \
  && chown -R sonar:sonar /data

USER sonar
WORKDIR /data

VOLUME /data

ADD entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
```

基本上就只是把 Sonar Scanner 抓下來，然後放到指定的目錄。
不過真正困難的點就在額外的設定 `entrypoint.sh` 了！

如果是一般使用，直接將 `ENTRYPOINT` 設定成 Sonar Scanner 就可以。
但是會暴露在外部網路的環境，一定需要使用者驗證。

> Sonar Qube 如果開啟 `Force Authentication` 就一定要用帳號密碼或者 Token 才能透過 API 上傳需要分析的程式碼。

所以我弄了一個 Shell Script 當 Entrypoint 來解決這個問題

```shell entrypoint.sh
#!/bin/bash

set -e

VERSION=${CI_BUILD_TAG:-"${CI_BUILD_REF_NAME}"}

OPTS="-Dsonar.projectVersion=${VERSION} -Dsonar.gitlab.project_id=${CI_PROJECT_ID} -Dsonar.gitlab.commit_sha=${CI_BUILD_REF} -Dsonar.gitlab.ref_name=${CI_BUILD_REF_NAME} -Dsonar.issuesReport.console.enable=true"

# TODO: Improve entrypoint to support gitlab-runner
cd ${CI_PROJECT_DIR}
if [[ ! -z $SONAR_TOKEN ]]; then
  ${SONAR_SCANNER_HOME}/bin/sonar-scanner -Dsonar.login=${SONAR_TOKEN} ${OPTS}
else
  ${SONAR_SCANNER_HOME}/bin/sonar-scanner ${OPTS}
fi
```

基本上很簡單，利用 Scanner 的 `-D` 補足缺少的參數，跟自動填入。

```shell
VERSION=${CI_BUILD_TAG:-"${CI_BUILD_REF_NAME}"}
```

因為會需要給版本，但是照我的習慣會忘記是哪個版本，不如就自動用 Tag / Branch Name 來當版本 XD

> 但是似乎會被蓋掉拉，所以有實用性有待商榷（但是這是必填項目）

剩下的 `OPTS` 則是跟 GitLab 整合的部分，目前還沒有成功。

> 正常運作的話會自動到 GitLab 當次 Commit 留言說有 Bad Semll 之類的 XD

最後是 Token 了，因為不可能直接把 Token 寫在 `.gitlab-ci.yml` 當環境變數放進去，所以我是在 GitLab 的專案設定中寫進去。

也許你會想說這樣做：

```yaml .gitlab-ci.yml
sonar:
  script:
    - -Dsonar.logn=${SONAR_TOKEN}
```

但是前面有提到，因為是 GitLab 自己的 Shell Script 所以不太可能這樣做。
所以就只好給個 Shell Script 來自己處理這個問題摟～ XD

> 寫這篇文章時想到我好像可以設定 $PATH 然後直接跑 `sonar-scanner -Dsonar.login` 就好了！？

最後，在專案目錄設定一下 Sonar 的設定檔，扣掉 Token 不適合放到 VCS 之外，其他都可以安心寫在裡面。

```properties  sonar-project.properties 
sonar.host.url=https://sonarqube.xxx.com.tw
# must be unique in a given SonarQube instance
sonar.projectKey=storemap:Android
# this is the name displayed in the SonarQube UI
sonar.projectName=StoreMap Android

# Path is relative to the sonar-project.properties file. Replace "\" by "/" on Windows.
# Since SonarQube 4.2, this property is optional if sonar.modules is set.
# If not set, SonarQube starts looking for source code from the directory containing
# the sonar-project.properties file.
sonar.sources=app/src

# Encoding of the source code. Default is default system encoding
#sonar.sourceEncoding=UTF-8
```

預設的 `sonar.host.url` 是 `https://localhost:9000` 為了要正確上傳，記得加上這行設定到對應的網址上。

### Android SDK & JUnit

網路上 Google 了一下，都沒有滿意的 SDK （誤）所以只好自己包一份 XD

```dockerfile
FROM java:8-jdk
MAINTAINER 蒼時弦也 docker@frost.tw

ENV ANDROID_SDK_VERSION r24.4.1
ENV ANDROID_SDK_SOURCE https://dl.google.com/android/android-sdk_${ANDROID_SDK_VERSION}-linux.tgz

RUN  apt-get update \
  && apt-get install -y ca-certificates lib32stdc++6 lib32z1 lib32z1-dev \
  && mkdir -p /opt

RUN curl -L ${ANDROID_SDK_SOURCE} | tar zxv -C /opt

ENV ANDROID_HOME /opt/android-sdk-linux

ENV PATH $PATH:$ANDROID_HOME/tools
ENV PATH $PATH:$ANDROID_HOME/platform-tools

RUN  echo "y" | android update sdk -u -a --filter tools \
  && echo "y" | android update sdk -u -a --filter platform-tools \
  && echo "y" | android update sdk -u -a --filter extra-android-support \
  && echo "y" | android update sdk -u -a --filter extra-android-m2repository \
  && echo "y" | android update sdk -u -a --filter extra-google-google_play_services \
  && echo "y" | android update sdk -u -a --filter extra-google-m2repository

RUN  echo "y" | android update sdk -u -a --filter android-23 \
  && echo "y" | android update sdk -u -a --filter build-tools-23.0.2 \
  && echo "y" | android update sdk -u -a --filter build-tools-23.0.1 \
  && echo "y" | android update sdk -u -a --filter build-tools-23.0.0

RUN  mkdir ~/.gradle \
	&& echo "org.gradle.daemon=true" >> ~/.gradle/gradle.properties \
	&& echo "org.gradle.jvmargs=-Xmx2048m -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8" >> ~/.gradle/gradle.properties \
	&& echo "org.gradle.parallel=true" >> ~/.gradle/gradle.properties \
	&& echo "org.gradle.configureondemand=true" >> ~/.gradle/gradle.properties
```

原本是想用 `alpine` 的版本，不過在跑的時候會碰到因為缺少 `lib32stdc++` 跟 `lib32z1` 這兩個套件而無法正常運作。
但是 Alpine 似乎沒有 `lib32z1` 只有 `zlib-dev` 可以用，總之因為出問題就只好放棄了 XD

目前用 API v23 開發，沒有要向下相容的需求就只先把 23 版的部分放進去。
至於上面一對 Support 部分裡面還包含了 Android Uint Test 的部分，所以都是得乖乖放進去（也包含了 Firebase 套件⋯⋯）

最後針對 Gradle 做一些額外設定，像是開啟 Parallel 之類的可以讓 Gradle 跑得比較快些。

---

剩下的 Cache 就參考前面我的 GitLab 設定檔摟

```yaml
before_script:
  - export GRADLE_USER_HOME=`pwd`/.gradle
  - mkdir -p $GRADLE_USER_HOME
  - echo "org.gradle.daemon=true" >> $GRADLE_USER_HOME/gradle.properties
  - echo "org.gradle.jvmargs=-Xmx2048m -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8" >> $GRADLE_USER_HOME/gradle.properties
  - echo "org.gradle.parallel=true" >> $GRADLE_USER_HOME/gradle.properties
  - echo "org.gradle.configureondemand=true" >> $GRADLE_USER_HOME/gradle.properties

cache:
  paths:
    - .gradle/caches
    - .gradle/wrapper

junit:
  image: elct9620/gitlab-android-junit
  script:
    - ./gradlew test
```

這邊比較特別的是我將 Gradle 的目錄改到目前 GitLab 運行的目錄。
前面有提到因為 Cache 只對當前目錄（專案目錄）有效果，所以必須這樣設定才能正確的快取到。

不過原本做的設定也會一併消失，所以要在寫入一次設定。

> Image 會叫 `gitlab-android-junit` 是因為我沒想到 Gradle 會裝好 JUnit 的關係，之後應該是會改名拉 XD

---

開始寫文章的時候離準備收假只剩下一個多小時，可能不是很詳細，請大家見諒。
