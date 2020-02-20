---
layout: post
title: 'Unreal Engine 4 - 用 C++ 自訂 Pawn 物件'
date: 2014-10-05 06:40
comments: true
tags: [遊戲, 筆記, UnrealEngine]
---
雖然 MRuby in C# 系列暫時沒辦法繼續撰寫，但是 Unreal Engine 4 系列大概會在畢業製作完成之前，陸陸續續地以筆記的形式更新出來。

實際上，用 Unreal Engine 4 開發遊戲是不太需要用 C++ 來處理的，內建的 Blueprints 功能就具備非常優質的設計，也算是整個引擎中不論美術、程式都會經常接觸的功能。其特色就是人人都能懂，美術可以用來控制動畫、程式可以用來設計 AI 跟遊戲，上手的難度也非常低。

那麼，會遭遇使用 C++ 來處理的情況是什麼呢？

基本上可以分成兩種，第一種就是效能問題，目前還沒有碰過，不過以 C++ 撰寫的程式碼肯定會比較順暢（雖然我很懷疑 Blueprints 所編譯的成品就能產生接近 C++ 等級的效能）

第二種則是 Unreal Engine 初期沒有考慮到，或者還未支援的的部分。像是在 4.5 的 UMG (Unreal Motion Graphics) 功能推出之前，需要用到 Slate UI 來輔助建構遊戲界面，就勢必得用 C++ 才能解決。

總而言之，這篇文章在討論的就是第二種情況，我們需要的功能還未在 Unreal Engine 4 上面「好好的」運作。

註：程式結構太複雜這點，原本想算進去。不過因為 Blueprints 不論註解還是開 Functions 都能做到，很難用這點來說是一種缺點⋯⋯

<!--more-->

說起來其實蠻幸運的，我們團隊從七月左右開始正式使用 Unreal Engine 4 來製作遊戲，到現在大約十月，中間三個月都還沒有碰到需要使用 C++ 處理的問題。

這個問題其實也不是非常嚴重的問題，主要是考慮到後續維護方便才決定使用 C++ 處理（實際上，單純用 Blueprints 會更好維護，但是在支援之前就只好先忍耐使用 C++ 處理。）

我們團隊的畢業製作項目是一款 3D 的動作遊戲，也因此會有一些怪物需要製作。在 Unreal Engine 4 裏面，一個怪物就是一個 Blueprints （可實體化物件），但是在 Unreal Engine 的原生設計中，基本上是以 FPS 類型（競技類）遊戲在設計的，所以像是這種冒險、打怪的類型，目前還沒有比較好的相容性。

> 官方最初的範例是 FPS 然後有塔防、小品、競速等遊戲，但是這些類型的遊戲大多有一個共通點：怪物（敵人）的種類不多，甚至只要一種改變外觀即可。但是我們的遊戲需要多變的怪物，在顯示血條之類的情況，也會因為身高問題而需要調整，數量多的狀況下會變得繁複。

主要的問題點在於「Blueprints 的繼承，子物件無法更動父物件的『元件』」這件事情上，簡單來說假設我希望調整怪的外觀，就沒辦法做調整（假設用繼承的方式），如果數量不多，用複製的方式其實很快，但是考慮到之後可能加入的數量，還是選擇擴充性較高的方式比較恰當。

> 這邊先不討論還不確定會支援的「Blueprints 產生元件」這個問題，解法其實蠻多種的，目前讓我們困擾的是比較好的解法都會需要透過 C++ 處理。

Blueprints 繼承問題，我個人推測是因為 Constructor（建構子）和繼承的設計與一般程式不同，畢竟在極其類似的「情況」下，用 C++ 所製作的就可以正常被修改。

說了這麼多，我們馬上開始來實作吧！

> 這篇文章的內容主要是 Unreal Engine 官方頻道上教學的內容，我則是針對一些細節的地方做筆記。

#### 新增自訂 Pawn 物件

如果開設的是 Blueprints 專案，也不用擔心，直接使用 `Add Code to Project` 功能即可。

