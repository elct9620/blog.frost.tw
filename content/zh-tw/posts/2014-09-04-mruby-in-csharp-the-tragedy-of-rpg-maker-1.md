---
layout: post
title: 'MRuby in C# - 因 RPG Maker 的慘劇（一）'
publishDate: 2014-09-04 03:42
comments: true
tags: [Ruby, C#, 心得, 筆記]
---
最近看到朋友提起 RPG Maker 又勾起我在 Mac 上使用 RPG Maker 的野心，雖然之前用 Wine 順利跑了起來，不過既然能寫 Ruby 當然要用各種奇怪的方式去玩弄。

結果，當我發現內建的 Library 要做到我想做的事情很困難的時候，腦抽的我決定自己做一個！

不過，這年頭不跨平台其實還蠻空虛的，所以就從能夠跨平台來做選擇，至於為何會選 Mono 和 C# 大概就是受到 Unity3D 跟 Unreal Engine 4 兩個目前都是非常有名的遊戲引擎影響吧！
（上述兩個引擎都有使用 Mono 來協助實踐跨平台的功能）

<!--more-->

### Ruby vs MRuby

一開始，我就從其他語言呼叫 Ruby 這方面開始著手，不過情況其實不樂觀。
找了不少資料只能找到 [Programing Ruby](https://Ruby-doc.com/docs/ProgrammingRuby/html/ext_ruby.html) 的簡單介紹，以及名為 [SWIG](https://www.swig.org/) 這樣的工具。

雖然有嘗試用過 Programing Ruby 的方式，但是似乎因為某些問題，我的 Herader 檔案是缺少的。
（雖然後面學到 Compile 後可能會增加這些檔案，不過到此我就放棄了 XD）

之後就把目光轉移到適合用在嵌入式系統的 MRuby 了，後來也聽朋友說其實 MRuby 也相對 Ruby 比較容易嵌入。
雖然最近才 1.0.0 版，而且文件其實不多，不過經過後續的摸索，也算是順利能夠使用。

### 番外：C# 與 C

MRuby 與 Ruby 本身是用 C 語言所撰寫的，但是我用來開發的語言是 C# 就本身都是 C 系列的語言來說看似容易結合，不過現實是 C# 需要透過 P/Invoke 的功能來存取 C 語言的功能，也就是說我們必須先把 MRuby 做成一個 Shared Library （動態函式庫）再用 C# 存取即可。

註：另一方面來看因為 Mono 的 P/Invoke 會自動在不同系統上找 .dll, .so 等檔案，在跨平台上的處理也會相對方便，而且能夠輕鬆更新 MRuby 而不影響主程式。

## 挑戰： 運行 Ruby Code 顯示字串

蒼時不懂 C 語言，一切都是誤打誤撞。
蒼時不懂 C 語言，一切都是誤打誤撞。
蒼時不懂 C 語言，一切都是誤打誤撞。

這很重要，所以大家先跟我念三次噢 XDDD

---

原本這篇文章還想寫到定義 Class, Module 跟 Method 的，不過就情況來看，應該是講不到 XD
總之，我們要先來將產生字串的功能完成。

### 編譯 MRuby 與建構動態函式庫

編譯 MRuby 除了基本的編譯工具外，大致上就是需要一個 Ruby 環境。
如果跟我一樣是 Mac 使用者，而且安裝的是 [RVM](https://rvm.io) 那應該是不用多作處理。

> git clone https://Github.com/mRuby/mruby.git
> cd mRuby
> Ruby ./minirake

編譯就這樣，簡單到你覺得根本不可能。

不過因為 Mono 目前只能跑 32bit 的關係（好像是 Mac/Linux 上的限制！？）所以我們需要讓 `libmRuby.a` 這個靜態函式庫有 32bit 的版本。

修改 `build_config.rb` 這個檔案，最底下已經有先寫好 32bit 的設定。

``` rb build_config.rb
# 略
# 解除下面這些的註解狀態
MRuby::CrossBuild.new('32bit') do |conf|
  toolchain :gcc

  conf.cc.flags << "-m32"
  conf.linker.flags << "-m32"

  conf.build_mrbtest_lib_only

	# 預設會編譯範例的 Gem 可以自己擴充
  # conf.gem 'examples/mrbgems/c_and_Ruby_extension_example'
  conf.gembox 'default' # 手動加入這行，確保預設的核心 Gem 都有被編譯

  conf.test_runner.command = 'env'

end
```

之後開一個 C 的 Shared Library 專案即可。
要記得的是，連結的靜態函式庫，要把 `libmRuby.a` 跟 `libmruby_core.a` 都引用進來。
`libmRuby_core.a` 是選用的，但是裡面會包含像是 `p`, `puts`, `<<` 等大家常使用的功能。

至於主要的 C 檔案，現在只要把對應的 Header 引用進來就可以用了！

```c main.c
#include <mRuby.h>
#include <mRuby/string.h>
#include <mRuby/compile.h>
#include "main.h"
```

> Linker 在 Mac 要用 `-Wl,-force-load` 而 Linux 則用 `-Wl,-while-archive` 則可以把整個 Static Library 包進 Shared Library

### 建立 MrbValue 資料結構


而這個 MrbValue 基本上也是 C# 裡面唯一一個需要特別實作的結構，其他的即使不實作，也是能夠正常運作的。
（雖然這是以我研究進度為基準，但是大致上就是這樣的狀況⋯⋯）

在 MRuby 封裝 `mrb_value` 結構的方式有三種，但是一般用到的是下面這種。
（基於我不懂重複定義的用意，所以並沒有深入探討背後在 C 的原理）
``` c include/mRuby/boxing_no.h
typedef struct mrb_value {
  union { // 變數資料本體
    mrb_float f;
    void *p;
    mrb_int i;
    mrb_sym sym;
  } value;
  enum mrb_vtype tt; // 變數型別的列舉
} mrb_value;
```

基本上只要照上面的結構在 C# 實作就可以了，不過當時我因為`union`被卡了很久。
粗略來看，這個 mrb_value 應該會是約 (( (4 or 8) + 4 + 4 + 2) + 4) = 18 ~ 22 左右的大小。

> mrb_float / mrb_int 這些的大小，是在編譯時決定的，我使用預設定義狀況下是 mrb_float = double 所以實際上是 8bytes
> 就我用 sizeof 的計算，整個 mrb_value 只有 12bytes 但是實際上加起來肯定不是。
> 問題就在 union 的性質（我不清楚，但是它能夠有效地運用記憶體空間就對了 XD）

在 C# 實作這個結構，只要「正確的」描述，就可以正常運作（正確的狀況下，大小也該是一樣的）
不過，大小剛好一樣，結構卻有誤差的時候，就會出現可以運作但是哪裡很奇怪的狀況。
（這很有趣，我第一次成功就是這個狀況，後來是因為 Type 無法正確抓取才發現的 XD）

從 C 轉換的 struct 需要用 StructLayou 標示結構的相關資訊，一般來說 Sequential 不需要多做設定，基本上視為一般的結構即可。

而 Explicit 則是類似于 `union` 的結構，特別的地方在於要指定 `FieldOffset` 這個設定值。
（這部分文章我沒有細看，至少 `mrb_value` 本身都剛好對齊在 0 的位置，不需要多做設定。）

``` cs MrbValue.cs
using System;
using System.Runtime.InteropServices;

namespace MRuby
{
	
	[StructLayout (LayoutKind.Sequential)]
	public struct MrbValue
	{
  	// 巢狀的結構，盡可能跟 C 的相同
		[StructLayout (LayoutKind.Explicit)]
		public struct Value
		{
			[FieldOffset (0)]
			public double f;
			[FieldOffset (0)]
			public IntPtr p;
			[FieldOffset (0)]
			public int i;
			[FieldOffset (0)]
			public short sym;
		}

		public Value value; // 雖然已經定義，但是這邊還是要標明
		public Type type; // 我另外建了一個列舉用來儲存，之後可以在不轉換的前提下判斷直接型別

	}
}
```

下面是列舉，其實就是直接從 `include/mRuby/value.h` 複製 C 的列舉變成 C# 列舉而已，很簡單。

``` cs Type.cs
using System;

namespace MRuby
{
	public enum Type
	{
		MRB_TT_FALSE = 0,   /*   0 */
		MRB_TT_FREE,        /*   1 */
		MRB_TT_TRUE,        /*   2 */
		MRB_TT_FIXNUM,      /*   3 */
		MRB_TT_SYMBOL,      /*   4 */
		MRB_TT_UNDEF,       /*   5 */
		MRB_TT_FLOAT,       /*   6 */
		MRB_TT_CPTR,        /*   7 */
		MRB_TT_OBJECT,      /*   8 */
		MRB_TT_CLASS,       /*   9 */
		MRB_TT_MODULE,      /*  10 */
		MRB_TT_ICLASS,      /*  11 */
		MRB_TT_SCLASS,      /*  12 */
		MRB_TT_PROC,        /*  13 */
		MRB_TT_ARRAY,       /*  14 */
		MRB_TT_HASH,        /*  15 */
		MRB_TT_STRING,      /*  16 */
		MRB_TT_RANGE,       /*  17 */
		MRB_TT_EXCEPTION,   /*  18 */
		MRB_TT_FILE,        /*  19 */
		MRB_TT_ENV,         /*  20 */
		MRB_TT_DATA,        /*  21 */
		MRB_TT_FIBER,       /*  22 */
		MRB_TT_MAXDEFINE    /*  23 */
	}
}
```

到這裡，我們就完成了 MrbValue 的建構，也能夠順利儲存從 MRuby 傳回的 `mrb_value` 資料了！

註：主要會需要建構是因為，除了 MrbValue 之外，其他結構大多會用指標方式儲存，假設不管細節的話，單純用 C# 的 IntPtr 儲存就不會出錯，只會有難以辨識目前使用的是什麼的指標的問題。

### 產生可運行 Ruby 的環境

首先，我們要產生 `mrb_state` 基本上可以把它視為一個 Ruby 的執行（irb 出來的感覺）一旦 Close 掉，原本在裡面跑的東西、定義的方法都會被釋放掉。

```cs Program.cs
using System;
using System.Runtime.InteropServices;

namespace MRuby {
	public class Program {
  
		// 也可以指定副檔名，不過這樣就不能對應各種平台（在 Mac 也可以用 .so 不用刻意編譯 dylib）
  	public const string LIBMRUBY = "libmRuby"; // libmruby.dll > libmruby.dylib > libmruby.so
  
		[DllImport(LIBMRUBY, EntryPoint="mrb_open")] static extern IntPtr MrbOpen();
		[DllImport(LIBMRUBY, EntryPoint="mrb_close")] static extern void MrbClose(IntPtr state);
		public static void Main(string[] args)
		{
			IntPtr state = MrbOpen();
      // 這個區段可以執行任何 Ruby Code
      MrbClose(state); 
		}
	}
}
```

我個人的習慣會對不同語言做調整，所以在 C# 裡面，我也盡可能配合 C# 習慣的命名方式。

註：大家會發現跟 C 有關的檔案會用 System.Runtime.InteropServices 這個 Package 基本上就是這樣 XD

### 從字串執行 Ruby 程式

在 MRuby 裡面有提供非常簡單執行程式的方法，那就是 `mrb_load_string` 執行後會回傳一個 `mrb_value` 至於值是什麼，就看最後一行是什麼，像是 String, Fixnum 等等⋯⋯

註：如果出錯（例外、方法找不到等等）會傳回 False 需要另外用 `mrb_state` 指標的 `exc` 來捕捉，因為還沒有研究到，這邊也暫時不會碰到，所以就暫時不討論 

```cs Program.cs
using System;
using System.Runtime.InteropServices;

namespace MRuby {
	public class Program {
  	public const string LIBMRUBY = "libmRuby"; // libmruby.dll > libmruby.dylib > libmruby.so
  
		[DllImport(LIBMRUBY, EntryPoint="mrb_open")] static extern IntPtr MrbOpen();
		[DllImport(LIBMRUBY, EntryPoint="mrb_close")] static extern void MrbClose(IntPtr state);
    
		[DllImport(LIBMRUBY, EntryPoint="mrb_load_string")] static extern MrbValue MrbLoadString(IntPtr state, string code);
		public static void Main(string[] args)
		{
			IntPtr state = MrbOpen();
	
      MrbValue returnValue = MrbLoadString(state, "'Hello World'"); // 執行 Ruby
			// 接下來對 returnValue 做各式各樣的事情（笑
      
      MrbClose(state); 
		}
	}
}
```

### 將 MrbValue 轉為 C# String

首先，我們要先搞清楚一件事情，就是 C# 從 C 收回來的字串都是 `char *` 的字元指標陣列，因此是沒辦法像是前面把 `string` 直接丟到 C 裡面這樣使用喔 XD

```cs Program.cs
using System;
using System.Runtime.InteropServices;

namespace MRuby {
	public class Program {
  	public const string LIBMRUBY = "libmRuby"; // libmruby.dll > libmruby.dylib > libmruby.so
  
		[DllImport(LIBMRUBY, EntryPoint="mrb_open")] static extern IntPtr MrbOpen();
		[DllImport(LIBMRUBY, EntryPoint="mrb_close")] static extern void MrbClose(IntPtr state);
    
		[DllImport(LIBMRUBY, EntryPoint="mrb_load_string")] static extern MrbValue MrbLoadString(IntPtr state, string code);
    
		[DllImportAttribute(RubyContext.LIBMRUBY, EntryPoint="mrb_obj_as_string")] static extern MrbValue MrbObjectToString(IntPtr state, MrbValue obj);
		[DllImportAttribute(RubyContext.LIBMRUBY, EntryPoint="mrb_string_value_ptr")] static extern IntPtr MrbStringPointer(IntPtr state, MrbValue obj);
		public static void Main(string[] args)
		{
			IntPtr state = MrbOpen();
	
      MrbValue returnValue = MrbLoadString(state, "'Hello World'"); // 執行 Ruby
			MrbValue stringValue;
      if(returnValue.type == Type.MRB_TT_STRING) { // 是字串就不用管了 XD
      	stringValue = returnValue;
      } else {
      	stringValue = MrbObjectToString(state, returnValue); // 大部分 MrbValue 都可以 to_s
      }
      IntPtr stringPtr = MrbStringPointer(state, stringValue); 
      Console.WriteLine(Marshal.PtrToStringAuto(stringPtr)); // 用 C# 的指標轉自串輔助工具，選 Auto 會自動支援 Unicode 的內容
      
      MrbClose(state); 
		}
	}
}
```

然後，就可順利在 Console 裡面看到執行的內容拉！
如果有興趣，也可以利用 C# 的 `@" multi-line string"` 寫一些簡單的 Ruby 放到裡面使用。

下一篇文章會討論 Define Module / Class 和為他們增加 Method 的方法。
