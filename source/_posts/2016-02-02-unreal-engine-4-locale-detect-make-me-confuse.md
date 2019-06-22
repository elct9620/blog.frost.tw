---
layout: post
title: '微妙的 Unreal Engine 4 語言偵測機制'
date: 2016-02-02 15:43
comments: true
tags: [遊戲, 筆記, UE4]
---
最近因為我們團隊將[遠古神話](https://make.moe)上架到 Steam 上面的關係，收到不少歐美玩家表示需要英文語言的支援。
其實這方面也是當初考慮不周的問題，也剛好碰到了國軍的過年年假有比較多的時間可以處理。

原本預期是一天之內就解決這個問題，不過現實上倒是花了不少額外的功夫去處理。
這也是我們使用 Unreal Engine 4 一直以來的問題，雖然承襲了 UDK 眾多強大的功能，但是卻還未完全的成熟。
從約兩到三個月就會改版一次，而且加入大量功能的情況來看，還有許多需要解決的問題。

> 過去 Epic Games 自己使用也許沒什麼問題，但是當發布成一個工具的時候，就多了非常多細節要處理。

<!-- more -->

事實上，Unreal Engine 4 其實本身就有[本地化](https://docs.unrealengine.com/latest/INT/Gameplay/Localization/index.html)這樣的功能。
一般的文字做翻譯其實非常方便，雖然現在 Localization Dashboard 還是試用階段，但是國外開發者已經在使用而且似乎沒什麼問題，直接在引擎裡面編輯翻譯字串對開發多國語系有非常多的幫助。

不過，首先是我們團隊的教學跟選單都是用圖片製作的。先不談選單，其實教學本身應該要可以用內嵌的字體檔去顯示指定的文字，不過為了讓操作明確，我們使用了 ICON 作為按鍵的提示，反而受限於文字顯示上。

> 這個決定其實讓部分外國玩家能夠順利操作，另一方面國外開發者有嘗試解決這個問題，但是我們使用 UMG 建構的 UI 部分是不支援嵌入圖片的做法。目前其實有考慮使用 Slate 改寫，重新製作過原本的 UI 介面。

那麼，該如何取得目前的系統語言呢？

在 Unreal Engine 4 裡面有一個叫做 [`Internationalization`](https://docs.unrealengine.com/latest/INT/API/Runtime/Core/Internationalization/index.html) 的模組，這個模組包含了引擎中所有與本地化相關的程式碼。

網路上一般的使用方式，是透過 `Internationalization` 模組，取得目前的 `Culture` 設定值，然後獲取對應的語言區域代碼（格式為 `zh-TW` `en-US`這種形式。）
不過很詭異的是，即使在完全新安裝的 Windows 下，還是會拿到 `en` 這個設定值。

稍微追蹤一下 Unreal Engine 4 的原始碼，卻發現 `CurrentCulture` 這個物件似乎是沒有被初始化過的。
而設定目前語言的程式碼，卻是指向另一個物件的實作。

```cpp
  //@return the current culture
	CORE_API FCultureRef GetCurrentCulture() const
	{
		return CurrentCulture.ToSharedRef();
	}
```

```cpp
bool FInternationalization::SetCurrentCulture(const FString& Name)
{
	return Implementation->SetCurrentCulture(Name);
}
```

所以合理推測，目前這部分的實作還不完全。

> 這邊節錄部分程式碼，在 `Internationaliaztion` 的定義中，只有定義 `CurrentCulture` 卻沒有任何賦值或者初始化的動作，當然也可能是在其他地方實作的。

另一方面，也有人採用 Steam API 的方式去偵測語言，以 Steam 玩家的語言作為判斷的基準。
不過這方面需要自己將已經建置好的 Steam Online Subsystem 重新編譯，其中遭遇的問題也不算少（以及要動到引擎實作，或者重新實作過模組）耗費的工程反而很大，而 Visual Studio 會對 Unicode 抱怨（中文系統）還得清理 Steam API Header 中的 Unicode (版權符號) 也是得不償失。

另一方面 Unreal Engine 4 提供了 `PlatformMisc` 模組，可以用來讀取一些系統相關資訊（Ex. CPU 狀態）
在確認原始碼後，也發現了 `GetDefaultLocale` 方法，看起來是很接近目標了！

```cpp
FString FGenericPlatformMisc::GetDefaultLocale()
{
#if UE_ENABLE_ICU
	icu::Locale ICUDefaultLocale = icu::Locale::getDefault();
	return FString(ICUDefaultLocale.getName());
#else
	return TEXT("en");
#endif
}
```

讀取的方式也是以開源專案 ICU 來處理，應該是不會發生什麼問題。
不過現實上，透過使用 `FPlatformMisc::GetDefaultLocale()` 卻拿到了 `en` 的結果。

> 也確認過引擎編譯選項中的 UE_ENABLE_ICU 是開啟的。

就原始碼的實作上來看，直接呼叫 ICU 提供的 API 獲取語言區域代碼，照理說不應該發生問題才對。

最後，在 Unreal Engine 4 每次啟動時，都會執行 `Survery` 對作業系統進行調查，從 Windows 的部份發現了這段程式碼。

```cpp
// OS language
	LCID DefaultLocale = GetSystemDefaultLCID();
	const int32 MaxLocaleStringLength = 9;
	TCHAR LangBuffer[MaxLocaleStringLength];
	int LangReturn = GetLocaleInfo(DefaultLocale, LOCALE_SISO639LANGNAME, LangBuffer, ARRAY_COUNT(LangBuffer));
	TCHAR CountryBuffer[MaxLocaleStringLength];
	int CountryReturn = GetLocaleInfo(DefaultLocale, LOCALE_SISO3166CTRYNAME, CountryBuffer, ARRAY_COUNT(CountryBuffer));
```

看起來是呼叫 Windows API 直接取得，經過測試後只有這部分是正常運作的。
不過很可惜的，並沒有時做任何 API 可以呼叫這段程式碼，只能靠自己食做一份相似的版本。

> Survery 會偵測 CPU、顯卡等資訊，推測是每次啟動時的記錄檔生成。

---

後記，在寫這篇文章的時候注意到 `Culture` 模組本身有 `GetLCID()` 這個方法，但是礙於筆電剛重灌沒有辦法測試。
後續會在做測試看看實作的狀況，不過語言相關的偵測基本上都還是 ICU 實作的（`Culture` 模組的實作也是透過 ICU 的，若前面 ICU 的錯誤是個意外，也許是可以正常運作的⋯⋯）
