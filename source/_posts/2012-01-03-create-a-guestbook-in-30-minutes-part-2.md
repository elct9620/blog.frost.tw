---
layout: post
title: '三十分鐘做一個留言板 Part 2'
date: 2012-01-03 18:31
comments: true
tags: 
---


### 前言（<del>廢話</del>）
---

又到了快樂的 Part 2 摟！（<del>相隔時間可能只有幾小時而已</del>）這樣馬拉松寫文章還真是刺激，不過各位不用跟我一樣馬拉松式的把他做完阿！！

<!-- more -->

### 建立模型（Model）
---

基本上，就是產生一個物件，讓自己方便做一些特殊（？）的操作就是了！不過在 ActiveMongo 其實也就是先去定義一下有哪些欄位，然後就結束了！（當然，還有很多很神奇的技巧，不過還是先別探討了！）

首先，在 app/models 資料夾新增一個 Commetn.PHP 檔案，然後建立一個 Model
``` PHP Comment.PHP
<?PHP
/**
 * Comment Model
 * 
 * @author Aotoki
 * @version 1.0
 */

class Comment extends ActiveMongo
{
	public $nickname = 'Unknow';
	public $content;
	public $timestamp;	
}

```

沒錯，不要懷疑，就只有這樣！<br />
在 Active Mongo 建立一個Model只要繼承 ActiveMongo 這個物件，接著將欄位設定上去即可。<br />
因為目前留言板只需要紀錄 暱稱（Nickname） 以及 留言內容（Content） 和 時間（Timestamp） 即可，而且還不需要其他多餘的功能，因此保持這個狀態就完成 Model 了！

### 讀取留言（簡易）
---

我們回到 index.PHP 檔案，在連接資料庫的語法下方（上一篇文章提到的 ActiveMongo::connect() 區段下方），加入讀取 Model 的程式。
``` PHP index.PHP
//載入 Model
require_once(ABSPATH . 'models/Comment.PHP');
```

位置會在第一個 $app->get(); 之前，因為我們必須先把 Model 引入，不然是無法使用這個 Model 的。

接著，我們編輯上一篇文章 $app->get(); 的部份，大致上改成這樣。
``` PHP index.PHP
$app->get('/', function() use ($app){
	$comments = new Comment(); //產生模型實例
	$totalComments = $comments->count(); //取得留言總數
	$comments->reset(); //清除指標，避免影響結果

	$app->render('home.PHP', 
		array(
			'comments' => $comments,
			'totalComments' => $totalComments,
		)
	);
});
```

剛剛，我們新增了一個 Comment 物件，因為 Active Mongo 會自動幫我們處理好一開始的查詢，所以我們只要直接讀取 $comments 就可以得知所有的留言了！<br />
為了要讓我們的佈景檔（home.PHP）得知 $comments 這筆資料，我們使用 Slim Framework 的 render 方法的第二個參數，將 $comments 以 comments 這個識別名稱傳給 home.PHP 讓他可以使用。

現在，編輯 views/home.PHP 加入迴圈（Loop）將留言顯示出來（當然，目前還沒有任何留言，不會顯示任何東西）

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
	<link rel="stylesheet" href="http://twitter.Github.com/bootstrap/1.4.0/bootstrap.min.CSS" />
	<style>
		.container{
			margin:15px auto;
		}
		
		.comment-count{
			margin-bottom: 10px;
		}
		
	</style>
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
			<div class="comment-count">
				<span class="label notice">Notice</span>
				System has <?PHP echo intval($totalComments); ?> comments.
			</div>
			<?PHP foreach($comments as $c){ ?>
			<blockquote>
				<p><?PHP echo $c->content; ?></p> <!-- 顯示留言內容 -->
				<small><?PHP echo $c->nickname; ?>, <?PHP echo date('Y-m-d H:i:s', $c->timestamp); ?></small> <!-- 顯示暱稱以及輸出留言時間 -->
			</blockquote>
			<?PHP } ?>
		</div>

		<footer>
		 <p>&copy; Copyright by Aotoki</p>
		</footer>
	</div>
</body>
</html>
```

因為有了初步的畫面顯示，所以就直接將 Bootstrap 的 CSS 用 Link 的方式直接導入（官方網站上的快速引用）這樣一來，原本單調的畫面也稍微變得豐富一點，目前可以看到畫面上顯示著之前設定的 Guest Book 標題以及 [Notice] System has 0 comments. 的字樣。

### 新增留言
---

既然輸出留言完成了，但是無法留言還是沒有辦法讓留言板發揮作用，所以打開 index.PHP 檔案，繼續編輯。

我們將位置移動到 $app->get('/', function() use ($app){}); 區塊的下方，加入新的區塊。
``` PHP index.PHP

