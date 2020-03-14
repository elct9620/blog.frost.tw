---
layout: post
title: '我的第一個 Backbone.js - TODO List (無儲存功能)'
publishDate: 2012-01-08 21:49
comments: true
tags: 
---


### <del>湊字數的</del> 前言
---

盧了好久，終於開始實做 Backbone.js 拉！之前聽演講時知道這很威，但是實做成功之後就深刻體會，這東西超威的！！（果然是要湊字數）

因為是做個紀錄，所以我就不浪費時間從啥建立目錄什麼的去做摟～<br />
（如果你很懶，可以從文章最後的 Github 裡面的 Develop Branch 下載我做好的基礎結構）

<!--more-->

### 建立 Model
---

``` JavaScript 

var TODO = Backbone.Model.extend({
	
});

```

好！就這樣結束！！<br />
（太精簡了吧？）

``` JavaScript
var TODO = Backbone.Model.extend({
	defaults: {data : '因為有人忘記輸入，所以我就自動出現了！'}
});

```

這樣總行了吧？其實 Model 在目前情況有點類似規劃資料表格，不過因為我啥都不需要，所以就啥都沒用拉！

### 建立 Collection
---

``` JavaScript
var TODOCollection = Backbone.Collection.extend({
	model : TODO
});
```

完畢！<br />
因為目前也沒有要對 Collection 做什麼事，所以也就先這樣摟！

### 建立 View ( App )

這次會建立兩個 View 原因嘛，其實只是弦也看著官方文件不小心弄成這樣的（羞 (>///<) <br />
不過話說回來，把整個頁面都用一個 View 捕捉起來其實會比較好（弦也腦補理論）因為可以透過 Backbone 捕捉各種使用者操作事件，比起用 jQuery 一個一個抓，還不如用 Backbone 件一個 events 來列出全部事件還方便～

``` JavaScript
var AppView = Backbone.View.extend({
	el : $('#app'), //搭配的是 jQuery 所以用 jQuery 選擇器選取
	events : {
		'click #add-todo' : 'add', //就這樣 click 事件，對 id="add-todo" 這個元素發生反應
	},
	add : function(e){
		var input = $('input[name=todo]');
		TODOList.add(new TODO({data : input.val()})); //後面做解釋
		var input.val('');
	}
});
```

好！這樣所謂的 App View 就完成拉！<br />
首先是設定 el 來指定對應的 元素 （這邊選取的是 #app）<br />
接著設定 events 列出全部要偵測的事件<br />
最後把事件發生對應的函式設定進去（這邊加入 add 事件對應函式）

> TODOList 最後會提到，這是 TODOCollection 的實做。

### 建立 View (TODOView)

``` JavaScript

var TODOView = Backbone.View.extend({
	tagName : 'div',
	className : 'alert-message block-message info', //Bootstarp 的 Class Name 直接套用 Bootstrap 的 UI
	render : function(){
		$(this.el).html('<a href="#" class="remove">×</a><p>' + this.model.get('data') + '</p>');
		return this;
	}
	events : {
		'click remove' : 'remove',
	},
	initialize : function(){
		this.model.bind('destroy', this.destroy, this);
	},
	remove : function(){
		this.model.destroy();
	},
	destroy : function(){
		$(this.el).remove();
	}
});

```

因為這次不是作為一個 View 使用，而是要被多次使用，所以沒有設定 el 去指定特定的元素。<br />
而是另外設定了 tagName 來決定被產生實例時該用什麼 tagName 來呈現（className 用法類似，可以多個）

在這之中 this.model 是產生 View 時一起傳入的屬性。<br />
同時在這個 View 初始化時，也一併監聽（Bind） Model 的情況，如果被 Destroy 則呼叫函式（destroy）不過這邊指定函式時不能單純用字串，這樣會找不到，要特別指定 this.destory 表示是這一個 View 物件裡面的 destroy （因為 this.model 是外部傳入的 TODO Model 而不是 View 內部的屬性）

### 建立必須物件

``` JavaScript

var App = new ViewApp;
var TODOList = new TODOCollection;
TODOList.bind('add', function(Model){
	var view = new TODOView({model : Model});
	$('#todo-list').append(view.render().el);
});

```

最後就是把全域的 ViewApp 產生實例，還有前面提到的 TODOList 也一起產生出來。<br />
然後再給 TODOList 新增監聽事件，檢查是否有新的 Model 被加進去，如果有的話，則產生新的 TODOView 加到 #todo-list 裡面，讓他顯示。

### 總結
---

好吧！其實這篇文章根本沒寫到什麼重點阿！！

Github 網址 ： [https://Github.com/elct9620/Aotoki-Backbone.js](https://github.com/elct9620/Aotoki-Backbone.js)

其實我放在上面的也沒有跟文章完全一樣，不過實做結果倒是一樣。<br />
不過別像弦也忘記把 JavaScript 都 Load 完喔！至少要有 Underscore.js + jQuery + Backbone.js 才能運作。

下一次要挑戰 PHP 後端 + Backbone.js 的資料庫存取了！<br />
（然後還要更加搞清楚運作模式，這篇文章還沒有說夠詳細，因為有一些我也還不是很確定！）
