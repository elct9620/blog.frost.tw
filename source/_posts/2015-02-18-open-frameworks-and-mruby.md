---
layout: post
title: 'Open Frameworks 與 MRuby'
date: 2015-02-18 11:15
comments: true
tags: [C++, 心得, 筆記, MRuby, OpenFrameworks]
---
自從畢製開始與同學開發遊戲後，我就開始喜歡嘗試運用一些工具如 HTML5、Mono、Processing 等來製作一些屬於自己的「遊戲框架」

自從上次嘗試使用 Mono 與 MRuby 結合後，這次在與朋友的閒聊中回想起了 Open Frameworks 這套工具。
Open Frameworks 基本上被稱為是 C++ 版本的 Processing 就各方面來說比 Processing 改進不少，至少就我這幾天的體驗來看，以我目前的實力已經可以純熟運用了！

> 過去曾有一段時間嘗試玩過，但是因為沒有 Project Generator 輔助建構專案，再加上與 C++ 其實不是那麼的熟悉，因而放棄。這次透過 Unreal Engine 的經驗，以及上次 MRuby 的整合讓我順利的開始使用 Open Frameworks。

這篇文章主要會分享我使用 Open Frameworks 開啟一個 Ruby 檔案，並且執行裡面的方法在介面中繪製圖像的做法。
目前我認為這個方法其實還不太完善，不過作為初次的嘗試可以算是一個不錯的成果。

<!-- more -->

