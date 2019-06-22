---
layout: post
title: '用 Zephir 寫自己的 PHP Extension'
date: 2013-10-05 15:30
comments: true
tags: [PHP, C, Zephir, 網站開發]
---
前一篇文章說到了 [Zephir](https://zephir-lang.com/) 於是這篇就要來研究一下摟～

關於這篇文章，會做以下幾件事情：

* 安裝 & 設定
* 寫一個簡易的 Router
* 改寫成 Zephir 版本
* 安裝 Extension 以及測試

那麼，廢話不多說，馬上開始吧！

<!-- more -->

因為我習慣使用 Mac 所以是用 Mac 的方式安裝，不過 Zephir 並沒有表明支援 Mac 使用上需要多加小心。
如果你懶得安裝或者希望使用 Linux 環境，可以考慮使用 **阿土伯** 大大在 PHPConf 2013 時 Demo 用的 Vagrant Box - [Phalcon Dev Box](https://Github.com/racklin/phalcon-dev-box) 裡面已經配置好 Zephir 可以直接使用。

### 安裝

首先，我們要安裝相依套件。

> brew install re2c
> brew install json-c

不過 re2c 似乎在安裝 XCode 時已經有了，而且我系統內的版本還比 Homebrew 的還新（基本上跳出有安裝過之類的訊息就不用再次安裝了⋯⋯）

因為 Zephir 似乎沒有單一個執行檔的功能，因此我個人是習慣放到 `~/.tools` 資料夾裡面，與一般工具區分開來。

> cd ~/.tools
> git clone https://Github.com/phalcon/zephir
> cd zephir

因為 Mac 中沒有 /opt/local/lib 這個目錄，我們要編輯 install 這個檔案。
把 `-L/opt/local/lib` 這段刪除（讓編譯時不要在這個目錄找相關的 Library）

修改後的 install 裡面的 gcc 指令大概會長這樣

``` sh
gcc -Wl,-rpath /usr/local/lib -I/usr/local/lib -L/usr/local/lib -g3 parser.c scanner.c -ljson -ljson-c -o ../bin/zephir-parser
```
之後執行 install 即可

> ./install

接著可以修改 `~/.bashrc` 或者相關檔案，加入以下這行

``` sh
export PATH=$PATH:~/.tools/zephir/bin
```

重開 Terminal 或者輸入 `source ~/.bashrc` 之後，就可以直接使用 zephir 指令了！

### 寫一個簡單的 Router

為了可以觀察到改變，我們先來用 PHP 做一個簡單的 Router 測試。
基本上就是會將 `https://localhost/myApp/index` 轉成 `$controller = new MyApp(); $controller->index()` 的語法。

這邊基本上就不多敘述實作，以下是這次範例用的 Router 原始碼。

``` PHP Router.PHP
<?PHP

namespace MyRouter;

class Router {
	protected $basePath = "";
  protected $currentPath = "";
  protected $defaultMethod = "";
  public $notFound = null;

  public function __construct($basePath = "") {
    $this->basePath = $basePath;
    $this->defaultMethod = "index";
  }

  /**
   * Dispatch
   *
   * Create class instance and call method
   */
  public function dispatch()
  {
    $parseURI = $this->parseURI();
    if(!empty($this->basePath) && $this->basePath == $parseURI[0]) {
      $parseURI = array_slice($parseURI, 1);
    }

    $class = null;
    $method = null;
    if(isset($parseURI[0])) {
      $class = $parseURI[0];
      $class = ucwords($class);
    }
    if(isset($parseURI[1])) {
      $method = $parseURI[1];
    }

    if(is_null($class) || !class_exists($class)) {
      $this->error(404);
      return;
    }

    $classInstance = new $class;

    if(is_null($method)) {
      $this->callMethod($classInstance, $this->defaultMethod);
      return;
    }

    $this->callMethod($classInstance, $method);

  }

  /**
   * Call Method
   *
   * @param object $class
   * @param string $method
   */

  private function callMethod($class, $method) {
    if(is_callable(array($class, $method))) {
      call_user_func(array($class, $method));
    } else {
      $this->error(404);
    }
  }

  /**
   * Error
   *
   * @param int $code
   */

  public function error($code = 500) {
    if($code == 404) {
      if(is_callable($this->notFound)) {
        call_user_func($this->notFound);
      } else {
        echo "404 Not Found";
      }
    } else {
      echo "Error {$code}";
    }
  }

  /**
   * Parse URI
   *
   * Analytic URL and turn into class and method
   *
   * return array [$class, $method]
   */

  protected function parseURI()
  {
    $currentURI = $_SERVER['REQUEST_URI'];
    $pattern = "/\/([a-z][a-z0-9-]*)/i";

    $matches = array();
    preg_match_all($pattern, $currentURI, $matches);

    return array_slice($matches, 1)[0];
  }
}
```

使用方式（index.PHP 為例）

``` PHP index.PHP
<?PHP

require("Router.PHP");
// require some class for dispath

$router = new MyRouter\Router();
$router->dispatch();

```

另外還需要一個 Rewrite Rule 來轉換（這邊使用 Laravel 的 .htaccess）
```
<IFModule mod_rewrite.c>
  Options -MultiViews
  RewriteEngine On

  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteRule ^ index.PHP [L]
</IfModule>
```

基本上會運作後，就來改寫成 Zephir 的版本吧！

### 改寫為 Zephir 版本

雖然基本上都和 PHP 類似，不過仍有不少 [Syntax](https://zephir-lang.com/language.html) 上的差異，建議大家先稍微讀過（不會很難，比新學語言簡單多了！）

一開始要初始化專案，我先建立一個 myExtension 放置我的 PHP Extension 專案，然後這邊建立一個 MyRouter 的專案。
> mkdir -p ~/myExtension/MyRouter
> cd ~/myExtension/MyRouter
> zephir init

完成後，目錄下應該會多出一些檔案。

* config.json - 設定檔，裡面應該會寫著 namepsace 是什麼
* ext/ - 最後生成的 PHP Extension 會在這個資料夾找到
* myrouter/ - 放置 .zep 檔案的目錄（類似 PSR-0 的 Class 目錄規則，不過都是小寫）

接著把剛剛的 Router.PHP 複製進去，重新命名為 router.zep 然後著手改寫。

以下有不少地雷（我找 Syntax, Compile Error 超久，都用註解說明）

``` zep myrouter/router.zep
namespace MyRouter;

class Router {
	// 單純去掉 $ 即可（雖然有 $ 似乎不會被當成錯誤）
  protected basePath = "";
  protected currentPath = "";
  protected defaultMethod = "";
  public notFound = null;

  public function __construct(string basePath = null) {
    let this->basePath = basePath; // 所有 Assign 的動作都要用 let
    let this->defaultMethod = "index";
  }

  /**
   * Dispatch
   *
   * Create class instance and call method
   */
  public function dispatch()
  {
    var parseURI; // 像是 Array 之類的都分類在 Dynamic Variable 裡面，用 var 賦值（分不清楚用 var 比較保險）
    let parseURI = []; // 做這個動作讓他判定為 Array (官方 Blog 有另一種做法，沒測試過)
    let parseURI = this->parseURI(); // 從 parseURI 方法取得分析好的 Array
    if !empty(this->basePath) && this->basePath == parseURI[0] {
      let parseURI = array_slice(parseURI, 1); // 所有 PHP 的 Function / Class 基本上都可以直接取用
    }

    var className;
    var method;
    var value; // 下面會用 fetch 來替代 isset (官方部落格表示必須這樣用) 所以要先定義變數給他用

    let className = null; // 給予初始值，如果沒有做這個動作後面的 is_null() 檢查都會讓變成 PHP Process 直接死掉
    // --- 以下為推測，因為碰到問題點在這，但是詳細關係有待釐清 ---
    // 關於這部分 阿土伯大大 也給出解釋，因為底層還是 C 所以離開 Scope 記憶體清除，就會 segfault
    // 關於 Segmentation fault (segfault) 因為沒有碰過，所以暫時先搜集資料，代理解後在分享詳細的資訊
    let method = null;

    if fetch value, parseURI[0] { // 這個寫法跟 isset 效果相同，這邊比較不一樣
      let className = value;
      let className = ucwords(className);
    }

    if fetch value, parseURI[1] {
      let method = parseURI[1];
    }

    if is_null(className) || !class_exists(className) {
      this->error(404);
      return;
    }

		/**
     * 這邊是因為 PHP 可以用 new $someClass; 的方式產生新物件（物件名稱用變數代替）
     * 但是 Zephir 會把你的變數當成 Class Name 所以無法正常產生，那麼就藉由 class_alias 方法處理
     * class_alias 要傳入兩個參數（字串）第一個是原始類別，第二個是他的匿名類別名稱
     * 所以透過這個方法，所有 Router 傳入的 Class Name 都被轉成統一的 ProxyClass 來產生實例使用
     */
    
    // class_alias(className, "ProxyClass"); // 注意，字串一律使用雙引號，單引號被視為 char
    var classInstance;
    //let classInstance = new ProxyClass;
		var classInstance = create_instance(className); // 阿土伯大大提供了正確的用法，也不會被編譯器警告了！
    // create_instance_params(className, params) 是有參數的用法
    
    if method == null {
      this->callMethod(classInstance, this->defaultMethod);
      return;
    }

    this->callMethod(classInstance, method);

  }

  /**
   * Call Method
   *
   * @param object $class
   * @param string $method
   */

  private function callMethod(var instance, string method) {
    if is_callable([instance, method]) { // 用 [] 直接產生 Array 是被接受的（也許是跟進 PHP 5.4 的新功能）
      call_user_func([instance, method]);
    } else {
      this->error(404);
    }
  }

  /**
   * Error
   *
   * @param int $code
   */

  public function error(int code = 500) {
    if(code == 404) {
      if(is_callable(this->notFound)) {
        call_user_func(this->notFound);
      } else {
        echo "404 Not Found";
      }
    } else {
      echo "Error {code}";
    }
  }

  /**
   * Parse URI
   *
   * Analytic URL and turn into class and method
   *
   * return array [$class, $method]
   */

  protected function parseURI()
  {
    var currentURI;
    let currentURI = _SERVER["REQUEST_URI"];
    var pattern = "@/([a-z][a-z0-9-]*)@i"; // 這邊用 \/ 去脫跳不知道為什麼會出錯，只好改用其他界定符號

    var matches;
    let matches = [];
    preg_match_all(pattern, currentURI, matches);

    var schema;
    let schema = array_slice(matches, 1);
    return schema[0];
  }
}

```

完成之後，在目錄下執行指令

> zephir [compile]

compile 可以省略，但是我似乎找不到 help 的 command 來看支援什麼，目前已知 init 和 compile 兩個（遠望）

### 安裝與測試

因為我平常使用 [PHPBrew](https://Github.com/c9s/PHPbrew) 來建構 PHP 的測試環境，因此以下範例是複製到 PHPBrew 的 Extension 目錄。

> sudo cp ext/modules/myrouter.so ~/path/to/your/PHP/extensions/
> PHPbrew ext enable myrouter
> sudo apachectl graceful

PHPBrew 提供很方便的 command 來啓用 extension 基本上就是到 PHP.ini 加上 `extension=myrouter.so` 就能使用了！

最後，我們重新修改 `index.PHP` 來改用 Extension

``` PHP index.PHP
<?PHP
$router = new MyRouter\Router();
$router->dispatch();
```

重新打開後，如果正常運作就是成功了！

註：上文都沒有產生任何 Router 可以讀取到的 Class 大家可以自己嘗試加入，以下為範例程式碼

https://localhost/app/home

``` PHP index.PHP
<?PHP

class App {
	public function index() {
  	echo "Hello, this index";
  }
  
  public function home() {
  	echo "Hello, you should see this when open /app/home";
  }
}

$router = new MyRouter\Router();
$router->dispatch();

```

---

那麼，用 Zephir 可以做些什麼呢？

* 改善原本程式的效能瓶頸（可能是在無法改變語言的狀況下）
* 商業使用（加密程式碼）
* 在極端的環境下使用（記憶體不足之類的情況）
* 純粹好玩
* 開發一套大型 PHP 框架，嘗試改變些什麼 ( Phalcon )
* 其它也許你能想到的⋯⋯

至少我認為 PHP 藉此開拓了一條新道路，而 Phaclon 團隊的 Zephir 我想一定能夠改變很多東西。

目前我推薦他人學習 PHP 的理由，我會用這兩個：

* 容易取得運行環境、較少權限需求問題
* 容易入門學習，建構成就感

多了 Zephir 我想還可以加上一個「簡單寫超高速 PHP 網站」之類的吧 XDD
（寫許用來寫 PHP Rebot 非常好用啊，高效的機器人，用來分析資料是非常方便的！）
