---
title: 自由的 Ruby 類別（一）
date: 2017-10-22 23:15:03
tags: [Ruby,心得]
---

以前還在讀書的時候，常常會思考所謂的「自由」是什麼，想著以後一定要過著自由的生活。不過現實就是到了社會，依舊還是有許多限制讓你無法自由自在。

不過，在 Ruby 中的類別卻是非常自由的。

有稍微接觸過 Ruby 的人應該都知道幾個特性：

* 物件導向語言
* 一切都是物件

<!-- more -->

## Class

在 Ruby 裡面，所有的類別的類別都是 `Class` 這個類別。

```ruby
Object.class
# => Class

Kernel.class
# => Module
Module.class
# => Class
```

即使是 `Module` (模組) 也是屬於類別的一種，也就是說萬物都源自於 `Class` 這個類別。

> 至於 `Class.class` 還是會得到 `Class` 自己本身

## Anonymous Class

至於一個類別是怎樣出生的呢？我們可以先從沒有名字的類別來看。

```ruby
Class.new
# => #<Class:0x007f85fc30ea88>
```

現在我們得到了一個新的類別（物件）而且也可以對他進行一個產生實例的動作。

```
klass = Class.new
klass.new
# => <#<Class:0x007f85fc30ea88>:0x007f85fc2efa98>
```

因為這種類別很可憐，他連名字都沒有，所以他的名字就是物件本身的 `#<Class:0x007f85fc30ea88>`

那麼，該怎麼讓他們獲得名字呢？

```ruby
Klass = Class.new
Klass.new
# => #<Klass:0x007f85fc2d7510>
```

實際上，所有類別的名字都是一個常數。
所以才會在撰寫類別名稱的時候，必須以大寫開頭（定義為常數）才能運作。

不過，類別的繼承跟方法該怎麼辦呢？

```ruby
Klass = Class.new(Object) do
  def echo(text)
    puts text
  end
end

Klass.new.echo 'Hello World'
# => Hello World
```

實際上就是把一個 Block 在初始化類別的時候傳進去，讓他做一些事情。

上面的類別定義等價於下面的程式碼：

```ruby
class Klass
  def echo(text)
    puts text
  end
end
```

所以，我們在這邊發現我們在 `class` 到 `end` 所寫的，可能是一個 Block。

## Class Methods

這個段落會討論的是 `Class` 類別的方法，有趣的是他剛好也是其他類別的類別方法。

物件導向中，我們知道有兩種方法的定義。

* 類別方法 `Klass.instance`
* 實例方法 `Klass.new.echo`

差別在於實例方法需要先把類別用 `.new` 初始化之後，才能存取到這些方法。

首先，我們可以先看看 `Class` 類別有哪些類別方法可以使用。

```ruby
Class.methods
# => [:include, ...,:instance_exec, :__id__]
```

省略了一些方法，不過看到了 `include` 這個熟悉的關鍵字。

```ruby
class Klass
  include Mod
end
```

沒錯，我們所看到的 `include` 就是我們在 `include` 某個模組的那一個。

所以，下面的這些動作其實是等價的。

```ruby
Klass = Class.new do
  include Mod
end
```

```ruby
class Klass
  include Mod
end
```

```ruby
# class Klass; end
# or
# Klass = Class.new

Klass.include Mod
```

透過以上的探索，是不是發現大多數 Rubyist 都可能接觸過的 Rails 中，有很多這樣的應用方式呢？

```ruby
class User < ApplicationRecord
  has_many :posts
end
```

從上面的例子來看 `has_many` 是一個類別方法，並且可能是屬於 `ApplicationRecord` 或者其上層的某一個物件。

## 總結

在 Ruby 的世界中，所有的類別其實都是 `Class` 這個類別的實體表現而已。
而父類別的的類別方法，則可以作為在定義新類別時的 Block 中使用，用來拓展一個類別的多樣性。

下一篇文章會來討論 `has_many` 的實際應用是怎樣的。
