---
layout: post
title: 'Laravel 初次嘗試'
date: 2012-07-14 19:49
comments: true
tags:
---


今天下午用 Laravel 試寫了一下留言板。雖然之前看過文件，但是沒有認真去讀，這次認真用一次之後，感想就是很讚～

一方面是跟 Rails 的設計真的都很類似，又有 Cli 可以使用，光這兩點就省下很多功夫。

總而言之，我要推一下這個 PHP Framework 拉！除了 Slim Framework 之外，這款是我有實際去用過的第三款，用起來也很不錯（蓋章）

<!-- more -->

## 下載
---

這步驟根本是湊字數的（被巴）

我超貼心幫各位把<a href="http://laravel.com/" target="_blank">官網</a>都做好超連結了喔～～

總之就是下載，解壓縮，然後放到可以跑 PHP 的地方，幫 storage 資料夾設定為可寫。<br />
大家可能會不太習慣，不過他是以 public 資料夾為瀏覽的目錄喔～

（所以用在 PagodaBox 這種可以設定根目錄的 PaaS 超爽的）

## 事前設定
---

我跟你們說我超懶的，連 MySQL 都不想設定拉～

所以請打開 application/config/database.PHP 把 'default' => 'mysql' 改成 sqlite 吧～

``` PHP application/config/database.PHP
<?PHP
  //略
  /*
   |--------------------------------------------------------------------------
   | Default Database Connection
   |--------------------------------------------------------------------------
   |
   | The name of your default database connection. This connection will used
   | as the default for all database operations unless a different name is
   | given when performing said operation. This connection name should be
   | listed in the array of connections below.
   |
   */

   'default' => 'sqlite',
   //略
?>
```

第 45 行左右，大概就是這樣喔～

如果你想用 Rewrite 的話，就把 application/config/applicatoin.PHP 裡面的 'index' => 'index.PHP', 改成 'index' => '', 就可以了（至於 .htaccess 檔則是一開始就幫你弄好，超貼心～）

## 路由
---

接下來修改一下 applicatoin/routers.PHP 的設定

一開始大概 35 行會看到這樣

``` PHP applicatoin/routers.PHP
<?PHP
//略

Route::get('/', function()
{
	return View::make('home.index');
});

//略
?>
```

然後我們只要有一個簡單的留言功能，所以直接丟給 Controller 就可以了～

``` PHP application/routers.PHP
<?PHP
//略

Route::controller('home');

//略
?>
```

## Model
---

我們會用到 Migrate 這個超方便的功能，不過要先用個指令～

> PHP artisan migrate:install

這樣 Laravel 才會有 Migrate 紀錄的資料表，也才有辦法知道下次運行 Migrate 時是否要更動資料表

接著創建一個 Migrate 來新增我們留言資料

> PHP artisan migrate:make create_comments_table

之後編輯 application/migrations/日期戳記_create_comments_table.PHP 來撰寫資料表的結構。

``` PHP
<?PHP

class Create_Comments_Table {

	/**
	 * Make changes to the database.
	 *
	 * @return void
	 */
	public function up()
	{
    Schema::create('comments', function($table){ //建立資料表
      $table->increments('ID'); //設定 ID (遞增)
      $table->string('subject'); //留言主旨
      $table->text('content'); //留言內容
      $table->timestamps(); //時間戳記 created_at 跟 updated_at 兩個欄位
    });
	}

	/**
	 * Revert the changes to the database.
	 *
	 * @return void
	 */
	public function down()
	{
      Schema::drop('comments'); //刪除資料表
	}

}
```

接著 Migrate 讓 Laravel 產生 SQL 語法並且寫入資料庫

> PHP artisan migrate

繼續建立 Model 來存取，新增一個檔案 application/models/Comment.PHP

``` PHP application/models/Comment.PHP

<?PHP

  class Comment extends Eloquent
  {
    public static $table = 'comments'; // 指定對應的資料表
    public static $per_page = 5; //設定分頁時每頁筆數（預設 20 筆）
  }

```

這樣一來 Model 就建立好了，因為只需要簡易的讀寫，所以就沒有在深入去撰寫更細節的部分。


## Controller & View
---

接下來處理一下 Controller 的部分，編輯 application/controller/home.PHP

