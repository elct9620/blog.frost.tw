---
layout: post
title: 'Zigfu 跨平台的 Kinect SDK'
date: 2014-09-13 04:02
comments: true
tags: [Kinect, 遊戲, Unity3D]
---
之前和系上老師借了一個多學期的 Kinect 卻只有做完用 Mac 連接 Kinect 並且搭配 Unity3D 的功課，就一直沒有成果。
暑假也即將結束，緊接而來的就是全力投入在畢業製作，不過在此之前，還是得先把答應老師的功課做完。

雖然時間不足以製作一款遊戲，但是將 Zigfu 這款非常好用的工具使用介紹完整的說明，我想多少也算是能夠完成一部份的任務了！

---

Zigfu 基本上是設計給 Web 使用的，因此目前支援是 JavaScript 和 Unity3D 兩款（Flash 過了半年依舊開發中⋯⋯）
不過 Zigfu 卻替 Mac 使用者解決了一個問題，就是 OpenNI / OpenNI2 的安裝，沒有驅動就無法使用 Kinect 是 Mac 用戶的痛。
> 不過很可惜的是，目前最新的 Mac 驅動只能順利與 Kinect 溝通一分鐘左右，之後就是當機。
> 也因此，這系列的文章都是針對 Windows 所說明的，但是成品對 Mac 的支援是確定的，即使會當掉⋯⋯

至於 Zigfu 大致上做了什麼呢？
將驅動程式包裝起來，協助使用者安裝（Windows 使用者需要自己安裝驅動）並且提供 ZDK (SDK) 讓開發者可以用統一的界面，存取 Kinect（官方）、OpenNI、OpenNI2 的 Middleware。

