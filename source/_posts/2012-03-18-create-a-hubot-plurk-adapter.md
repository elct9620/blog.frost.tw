---
layout: post
title: '製作一個 Hubot 的噗浪 Adapter'
date: 2012-03-18 14:02
comments: true
tags: 
---


###前言
---
我似乎非常喜歡搞前言這套，所以請大家聽我慢慢說完吧！

大約是三、四個月前的事情，網友向我邀文，我就告訴他最近 HuBot 更新後，將 Adapter 分離出來，以 Module 的形式載入，我想之後的更新會很棒吧！

不過，我卻拖到前幾天，我才心血來潮的在一天飆出機器人（原因不明，而且還被很多地方卡到陰）

這就是，故事的開始（好，請不要打我！）

（本文以 Deploy 到 Heroku 為最終目標）

<!-- more --> 


###有雷，要先防護一下！
---

根據我的經驗，我被雷炸死超多次了！
（把 Adapter 什麼的寫出來一天一定夠，但是除雷讓我用了一半以上的時間 Orz）

1. Hubot 除了內建的兩個 Adapter 之外都要以 Node.js 的 Module 方式才能運作（這代表說你一定得放到 node_modules 才會運作）
2. Hubot 的 bin/hubot 裡面寫著 npm install 所以不管你怎麼改原始碼也不能改變第一點的狀況
3. 當你 Deploy 到 Heroku 上的時候，不能用 npm link
4. 在 Heroku 上所有 module 都得用 npm 安裝（package.json內設定）

其實上述都在討論同一件事情： Node.JS 的模組

而且模組不能設定相對路徑之類的來安裝，一定要透過

* NPM 官方的檔案
* Git
* HTTP

上述三種方式才能安裝（說實在的 tgz 也是個雷，雖然說可用 tarball 裝，但是用 tar -zcf 壓縮是裝不了的）

被這些雷到可能是我笨（牆角）


###建立 Adapter
---

只需要兩個檔案

* package.json
* plurk.coffee

有這兩個就足以變成 Node.JS 的模組了～

在開始 Coding 之前，先來設定一下 package.json 弄好相依

<pre><code>
{
  "name": "hubot-plurk",
  "version": "0.1.1",
  "main": "./plurk",
  "dependencies":{
    "hubot": ">=2.0.5",
    "oauth": "",
    "cron":""
  }
}

</code></pre>

因為那個 Heroku 的 Cron Add-on 會把運算花費算到裡面，那就乾脆用 Node.JS 的 cron 模組就好了！而登入噗浪還需要 OAuth 才行，也裝上 OAuth 這樣

> Hubot 在讀取非內建模組時，會自動在前面加上 hubot- 的前置。

###建立 Robot 跟 API
---

基本上程式碼都是參考 Twitter 的 Adapter 來製作，但是實際上竟然只有一樣用 OAuth 這一點而已（昏）

Twitter 有 Streaming 可用而 Plurk 則得用 Comet 方式來達到即時讀取。

```coffeescript plurk.coffee

Robot = require("hubot").robot()
Adapter = require("hubto").adapter()

EventEmitter = require("events").EventEmitter

oauth = require("oauth")
cronJob = require("cron").CronJob

class Plurk exntends Adapter

class PlurkStreaming exnteds EventEmitter


```

先弄個基本架構，至於為什麼要叫 PlurkStreaming 只是因為參考的是 Twitter 而已（被拖走）

接著先給 Plurk 這個 Class 放進去幾個Method。
（基本上只要有 run, send, reply 就夠了，而 run 用來做初始化的部分）

```coffeescript

class Plurk entends Adapter
  send: (plurk_id, strings…) ->
  
  reply: (plurk_id, strings…) ->
  
  run: ->
  

```

看起來有點東西，來弄主要的 API 結合部分。

```coffeescript

class PlurkStreaming extends EventEmitter
  
  consuctor: (options) ->
    
  plurk: (callback) ->
    #觀察河道
  getChannel: ->
    #取得 Comet 網址
  reply: (plurk_id, message) ->
    #回噗
  acceptFriends: ->
    #接受好友
  get: (path, callback) ->
    #GET 請求
  post: (path, body, callback)->
    #POST 請求（其實是裝飾）
  request: (method, path, body, callback)->
    #主要的 OAuth 請求
  comet: (server, callback)->
    #噗浪的 Comet 傳回是 JavaScript Callback 要另外處理後才會變成 JSON


```