``` PHP applicatoin/controller/home.PHP

<?PHP

class Home_Controller extends Base_Controller {

  public $restful = true; //使用 RESTFUL (get_ post_ 開頭的 method)

  public function get_index()
  {

    $comments = Comment::order_by('created_at', 'desc')->paginate(); //依照 created_at 排序，並且分頁

    return View::make('home.index')
                 ->with('comments', $comments); //Render home/index 這個 view 並且附帶 comments 這個變數
  }

  public function post_index()
  {
    $inputs = Input::all(); //取得所有 POST/GET 的變數
    $rules = array( //設定驗證規則
      'subject' => 'required', //必填
      'content' => 'required' //必填
    );

    $validation = Validator::make($input, $rules); //進行驗證

    if( $validation->fails() ) { //假設驗證失敗
      return Redirect::home()->with_errors($validation); //回到首頁並且帶著錯誤資訊
    }

    Comment::create(array( //插入資料
      'subject' => $inputs['subject'],
      'content' => $inputs['content']
    ));

    return Redirect::home();
  }

}

```

基本上我們就不改動 Laravel 的 CSS 直接借用一下（因為是練習，所以實際使用請改正喔～）

編輯 application/views/home/index.blade.PHP

附註：blade 是 Laravel 的樣板引擎，要加在檔名才會運作～

``` html application/views/home/index.blade.PHP
{% raw %}
<!doctype html>
<html lang="zh_TW">
<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
	<title>Simple Guestbook</title>
	<meta name="viewport" content="width=device-width">
	{{ HTML::style('laravel/CSS/style.css') }}
  <style>
    input,textarea {
      background: #FFF;
      border: 1px solid #EFEFEF;
      margin: 10px;
      padding: 5px;
    }
  </style>
</head>
<body>
	<div class="wrapper">
		<header>
			<h1>Guestbook</h1>
			<h2>A simple guestbook</h2>

			<p class="intro-text" style="margin-top: 45px;">
			</p>
		</header>
		<div role="main" class="main">
      <div class="new">
      	<?PHP $errorMessages = $errors->all('<pre>:message</pre>'); ?>
        @foreach ($errorMessages as $message)
          { { $message }}
        @endforeach
        {{ Form::open() }}

        {{ Form::open() }}
        <p>
          {{ Form::label('subject', 'Subject') }}
          {{ Form::text('subject') }}
        </p>
        <p>
          {{ Form::label('content', 'Content') }}
          {{ Form::textarea('content') }}
        </p>
        <p>
          { { Form::submit('Comment') }}
        </p>
        {{ Form::close() }}
      </div>
      <hr />
			<div class="home">
        @forelse ($comments->results as $comment)
          <h2>{{ e($comment->subject) }}</h2>
          <pre>{{ e($comment->content) }}</pre>
        @empty
          <pre> No comment be found! </pre>
        @endforelse
			</div>
		</div>
	</div>
</body>
</html>
{% endraw %}
```
**不知道為什麼我用 { { }} 包起來就會消失，所以我在 { 跟 { 中間多加了空白**

Form Class 是 Laravel 的表單物件，可以輔助產生表單。

$errors 是 Laravel 有錯誤時會附加到 View 的變數（可以用 Session::get('errors') 在 Controller 取得，這邊為了方便就直接在 View 設定）

而 e() 是 Laravel 的脫跳，可以把 HTML 等有危險的資變成一般字串顯示。類似於 htmlspecialchars() 的功能。

{% raw %}
至於 Crsf 的部分我並沒有寫進去，因為我還不清楚 Laravel 的 Controller 中使用 Filter 如何使用，不然可以加上 {{ Form::token() }} 以及幫 Controller 加入 brefore filter 並且設定 crsf 來避免跨域的攻擊。
{% endraw %}

好了，這篇文章就到這邊告一段落摟～

至於 Laravel 本身內建分頁跟使用者認證，是很方便的部分。也支援數種資料庫跟記憶體快取的實踐，除了 Cli 沒辦法幫忙產生 Controller/Model/View 的基本檔案有點可惜，不然其實很接近 Rails 的方便了～

（之前看到有人引用，說我的文章沒啥參考性但是可以不用看英文，超傷心，只好認真一點寫 XDD）

如果噴錯誤，請檢查一下是不是 :: 少打一個，我常常這樣噴錯誤又看不到錯誤訊息 XDD

Github Repo: [https://Github.com/elct9620/laravel-guestbook-example](https://github.com/elct9620/laravel-guestbook-example)
