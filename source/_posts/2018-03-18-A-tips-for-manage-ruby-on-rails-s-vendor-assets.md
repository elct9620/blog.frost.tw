---
title: 管理 Ruby on Rails 外部 Assets 的小技巧
date: 2018-03-18 16:53:59
tags: [Ruby on Rails,技巧,筆記]
---

在工作的時候經常會需要套用一些佈景主題，主要大多是因為客戶還在 MVP (最小可行產品) 的階段，只需要可以表現其商業價值運作的系統即可。不過，如果我們依照 Ruby on Rails 預設的方式把外部的佈景相關檔案分類後放到 `vendor/assets` 目錄下，反而會變得難以管理。

<!-- more -->

一般來說，我們在一些佈景主題網站上購買的佈景，如果狀況不錯的話一般都會有以下這些資料夾。

* `css` （或 `stylesheets`）
* `js` (或 `javascripts`)
* `img` (或 `images`)

不過，如果把這些目錄分別的放到 `vendor/assets` 下面的話，佈景主題要更新的時候會出現問題。而當我們需要支援多套佈景主題的時候，也會受到限制。

所以，相對應的處理方式是透過直接將完整的目錄放到 `vendor` 目錄下。

舉例來說，假設有一個佈景主題叫做 `material` 我們就放到 `vendor/material` 這個位置，裡面則包含了前面提到的三種目錄。

路徑就會變成像這樣：

* `vendor/material/css`
* `vendor/material/js`
* `vendor/material/images`

在 Rails 5 之後，為了能夠支援 Webpack 來進行前端相關的編譯，會增加 `config/initializers/assets.rb` 這個檔案。

我們就可以透過這個檔案對這些目錄設定，讓 Ruby on Rails 上的 Assets Pipeline 可以正確地讀取到。

只要對 `config/initialize/assets.rb` 做一些設定。

```ruby
# Add additional assets to the asset load path.
Rails.application.config.assets.paths += [
  Rails.root.join('vendor', 'material', 'css'),
  Rails.root.join('vendor', 'material', 'js'),
  Rails.root.join('vendor', 'material', 'images')
]
```

這種類型的情況是用在網站只需要套用一種佈景主題，所以我們可以明確地把 CSS / JS 等路徑都完整的指定出來，如此一來在 `application.css` 和 `application.js` 就可以透過下面這樣的方式將它讀取進來。

```js
// application.js
//= require jquery.select2.js
```

未來假設佈景主題需要更新，我們就可以透過刪除以及重新放置 `vendor/material` 目錄的方式來更動，而不容易和其他外部的 Assets 混在一起，而變得難以處理。

這算是一個蠻實用的小技巧，在開發網站的時候要如何讓原始碼乾淨以及相依的套件容易維護一直都是個值得討論的題目。之後也會不時的更新 Ruby on Rails 的小技巧，除了因為最近太久沒有寫網誌之外。就是發現如果想分享一些很有趣的技術文章，還需要先讓讀者能夠透過過去的文章資料，一步步的了解脈絡才行。

也因此，會先累積一部分偏向入門者的文章，來幫助讀者瞭解其他文章的背景是怎樣的狀況，才會採取這樣的行動或者做法。