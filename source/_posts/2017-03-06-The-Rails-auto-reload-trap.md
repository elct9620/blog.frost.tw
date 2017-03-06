---
title: Rails 的 Auto Reload 機制所產生的錯誤
date: 2017-03-06 23:09:31
tags:
---

最近公司的專案使用到了 [ActiveType](https://github.com/makandra/active_type) 這套 Gem 用來輔助在專案逐漸複雜下 Model 會出現的問題。這是由 [Growing Rails Application in Practice](https://leanpub.com/growing-rails) 這本書的作者在書中介紹中的技巧，不過卻意外的讓我們遇到了關於 Auto Reload 機制所產生的問題。

<!-- more -->

在開始之前，我們先看看同事 Eric 的小劇場。

這是一個天氣開始轉涼的日子，在這寒冬之中專案的成員已經進行了一個上午的討論。正針對一套關於紀錄使用者與平台間帳務的系統坐出討論。

在經過一個上午的消耗後，我們各自恢復開發的進度。

此時 Eric 在他的 Rails Concole 輸入了 `reload!` 這行指令，嘗試將最近一次的變更重新讀取進來。

沒想到，Factory Girl 卻向 Eric 這樣說道「Eric 啊！你的 `User (#123456789)` 並不是 `User (#987654321)` 啊！」

Eric 心頭一驚，不過他早就遭遇過幾次這樣的問題，很快地就用 `FactoryGirl.reload` 解決了。

不過這時，AASM 又再次像 Eric 抱怨「Eric 啊！你的 `0:Fixnum` 並不能被 `to_sym`，是不是搞錯什麼了？」

不得不說，一向好運的 Eric 竟然連續兩次被抱怨，這真是非常異常的情況，團隊成員都開始警戒了起來。

於是，我們開始探討關於 `reload!` 到底在背地裡偷偷做了什麼，竟然讓 Eric 的運氣都不管用了！

### Auto Reload 機制

使用 Rails 應該都對這個機制不陌生，他能夠讓我們再修改 Model、Controller 時自動的更新物件，讓伺服器在不重啟的前提下能夠即時的更新內容。

在 Rails 中，會先透過 `Object#remove_const` 將這個 Class 清除，並且透過 Autoload 機制在找不到對應的 Constant 時自動讀取對應的檔案，藉此完成一個完整的 Reload 循環。

### Class 即物件

大多數的 Ruby 開發者都知道，在 Ruby 的世界中是由物件組成的。即使是 Class 本身也是一個物件。也因此，是允許我們如此定義一個 Class 出來。

```ruby
klass = Class.new do
 # 其他定義
end
```

而每一個 Instance 都會擁有一個屬於自己的 `object_id` 也因此可以透過這個方式來比較兩個 Class 是否相同（不過 Ruby 的實作是透過其他方式）

```ruby
class A
end

class B
end

puts A.object_id === B.object_id
```

### Factory Girl 的情況

透過前面的介紹，我們可以簡單的得知 Rails 在做 Reload 的時候會有以下的步驟。

* 執行 Reload （可能會做一些前置準備）
* 使用 `Object#remove_const` 進行清理物件
* 透過 Autoload 機制讀取物件

那麼，為什麼 Factory Girl 會覺得 Reload 前的 `User` 和 Reload 後的 `User` 不同呢？

因為 Factory Girl 在定義時會將這個 Class 儲存到某個變數中，當作參考，以利後來檢查。

```ruby
# 原始 Class
class A
end

@klass = A

A.new.is_a?(@klass) # => true

# Reload 動作

Object.send(:remove_const, :A) # => const A is undefined

# 重新定義 A Class

class A
end

A.new.is_a?(@klass) # => false

# 比對 @klass 和 A
puts @klass.object_id == A.object_id # => false
```

由此可見，當我們呼叫 `Object#remove_const` 時，`A` 在 Ruby 終究被釋放出來，因此能夠讓我們「重新」賦值到 `A` 這個 Constant 上面，而執行 `class A; end` 和 `Class.new` 此時會被視為相同的行為，因此 `A` 所對應的物件就改變了！

但是 `@klass` 還保留著原有的 `A` Class 物件參照，因此會被當作是不同的 Class。

所以，解決的方案就是透過 `FactoryGirl.reload` 讓所有 Factory Girl 的檔案重新載入一次，將新的 Class 參照儲存進去。

### AASM 的情況

在 Rails 4.1 新增了 `enum` 功能大大增加了方便性，而 AASM 也可以利用 `enum` 欄位來做狀態機的處理。那麼，為什麼會出現「`0:Fixnum` 無法 `to_sym`」的這種情況呢？

大多數時候我們都是用 `Integer` 欄位來儲存，所以第一時間會用 `Model.defined_enums` 來檢查，果然我們的 `enum` 消失了！

首先，先來看看下面的的 Model 關係。

```ruby
class User < ApplicationRecord
  has_many :virtual_orders, class_name: VirtualOrder
end

class Order < ApplicationRecord
  belongs_to :user

  enum status: {
    pending: 0,
    activate: 1,
    completed: 2,
    canceled: 3
  }
end

class VirtualOrder < ActiveType::Record[Order]
end
```

這些行為關係到 Autoload 的動作，因此讀取順序會像下面這樣進行。

* `Order` -> 發現 `User` 需要讀取
* `User` -> 因為發現了 `class_name` 後面有 Constant 提早讀取 `VirtualOrder` 物件
* `VirtualOrder` -> 找不到 `defined_enums` 因為 Order 還沒執行到 `enum`
* `Order` -> 執行 `enum`

因此，只要對 `User` 稍微修正。

```ruby
class User < ApplicationRecord
  has_many :virtual_orders
end

# 或者下面的做法

class User < ApplicationRecord
  has_many :virtual_orders, class_name: "VirtualOrder".freeze
end
```

如此一來，在 Rails 執行 `has_many` 的時間點就會比 `autoload` 觸發的時間更晚，就不會讓這個問題發生。

在 Ruby 中發現 Constant 後會馬上檢查，而 Rails 會先捕捉這些錯誤做 Autoload 的處理。而 `has_many` 這些如果傳入的是字串，則會在建立關聯時才呼叫。反兒給了 `Order` 物件完全初始化的機會。

### 小結

在這次的案例中，可以知道兩個情況需要小心。

1. 使用變數儲存能被 Autoload 的 Class 的情況
2. 互相呼叫能被 Autoload 的 Class 時的先後關係

關於第一點的情況，還有另外一個關於 `config/initializers` 設定檔的有趣情況，如果有機會的話還會再做分享。