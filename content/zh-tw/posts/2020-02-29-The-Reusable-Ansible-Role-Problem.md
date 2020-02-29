---
title: "重複利用的 Ansible Role 難題"
date: 2020-02-29T17:59:46+08:00
tags: ["Ansible", "DevOps", "心得", "Rails", "Ruby on Rails"]
toc: true
thumbnail: https://blog.frost.tw/images/2020-02-29-the-reusable-ansible-role-problem/thumbnail.jpg
credit: Photo by Valentin Antonucci from Pexels
---

大概一年前左右，我開始製作一個 [Ansible](https://www.ansible.com/) 的 Playbook 來幫[五倍紅寶石](https://5xruby.tw)的客戶安裝環境。

不過當我們的客戶增加之後，其實開始有點變的很難透過 Fork 的機制來管理不同客戶的 Playbook。

這表示我必須先更新主要的 Playbook 然後再同步到每一個客戶的版本上，也因此我決定去把這些通用的部分拆成單獨的 Role 專案。

<!--more-->

## 概觀 {#overview}

目前的 Playbook 大致上是這樣的：

```
├── [1.0K]  README.md
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

當我們的客戶需要客製化他們的部署環境，我們會去 Fork 這份原始版本然後修改裡面的變數跟樣板。

不過在更新的時候就很容易遇到因為修改差異造成的衝突。

## 目標 {#target}

在 Ansible Galaxy 裡面提供了相依管理的功能，這讓我們可以透過製作 `roles/requirements.yml` 來像像下面這樣管理：

```yml
- src: https://github.com/5xruby/ansible-ruby
  version: 0.1.0
- src: https://github.com/5xruby/ansible-nginx
  version: 0.1.0
```

在我們執行 Playbook 之前，我們可以利用 `ansible-galaxy install -r roles/requirements.yml` 來自動安裝對應的 Role，而且這能夠在 [Ansible AWX](https://github.com/ansible/awx)（或者 Ansible Tower）上面正常運作。

看起來挺不錯的，不過實際上我遇到了一些問題。

## Nginx 模組 {#nginx-modules}

以 [Rails](https://rubyonrails.org/) 專案來說，我們有很多種網頁伺服器的選擇。

如果我們選擇使用 [Puma](https://puma.io/) 的話，其實只需要將 Nginx 安裝並且設定為反向代理伺服器（Reverse Proxy）即可。

但是我們決定使用 [Passenger](https://www.phusionpassenger.com/) 就必須將它編譯成一個 Nginx 模組。

這表示假設我們希望能夠同時支援 Puma 和 Passenger 的話，新製作的 Nginx Role 需要包含關於 Passenger 的任務。

我的第一個版本是利用 [`include_tasks`](https://docs.ansible.com/ansible/latest/modules/include_tasks_module.html) 在 Passenger 被啟用的時候去增加額外的模組到 Nginx 上。

但是假設我們未來要增加更多的 Nginx 模組，我們的 Nginx Role 會越變越大最後就跟現在的 Playbook 狀況一樣。

## 手動管理相依 {#manual-dependencies}

在經過幾次嘗試之後，我找到一個還可以接受的方法來處理這個問題。

1. 產生一個內容為空陣列的 Fact 變數 `nginx_module_options`
2. 遍歷 `nginx_extar_modules` 陣列然後 `import_role` 去執行相關的 Role
3. 再額外模組的原始碼下載後，將額外的編譯參數插入到 `nginx_module_options` 這個 Fact 變數中

因此，在我們的 Playbook 裡面我們會像這樣設定相依：

```yml

- src: https://github.com/5xruby/ansible-nginx
  version: 0.1.0
- src: https://github.com/5xruby/ansible-passenger
  version: 0.1.0
```

並且覆蓋 Nginx 的變數，增加 Nginx 模組的設定作為預設值在 `group_vars/all.yml` 裡面套用到所有的 Web 節點上。

```yml
nginx_extra_modules: ['passenger']
```

不過另外一個問題又緊接著解決了 Nginx 模組的問題出現。

## Role 的相依性 {#the-role-dependencies}

當我準備好 Nginx, Ruby, Node.js 跟其他部署 Rails 必要的 Role 後，我開始設定 Rails Role 的相依設定。

```yml
dependencies:
  - src: https://github.com/5xruby/ansible-nginx
  - src: https://github.com/5xruby/ansible-ruby
  - src: https://github.com/5xruby/ansible-node
  - src: https://github.com/5xruby/ansible-passenger
```

此時我執行我的 Playbook 去運行 Rails Role 的話，會從 Nginx Role 開始執行。

這看起來沒什麼問題，不過我們會需要設定 `nginx.conf` 並且將 `root` 設定到 Rails 專案的 `public` 目錄。

如果 Nginx Role 在 Rails Role 之前執行，我們就會碰到 Nginx 啟動失敗的錯誤。

> 我的第一個版本會透過 Nginx 來產生 `root` 的目錄，並且設定好所有者跟使用者群組，但是這是有問題的。如果 `deploy` 這個使用者是透過 Rails Role 來產生的話，就會發生因為還沒有產生好使用者而無法設定目錄擁有者的情況。

不過在釐清問題之後，這算是一個人為的設計失誤。

「Nginx 真的是 Rails 的相依嗎？」

如果我們使用 Puma 的話，我們可以把 Nginx 替換成任何反向代理伺服器，實際上我們並不需要依賴於 Nginx。

## 最終成果 {#final-produce}

經過大概兩天的時間，最後終於完成了一個幾乎不太需要設定就能夠部署 Rails 伺服器的設計。

```
├── install.yml
├── group_vars
│  └── all.yml
├── inventory
├── playbooks
│  └── install-nginx.yml
│  └── install-postgres.yml
│  └── install-rails.yml
├── roles
│  └── requirements.yml
├── templates
└ ─── nginx.conf.j2
```

基本上是非常簡單的，大多只需要使用 `import_role: nginx` 這樣的語法去增加需要的 Role 即可。

如果我們需要更多的客製化，只需要覆蓋掉原本的變數（像是 `nginx_config_template`）並且將自訂的樣板放到 `templates/nginx.conf.j2` 裡面。

> 在這邊我只放了預設的 Nginx 設定檔在 Nginx Role 裡面，如果要啟用 Passenger 的話需要自己放一個 `nginx.conf` 來設定。

## 結論 {#conclusion}

這算是一個很有趣的經驗來「解耦」一個部署腳本，作為一個工程師我們有很多規則可以去遵照來解耦程式碼。但是當你以一個維運的角度來看，要怎麼去製作一個可以重複利用跟管理的腳本呢？

不過這個還是一個起步，我現在正在思考假設未來要升級的話該怎麼做。

* 如何清理舊版本？
* 如果資料庫要升級，是否需要部署新的伺服器？
* 如果是用於製作 Cloud Image (像是 AMI）又該如何清理多餘的檔案？

DevOps 看起來似乎只要把工程師跟維運人員放在一起就可以做到，不過我認為要讓兩者能夠協作還是不容易的。
