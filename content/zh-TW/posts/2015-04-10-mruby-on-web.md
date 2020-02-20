---
layout: post
title: 'mRuby on Web'
date: 2015-04-10 14:58
comments: true
tags: [Ruby, 心得, 筆記, MRuby]
---
忙裡偷閒玩了一下 Emscripten 將 mRuby 拉到 Web 上面運行。

最初是看到 [WebRuby](https://Github.com/xxuejie/webruby) 這個專案的應用 [Webirb](https://joshnuss.github.io/mruby-web-irb/) 才決定要挑戰將 mruby 丟到 Web 上面跑。

> 其實這個過程中 WebRuby 給我很多參考方向，才讓我得以順利完成 mruby on Web 的挑戰。

<!--more-->

在兩年前（2013）的 JSDC 上，我首次得知了 [ASM.js](https://asmjs.org) 跟 [Emscripten](https://emscripten.org) 這兩個專案，當時只知道是一個可以把 C/C++ 的運行效能帶到 Web 上的專案，卻不得其門而入。

不過最近再次回想起來，重新閱讀了一次 Emscripten 的文件後終於瞭解到入門的基礎用法。

> 也許是兩年前的英文程度不好吧，或者當時因為沒有接觸太多 C/C++ 因此無法理解其深意。

總而言之，在學會使用 Emscripten 的同時，我最想拉到網頁上的就是 mRuby 了（作為第一次跟 C/C++ 整合的語言，讓我很興奮，另外 Ruby 也是我目前最喜歡的語言 XD）

#### 安裝 Emscripten

基本上依照官網的[安裝教學](https://kripken.Github.io/emscripten-site/docs/getting_started/downloads.html)應該就可以很順利的完成安裝。

我自己是放在 `~/Workspace/Emscripten` 下面，要使用的時候就先跑一次 `source ./emSDK_env.sh` 來讓 `emcc` 等指令可以使用。

> SDK 的設計並不是很好，所以一定得在 SDK 目錄下跑 `source` 指令

#### 目錄結構

單純是我習慣的配置，如果大家有自己的習慣可以修改。

* mRuby.js
  * mRuby/ - 原始碼
  * build/ - 輸出檔案
      * src/ - mRuby 的 `.o` 檔案
          * gems/ Gem 的 `.o` 檔案
      * dest/ 輸出的 `.html` `.js` 檔案
  * mrbjs.c - 應用 mRuby 的 c 檔案（ main ）
  * Makefile

#### 取得 mRuby

mRuby 是輕量的 ruby 套件，編譯完成的 `mruby.js` 加上一些預設的 gems （像是 `puts` 等支援）大約才 1.3 MB 左右，算是還在接受的範圍內。

首先，先把 mRuby 的原始碼下載下來。

> git clone git@Github.com:mRuby/mruby.git

獲得原始碼後，我們需要配置一下 `build_config.rb` 這個檔案，加入名為 `emscripten` 的編譯器 toolchain 來產生可供網頁使用的版本。

```Ruby build_config.rb
# 略

# 以下配置是參考 WebRuby 的配置
MRuby::Toolchain.new(:emscripten) do |conf| # 定義 Toolchain: emscripten
  toolchain :clang # 從 clang 的 toolchain 繼承配置

  conf.cc do |cc| # 修改編譯設定
    cc.command = "emcc" # 將原本的 cc 改為 emscripten 的 emcc
    cc.flags.push(%w(-Wall -Werror-implicit-function-declaration -Wno-warn-absolute-paths -O0)) # 增加編譯的 flag
  end

	# 其他編譯選項的配置
  conf.cxx.command = "emcc"
  conf.linker.command = "emcc"
  conf.archiver.command = "emar"
end

MRuby::CrossBuild.new("emscripten") do |conf| # 增加 MRuby 編譯任務（跨平台類型的編譯）
  toolchain :emscripten # 使用 Emscripten 編譯

  conf.build_dir = File.expand_path('build/emscripten') # 設定編譯完成後檔案輸出位置
  conf.gembox 'default' # 選擇要一同編譯的 gem （Default 會包括 Ruby 預設的基本 Class 和 Method 在裡面）
end
```

完成之後運行 `rake` 指令就會自動編譯完成，此時理論上要在 `build/emscripten` 目錄看到編譯完成的 static library 等檔案。

> 這邊要注意的是 `cc.flags.push` 項目加入了 `-O0` 這個 flag 之後會說明為什麼會使用 `-O0`

#### mrbjs.c

這邊寫一個簡單的 C 去呼叫 mRuby 執行一段 Ruby Code 後續的應用就交給大家想像了～

```c mrbjs.c
#include <stdio.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

#include "mRuby.h"
#include "mRuby/compile.h"
#include "mRuby/string.h"

void run(mrb_state* mrb, const char* code) {

  mrb_value result = mrb_load_string(mrb, code);

  const char* return_str;

  if(mrb->exc) {
    return_str = mrb_string_value_ptr(mrb, mrb_obj_as_string(mrb, mrb_obj_value(mrb->exc)));
    printf("%s\n", return_str);
  }

}

int main(int argc, char** argv) {
  mrb_state* mrb = mrb_open();
  webmrb_run(mrb, "puts \"Hello World\"");
  mrb_close(mrb);
  return 0;
}
```

#### Makefile

因為指令挺繁瑣的，所以就臨時抱佛腳看了一下 [Make 命令教程](https://www.ruanyifeng.com/blog/2015/02/make.html)這篇讓我印象深刻的教學（清楚簡單的說明用法，個人很喜歡）學了基本的 Makefile 撰寫方法。

```makefile Makefile
MRB_SRC=mRuby/build/emscripten
MRB_O=$(MRB_SRC)/src/*.o
MRBLIB_O=$(MRB_SRC)/mrblib/*.o
GEMS=$(MRB_SRC)/mrbgems # Gems 比較特別，另外就是我找不到好方法可以 Nested 的複製 .o 檔案（有人知道請告訴我）

.PONHY: build mrbsrc clean gems init

init:
  mkdir build
  mkdir build/src
  mkdir build/dest

build: init mrbsrc gems mrbjs.o
	emcc ./build/src/*.o ./build/src/gems/*.o ./build/src/gems/**/*.o ./build/src/gems/**/src/*.o -o build/dest/mrbjs.html -O2 --memory-init-file 0

mrbjs.o: mrbjs.c
  emcc mrbjs.c -I mRuby/include -o ./build/src/mrbjs.o -O2  -Wall -Werror-implicit-function-declaration  -Wno-warn-absolute-paths

mrbsrc:
  cp $(MRB_O) build/src
  cp $(MRBLIB_O) build/src

gems:
  cp -r $(GEMS) build/src/gems

clean:
  rm -rf build/*

```

之後運行 `make build` 就可以在 `build/dest` 目錄看到 `mrbjs.html` 這個檔案，開啟後如果正常運作就會看到出現 `Hello World` 的字樣在畫面上。

> 我想大家可能會發現 `-O2` 這個 flag，跟前面的 `-O0` 又有什麼關係呢？後面的 FAQ 會解釋這個問題。

#### FAQ

**Q: `-O0` 跟 `-O2` 到底是什麼？**

這是 Emscripten 的 Optimize 設定項目，詳細可以參考 [Emscripten - Optimizing Code](https://kripken.Github.io/emscripten-site/docs/optimizing/Optimizing-Code.html) 這個頁面。

前面在編譯 mRuby 的時候會使用 `-O0` （不優化）是因為 `nested structs` 的[展開問題](https://Github.com/kripken/emscripten/issues/2238)。不過我去追 Google 的 PNaCI 關於這個的討論串，似乎已經在去年年底解決了（Emscripten 專案何時支援還不確定）

簡單說用了 `-O2` (release suggest) 的優化，在編譯的時候（產生 html/js）就會發生錯誤。

> 個人認為這是 mRuby on Web 的效能貧頸，經過我自己簡單的 Benchmark ( `(1...10000).each { |i| i }` ) 在網頁上跑大概需要花 29ms ~ 33ms 但是一般的 Ruby 可以在 0.5ms 內完成，速度上差了快一百倍。
> 不過我也很樂見在 `-O2` 支援的同時這個問題理論上會被解決掉，因為能使用 `asm.js` 的加速，還有 Emscripten 的優化，照理說不應該慢到哪裡去（目前的問題應該在 libmRuby 太慢）

**Q: `--memory-file-init` 是什麼？**

個人推測是預先將一些靜態的結果先產生好，在執行時直接運行結果而非動態執行的設定，在這邊會設定為 0（關閉）是因為在 `WebRuby` 中有註解提及這會讓網站卡住，如果有興趣的話可以取消這個設定運行看看是否能正常運行。

#### 小結

我距離土炮 RPG Maker 又更進一步了，雖然試了很多方法果然還是在 Web 上覺得最舒適啊 XD
（Emscripten 已經做好 SDL 的 Port 可以說是一大福音啊～～）
