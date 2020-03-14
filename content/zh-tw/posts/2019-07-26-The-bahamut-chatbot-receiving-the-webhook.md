---
title: 巴哈姆特 Chatbot 之亂：用 Ruby on Rails 接收 Webhook
publishDate: 2019-07-26 14:44:28
tags: [Ruby,Ruby on Rails,聊天機器人,Chatbot,巴哈姆特]
thumbnail: https://blog.frost.tw/images/2019-07-26-the-bahamut-chatbot-receiving-the-webhook/thumbnail.png
---

六月底的時候發現巴哈姆特似乎想為他們推出的 Messaging APP （哈哈姆特）舉辦一個聊天機器人的比賽，看到之後想說還算蠻有趣的，所以我就跟朋友很隨意的組成一個團隊來開發。

跟大多數我們熟悉串接 Chatbot 的機制是類似的，我們可以用 Webhook 的方式接收一個來自使用者發送的訊息，然後再透過程式處理後回傳訊息給使用者。

<!--more-->

## 了解 Webhook 機制

在程式設計中，我們常常會使用一種叫做「Hook（鉤子）」或者「Callback（回呼）」的機制，用比較好懂的角度去說明，他是一個在「程式執行中插入額外動作」

舉例來說，我們會有像這樣的程式

* 接收訊息
* 顯示訊息

假設我們要增加一個 Hook 就會變成像這樣

* 接收訊息
* Hooks （可能有多個）
* 顯示訊息

而 Webhook 就是指這個 Hook 利用 Web（網站）的方式執行，所以當這些 Messaging APP 收到訊息後，會利用 Webhook 做一些事情（像是發送給我們自己的伺服器）然後再繼續動作。

## 了解 Signature 機制

不過當我們收到一段訊息的時候，要怎麼知道這段訊息是來是正確的使用者？

這就要靠 Signature 機制來幫助我們，透過一個共用的密鑰（Token）來對訊息內容加密，當我們收到訊息的時候只要用同樣的密鑰對訊息加密，就會獲得一段驗證碼，當我們比對驗證碼跟發送者提供給我們相同時，就可以假設這是可信的訊息。

> 有些網站提供檔案下載時會提供 MD5 校驗碼也是同樣的原理。

以哈哈姆特的 Webhook 為例子，我們會從哈哈姆特收到一個 Webhook 請求，這個請求會包含類似下面的資訊。

* X-BAHA-DATA-SIGNATURE 標頭（Header）
* 內容（Ex. 某段訊息）

巴哈使用的是 SHA1 演算法（MD5 是另外一種），所以我們就要把內容用 SHA1 計算，再比對巴哈給我們的 `X-BAHA-DATA-SIGNATURE` 來驗證是否是來自巴哈，因為加密的密碼理論上只會有我們自己跟巴哈知道。

## 接收請求

