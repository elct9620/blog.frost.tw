---
title: 部署你的第一個 Ruby on Rails 網站（七）
date: 2018-05-20 22:39:15
tags: [DevOps,Ruby on Rails,教學]
---

現在伺服器還沒辦法下載到 Ruby on Rails 專案的原始碼用來部署，這一篇會介紹該如何把原始碼下載回來，並且在伺服器上將相關的 Ruby Gem 都安裝好。

<!--more-->

## Deploy Key

要讓 Capistrano 自動在伺服器上下載原始碼，我們必須先讓 GitHub 或者 GitLab 這類服務允許這台伺服器下載，所以我們要先對 `deploy` 這個部署用的使用者，產生一組下載原始碼的 SSH Key 也就是所謂的 Deploy Key。

```bash
sudo su - deploy
ssh-keygen -t rsa
```

利用 `ssh-keygen` 指令，我們可以生成一組 Private Key 和一組 Public Key 給 `deploy` 這個使用者使用，跟我們用來 SSH 到伺服器的是一樣的概念，只不過現在是要讓他當作「驗證權限」的證明，讓 GitHub 接受伺服器下載原始碼。

將生成的 `~/.ssh/id_rsa.pub` 內容，複製後貼到 GitHub 專案中 Settings > Deploy Keys 裡面，用來允許這台伺服器下載。

![螢幕快照 2018-05-20 下午10.08.30.png](https://blog.frost.tw/images/getting-started-deploy-your-ruby-on-rails-part-7/figure.png)

> GitHub 只允許同一把 Deploy Key 存在一次，所以如果想要讓多台伺服器共用的話，可以先在一台產生，其他伺服器共用。但是盡量避免使用自己電腦中的，因為 Deploy Key 只能讀取會安全許多。

如此一來，在設定正確的狀況下，我們就可以順利的讓伺服器下載到原始碼。

## 檢查

一般在部署之前，我們都會用 `cap staging deploy:check` 確認基本的操作都是正常的，也就是產生這次部署的版本、下載原始碼跟設定檔已經正確生成。

```
cap deploy:check
```

如果伺服器正確的話，應該是不會有錯誤訊息。不過我們嘗試透過 git 來下載原始碼，伺服器上可能是沒有 git 環境的，所以先透過 yum 安裝套件。

```
yum install git
```

如此一來，`cap staging deploy:check` 就會回報已經可以正確地產生新的資料夾，以及下載原始碼。

## JavaScript Runtime

伺服器環境預設是沒有 JavaScript 的執行環境，不然在我們執行 `cap staging deploy` 的時候，就可以順利的部署完成。

不過，因為 Assets Precompile 的關係，我們至少需要有 Node.js 的環境才行。

我們可以利用 Node.js 官方提供的[設定程式](https://nodejs.org/en/download/package-manager/#enterprise-linux-and-fedora)，讓 CentOS 可以支援較新版本的 Node.js

```
# Node 8 是寫這篇文章的穩定版
curl --silent --location https://rpm.nodesource.com/setup_8.x | sudo bash -
```

當這段設定程式執行完畢後，我們就可以利用 yum 指令更新或者安裝。

```
sudo yum install -y nodejs
```

> 實際上 Node.js 的環境影響並不大，即使是舊版的 Node.js 環境也是可以正常的完成 Assets Precompile

假設有使用 Webpack 的話，對於 Webpacker 這個 Gem 還會需要使用 Yarn 來安裝 Node.js 套件。

```
curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | sudo tee /etc/yum.repos.d/yarn.repo
sudo yum install yarn
```

安裝的方法跟 Node.js 基本上是沒有太大的差異，一樣是透過官方的設定程式將 yum 可以安裝的來源增加，就可以透過 yum 安裝或者升級。

## 部署

現在我們只需要透過 `cap staging deploy` 就可以把 Ruby on Rails 專案傳到伺服器，並且將一切都安裝完畢。

> 如果有出現錯誤，可能就是使用的 Gem 使用了一些 C 語言編寫的套件，需要額外的安裝一些套件才可以解決，這就考驗大家的應變能力了！

## 小結


到這篇文章為止，我們只剩下一個步驟——設定 Nginx 伺服器。雖然我們安裝好了伺服器，但是並沒有設定這個專案要怎麼被 Passenger 啟動。

下一篇是最後一篇，會講解怎麼設定 Nginx 伺服器以及套用 Let's Encrypt 來設定 SSL 加密。
