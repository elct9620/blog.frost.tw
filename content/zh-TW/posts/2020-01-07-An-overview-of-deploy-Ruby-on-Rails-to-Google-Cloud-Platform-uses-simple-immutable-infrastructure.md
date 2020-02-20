---
title: 淺談在 Google Cloud Platform 讓 Ruby on Rails 實現簡單的 Immutable Infrastructure 部署
date: 2020-01-07 19:18:46
tags: [Ruby, Ruby on Rails, GCP, DevOps, Ansible, Packer]
thumbnail: https://blog.frost.tw/images/2020-01-07-an-overview-of-deploy-ruby-on-rails-to-google-cloud-platform-simple-immutable-infrastructure/thumbnail.jpg
---

去年雙十一活動的時候有一個算是比較急的專案是要做活動網站，當時評估了一下之後決定來嘗試透過 CI 自動生成 GCE 的自訂映像檔然後搭配 Auto Scale 來做部署。

會選擇這樣的方式主要是因為 Rails 或者大多數開發框架的部署工具預設大多是不適合 Auto Scale 的，像是 Capistrano 大多數是手動填入伺服器位置（之前也有實作過透過 GCP API 自動填入）比較適合雲端服務的作法其實就是是製作成一個映像檔來處理，也因此像是 Docker Image 這類型容器化技術在這方面是相對容易做的。

不過考量到容器化本身也還有一些調整問題才適合使用，再加上雲端服務的選擇是使用 GCP 來提供服務，並不像 AWS ECS 有專門針對容器的服務（可能是我不知道）而是提供 K8S 的方案，對一個短期活動來說在整個專案成員都沒有經驗的前提下學習成本還是偏高的。

