---
layout: post
title: 'Unity3D - 元件化的遊戲製作'
publishDate: 2014-01-03 07:07
comments: true
tags: [JavaScript, 遊戲, 心得, 程式, Unity3D]
---
這篇文章一部份是寫給同學看的，在做遊戲中似乎挺常使用到的，而這個「特性」如果能夠理解的話，未來同學在製作遊戲應該也是會順利很多，另一方面就是 SITCON 的投稿，大概就是以這個為主軸來討論。

依照網路上的說法，這個概念應該是在 Unity3D 熱門之後，才比較被大眾所熟悉。而我個人是在 2013 年的 COSCUP 在半路大的[演講](https://speakerdeck.com/halflucifer/using-lua-to-build-a-component-based-architecture-for-game-apps)第一次獲得「元件化」的關鍵字，這確實也是一個不一樣的概念。

至於後續如何呢？讓我們一起看下去。
（關於非遊戲的討論，我之後會另外寫文章，這邊以 Unity3D 的 Component 概念為主。）

<!--more-->

## 元件化程式設計

為了要投稿 SITCON 所以我做了不少準備，至少是把 Component Based Programing 整個概念都稍微研究過了一遍。

首先，我們可以從[維基百科](https://en.wikipedia.org/wiki/Component-based_software_engineering)上面看到一些關於 Component Based Programing 的介紹與相關知識。

最另外意外的是像是 Laravel (PHP Framework) 使用到的 IoC （單純是因為我以這個框架為契機了解 IoC 的概念）亦或是這幾年 Web Service 最常使用的 REST API 都屬於 Component Based Programing 的運用。

也就是說，若要討論其實是很多可以討論的。

這邊簡述一下我的理解。

「某一個物件因為經常需要擴充或者調整功能，或者是某一個物件類型因為需要應對不同的變化，所以從原本較為固定的方式衍生出一種相對彈性的方式。」

好像敘述的有點不太好，昨晚稍微努力想了些比較適當的「實例」也許大家會比較好理解。

* WordPress 為了應對使用者不同的需求，提供了 Plugin 機制，讓使用者可以選擇對應的 Plugin 來使用。
	<br /> > WordPress (物件) 可以透過 Plugin (元件) 來增減功能
* 電腦可以透過安插各種零件來強化或者調整硬體應各種用途
	<br /> > 電腦（物件）透過零件（元件）來調整硬體
 
不知道有沒有比較具象一點，大致上來說就是某個東西可以利用類似 Solt (插槽) 去擴充或者減少功能，然後調整成適當的狀態這樣的概念。
（從一些 Open Source 的遊戲引擎來看，其實有點像是 USB 插槽跟 USB 裝置的感覺，大多是實作一個 Interface 去讓物件繼承，從而相容這樣。）

## Unity3D 的元件化設計

開始之前，我在 Google 找到了一篇關於遊戲的 Component Based Programing 的[翻譯文章](https://disp.cc/b/38-13mE)，大家可以先看看，個人感覺有點類似歷史簡介的東西，其實不管哪種做法都是有缺點（Ex. 關於 CPU 消耗的問題）不過在適當的情況使用，改善開發我想還是最主要的目標。

關於如何在 Unity3D 正確使用 Component 也有一份[簡報](https://www.slideshare.net/lucifuges/unity-13737954)非常不錯，裡面提到了正確拆解元件的方法以及概念。

在讀完這些資料後，其實大家應該都對 Component-Based Programing 這個概念有所了解。下面就開始來討論 Unity3D 的 Component 吧！

## Unity3D 的 GameObject 與 Component

打開 Unity3D 產生一個 Cube (GameObject) 然後看看 Inspector 上的設定。

![螢幕快照 2014-01-03 上午10.50.34.png](https://user-image.logdown.io/user/52/blog/52/post/167832/CuK42JfRkyjT8XlK4GFg_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-01-03%20%E4%B8%8A%E5%8D%8810.50.34.png)

在 Unity3D 官網的 [Component](https://docs.unity3d.com/Documentation/ScriptReference/Component.html) 解釋中，提到「所有可以附加在 GameObject 的基礎類別」

### GameObject 上的 Component

那麼，我們試著對這個 Cube 加上一個 Script 並且嘗試用 `GetComponents` 來看看這個 Cube 上有哪些 Component 在上面。

```js
#pragma strict

var components:Component[];

function Start () {
	components = GetComponents(Component);
	var i:int = 0;
	for(i = 0; i < components.Length; i++) {
		Debug.Log(components.GetValue(i));
	}
}

function Update () {

}
```

![螢幕快照 2014-01-03 上午11.05.21.png](https://user-image.logdown.io/user/52/blog/52/post/167832/ZSSpuuoTSCc4YQ3JIJm0_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-01-03%20%E4%B8%8A%E5%8D%8811.05.21.png)

從結果來看，我們觀察到第一個： **Inspector 上的都是 Component，一個 GameObject 的表現由 Component 決定**

也就是說，對 Unity3D 來說，一個 GameObject 該如何呈現在場景中，是由元件所決定的。
如：Cube 透過 MeshFilter 決定外形，由 MeshRenderer 決定色彩、外觀、材質以及被繪圖引擎繪製。

### 元件的複製

接著稍微修改剛剛的程式，我們將物件的 ID 印出來，並且複製一次這個物件，來觀察當我們使用 `Instantiate` 方法時，元件會怎麼變化。

```js
#pragma strict

var components:Component[];
static var clone:GameObject;

function Start () {
	Debug.Log("Object Name: " + name);

	components = GetComponents(Component);
	var i:int;
	var currentComponent:Component;
	Debug.Log("Total Component: " + components.Length);
	for(i = 0; i < components.Length; i++) {
  	# NOTICE: Unity3D will warning you
		currentComponent = components.GetValue(i);
		Debug.Log(currentComponent.GetType() + " - ID: " + currentComponent.GetHashCode());
	}
	
	if(!clone) {
		clone = GameObject.Instantiate(gameObject);
	}
}

function Update () {

}
```

![螢幕快照 2014-01-03 上午11.27.05.png](https://user-image.logdown.io/user/52/blog/52/post/167832/GBaDJWZKQI3t2jZmCFfn_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-01-03%20%E4%B8%8A%E5%8D%8811.27.05.png)

看起來每次 `Instanticate` 出來的 GameObject 都是一個「獨立的物件」並不會參照到原本的物件上。

關於這點，如果認真看官網的 [Instanticate](https://docs.unity3d.com/Documentation/ScriptReference/Object.Instantiate.html) 解釋，裡面這樣說「這類似於編輯器的複製動作，當你克隆一個元件時所有子物件以及元件都會被克隆一遍」

其實這邊會有關於物件複製的疑問，全體克隆的行為其實仔細思考就會想通。至於大量的物件複製不會很慢的問題，就比較難想，目前我也想不到。不過，有時候必要的花費是必須的，這樣理解也許會比較好。

那麼關於 `Instantiate` 和 `Destroy` 的使用，就會很重要，畢竟要盡可能減少大量產生物件。

在製作 Unity3D 的作業時，我就碰到複製怪卻讓遊戲會卡住一瞬間的問題。
經過搜集資料後，發現 `Instantiate` 和 `Destory` 其實算是蠻昂貴的動作（從的解釋來看，假設現在我這是一個非常複雜上面有數百個元件的物件，那我複製一次要花多久去拷貝這個物件？）也因此，會建議大家使用 `GameObjectPool` 的方式管理，也就是產生後不刪除，而是先 Deactive 直到下次需要被使用才再次 Active。
（Asset Store 上有販賣 GameObjectPool 的套件，網路上也有不少語法，但是建議仔細看討論跟分析程式碼來選擇適合的。）

## 了解 Component 化的設計

<s>據說這邊卡很久，因為我在研究簡報跟運用</s>

前面有提到一個介紹 Unity3D 的元件簡報，裡面的「Component 化」的含義，我反覆閱讀之後才終於頓悟，原來是這麼個一回事。

首先，我們要再次複習 GameObject 和 Component 可以做的事情才行，還有再次釐清特性。

### GameObject

* 可以附加 Component
* 可以有 Child Object

#### Component

* 不能附加 Component
* 不能有 Child Object 
* 從 MonoBehaviour 類別繼承 （Component 類別的子類）
* 可以重複疊加到 GameObject 上

我先說明一下為什麼要搞清楚特性，最初我希望在 Component 下增加 Component 但是不能，於是我改為 GameObject 下增加，但是我的測試語法是一個透過 frame 數來切換 Buffer 的 Component (更改顏色) 但是我卻發現 Component 會無限制地被疊加上去，這並不是我所期望的。

並且我對「簡報」中的「階層」感到疑惑，難道我的做法有問題嗎？透過一段時間的檢查思考方式，我得出了一個結論。

在較複雜的遊戲物件（如：玩家、敵人）我們應該適當的增加 GameObject 的階層，來分離與釐清一個物件的行為。
（約簡報 45 頁，大致上就是最終的目標）

註：動態的為物件增加元件(`AddComponent`)不一定是好的做法，因為可能不小心附加過多的元件到物件上，透過 Prefab （類似物件版模的東西）與階層化的物件處理，會比較恰當。

## 實作 Component 化的設計

這部分我會實作一個 Player 物件，然後擁有 Collider 可以處理滑鼠點擊，並且用這個方式控制粒子特效的開啟或者關閉。
（範例檔案：[下載](https://www.mediafire.com/download/9a0nl3mgoz8g8b8/Example.unitypackage)）

為了將物件的任務個別分離，我這樣設計了我的物件階層。

* **Player** - 控制、狀態 (Empty GameObject)
	* **Model** - 外觀 (Cube)
		* **BufferFx** - 粒子特效 (Particle System)
    
並且寫了三個 Script (Component) 去控制開啟與關閉粒子特效。

```js Buffer.js (Attached on Player)
#pragma strict

private var bufferFx:GameObject;
protected var bufferActive:boolean = false;

function Start () {
	bufferFx = transform.FindChild("Model/BufferFx").gameObject;
}

function Update () {

}

function ActiveBuffer() {
	if(bufferActive) {
		bufferFx.SendMessage("DeactiveBuffer", SendMessageOptions.DontRequireReceiver);
	} else {
		bufferFx.SendMessage("ActiveBuffer", SendMessageOptions.DontRequireReceiver);
	}
	bufferActive = !bufferActive;
}
```

在 Unity3D 中似乎沒有提供直接取得 GameObject Child 的方法，因此需要從 Transform 中取得下階層的 GameObject 物件（是否有更好的做法不確定，另外父子階層在 Unity3D 是由 Transform 控制的）

```js BufferTrigger.js (Attached on Model)
#pragma strict

function Start () {

}

function Update () {

}

function OnMouseDown() {
	SendMessageUpwards("ActiveBuffer", SendMessageOptions.DontRequireReceiver);
}
```

這部分就比較簡單，當物件被按下去時觸發 Buffer 動作（也許可以把 Collider 改到 Player 階層，讓 Player 來處理）

```js BufferFx.js (Attached on BufferFx)
#pragma strict

function Start () {
}

function Update () {

}

function ActiveBuffer() {
	particleSystem.Play();
}

function DeactiveBuffer() {
	particleSystem.Stop();
}
```

最後是播放粒子特效與停止粒子特效的處理，透過從 Buffer.js 用 SendMessage 收到的訊息來處理。
（據說使用 SendMessage 也是較為昂貴的操作，不過那也是後話了～）

註：如果粒子系統一開始就播放，那很可能是 `Play on Awake` 被勾選了，似乎 Unity3D 預設會幫音效、粒子特效等可播放的元件勾選起來。

## 後記

其實到後來發現有一點「考察」的感覺，不過實際上簡單體驗使用 Component-Based Programing 後，真的會發現相對物件導向的繼承式做法來設計遊戲，更為容易理解。

這篇文章應該還有不少部分寫得不好，有高人知道改進的方法希望可以留言提醒一下。

## 參考資料

* https://speakerdeck.com/halflucifer/using-lua-to-build-a-component-based-architecture-for-game-apps
* https://www.slideshare.net/lucifuges/unity-13737954
* https://disp.cc/b/38-13mE
* https://en.wikipedia.org/wiki/Component-based_software_engineering
* https://www.cnblogs.com/ybgame/archive/2012/12/09/2810278.html (系列文)
