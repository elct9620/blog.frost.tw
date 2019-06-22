---
layout: post
title: '將遊戲場景帶入網頁'
date: 2015-01-13 02:41
comments: true
tags: [前端, 心得]
---
昨晚公開了畢業製作的官網「[遠古神話 - The Lost Mythologies](https://www.make.moe)」並且使用了「全景攝影技術」在網站上。

> 喜歡我們的話請到[粉絲專頁](https://www.facebook.com/Basaltic.Studio?fref=nf)幫我們按個讚 XD

沒想到反應還蠻熱烈的，雖然官網目前也只有全景預覽以及 LOGO 而已，不過似乎造成了一點點話題。

那麼，這個效果到底是如何做出來的呢？這篇文章就會簡單的說明。

主要的目標大致上有：

* 順暢的瀏覽
* 清晰的畫面
* 全景圖片的製作

<!-- more -->

事實上，這個技術其實不是很新的技術。像是 Google 街景就是運用的範例之一，而實做的效果則是源自於 othree 大大的 [360-panorama](https://Github.com/othree/360-panorama) 這個範例（約兩年前的 Happy Designer Mini 活動分享）

### 全景圖製作

要做出全景效果，我們必須先有全景圖才能夠開始。

在遊戲中通常只有 Perspective / Orthographic 兩種攝影機可以使用，我們第一個目標就是要把它當作「相機」來進行操作。
跟一般相機比較接近的是 Perspective Camera 因此我們選擇利用這個 Camera 來做攝影的動作。

那麼，該怎麼截圖才對呢？可以參考網路上非常多的「[全景攝影教學](https://www.lazybox.com.tw/forum/fancystuff/photodiary/10335-87-lightroom--15-)」的做法，利用拼接數張相片來達成這個效果。

> 在 Prespective Camera 中，可以設定 Field of View (FOV) 這個設定值，最大可以達到 170 ~ 180 左右，簡單說就是廣角鏡頭的效果，能夠讓視野變得非常大，但是同時也讓畫面變形到無法辨識，因此這種方式是不可行的。

為了取得比較沒有變形的遊戲畫面，一般依照預設值使用 FOV = 90 / Aspect = 1.7778 即可（Aspect 為長寬比，而 1.7778 是目前較常見的 16:9 螢幕大小，不過實際上拼接後無影響）

> 在 Unreal Engine 中 Aspect 的大小會影響輸出檔案的解析度，當 Aspect 越小，解析度低也因次需要利用 HighResoultion Screenshot 工具的 Scale 功能去放大，但是放大次數太多會讓你的顯卡暴斃，因此設定 1.7778 的 Aspect 會比較恰當，大致上只需要做到 2 ~ 3 的 Scale 就足夠了！

#### Unreal Engine 的攝影機架設與設定

因為是使用 Unreal Engine 來製作的，所以這邊就用 Unreal Engine 來示範架設攝影機的處理。

![螢幕快照 2015-01-13 上午11.43.46.png](https://user-image.logdown.io/user/52/blog/52/post/249663/09DVxMSTT6YJgZCgrXiw_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202015-01-13%20%E4%B8%8A%E5%8D%8811.43.46.png)

首先我們先加入一個拍攝用的攝影機在希望拍攝全景圖場景的位置（之後可以刪掉，如果用不上的話⋯⋯）

![螢幕快照 2015-01-13 上午11.46.15.png](https://user-image.logdown.io/user/52/blog/52/post/249663/4V6cxZEJTrGvnTy9wip4_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202015-01-13%20%E4%B8%8A%E5%8D%8811.46.15.png)

接下來調整攝影機位置到正確的點，這邊最重要的地方是把 (X, Y, Z) 三軸的旋轉都歸零，以免待會拍攝的時候發生問題。

![螢幕快照 2015-01-13 上午11.47.21.png](https://user-image.logdown.io/user/52/blog/52/post/249663/0HCJoRfFTNKHA54pvWCi_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202015-01-13%20%E4%B8%8A%E5%8D%8811.47.21.png)

Unreal Engine 中有「Lock Viewport to Actor」的功能，利用這個功能將編輯器畫面對應到用來拍攝全景圖的攝影機上（主要是因為 Unreal Engine 的 Screenshot 功能是以編輯器的視窗為主）

![螢幕快照 2015-01-13 上午11.50.38.png](https://user-image.logdown.io/user/52/blog/52/post/249663/roHN3olCQWbT0BVORWMP_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202015-01-13%20%E4%B8%8A%E5%8D%8811.50.38.png)

接下來隱藏掉一些不想出現在畫面上的物件（Ex. 小怪、遮蔽視線的物體）然後將 Realtime 功能關閉，開啟 Gameview 狀態讓編輯器畫面呈現「接近遊戲畫面」的狀態方便拍攝（過程不要點到場景物件，以免被拍到控制項）

![螢幕快照 2015-01-13 上午11.51.08.png](https://user-image.logdown.io/user/52/blog/52/post/249663/6WjH80jJQwSog6ENHhyd_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202015-01-13%20%E4%B8%8A%E5%8D%8811.51.08.png)

![螢幕快照 2015-01-13 上午11.51.21.png](https://user-image.logdown.io/user/52/blog/52/post/249663/rKN3lddTj61hyg7UfIhY_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202015-01-13%20%E4%B8%8A%E5%8D%8811.51.21.png)

接下來開啟 High Resloution Screenshot 功能拍攝高畫質的全景圖吧！關於 Screenshot Size Multipler 的設定，就看大家的需求調整摟！（以我的解析度設定為 3 大概可以拿到約 600 萬畫素的截圖）

至於要拍攝幾張呢？以我的經驗來說約 26 張差不多就足夠了！

大約是以下幾個組合：

* 8 張 (X=0, Y=0, Z=n) n = i * 45 
* 8 張 (X=0, Y=45, Z=n) n = i * 45
* 8 張 (X=0, Y=-45, Z=n) n = i * 45
* 2 張 (X=0, Y=n, Z=0) n = (i - 1) * 90 (+90 跟 -90)

我們會使用「正射投影法」貼到一顆球體上，之後再轉為「等距圓柱投影」的圖片作為輸出。
> 最後兩張是用來填補天空和地板的洞，而 Y = +/-45 也是類似，都是補足 FOV=90 視野不夠廣闊問題的輔助圖
> 突然發現地理課學的投影法在神秘的情況下竟然用到了，雖然用軟體完全沒差啊～～～

注意：重點在於每張圖片都要跟其他圖片有「重複且可辨識」的部分

#### 拼接全景圖

因為 Lightroom 有點大，所以就用了 OpenSource 的軟體 [Hugin](https://hugin.sourceforge.net) 來製作（其實非常好用）

![螢幕快照 2015-01-13 下午12.01.22.png](https://user-image.logdown.io/user/52/blog/52/post/249663/MK3J09cTyeuF42BImv5y_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202015-01-13%20%E4%B8%8B%E5%8D%8812.01.22.png)

Mac 上打開會出現錯誤，按取消之後一樣可以正常使用（意義不明 XDD）

![螢幕快照 2015-01-13 下午12.02.08.png](https://user-image.logdown.io/user/52/blog/52/post/249663/lGA9IJjjTS9FMywSRslr_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202015-01-13%20%E4%B8%8B%E5%8D%8812.02.08.png)

開啟後選擇左上角的「載入圖片」一次選取剛剛全部拍攝的 26 張圖片後，會先詢問鏡頭的數據。
> 這邊先填寫「焦距比」的設定值，也就是 Aspect 設定的 1.7778 然後再輸入水平視角的角度 FOV=90 度，最後會自動計算出焦距
> 據說教學文章上說用 15mm ~ 25mm 的鏡頭會比較有透視感，但是遊戲攝影機拍出來隨便都 15mm 以下，到底是多有透視感啊 XDDD

![螢幕快照 2015-01-13 下午12.04.55.png](https://user-image.logdown.io/user/52/blog/52/post/249663/kVa7Kq2dRDuY4dt1NLX2_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202015-01-13%20%E4%B8%8B%E5%8D%8812.04.55.png)

設定完畢後會發現畫面非常的奇怪，感覺只是單純地把圖片貼到球體上而已。不過這是正常情況（正射投影預設就是這樣啊 XD）

![螢幕快照 2015-01-13 下午12.06.14.png](https://user-image.logdown.io/user/52/blog/52/post/249663/Uxog8yFLQs4n6cesVf67_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202015-01-13%20%E4%B8%8B%E5%8D%8812.06.14.png)

點選「對準」按鈕之後，會開始計算這 26 張圖片的「重複」部分，並且以此為基準作為「對齊」的基準點。

註：也因此，前面一個步驟視野 90 度卻用 45 度旋轉的理由就出現了（不然手動對齊可是會崩潰的）

![螢幕快照 2015-01-13 下午12.08.33.png](https://user-image.logdown.io/user/52/blog/52/post/249663/diIjA5SnRUmMfc7v9lBN_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202015-01-13%20%E4%B8%8B%E5%8D%8812.08.33.png)

在預覽模式下可以看到軟體基本上算出了近百個對齊點才抓到正確的拼接參考，因此拍攝時多花點時間讓重複的部分夠多才能讓軟體自動的拼接。

![螢幕快照 2015-01-13 下午12.10.07.png](https://user-image.logdown.io/user/52/blog/52/post/249663/DJ7mYBFPTgedqzDMput4_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202015-01-13%20%E4%B8%8B%E5%8D%8812.10.07.png)

![螢幕快照 2015-01-13 下午12.11.36.png](https://user-image.logdown.io/user/52/blog/52/post/249663/9R8GP1HWRJexI8sTDlLi_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202015-01-13%20%E4%B8%8B%E5%8D%8812.11.36.png)

不過這時候可能會發現場景是上下顛倒的（不一定）這時候就利用移動/拖曳的功能，矯正場景到正確的位置。
（這會影響到一開始的全景預覽位置是否正確，以及是否會有強烈的傾斜感）

![螢幕快照 2015-01-13 下午12.13.21.png](https://user-image.logdown.io/user/52/blog/52/post/249663/m5R9U3BBQfiXJy5Ah7u2_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202015-01-13%20%E4%B8%8B%E5%8D%8812.13.21.png)

最後到投影設定檢查是否為「等距長方圓柱」這個設定值，確認無誤之後就可以進行輸出了！

![螢幕快照 2015-01-13 下午12.14.27.png](https://user-image.logdown.io/user/52/blog/52/post/249663/8Js5Lw5RS6qWA3W62N1z_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202015-01-13%20%E4%B8%8B%E5%8D%8812.14.27.png)

存好等距長方圓柱投影的貼圖後，就可以開始來製作 3D 的投影網頁場景摟！

### Three.js + WebGL 全景預覽

基本上參考文章一開始提到 othree 大大所寫的全景預覽 three.js 版本即可（其實裡面有提到用 Cube 模式會比較好，其實那就是 Skybox 的方式，不過一切看個人喜好，至少圓柱投影的版本效果就很不錯了！）

```html
<div id="container"></div>
```

基本上很簡單，給予一個 HTML 容器用來放置 Three.js 的 Canvas 即可。

然後就是寫 Three.js 的控制項（基本上都參照 othree 大大的寫法～～）

```coffee

window.onload = (e) ->
  # 網頁讀取完畢後產生場景
  new Scene(document.getElementById('container'))

class Scene
  constructor: (container) ->
    # 初始化變數
    @_isInteracting = false
    @_onMouseDownX = 0
    @_onMouseDownY = 0
    @_lon= 0
    @_lat = 0
    @_phi = 0
    @_onMouseDownLon = 0
    @_onMouseDownLat = 0
    @_theta = 0

    @container = container
    
    # 創建攝影機（FOV=70 左右比較感覺不出變形）
    # window.innerWidth / window.innerHeight 是計算 Aspect 的公式（因為是佔滿畫面所以直接這樣使用）
    @camera = new THREE.PerspectiveCamera 70, window.innerWidth / window.innerHeight, 1, 1100
    @camera.target = new THREE.Vector3 0, 0, 0
    
    # 產生場景
    @scene = new THREE.Scene()

    # 產生物件
    @mesh = new THREE.Mesh(
      new THREE.SphereGeometry( 500, 60, 40 ), # 產生球體（半徑、寬分段、高分段）
      new THREE.MeshBasicMaterial ( { # 設定材質
        map: THREE.ImageUtils.loadTexture( ' /img/temple.jpg' ) # 貼圖為剛剛輸出的全景圖
      } )
    )
    @mesh.scale.x = -1 # 反轉 Normal （讓原本顯示在外表的材質變到內部）
    @scene.add @mesh # 在場景加入這個物件

    # 產生繪圖器，這邊是用 WebGL 的版本（似乎有些人的電腦不支援看不到，還需要做支援性修正）
    @renderer = new THREE.WebGLRenderer()
    @renderer.setSize( window.innerWidth, window.innerHeight ) # 畫面大小等於網頁畫面

		# 加到網頁中
    container.appendChild @renderer.domElement

    @bindEvents()
    @animate() # 開始播放動畫

  bindEvents: =>
  	# 處理滑鼠事件
    document.addEventListener 'mousedown', @onMouseDown, false
    document.addEventListener 'mousemove', @onMouseMove, false
    document.addEventListener 'mouseup', @onMouseUp, false

		# 處理縮放事件（不過我用 addEventListener 卻收不到，很奇怪）
    window.onresize = @onWindowResize
    # window.addEventListener 'resize', @onWinodwResize, false

  animate: =>
    # HTML5 的動畫處理函示（ 其實要 Fallback 回去 setTimeout ）
    requestAnimationFrame( @animate )
    
    # 如果沒有在「拖曳」場景的話，自動旋轉 Lon ( Lon / Lat 應該是用經緯度表示法 )
    if @_isInteracting is false
      if @_lon < 360
        @_lon = @_lon + 0.015
      else
        @_lon = 0

    @render()

  render: ->

    @_lat = Math.max( - 85, Math.min( 85, @_lat ) ) # 限制仰角只能在 +/- 85 度以內（其實就是地板跟天花板的洞讓你看不到）
    @_phi = THREE.Math.degToRad( 90 - @_lat ) # 將角度轉為弧度
    @_theta = THREE.Math.degToRad( @_lon )

		# 下面是計算攝影機面向的位置
    # 
    # 因為數學不好，看了很多資料覺得很崩潰（以下是利用公式計算，解釋會盡力表達）
    # 資料：球座標系統 - https://zh.wikipedia.org/wiki/%E7%90%83%E5%9D%90%E6%A8%99%E7%B3%BB
    # 資料：弧度 - https://zh.wikipedia.org/wiki/%E5%BC%A7%E5%BA%A6
    # 資料：反三角函數 - https://zh.wikipedia.org/wiki/%E5%8F%8D%E4%B8%89%E8%A7%92%E5%87%BD%E6%95%B0
    # 資料：JavaScript Math - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sin
    #
    # 1. 首先將 deg 轉 rad 是因為程式中接收的都是 radius （耍笨想很久沒想通 XD）
    # 2. 球體座標系統定義了 （距離, 仰角, 方位角) 三個數值
    # 3. 所以 500 = r (距離)
    # 4. 3D 中通常是 Y-up 軸向設計，因此與球體座標系統的 Z-up 不同，將 Y & Z 軸的對調
    # 5. 中間推算的過程不好寫，大家自己慢慢推吧（上面幾個資料加上三角函數的資料總有一天可以推出來的⋯⋯我推不出來 XD）
    
    @camera.target.x = 500 * Math.sin( @_phi ) * Math.cos( @_theta )
    @camera.target.y = 500 * Math.cos( @_phi )
    @camera.target.z = 500 * Math.sin( @_phi ) * Math.sin( @_theta )

		# 讓攝影機注視這個點（面向）
    @camera.lookAt @camera.target

		# 重新繪製畫面
    @renderer.render @scene, @camera

  onMouseDown: (e) =>
    e.preventDefault()

    @_isInteracting = true

    @_onMouseDownX = e.clientX
    @_onMouseDownY = e.clientY

    @_onMouseDownLon = @_lon
    @_onMouseDownLat = @_lat

  onMouseMove: (e) =>
    e.preventDefault()

    if @_isInteracting
    	# 計算經緯度的差距，讓之後可以轉換為座標
      @_lon = (@_onMouseDownX - e.clientX) * 0.1 + @_onMouseDownLon
      @_lat = (@_onMouseDownY - e.clientY) * 0.1 + @_onMouseDownLat

  onMouseUp: (e) =>
    e.preventDefault()

    @_isInteracting = false

  onWindowResize: =>
    @camera.aspect = window.innerWidth / window.innerHeight
    @camera.updateProjectionMatrix()

    @renderer.setSize window.innerWidth, window.innerHeight

```

到此為止，就可以順利地做出遊戲的全景預覽拉！

> 所以我到底為什麼要花一個下午研究「球座標系統」轉為「直角座標系統」的算式呢？
