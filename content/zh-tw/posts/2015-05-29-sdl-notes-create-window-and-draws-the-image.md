---
layout: post
title: 'SDL 筆記：產生視窗與繪製圖像'
publishDate: 2015-05-29 06:28
comments: true
tags: [C++, 遊戲, 筆記]
---
沒有想到最後還是走上了遊戲開發這條路，同學給我的影響真的很大，而且大家都有一個共同的目標和夢想的感覺很不錯。
雖然讓我下定決心的是因為和同學在合作上太過於順利，讓我們不禁懷疑「正常的團隊運作是這樣嗎？」才讓我決定要跟他們一起做遊戲。

雖然現在有 Unity3D 跟我們團隊使用的 Unreal Engine 4 但是程式自學，又是受設計教育的我在技術上總是會差人一截，最好的方法莫過於從一些基礎的東西去練習，然後了解底層的運作方式。

> 做 Web 的時候常常會有人在爭辯到底該先學 Framework 還是先學手刻網站這個問題，我認為是「成就感」跟「個人特質」的問題，以我自己來說我建立成就感的個人特質是「先有成果」所以就很適合從 Framework (Game Engine) 學起，當我熟練之後自然會想補足之前缺漏的知識（因此要看個性，有些人就是要 Hardcode 才能有成就感啊！）

知道 SDL 的時間點已經忘記了，印象中只記得國中的時候買過幾本遊戲開發的書卻因為讀不來而沒有繼續學下去。

> 印象中 SDL 應該就是當時在書上看到的，不過書名實在想不起來。只知道是一本綠色封面的書，日本人寫的。