如果你還沒有用過 Ruby on Rails 的話，可以參考[龍哥](https://kaochenlong.com/)所寫的[為你自己學 Ruby on Rails](https://railsbook.tw/) 這本書，在網站上看到的部分就足夠你入門。

首先，我們希望有一個網址（Endpoint）可以接收請求，所以要在 `config/routes.rb` 定義一個控制器（Controller）來處理。

```ruby
Rails.application.routes.draw do
 # ...
 
 post :bahamut, to: 'webhook#bahamut'
end
```

透過 Ruby 的 DSL 特性，我們就可以定義出一個叫做 `/bahamut` 的位址，用來接收巴哈姆特的 Webhook。然後在上面定義要使用 Webhook 控制器上面的 `#bahamut` 方法來處理這個位址的動作。

```ruby
# app/controllers/webhook_controller.rb
class WebhookController < ActionController::API
  def bahamut
    # TODO: Implement Chatbot Handler
    render plain: 'Hello World'
  end
end
```

在這邊我們可能需要下一點指令才能測試，或者你可以使用 [Postman](https://www.getpostman.com/) 這套軟體來模擬 POST 請求。

> POST 請求一般是我們送出表單的操作，所以無法直接用打開網頁的方式開啟。

```bash
curl -XPOST http://localhost:3000/bahamut
```

然後我們就能看到我們的終端機（Terminal）出現了 `Hello World` 字樣。

如果我們希望巴哈能發送訊息到我們自己的本機電腦（localhost）就必須讓我們的電腦能在網路上被找到，這可以利用 [Ngrok](https://ngrok.com/) 這套軟體達成，透過 Ngrok 我們可以得到一個暫時性的網址，如此一來就能將本機測試的網站被巴哈呼叫到。

> 我想大家可能有疑問，就是是不是一定要用 Ruby on Rails 才能做到，實際上因為 Ruby on Rails 對初學者來說是最容易搭建出網站的選項，才會選擇使用。不然只要是任何能處理網的程式語言，都是可以直接用來寫 Chatbot 的，只不過像是 Ruby on Rails 這類網站開發框架，能幫我們省下學習這些基礎知識的時間。

## 驗證 Signature

因為處理簽章（Signature）的機制比較複雜，在物件導向類型的語言中，我們會設計一個 Class 來專門處理這件事情。

所以我們來製作一個服務物件（Service Object）叫做 Signature Verifer （簽章驗證器）來專們針對巴哈姆特傳入的簽章做驗證。

```ruby
# app/services/signature_verifer.rb

class SignatureVerifer
  def initialize(request)
    @request = request
    # 讀取內容
    @body = @request.body.read
    # 讀取 Signature Header
    @signature = request.headers['x-baha-data-signature']

    # 把內容退回開頭（避免其他人讀取不到資料）
    @request.body.rewind
  end
end
```

第一個步驟我們要設計驗證器的「初始化（Initialize）」階段要做什麼，我們預期會收到一個 HTTP 請求（`request`）然後將裡面的簽章（`x-baha-data-signature`）取出來，以及內容（對話訊息）取出來，這是我們在前面提到驗證是否是由巴哈發出的訊息所需要的資訊。

```ruby
# app/services/signature_verifer.rb

class SignatureVerifer
  # ...
  
  private
  
  def verify_signature
    @verify_signature ||=
      "sha1=#{OpenSSL::HMAC.hexdigest('SHA1', ENV['BAHA_SECRET'], @body)}"
  end
end
```

這個步驟是根據巴哈的[文件](https://sites.google.com/gamer.com.tw/hahamut-bot/%E6%8E%A5%E6%94%B6webhook%E4%BA%8B%E4%BB%B6?authuser=0)將剛剛抓到的訊息跟聊天機器人的 Secret（秘鑰）做 SHA1 運算產生出我們自己計算的簽章，如此一來跟巴哈提供的比對，就會知道內容是不是一樣沒有被人偷偷竄改。

> 要特別注意的是 ` ENV['BAHA_SECRET']` 這邊我是使用「環境變數」` 來儲存密鑰，這樣只有安裝伺服器的人會知道，就可以避面將這類敏感資訊放到程式碼之中。
> 在 Rails 5 之後，我們可以用 `rails credentials:edit` 這個指令編輯一個加密的檔案，並把密鑰放到裡面，使用方法可以參考 [Ruby on Rails 文件](https://guides.rubyonrails.org/configuring.html)

```ruby
class SignatureVerifer
  # ...
  
  def valid?
      @signature == verify_signature
  end
  
  private
  
  # ...
end
```

最後再提供一個 `valid?` 方法，用來讓我們查詢是否正確就可以了！

我們修改一下 `WebhookController` 來做一個簡單的檢查。

```ruby
class WebhookController < ActionController::API
  def bahamut
    return unathorized_error unless valid_signature?
    # TODO: Implement Chatbot Handler
    render plain: 'Hello World'
  end
  
  private
  
  def valid_signature?
    SignatureVerifer.new(request).valid?
  end
  
  def unauthorized_error
    render json: { error: 'Unauthorized' }, status: :unauthorized
  end
end
```

假設我們透過 `SignatureVerifer` 驗證失敗的話，就回傳一個 JSON 資訊表示未驗證，並且設定 HTTP 的狀態碼為 401（未授權）的狀態。

> JSON 是一種資料格式，常常用在不同伺服器溝同時當作交歡資料的格式，我們從巴哈收到的訊息也是 JSON 格式。

## 發送回應

既然我們已經可以接收訊息，如果使用者都沒有辦法收到任何回應的話肯定會覺得奇怪，所以下一步就是要能發送訊息給使用者。

哈哈姆特目前支援文字、圖片、貼圖跟事件幾種類型，其中事件是最容易做的，打好基底後也會變得更容易修改成支援其他類型的發送程式。

我們先來看一下從巴哈接收到的訊息會是怎樣的格式（JSON）

```json
{
 "botid":<BOT_ID>,
 "time":1512353744843,
 "messaging":[
   {
     "sender_id":<SENDER_ID>,
     "message":{
       "text":"Hello~"
     }
   }
 ]
}
```

我們需要關注的只有 `messaging` 區塊的部分，裡面描述了「多個訊息」而每個訊息都會有「發送者」和「內容」兩個資訊。在上面這從官方文件複製的訊息範例中，使用者發送的內容是一段「文字（text）」

在 Rails 接收到之後，會自動的做好 JSON 解析的處理，所以我們可以直接像這樣使用。

```ruby
# 照每一個訊息處理
params['messaging'].each do |message|
 # 解析訊息跟回覆
end
```

在開始處理之前，我們需要先能夠發送訊息到哈哈姆特。因為步驟也是比較多的，所以我們需要製作一個 Sender （發送器）物件來處理。

```ruby
require 'net/http'

# app/services/text_sender.rb
class TextSender
  def initialize(recipient, message)
    @receipient = receipient
    @message = message
  end
end
```

首先我們在初始化階段要把「接收者」跟想要發送出去的「訊息」記錄起來。


```ruby
require 'net/http'

# app/services/text_sender.rb
class TextSender
  ENDPOINT = 'https://us-central1-hahamut-8888.cloudfunctions.net/' \
             "messagePush?access_token=#{ENV['BAHA_TOKEN']}"
  # ...
 
  def perform
    # 發送訊息
  end
 
  def uri
    @uri ||= URI(ENDPOINT)
  end
  
  def ssl?
    uri.scheme == 'https'
  end
 
  private
  
  def request
    # 製作一個 HTTP 請求
  end
end
```

接下來我們將巴哈文件上所提供的位置，以及一些發送請求需要的一些資訊製作出來。

> 像是 `URI` 這類轉換是用於 Ruby 處理發送 HTTP 請求所需要的，所以我們都先做好處理方便使用。而 `ENV['BAHA_TOKEN']` 跟前面的 `ENV['BAHA_SECRET']` 用途是一樣的，都是需要避免直接寫在程式內的數值。

```ruby
require 'net/http'

# app/services/text_sender.rb
class TextSender
  # ...
  
  private
  
  def request
    return @request if @request.present?

    # 產生一個 HTTP Post 請求
    @request = Net::HTTP::Post.new(uri)
    # 使用 JSON 格式（指定內容類型）
    @request['Content-Type'] = 'application/json'
    # 把要傳輸的內容轉換成 JSON 格式的資料
    @request.body = body.to_json
    @request
  end
end
```

因為我們要將訊息發給巴哈，巴哈再將訊息發給指定的使用者。

> 如果是 LINE 或者 Facebook Messenger 我們想對同一個人發訊息，在不同的 Chatbot 有不同的編號（ID）這樣就可以保護使用者不會被沒有授權的 Chatbot 騷擾，所以不論是發送還是接收，都需要透過巴哈的伺服器。

```ruby
require 'net/http'

# app/services/text_sender.rb
class TextSender
  # ...
  
  def perform
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = ssl?
    # TODO: 處理回應
    # 發送請求給巴哈
    http.request(request)
  end

  def body
    {
      recipient: {
        id: @recipient
      },
      message: {
        text: @message
      }
    }
  end
  
  private
  
  # ...
end
```

最後我們只需要將請求的內容（文字訊息）定義好，然後讓他可以發送出去，我們就能對使用者發送回應。

> 這邊的 `recipient` 通常會是我們收到的 `sender_id`

我們可以在 Rails Console 裡面像這樣簡單測試是否可以發送訊息


```ruby
TextSender.new('巴哈帳號', 'Hello!')
```

## 自動回應相同訊息

我們將前面的程式整合後，可以改寫 `WebhookController` 讓他可以自動回應跟使用者相同的訊息。

```ruby
class WebhookController < ActionController::API
  def bahamut
    return unathorized_error unless valid_signature?
    
    process_messages
    render json: { message: 'OK' }, status: :ok
  end
  
  private
  
  def process_messages
    params['messaging'].each do |message|
      TextSender.new(
        message['sender_id'],
        "PONG: #{message['message']['text']}"
      )
    end
  end
  # ...
end
```

我們透過將每一條訊息（`messaging`）取出來，然後將接收者設定為發送者（`sender_id`）並把訊息內容前面加上 `PONG:` 用來區別，確保確實是經過我們的 Chatbot 處理後才回應的。

> PING/PONG 跟 Hello World 都有點像是一個習慣，通常我們用來測試一個伺服器是否有正常運作，就會透過發送 PING 然後確認伺服器有回應 PONG 來當判斷，如果想換成任何想要的訊息都是沒問題的。

## 小結

其實這些步驟在大多數情況應該被製作成一個 Gem （Ruby 的套件，可以想像成 Mod 之類的東西）直接使用，不過最近比較忙就沒有時間好好設計並且封裝成 Gem。

不過這篇文章的概念在處理各種類型的 Chatbot 是很好用的，如果有興趣的話也蠻推薦大家詳細了解一下。