因此相對適合的做法是用之前我準備好的 [Ansible](https://www.ansible.com/) 腳本，搭配 [Packer](https://www.packer.io/) 這套工具直接在 GCP 上面生成一個自訂的映像檔然後直接更新 Instance Group 的設定讓他以新版本 Scale 起來，就能做到基本上網站不斷掉的更新（Health Check 和 Scale 規則需要調整好）

我們大概花了約一天多的時間快速搭起來，這次的開發時間約兩週中間是透過放額外的人力去支援搭建這個部署流程。

<!--more-->

## 準備工作

目前在[五倍紅寶石](https://5xruby.tw)使用的 Ansible 腳本還沒有公開的版本，不過因為還在內部優化跟改善因此這邊就簡單介紹一下目前我們使用的方式。

> 後來有使用過 Ansible AWX ([Tower](https://www.ansible.com/products/tower)) 來嘗試部署，其實現階段的設計是不太好的。

```bash
├── [1.0K]  README.md
├── [1.6K]  deploy
├── [ 420]  deploy.pub
├── [  96]  group_vars
│   └── [1.2K]  all.yml
├── [  96]  inventories
│   └── [ 309]  local
├── [ 480]  roles
│   ├── [  96]  5xruby_user
│   ├── [  96]  application
│   ├── [  96]  compile_env
│   ├── [  96]  deploy_user
│   ├── [  96]  init
│   ├── [ 128]  logrotate
│   ├── [ 160]  nginx_with_passenger
│   ├── [  96]  node
│   ├── [ 160]  postgresql_server
│   ├── [  96]  ruby
│   ├── [  96]  ssh
│   ├── [  96]  sudo
│   └── [ 128]  yum_install_commons
└── [ 467]  setup.yml
```

上面是我設計的公版架構，如果是採用 Ansible 部署的專案會 Fork 這份出去近一步修改為適合專案需求的設定。

> 實際上應該設計成類似 Ansible Galaxy 上面以 Role 為單位的腳本，不同專案是以組合 Role 配套出所需的功能來設計是比較恰當的。

以這次的專案來說 GCP 上面已經有提供 CloudSQL 服務，因此我們會將 PostgreSQL Server 替換為 CloudSQL Agent 來提供整個專案的需求。

剩下的部分大多數是調整 `group_vars/` 目錄下的設定來對應不同專案的需要。

## Rails 的調整

因為是 Immutable（不可變）的部署設計，所以會遇到一個問題就是靜態檔案需要做 Assets Precompile 處理。這一直都是在 Rails 上面部署的一個坑，因為我們大多數還是使用 Capistrano 幫客戶部署所以其實不太會踩到坑，另外就是如果是採用 CDN 的方式也會因為透過本機預先處理也不會遇到問題。

但是在我們的方案中，建置映像檔的過程中是不需要連上資料庫就能處理。不過事實上 Ruby on Rails 在做 Assets Precompile 是會要連上資料庫的（同時 `config/initializers` 的設定也會被吃進去）也就表示如果我們在設計 Ruby on Rails 專案的時候沒有仔細考慮像是 Redis 或者其他第三方服務的連接處理，就會讓 CI 甚至現在要處理的 CD 遇到很大的瓶頸。

因為時間有限，所以跟同事討論後我們決定用一個稍微偷吃步的做法，利用 [nulldb](https://github.com/nulldb/nulldb) 這個套件製作出一個假的資料庫讓 Rails 以為有連上。

## Packer 的設定

前面我們在 Ansible 的腳本中其實會事先處理好幾件事情：

1. 安裝五倍的 Deploy Key
2. 安裝五倍的 SSH CA（透過 [Vault](https://www.vaultproject.io/) 這套服務）
3. 所有 Ruby on Rails 所需的環境
4. 額外的 Assets Precompile 處理
5. 所有正式環境需要的變數（大多會透過 Ansible 的 Vault 功能加密）

而 Packer 則可以幫助我們在遠端（Ex. GCP / AWS）上面執行我們的 Ansible 腳本，然後將安裝完的環境製作成自訂的映像檔，然後就能夠被 Instance Group 之類的使用作為開啟新機器的基礎。

> Packer 是一套自動化建置映像檔的工具，功能大致上就是可以在不同的 Provider 上面執行我們所設定的 Provision 腳本，然後再透過 Provider 提供的 API 來產生映像檔。最早的時候我是拿來產生 Vargant 的映像檔，在 DevOps 方面 HashiCrop 旗下的工具可以說是相當完整又搭配的不錯。

```
{
  "variables": {
    "deploy_key_path": "{{pwd}}/keys/deploy",
    "master_key_path": "{{pwd}}/master.key",
    "revision": "UNKNOWN"
  },
  "builders": [
    {
      "type": "googlecompute",
      "project_id": "EVENT-5X-CUSTOMER",
      "source_image_family": "EVENT-IMAGE",
      "ssh_username": "packer",
      "zone": "asia-east1-b",
      "image_name": "EVENT-{{timestamp}}",
      "image_family": "EVENT-IMAGE",
      "image_description": "Build with commit #{{user `revision`}}",
      "account_file": "credentials.json",
      "tags": ["http-server"],
      "preemptible": true,
      "scopes": [
        "https://www.googleapis.com/auth/sqlservice.admin",
        "https://www.googleapis.com/auth/devstorage.full_control"
      ]
    }
  ],
  "provisioners": [
    {
      "type": "ansible",
      "playbook_file": "./playbook/setup.yml",
      "user": "packer",
      "extra_arguments": [
        "--vault-id", "vault-password",
        "--extra-vars", "deploy_key_path={{user `deploy_key_path`}}",
        "--extra-vars", "master_key_path={{user `master_key_path`}}"
      ]
    }
  ]
}
```

使用 Packer 基本上不難，有幾個技巧要記得掌握好就可以了。

1. `variables` 區塊，因為打包的配置跟需求肯定會有差異，還有一些密碼之類的所以先設定成變數就能動態調整
2. `builders` 區塊，這部分照官方的文件設定即可上面的可以當作參考（Web Server 大多試用）
3. `provisioners` 區塊，其實可以跟 Shell Script 那些混用，不過使用 Ansible 算是相對容易設定環境的做法（只需要有檔案）

不過上面看似簡單，其實還有另外一個坑隱藏在裡面。

**Google Cloud 的 Service Account 開不出對的權限**

因為這類頻率不高的操作我猜大家都會透過 Web UI 處理，但是要讓 Packer 有正確的權限做事情需要透過下指令的方式才能找到（也許有加上去了，不過去年十月底的時候是還沒有的）

```bash
gcloud projects add-iam-policy-binding EVENT-5X-CUSTOMER --role roles/iam.serviceAccountActor --member serviceAccount:packer@EVENT-5X-CUSTOMER.iam.gserviceaccount.com
```

如此一來我們的 Packer 就能夠正確的從我們的 CI 伺服器（Ex. GitLab CI）對 GCP 下達指令產生映像檔，這個過程依照機器的規格跟要安裝的東西可能會花上十到十五分鐘不等的時間（至少三分鐘是在等 GCP 開機器）因此整個流程跑（測試、部署）也大概會花上半小時，以速度來說很難說是一個不錯的速度（跟 Capistrano 手動下指令相比）

但是如果這個流程是全自動的，其實還是能接受的，工程師只要負責上傳程式碼跟 Merge 回 Master Branch（Production 用的分支）整個效率還是會比各種操作完畢後再用 Capistrano 部署還來的能夠有效迭代版本，不過真的想要能更加快速的更新和使用容器技術的 Docker 相比確實是慢上不少。

這就如同五倍大多數的客戶都還是使用 Capistrano 部署一樣，我們應該評估客戶的需求跟開發迭代的情況來選擇一個適合的做法，很明顯地使用 Capistrano 雖然不怎麼自動化但是卻非常簡單容易使用。

> 如果大家有仔細看 Packer 設定的話會發現 Source Image 和生成的 Image 群組是相同的，這是因為我們在打包的時候可以沿用裡面原有的環境來生成就可以大大縮短 Ansible 重複編譯的時間。最初的版本是使用 CentOS 生成，之後再重複使用前一次的版本來做修改。

## CI 設定

這次客戶是將原始碼保存在五倍的 GitLab 伺服器上，因此使用的是 GitLab CI 來進行這些處理。

```yaml
# ...
before_script:
  - echo "$DEPLOY_KEY ===PREVENT KEY INVALID===" > keys/deploy # NOTE: Ensure Deploy Key has newline in last line
  - echo $SERVICE_ACCOUNT_JSON > credentials.json
  - echo $VAULT_ID > vault-password
  - echo $MASTER_KEY > master.key

# ...
build:
  stage: build
  script:
    - packer build -var revision=$REVISION main.json
  only:
    - master

deploy:
  stage: deploy
  image: google/cloud-sdk:alpine
  before_script:
    - echo $ROLLING_SERVICE_ACCOUNT > account.json
  script:
    - gcloud auth activate-service-account --key-file account.json
    - gcloud compute instance-groups managed rolling-action replace $INSTANCE_GROUP_NAME
      --max-surge=$MAX_SURGE
      --max-unavailable=$MAX_UNAVAILABLE
      --project=$GCP_PROJECT
      --region=$GCP_REGION
  when: manual
  only:
    - master
```

因為我們需要在執行 Ansible 時同時帶入一些檔案（現在回想起來，可能放到 Vault 加密比較方便一點）所以會先將相關的檔案生成出來。

接下來就是利用 `packer build` 的 `-var` 選項將一些需要填入的設定值放進去（這邊會以 Commit SHA 當作參考，方便我們分辨使用的版本）

最後 `deploy` 選項考量到更新的機制最後是採用手動的方式，不過這邊就是利用 `gcloud` 指令對 Instance Group 做一次重新的 Scale 將所有 Instance 都替換成新版的映像檔。

> 不過 gcloud 的指令能用的選項和 Web UI 上的有差異，而且稍微跟字面上意思有點出入所以試了幾次才成功。

另外，在 Rails 專案的 CI 設定我們可以利用 GitLab 的 Trigger 功能去觸發 Packer 做事情（如果是企業版就有內建上下游功能）

```
deploy:
  stage: deploy
  script:
    - curl -X POST
      -F token=$PACKER_TRIGGER_TOKEN
      -F ref=master
      -F variables[REVISION]=$CI_COMMIT_SHORT_SHA
      https://git.5xruby.tw/api/v4/projects/309/trigger/pipeline
  only:
    - master
```

如此一來在開發團隊確定一項功能可以 Merge 回 master 之後就能夠自動製作出對應版本的映像檔，用於之後部署的時候自動更新。

## 總結

實際上這個方案整體來說是相當不完善的，不過除了從網路上的資料學習參考這些應用方式之外也還需要客戶有適合的情境才能夠這樣使用。不過工作這三年也算是勉強把各種比較常被討論的部屬方式都練過一遍，雖然不知道下一次有時間讓我改進 Ansible 以及這個部署流程的時間跟機會是什麼時候，不過還是不得不感嘆現在整個網站、軟體開發的領域真的是越來越複雜跟專業，有時候必須對每一種領域的技能都有所概念，才能夠幫助客戶解決各種情境上的問題。

這也是我會選擇在剛畢業後就到接案類型公司的原因之一，相比在一間公司只使用一種方式解決問題，能夠根據情況跟需求選擇不同的技術並在不影響客戶的狀況下嘗試跟改進並逐漸完整一個開發體系，算是很難得的經驗。
