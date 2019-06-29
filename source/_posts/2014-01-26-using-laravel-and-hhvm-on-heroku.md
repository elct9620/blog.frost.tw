---
layout: post
title: 'Using Laravel and HHVM on Heroku'
date: 2014-01-26 06:35
comments: true
tags: [PHP, Laravel, Heroku, 心得, PaaS]
---
會寫這篇是前一陣子 HHVM 突然又被大家撈起來討論，看起來應該是有啥新進化吧 XD
那時身為專業的阿宅，一定要馬上裝來玩一下。

隨著時間的流逝，又有人發現用 HHVM 可以讓 Composer 跑更快一點（超自然啊！）
我又再次回想起這神奇的東西⋯⋯
<del>現實是 Composer 跑太慢被 HHVM 斷開魂結</del>

當時我就想，既然我都搞了 [Phalcon on Heroku](https://Github.com/elct9620/Heroku-buildpacks-PHP-with-phalcon) 這東西，不如再來搞一個 HHVM 版本吧！

沒想到[官方](https://Github.com/hhvm/Heroku-buildpack-hhvm)竟然無情的已經做好了，於是我只好轉戰 Laravel 然後冒險就這樣開始了（才沒有 XD

> PaaS 入門指南還沒斷，不過人生總是需要調味一下，就先讓我寫些別的吧 XD

<!-- more -->

其實這有雷，但是沒有被雷打過（原來不是地雷）怎麼知道什麼叫做「痲痹」的感覺呢？
所以，請大家跟我一起來「被雷劈～」一下吧！
<del>好吧，你要跳過我不介意，不過不要恨我把前置動作寫在過程喔（揪咪</del>

### 初始化 Laravel 專案

根據官方公佈的新手預置技能[使用指南](https://laravel.com/docs/quick)只要執行以下動作即可。

> composer create-project laravel/laravel your-project-name --prefer-dist

註<sup>1</sup>: your-project-name 就是專案名稱，應該不會有人打錯吧 XD
註<sup>2</sup>: 沒用過 [composer](https://getcomposer.org/) 嗎？這裡不是新手區，趕快去學這個技能吧！

### 生成 Heroku 力場

> git init

這是基礎技能，可以參考一下 [PaaS 入門指南（二）](https://blog.frost.tw/posts/2014/01/21/getting-started-paas-2)的相關說明

> Heroku create --buildpack https://Github.com/hhvm/heroku-buildpack-hhvm

註：如果不希望 APP 名稱是隨機的，可以在 `create` 後面加上名稱喔～

最後使用黑暗魔法 - HHVM [設定檔](https://www.laravel-tricks.com/tricks/hhvm-config-for-laravel)！
適用于 Heroku 的版本如下：

```
Server {
  SourceRoot = /app/public/
}
VirtualHost {
 * {
   Pattern = .*
   RewriteRules {
      * {
        pattern = .?
   			# app bootstrap
        to = index.PHP
        # append the original query string
        qsa = true
      }
   }
 }
}
StaticFile {
  Extensions {
    CSS = text/css
    gif = image/gif
    html = text/html
    jpe = image/jpeg
    jpeg = image/jpeg
    jpg = image/jpeg
    png = image/png
    tif = image/tiff
    tiff = image/tiff
    txt = text/plain
  }
}
```

其實就是刪掉 `Port` 設定，因為 Heroku 會幫你指定這樣。
註：Extensions 可以自行追加，其實他有少一些項目 XD

### 自爆吧！

> git push Heroku master

沒錯，現在你會看到網站順利地跑起來了！
<del>哪裡有雷？給我出來面對！</del>

看清楚你的 Terminal 啊！是不是 `post-` 或者 `pre-` 這類跑完 `composer install` 該跑的 Script 都死了⋯⋯
**「因為找不到 PHP」**

不過，即使你改為 `hhvm artisan` 也是不會動的噢～
<del>不然怎麼會是雷，而且這樣其實本機跑也很不方便啊！</del>

### 黑魔法！

現在，打開 `composer.json` 然後把 `PHP` 改為 `$_` 就對了！
如下所示：

```json
{
	"name": "laravel/laravel",
	"description": "The Laravel Framework.",
	"keywords": ["framework", "laravel"],
	"license": "MIT",
	"require": {
		"laravel/framework": "4.1.*"
	},
	"autoload": {
		"classmap": [
			"app/commands",
			"app/controllers",
			"app/models",
			"app/database/migrations",
			"app/database/seeds",
			"app/tests/TestCase.PHP"
		]
	},
	"scripts": {
		"post-install-cmd": [
			"$_ artisan clear-compiled",
			"$_ artisan optimize"
		],
		"post-update-cmd": [
			"$_ artisan clear-compiled",
			"$_ artisan optimize"
		],
		"post-create-project-cmd": [
			"$_ artisan key:generate"
		]
	},
	"config": {
		"preferred-install": "dist"
	},
	"minimum-stability": "stable"
}
```

> git push Heroku master

當你再次 push 上去時，一切就正常了！世界再次回歸秩序啊！！！

註：本機建議在 `~/.bashrc` 之類的補上 `alias composer="PHP /bin/usr/local/composer"` 之類的，不然本機會跑失敗喔！

所以，到底發生了什麼？

原來這個問題只要是 Heroku 的 PHP Buildpack 都會碰到，然後就有<del>歪國人</del>西方高人找到了[方法](https://blog.enge.me/post/a-comprehensive-tutorial-for-deploying-laravel-4-on-Heroku)

沒錯，就是 `$_` 這個魔法般的祕技⋯⋯

那麼，鏡頭轉到 `bash` 的說明書上：
https://www.gnu.org/software/bash/manual/bashref.html

> When Bash invokes an external command, the variable ‘$_’ is set to the full path name of the command and passed to that command in its environment.)

簡單來說 `$_` 基本上跟 `$!` 算是好兄弟之類的，效果都是「上一次執行的 XXX」這樣的感覺。
`$_` 是「上一次執行的指令」然後在這個運用中，就很神奇的可以取得 HHVM 的執行指令（超神奇的！）然後就順利地將 Composer 的 Script 都跑起來了！

喔耶，總之就這樣寫完了 XD

因為上課時間關係，週二更新不方便，以後應該是週日或者週一更新網誌喔～
（不過我可能偷懶，還是訂閱 RSS 比較方便 XD）
