---
layout: post
title: '三十分鐘做一個留言板 Part 1'
date: 2012-01-03 16:10
comments: true
tags: 
---


### 前言
---
其實我自己也不確定是不是三十分鐘完成，畢竟弦也在製作時花了數倍的時間做 Debug 和架構的動作，不過如果再做一次，我想就有信心三十分鐘完成的！

<!--more-->

### 規劃架構
---

[![2012\-01\-03 16\-22\-15](https://farm8.staticflickr.com/7159/6626625299_e19bab872e.jpg)](https://www.flickr.com/photos/elct9620/6626625299/)

這是弦也在完成後的架構，不過也有先替之後的更新做了準備。<br />
這次我們只需要用到這樣的結構就可以。
<pre>
+ app/
	+ models/
		- Comment.PHP
	+ config.inc.PHP
+ lib/
	+ ActiveMongo/ - ORM
	+ Slim/ - Framework
+ views/
	- home.PHP
- .htaccess
- index.PHP
</pre>

除了 lib 資料夾裡面的東西是使用外部的函式庫之外，其餘都是自己撰寫的（.htaccess則是從 Slim Framework 預設給的檔案複製過來的）

這個架構是參考 Slim Framework 官方網站的說明，針對規模比較大的網站所建議的架構，雖然現在規模不大，不過要是有一天要擴大規模時，這個架構就會變得非常方便。

### 下載 Library 放置
---

首先，我們要先下載 Slim Framework 以及 ActiveMongo 然後放到 lib 資料夾，這樣之後才能夠使用。

* Slim Framework - [https://www.slimframework.com/](https://www.slimframework.com/)
* ActiveMongo - [https://Github.com/crodas/ActiveMongo](https://github.com/crodas/ActiveMongo)
* Bootstrap - [https://twitter.Github.com/bootstrap](https://twitter.github.com/bootstrap)

雖然這次會使用到 Twitter 的 Bootstrap 不過我們採用直接連結的方式引入 CSS 檔，因為目前留言板還不需要做太多美化，只要介面看起來簡潔乾淨即可。

#### Slim Framework

解壓縮 Slim Framework 打開後，應該會看到這樣的畫面。<br />

[![2012\-01\-03 16\-37\-19](https://farm8.staticflickr.com/7017/6626669915_4368aa2f0d.jpg)](https://www.flickr.com/photos/elct9620/6626669915/)

我們只需要 Slim 資料夾以及 .htaccess 檔而已，所以將 Slim 資料夾放到專案的 lib 資料夾裡面，並且把 .htaccess 檔放到專案的根目錄。

> .htaccess 檔可以讓我們啟用 Rewrite 功能，有興趣可以到網路上搜尋看看。 <br />

####ActiveMongo

解壓縮 ActiveMongo 打開後，應該會發現只看到 lib 資料夾而沒有 ActiveMongo 資料夾，請先別急。<br />
[![2012\-01\-03 16\-37\-29](https://farm8.staticflickr.com/7172/6626669973_d6a1e3d0a7.jpg)](https://www.flickr.com/photos/elct9620/6626669973/)

因為開發者不一樣的關係，所以習慣也不一樣。打開 lib 資料夾後馬上就發現直接就是檔案，為了方便自己整理，弦也決定重新命名 lib 為 ActiveMongo 並且複製到自己專案的 lib 資料夾內。<br />
<br />
現在，專案的 lib 資料夾應該會長成這樣：<br />
<pre>
+ lib/
	+ ActiveMongo/
	+ Slim/
</pre>

完成後，就要開始來撰寫留言板摟！

### 設定檔
---

首先，先來對程式的一些基本設定做好準備吧！<br />
我們會使用到資料庫，所以一定要有連接資訊等等，所以先在 app 資料夾下新增 config.inc.PHP 來紀錄一些設定吧！<br />


習慣性的註解一下（其實每次 Version 弦也都會忘記改）
``` PHP config.inc.PHP
<?PHP
/**
 * Conifg
 * 
 * @author Aotoki
 * @version 1.0
 */

```

接著放入資料庫資訊
``` PHP config.inc.PHP
<?PHP
/**
 * Conifg
 * 
 * @author Aotoki
 * @version 1.0
 */

//資料庫資訊
define('DB_HOST', 'localhost'); //伺服器
define('DB_NAME', '30min-GB-V1'); //資料庫名稱
define('DB_USER', ''); //使用者名稱
define('DB_PASS', ''); //使用者密碼

```

最後把一些常數放進去
``` PHP config.inc.PHP
<?PHP
/**
 * Conifg
 * 
 * @author Aotoki
 * @version 1.0
 */

//資料庫資訊
define('DB_HOST', 'localhost'); //伺服器
define('DB_NAME', '30min-GB-V1'); //資料庫名稱
define('DB_USER', ''); //使用者名稱
define('DB_PASS', ''); //使用者密碼

//設定基準路徑
if(!defined('ABSPATH')){
	define('ABSPATH', dirname(__FILE__) . '/');
}

//設定除錯模式
define('DEBUG', TRUE);
```

這樣一來，就完成設定檔了！<br />
（說實話，其實弦也平常都是邊寫邊加的，不一定要一開始就全部設定上去。）

### 建立基礎

現在，我們先在根目錄下新增一個 index.PHP 檔案，他就像 Router (路由) 一樣，全部的請求都會經過他處理（因為 Rewrite 被開啟的關係，伺服器會相關的處理都丟給 index.PHP 處理）
<br />
一開始，我們先把一些必要得檔案引用進來（像是 Slim Framework, Active Mongo, 設定檔等等）
``` PHP index.PHP
<?PHP
/**
 * 30Min Guest Book
 * 
 * @author Aotoki
 * @version 1.0
 */

//載入 Slim Framework
require_once('lib/Slim/Slim.PHP');

//載入 Active Mongo (ORM)
require_once('lib/ActiveMongo/ActiveMongo.PHP');

//載入設定檔
require_once('app/config.inc.PHP');

?>
```

接下來，我們要初始化 Slim Framework 讓他可以運行，接著加入以下的程式碼
``` PHP index.PHP (續)
//初始化 Slim Framework
$app = new Slim(
	array(
		//'http.version' => '1.0', //在PHPFog或不支援 HTTP 1.1 的伺服器上使用這個設定
		'templates.path' => 'views', //設定 View 資料夾（視圖層）
		'debug' => DEBUG, //從設定檔讀取是否啟用除錯
	)
);
```

這樣，我們就可以用 $app 來做相關 Slim Framework 的操作了！
> 上面這段程式碼，是取得物件的實例並且存在名叫 app 的變數內。<br />
$app 是一個變數，請想像他是一個萬用箱子，可以放入任何東西，但是一次只能有一種東西。<br />
Slim 是一個物件，但是他還未產生實例之前就跟設計圖一樣，裡面紀錄很多關於他的能力。<br />
$app = new Slim(); 這就是我們用 new 產生一個新的物件，叫做 $app 而且他是以 Slim 這個設計圖為基礎製作的。<br />
而在建立時我們會給他一些參數，就像是 templates.path 等等，以上的動作我們可以參考牙膏的製作。<br />
黑人牙膏 = 牙膏（一組秘密配方） 所以黑人牙膏會是黑人牙膏！

然後，我們要先連接好資料庫，不然之後的存取就沒辦法使用了！<br />
一樣，接著前面放入這些程式碼
``` PHP index.PHP (續)
//連接資料庫（MongoDB）
if(DB_USER && DB_PASS){
	ActiveMongo::connect(DB_NAME, DB_HOST, DB_USER, DB_PASS); //從設定檔讀取資料庫資訊
}else{
	ActiveMongo::connect(DB_NAME, DB_HOST); //因為ActiveMongo沒有動態設定使用者名稱/密碼的功能，所以另外檢查
}
```

為什麼要用 if(DB_USER & DB_PASS){} 呢？這是因為 Active Mongo 如果不需要帳號密碼時，還是設定進去，會發生錯誤，所以只好這樣設計。（也許我們可以在設定檔將 '' 改為 NULL）<br />

然後，要定義對應的位址，這樣 Framework 才知道什麼時候該顯示什麼！
``` PHP index.PHP (續)
$app->get('/', function() use ($app){
	$app->render('home.PHP');
});

$app->run(); //啟動 Slim Framework

```

> $app->get(); 的 get 就是所謂的方法，就像牙膏可以有「擠」這個動作一樣。

> function() use ($app) 是 PHP 5.3 之後的功能，要這樣使用請注意自己的 PHP 版本是 5.3 之後，這個功能關係 namespace 暫時不討論

到此為止，我們已經對 index.PHP 做好簡單的設定，現在我們要建立剛剛 render 進來的 home.PHP 好讓留言板能顯示出畫面。

### 第一個樣板

首先，我們先建立一個空白的網頁，大致建立其基礎。
``` html home.PHP
<!DOCTYPE html>
<html lang="zh-tw">
<head>
	<meta charset="utf-8" />

	<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />

	<title>My 30min Guest Book</title>
	<meta name="description" content="" />
	<meta name="author" content="Aotoki" />

	<meta name="viewport" content="width=device-width; initial-scale=1.0" />
</head>

<body>
	<div class="container">
		<header>
			<h1>Guest Book</h1>
		</header>
		<nav>
			<!--- 選單 -->
		</nav>

		<div>
			<!-- 內容 -->
		</div>

		<footer>
		 <p>&copy; Copyright by Aotoki</p>
		</footer>
	</div>
</body>
</html>

```

我選擇了 HTML5 的方式建立，現在打開瀏覽器，連上留言板應該會看到一個粗體字寫著"Guest Book"然後就沒了！<br />
不過，這也是正常的。

### 小結
---
好吧，我承認對初次接觸的大家來說做到這樣可能已經花上三十分鐘了！<br />
所以，先休息一下，待會 Part 2 就會繼續解說關於讀取留言的部份，雖然有點抽象，但是等留言功能完成的時候，就會發現非常的感動喔！