關於入門的學習 [Willusher](https://www.willusher.io/pages/sdl2/) 這個網站的 SDL 入門教學來開始學習，畢竟 SDL2 的文字教學（個人不是很喜歡看影片）似乎不好找，又充斥著 SDL(SDL1) 的教學有時候還挺混亂的！

<!--more-->

## 環境配置

因為我使用的是 Mac 所以就很直覺的執行 Homebrew 安裝（不過官方似乎也有提供 dmg 檔可以下載）

```bash
brew install sdl2
```

> 不過其實有缺點，因為 SDL2 的 Library 目錄都會在 /usr/local 下面，編譯的時候需要另外設定。

因為要繪製圖片，不過預設只支援點陣圖，所以就額外加裝了 Image Extension 去支援。

```bash
brew install sdl2_image
```

因為習慣用 Vim 所以另外 Compile 過我的 YouCompleteMe 插件，不過 SDL 的 AutoComplete 似乎無法提示 Function 有點可惜。

## 產生視窗

```cpp main.cpp
#include "SDL2/SDL.h"

int main(int, char**)
{
  // 初始化 SDL 的 Vidoe 子系統（支援顯示）
  // 不過不少子系統都會自動初始化，教學上都有寫我就先照抄了～～
  if( SDL_Init(SDL_INIT_VIDEO) != 0) {
    return 1;
  }
  
  // 參數依序是 Window Title, X, Y, Width, Height, flags
  // 最後的 flag 設定為 SDL_WINDOW_SHOWN 據說是沒用的，只適用於後面查詢（除非設定隱藏視窗）
  SDL_Window *win = SDL_CreateWindow("SDL2 Window", 100, 100, 640, 480, SDL_WINDOW_SHOWN);
  // 產生失敗就關掉視窗
  if(win == nullptr) {
    SQL_Quit();
    return 1;
  }
  
  // 等待五秒後關閉
  SDL_Delay(5000);
  return 0;
}
```

不過每次編譯都要指定引用 SDL 其實不是很方便，所以就寫了一個 Makefile 去跑。

> CMake 還不知道該怎麼學，不然跨平台用 CMake 似乎會比較恰當一點⋯⋯

```make Makefile
CXX = clang++
SDL = -I/usr/local/include/SDL2 -L/usr/local/lib -lSDL2
CXXFLAGS = -Wall -c -std=C++11
LDFLAGS = $(SDL)
EXE = Main

all: $(EXE)

$(EXE): main.o
	$(CXX) $(LDFLAGS) $< -o $@

main.o: main.cpp
	$(CXX) $(CXXFLAGS) $< -o $@

clean:
	rm *.o&& rm $(EXE)

```

基本上是參照教學的 Makefile 去寫（很乾淨就直接用了！）

> 看到 $< 跟 $@ 的時候還跑去查了一下是什麼東西。 $< 是相依的檔案，而 $@ 是輸出的檔案，不過這應該是很基本的用法啊 XD

## 使用渲染器與載入材質（Texture）

這邊一起講是因為教學在做完之後用 C++ 的 Function Tempalte 寫了一段用於釋放的程式，因為非常有用所以就一起討論了！

> Template 該怎麼用剛好因為學這個才順利搞懂，不過 C++ 只有入門等級的我能寫出東西應該算是很幸運了吧！

```cpp
SDL_Renderer *renderer = SDL_CreateRenderer(win, -1, SDL_RENDERER_ACCELERATED | SDL_RENDERER_PRESENTVSYNC);
if(renderer == nullptr) {
  SDL_DestroyWindow(win);
  return 1;
}
```

基本上 SDL 的 API 都是 `Create` 跟 `Destroy` 做 Prefix 去表示產生物件，記住規則之後就蠻好懂的。
至於 Renderer 的參數，依序是顯示在哪個視窗、用哪張顯卡（文件叫 rendering driver 應該是顯卡）跟一些設定（flags）這邊是啟用硬體加速還有開啟 VSync 功能。

### 讀取圖片

這邊我直接使用 Image Extension 提供的 API 而不是 SDL 預設的（我參考的教學會先教你讀取 bmp）

引用檔案的部分加入這兩行來提供支援。
```cpp
#include "iostream"
#include "SDL2/SDL_image.h"
```

關於 `SDL_image.h` 的位置似乎會因為安裝方法不同有所改變，大家可能要自己注意一下。


這邊會直接寫一個 Function 去實作讀取圖片，其實到後面程式碼算是蠻多的⋯⋯

```cpp
SDL_Texture* loadTexture(const std::string &file, SDL_Renderer *renderer)
{
  SDL_Texture *texture = IMG_LoadTexture(renderer, file.c_str());
  if(texture == nullptr) {
   // 略，這邊其實是用 SDL_GetError() 顯示錯誤訊息
  }
  return texture;
}
```

而顯示圖片也一樣，實作了一個 `renderTexture` 的方法。

```cpp
void renderTexture(SDL_Texture *tex, SDL_Renderer *renderer, int x, int y, int w, int h)
{
  SDL_Rect dst;
  dst.x = x;
  dst.y = y;
  dst.w = w;
  dst.h = h;
  SDL_RenderCopy(renderer, tex, NULL, &dst);
}
```

這邊用 `Copy` 我想是因為 SDL 本身還是比較底層的關係，所以用 `Copy` 表示把 Texture 的記憶體複製到正在 Render 的某個記憶體區塊。

> 雖然直接用 Draw 好像也沒什麼關係，但是 Draw 算是表示包裝過了，就這點而言真的不得不敬佩這些套件的開發人員可以設計出這些淺顯易懂的 API 讓其他人使用。

接下來就是讀取圖片，然後繪製到畫面上摟！

```cpp
SDL_Texture *logo = loadTexture("./logo.png", renderer);
if(logo == nullptr) {
  SDL_DestroyRenderer(renderer);
  SDL_DestroyWindow(win);
  IMG_Quit();
  SDL_Quit();
  return 1;
}

SDL_RenderClear(renderer);
renderTextur(logo, renderer, 100, 100, 100, 100);
SDL_RenderPresent(renderer);

SDL_Delay(5000);
```

接下來要修正 `Makefile` 可以使用 SDL_image 的套件。
不過跟前面提到的一樣，可能會因為安裝方式不同有所設定的差異。

```make
SDL = -I/usr/local/include/SDL2 -L/usr/local/lib -lSDL2 -lSDL2_image
```

到目前為止，應該就可以順利顯示出圖像了！

不過也會發現不斷的在使用 `Destroy` 在發生錯誤的時候清除記憶體，這是一個非常不省力的做法。

> 我的直覺是包成一個 Function 去處理，不過有各種型別要釋放，API 也不同。所以就需要用到 Template 的功能來解決這個問題。

### 用 Function Tempalte 輔助清除記憶體

```cpp cleanup.h
#ifndef CLEANUP_H
#define CLEANUP_H

#include <utility>
#include <SDL2/SDL.h>

// 定義一個可以接收 N 個參數的函示 cleanup()
template<typename T, typename... Args>
void cleanup(T *t, Args&&... args)
{
	// 對第一個餐數執行清理
  cleanup(t);
  
  // 將 rvalue 展開（同時也是一個遞迴呼叫）
  // 關於 rvalue & forward 會在文末補充，我花了一點時間去理解這個 C++11 新增的特性
  cleanup(std::forward<Args>(args)...);
}

// 下面針對各種類型做對應的處理 Ex. SDL_Window 要做什麼處理⋯⋯
template<>
void cleanup<SDL_Window>(SDL_Window *win)
{
  if(!win) { return; } // 碰到的是空指標則不做處理
  SDL_DestroyWindow(win);
}

template<>
void cleanup<SDL_Renderer>(SDL_Renderer *renderer)
{
  if(!renderer) { return; }
  SDL_DestroyRenderer(renderer);
}

template<>
void cleanup<SDL_Texture>(SDL_Texture *tex)
{
  if(!tex) { return; }
  SDL_DestroyTexture(tex);
}

template<>
void cleanup<SDL_Surface>(SDL_Surface *surf)
{
  if(!surf) { return; }
  SDL_FreeSurface(surf);
}

#endif
```

這樣一來，之後只要使用 `cleanup(win)` 或者 `cleanup(renderer, win)` 就可以很輕鬆的釋放記憶體，相對於原本要做非常多處理的動作，變得輕鬆許多。

接下來就是要探討 `rvalue` 這個詞了，原本是以為單純指的是 `int x = 1;` 的右邊數值，不過在 C++11 中，所謂的 `lvalue` 跟 `rvalue` 比較偏向概念，以 `lvalue` 來說是指「已經被命名的數值」也就是「實際定義在記憶體中可呼叫的數值」

```cpp
int func(int x) {
  // x 是 lvalue
}

// y 是 lvalue
int y = 1;

// *p 是 lvalue
int *p = &y;

```

那麼 `rvalue` 是什麼呢？是指「還在運算的數值」也就是放在暫存記憶體的數值。

```cpp
int func(int x, int y) {
  // x, y 是 lvalue
  // x + y 是 rvalue （還在運算）
  return x + y; 
}

// res 是 lvalue
// 1 + 2 跟 3 都是 rvalue
int res = func(1 + 2, 3);
```

聽起來蠻抽象的，不過多看幾次定義跟例子就可以理解這個問題。
個人認為解釋不錯的是 [MSDN: Lvalue & Rvalue](https://msdn.microsoft.com/zh-tw/library/f90831hc.aspx) 這篇文章。

至於 `forward` 則是 `ravlue` 操作上的一個輔助函示，用來展開 `rvalue` 這部分一樣可以參考 [MSDN: Rvalue](https://msdn.microsoft.com/zh-tw/library/dd293668.aspx) 這篇文章的介紹，做了一些測試雖然有點頭緒但是還不是很了解這個的使用方式，沒辦法給太多解釋。

> 在教學中的 template 運用上，主要是強制把收入的參數（typename Args）轉為 rvalue 確保在收取數值的時候不會有多餘的複製，之後 forward 則會轉換回原本的（Ex. SDL_Window* 傳入會變成 SDL_Window* && 再被 forward 轉回 SDL_Window* 去使用）

> 不過奇怪的地方是沒有實作 rvalue 狀況下的處理，不過也許是目前還不夠熟悉 rvalue 的應用才不能理解吧。

<del>程式會動就好，指標這種東西還是要靠機運才會懂得⋯⋯</del>

原本想再接著寫篇 Event 處理的，不過看起來時間不太夠呢⋯⋯