然後我們先把注意力集中到 constructor 上，先把建構子弄好。

```coffeescript

  constructor: (options) ->
    super()
    if options.key? and options.secret? and options.token? and options.token_secret?
      @key = options.key
      @secret = options.secret
      @token = options.token
      @token_secret = options.token_secret
      #建立 OAuth 連接
      @consumer = new oauth.OAuth(
        "https://www.plurk.com/OAuth/request_token",
        "https://www.plurk.com/OAuth/access_token",
        @key,
        @secret,
        "1.0",
        "https://www.plurk.com/OAuth/authorize".
        "HMAC-SHA1"
      )
      @domain = "www.plurk.com"
      #初始化取得Comet網址
      do @getChannel
    else
      throw new Error("參數不足，需要 Key, Secret, Token, Token Secret")

```

這樣建構子就差不多了！

接著來弄 request 這個 method (comet 很類似，這個寫好複製貼上一下～)

```coffeescript

  request: (method, path, body, callback) ->
    #記錄一下這次的 Request
    console.log("https://#{@domain}#{path}")
    
    # Callback 這邊先不丟進去，要用另一種方式處理
    request = @consumer.get("https://#{@domain}#{path}", @token, @token_secret, null)
    
    request.on "response", (res) ->
      res.on "data", (chunk) ->
        parseResponse(chunk+'', callback)
      res.on "end", (data) ->
        console.log "End Request: #{path}"
      res.on "error", (data) ->
        console.log "Error: " + data
        
    request.end()
    
    #處理資料
    parseResponse = (data, callback) ->
      if data.length > 0
        #用 Try/Catch 避免處理 JSON 出錯導致整個中斷
        try
          callback null, JSON.parse(data)
        catch err
          console.log("Error Parse JSON:" + data, err)
          #繼續執行
          callback null, data || {}

```

大致上就是這樣，根據程式碼，其實是無視 POST 的。
（如果沒有特殊需求其實也不會用到 POST 方式）

而 Comet 的處理方式類似，不過我們要動用到 EventEmitter 的功能。
（避免一個 Request 還未結束又開始新的 Comet, 造成連續讀取兩次相同訊息的問題）

```coffeescript

  comet: (server, callback) ->
    #在 Callback 裡面會找不到自身，所以設定區域變數
    self = @
  
    #記錄一下這次的 Request
    console.log("[Comet] #{server}")
    
    # Callback 這邊先不丟進去，要用另一種方式處理
    request = @consumer.get("https://#{@domain}#{path}", @token, @token_secret, null)
    
    request.on "response", (res) ->
      res.on "data", (chunk) ->
        parseResponse(chunk+'', callback)
      res.on "end", (data) ->
        console.log "End Request: #{path}"
        #請求結束，發出事件通知可以進行下一次請求
        self.emit "nextPlurk"
      res.on "error", (data) ->
        console.log "Error: " + data
        
    request.end()    
    
    #處理資料
    parseResponse = (data, callback) ->
      if data.length > 0
        #用 try/catch 避免失敗中斷
        try
          #去掉 JavaScript 的 Callback
          data = data.match(/CometChannel.scriptCallback\((.+)\);\s*/)
          jsonData = ""
          
          if data?
            jsonData = JSON.parse(data[1])
          else
            #如果沒有任何 Match 嘗試直接 parse
            jsonData = JSON.parse(data)
        catch err
          console.log("[Comet] Error:", data, err)
          
        #用 Try/Catch 避免處理 JSON 出錯導致整個中斷
        try
          #只傳入 json 的 data 部分
          callback null, jsonData.data
        catch err
          console.log("[Comet]Error Parse JSON:" + data, err)
          #繼續執行
          callback null, data || {}
```

至於為什麼要這樣做呢？因為在測試時竟然因為噗浪 Lag 而沒讀到完整的 Comet 資料，然後就炸掉了！
（這樣至少不會造成運行中斷，睡覺時就不會碰到一個無法用就炸掉）


後面的 get 跟 post 就簡單多了！