首先，要使用 MRuby 必須先有 MRuby 才行，關於這部分請直接參考「[MRuby in C# 因 RPG Maker的慘劇（一）](https://blog.frost.tw/posts/2014/09/04/mRuby-in-csharp-the-tragedy-of-rpg-maker-1)」這篇文章，裡面會詳細說明建構 Static Library 的方法。

> Open Frameworks 目前建置出來的是 32bit 的版本，因此跟 Mono 的情境一樣需要開啟 32bit 的編譯選項

### 配置 XCode 專案

在 Open Frameworks 0.8 之後已經支援 Retina 顯示，關於這部分可以直接 Google 相關資料就不多做解釋了（作法也很簡單，在 .plist 加入選項即可，雖然整體使用上還不夠理想⋯⋯）

為了要使用 MRuby 的套件，我們需要在專案面板中手動加入函式庫。

![螢幕快照 2015-02-18 下午7.26.02.png](https://user-image.logdown.io/user/52/blog/52/post/255651/B3wRMPrVSoqEcOuFq9ug_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202015-02-18%20%E4%B8%8B%E5%8D%887.26.02.png)

做法不難，在 Linked Frameworks and Libraries 新增剛剛編譯好的 `libmRuby.a` 跟 `libmruby_core.a` 即可。

> libmRuby_core.a 是選用的，裡面實作了一些 Ruby 基本的功能建議加入（不然只會拿到幾乎是什麼都沒有的 Ruby 環境）

另一方面我們需要增加 Header 的設置。

![螢幕快照 2015-02-18 下午7.29.11.png](https://user-image.logdown.io/user/52/blog/52/post/255651/F4WuHoSSou9LuXvCYfZr_%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7%202015-02-18%20%E4%B8%8B%E5%8D%887.29.11.png)

在 Build Settings 的 Tab 裡面找到「Header Search Path」並且加入即可。

> 也許會找不到，可以把左上角的「Basic」換成「All」就能看到了！

> 裡面的路徑我寫了 $(HEADER_MRUBY) 是因為 Open Frameworks 有一個 xcconfig 的設定檔，基於實驗精神我做了測試，這邊可以直接寫上路徑（相對、絕對路徑都可以）

這樣基本上就配置好了開發環境，不過我想是有更乾淨的配置方式。
不過基於我使用 XCode 也不過幾個月，這也是第一次用 XCode 引用外部的函式庫，就先這樣解決吧！

### MRuby 運行環境

在 MRuby 的 API 中我們可以透過 `mrb_open()` 以及 `mrb_close()` 來開啟跟關閉一個 `mrb_state` （也許稱作 context 會更好）總之，我們可以產生多個運行的環境，為了方便起見包裝成一個 Class 來呼叫。

```cpp Ruby.h

#include <string.h>
#include <mRuby.h>
#include <mRuby/compile.h>

// 使用 string.h 是因為 Open Framrworks 大部份都是傳回 string 而非 const char *
// 我們會需要使用 mRuby/compile.h 裡面含有從檔案讀取等處理，若要直接執行 .rb 檔案則需要引用

using namespace std;

class Ruby {
public:
  Ruby();
  void load_file(string fileName);
  void call(string methodName);
  void close();
private:
  mrb_state* mrb;
}

```

``` cpp Ruby.cpp

#include "Ruby.h"

Ruby::Ruby() {
  mrb = mrb_open();
  
  // 這邊之後會加入 ofImage 的 Binding 程式
}

void Ruby::close() {
  mrb_close(mrb);
}

void Ruby::load_file(string fileName) {
  FILE* file = fopen(fileName.c_str(), "r");
  mrb_load_file(mrb, file); // 實際上回傳回 mrb_value 不過我們不需要
  /*
  if(mrb->exc) {
   // 如果發生錯誤（Error）可以在這邊做對應處理，因為這個範例功能簡單所以就不多做討論
  }
  */
  fclose(mrb);
}

void Ruby::call(string methodName) {
  /**
    mrb_funcall() 的 API 如下
    mrb_state* -> 運行的 Ruby Context
    RClass* -> 呼叫方法的物件，使用 mrb_top_self(mrb) 可以直接呼叫非物件的方法（這與 Ruby 語言設計有關）
    const char * -> 呼叫的方法
    int -> 方法的參數
    * -> 一次傳入各種 Ruby 參數（由前面的參數決定傳入數）
  */
  mrb_funcall(mrb, mrb_top_self(mrb), methodName.c_str(), 0); // 因為只要單純的呼叫，所以不多處理
}

```

如此一來，我們就可以利用類似下面的程式碼來執行某個 Ruby 檔案：

```
Ruby* Ruby = new Ruby;
Ruby->load_file("app.rb");
Ruby->call("hello_world");
Ruby->close();
```

### ofImage 的 Binding

我的目標只有兩個，所以後續的實作也會基於這兩個實作：

1. 讀取圖片
2. 繪製在畫面上的某個位置

```cpp Ruby/Image.h

#include <ofMain.h>
#include <mRuby.h>
#include <mRuby/string.h>
#include <mRuby/data.h>
#include <mRuby/class.h>

using namespace std;

namespace Ruby {
  class Image {
  public:
    static void setup(mrb_state* mrb);
  protected:
    // MRuby 的 Method 都是傳回 mrb_value 並且接收 mrb_state 與 mrb_value （物件本身） 作為參數
    // 這邊實作 initialize() 方法是因為我們的物件需要儲存 ofImage 的參照讓我們可以在同一個物件實例中對其操作
    static struct mrb_value initialize(mrb_state* mrb, mrb_value self);
    static struct mrb_value loadImage(mrb_state* mrb, mrb_value self);
    static struct mrb_value drawImage(mrb_state* mrb, mrb_value self);
  }
}
```

這個檔案會是目前最多程式碼的部分，裡面有一些其實應該移出來放到新的檔案。
不過為了撰寫方便，所以寫在這個檔案中。

```cpp Ruby/Image.cpp

#include "Image.h"

using namespace Ruby;

// 定義 Image Class 的資料結構
struct mrb_of_image {
  ofImage* instance;
}

// 定義釋放記憶體的方法
// 因為後面會使用 malloc 產生 mrb_of_image 這筆資料，而 Ruby 本身也有 GC （垃圾回收）的機制
// 因此推測是用於 GC 時能夠順利清除這筆記憶體
static void mrb_of_image_free(mrb_state* mrb, void *ptr) {
  mrb_free(mrb, ptr);
}

// 定義配置記憶體的方法
// 因為如果直接在某個方法中儲存 ofImage 參照會被清除，因此使用 malloc 保持（而回收則交給 Ruby 的 GC 機制）
static struct mrb_of_image* mrb_of_image_alloc(mrb_state* mrb) {
  mrb_of_image* image;
  image = (struct mrb_of_image*) mrb_malloc(mrb, sizeof(struct mrb_of_image));
  // 這邊可以視情況做各種初始化
  image->instance = new ofImage; // 這裏預先初始化了 ofImage 物件
  return image;
}

// 定義 MRuby 中的資料類型（Data Type）
static struct mrb_data_type mrb_of_image_type = { "Image", mrb_of_image_free }

Image::setup(mrb_state* mrb) {
  // mrb_define_class 回傳回一個 RClass 參照，而第三個參數是「繼承」自哪個物件，這邊從 Ruby 的 Object 繼承（Ruby 預設）
  struct RClass* klass = mrb_define_class(mrb, "Image", mrb->object_class);
  
  // 定義 Image Class 的方法
  //
  // API 中會有 mrb_define_class_method() 和 mrb_define_method() 兩個方法，而且會讓人覺得疑惑
  // 實際上，使用 define_class_method 的時候，產生的是「靜態方法」 Ex. Image.loadImage()
  // 而使用 define_method() 則是「實例的方法」 Ex. image.loadImage() // image = Image.new
  
  // MRuby 中有預先定義好的巨集 ARGS_* 可以輔助我們指定傳入參數的條件
  mrb_define_method(mrb, klass, "initialize", Image::initialize, ARGS_NONE());
  mrb_define_method(mrb, klass, "load_image", Image::loadImage, ARGS_REQ(1));
  mrb_define_method(mrb, klass, "draw", Image::drawImage, ARGS_REQ(2));
}

/**
 * 實作 Image Class 方法
 */
 
mrb_value Image::initialize(mrb_state* mrb, mrb_value self) {
  struct mrb_of_image *image;
  image = (struct mrb_of_image*) DATA_PTR(self); // DATA_PTR 可以取出儲存於物件中的 Data 資訊
  if(image) {
    mrb_of_image_free(mrb, image); // 清除（這個記憶體位置中的資料不會被使用，因此需要被釋放掉）
  }
  
  DATA_TYPE(self) = &mrb_of_image_type; // 確保物件的 Data Type 被辨識為自定義的 mrb_of_image_type
  DATA_PTR(self) = NULL; // 清空物件中的 Data
  
  image = mrb_of_image_alloc(mrb); // 重新初始化 
  
  DATA_PTR(self) = image; // 將正確的 Data 設定上去

  return self; // 沒有特殊需求就傳回自己，也讓 Ruby 的呼叫擁有可以 Chian 的性質
}

mrb_value Image::initialize(mrb_state* mrb, mrb_value self) {

  mrb_value mrbFilePath; // 儲存於 Ruby 中的路徑資訊
  mrb_get_args(mrb, "S", &mrbFilePath); // 將 Method 傳述的參數解析出來（在 MRuby 是利用這種方法讀取的）
  const char * filePath = mrb_string_value_ptr(mrb, mrbFilePath); // 將 mrb_value 轉為 char 陣列
  
  struct mrb_of_image* image = (struct mrb_of_image*) DATA_PRT(self); // 取出物件中的 Data 資訊
  // 呼叫 ofImage 的 loadImage 進行讀取圖片
  // ofToDataPath() 可以將路徑轉為正確的 data/ 目錄路徑（像是 OSX 的 App 會被包在裡面，預設會讀錯位置）
  // 因為接受的是 string 參數，因此直接將 char 陣列轉為 string
  image->instance->loadImage(ofToDataPath(string(filePath)));

  return self;
}

mrb_value Image::initialize(mrb_state* mrb, mrb_value self) {

  mrb_float x, y; // mrb_float 可以看作 float 的別名，可以直接當作 float 使用（ MRuby 會看情況選用 float / double ）
  mrb_get_args(mrb, "ff", &x, &y); // 取出參數（這次是 float 類型）
  
  struct mrb_of_image* image = (struct mrb_of_image*) DATA_PRT(self);
  image->instance->draw(x, y); 
  
  return self;
}

```

到此為止，我們就算是完成 ofImage 的 loadImage / draw 的 Binding 了！

### 從 Open Frameworks 運行 Ruby

接下來在 `ofApp.cpp` 中做一些處置就可以執行我們要的 Ruby 檔案了！

```cpp ofApp.cpp
// 略
// Header 中應該要已經寫好 Ruby* Ruby; 的設定
void ofApp::setup() {
  Ruby = new Ruby;
  Ruby->load_file(ofToDataPath("load_image.rb"));
  Ruby->call("setup");
}

void ofApp::update() {
  Ruby->call("update");
}

void ofApp::draw() {
  Ruby->call("draw");
}

void ofApp::exit() {
  Ruby->close();
}


// 略
```

這樣我們就會去讀取 `data` 目錄下的 `load_image.rb` 這個檔案。

接著在 `data` 目錄新增 `load_image.rb` 然後運行看看吧！

```rb load_image.rb

$image = Image.new
$imageX = 0
$counter = 0

def setup
  $image.load_image "images/logo.png"
end

def update 
  $counter += 1
  $imageX = $counter % 500
  $counter = 0 if $imageX === 0
end

def draw
  $image.draw $imageX, $imageX
end
```

雖然 Ruby 的部分會用到全域變數之類的看起來不太習慣，不過至少可以讓 C++ 跟 MRuby 互相溝通了！

> 這次學到不少新的用法，我想很快就會忘記所以就趕緊寫篇筆記記錄下來。

參考資料：

* [mRuby/C構造体組み込みを読む](https://www.dzeta.jp/~junjis/code_reading/index.PHP?mruby%2FC%B9%BD%C2%A4%C2%CE%C1%C8%A4%DF%B9%FE%A4%DF%A4%F2%C6%C9%A4%E0)
* [hpc-mRuby](https://Github.com/tomykaira/hpc-mruby/blob/master/mrbgems/mruby-time/src/time.c) - 上面的 Wiki 解說的 time.c 就是這個檔案（搭配閱讀會比較好懂）
* [mRubyのexamples](https://d.hatena.ne.jp/urekat/20120428/1335602756)
