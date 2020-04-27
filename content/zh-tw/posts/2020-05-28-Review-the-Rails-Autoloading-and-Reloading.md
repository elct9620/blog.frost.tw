---
title: "複習 Rails 的 Autoloading 和 Reloading"
publishDate: 2020-04-28T00:31:53+08:00
date: 2020-04-28T00:31:53+08:00
tags: ["Ruby", "Rails", "Autoloading"]
toc: true
thumbnail: https://blog.frost.tw/images/2020-05-28-review-the-rails-autoloading-and-reloading/thumbnail.jpg
credit: Photo by Miguel Á. Padriñán from Pexels
---

在幾年前我有一篇文章討論 [Autoloading](https://blog.frost.tw/posts/2017/03/06/The-Rails-auto-reload-trap/) 的問題，這幾天剛好有同事在 Autoloading 和 Reloading 上也有類似的問題。

所以我決定寫一篇文章來複習 Rails 5 和 6 的 Autoloading 的機制。

<!--more-->

## 為什麼要 Autoloading {#why-autoloading}

在開始討論 Autoloading 和 Reloading 之前，我想先花一點時間思考這個問題。

像是 C、C++ 或者 Java 這類需要編譯的語言，他們通常不會需要 Autoload（自動載入）的功能，因為 Compiler（編譯器）已經需要的檔案包含在二進位檔案中。也因此我們經常會用 `#include` 或 `import` 來將需要的符號或者參照引用進來。

如果像是 Ruby、PHP 或者 Node.js 這類在執行的時候才進行轉換的語言，通常表示我們的程式碼在執行前都不會被處理的。同時我們的程式碼也不會知道其他程式碼，直到我們用 `require` 或者 `include` 將他們從主程式引用進來。

這兩種類型的語言實際上都是嘗試將程式碼分割為小檔案，不過對於直譯式語言來說如果我們將全部的檔案都引用的話，是無法跳過不需要的部分。

在 Ruby 裡面有一個叫做 [`autoload`](https://ruby-doc.org/core-2.7.0/Module.html#method-i-autoload-3F) 的關鍵字，它允許我們去定義「當常數（Constant）不存在時，要去讀取哪個指定的檔案。」來實現這個需求。

這可能在我們載入大量程式碼的時候減少一些記憶體使用，不過我更相信 Autoloading 是用來幫助我們更容易的在大型專案中尋找到我們需要的程式碼。

## require 方法 {#the-require-method}

在我的 Code Review 裡面，我要求同事使用 `require 'middleware/domain_rewriter'` 而不是 `require_relative '../lib/middleware/domain_rewriter'` 去引用額外的 Middleware 在 Rails 的 `config/application.rb`。

不過實際上這並沒有正常運作， 在這個情況我們必須使用 `require_relative` 才對。

第一個問題是「為什麼我們可以在非相對的路徑使用 `require` 呢？」

在 Ruby 中，我們有一個全域變數叫做 `$LOAD_PATH` 如果我們用 `pp` 去顯示他的內容，我們會發現 Ruby 的安裝路徑是被放在裡面的。他是用來讓 Ruby 在我們嘗試引用某些東西時用來參考的搜尋路徑。

如果我們有 `Gemfile` 在專案目錄，那麼 Gem 安裝的路徑也會被加入到這個列表，這也是為什麼我們可以直接引用 Gem 而只需要將他們寫在 Gemfile 的理由。

在我們知道 `$LOAD_PATH` 提供給 `require` 搜尋路徑後，我們無法直接在 `config/application.rb` 去引用 `lib/` 目錄的原因就非常的明顯了。

基本上 Rails 是一個 Rack 為基礎的應用，因此通常會以 `config.ru` 這個檔案作為起點啟動。

```ruby
# frozen_string_literal: true

# This file is used by Rack-based servers to start the application.

require_relative "config/environment"

run Rails.application
```

這個檔案會繼續引用 `config/environment.rb` 並且我們可以發現他引用了 `config/application.rb`。

```ruby
# frozen_string_literal: true

# Load the Rails application.
require_relative "application"

# Initialize the Rails application.
Rails.application.initialize!
```

很明顯的，在這裏 Rails 並沒有把 `lib/` 放到 `$LOAD_PATH` 裡面造成我們無法直接去引用裡面的檔案。

## Autoloading {#the-autoloading}

既然我們知道我們可以用 `require` 簡單的載入函式庫，但我們還是需要透過 `require_relative` 去載入專案的程式碼，這在我們的程式碼增加時會讓人開始感到煩躁。

從 Rails 6 之後開始使用 [`Zeitwerk`](https://github.com/fxn/zeitwerk) 作為程式碼的載入器，我會用他來當作範例解釋，來減少我們討論後續複雜的行為。

根據 Zeitwerk 的說明，我們可以看到載入的邏輯基本上如下：

```
lib/my_gem.rb         -> MyGem
lib/my_gem/foo.rb     -> MyGem::Foo
lib/my_gem/bar_baz.rb -> MyGem::BarBaz
lib/my_gem/woo/zoo.rb -> MyGem::Woo::Zoo
```

這其實非常類似我們將檔案放在 `app/controller` 或者 `app/model` 下面的狀況，因為 Rails 會把這些目錄註冊給 Zeitwerk。

> 某方面來說這也表示我們不一定需要在 `app/controller` 目錄下使用 `_controller` 作為檔案的結尾，不過我們通常不會使用這種難以區分用途的做法。

而 Zeitwerk 會使用 Ruby 的 `autoload` 來載入這些 Class 也因此當我們設定 Autoload 路徑後，他會去掃描所有的檔案並把他登記到相關的 Class 上的 Autoload 列表。

> 在我的記憶中舊版的 Rails 有他自己的 Autoloading 實作，會透過覆蓋掉部分 Kernel 的方法以及對 NameError 的捕捉來找到實際應該載入的檔案。

## Reloading {#the-reloading}

實際上我認為這個部分是大部分初級工程師嘗試自己用 `require` 載入某些東西，但是修改某些檔案後就壞掉後，會覺得疑惑的地方。

在 Zeitwerk 我們有 `#enable_reloading` 選項可以讓我們能夠使用 `#reload` 方法。在開發中 Reloading 功能是非常有幫助的，尤其是當我們修改了一些東西後不需要重新啟動伺服器。

> 對編譯式的語言來說總會需要重新編譯和重新打開，不過還是有一些方法可以避免這件事情。

不過為什麼我們可以 `#unload` 掉已經轉換過的程式碼呢？實際上這很看語言的特性，至少在 Ruby 裡面常數是一種被允許修改跟被移除的數值。

當我們呼叫 `#reload` 時，Zeitwerk 會 [`#unload`](https://github.com/fxn/zeitwerk/blob/806795d302840a7e96612b88ff45f231ea4318b0/lib/zeitwerk/loader.rb#L796) 那些被載入的常數。同時會再將這些 Class 讀取一次，來將新的程式碼放到記憶體中。

這也是為什麼當我們有一個頂層的常數被移除後，他下面的物件或模組也會被一起移除的原因。

這其實是一個常見的錯誤，當我們在父物件的檔案同時定義了一個子物件並且在其他檔案呼叫時可能會出現錯誤。

> 不過這可能不會在比較新的 Rails 發生，載入器通常會對他的父物件的檔案先嘗試載入一次。

在同樣的狀況下，類似的錯誤是我們定義了一個 `API` 的命名空間在 Autoload 管理的目錄（像是 `app/`）同時也定義在沒有被管理的目錄（像是 `lib/`）裡面。

當我們修改一些在 `app/` 目錄下的檔案時，`API` 會被移除，而 `lib/` 定義的 `API` 就永遠不會再被載入回來。

這是因為 `require` 認為這個檔案已經被載入，因此 Ruby 認為這個檔案不需要再次被載入，但他已經因為 Reloading 被移除了。

以下是一個簡單的範例：

```ruby
# frozen_string_literal: true

require_relative 'api'
pp defined?(API)
# => "constant"

Object.send(:remove_const, 'API')
require_relative 'api'
pp defined?(API)
# => nil

load "api.rb"
pp defined?(API)
# "constant"
```

`require` 可以避免我們載入檔案兩次，不過 `load` 並不會檢查，而 Zeitwerk 也覆蓋掉 [`#require`](https://github.com/fxn/zeitwerk/blob/master/lib/zeitwerk/kernel.rb#L24) 方法來提供由 Zeitwerk 管理的類似的功能。

基於以上的例子，我們大致上就能對 Rails 的 Autoloading 和 Reloading 有一個概念，並且幫助我們更合理的應用他們。

## 總結 {#conclusion}

在最後，我還有一件事情要提一下。實際上 `lib/` 也是被 Rails 管理的。不過他只能在 Rails 啟動之後使用，這也是為什麼我們無法在 `config/application.rb` 使用的原因。

> 在原始碼的[這裏](https://github.com/rails/rails/blob/758e4f8406e680a6cbf21b170749202c537a2576/railties/lib/rails/engine/configuration.rb#L53)定義了作為 Load Path 以及在[這裏](https://github.com/rails/rails/blob/c0d91a4f9da10094ccdb80e34d1be42ce1016c9a/railties/lib/rails/engine.rb#L570-L575)將他加入了 Load Path 中。

Autoloading 和 Reloading 是我們在開發時非常有用的工具，而 Zeitwerk 更讓我們非常容易的加入這個功能到專案中。如果你有專案不是使用 Rails 的話，我很推薦嘗試加入 Zeitwerk 並且在實踐中了解更多相關的知識。
