---
layout: post
title: '使用 Oauth-Plugin 與 Devise 建置 OAuth2 伺服器'
publishDate: 2013-04-22 10:05
comments: true
tags: 
---


其實，這是一篇掃雷文（誤

大約半年前（根據某人開 Issue 的記錄，是 7 個月之前）我也嘗試過安裝 oauth-plugin 來建置 OAuth2 伺服器，但是因為長達好幾小時 **400 Bad Request** 最後受不了而放棄。

這次，除了順利挑戰 **Invalid OAuth Request** 之外，從 400 甚至 401 都挑戰的我，終於戰勝了地雷啊！

事不宜遲，讓我們開始進行這一連串的大戰吧！

<!--more-->

###前情提要
---

基本上，就是老爸公司的系統發展到某個程度後，開始有 SSO 的需求。因為系統本身是一個獎金計算的機制，為了搭配購物而在上週<del>死命暴走</del>把精簡版的訂單管理系統加入。

不過，客戶總不可能每個都天生神力自行開發購物車吧？因此就有了<del>從來沒有停過的</del>建構一個購物平台（基於原有系統）的輔助平台功能了（遠目

不過，多重的帳號與重複的資料是我們不樂見的，因此開始尋找 SSO (Single Sign-on) 的幾解決方案。

從 RubyCAS, BrowserID, OpenID, OAuth 都有評估，最後身為<del>萬惡開發人員</del>的我還是判斷 OAuth 最為適合。而 OAuth 2.0 也是我比較希望使用的模式，因此再次開啓失敗之路（誤

###現況分析
---

因為目前主要的系統是使用 Rails 去進行開發的，所以就不考慮其他語言的實踐，以及 RubyCAS 需要另外建置伺服器的方式（另一方面是再開伺服器除了維護成本外，還有資金的限制，整合在現有系統內會是筆記好的選擇）

而目前 Ruby 大致上呈現 OAuth2 Client > OAuth2 Server 的狀況，相對的之後打算開發輔助平台的 PHP 則呈現 OAuth2 Server > OAuth2 Client 的狀態（此指的是實踐的容易程度）

在眾多 Ruby Gems 裡面，唯獨 oauth-plugin 較為完整（平均 OAuth2 相關 Gem 大多 7 個月沒有更新，因此差異不大）

###伺服器實作
---

因為會員系統是基於 Devise 的，因此一開始就先考慮要搭配 Devise 實作。