![螢幕快照 2014-10-05 下午9.36.34.png](https://user-image.logdown.io/user/52/blog/52/post/236204/WhdDk1dSx6VVxFsmNJd2_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-10-05%20%E4%B8%8B%E5%8D%889.36.34.png)

之後會跳出選擇繼承的 Class 界面，這邊是要對 Pawn 做擴充所以就選擇 Pawn 這個 Class（當然，你可以依照需要選擇任何 Class）

![螢幕快照 2014-10-05 下午9.36.45.png](https://user-image.logdown.io/user/52/blog/52/post/236204/0HDwZSTQ3qqTMpe36Lmw_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-10-05%20%E4%B8%8B%E5%8D%889.36.45.png)

最後輸入 Class 的名稱即可

![螢幕快照 2014-10-05 下午9.37.08.png](https://user-image.logdown.io/user/52/blog/52/post/236204/argRnxXcTgOt1v8llrgu_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-10-05%20%E4%B8%8B%E5%8D%889.37.08.png)

> 在 Unreal Engine 4 中，Class Name 需要有 U 或者 A 的前置詞。
> 大致上就是 A 屬於「可放置於場景」的物件，而 U 屬於「無法放置於場景」的物件（需要依附在 Actor 上）
> 詳細請參考[官方文件](https://docs.unrealengine.com/latest/INT/Programming/UnrealArchitecture/Reference/Classes/index.html)

引擎中可以直接開啓 Visual Studio 或者 XCode 透過這個功能可以很快的開啟程式專案。

![螢幕快照 2014-10-05 下午9.37.36.png](https://user-image.logdown.io/user/52/blog/52/post/236204/WcqXaPNsRmGJGPsJvfu4_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-10-05%20%E4%B8%8B%E5%8D%889.37.36.png)

剛開啟的 XCode 專案預設不是建置給編輯器的版本，需要先修改一下。

![螢幕快照 2014-10-05 下午9.38.08.png](https://user-image.logdown.io/user/52/blog/52/post/236204/9xZ58RUlScvUzrhxCKIg_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-10-05%20%E4%B8%8B%E5%8D%889.38.08.png)

> 之後按下 Ctrl(Cmd) + B 建置就可以產生 DLL 檔了！
> 在 Unreal Engine 4.5 會支援 Hot Reload 所以不用重新開啟編輯器，在這之前每次建置都是要重開的，請注意。

### 基本的 Unreal Engine Class 結構

Unreal Engine 4 是個很龐大的專案，完整編譯大概會花上 10 ~ 30 分鐘（我用 i7 的 4000 系列，也需要快二十分鐘，總之非常久。）因此目前我也無法從 Github 上了解任何脈絡，只知道使用了 Mono 技術，以及一些客製化的編譯行為。

> Unreal Engine 基本上會先產生一個叫做 Unreal Build Tool 的檔案，並且用 Mono 執行它，再用這個工具產生可能是「Unreal Engine 4 專用程式碼」的東西才編譯。
> 因為太過神奇所以就不多做討論，不過推測裏面有著跟 Mono 息息相關的跨平台編譯技術吧⋯⋯（之後可能會在 MRuby in C# 系列討論到這個問題）

總之，先來看看 Header 檔是怎樣的情況。

```cpp MyPawn.h
#pragma once

#include "GameFramework/Pawn.h"
#include "MyPawn.generated.h"

/**
 * 
 */
UCLASS()
class EXAMPLEFPS_API AMyPawn : public APawn
{
	GENERATED_UCLASS_BODY()

	
	
};
```

Unreal Engine 4 其實很複雜，為了讓開發人員可以快速的撰寫新的程式碼而不需要多加考慮如何讓 Blueprints 相容，所以做了不少 Marco 輔助我們。

第一個是 `UCLASS()` 巨集，不用多想基本上就是表示這是個 Unreal Engine 的 Class⋯⋯
接下來是 `EXAMPLEFPS_API` 是由你的專案名稱決定的，至於做什麼用我不清楚，但是 Unreal Engine 4 的原始碼也有類似的部分，應該讓 Unreal Build Tool 獲取什麼資訊之類的吧 XDD

> 推測是相容 Windows 的 DLL 必須使用 dllexport 定義的設計。

最後是 `GENERATED_UCLASS_BODY()` 大致上跟 `UCLASS()` 一樣，從名稱來看應該就是產生 Unreal Engine Class 所需的一些內容。

> 大家可能會很在意 `#include "MyPawn.generated.h"` 這個，像是 XCode 還會警告說這個檔案找不到。
> 不過不需要太緊張，在 Unreal Engine 4 編譯的時候會自動產生，這大概就是 Unreal Build Tool 的功能之一。

```cpp MyPawn.cpp
#include "ExampleFPS.h"
#include "MyPawn.h"


AMyPawn::AMyPawn(const class FPostConstructInitializeProperties& PCIP)
	: Super(PCIP)
{

}
```

Cpp 檔案就簡單很多，裡面只有一個建構子。

傳入的 PCIP 參數主要是用來跟 Unreal Engine 互動的，像是讓 Unreal Engine 的 Console 輸出訊息、產生物件等等。

### 加入自訂屬性

我們可以修改 `MyPawn.h` 然後在 `GENERATED_UCLASS_BODY()` 後面加入一些程式碼。

```cpp MyPawn.h
// 略

GENERATED_UCLASS_BODY()

UPROPERTY(EditAnyWhere, BlueprintReadWrite, Category = Attribute)
int32 Health;
    
UPROPERTY(VisibleDefaultsOnly, BlueprintReadOnly, Category = Component)
TSubobjectPtr<UCapsuleComponent> BaseCollider;
    
UPROPERTY(VisibleDefaultsOnly, BlueprintReadOnly, Category = Component)
TSubobjectPtr<UStaticMeshComponent> BaseMesh;

// 略
```

首先，我們可以看到叫做 `UPROPERTY()` 的巨集，基本上設定之後就可以在 Unreal Engine 裡面看到。

> 不過單純加上 UPROPERTY() 基本上沒有什麼意義，還需要對其設定 Meta 後才能夠在 Blueprint 之類的地方正常使用
> 詳細請參考[官方文件](https://docs.unrealengine.com/latest/INT/Programming/UnrealArchitecture/Reference/Properties/index.html)

`EditAnyWhere` 就是可以在「屬性視窗」中被編輯。
`VisibleDefaultsOnly` 則是只能在「屬性視窗」被看到，但是無法編輯。
`BlueprintReadWrite` 跟 `BlueprintReadOnly` 簡單說就是在 Blueprint 中，是否可以被修改，或者單純只能被讀取。
`Category=` 則是設定分類（預設就非常多項目，設定分類可以加快找到設定項）

除了預設的類型外，也可以指定一些 Unreal Engine 支援的類型。

`TSubobjectPtr` 目前我找不到說明（另外 C++ 沒有學好）只知道這應該是一個有使用 Template 概念的動作。

> 至於 Subobject 這個類型，推測應該就是附加在 Actor 上面的元件（主要是，不能確定有這以外的形態）
> 現在還沒有遇到需要深入了解的情況，至少可以從命名上很簡單的了解是一個 Pointer （指標）

這邊加入一個 `Health` 屬性，用來儲存生命值。

> 在 Unreal Engine 4 的命名習慣除了 Boolean 變數會加上 `b` 的 Prefix 之外，都習慣以大寫開頭。

我另外加入兩個屬性，一個用於 Pawn 的碰撞，另一個則是 Pawn 的模型。

### 初始化物件

```cpp MyPawn.cpp

#include "ExampleFPS.h"
#include "MyPawn.h"


AMyPawn::AMyPawn(const class FPostConstructInitializeProperties& PCIP)
	: Super(PCIP)
{
    Health = 100;
    
    BaseCollider = PCIP.CreateDefaultSubobject<UCapsuleComponent>(this, TEXT("BaseCollider"));
    RootComponent = BaseCollider;
    
    BaseMesh = PCIP.CreateDefaultSubobject<UStaticMeshComponent>(this, TEXT("BaseMesh"));
    BaseMesh->AttachTo(RootComponent);
}

```

這邊的建構子產生的設定會成為 Blueprint 的「預設值」也就是說，在使用 Blueprint 繼承的時候，還能夠對這些設定做修改（不過是否能修改，還是取決於 Header 的 `UPROPERTY()` 裡面的設定。）

前面提到的 `PCIP` 這邊使用 `CreateDefaultSubobject` 來產生一個 `Subobject` 根據文件上來看，基本上沒有特殊意義（遊戲、編輯器都可以使用的 Subobject 就是這樣使用。）

`this` 這邊是指目前這個物件（`UObject` 就是 Unreal Engine 的物件），簡單說就是產生一個 `Subobject` 到目前這個物件裡面（這邊產生的是元件）

關於 `CreateDefaultSubobject` 的說明可以參考[官方文件](https://docs.unrealengine.com/latest/INT/API/Runtime/CoreUObject/UObject/FPostConstructInitializeProperti-/index.html)的說明。

> 閱讀官方文件的技巧就是，盡力的「搜尋」吧！我到現在都還沒辦法抓到閱讀的訣竅，因為量太大了，搜尋比較實在⋯⋯

`TEXT()` 巨集，很明顯的就是產生 Unreal Engine 可以接受的字串，應該是不用太多說明。

`RootComponent` 應該是預設的屬性，在 Unreal Engine 中元件是有階層關係的（像是把攝影機附加在角色上面，直接做出追蹤角色的攝影機功能）而這個則是根節點，這邊把預設的 Collider 設定上去。

`AttachTo` 方法則是將目前這個元件附加到某一個元件上（簡單說是由 Child 決定要誰當 Parent XDD）

### 編譯與測試

按下 Ctrl(Cmd) + B 然後重新開啟 Unreal Engine 看看我們的成果吧！

新增 Blueprint 的時候可以找到剛剛加入的 `MyPawn`
![螢幕快照 2014-10-05 下午10.46.44.png](https://user-image.logdown.io/user/52/blog/52/post/236204/eztME94VQ8CEc37JziVg_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-10-05%20%E4%B8%8B%E5%8D%8810.46.44.png)

編輯屬性的地方會發現剛剛增加「可編輯」的 `Health` 屬性出現了（並且在正確的分類下）
![螢幕快照 2014-10-05 下午10.47.17.png](https://user-image.logdown.io/user/52/blog/52/post/236204/dEnYlpQTYC3JZ0W0aGP1_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-10-05%20%E4%B8%8B%E5%8D%8810.47.17.png)

元件也多出剛剛增加的預設元件（並且可以修改其屬性）
![螢幕快照 2014-10-05 下午10.47.42.png](https://user-image.logdown.io/user/52/blog/52/post/236204/tpMWb91hSPGkjVrap6AM_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202014-10-05%20%E4%B8%8B%E5%8D%8810.47.42.png)

這樣一來，就算是完成自訂 Pawn 的第一步了！

像是 `ApplyDamage` 之類的方法，也都可以在 C++ 中實做，不過這些有時間再繼續研究吧！

### 小結

Unreal Engine 4 單純使用 Blueprint 其實可以很快樂，雖然要摸熟的地方蠻多的，不過熟悉之後就很好上手。
但是一旦進入 C++ 的層次，實在是太複雜拉！可以的話，建議初學者避免使用 C++ 開發，先熟悉 Blueprint 之後在考慮學習 C++ 版本的開發，這對一般使用者來說要搞懂的東西太多、太複雜了，一時之間是很難學會的⋯⋯

> 不過如果是老闆要求（同學要求），那我們就只好哭哭的學會拉⋯⋯
