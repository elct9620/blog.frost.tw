---
layout: post
title: 'V-Play Engine 與 Corona SDK 的簡易比較'
publishDate: 2013-09-18 14:46
comments: true
tags: [JavaScript, Lua, 遊戲, SDK, 心得]
---
原本這篇是想寫關於 [V-Play] Engine 來制作一個簡單的小遊戲，不過後來因為作業上的需求，我有另外去接觸 [Corona] SDK 於是就變成了一篇比較文。

雖然兩者大概都是接觸約一周到兩週的程度，沒辦法做太深入地分析與討論，但是就我自己的感覺來說，最後是選擇了 [Corona] SDK 來做為制作遊戲的引擎。

雖然實際上比較想制作 PC/Mac 平台的遊戲，不過就現況來說遊戲引擎都轉戰移動裝置市場，也只好先暫時如此了⋯⋯

<!--more-->

既然要做比較，那麼還是開個表格來好好對照一下會比較恰當。

|           | **V-Play Game Engine** | **Corona SDK** |
|:---------:|:----------------------:|:--------------:|
|**收費方式**|Android/iOS 發佈收費     |依照營業額升級方案|
|**使用語言**|QML/JavaScript          |Lua             |
|**教學文件**|無經驗初學者較容易懂      |適合有經驗者閱讀  |
|**設計架構**|概念上好懂，實際撰寫與程式開發差異大|標準的 Lua 風格，與一般程式人員習慣類似|
|**引擎架構**|感覺還在發展中           |比較完整         |
|**模擬運行**|一般 Qt 建制出來的應用   | Corona 內建的模擬器|
|**建置測試**|需手動上傳後下載放入手機  | 整合在軟體內，仍需手動匯入手機|
|**使用案例**|幾乎沒有看到            |官網有幾個不錯的作品 |
|**使用範圍**|純遊戲開發              |一般 APP 或遊戲    |

以上是我想到的項目，其實有些好像是廢話啊（笑

事實上，假設沒有要制作 PC/Mac 的遊戲需求，我認為選擇 [Corona] SDK 會比選擇 [V-Play] 還好，在 V-Play 的撰寫上對有經驗的開發者（會寫程式）是件很微妙的的感覺，怎麼寫怎麼不對勁。

關於這個問題，我認為是 QML 造成的關係，其實這個概念很好，不過不斷的建立階層然後組合起來，其實感覺非常的微妙⋯⋯

``` qml Box.qml
import V-Play 1.0

EntityBase {
	Rectangle {
		width: 10
		height: 10
	}
}

```

``` qml Scene.qml
import V-Play 1.0
import "Box.qml"

GameWindow {
	Scene {
		Box {
			x: 10
			y: 10
		}
	}
}

```

不過架構概念上其實蠻適合撰寫遊戲，因為是以元件的形式去組合，其實在設計遊戲架構時是不錯的。
不過卻會因為不斷的加入同樣的東西去設定某個元件而越來越囧吧 XDD

另一方面 [Corona] SDK 寫起來就是單純的 Lua 毫無違和啊 XDD

``` lua scene1.lua
local storyboard = require("storyboard")
local scene = storyboard.newScene()

function scene:createScene( event )
  -- Do something ...
end

function scene:enterScene( event )
	-- Do something repeate
end

function scene:exitScene( event )
 -- Do something ...
end

function scene:destroyScene( event )
 -- Do something ...
end

scene:addEventListener("createScene", scene)
scene:addEventListener("enterScene", scene)
scene:addEventListener("exitScene", scene)
scene:addEventListener("destroyScene", scene)

return scene
```

Event Driven 類型的設計，感覺跟遊戲設計上比較接近。

註：[V-Play] 是在元件中敘述 collision 時的動作，而 [Corona] 則是對物件或者場景監聽事件，就邏輯上本身不太一樣。

---

而實際製作上，其實差異上大概就是幾個設定時的做法問題。
（其實主要差異大概就是上面提的這樣，目前我用 [V-Play] 做了打磚塊的原型，而 [Corona] 則是一款守塔遊戲原型）

在使用 [V-Play] 的部分，因為都直接寫在原件中，所以基本上不太需要一些特殊設定。

而 [Corona] 是使用這種方式對物理和漸變（transition）做處理的。

``` lua 

local physics = reqire("physics")
-- Some Physics Settings ...

-- Some Object
local object = display.newRect(0, 0, 10, 10)
physics.addBody(object, {})
transition.to(object, {x=100, time=1000})
```

此時，假設我要取消漸變，就會出現「我該怎麼取消」的問題⋯⋯
因此會需要改寫成這樣：

```lua

object.transition = transition.to(object, {x=100, time=1000})

--- Some Event Trigger
transition.cancel(object.transition)

```

需要另外儲存，不過幸好在 Lua 中物件基本是利用 Table 創造的，可以很輕易的加入屬性。
不過另一方面也要小心，因為 [Corona] 在很多地方都不會提醒你有錯誤（也可能是 Lau 的關係）

```lua
local object = display.newRect(0, 0, 10, 10)
function object:removeSelf()
	-- Do something ...
end
```

但實際上 removeSelf 是預設用來刪除物件的語法，現在被我們自己覆蓋掉，反而造成系統無法使用正確的方式移除物件，這部分需要很小心。

就目前的經驗來看，我能做得比較大致上就到這邊。

之後就等我有更深入地研究再來討論這些東西了～

如果文章有誤，也請大家指正。

[V-Play]: https://v-play.net/
[Corona]: https://coronalabs.com/
