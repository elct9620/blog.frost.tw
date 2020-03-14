---
title: 如何透過 Service Account 來取得 Google API 的 OAuth2 Token
publishDate: 2019-12-29 20:43:04
tags: [JWT, OAuth2, Service Account, Ruby, API, Google]
thumbnail: https://blog.frost.tw/images/2019-12-29-how-to-use-service-account-to-exchange-google-oauth2-api-token/thumbnail.jpg
---

前陣子在嘗試一些比較少見的 Google API 時發現，在 Google 提供的 Ruby Gem 裡面並不支援這個 API 的實作，這表示需要自己去想辦法解決如何去呼叫這個 API 的問題。

不過呼叫 API 需要 Access Token 才能夠使用，以往我們都是依靠第三方套件或者 Google 官方提供的 Gem 直接呼叫，似乎很少去直接實作客戶端。另一方面我們對 OAuth2 的認識大多是做 SSO（Single Sign On）而非這種伺服器對伺服器的呼叫。

以 Google 這種規模的公司，如果是直接使用一般 OAuth2 的伺服器對伺服器的作法似乎也不太適合，而 Google 提供的解決方案就是 Service Account 了！

<!--more-->

## JWT

自從前端成為一個專門的專業並且逐漸完善、複雜，這中間出現了一個叫做 JWT（JSON Web Token）的應用，現在很多網站應該也都採用 JWT 來作為 API 的 Token。畢竟使用 JSON 記錄使用者的基本資訊，就能夠透過驗證 JWT 的可靠來確認是否為信任的認證伺服器發出，再根據 JSON 上的資訊就可以免去一次查詢使用者跟權限的操作，對比較複雜或者比較大的系統來說就能節省下不少時間。

在 Google API 的 Servie Account 認證流程就是透過 JWT 來完成的，不過事情並沒有我們想像中那麼簡單生成一個 JWT 就可以直接呼叫。

## Grant Code

回到正題，如果我們去看 Google 的[文件](https://developers.google.com/identity/protocols/OAuth2ServiceAccount)會發現我們前面提到的 JWT 其實是用來產生 Grant Code 的作用，而不是直接用來產生 Access Token 的（文件後面有說有例外，不過一般來說都是需要再跑一次流程）

也就是說，我們在整個流程中是這樣的步驟：

1. 使用 Service Account 生成 JWT (Grant Code)
2. 在伺服端走 OAuth2 流程用 Grant Code 換取 Access Token
3. 透過 Access Token 呼叫 Google API

至於生成的 JWT 中基本上只需要指定 Issuer 和 Scope 並且用正確的 Private Key 做簽章，就能夠順利通過 OAuth2 驗證獲取 Access Token。

## 實作

前面兩段的敘述感覺有點複雜，不過我們直接實際實作一次就非常容易理解，可能還比我們平常使用的 OAuth2 流程容易不少。

```ruby
# frozen_string_literal: true

require 'bundler/inline'

gemfile do
  source 'https://rubygems.org'

  gem 'jwt'
end

require 'json'
require 'openssl'
require 'net/http'
```

這次我們直接使用單個 Ruby 檔案來實作，整個流程非常簡單而且不複雜唯一需要的就是 JWT 的套件。

```ruby
service_account = JSON.parse(File.read('./service_account.json'))
privkey = OpenSSL::PKey::RSA.new(service_account['private_key'])
payload = {
  iss: service_account['client_email'],
  scope: 'https://www.googleapis.com/auth/wallet_object.issuer',
  aud: 'https://oauth2.googleapis.com/token',
  exp: Time.now.to_i + 60,
  iat: Time.now.to_i
}

token = JWT.encode payload, privkey, 'RS256'
```

接下來我們把 Service Account 的內容讀取進來產生 JWT，一般我們會選擇 JSON 格式來抓取。之前可能會有點疑惑就是為什麼還會提供 p12 的檔案格式，從這個步驟我們大概就可以猜出來原因。

在這個 JWT 裡面，我們需要 Service Account 裡面的 Client Email 和 Private Key 兩個資訊，剛好對應的就是我們在 Google API 上面開設的 Service Account 的 Email 以及 p12 這個檔案，安全性上在 Google 的處理中也是用非對稱加密的方式來做，因此我們會拿到一個 Private Key 用來產生這些 Token。

```ruby
uri = URI('https://oauth2.googleapis.com/token')
req = Net::HTTP::Post.new(uri)
req['Content-Type'] = 'application/x-www-form-urlencoded'
req.body = URI.encode_www_form(
  grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
  assertion: token
)

res = Net::HTTP.start(uri.host, uri.port, use_ssl: true) do |http|
  http.request req
end

access_token = JSON.parse(res.body)['access_token']
```

最後就是對 Google 的 OAuth2 API 發出一個請求來換取 Access Token 的請求，接下來我們就能利用這個 Access Token 去存取我們希望存取的資源。

> 雖然沒有測試過，但是在 Service Account 開設時沒有授權的權限，即使 Scope 有指定也是拿不到對應的授權的。

## Firebase

看到這個用法，我另外一個聯想到的就是 Firebase 的 [Custom Token](https://firebase.google.com/docs/auth/admin/create-custom-tokens#create_custom_tokens_using_a_third-party_jwt_library) 機制，我們一樣會先跟 Firebase 請求一個 Service Account 用來生成這個 Token。

產生的 JWT 的設置幾乎跟前面提到的方式差不多，只是內容改為針對 Firebase 做出了一些調整。

## 總結

其實整體來說並不複雜，不過會想寫這篇文章是因為之前雖然看過 Firebase 的使用方式卻沒有多想。這次透過 Google API 串接了解到在 JWT 和 OAuth2 的搭配應用上還能有這樣的變化，算是非常直得學習的一個方式。

相較於我們直接將 JWT 作為 Access Token 的使用方式，這種方式在某種層面上來說提供了我們在一些額外應用場景的新選擇，就我自己目前能想到的就有像是 API 服務、IoT 裝置等等，不過前陣子有稍微查了一下是否有其他專案有這樣的應用方式，資料似乎還不多。

不過至少未來設計服務的時候可以多一種方式來提供 API 串接的選項，畢竟以 Service Account 方式的管理似乎是比原本對每個客戶端都開設 Application 還簡單了一些（或者內部隱含的還是做了 Application 的註冊）