```coffeescript

  get: (path, callback) ->
    @request("GET", path, null, callback)
    
  post: (path, body, callback) ->
    @request("POST", path, body, callback)
    
```

接著處理取的 Comet 網址的 getChannel

```coffeescript

  getChannel: ->
    self = @
    
    @get "/APP/Realtime/getUserChannel", (error, data) ->
      if !error
        #檢查是否有 comet server
        if data.comet_server?
          self.channel = data.comet_server
          #如果沒有 Channel Ready 就嘗試連接會失敗
          self.emit('channel_ready')

```

接著處理 plurk 這部份

```coffeescript
  
  plurk: (callback) ->
    #其實官方文件是要設定 offset 的，不過目前沒有想到設定的方法，以及即使沒有設定也能正常運作
    @comet @channel, (error, data) ->
      if data?
        #將一筆筆的資料一一遞送
        for plurk in data
          callback plurk

```

最後處理回噗跟接受好友就完成 API 的連接了！
（當然，其他部分大家可以自行擴充）

```coffeescript

  reply: (plurk_id, message) ->
    #設定回噗的參數
    path = "/APP/Responses/responseAdd?plurk_id=#{plurk_id}&content=" + encodeURIComponent(message) + "&qualifier=says"
    @get path, (error, data)->
      #啥都不做
      
  acceptFriends: ->
    self = @
    #用 Cron Module 的時候到了！
    cronJob "0 0 * * * *", () ->
      self.get "/APP/Alerts/addAllAsFriends", (error, data) ->
        console.log("接受所有好友邀請：", data)
    
```

那麼，先來處理 Plurk Adaper 好處理的部份

```coffeescript

  send: (plruk_id, strings…)->
    #跟 Reply 一樣，直接交給 reply 做
    @reply plurk_id, strings…
    
  reply: (plurk_id, strings…) ->
    strings.forEach (message) =>
      @bot.reply(plruk_id, message)

```

接著把 run 處理好就可以上線運作摟！

```coffeescript

  run: ->
    self = @
    options =
      key: process.env.HUBOT_PLURK_KEY
      secret: process.env.HUBOT_PLURK_SECRET
      token: process.env.HUBOT_PLURK_TOKEN
      token_secret: process.env.HUBOT_PLURK_TOKEN_SECRET
      
    #創建剛剛的 API
    bot = new PlurkStreaming(options) 
    
    #依照 Twitter 的 new Robot.TextMessage 會沒有反應，所以參考 hubot-minecraft 的方式
    r = @robot.constructor
    
    #處理噗浪河道訊息
    @doPlurk = (data)->
      #檢查是否為回噗
      if data.response?
        data.content_raw = data.response.content_raw
        data.user_id = data.response.user_id
      #確定有噗浪ID跟訊息
      if data.plurk_id? and data.content_raw
        self.receive new r.TextMessage(data.plurk_id, data.content_raw)
    
    #取得 Comet Server 完成，開始第一次 Comet 連接
    bot.on "channel_ready", () ->
      bot.plurk self.doPlurk
    
    #上一次 Comet 完成，繼續 Polling
    bot.on "nextPlurk", ()->
      bot.plurk self.doPlurk
    
    #定時接受好友邀請
    do bot.acceptFriends
    
    @bot = bot
```

終於，完成 Adapter！

接下來簡單提醒一下 Deploy 到 Heroku 的注意事項。

1. hubot-plurk 已經被我佔在 npm 上了，如果想丟到 npm 安裝可能不能用這個名字
2. 用 npm pack 就會產生 hubot-plurk-0.x.x.tgz 的檔案，丟到 Dropbox 之類的網站後，在 package.json 相依版本的地方設定這個網址就可以安裝（不用透過 npm ）
3. Procfile 裡面的 web: 建議改成 worker: 因為用 web dyno 會因為沒有人打開頁面而暫停運作（要持續運作得用 worker 但會犧牲掉 Hubot 內建的網頁功能）
4. 在下載下來的 Hubot 用 make package 指令就可以產生 deploy 用的資料夾
5. scripts 資料夾內是互動部分，不需要像 Adapter 如此大費周章處理（新增檔案並且設計好對白，之後就會回噗了～）

我開發用的機器人在此，大家可以去跟他玩玩<br />
[https://plurk.com/elct9620_bot](https://plurk.com/elct9620_bot)
