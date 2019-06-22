---
layout: post
title: 'MRuby in C# - 因 RPG Maker 的慘劇（二）'
date: 2014-09-28 04:15
comments: true
tags: [Ruby, C#, 心得, 筆記]
---
前一篇文章討論了關於 C# 執行一段 Ruby 程式碼並且取得執行結果（字串）的做法。
不過，光是這樣在 C# 使用 MRuby 的意義並不大，我們需要結合 Ruby 的 DSL 特性，讓自製的 RPG Maker 可以更加簡單的被用於製作遊戲（最終目的）

也因此，我們需要能夠讓 C# 中的一些 API 可以在 Ruby 中被呼叫以及使用。
那麼，能夠從 C# 定義 Ruby 的 Module / Class 和 Method 就非常的重要，因為如果無法這樣做，那麼就無法讓 Ruby 執行 C# 的程式碼。

<!-- more -->

#### Mono v.s. Qt
在開始之前，先來談談一個被我遺忘的跨平台工具 **Qt**。要說的話，其實 Qt 看起來會比 Mono 有更好的相容性在 MRuby 上（使用 C++ 就不會有 C# 的 P/Invoke 和 Marshal 要複製一份記憶體資料的問題）

於是我就去安裝了一下 Qt5 來測試，不過很不幸的是預設的範例專案有不少問題，讓我花了一個多小時才勉強啟動，體驗比我在去年使用的時候更差，讓我難以想像之後的開發是否會順利。

* 問題大致上有 SDK 版本設定還停留在 10.8 沒有跟進 10.9 需要自行修改設定（卻沒有編輯器選項可以用）
* 有偵測到 Debugger 卻沒辦法讓 Mac / iOS 的預設運行設定使用（造成要 Debug 卻開不起來）
* 手動設定好 Deubgger 後卻開啟非常久，超過人類可忍耐的時間⋯⋯
* 預設的 `.pro` 設定檔在範例是空的，連需要的 Qt Library 都沒有預先寫好要讀取，造成編譯失敗
* 預設的 UI 編輯界面的 Header 檔案沒有自動產生，造成第一次使用無法順利編譯

大致上碰到的問題就是上述這些，但是足以消磨一個人使用的耐心。雖然是社群維護的專案，不過有一些細節還是不太足夠（雖我也覺得 Mono 的編譯設定可改項目太少，但至少我可以順利使用⋯⋯）

就目前情況來說，我會以 Mono 為主要的開發工具，至少目前使用起來還算穩定並且也沒有太多的問題。

#### 實作 Define Module

在 Ruby 中除了直接定義方法之外，也可以將方法附加在 Module 或者 Class 上，這篇文章會介紹 Module 的做法，而 Class 基本上做法類似，之後有機會再做討論。

```cs Module.cs
using System;
using System.Runtime.InteropServices;

namespace MRuby
{
	public class Module
	{
		private IntPtr state;
		private IntPtr klass;
    
		[DllImport(Program.LIBMRUBY, EntryPoint="mrb_define_module")] static extern IntPtr MrbDefineModule(IntPtr state, string name);
		public Module (IntPtr state, string name)
		{
			this.state = state;
			klass = MrbDefineModule(state, name);
		}
	}
}
```

在 MRuby 中，要定義一個 Module 的方法會需要該 Module 的指標，以及整個 MRuby 的 State 指標，如果是分散的方式撰寫，會變得方長不方便，所以就包裝成一個 Class 來簡化這個過程。

基本上，只要完成這個步驟，就可以得到一個能在 Ruby 中使用的 Module 了！

> 有很趣的地方在於 Ruby 中是不允許非英文字母、數字的 Module/Class 名稱，但是用 `mrb_define_module` 的時候，卻可以順利定義，但是為了避免錯誤，還是盡可能不要用這個做法會比較好。

#### 實作 Define Method

在實作 Define Method 之前，我們需要先做好一個叫做 Aspec 的資料結構。
這個資料的用途在於指定 Method 的參數數量，雖然在 Ruby 可以接受不固定數量的參數，而在 C# 實作的時候這個設定值也不會影響到實作（主要是因為我們只有 `MrbValue` 一種型別的實作，沒辦法直接在定義方法的時候指定接受的參數，因此不會受到影響。）

> 這部分還在驗證，不過目前推測是因為取出參數的做法關係造成的。

```cs Args.cs
using System;
using System.Runtime.InteropServices;

namespace MRuby
{
	[StructLayout(LayoutKind.Sequential)]
	public struct Args
	{

		public Args(UInt32 value)
		{
			this.value = value;
		}

		public UInt32 value;

		public static Args NONE() {
			return new Args(0);
		}

		public static Args ANY() {
			return new Args (1 << 12);
		}

		public static Args REQ(uint n) {
			return new Args ( ((n) & 0x1f) << 18 );
		}

		public static Args OPT(uint n) {
			return new Args ( ((n) & 0x1f) << 13 );
		}

		public static Args ARGS(uint req, uint opt)
		{
			return Args.REQ (req) | Args.OPT (opt);
		}

		public static Args BLOCK()
		{
			return new Args (1);
		}

		public static Args operator |(Args args1, Args args2)
		{
			return new Args (args1.value | args2.value);
		}
	}
}
```

上述的結構是參照 MRuby 中的 Marco（巨集）所改寫成的，效果跟巨集執行後是相同的，只是讓它可以用 C# 的形式呈現。
（在 MRuby 中有不少操作是用 Marco 所做的，像是空的 `MrbValue` 生成，這時候就必須靠我們自己擴充 Shared Library 來讓 C# 能夠獲取相同的數值，這也會是之後開發的重要課題。）

```cs Module.cs
using System;
using System.Runtime.InteropServices;

namespace MRuby
{
	public class Module
	{
		private IntPtr state;
		private IntPtr klass;
    
    public delegate MrbValue Func(IntPtr state, MrbValue instance);
    
		[DllImport(Program.LIBMRUBY, EntryPoint="mrb_define_module")] static extern IntPtr MrbDefineModule(IntPtr state, string name);
		public Module (IntPtr state, string name)
		{
			this.state = state;
			klass = MrbDefineModule(state, name);
		}
    
    [DllImport(Program.LIBMRUBY, EntryPoint="mrb_define_module_function")] static extern void MrbDefineMethod(IntPtr state, IntPtr klass, string name, Func func, Args aspec);
		public void DefineMethod(string name, Func receiver, Args aspec)
		{
			MrbDefineMethod (state, klass, name, receiver, aspec);
		}
	}
}
```

在 MRuby 中，會使用 Function Pointer 的方式儲存方法，若要在 C# 中實做一個 Function Pointer 可以利用 `delegate` 來實做，要說的話概念上是類似的東西。
（參考資料：[https://www.cnblogs.com/oomusou/archive/2007/05/02/734290.html](https://www.cnblogs.com/oomusou/archive/2007/05/02/734290.html)）

使用 `delegate` 功能需要指定方法的傳回值、接收的參數。不過在 MRuby 中都是固定傳回 `MrbValue` 並且把 `MrbState` 以及代表該物件實體的 `MrbValue` 存取進來。（到這邊應該很習慣了，不管是什麼數值都可以用 `MrbValue` 儲存）

#### MRuby 的方法呼叫

到此，我們可以定義 MRuby 的方法，那麼前面提到在 C# 中只能存取 `MrbValue` 的問題又是為什麼呢？

這就要談起 MRuby 的 `mrb_get_args` ([https://Github.com/mRuby/mruby/blob/master/src/class.c#L441](https://github.com/mruby/mruby/blob/master/src/class.c#L441)) 這個方法，可以透過傳入 `MrbState` 以及 Format（參數格式）來存取資料。

從原始碼的定義來看，會發現它是一個接受「不定長度參數」的方法。

```c
mrb_get_args(mrb_state *mrb, const char *format, ...)
```

也就是說，用法類似於 `mrb_get_args(state, "ii", &intValue1, &intValue2)` 這樣子。

在 C# 中，要實作不定長度的參數，除了可以用 `params` 關鍵字，但是卻只能接受「單一型別」的陣列，不過從原始碼中的 Format Table 來看，情況似乎不是這麼簡單。


```c
/*
  retrieve arguments from mrb_state.

  mrb_get_args(mrb, format, ...)

  returns number of arguments parsed.

  format specifiers:

    string  mRuby type     C type                 note
    ----------------------------------------------------------------------------------------------
    o:      Object         [mrb_value]
    C:      class/module   [mrb_value]
    S:      String         [mrb_value]
    A:      Array          [mrb_value]
    H:      Hash           [mrb_value]
    s:      String         [char*,mrb_int]        Receive two arguments.
    z:      String         [char*]                NUL terminated string.
    a:      Array          [mrb_value*,mrb_int]   Receive two arguments.
    f:      Float          [mrb_float]
    i:      Integer        [mrb_int]
    b:      Boolean        [mrb_bool]
    n:      Symbol         [mrb_sym]
    d:      Data           [void*,mrb_data_type const] 2nd argument will be used to check data type so it won't be modified
    &:      Block          [mrb_value]
    *:      rest argument  [mrb_value*,mrb_int]   Receive the rest of the arguments as an array.
    |:      optional                              Next argument of '|' and later are optional.
    ?:      optional given [mrb_bool]             true if preceding argument (optional) is given.
 */
```

如果指定的是 `i` 那麼拿到的會是一個 `mrb_int` 的型別，而且對我們的 C# 來說是一個未知型別。而使用 `params` 參數的話，這也會讓我們無法正確的接收數值。

不過，在 C# 提供了一個叫做 `__arglist` 的做法，也很幸運的這個方法就如同 C 語言的 `...` 用法，不過在 Mono 中，因為實作困難並沒有被完整、正確的支援。

也就是做，我們需要用一點小技巧來存取 MRuby 的參數。
（這個方法是從 [go-mRuby](https://Github.com/mitchellh/go-mruby) 所學的，就是單純的用 `*&` 這個 Format 來讀取參數，並且自行處理需要的部分。）

#### 實作 GetArgs Helper

因為目前只有 Module Class 會用到，所以就直接在 Module Class 裏面實作，實際上應該放在外面會更好些。

```cs Module.cs
using System;
using System.Runtime.InteropServices;

namespace MRuby
{
	public class Module
	{
		// 略
    [DllImport(RubyContext.LIBMRUBY, EntryPoint="mrb_get_args")] static extern void MrbGetArguments(IntPtr state, string format, out IntPtr argv, out int argc, out MrbValue block);
		public static Value[] GetArgs(IntPtr state, bool withBlock = false)
		{
			Value[] values;
			IntPtr argvPointer;
			MrbValue value;
			int i, argc, size;
			MrbValue block;

			MrbGetArguments (state, "*&", out argvPointer, out argc, out block);

			int valueCount = argc;
			if(withBlock) { valueCount++; }

			values = new Value[valueCount]; // Include Block
			size = Marshal.SizeOf (typeof(MrbValue));
			for (i = 0; i < argc; i++) {
				value = (MrbValue) Marshal.PtrToStructure (argvPointer + (i * size), typeof(MrbValue));
				values [i] = new Value (state, value);
			}

			if (withBlock) {
				values [argc] = new Value (state, block);
			}

			return values;
		}
	}
}
```

如此一來，就可以非常確定要使用的參數數目，並且可以正常的存取。

比較特別一點的就是 Ruby 的 Code Block 特性，所以會使用 `&` 來把這個 Blog 一起存出來，但是是否要使用又是另外一回事。

其中在存取的時候，會看到 `out` 這個修飾詞，基本上跟 `params` 和 `ref` 是經常被放在一起討論了。
在 C 語言中，其實就很單純的是 `&value` 這樣的做法（主要是在 C# 因為在非 Unsafe 模式是不允許這種記憶體操作，所以用這個方式代替。）

`out` 和 `ref` 的差別在於，使用 `out` 不需要初始化變數，他會在被使用的時候自動處理。但是 `ref` 就不同了，他需要先用 `int value = 1;` 的方式做過初始化，才能夠正常使用（不然會發生錯誤）

> 參數只會給第一個參數的指標，所以需要用迴圈把一整個記憶體區段掃過一遍取出每一個變數。

另一方面，為了讓 `MrbValue` 可以更簡單的在 C# 中使用，所以我對他做了一些封裝讓他可以自動轉型成 C# 原生的型別。
（`Value` 結構，裡面時做的是 `MrbValue` 的一些自動轉型）

原始碼如下：
```cs Value.cs
using System;
using System.Runtime.InteropServices;

namespace OpenTKGame.Ruby
{
	/**
	 *  MrbValue Wrapper
	 * 
	 *  Create Helper to convert MrbValue to C# value types
	 */
	public struct Value
	{
		public IntPtr state;
		public MrbValue value;

		public Value(IntPtr state, MrbValue value)
		{
			this.state = state;
			this.value = value;
		}

		[DllImportAttribute(RubyContext.LIBMRUBY, EntryPoint="mrb_obj_as_string")] static extern MrbValue MrbObjectToString(IntPtr state, MrbValue obj);
		[DllImportAttribute(RubyContext.LIBMRUBY, EntryPoint="mrb_string_value_ptr")] static extern IntPtr MrbStringPointer(IntPtr state, MrbValue obj);
		public override string ToString()
		{
			IntPtr stringPtr = IntPtr.Zero;

			if (value.type == Type.MRB_STRING) {
				stringPtr = MrbStringPointer (state, value);
			} else {
				stringPtr = MrbStringPointer(state, MrbObjectToString(state, value));
			}
			return Marshal.PtrToStringAuto (stringPtr);
		}
			
		static public implicit operator string (Value value)
		{
			IntPtr stringPtr = IntPtr.Zero;

			if (value.value.type == Type.MRB_STRING) {
				stringPtr = MrbStringPointer (value.state, value.value);
			} else {
				stringPtr = MrbStringPointer(value.state, MrbObjectToString(value.state, value.value));
			}
			return Marshal.PtrToStringAuto (stringPtr);
		}

		static public implicit operator int(Value value)
		{
			if (value.value.type == Type.MRB_FIXNUM) {
				return value.value.value.i;
			}
			if (value.value.type == Type.MRB_FLOAT) {
				return (int)value.value.value.f;
			}
			return 0;
		}

		static public implicit operator double(Value value)
		{
			if (value.value.type == Type.MRB_FLOAT) {
				return value.value.value.f;
			} 
			if (value.value.type == Type.MRB_FIXNUM) {
				return (double)value.value.value.i;
			}
			return 0f;
		}

		static public implicit operator bool(Value value)
		{
			switch (value.value.type) {
			case Type.MRB_FALSE:
			case Type.MRB_EXCEPTION:
			case Type.MRB_UNDEF:
				return false;
			}
			return true;
		}
	}
}
```

我實作了像是 `string` 還有 `int` `double` `bool` 等常用型別。
（不過 `ToString` 和 `string` 似乎只需要其中一個就可以了⋯⋯）

#### 實作自定 Module 和 Method

先實作一個在 Ruby 可以被呼叫的方法。

```cs
public static MrbValue ConsoleWrite(IntPtr state, MrbValue self)
{
	int i = 0;
	Value[] values = Module.GetArgs (state, false);

	for(i = 0; i < values.Length; i++) {
  	Console.WriteLine ("Receive Params: {0}", values[i].ToString());
	}
      
	return values[0].value; // Simple return first value
}
```

接著定義模組。

```cs
Value value;
RubyContext context = new Ruby.RubyContext ();

// Define Module and Method
Module module = context.DefineModule ("Example");
module.DefineMethod ("args", ConsoleWrite, Args.ANY());
      
// Run Ruby code
context.LoadString ("Example.args(1, 'hello', 'world')")
```

這樣一來，就可以看到剛剛的成果了～

> 前面忘記提到 context 的 DefineModule 實作，其實就是做了 `new Module(state, name)` 這件事情而已。

---

最近已經開學了，而且還在做畢業製作。我想能夠花心思在這個部分上面的時間會越來越少，下一階段我會更加完善這個架構，必且開始正是的專案（我會放在 Githu 上面，初期目標是像 KrKr 那類 AVG 系統一樣單可用）

之後暫定的 Roadmap：
* `rb` to `mrb` 的封裝
* OpenGL 的實作（Based on OpenTK）
* 更完整的 MRuby Library for C#
* 完善專案建構（大概會要把好幾個專案組合才能順利開發完整的系統吧 XD）
* 簡易的 AVG 功能

> 這系列文章因為評估 Mono 的搭配過於複雜，因此停止更新、研究
