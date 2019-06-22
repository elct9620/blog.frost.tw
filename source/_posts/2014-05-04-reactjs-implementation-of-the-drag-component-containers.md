---
layout: post
title: '用 React.js 實作拖曳與元件容器'
date: 2014-05-04 05:57
comments: true
tags: [CoffeeScript, Web, 心得, 程式語言]
---
「很久很久以前，有一個叫做 OwaBin (芋冰) 的食物，可以讓設計師用拖拉就做出 Launcher 這真是太神奇了！」

原本想說可以很歡樂的再 HanGee 幫忙設計跟網站，但是畢製的不可逆性質，讓我得把事情先推掉。
（也包括 SITCON 的任務，現在也在培養新人了⋯⋯）

半個月前討論這個計劃時，我非常有興趣，所以馬上做了一個簡易的測試版。
這篇文章會來說明這個功能。

預期完成的功能如下：
<iframe width="100%" height="400" src="//www.youtube.com/embed/Yn1MntrWTmo" frameborder="0" allowfullscreen></iframe>


<!-- more -->

首先，我們要來了解 React.js Mixins 的神奇限制。
Mixin 的概念我認為跟 Ruby 的 module 非常接近，但是 Ruby 中可以 override module 的方法，但是 React.js 卻不行。

以下的範例都用CoffeeScript 解說。

``` coffeescript
DefaultBlock = {
  getDefaultProps: ->
  	{
  		width: 100
    	height: 100
  	}
  render: ->
  	# Do something
}

Block = React.createClass {
  mixins: [DefaultBlock]
  getDefaultProps: ->
  	{
  		width: 100 # 發生錯誤，已經定義了預設屬性
	  }
  render: -> # 發生錯誤，已經定義了 render
  	#Do customize render
}
```

這是關於 Mixin 的神秘限制，也就是說無法進行 override 的動作，實作的時候並不會把 Mixin 的方法、預先定義的預設屬性覆蓋掉。

不過有例外，像是 `componentWillMount` 這類，在原始碼中有特殊定義，而不會發生錯誤（則是合併起來執行）

另一個要注意的點，就是所有的 Event 是無法直接 Bind 在 Component 上的，必須借助 Component 所 `render` 的 DOM 元素（但是 Component 依舊可以監聽事件，透過汽泡事件一樣可以拿到事件。）

下面的程式碼說明了事件的情況。
```coffeescript
OnDragBlock = React.createClass {
	getDefaultProps: ->
  	{
  		onDrag: @handleDrag # 並不會產生反應
  	}
    
  handleDrag: (event)->
  	# Some drag handler
    event.stopPropagation() # 停止汽泡事件
    
   render: ->
   		React.DOM.div {
      	onDrag: @handleDrag # 產生反應
      }
}
```

了解這兩個限制後，就可以開始來製作我們的拖曳元件功能。
（至於未來是否會修正，或者有更好的方法，就不得而知了。當然，如果我想到更好的方法，也會告訴大家。）

### 實作 Container Mixin

首先，我們需要一個可以放置任何元件進入的「容器」並且是可以被「重複產生」的。

```coffeescript mixins/container.coffee
mixins = @mixins = @mixins ? {} # Register global variable mixins
components = @components = @components ? {}

ContainerMixin = {
	getInitialState: ->
  	{
    	style: {} # 用於元件拖曳到上方時產生反饋
    }
  _defaultView: ->
  	@childComponents # 預設將子元件全部顯示
  onDragOver: (event)->
  	event.preventDefault() # 阻止預設事件，讓原件可以被 "Drop"
    event.stopPropagation() # 阻止汽泡事件，避免高亮狀態套用到上層容器
    @setState {
    	style: {
      	"box-shadow": "inset 0 0 0 3px red" # 透過 box-shadow 製作高亮狀態
      }
    }
  onDragLeave: ->
  	@setState {
    	style: {
      	"box-shadow": "none"
      }
    }
  onDrop: ->
		@onDragLeave()
    
    componentToAdd = event.dataTransfer.getData("ComponentType") + "Component" # 取得元件
    @childComponents.push components[componentToAdd](key: Date.now().toString(32)) # 產生元件

    event.stopPropagation(); # 阻止汽泡事件，避免加到上層容器
	componentWillMount: ->
  	@childComponents = [] # 初始化子元件容器
  render: ->
  	@viewRender = @viewRender ? @_defaultView # 產生自定義的 "Render" 讓使用者仍可以改變 Render 方式
    React.DOM.div {
      onDragOver: @onDragOver
      onDragLeave: @onDragLeave
      onDrop: @onDrop
      className: "component-container" # .component-container 定義了容器為 min-width: 100% 與 min-height: 100%
      style: @state.style
    }, @viewRender()
}

mixins.Container = ContainerMixin
```

那麼現在，我們可以用下面的語法產生各種類型的 Container （雖然範例還不完善）

```coffeescript components/basic_container.coffee
components = @components = @components ? {}
mixins = @mixins = @mixins ? {}

BasicContainer = React.createClass {
	mixins: [mixins.Container]
}

components.BasicContainer = BasicContainer
```

### 實作 ToolIcon Mixin

接下來，我們需要一組可以拖曳的 Icon 並且依照 Icon 類型讓容器加入對應的原件。

```coffeescript mixins/tool_icon.coffee
mixins = @mixins = @mixins ? {}

ToolIcon = {
	onDragStart: (event) ->
  	event.dataTransfer.setData "ComponentType", @componentType # 開始拖曳時儲存目前拖曳的元件類型
	componentWillMount: ->
  	@icon = @icon ? "https://placehold.it/50" # ICON 圖檔
    @componentType = @componentType ? "Unknown" # ICON 類型
  render: ->
  	React.DOM.img {
      src: @icon
      draggable: true # 設定為可拖曳
      onDragStart: @onDragStart
    }
}

mixins.ToolIcon = ToolIcon

```

相較于容器簡單很多，現在可以透過以下的語法產生任何工具按鈕元件。

```coffeescript components/tools/image.coffee
components = @components = @components ? {}
mixins = @mixins = @mixins ? {}

ImageToolIcon = React.createClass {
	mixins: [mixins.ToolIcon]
  icon: "icon/image.png"
  componentType: "Image"
}

components.ImageToolIcon = ImageToolIcon
```

### 實作 Image Component

接下來就是針對要放入容器的元件來實作，不過基本上跟一般的 React.js 實作大同小異。

```coffeescript components/image_components.coffee
components = @components = @components ? {}

ImageComponent = React.createClass {
	render: ->
  	React.DOM.img {
    	src: "images/sample.jpg"
    }
}
```

### Make it running!

最後，就是用 `React.renderComponent` 分別 render 容器與工具箱，就完成了！
（因為蒼時很想睡，所以偷懶沒寫這樣～～）

有任何問題歡迎討論，這一切都還有很大的改進空間，希望之後能順利完成 OwaBin 這套工具。
（雖然我可能幾乎沒機會參與了 QAQ）
