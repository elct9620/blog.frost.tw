---
layout: post
title: 'React - Facebook 的 UI 元件 Library'
date: 2013-08-29 04:39
comments: true
tags: [JavaScript, CoffeeScript, UI, 前端, 界面]
---
昨天在 TEDxTaipei 實習的時候說要修正之前 Timer (計時器) 的錯誤，我馬上就想到可以用 Facebook 的 [React] 來改寫。

之前就非常想玩看看，這次完了之後發現確實不錯，可以來推一下 XDD

註：暑假剛好有機會在 TEDxTaipei 實習，主要處理 WordPress 後端一些 PHP Code 和一些與前端搭配的技術，而計時器在 TEDxTaipei 會自行製作是因為有多了幾個特殊的按鈕的關係。

<!--more-->

[React] 是個怎樣的東西，可以在官網的簡介「A JAVASCRIPT LIBRARY FOR BUILDING USER INTERFACES」就很明確地瞭解，是用來做一些 UI 的元件。

說實在的，概念其實很簡單。

* 以類似 DOM 物件的方式描述
* 每個元件都是狀態機
* 能以 XML Like 的方式描述（JSX 功能）
* 樹狀的

在使用 [React] 上的概念非常的簡單：

1. 建立元件（ React.createClass ）
2. 定義行為 ( render / componentWillMount ...)
3. 組合元件 ( A 元件下的 render 傳回的是一組 B 元件 )
4. 渲染元件 ( React.renderComponent( parentComponent, target ) )

我們透過建立一個「元件」來描述外觀 Ex. 內容放在一個 div 之中，然後有著叫做 label 的 className ( 因為是以 JS 撰寫，所以這些屬性都是用 JS 的方式來設定 )
接著渲染 ( render ) 這個元件，在某一個 DOM 的物件上 Ex. document.body

下面是以 CoffeeScript 所撰寫的 Hello World 版本，因為使用 CoffeeScript 因此和 JSX 不相容。
不過仍能運作的關係是因為 JSX 算是輔助，只要在撰寫時使用「編譯後」的方式呈現即可（ [JSX Live Compiler](https://facebook.Github.io/react/jsx-compiler.html) 有興趣可以嘗試看看 ）

``` coffeescript
HelloWorld = React.createClass {
    render: -> 
        (
            React.DOM.div {}, [
                "Hello ",
                React.DOM.div {className: 'label label-info'}, @props.name
            ]
        )
}

React.renderComponent (HelloWorld {name: "World"}), document.body
```

Live Demo: https://jsfiddle.net/elct9620/TPHpS/

---

事實上，一開始我以為 [React] 有著複雜或者非常詳盡的概念（因為我覺得他和 AngularJS 建立界面有點類似的感覺）

不過事實上其實非常精簡而且簡潔的，這邊先來討論他 DOM Like 的部分。

![螢幕快照 2013-08-29 下午1.24.33.png](https://user-image.logdown.io/user/52/blog/52/post/95203/D8POboZ3RxSmSrhSJzwX_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202013-08-29%20%E4%B8%8B%E5%8D%881.24.33.png)

從上圖來看，我們使用 [React] 裡面的 DOM 物件產生的 div 物件，或者是自行利用 createClass 產生的 DOM Like 物件（用這種方式稱呼似乎比較好理解），都是同一個類型物件下的產物，差別只在於原本的 DOM 物件沒有 state (狀態) 的屬性，這也是為什麼在 JSX 下會使用 &lt;Hello name="World" /&gt; 的方式撰寫的原因。

因為 React 先把全部的 DOM 和你用 [React] 產生的 DOM Like 物件都先抽象化，就個人感覺來說，他讓我不需要寫非常多 inline HTML code 在 JS 裡面，而是純粹的 JS 讓程式碼變得乾淨許多。

假設希望取得原本的 DOM 物件呢？只要對產生出來的物件使用 `getDOMNode()` 方法即可（通常用於 addEventListener 等綁定事件上）

註：昨天測試似乎無法直接加上 onClick 綁定事件，也許待會會成功

---

接下來就是 State (狀態) 的問題。

``` coffeescript
{button} = React.DOM

Button = React.createClass {
    getInitialState: ->
        {btnClass: 'btn-default'}
        
    handleClick: (event)->
        newClass = if @state.btnClass is 'btn-success' then 'btn-default' else 'btn-success'
        @setState {btnClass: newClass}
        
    render: ->
        @label = if @state.btnClass is 'btn-success' then 'Success!' else 'Start'
        (
            button {className: "btn #{@state.btnClass}", onClick: @handleClick}, @label 
        )
}

React.renderComponent (Button {}), document.body
```

Live Demo: https://jsfiddle.net/elct9620/cecjs/

這個範例我建立了一個叫做 Button 的物件，他會渲染出一個 HTML 的 button 元素，而上面套用的 class 樣式以及 Label 則會受到名為 btnClass 狀態的影響而產生改變。

如果仔細看的話，會注意到裡面完全沒有對 UI 作出重新渲染（ 呼叫 render() ）的動作，但是界面卻自動的產生改變。
因此我們不需要關心「渲染」的問題，只要專注在於一個 UI 的設計。

註：不知道為什麼 onClick 可以用了（感動）他似乎會自動做好 addEventListener 和 removerEventListener 超貼心，我推測 onXXX 的都是這樣使用，官網也有用到 onChange 的屬性。

---

至於屬性部分，操作起來和 State 基本上是一樣的。
（也可以透過 setProps 方法改變物件屬性，進而觸發重新 render 主要就看設計。）

---

再來是關於表單地強化功能。

假設我現在需要取得元件內某個欄位的數值該怎麼辦呢？

這時候可以借助對表單元素設置 ref 元素來輔助。

``` coffeescript
{input, div, span} = React.DOM

Nickname = React.createClass {
    getInitialState: ->
        {nickname: @props.nickname}
    handleChange: (event)->
        @setState {nickname: @refs.nickname.getDOMNode().value.trim()}
    render: ->
        (
            div {}, [
                input {ref: 'nickname', className: 'form-control', onChange: @handleChange},
                div {}, [
                    span {className: 'label label-success'}, 'Nickname'
                ],
                " : "
                ,
                @state.nickname
            ]
        )
}

React.renderComponent (Nickname {nickname: "Wade"}), document.body
```

Live Demo: https://jsfiddle.net/elct9620/ZrHy8/

在這段 Code 可以看到我對 input 設定了一個 ref 屬性，並且能夠在 onChange 事件發生時透過 @refs 來讀取對應的元素。

註：在 [React] 中支援 trim() 協助清除空白，這邊嘗試使用 props 但是會發生錯誤，因此建議 props 只適合在初始化時使用

---

![螢幕快照 2013-08-29 下午2.25.26.png](https://user-image.logdown.io/user/52/blog/52/post/95203/tuVxapuNTMOL2l3cAYE8_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202013-08-29%20%E4%B8%8B%E5%8D%882.25.26.png)

那麼 [React] 適合被使用嗎？這是我在 Facebook 留言區塊發現的程式碼，每個使用 [React] 產生的元素都會有一個叫做 data-reactid 的屬性，用來辨識。

所以，趕緊來試玩看看吧！使用起來其實也非常順暢。

[React]: https://facebook.Github.io/react/
