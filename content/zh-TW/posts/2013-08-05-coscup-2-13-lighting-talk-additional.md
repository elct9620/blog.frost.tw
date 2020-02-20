---
layout: post
title: 'COSCUP 2013 - Lighting Talk 補充'
date: 2013-08-05 02:04
comments: true
tags: [JavaScript, COSCUP]
---
其實我以為我很快就沒東西，沒想到還能超過一分鐘。

第一次不知道該講什麼，我真的該分享一下怎麼制作的，是個很簡單卻又非常有趣的作品。

因為 Github 的 API 是允許 Cross-Domain 存取的，也因為這樣，我才能夠順利地從 Github 上把我們 Staff 的個人簡介拉出來，然後透過 Backbone 去呈現。

我一共用到了這些 JavaScript Libary / Tools

* RequireJS (AMD)
	* RequireJS Text Plugin
* Backbone.js (MVP/MVC)
	* Underscore.js (相依)
* jQuery (DOM操作)
* Mustache.js (Template)
* Markdown.js (Praser)
* Modernizr

實作也非常簡單，只需要約六七個檔案就能完成。

<!--more-->

我個人的習慣會先以 H5BP 來建制預設的 Project 原型，再繼續製作後續的處理。

開始 Project 前，也會先將以確定需要的 Library 放到目錄，然後做一次 Initialize 的 Commit 進去。

（我是使用 Fire.app 開發的，在 JavaScript 套件管理上有點不方便，希望有時間可以送 Bower-like function 的 Pull Request 到 Fire.app）

每次使用 RequireJS 前，我會先把設定寫好，然後一個一個測試（在 main 中直接 require 個模組，然後測試是否正常運作）是否正常運行。

``` coffeescript main.coffee
require.config {
  baseUrl: 'JavaScripts'
  paths: {
    jquery: [
      '//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min'
      'vendor/jquery-1.9.1.min'
    ]
    mustache: 'vendor/mustache'
    markdown: 'vendor/markdown'
    backbone: 'vendor/backbone-min'
    underscore: 'vendor/underscore-min'
    text: 'vendor/require-text'
  }
  shim: {
    'jquery': {
      exports: '$'
    }
    markdown: {
      exports: 'markdown'
    }
    underscore: {
      deps: ['jquery']
      exports: '_'
    }
    backbone: {
      deps: ['jquery', 'underscore']
      exports: 'Backbone'
    }
  }
}
```

處理完畢後，我會習關另外開一個檔案，然後從 main 中讀取進來，並且進行一些操作。

``` coffeescript main.coffee
require [
  'backbone', 'App'
], (Backbone, App) ->
  new App
  Backbone.history.start {pushState: true}
```
下面的 Code 我都會補上註解，我不太擅長一句句解釋完成的程式（牆角

``` coffeescript App.coffee
define [ # 定義所有相依的 Library 但是僅在需要時才做出 require 的動作
  'jquery', 'backbone', 'require',
  # Models
  'Model/Information', 'Model/Biography'
  # View
  'View/InformationView', 'View/BiographyView'
], ($, Backbone) ->

  Backbone.Router.extend { # 傳回 Backbone Router 的物件
    initialize: -> # 初始化
      @.el = $("#app") # 這次 Prototyping 並沒有使用到，原本應該放一個 Template 覆蓋後才建構子元件上去

    routes: { # 定義 Router 這邊只需要 index 列出所有成員和 /username 網址格式的建構
      '': 'index',
      ':username': 'userPage'
    }
    index: -> # 首頁尚未實作，這邊會搭配 Staff Issue Tracker 系統列出成員
      # notings
      console.log "Index"

    userPage: (username) ->
    	# 讀取 Model 的 Class
      Information = require('Model/Information')
      Biography = require('Model/Biography')
			
      # 讀取 View 的 Class
      InformationView = require('View/InformationView')
      BiographyView = require('View/BiographyView')

			# 建構 Model （帶入 username 以利查詢使用者）
      info = new Information {username: username}
      bio = new Biography {username: username}
			
      # 建構 View 並且傳入綁定的元素和 Model
      infoView = new InformationView {el: $("#info"), model: info}
      bioView = new BiographyView {el: $("#bio"), model: bio}

			# 從 Github 讀取資料
      info.fetch()
      bio.fetch()

			# 讀取完畢後更新頁面
      info.on 'sync', (model) ->
        infoView.render()
      bio.on 'sync', (model) ->
        bioView.render()
  }
```

事實上，這還能夠做出改進。

先把 on 的 Event 放入 View 裡面使用 listenTo 作處理，會比另外作更加有效率。

想要讀取 Github 的資料非常簡單，只需要用一般的 Ajax 即可。
不過預設傳回 json 以及內容的 base64 編碼資料，不過也可以改以請求 Raw 這部分可以透過加入 headers 的 Hash 完成。