建置上基本上參考 [Rails and OAuth-Plugin Part1](https://unhandledexpression.com/2011/06/02/Rails-and-oauth-plugin-part-1-the-provider/) 這一篇文章

首先針對 Gemfile 追加 gems

``` Ruby
gem 'devise'
gem 'oauth-plugin', ">= 0.4.1" # 使用最新的 0.4.1 版
```

接著執行 bundle install 進行安裝
> $ bundle install

完成之後建置所需的 Controller / Model / View

> $ Rails g devise:install <br />
> $ Rails g devise User <br />
> $ Rails g oauth_provider <br />

然後更新資料庫<br />
<small>在這之前可以先修改 db/migrations 的 migrate 資訊，調整成所需的資料表結構</small>

> $ rake db:migrate

接下來修改 config/application.rb 加入 OAuth-Plugin 的 Middleware

``` Ruby config/application.rb
require 'oauth/rack/oauth_filter'
config.middleware.use OAuth::Rack::OAuthFilter
```

註：上述程式碼不是在第一行/最後加入，而是在再 `class Application < Rails::Application` 裡面

接下來編輯 User Model ( 前面 Rails g devise User 所產生的，依照你產生的 Model 修改 )

加入以下程式碼（對應 user 的 application 以及產生的 tokens）
``` Ruby app/model/user.rb
has_many :client_applications
has_many :tokens, :class_name=>"OauthToken",:order=>"authorized_at desc",:include=>[:client_application]
```

註： `:include => [:client_application]` 這部分目前不確定是否適用，不過因為 oauth-plugin 的設計，預設也是無法修改此部分，在 Rails 3.2.13 仍是正常的

在參考文件中，會將 alias 分別放入 oauth_clients_controller.rb 和 oauth_controller.rb

不過這邊我們要改放到 application_controller.rb (後面會提到這個問題)

加入以下程式碼
``` Ruby app/controllers/appication_controller.rb
alias :logged_in? :user_signed_in?
alias :loggin_required :authenticate_user!
```
上面的程式碼其實只是將 Devise 的方法提供給 OAuth-Plugin 而已（因為使用名稱不同，所以提供一個別名）

接著創建一些被 OAuth 保護的 Resources

> $ Rails g controller data index

這部分就由各位自行處理

然後編輯這個 resources 加入 before_filter 為保護狀態

加入以下程式碼（相同於 before_filter 的位置）
``` Ruby app/controllers/data_controller.rb
oauthenticate # before_filter :oauth_required 的替代，也可傳入 :only => [:show, :index] 等
```

官方文件上所敘述的`before_filter :oauth_require` 只會呼叫 OAuth 1.0 的方法，即使順利取得 Access Token 附加在網址上發出請求，也會得到 401 的錯誤，因此改為使用 oauthenticate 就能夠正常（從原始碼來看，在 oauth_require 執行的時候是直接呼叫 oauth 1.0 的 method 而 oauthenticate 則是建立 filter 從 env 判斷版本）

最後依照參考資料補上一些必要的部分。

``` Ruby app/controllers/application_controller.rb
def current_user=(user)
	current_user = user
end
```

在原始碼中有使用到這個部分，需要額外補上

以及 Routes 設定中補上 oauth/revoke 的數值（不知道為什麼預設的 route 漏掉了⋯⋯）

``` Ruby config/routes.rb
post 'oauth/revoke'
```

直到這裡，就全部告一段落了！

另外 app/views/oauth_clients 裡面的 _form.html.erb, edit.html.erb, index.html.erb 使用很多舊版或者現在無法使用的語法，記得自行重寫，不然是無法正常運作的！


###客戶端實作
---

解決完 Server 之後，就要來處理 Client 部分了（這部分使用 PHP 製作）

首先，到 Server 註冊好帳號、並且創建 Application 然後取得 Client Key, Client Secret 之後在繼續吧！

註：OAuth-Plugin 產生的 View 呈現的是 OAuth 1.0 的 Token 網址，後面會提到 2.0 所需使用的部分

首先，先進行 composer 的初始化

> $ composer init

或者本地版本（我習慣把 composer 安裝到 /usr/local/bin 裡面方便使用 - MacOSX）
> PHP composer.phar init

接著編輯 composer.json

在 require 裡面加入 OAuth Client 的實作
``` json composer.json
require: {
	"lncd/oauth2-client": "*" 
}
```

註：這邊是為了測試方便而使用這一個 Client 實際開發時還是建議用 [OAuth2-PHP](https://code.google.com/p/oauth2-PHP/) 之類的 Library （以後有機會，會再寫一篇相關的文章討論 OAuth2 PHP Client 的使用心得）

完成後更新套件
> $ composer install

或者 update (如果執行過 install)
> $ composer update

因為這款 OAuth Client 是以 Provider 為基準的，因此我們要自行時做一個 Provider Class 來進行連接。

我是參考原有的 Provider 中 Github 的改寫
``` PHP myProvider.PHP
<?PHP

class MyProvider extends OAuth2\Client\Provider\IdentityProvider
{
	public $respondType = 'json'; // 我們的伺服器預設為 json 這行可以省略
	
	public function urlAuthorize() {
		return "https://myserver.dev/oauth/authorize";
	}
	
	public function urlAccessToken() {
		return "https://myserver.dev/oauth/token"; // OAuth 2.0 使用這個即可，不過得在 rake routes 才會注意到它
	}
	
	// 以下為 Client 本身實作，因為繼承的父類別會呼叫，因此須實做出來
	public function urlUserDetails(OAuth2\Client\Token\AccessToken $token) {
		// 這裡假設 Server 已經建立好 user_controller 並且以 OAuth 保護
		return "https://myserver.dev/user.json?access_token=" . $token;
	}
	
	public function userDetails($response, OAuth2\Client\Token\AccessToken $token)
	{
	 	// 預設是建立一個 User Object, 這裡只需看結果所以直接傳回 json_decode 後的資料
		return $response;
	}
```

然後我們建立一個 index.PHP 來連接 OAuth 伺服器

``` PHP index.PHP
<?PHP

require 'vendor/autoload.PHP'; // Composer 的 Autoload
require 'myProvider.PHP'; // 剛剛建立的 Provider

$provider = new MyProvider(Array(
	'clientId' => 'YOUR_CLIENT_KEY',
	'clientSecret' => 'YOUR_CLIENT_SECRET',
	'redirectUri' => 'https://myclient.dev/' // 這是這個 PHP 運行的位置
));

if(!isset($_GET['code'])) {
	$provider->authorize(); // 如果沒有取得 authorization code 則先進行認證
} else {
	try {
		$token = $provider->getAccessToken('authorization_code', array('code' => $_GET['code']));
		
		try {
			$user = $provider->getUserDetails($token);
			
			// 傳回一些 $user 的資訊
			
		} catch (Exception $e) {
			// 取得資源失敗時的處理
		}
		
	} catch (Exception $e) {
		// 處理取得 Access Token 失敗時的處理
	}
}

```

如果到此都順利完成，那就是完成 Server (Ruby) / Client (PHP) 的實作了！

<del>據說某人從下午開始弄，弄到晚上十二點才全部解完，白白排了很多原始碼找問題</del>

那麼，祝各位順利～












