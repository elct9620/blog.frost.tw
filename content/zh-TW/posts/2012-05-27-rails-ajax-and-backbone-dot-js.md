---
layout: post
title: 'Rails - Ajax and Backbone.JS'
date: 2012-05-27 18:54
comments: true
tags: 
---


好像有一段時間沒寫網誌了！

上週在 [Code School](https://codeschool.com) 週末免費最後的二十多小時才發現有免費課程，趕緊選了一個進行後，覺得不錯，於是跟老爸討論後決定購買會員資格。

經過一週的苦戰，總算是將十三個課程都全不上過一次。
（不過只看投影片跟進行練習題，沒有看影片，因為有點花時間，所以只能之後慢慢補完）

既然經過如此密集的訓練，功力想必大增，於是今天就來小試身手嘗試了 Rails 的 Ajax 與 Backbone.JS 的搭配。

<!--more-->

> 下面目錄有錯誤之類的請見諒，因為正在練習靠印象打出來，真的有錯誤請通知一下會修正

### Mission Initialize
---

首先，要先把專案環境配置出來。
<pre><code> cd ~/.pow </code></pre>
我先切換到 MacOS 上超方便的 Pow 後，建立一個新專案。
<pre><code> Rails new ajax-test </code></pre>
接著建立一些基本的Model, Controller, View 等等……
<pre><code>cd ajax-test
rm public/index.html
Rails g controller home
Rails g controller items
Rails g model item name:string description:text
</code></pre>

接著設定好 config/router.rb
``` Ruby config/router.rb

#略
root :to => "home#index"
resources :items, only: [:index]
#略
```

接著對 home, items controller 建立會用到的 method

``` Ruby app/controllers/home_controller.rb
#略
	def index

	end
#略
```

``` Ruby app/controllers/items_controller.rb
#略
	def index

	end
#略
```

到這邊基本上算是完成準備了！

### Mission 01
---

首先，先來對 :remote 的 link 做測試（並沒有特別針對表單，不過原理大致相同）

``` Ruby app/views/home/index.html.erb

<%= link_to("Items List", items_path, remote: true) %>

```

然後給 items#index 加個畫面。

``` Ruby app/views/items/index.html.erb

There is items list.

``` 


這樣一來就會有一個帶有 data-remote="true" 屬性的連結產生。
（這方面還挺方便的，只要多加個 options 就轉職為 Ajax 了！）

接著打開 https://ajax-test.dev/ 點了一下連結，啥都沒發生。
於是打開 Chrome 的開發人員工具（Command + Alt + I）一探究竟。

確實，有 Ajax 請求，但是傳回的是 HTML 頁面，好像不太對。回想了一下 Code School 課程裡面有要增加 *.js.erb 之類的檔案，先去修改一下 Controller 讓他可以傳回 js 格式的檔案。

``` Ruby app/controllers/items_controller.rb
#略
respond_to :html, :js

	def index
		@datas = Item.all
		respond_with(@datas)
	end
#略
```

再次打開點選連結，會發現 Ajax 雖然一樣傳回網頁，但是卻從包含 layout 變成剩下網頁內容了！

接著，補上 js 部分

``` Ruby app/views/items/index.js.erb

$("body").text("You already clicked item list.");

```

這次點選連結後就會直接剩下 You already clicked item list. 這段文字。

看起來不錯，不過如果希望Ajax傳輸是回傳 JSON 格式，要怎麼處理呢？

### Mission 02
---

稍微修改一下 home#index 的 view 讓連結變成傳回 JSON

``` Ruby app/views/home/index.html.erb

<%= link_to("Items List", items_path, remote: true, "data-type" => "json") %>

```

再次點選連結，發現沒有被更改。
從開發人員面板看 Networks 的情況，有 Ajax 查詢發生，看一下回應： [ ] 類型是 JSON 看起來生效了，放點資料進去看看。

<pre><code>Rails c
item = Item.new
item.name = "Sword"
item.description = "A weapon"
item.save
exit
</code></pre>

再次觀看時就發現有出現，不過頁面仍沒有變化。

> 這部分可以用 jQuery 去 bind 一些 UJS 的 Ajax 事件去做應對

### Mission 03
---

接著再來把 Backbone.JS 放進去看看～

<pre><code> cd app/assets/JavaScript/
mkdir lib
mv ~/Downloads/backbone-min.js ./lib
mv ~/Downloads/underscore-min.js ./lib
cd ../../..
</code></pre>

複製好檔案後來改 appication.js

``` JavaScript app/assets/javascript/application.js

#略
//=require jquery
//=require jquery_ujs
//=require lib/underscore-min
//=require lib/backbone-min
#略
```

這樣就不會先把 Backbone.JS 讀進來了～

然後用 CoffeeScript 來寫 Backbone.JS 的 MVC
> 這邊就很簡單的寫一下，沒有規劃，畢竟只是要測試看看會發生什麼事情 XDD

``` coffeescript app/assets/JavaScript/home.js.coffee

$ ->
	ItemModel = Backbeon.Model.extend()
	ItemCollection = Backbone.Collection.extend({
		url: '/items',
		model: ItemModel
	})
	
	ItemView = Backbone.View.extend({
		tagName: 'li',
		template: _.template("<strong><%= name %></strong>, <%= description %>"),
		render: ->
			$(@.el).html(@.template(@.model.toJSON()))
			return @
	})
	
	ItemViewList = Backbone.View.extend({
		tagName: 'ul',
		initialize: ->
			@.collection.on('reset', @.render, @)
		render: ->
			@.collection.forEach(@.addOne, @)
			return @
		addOne: (model)->
			itemView = new ItemView({model: model})
			@.$el.append(itemView.render().el)
	})

	items = new ItemCollection()
	itemList = new ItemViewList({collection: items})

	itemList.render()
	
	$("body").append("Items List")
	$("body").append(itemList.el)
	
	items.fetch()
	

```

今天最長的程式碼（笑）

接著打開網頁，就會發現 Items 被列出來了，看起來即使不另外設定也能夠自動讓 Rails 丟出 JSON 格式的資料。

大致上就是這樣了！不過 View 部分需要另外寫一個 template 其實不怎麼方便，如果用 Mission 01 的方法因為還是 erb 可以讓 Server 去 render :partial => "itemList" 之類的，不過 Backbone.JS 似乎就不怎麼方便。這部分只能看情況取捨摟～

做完 [Code School](https://codeschool.com) 的課程真的有覺得內力大增，至少學到很多優秀的技巧。