> 關於 OpenNI / OpenNI 2 的介紹，可以參考[這篇文章](https://viml.nchc.org.tw/blog/paper_info.PHP?CLASS_ID=1&SUB_ID=1&PAPER_ID=491)。

<!-- more -->

這篇文章會用 Unity3D 來解釋一些關於 Zigfu 的 ZDK 基本使用。
最基本的就是我們需要能透過 Zigfu 讀取到影像、深度、骨架等資料，才能夠繼續後續的開發與使用。

### 安裝

首先，我們到官方網站的 [Plugin 下載頁面](https://zigfu.com/en/downloads/browserplugin/) 去下載 Plugin。
（Windows 用戶應該是不需要，至於使用的 Kinect 是 For Windows 還是 For Xbox 要注意驅動是否正確。）

完成之後，再到 [Unity3D ZDK 下載頁面](https://zigfu.com/en/zdk/unity3d/)下載適合 Unity3D 的 ZDK （是一個 Unitypackage 檔案，並且有含範例。）

之後在 Unity3D 開啟新專案，匯入 Custom Package 之後，就可以使用了。

**注意：因為 ZDK 是用 DLL 包裝的，所以你必須使用 Unity3D Pro 才能夠正常使用**

### 了解 Zig 元件

如果有點開範例檔案，會發現每一個範例檔案都有一個叫做 `Zigfu` 的 GameObject 在場景上，而這個 `Zigfu` 物件，都附加了一個叫做 `Zig` 的 Script 在上面。

假設停用了 `Zigfu` 物件，那麼所有相關 Kinect 的功能都會失效，並且出現 `Failed load driver and middleware...` 這樣的錯誤。

那麼 `Zig` 這個 Script 做了些什麼呢？

```cs Zig.cs
// 略
    public ZigInputType inputType = ZigInputType.Auto;
    //public bool UpdateDepthmap = true;
    //public bool UpdateImagemap = false;
    //public bool UpdateLabelmap = false;
    //public bool AlignDepthToRGB = false;
    public ZigInputSettings settings = new ZigInputSettings();
    public List<GameObject> listeners = new List<GameObject>();
    public bool Verbose = true;
    
    void Awake () {
        #if UNITY_WEBPLAYER
        #if UNITY_EDITOR
        Debug.LogError("Depth camera input will not work in editor when target platform is Webplayer. Please change target platform to PC/Mac standalone.");
        return;
        #endif
        #endif

        ZigInput.InputType = inputType;
        ZigInput.Settings = settings;
        //ZigInput.UpdateDepth = UpdateDepthmap;
        //ZigInput.UpdateImage = UpdateImagemap;
        //ZigInput.UpdateLabelMap = UpdateLabelmap;
        //ZigInput.AlignDepthToRGB = AlignDepthToRGB;
        ZigInput.Instance.AddListener(gameObject);
	}
// 略
```

上面是節錄自 `Zig.cs` 這個檔案的內容，我們可以發現裡面對 `ZigInput` 設定了 `InputType` 跟 `Settings` 兩個數值。

在 Unity3D 裡面看到就會是像這樣：
![螢幕快照 2014-09-13 下午3.01.19.png](https://user-image.logdown.io/user/52/blog/52/post/233228/7rGRv56mTYCE21bemCWe_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-09-13%20%E4%B8%8B%E5%8D%883.01.19.png)

簡單來說 `Zig` 元件幫我們把「讀取方式」以及讀取的方式設定好了！

> 在 InputType 裡面可以選擇 Auto / KinectSDK / OpenNI / OpenNI2 幾個選項，在預設的 Auto 狀況下，Zigfu 會自動依照 KinectSDK > OpenNI2 > OpenNI 的順序嘗試呼叫，當成功時就使用該驅動作為讀取 Kinect 資料的驅動。
> Settings 裡面則會看到一些關於讀取資料的設定，像是是否要更新 Depth （深度資訊） 等等。

最後，我們需要注意 `Awake` 方法的最後一行 `ZigInput.Instance.AddListener(gameObject)` 這一句程式碼。

> 在程式開發慣例中 Instance 通常是指物件的實體（就 Zigfu 的設計上，應該是屬於[單例](https://zh.wikipedia.org/wiki/%E5%8D%95%E4%BE%8B%E6%A8%A1%E5%BC%8F)的設計，簡單說就是只會存在一個。）

`gameObject` 在 Unity3D 通常是指自己本身，而 `AddListener` 在這邊指的是「當更新時也一併更新這個物件」的意思。

> Listener 基本上設計類似于[觀察者](https://zh.wikipedia.org/wiki/%E8%A7%82%E5%AF%9F%E8%80%85%E6%A8%A1%E5%BC%8F)這種慣例，在 Unity3D 就類似於 `Update` 的感覺，在 Zigfu 中選擇了自行實作，跟 Unity3D 分開處理。
> 某方面也算是比較恰當的做法，畢竟 Kinect 裡面有自己的硬體，跟 Unity3D 分離就可以不受玩家主機的硬體限制。

### 從 Kinect 讀取影像

首先我們要在深入了解 `ZigInput` 的作用，我們可以從範例的 `ZigImageView.cs` 這個檔案了解到一些蛛絲馬跡。

```cs ZigImageViewer.cs
// 略
    void Zig_Update(ZigInput input)
    {
        UpdateTexture(ZigInput.Image);
    }
// 略
```

前面提到的 `AddListener` 動作中，每當 Kinect 更新畫面並且被 Zigfu 接收時，會做類似 Unity3dD 的 `Update` 動作，也就是上面這段程式碼所寫的 `Zig_Update` 方法。

從這段程式碼可以看到，如果我們需要讀取影像，可以從 `ZigInput` 拿到一個 `Image` 資料來使用。

> 除了 `Image` 之外，我們還能拿到 `Depth` (深度) 以及 `Label Map` (標記)
> 不過 Label Map 在範例中是黑色的畫面，似乎也沒有人了解用途，因此就不多做討論。

接下來，我們先產生新的場景（Scene / Ctrl + N）並且新增一個 Empty GameObject 用來放置 Zig 元件。

![螢幕快照 2014-09-13 下午3.22.26.png](https://user-image.logdown.io/user/52/blog/52/post/233228/yB4QZUyhRJC8zMc7IMgq_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-09-13%20%E4%B8%8B%E5%8D%883.22.26.png)

> 產生好物件之後，就馬上把物件命名為 Zigfu 這會是一個好習慣，在中後期專案變大的時候，檔案跟物件沒有好好命名的話，就會碰到非常多問題。而團隊合作的時候更是明顯，因此別忘記修改物件名稱。

![螢幕快照 2014-09-13 下午3.22.43.png](https://user-image.logdown.io/user/52/blog/52/post/233228/0CMHeh13QWi6FZjqn6wW_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-09-13%20%E4%B8%8B%E5%8D%883.22.43.png)

在 Zigfu 的 ZDK 匯入到 Unity3D 後，也已經自動對選單增加好所有可用的元件。
我們在 Script 類型的選件中選擇 Zig 就可以對 Zigfu 物件新增這個元件了！

![螢幕快照 2014-09-13 下午3.26.45.png](https://user-image.logdown.io/user/52/blog/52/post/233228/zmyH6trKQpKxGoQGnRnz_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-09-13%20%E4%B8%8B%E5%8D%883.26.45.png)

預設的 Zig 元件沒有開啟 Update Image 的選項，因此我們要自己勾選起來。
（上圖還是未勾選狀態）

![螢幕快照 2014-09-13 下午3.30.52.png](https://user-image.logdown.io/user/52/blog/52/post/233228/rHuuWqqOQOe2Fw8JrLt8_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-09-13%20%E4%B8%8B%E5%8D%883.30.52.png)

接著，我們會需要一個 Plane（平面）用來顯示 Kinect 讀取到的影像。

![螢幕快照 2014-09-13 下午3.32.26.png](https://user-image.logdown.io/user/52/blog/52/post/233228/Ae9OtZ2fQU6jz8FWUru0_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-09-13%20%E4%B8%8B%E5%8D%883.32.26.png)

接著調整 Plane（這邊我已經重新命名為 ImageViewer） 跟 Main Camera 讓平面可以順利被攝影機完整照到。

![螢幕快照 2014-09-13 下午3.33.51.png](https://user-image.logdown.io/user/52/blog/52/post/233228/E5ujAGCtTVOdJCErzlge_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-09-13%20%E4%B8%8B%E5%8D%883.33.51.png)

在開始之前，我們先用範例的 ImageViewer 元件來測試效果。
現在啟動遊戲的話，應該可以順利看到 Kinect 的 Camera 照到的影像被更新到 Plane 上。

> 不過應該是上下顛倒的，不論是 WebCam 或者 Kinect 被照進去的狀況下都是這樣，旋轉一下就可以了！
> 影像有點暗是因為 3D 物件上面沒有打光，只要在場景上新增光源即可。

### 自定圖片讀取

我們先將 `ZigImageViewer.cs` 的內容複製到一個新的檔案 `CustomImageViewer.cs` 並且以此為基礎修改出我們自己的「圖片讀取功能」

![螢幕快照 2014-09-13 下午4.11.40.png](https://user-image.logdown.io/user/52/blog/52/post/233228/Z5MfzZHuQiJIiz0dkmI8_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-09-13%20%E4%B8%8B%E5%8D%884.11.40.png)

並且把原本的 ImageViewer Panel 的 Script 改為 CustomImageViewer 來套用我們自己的讀取處理。
（這邊最好先執行看看，是否可以順利運作。要注意 `class ZigImageViewer` 得改為跟檔名一樣的 `class CustomImageViewer` 才會正常運作。）

修改之前，第一步是要了解範例的 ImageViewer 在做什麼。
下面會直接將解釋標記在程式碼中。

```cs CustomImageViewer.cs
public class CustomImageViewer : MonoBehaviour {
	// 指定繪製的目標（這邊直接畫在自身，所以不需要）
	public Renderer target;
  // 解析度設定，最高支援到 640x480 數值越低越順暢
	public ZigResolution TextureSize = ZigResolution.QQVGA_160x120;
  // 材質貼圖（用來存 Kinect 讀進來的影像）
	Texture2D texture;
  // 解析度資料
	ResolutionData textureSize;
	
	Color32[] outputPixels; // 將影像轉換為像素陣列
  
	// 讀取器的初始化
	void Start()
	{
		if (target == null) { // 檢查是否有指定目標
			target = renderer; // 沒有的話就設定為自己
		}
    // 將讀取的解析度轉換為解析度資料（後面會用來畫在材質上）
		textureSize = ResolutionData.FromZigResolution(TextureSize);
    // 產生新的 2D 材質（用剛剛轉換的解析度資料）
		texture = new Texture2D(textureSize.Width, textureSize.Height);
		// 設定材質的顯示方式（ Clamp 是填滿，另一個 Repeat 則是重複貼滿 ）
    texture.wrapMode = TextureWrapMode.Clamp;
    // 設定 Plane 的材質為剛剛新增的材質
		renderer.material.mainTexture = texture;
    // 產生一組可以儲存影像像素資料的陣列
		outputPixels = new Color32[textureSize.Width * textureSize.Height];
    // 告訴 Zigfu 當畫面更新時要呼叫這個原件做更新處理
		ZigInput.Instance.AddListener(gameObject);
	}
	
  // 更新材質
  // 接收的是一個 ZigImage 資料
	void UpdateTexture(ZigImage image)
	{
  	// 讀取原始的影像資料（ Zigfu 會傳回像素陣列 ）
		Color32[] rawImageMap = image.data;
    // 將陣列換算成 2D 圖像的前置準備
    // 後面會詳細解釋這個部分
		int srcIndex = 0;
		int factorX = image.xres / textureSize.Width;
		int factorY = ((image.yres / textureSize.Height) - 1) * image.xres;
   	
		// 反轉 Y 軸（因為讀取到的影響一開始是左右相反的，需要再轉回來一次）
		for (int y = textureSize.Height - 1; y >= 0; --y, srcIndex += factorY) {
			int outputIndex = y * textureSize.Width;// 輸出影像的陣列位置
			for (int x = 0; x < textureSize.Width; ++x, srcIndex += factorX, ++outputIndex) {
				outputPixels[outputIndex] = rawImageMap[srcIndex]; // 將像素資料複製到輸出影像
			}
		}
		texture.SetPixels32(outputPixels); // 更新材質的像素資料
		texture.Apply(); // 套用像素資料（材質內容被更新）
	}
	
	void Zig_Update(ZigInput input)
	{
		UpdateTexture(ZigInput.Image);
	}
}
```

這邊會解釋兩個東西，一個是 Renderer (渲染器) 另一個是陣列轉為 2D 坐標的方法。

> Renderer 基本上會附加在每一個 Unity3D 上「可以被看到」的物件，他用來處理材質球跟材質如何繪製到模型上。
> 也因此，一旦 Renderer 被關掉，就無法看到物件，這邊用程式的方式設定材質球。

至於陣列轉換為 2D 坐標的方法，其實就是非常簡單的數學邏輯。

假設有一個 10px 乘以 10px 的影像，那麼他就會有 10 * 10 = 100 個像素。
那麼第 11 個像素的坐標在哪裡呢？可以用下面的方式推算出來。

> 位置 = (y * 寬) + x

所以說 11 要先除以 10 會得到餘數 1 接著用 11 剪掉 1 就得到一個可以被「寬」整除的值，都計算完畢後，就可以知道第 11 個像素位置在 x = 0, y = 1 的位置（註：陣列中是從 0 ~ 99 所以算完會變成 0,1 的坐標）

多想幾次就會理解其中的原理了！

接下來，我們對 `UpdateTexture` 方法做一些小修改，讓畫面變成黑白的灰階畫面。

```cs CustomImageViewer.cs
// 略
  void UpdateTexture(ZigImage image)
	{
		Color32[] rawImageMap = image.data;
		int srcIndex = 0;
		int factorX = image.xres / textureSize.Width;
		int factorY = ((image.yres / textureSize.Height) - 1) * image.xres;

		Color buffer;
    byte grayscaleByte;
		// invert Y axis while doing the update
		for (int y = textureSize.Height - 1; y >= 0; --y, srcIndex += factorY) {
			int outputIndex = y * textureSize.Width;
			for (int x = 0; x < textureSize.Width; ++x, srcIndex += factorX, ++outputIndex) {
				buffer = new Color(rawImageMap[srcIndex].r, rawImageMap[srcIndex].g, rawImageMap[srcIndex].b, rawImageMap[srcIndex].a);
        grayscaleByte = (byte)buffer.grayscale;
				outputPixels[outputIndex] = new Color32(grayscaleByte, grayscaleByte, grayscaleByte, (byte)rawImageMap[srcIndex].a);
			}
		}
		texture.SetPixels32(outputPixels);
		texture.Apply();
	}
// 略
```

首先，先增加 `Color buffer` 跟 `byte grayscaleByte` 方便處理。
> grayscale 只在 Color 下可以使用，而 Color32 則沒有這個功能，因此需要先手動將 Color32 轉為 Color

接著 `buffer = new Color(rawImageMap[srcIndex].r, rawImageMap[srcIndex].g, rawImageMap[srcIndex].b, rawImageMap[srcIndex].a);` 基於拿到的顏色產生一個新的 Color。
因為 Color32 需要用 byte 指定顏色，因此我們用 `grayscaleByte = (byte)buffer.grayscale;` 將灰階化的數值轉為 byte 方便使用。

最後調整原本複製像素的方式，改為 `outputPixels[outputIndex] = new Color32(grayscaleByte, grayscaleByte, grayscaleByte, (byte)rawImageMap[srcIndex].a);` 將一個灰階版本的像素複製進去。

現在，執行遊戲的話就可以看到灰階的畫面。

這篇文章就到此告一段落，至於 Depth 跟 Label Map 的使用方式，基本上是一樣的。目前學習的東西用一般的 WebCam 也能做到，下一篇文章會討論關於骨架的使用。
