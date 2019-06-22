---
layout: post
title: '使用 Zigfu 的骨架功能'
date: 2014-09-13 09:38
comments: true
tags: [Kinect, 遊戲, Unity3D]
---
接續[上一篇](https://blog.frost.tw/posts/2014/09/13/zigfu-Kinect-across-the-platform-SDK)文章的介紹，這一篇文章會針對 Kinect 在遊戲類型應用上最為重要的功能「骨架」來做討論。

在 Zigfu 中，已經提供了 `ZigTrackedUser.Skeleton` 這個物件讓我們可以存取骨架，與前一篇文章不同的地方在於，我們會用 `Zig_UpdateUser` 這個方法存取骨架。

<!-- more -->

### 理解 Zigfu 的玩家追蹤

Zigfu 提供了三個方法讓我們可以了解玩家的狀況。

* `Zig_UserFound` - 辨識到玩家的情況
* `Zig_UpdateUser` - 更新玩家的情況（不一定有辨識到）
* `Zig_UserLost` - 遺失玩家的情況

這三個方法都會接收到一個叫做 `ZigTrackedUser` 類型的物件，裡面儲存著目前被「追蹤」的玩家，以及其相關資料（如骨架資訊）

接下來，我們來看 `ZigSkeleton.cs` 這個檔案是如何使用 `Zig_UpdateUser` 來處理骨架的。

```cs ZigSkeleton.cs
// 略
    void Zig_UpdateUser(ZigTrackedUser user)
    {
        UpdateRoot(user.Position);
        if (user.SkeletonTracked)
        {
            foreach (ZigInputJoint joint in user.Skeleton)
            {
                if (joint.GoodPosition) UpdatePosition(joint.Id, joint.Position);
                if (joint.GoodRotation) UpdateRotation(joint.Id, joint.Rotation);
            }
        }
    }
// 略
```

當我們獲取 `ZigTrackedUser` 之後，可以用 `Position` 來取得玩家的位置（大致上會是一個三度空間，這個空間是 Kinect 所能偵測的範圍）

`UpdateRoot(user.Position)` 這段程式碼會更新場景中物件的位置，使之與玩家在現實中的位置同步。

不過，即使辨識到了「玩家」也不代表能夠辨識出「骨架」因此會做一個 `SkeletonTracked` 的確認，假設確定骨架正常運作的話，就將每一個骨架資料更新。

從 `Skeleton` 取出的會是一組 `ZigInputJoint` 類型的骨架陣列，裡面儲存著每一個關節的資料。

從這這段程式碼中，我們可以看到 `GoodPosition` 和 `GoodRotation` 兩個檢查，用於確認單一關節是否正常。

> 因為官方並沒有 Unity3D 的文件，因此上述的描述多以「程式碼」與「執行結果」進行假設，推論最接近的答案。

而 `ZigInputJoint` 類型的物件至少會有這三項屬性。

* `Id` - 一個 `ZigJointId` 列舉的值（用來表示關節）
* `Position` - 關節所在的位置
* `Rotation` - 關節旋轉的狀況

### 運用骨架資訊

這個段落，我們將透過 `ZigSkeleton.cs` 的一些範例，製作一個右手關節的簡易物件。
（可以視為 Blockman3rdPerson 的簡化版。）

這個階段會用三個 Sphere（球體）來代表手腕、手肘、肩膀三個關節節點，並且用骨架功能讓這三個節點追蹤玩家右手的變化。

首先，先建立一個新的場景，並且設置好 `Zig` 原件到場景上。
接著製作一個物件群組，並且在裡面放置三個 Sphere（球體）。

![螢幕快照 2014-09-13 下午6.50.04.png](https://user-image.logdown.io/user/52/blog/52/post/233256/Kugv9looSE2uLNOOi3ug_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-09-13%20%E4%B8%8B%E5%8D%886.50.04.png)

物件群組可以利用空物件來製作，為了方便辨識我製作了三種顏色的材質球放到不同的關節。
（從肩膀開始剛好是 Red > Green > Blue 的順序。）

我們一共需要兩個程式來輔助我們實作骨架的功能，一個是 `TrackUser.sc` 用來追蹤使用者並且分派骨架，另一個則是 `SimpleSkeleton.cs` 用來搜集從 Zigfu 拿到的骨架資料，更新對應的物件。

以下是 `TrackUser.cs` 的程式碼，解釋用註解的方式寫在裡面。

```cs TrackUser.cs
public class TrackUser : MonoBehaviour {
	
  // 骨架物件（上面套有 SimpleSkeleton 元件的物件）
	public GameObject skeletonObject;
  // 追蹤的使用者（因為我們只要一個玩家，所以只存單筆資料）
	public ZigTrackedUser trackingUser;

	// Use this for initialization
	void Start () {
  	// 向 Zigfu 登記更新時要通知這個元件
		ZigInput.Instance.AddListener (gameObject);
	}

	void Zig_UserLost(ZigTrackedUser user)
	{
		if (user == trackingUser) { // 如果遺失的使用者是追蹤中的使用者
			trackingUser = null; // 解除追蹤使用者狀態
		}
	}
	
	void Zig_Update(ZigInput input)
	{
		if (trackingUser != null) { // 如果已經追蹤使用者
			return; // 那麼不做任何事情
		}

		foreach (ZigTrackedUser user in input.TrackedUsers.Values)
		{ // 讀取追蹤中的使用者
			trackingUser = user; // 第一個讀取到的使用者被追蹤
			trackingUser.AddListener(skeletonObject); // 將骨架物件套用到使用者上
			break;
		}
	}
}
```

裡面較為特別的地方是 `ZigTrackedUser` 也有 `AddListener` 這個方法。
簡單來說 `ZigInput.Instance` 做 `AddListener` 後，被登記的物件可以用 `Zig_Update` 收到訊息。
而 `ZigTrackedUser` 做 `AddListener` 後，被登記的物件可以用 `Zig_UpdateUser` 收到訊息。

因此要注意，物件是否被加入到正確的 Zigfu 物件中。

![螢幕快照 2014-09-13 下午9.14.51.png](https://user-image.logdown.io/user/52/blog/52/post/233256/cw19asWlSVqmV57lkJor_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-09-13%20%E4%B8%8B%E5%8D%889.14.51.png)

之後把這個語法附加到 Zigfu（跟 Zig 元件相同的物件上）就可以了，上圖已經預先將骨架物件放進去了！

至於 `SimpleSkeleton.cs` 的內容如下，一樣將解釋寫在裡面。

```cs SimpleSkeleton.cs
public class SimpleSkeleton : MonoBehaviour
{

	// 對應關節的物件
	public GameObject Hand;
	public GameObject Elbow;
	public GameObject Shoulder;

	// 縮放，基本上要照遊戲的比例尺設定
	public Vector3 Scale = new Vector3 (0.001f, 0.001f, 0.001f);

	// 更新物件坐標的處理器
	void UpdatePosition(GameObject node, Vector3 position)
	{
  	// 將物件坐標調整為正確比例
		Vector3 dest = Vector3.Scale (position, Scale);
    // 更新物件坐標（使用 Lerp 讓變化是比較平滑的）
		node.transform.localPosition = Vector3.Lerp (node.transform.localPosition, dest, Time.deltaTime * 50f);
	}

	void Zig_UpdateUser (ZigTrackedUser user)
	{
		if (user.SkeletonTracked) {

			foreach(ZigInputJoint joint in user.Skeleton) {
      	// 因為只使用三個關節，所以直接比對
				if(joint.Id == ZigJointId.RightHand) {
					UpdatePosition(Hand, joint.Position); // 透過更新坐標處理器更新
				}
				if(joint.Id == ZigJointId.RightElbow) {
					UpdatePosition(Elbow, joint.Position);
				}
				if(joint.Id == ZigJointId.RightShoulder) {
					UpdatePosition(Shoulder, joint.Position);
				}
			}
		}
	}
}

```

整體來說並沒有什麼特別的地方，這邊省略了旋轉的處理，詳細的做法可以參考 `ZigSkeleton.cs` 的內容。
比較需要注意的是，這裡使用的是 `localPosition` 並且沒有與物件的基礎坐標做修正。
（`localPosition` 會受到上層物件的位置影響）

![螢幕快照 2014-09-13 下午9.24.29.png](https://user-image.logdown.io/user/52/blog/52/post/233256/4XxDPQlfTfmhYhDHSVN1_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-09-13%20%E4%B8%8B%E5%8D%889.24.29.png)

接下來對骨架物件設定，完成後就能夠看到右手的肩膀、手肘、手腕三個關節依照 Kinect 照到的位置做出改變。
剩下的骨架控制就需要依照情況去儲存不同狀態、時間的骨架，並且做出對應的反應。

這篇文章到此告一段落，下一篇文章會是這一系列的最後一篇。
我會把 Zigfu 提供的一些輔助像是揮手、舉手這類預先設定好的工具詳細的介紹給大家，如果遊戲只需要基本的操作的話，某方面來說其實就非常夠用了！