$app->post('/new', function() use ($app){
	//Save Comment
	$comment = new Comment;
	$comment->nickname = $app->request()->post('nickname');
	$comment->content = $app->request()->post('content');
	$comment->timestamp = time();
	$comment->save();
	
	$app->redirect($app->urlFor('home'));
});

```

咦，怎麼跟之前讀取的有點像，但是這次？<br />
沒錯，起始的動作還是一樣建立一個 Model 接著，我們設定 $comment->nickname 為 $app->requrest()->post('nickname'); 來讀取暱稱。<br />
不過，大家一定有疑問，是怎麼讀取呢？ $app->requrest(); 會負責處理有關 HTTP 請求得部份，而留言都會以 POST 方式傳輸資料，所以就要以 $app->requrest()->post('資料名稱'); 來接收。<br />
那麼為什麼 timestamp 不用接收呢？那是因為時間總不能由使用者自己決定，所以由我們產生（time() 會給出一組秒數，是從 1970 年 1 月 1 日到今天的秒數。）

不過還是會有人對於 $app->post() 和 $app->get() 的差異有所疑惑吧！對，這個差異就在於 $app->post() 只接受 POST 傳輸資料，所以直接打開 http://網址/new 是會出現找不到頁面的喔！（這也是 Slim Framework的特性，在之後的文章會簡單介紹。）

好，現在已經完成儲存留言的機制了！但是打開網頁卻出現了錯誤？

其實是 $app->redirect() （轉跳網頁）裡面的數值 $app->urlFor() 有問題！
使用 urlFor 這個方法前，得先將目標命名才行，所以我們回到 $app->get('/', function() use ($app) {}) 區段 稍微修改結尾部份。

``` PHP index.PHP
$app->get('/', function() use ($app){
	//略
})->name('home');
```

這樣一來，就可以正常使用摟！而使用 urlFor 的理由就是確保網址格式不會發生問題（像是把留言板放在 http://網址/gb/ 下，如果網址設定為 / 那就會跑去 http://網址/ 而非 http://網址/gb 摟！）

那麼，我們也該幫 $app->post('/new', function() use ($app){}); 設定一下，以備不實之需。
``` PHP index.PHP
$app->post('/new', function() use ($app){
	//略
})->name('new');
```

那麼，最後就是加入表單了！

打開之前的 home.PHP 加入表單部份
``` html home.PHP
<!-- 前略 -->
			<div class="row">
				<div class="span16">
					<form method="post" action="<?PHP echo $app->urlFor('new'); ?>">
						<fieldset>
							<legend>Leave a Comment</legend>
							<div class="clearfix">
								<label>Nickname</label>
								<div class="input"><input name="nickname" type="text" class="xlarge" /></div>
							</div>
							<div class="clearfix<?PHP if($errorStatus){ echo ' error'; } ?>">
								<label for="textarea">Content</label>
								<div class="input">
									<textarea name="content" class="xlarge<?PHP if($errorStatus){ echo ' error'; } ?>"></textarea>
									<?PHP if($errorStatus){ ?><span class="help-block">You must enter some content.</span> <?PHP } ?>
								</div>
							</div>
							<div class="actions">
								<button class="btn primary" type="submit">Add Comment</button>
							</div>
						</fieldset>
					</form>
				</div>
			</div>
<!-- 後略 -->
```

不過，打開網頁又發生錯誤了！到底是怎麼一回事？原來是表單的 action 指向了 $app 但是我們並沒有把 $app 傳給 home.PHP 使用！

回到 index.PHP 稍微修改一下
``` PHP index.PHP
$app->get('/', function() use ($app){
	//略	
	$app->render('home.PHP',
		$app->render('home.PHP', 
		array(
			'comments' => $comments,
			'totalComments' => $totalComments,
			'app' => $app,
		)
	);
})->name('home');
```

呼！這次終於成功運行了！

### 小結
---

好，這次教學就到這邊告一段落！（<del>其實是寫到累了，想偷懶</del>）<br />
如果善用工具如 Aptana, Dreamweaver 會更快的完成喔！

如果對於範例的完整原始碼有興趣，可以到 Github 上面看看。<br />
(V1.0版有加上分頁功能和簡易的檢查機制，而V1.0.1版則是修正了程式碼的Bug各位所看到的都是V1.0.1的程式碼)

* Source Code : [https://Github.com/elct9620/30minGuestBook](https://github.com/elct9620/30minGuestBook)
* Demo : [http://the-30min-gb.Herokuapp.com/](http://the-30min-gb.herokuapp.com/) - 之後教學更新範例網站也會更新，可能不會和目前的一樣。

分頁完成後大致上會長這樣：<br />
[![2012\-01\-03 20\-04\-16](http://farm8.staticflickr.com/7174/6627445927_b4cc17ff2a.jpg)](http://www.flickr.com/photos/elct9620/6627445927/)

<del>但是實際上會跟你想像的落差很大！</del>
