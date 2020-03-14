---
layout: post
title: 'Unreal Engine 4 的自動化測試'
publishDate: 2015-06-12 07:26
comments: true
tags: [UnitTest, 筆記, UnrealEngine]
---
最近幾年做測試似乎變成一個非常熱門的議題，而且也逐漸的被大多開發者了解到做測試的優點。不過，一般的軟體可以做測試倒是沒有什麼問題，那麼遊戲該怎麼做測試呢？

我自己認為這是一個很難探討的問題，大部份的遊戲就基於不確定性而變得有趣。在充滿不確定的情境下，要做測試就變得非常困難了。

不過，還是有像是基本的公式計算、數值檢查等等可以做基本的檢查，雖然無法完全的對遊玩上做完整的測試。但是至少可以確保功能上與數值上是以正確的數值做計算。

那麼，就來談談 Unreal Engien 4 的自動化測試工具 `Automation Tools` 吧！

<!--more-->

根據[官方文件](https://docs.unrealengine.com/latest/INT/Programming/Automation/index.html)的介紹，一共有五種功能包含在這個工具內。

* Unit Test - 單元測試
* Feature Test - 功能測試
* Smoke Test - 快速測試（我認為是這樣翻譯）
* Content Stress Test - （內容）壓力測試
* Screen Shot Comparison - 截圖比較

不過我個人認為前面三種類似都很相似，而在 Unreal Engine 裡面硬要去區分似乎也是有點困難的。

> 像是 Unit Test 的範例，使用的是 Somke Test 的模式

### 撰寫測試

這部分的測試比較接近 Unit Test 的形式，主要是針對遊戲中的 API 做測試。

首先，我們要在 `[Project]/Private` 目錄下新增一個 `Tests` 目錄，預設的測試檔案都會從這個目錄偵測。

> 官方並沒有指出修改目錄的方式，因此也只能這樣使用。

假設我要測試的是名為 `NPCTalk` 的功能，我的測試檔名就命名為 `NPCTalkTest.cpp` 基本上跟大部份的測試工具一樣。

```cpp Private/NPCTalk.cpp
// 假設有一個 NPCTalk 的 Class 實作了一個 speak() 的靜態方法
FString NPCTalk::speak() {
	return TEXT("Hello World!");
}
```

那麼，我們的測試檔案就可以這樣寫。

```cpp Private/Tests/NPCTalkTest.cpp
#include "NPCTalk.h"
#include "AutomationTest.h"

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FNPCTalkTest, "NPC.Talk.Speak", EAutomationTestFlags::ATF_SmokeTest);

bool FNPCTalkTest::RunTest(const FString &Parameters)
{
	TestEqual(TEXT("NPC should says: Hello World!"), NPCTalk::speak(), TEXT("Hello World!"));
  
  return true;
}
```

如此一來，當我們執行測試的時候，就可以檢查傳回的字串是否跟預期的一項是否為 `Hello World!` 了！

`IMPLEMENT_SIMPLE_AUTOMATION_TEST` 是預先寫好的巨集，用來幫助我們產生測試用的 Class 參數依序為：名稱、識別名稱（會在 Frontend 上顯示）、測試類型。

測試類型基本上分為：遊戲、編輯器、命令列三種，詳細的請參考 [AutomationTest.h](https://Github.com/EpicGames/UnrealEngine/blob/8a80b5541f69a79abf5855668f39e1d643717600/Engine/Source/Runtime/Core/Public/Misc/AutomationTest.h) 這個檔案。

這邊強烈建議用有自動補全的編輯器，因為官方文件基本上完全都沒有解釋使用的方式。

### 對 Actor 做測試

這部分就比較接近功能測試，用來檢測某些物件是否正常。不過缺點就是要做這些測試通常只有兩個選項，直接在遊戲地圖測試，或者製作專用的測試地圖。

> 這要依照測試情境去決定，像是只是要測試某一種類的怪是否正常，卻得把場景上數百隻怪都測試一遍，除了費時之外也很不方便。

```cpp Private/MyActor.cpp
#include "MyActor.h"


// Sets default values
AMyActor::AMyActor()
{
 	// Set this actor to call Tick() every frame.  You can turn this off to improve performance if you don't need it.
	PrimaryActorTick.bCanEverTick = true;

}

// Called when the game starts or when spawned
void AMyActor::BeginPlay()
{
	Super::BeginPlay();
	
}

// Called every frame
void AMyActor::Tick( float DeltaTime )
{
	Super::Tick( DeltaTime );

}

float AMyActor::CalcDamage() {
    float randRatio = FMath::FRandRange(0.8, 1.2);
    return 100.0f * randRatio;
}
```

這邊我寫了一個簡易的 Acotr 並且時做了一個叫做 `CalcDamage` 的方法，隨機傳回 80 ~ 120 的傷害數值。
接下來我們會針對場景上所有為 `MyActor` 類型的物件做檢測。

因此，我們需要先創建一張新的地圖，並且把這些 Actor 放進場景。

![螢幕快照 2015-06-12 下午4.30.22.png](https://user-image.logdown.io/user/52/blog/52/post/280172/NBKLYkieR66JMBqZbVVj_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202015-06-12%20%E4%B8%8B%E5%8D%884.30.22.png)

如上圖所示，我在一張叫做 `TestMap` 的地圖中放置了三個類型是 `MyActor` 的物件。
接下來存擋即可，這樣我們就可以針對這三個物件做測試了！

```cpp Private/Tests/MyActorTest.cpp
#include "AutomationTest.h"
#include "AutomationCommon.h"
#include "MyActor.h"

DECLARE_LOG_CATEGORY_EXTERN(GameTest, All, All);
DEFINE_LOG_CATEGORY(GameTest);

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FMyActorTest, "MyActor.CalcDamage", EAutomationTestFlags::ATF_Game);

const float ACTOR_DAMAGE = 100.0f;
const float MIN_DAMAGE_RATIO = 0.8f;
const float MAX_DAMAGE_RATIO = 1.2f;

bool FMyActorTest::RunTest(const FString &Parameters)
{
    UGameplayStatics::OpenLevel(GWorld, TEXT("TestMap"));
    for(TObjectIterator<AMyActor> ActorIterator; ActorIterator; ++ActorIterator) {
        AMyActor* MyActor = *ActorIterator;
        if(MyActor) {
            float actorDamage = MyActor->CalcDamage();
            bool bIsDamageValid = actorDamage >= (ACTOR_DAMAGE * MIN_DAMAGE_RATIO) &&
                                  actorDamage <= (ACTOR_DAMAGE * MAX_DAMAGE_RATIO);
            TestTrue(TEXT("Damage should in the range 80.0 ~ 120.0"), bIsDamageValid);
        } else {
            UE_LOG(GameTest, Error, TEXT("No My Actor found"));
            return false;
        }
    }
    
    return true;
}
```

基本上就跟前一段的測試差不多，不過這邊將 Flag 限制為 `ATF_Game` 表示只有在 `Standlone Mode` 的時候才能夠運行這個測試（因為 Actor 必須實際在遊戲中執行才能表現出正常的運作）

> 就理論上來說，也許能夠做到像是自動操作玩家打怪這類型的測試。
> AI 可控制的並不限定是一般的怪，玩家也屬於 Pawn 是可被 AI 控制而非玩家的輸入設備（鍵盤、搖桿等）

上述程式碼的寫法是參考 Unreal 論壇的[這篇文章](https://forums.unrealengine.com/showthread.PHP?56106-Need-Help-with-Automation-Testing-in-4-6)去實作的，也是我唯一看到比較完整關於 Automation Tools 的使用範例。

> 直接用 TObjectIterator<TClass> 就可以拿到場景物件蠻神奇的，不過大概就跟一般遊戲執行時呼叫一樣吧 XD

![螢幕快照 2015-06-12 下午4.36.36.png](https://user-image.logdown.io/user/52/blog/52/post/280172/1MYr9nWSYWrgjjpxMK6g_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202015-06-12%20%E4%B8%8B%E5%8D%884.36.36.png)

因為是 `Standlone Mode` 才能執行的測試，我們需要借助 `Unreal Frontend` 去幫我們開啟遊戲。

> 我試過用 Command Line / Editor 去開啟，都無法正常使用，這算是最方便使用的解法了！
> Mac/Windows 都在引擎的 Binaries 目錄下，稍微找一下就可以找到了（一般放在對應的作業系統目錄中）

![螢幕快照 2015-06-12 下午4.38.35.png](https://user-image.logdown.io/user/52/blog/52/post/280172/yufoKsUITMOKSE8vv3Gj_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202015-06-12%20%E4%B8%8B%E5%8D%884.38.35.png)

進去 Project Launcher 分頁，先把左上角的 Project 設定成要測試的專案，然後按下 `Launch` 就會開啟一個獨立的遊戲出來。

![螢幕快照 2015-06-12 下午4.40.15.png](https://user-image.logdown.io/user/52/blog/52/post/280172/JoxJZQ8fSOO82xhjmhY2_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202015-06-12%20%E4%B8%8B%E5%8D%884.40.15.png)

開啟遊戲視窗後，進到 Session Frontend 裡面，選下面的 `Automation` 分頁，再點選 `Find Workers` 確保有抓到目前要測試的遊戲。

> 我的截圖有一個 Instance 是 Timeout 狀態，那是因為我上一次跑完關掉後就會呈現這樣的狀態（無法清除掉蠻痛苦的⋯⋯）

![螢幕快照 2015-06-12 下午4.42.18.png](https://user-image.logdown.io/user/52/blog/52/post/280172/cm2gylD0SSetLA8mgVs2_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202015-06-12%20%E4%B8%8B%E5%8D%884.42.18.png)

勾選好要跑的測試之後（預設只會跑幾個比較快的，一般是 Somke Test）讓他執行，如果順利通過就會像我這樣顯示綠色的。
同時也會發現遊戲地圖會切換到最後一個跑的測試地圖上，簡單說要做這類的測試會很花時間（苦笑）

> 可以看到功能測試佔用的時間很長，搭配持續整合工具（Jenkins）之類的可能可以解決這個問題。
> 昨天參加 Epic Games 的演講，官方人員告訴我是可行的。不過跟自動化測試一樣，很少人討論（折衷方案是利用區網空閒的電腦，丟 Frontend 去跑，但是作業系統不同的關係我無法測試這個方法）

### 小結

目前測試這個功能就到這邊，大致上不難應用。稍微熟悉的話至少能幫遊戲做一部分的測試，我想之後應該能節省掉不少時間吧！

雖然還有像是開發 Plugin 時能不能做測試等等的問題，以及整合 CI 後該怎麼跑，不過就現況來說已經算是讓人挺滿意了！

> 另外就是 Smoke Test 在 Editor 就可以用裡面的 Frontend 跑，不用特地單獨開 Frontend 來跑。
