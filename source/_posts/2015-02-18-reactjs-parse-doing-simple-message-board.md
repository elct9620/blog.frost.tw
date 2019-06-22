---
layout: post
title: 'React.js + Parse 實做簡易留言板'
date: 2015-02-18 13:04
comments: true
tags: [心得, SITCON, 筆記, React.js]
---
前一陣子 SITCON 文創組冬季訓練最後一天，我安排了這個課程給我們的新成員。
雖然 SITCON 文創組看似是個需要「技術」的團隊，不過現實上我們倒是花很多時間在思考跟設計上，沒辦法找到設計相關科系的新成員稍稍遺憾。

不過因為有製作網站的需求，因此安排了這個課程，透過學習 React.js 以及結合 Parse 去熟悉一些基本的前端技巧。

注意事項：

1. 文中的範例全部都以 CoffeeScript 撰寫
2. 本文不會提及 Browserify 的配置與應用（當天有介紹過，練習時是使用我配置好的 gulp task）
3. 這是在不考慮 UI/UX 以及美術的前提下製作的
4. 文中不會解釋太多 React.js / Flux 的基本概念（請上官網 or ReactJS.tw 社團學習）

那麼，就開始吧！

<!-- more -->

### 拆分元件

React.js 的 Component（元件）的概念，某種程度上是需要重新定義大家腦中 HTML / JS / CSS 配合的概念，而這個應用方式在很多時候其實能夠幫我們解決不少問題。
（個人認為很像 [Shadow DOM](https://w3c.Github.io/webcomponents/spec/shadow/) 的感覺）

而 Component 該怎麼拆分呢？簡單來說最小單位就像是一個 `<button>` 都可以視為一個 Component 只是要看需求。

> 我們可以利用 Component 重新去定義一個 HTML 元素的效果 Ex. &lt;a&gt; 的 onClick 事件重新定義，但是又可以重複利用

建構一個留言板我們會需要幾個元件：

* 留言板主體（通常會叫做 `Application` 或者 `App`）
  * 留言顯示區域
      * 單篇留言
  * 留言表單
  
以一個最低限度結構的留言板來說，至少需要這幾種元件才能夠構成。

其實仔細看，會發現基本上也就跟常見的 MVC 框架在拆分 View 的技巧感覺很類似。

> 不過就如同前面所說的，有時候 Component 也用於「重新定義」某個 HTML 的元素效果。
> 像是 `react-bootstrap` 就利用重新定制的 `<Nav>` `<MenuItem>` 等來表現 Navbar（像是實際上都只是反映單個 HTML 元素而已）

### 架構

以 React.js 本身來說，實際上是不足以製作一個完整的 WebApp 的，因此才加入了 Flux 這套理論（我想不適合視為 Library / Framework 而是跟 MVC 類似的理論比較恰當）

原本的 React.js 其實只有定義了 Component 以及來自外部的「屬性」表現內部的「狀態」而已，但是若要跟 API 溝通並且進行讀取與寫入資料該如何表現呢？

這時候透過 Flux 所定義的架構就可以很輕鬆的實踐。

> Flux 架構是一個單向的流程，不管如何一定會從 Actions 開始出發（有時候也會回到 Actions）但是絕不會有返回的狀況

* Actions/
  * 通常是處理 API 的部分，會透過 Dispatcher 對 Store 做出操作
* Constants/
  * 定義 Action 類型的輔助套件（可以不實作，但是缺點會是很容易因為輸入錯誤的字串而無法正常運作）
* Components/
  * React.js 所定義的元件，會監聽 Store 的變動更新自身
* Store/
  * 主要儲存資料的地方，透過從 Dispatcher 收到的變更進行處理
* Dispatcher
  * 負責指派工作（其中包含了 waitFor() 可以等待一連串的動作完成）
  
在開發 React.js/Flux 的 WebApp 時，只要注意自己的控制流程是否依循著 Action -> Dispatcher -> Store -> View (Component) 就可以知道自己是否在做正確的設計。

### 建構元件

我個人的習慣是以 React.js 的元件開始做起，因為可以直接看到最終的成果（即使還沒有跟 API 連接上，但也能看到不少基本效果）

#### 主體（Application）

因為是留言板，所以這邊我用了 `GuestBook.cjsx` 而非 `Application.cjsx` 作為檔名。

> 大家可能會預設情況是「只能有一個 Application 存在頁面」但對於 React.js 來說只是把不同的 Virtual DOM 更新到實際的 DOM 上面，因此是可以在一個頁面做多次 `render` 動作混合 React.js 跟傳統網頁的

```coffee components/GuestBook.cjsx
###
# GuestBook
#
# @cjsx React.DOM
###

React = require 'react'

Comments = require './Comments.cjsx' # 這之後會實作
CommentForm = require './CommentForm.cjsx' # 同上

module.exports = React.createClass {
  render: ->
    (
      <div>
        <CommentForm />
        <Comments />
      </div>
    )
}
```

大多數時候主體框架只是用於把各種子元件讀取進來而已，因此看起來非常的簡單。

> 要注意的是，因為 React.js 把一個原件視為一個 DOM 物件，因此回傳時務必不能同時傳回兩個元件（這邊就用 `div` 包起來）

#### 留言表單（CommentForm）

表單的實作上比較簡單，留言部份還包含了另一個子元件「單篇留言」因此就到下一階段再進行處理。

```coffee components/CommentForm.cjsx
###
# Comment Form
#
# @cjsx React.DOM
###

React = require 'react'

CommentAction = require '../actions/CommentAction.coffee' # 後面會實作 Comment Action

module.exports = React.createClass {
  getInitialState: ->
  	# React.js 的 State 都需要「事先定義」才能夠使用
    {
      content: ""
    }

  _onSubmit: (e) -> # 處理 Submit 的方法（收到的 e 就跟原生 JavaScript 拿到的 Event 是相同的）
    CommentAction.create(@state.content) # 呼叫 Action 執行某個任務（新增留言）
    @setState { content: "" }

    e.preventDefault() # 取消原有的表單送出動作

  _onChange: (e) ->
    # 這算是一種小技巧，我們會發現在 _onSubmit 方法要取得 textarea 的內容是很困難的
    # 因此就隨時將表單內容存到狀態中（再次時做表單處理）用於送出時使用
    # 不過要注意的是後面的 textarea 設定了 value={@state.content} 可以確保使用者輸入的跟送出的結果是相同的
    @setState { content: e.target.value }

  render: ->
    (
      <div>
        <form onSubmit={@_onSubmit}>
          <textarea onChange={@_onChange} placeholder="Messages..." value={@state.content}></textarea>
          <button type="submit">Submit</button>
        </form>
      </div>
    )
}
```

實際上，在 React.js 中的元件設計都是很簡單的，從目前的兩個例子就可以觀察到。

#### 留言區（Comments）

前面的段落看到了 State （內部狀態）的使用，這邊則會看到 Props （外部傳入）的應用，以及動態產生元件時的運用。

```coffee components/Comments.cjsx
###
# Comments
#
# @cjsx React.DOM
###

React = require 'react'

CommentStore = require '../stores/CommentStore.coffee' # 後面也會實作 Store 的部分
CommentAction = require '../actions/CommentAction.coffee'

CommentItem = require './CommentItem.cjsx'

module.exports = React.createClass {
  getInitialState: ->
    {
      comments: CommentStore.getAll() # 初始化的時候從 Store 拿出目前儲存的資料
    }

  _onChange: ->
    @setState { comments: CommentStore.getAll() } # 更新目前儲存的資料

  componentDidMount: ->
    CommentAction.load() # 在元件被加入到頁面上時呼叫「讀取」動作進行 API 查詢
    CommentStore.addChangeListener @_onChange # 向 Store 登記「變更」事件以了解資料更新

  componentWillUnmount: ->
    CommentStore.removeChangeListner @_onChange # 當元件即將被移除時也解除事件監聽

  generateCommentsItem: ->
    # React.js 動態產生元件可以透過陣列的方式呈現，而每個元素則要給予一個 key 屬性
    # 這邊將狀態中儲存的留言資訊依序取出，然後放入對應的屬性
    # 這邊的 data.get() 用法是 Parse API 存取屬性的方式（一般情況使用 data.content 就可以了）
    @state.comments.map (data) -> 
      <CommentItem key={data.id} content={data.get('content')} createTime={data.get('time').toString()} />

  render: ->
    (
      <div>
        {@generateCommentsItem()}
      </div>
    )
}

```

#### 留言內容（CommentItem）

這部分就沒有什麼好討論的，單純就是呈現上的應用（資料來自於屬性）

```coffee components/CommentItem.cjsx
###
# Comment Item
#
# @cjsx React.DOM
###

React = require 'react'

module.exports = React.createClass {
  render: ->
    (
      <div>
        <p>{@props.content}</p>
        <footer>
          <span>{@props.createTime}</span>
        </footer>
      </div>
    )
}

```

> 這邊可以這樣想像「State」是一個私有屬性，只有元件自己可以操作。而「Props」則是 State 的變化體，只接受外部傳入的數值（父元件才有編輯的權限）這樣就比較能區分出使用上的時機

### Dispatcher

這邊會先解釋 Dispatcher 是因為後面的 Action 與 Store 都會需要使用到，因此必須先完成才能夠繼續進行。

> 其實在實作元件之前先製作 Dispatcher 也沒有關係

```coffee Dispatcher.cjsx

###
# Dispatcher
###

Dispatcher = require('flux').Dispatcher

# 簡單說就是做物件的繼承，在 Facebook 的範例會看到使用 Object.assign 去輔助
# 不過 Dispatcher 也可以利用 CoffeeScript 提供的 extends 來做擴充
# 後面的 Store 會因為要從 EventEmitter 的 prototype 繼承而無法做這件事情
# 關於 Object.assign 的用途，可以參考 ES6 相關文章的介紹

class AppDispatcher extends Dispatcher
  handleViewAction: (action) -> # 擴充一個 handleViewAction 用來處理跟 View 相關的動作（大多數時候也只會有這一個）
    @dispatch { # 觸發某些動作
      source: 'VIEW_ACTION' # 看到用全部大寫的物件，請合理猜測是使用 Constant 的時機（這邊文章都會用一般字串帶過）
      action: action # 將收到的動作物件一併傳給 Store
    }

module.exports = new AppDispatcher

```

### Store

接下來我們要實作一個 Store 來儲存資料，至於該怎麼實作基本上是沒有限制的 Ex. Hash, Array 都可以

這裏會是這篇文章程式碼最多的一個部分，不過並不是什麼複雜的程式，大多數都是在描述「處理」事件上。

```coffee stores/CommentStore.coffee

###
# CommentStore
###

# 利用 browserify 的功能，讓我們可以將 EventEmitter 在瀏覽器上實作（這個非常好用）
EventEmitter = require('events').EventEmitter 
# 如果是使用 ES6 就不需要這個輔助套件
assign = require 'react/lib/Object.assign' 

AppDispatcher = require '../Dispatcher.coffee'

_comments = [] # 這邊用一個 Array 實作陣列的儲存（大多數時候從 API 撈出來也都是陣列，排序上可以依靠 API 而不需要自己處理，反而是專注在容易呈現會更好）

dispather = (payload) -> # 向 Dispatcher 登記需要一個處理程序，這部分就是在定義當 Dispatcher 被觸發時應該做什麼動作
	# 取出 Action 物件
  # Action 物件包含什麼都是看開發者高興的，只是我們通常會給一個 actionType 屬性
  action = payload.action 

  switch action.actionType # 透過 actionType 屬性判斷該做什麼動作
    when 'COMMENT_CREATE' # 這邊就是該用 Constant 的時候（這個範例會略過這個步驟）
      _comments.unshift action.comment # 在留言資料的最前面插入一筆（預設是逆序排序）
      CommentStore.emitChange() # 讓 Store 觸發 Change 事件通知 View 重新讀取

    when 'COMMENT_LOAD'
      _comments = action.comments # 跟上面的 CREATE 不同，這次 action 包的是 comments （所有留言）
      CommentStore.emitChange() # 一樣要觸發 Change 事件讓 View 重新讀取
      
  return true # 這是非常重要的一行，如果沒有傳回 true 的話 Dispatcher 會判定任務失敗（Ex. 使用 waitFor 時造成中斷）

# 這邊是將 EventEmitter.prototype 複製到一個空物件（並且作為我們後來的 Store）另一部分複製的就是我們目前正準備定義的方法
CommentStore = assign {}, EventEmitter.prototype, {
  getAll: ->
    _comments

  emitChange: ->
    @emit 'CHANGE'

  addChangeListener: (callback) ->
    @on 'CHANGE', callback

  removeChangeListener: (callback) ->
    @removeListener 'CHANGE', callback

  dispatherIndex: AppDispatcher.register( dispather ) # 向 Dispatcher 登記（會拿到一個 ID 之後可以用於 watiFor 的應用）
}

module.exports = CommentStore

```

表面上看起來似乎會覺得很複雜，不過稍微釐清思路之後其實也就是當 Dispatcher 送出一個 Callback 後做某些事情，再利用 Event 機制呼叫 View 上面的 Callback 而已。

> 有沒有發現其實就是從 Action 開始呼叫 Dispatcher 然後再呼叫 Store 接著呼叫 View 呢？（而某些情況則會從 View 呼叫 Action 然後循環下去⋯⋯）

### Action

其實我一直在思考「Ajax 的非同步 Callback 該在哪處理呢？」這個問題，最後得出的得答案是在 Action 裡面。
當收到 Response 之後，再決定對 Dispatcher 送些什麼 View Action 讓 Store 處理，最後反應在 View 上面。

```coffee actions/CommentAction.coffee
###
# Comment Action
###

AppDispatcher = require '../Dispatcher.coffee'

Comment = Parse.Object.extend("Comment")

module.exports = {
  load: ->
    query = new Parse.Query(Comment)

    query.descending('time').find({ # 排序上利用 Parse API 處理，而不是在 Store 中人工解決
      success: (results)->
        AppDispatcher.handleViewAction { # 讓 Dispatcher 送出一個任務
          actionType: 'COMMENT_LOAD'
          comments: results
        }
    })

  create: (content) ->
    comment = new Comment
    comment.save {
      content: content,
      time: new Date()
    }
    .then (object) ->
      AppDispatcher.handleViewAction {
        actionType: 'COMMENT_CREATE'
        comment: object
      }
}

```

基本上就是 Parse API 的操作，官方文件都寫得很清楚，我就不多做討論了！

### Render

最後就是呈現在網頁上，其實不難。

```coffee app.cjsx
###
# Application
#
# @cjsx React.DOM
###

React = require 'react'

Guestbook = require './components/GuestBook.cjsx'

Parse.initialize("Application ID", "JavaScript Key");

window.onload = ->
  React.render <Guestbook />, document.body
```

`React.render` 接收兩個參數，第一個是要 render 的元件，第二個是要放置的 DOM 元素。

簡單說，其實也可以這樣使用：

```coffee
React.render <Header />, document.getElementById("header")
React.render <Main />, document.getElementById("main")
React.render <Footer />, document.getElementById("footer")
```

至於該如何運用，就取決於實際上的情況。

> 我認為上面這種運用可以在網站從傳統的 Server-Client 轉變為 WebApp + API 架構的過渡期去應用
> 不用完整寫完 WebApp 就能開始套用，聽起來其實蠻不錯的。

### 小結

這是冬季訓練大約花三小時講解的內容，做法是 Step by Step 並且在每個步驟講解。
如果是熟練的開發者，我想大概一個小時內就能夠做完或者更多的任務，至少就我的經驗來說，還沒有一個 WebApp Framework 可以讓我如此有彈性的開發（Ex. 可以用 `@getDOMNode()` 獲取原生的 DOM 做操作，在做整合 Library 時就很好用）

不過這幾年技術每天都在變化，像是當我熟悉 Flux 之後沒多久，又多了一個叫做 [Riot.js](https://muut.com/riotjs/) 的套件，說比 React.js 更輕量化（不過實際看過文件覺得沒有 React.js 這麼討喜）

雖然 React.js 在某些應用上非常的方便，不過我還是建議多學幾種應對不同的情況（不要都學到同一種情境的就好 XD）