``` coffeescript Model/Information.coffee
define [
  'backbone'
], (Backbone) ->

  Backbone.Model.extend {
    url: -> # 設定 Model 網址格式（因為要帶入使用者名稱，所以改以函示呈現）
      "https://api.Github.com/repos/sitcon-tw/staff-card/contents/#{@.get('username')}/info.json"
    sync: (method, model, options) -> # 改變預設的 sync 方法
      options = options || {}
      options.headers = options.headers || {}
     	# 對 HTTP Request 加入 Accept 要求傳回 Github 的 raw 格式，而非 json
      options.headers['Accept'] = "application/vnd.Github.raw"

			# 傳給 Backbone 預設的 sync 進行處理
      Backbone.sync method, model, options
  }
```
  
前面有提到過，透過 Cross-Domain 的支援可以做到，另一方面是 jQuery 還能夠協助幫你把 text 的 json 轉回，非常貼心。也因為這樣，我們可以順利的把 info.json 這個檔案資訊直接放到 Model 裡面使用。

``` coffeescript Model/Biography.coffee
define [
  'jquery', 'backbone'
], ($, Backbone, Markdown)->

  Backbone.Model.extend {
    url: ->
      "https://api.Github.com/repos/sitcon-tw/staff-card/contents/#{@.get('username')}/biography.md"
    sync: (method, model, options) ->
    	# Backbone 非 JSON 不收，自己實作
      self = @
      $.ajax {
        headers: {
          'Accept': 'application/vnd.Github.raw'
        }
        url: self.url() # 取得 URL (呼叫 Model 定義的)
        success: (data, xhr) ->
          self.parse(data, xhr) # Backbone 收到資料可以交給 parse 方法格式化資料 Ex. 過濾、替換文字
          self.trigger 'sync', self # 手動觸發 sync 事件，通知完成（可以自定，這裡是為了與 Backbone 統一）
      }

    parse: (res, options) ->
      @.set('content', res) # 強制將收到的 raw Markdonw 內容存到 content 的欄位
      {content: res} # parse 需要回傳處理後的資料
  }
```
  
其實這部分還是可以透過像是直接寫 jQuery 處理，或者覆蓋原有 Backbone.sync 方法，不過我最後選擇了這個比較笨，但是能確保原有方法乾淨的做法。

``` coffeescript View/Information.coffee
define [
  'jquery', 'backbone', 'mustache', 'text!JavaScripts/template/info.js.html'
], ($, Backbone, Mustache, infoTemplate) ->

  Backbone.View.extend {
    initialize: (options) ->
      options = options || {}
      @.template = infoTemplate # 設定樣板資料（text! 是 plugin 功能，將檔案內容完整存入）
    render: ->
      rendered = Mustache.to_html @.template, @.model.toJSON() # 用 Mustache 編譯樣板，第二個參數直接讓 Model 傳回 JSON 即可
      $(@.el).html(rendered) # 更新網頁元素（使用 @.$el.html(rendered) 應該也是能運作的）
  }
```

``` coffeescript View/Biography.coffee
define [
  'jquery', 'backbone', 'markdown'
], ($, Backbone, Markdown) ->

  Backbone.View.extend {
    initialize: (options) ->
      options = options || {}
    render: ->
      rendered = Markdown.toHTML @.model.get('content') # 因為目前不需要樣板，直接用 Markdown.js 轉回 HTML
      rendered = "<h1>Biography</h1>" + rendered # 手動加上 Title
      $(@.el).html(rendered) # 更新網頁元素
  }
```

其實整體來說這兩個 View 非常簡單，只要實作 Render 即可。

``` html JavaScripts/template/info.js.html
{% raw %}
<ul>
  <li><h1>{{nickname}}</h1></li>
  {{#website}}
  <li><a href="{{website}}" target="_blank">Website</a></li>
  {{/website}}
  {{#facebook}}
  <li><a href="https://fb.me/{{facebook}}" target="_blank">Facebook</a></li>
  {{/facebook}}
  {{#plurk}}
  <li><a href="https://plurk.com/{{plurk}}" target="_blank">Plurk</a></li>
  {{/plurk}}
</ul>
{% endraw %}
```

樣板部分也非常簡單，把需要的替換上去即可。

最後就是替首頁加上 #app, #info, #bio 三個元素，讓 Backbone 可以捕捉並且替換。

最後附上簡報：[https://slid.es/elct9620/coscup2013-sitcon-webiste](https://slid.es/elct9620/coscup2013-sitcon-webiste)

希望大家會喜歡，之後網站組也會繼續改進這套系統。

當然，網站組也非常喜歡在 Github 分享作品，之後也會陸續追加網站組出品的各種小工具與網站。
