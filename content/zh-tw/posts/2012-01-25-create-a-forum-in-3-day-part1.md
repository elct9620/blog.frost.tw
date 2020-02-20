---
layout: post
title: '三天做一個論壇 - Part 1'
date: 2012-01-25 21:43
comments: true
tags: 
---


###前言
---
上次挑戰三十分鐘完成留言板雖然不幸（？）失敗，不過這次我成功的在三天的限制內完成了（簡易）論壇。

不過，大概也是時間放的比較寬鬆，所以也比較順利在時間內完成。這次跟上次留言板一樣，是使用 PHP + MongoDB 進行開發。

<!--more-->

### 規劃結構
---
其實和上次大致上沒有什麼變化，不過架構稍微又更加的細分了一些。<br />
[![螢幕快照 2012\-01\-25 下午10\.25\.44](https://farm8.staticflickr.com/7024/6760280007_4e2d76c2bb.jpg)](https://www.flickr.com/photos/elct9620/6760280007/)

### 初始化系統
---
首先先建立 index.PHP 檔案在根目錄，而其他一些Library檔案就請各位自己複製摟（參考上次的 30 分鐘留言板）

``` PHP index.PHP
<?PHP
/**
 * 3Day Fourum
 * 
 * @package 3day-fourm
 * @author Aotoki
 * @version 1.0
 */

/* 載入設定檔 */
 
require_once('config.inc.PHP');
 
/**
 * 載入必要函式庫 
 */

//Slim Framework 
require_once(ABSPATH . 'lib/Slim/Slim.PHP');
 
//ActiveMongo
require_once(ABSPATH . 'lib/ActiveMongo/ActiveMongo.PHP');

//Facebook API
require_once(ABSPATH . 'lib/Facebook/facebook.PHP');

/* 載入起動器 */
require_once('bootstrap.PHP');

?>
```

這次的 index.PHP 我們只針對設定檔、函式庫載入，並且呼叫 bootstrap.PHP 這個檔案初始畫整個網站。


接下來，我們來看看 bootstrap.PHP 檔案

``` PHP bootstrap.PHP
<?PHP
/**
 * Bootstrap
 * 
 * @package 3day-forum
 * @author Aotoki
 * @version 1.0
 */

/* 修正時區 */
date_default_timezone_set("Asia/Taipei");
 
/* 初始化 Slim Framework */
$app = new Slim(array(
	'mode' => 'development',
	'http.version' => '1.1',
	'debug' => DEBUG,
	'templates.path' => ABSPATH . 'vendor/themes',
	'cookies.secret_key' => COOKIE_SECRET_KEY,
));

/* 初始化資料庫 */
if(DB_USER || DB_PASS){
	ActiveMongo::connect(DB_NAME, DB_HOST, DB_USER, DB_PASS);
}else{
	ActiveMongo::connect(DB_NAME, DB_HOST);
}

/* 載入基本資訊 */
$basePath = str_replace('/index.PHP', '', $app->request()->getRootUri()) . '/';
$baseURL = "https://{$_SERVER['HTTP_HOST']}/{$basePath}";

$app->view()->setData('basePath', $basePath);
$app->view()->setData('baseURL', $baseURL);
$app->view()->setData('app', $app);

/* 讀取  App 邏輯 */
require_once(ABSPATH . 'app/Template.PHP');

/* 讀取 App 模型 */
require_once(ABSPATH . 'app/models/Users.PHP');
require_once(ABSPATH . 'app/models/Forums.PHP');
require_once(ABSPATH . 'app/models/Thread.PHP');
require_once(ABSPATH . 'app/models/Posts.PHP');

/* 讀取 App 介面 */
require_once(ABSPATH . 'app/web/Post.PHP');
require_once(ABSPATH . 'app/web/User.PHP');
require_once(ABSPATH . 'app/web/Home.PHP');

/* 運行 */
$app->run();

```

首先，為了避免時間顯示不正確，先將時區設定為 亞洲/台北 （各位可以依照自己的需求設定時區）

接下來，就是初始化 Slim Framework 以及 ActiveMongo 了！<br />
基本上和上一次無異，不過在 Slim Framework 的 Mode 部分，因為弦也忘記定義一個常數，所以各位務必記得在 Deploy 的時候將其改為 production 以免錯誤訊息露出來了！

> 在 Slim Framework 會統一處理錯誤訊息，所以會有統一錯誤頁面。而 DEBUG + Development 的狀況下，則可以看到詳細的錯誤訊息，但在 Production 下，則只會顯示 Error 以及一段訊息說明發生錯誤了！

不過，在這之外，還是要注意「在非 Slim Framework 作用區外的錯誤還是會被顯示」

接下來，我稍微設定了幾個常用的數值，並且以 $app->view()->setData() 的方式設定，往後所有使用 render() 方法的佈景都可以使用這些預置的變數。

接著，我們依序載入 App, Model, Web App 的部份。
> APP 這邊是指原生屬於系統，而非之後以 Plugin 加入的部份。

另外，我們要注意 app/web/Home.PHP 是最後一個，一開始可能不會發現有什麼問題，不過當我們製作 Profile 頁面讓使用者修改 暱稱 時，就會發現 Router 在處理網址時發生了判斷問題。

###建立Model
---
因為 MongoDB 不需要另外建立資料表，所以我們就安心的直接建立 Model 檔案。

因為是論壇，所以會需要有記錄會員用的Model(Users.PHP)還有討論版（Forums.PHP）以及主題(Thread.php)跟文章(Posts.php)

首先，我們先來看會員的 Model 長怎樣。

``` PHP app/models/Users.PHP
<?PHP
/**
 * User Model
 * 
 * @package 3day-forum
 * @author Aotoki
 * @version 1.0
 */

class Users extends ActiveMongo
{
	//資料表欄位
	public $userID; //使用者編號(Facebook ID)
	public $Nickname; //使用者膩稱
	public $Type; //使用者類型（1 = Admin, 0 = User）
	
	/**
	 * Get User
	 * 
	 * @author Aotoki
	 * @return object|bool 成功傳回 User 物件，失敗則傳回 FALSE
	 */
	
	static public function getUser( $fromUserID = NULL )
	{
		$userID = $fromUserID;
		if(!$userID){
			$FB = new Facebook(array(
				'appId' => FB_APP_ID,
				'secret' => FB_SECRET,
			));
			
			$userID = $FB->getUser();
		}
		
		if(!$userID){
			$app = Slim::getInstance();
			$app->redirect($FB->getLoginUrl());
		}else{
			$user = new Users;
			$user->findOne(array('userID' => $userID));
			if(!$user->valid()){
				$user->userID = $userID;
				$user->save();
			}
			
			if(!$fromUserID){
				$app = Slim::getInstance();
				$app->view()->setData('user', $user);
			}
			return $user;
		}	
	}
}

```

欄位很簡單，只有 會員編號、暱稱、類型 三個。而類型部分，因為並沒有安裝論壇的部份，需要手動操作資料庫去設定會員類型，該如何初始化，以及如何處理，就交給各位發揮創意摟！<del>某人超懶所以就變成這樣</del>

接下來，會看到一個 static 的方法叫做 getUser() 這是用於取得使用者的方法。
> 為什麼要用 static 方法呢？因為弦也認為這些方法都是直接產生一個實例傳回，而非改動物件設定值後一併傳回，所以決定以 static 的方法來做處理。

這個 getUser 的方法也非常簡單，如果有指定 userID 那麼就跳過 Facebook 登入並且繼續執行，反之則進行 Facebook 登入，取得 Facebook 的使用者編號，並且查詢系統內使用者，如果無使用者，則新建一個。

最後，再將使用者物件傳回。

接下來是 Forums.PHP 這個檔案，我想是全部 Model 中最為複雜的部份，也是整個論壇最複雜的檔案。

``` PHP app/models/Forums.PHP
<?PHP
/**
 * Fourums
 * 
 * @package 3day-forum
 * @author Aotoki
 * @version 1.0
 */

class Forums extends ActiveMongo
{
	//資料表欄位
	public $Name; //論壇名稱
	public $Parent; //父論壇
	
	/**
	 * Get Forum
	 * 
	 * @author Aotoki
	 * @param string 論壇ID
	 * @return object|bool
	 */
	
	static public function getForum( $ID, $forumArgs = array() )
	{
		$forum = new Forums;
		$forum->findOne(new MongoId($ID));
		
		array_push($forumArgs, $forum);
		if(isset($forum->Parent)){
			$forumArgs = self::getForum($forum->Parent, $forumArgs);
		}
		sort($forumArgs, SORT_DESC);
		return $forumArgs;
	}
	
	/**
	 * Get Forums
	 * 
	 * @author Aotoki
	 * @param string 父論壇ID
	 * @return object|bool 成功傳回 Forum 物件，失敗傳回 FALSE
	 */
	
	static public function getForums( $parentID = NULL)
	{
		$forums = new Forums;
		$forums->find(array('Parent' => $parentID));
		
		$result = array();
		
		foreach ($forums as $ID => $forum) {
			$lastPost = new Thread;
			$lastPost->sort('timestamp DESC');
			$lastPost->where('forumID',(string) $forum->getID());
			$lastPost->limit(1);
			
			if(!$lastPost->valid()){
				$lastPost = array();
			}else{
				$lastPost = $lastPost->getArray();
			}
			
			$result[] = array(
				'forum' => $forum->getArray(),
				'lastPost' => $lastPost,
			);
			
			unset($lastPost);
		}
		
		return $result;
	}
	
	/**
	 * Create Forum
	 * 
	 * @author Aotoki
	 * @param string 論壇名稱
	 */
	
	static public function createForum($Name, $Parent = NULL)
	{
		$forum = new Forums;
		$forum->Name = $Name;
		if($Parent){
			$forum->Parent = $Parent;
		}
		$forum->save();
		unset($forum);
	}
	
	/**
	 * Delete Forum
	 * 
	 * @author Aotoki
	 * @param string 論壇ID
	 */
	
	static public function deleteForum($forumID)
	{
		
		$parentID = NULL;
		
		$forum = new Forums;
		$forum->findOne(new MongoId($forumID));
		if(isset($forum->Parent)){
			$parentID = $forum->Parent;
		}
		$forum->delete();
		
		$subForums = self::getForums($forumID);
		foreach($subForums as $ID => $forum){
			self::deleteForum($ID);
		}
		
		$topics = new Thread;
		$topics->find(array('forumID' => $forumID));
		foreach($topics as $ID => $topic){
			Thread::deleteTopic($ID);
		}
		
		return $parentID;
	}
	
}
```

欄位非常簡單，就只有 Name 以及 Parent 兩個值。代表的意義就是 討論版 的名字，以及其父討論版的 ID (如果沒有父討論版則是 NULL)

接下來，就是本次最複雜的部分，論壇的各個方法。選用 static 的理由已經說明了，因此先從 getForum() 開始介紹起。

####getForum
從原始碼可以得知，這是一個遞迴函式，每當所在論壇層級越低，遞迴次數就會越多（不斷的追溯父論壇）

首先，我們要先找出目前論壇，與 MySQL 這類關聯式資料庫不同，在 MongoDB 下沒有可以自動遞增的欄位屬性，所以我們只好借用每個物件都會存在的 _id 欄位，來當做識別標準。

> 在 MongoDB 內儲存的是名為 ObjectId 物件的格式，無法直接以字串方式查詢，但是 ActiveMongo 也沒有自動轉換的方式，所以我們使用 Mongo 的 PHP Driver 內建的 MongoId 物件來轉換（不過直接輸出他，是會自動轉換回字串格式的）因為操作中有兩種查詢方式（字串跟物件）希望大家不會搞混。

找到論壇後，則塞入 $forumArgs 變數，並且檢查是否有父論壇，如果有，那麼就繼續遞迴，反之則傳回整理好的 $forumArgs 函式。

> 傳回前做 sort(排序) 處理的原因主要是因為 FIFO (First Input First Output) 會讓原本是最低層級的論壇出現在第一個，違反常理，應該是要 Parent > Child 才會正確，所以才這樣處理。

說實在的，把這個函式叫做 getForumTree() 搞不好會比較貼切。

####getForums
接著，是 getForums 這個方法。邏輯上就比起前面的還簡單多了！

假設沒有 Parent 的傳入，那麼就單純查詢論壇（無 Parent 的論壇，也就是最頂層的論壇）假設有，則查詢 Parent 與之相符的論壇。

> 這邊的 Parent 因為在儲存時已經以 string(字串) 方式儲存，所以不需要用 MongoId 物件來轉換成 ObjectId

實際上，其實只要這樣就足夠了！不過我們還希望得知這個討論版最後一次有新文章是什麼時候，所以決定對 Thread 查詢。

> 後面會提到 Thread 這個 Model 我們用來儲存每篇主題與討論版的關聯性，以及這篇主題是什麼時候被建立的。

因為不單純只有一個討論版，所以放入迴圈，依序取出每個討論版後，在做查詢。首先，我們先用 sort 這個方法指定依照時間排序，接著用 where 方法找出在該討論版的主題，最後用 limit 限制只傳回一筆資料。

> 扣除 sort 方法，其實可以直接用 findOne() 方法，但是我們需要排序，所以改用這樣的方式查詢（也許我們可以用關聯式的查詢，不過弦也對這部份操作還不清楚，所以土法煉鋼一下～）

接著，我們將其放入 $result 陣列中，傳回。

> $result[] = array() 是讓陣列自動產生 Key 和 array_psuh() 類似，而為什麼要對 $forum 進行 getArray() 指令產出陣列呢？這是因為弦也開發時發現如果直接傳入物件，取出時會變回空的 Forums 物件而非一個指定某個討論版的物件，為了保持資料，所以就這樣做處理。

####createForum
這個方法相較之下，就筆其他簡單許多。

僅是單純的建立一個 Forums 物件，並且將 Name 以及 Parent 存入而已。最後的 unset() 動作是釋放記憶體，雖然函式呼叫完應該也會自動釋放，不過還是手動釋放避免該擾吧！

> 其實 getForums 的迴圈釋放 $lastPost 用意也一樣，但是這個動作可以確保下次迴圈運行時不會不小心用到上一筆資料。

####deleteForum
終於，我們到了最後一個方法，這個方法可以視為 getForum 跟 getForums 混合後的修改版。

首先找出應該刪除的討論版，並且加以刪除（順便記錄其父討論版）
接著找出子討論版，並且刪除（使用遞迴方式，確保子討論版下的子討論版也都會被刪除）

接著刪除討論版下的所有主題（這邊使用 Thread 的 deleteTopic 方法，是為了一併刪除相關的文章）
最後傳回父論壇的 ID 以方便重新定向時可以轉跳到其父討論版，而不會跳回首頁。

###總結
---
我想一次吸收這麼多資訊應該很難消化，所以先在這邊做一個段落。<br />
（不是因為我想偷懶喔，因為之後的 Thread Model 也有不少於 Forums Model 的方法要解釋）

下一篇文章除了將剩下的 Model 解釋完之外，還會繼續解說其餘的 Web App 部分。

* Github 原始碼：[https://Github.com/elct9620/3Day-Forum/zipball/1.0](https://github.com/elct9620/3Day-Forum/zipball/1.0)
* 線上範例 ：[https://the-3day-forum.Herokuapp.com/](https://the-3day-forum.herokuapp.com/)
