---
title: 自由的 Ruby 類別（二）
date: 2018-03-23 17:32:19
tags: [Ruby,心得]
thumbnail: https://blog.frost.tw/images/the-ruby-s-object-is-free-part-2/thumbnail.png
---

[上一篇文章](https://blog.frost.tw/posts/2017/10/22/The-ruby-s-class-is-free-Part-1/)已經討論過關於 Ruby 中的類別是怎樣運作的，這篇文章則會來討論如何拓展 Ruby 類別。

大部分的人寫 Ruby 有很大的原因是因為 Rails 但是上面像是 `has_many` 跟 `before_action` 這些可以直接在類別上做的事情，很明顯不是 Ruby 內建的，到底是怎麼運作的呢？

<!-- more -->

## Class Method

我們先來看一段範例

```ruby
class A
  def self.my_name_is(str)
     puts str
  end

 my_name_is 'A'
end
```

到這邊，大家可能已經猜到 `has_many` 這類 DSL 擴充是怎麼實做出來的。只是，背後的運作原理是什麼？

## Class Eval

上一篇文章我們有提到，下面兩段程式碼會是等價的。

```ruby
A = Class.new do
 # ...
end

# 上下兩段都是相同意思

class A
  # ...
end
```

也因此推測出 `class A; end` 中間的那個區塊，其實是一個 Block。不過我們並沒有討論這個 Block 是怎麼被運行的。

在 Ruby 的 `Class` 類別說明上，針對 `Class.new` 有提到「If a block is given, it is passed the class object, and the block is evaluated in the context of this class using class_eval.」這一段文字。

簡單來說，就是中間這段 Block 是透過 `class_eval` 方法來執行的，所以我們可以再繼續推導出以下的行為。

```ruby
A = Class.new do
 attr_accessor :name
end
```

相等於

```ruby
class A; end
A.class_eval { attr_accessor :name }
```


## Instance Method of Class

至於 `attr_accessor` 實際上是 `Class` 類別的實例方法。

```ruby
Class.instance_methods.include?(:attr_accessor)
# => false
```

怎麼會沒有？實際上 `Class` 類別已經 `include` 了 `Module`，而 `attr_accessor` 其實是 `Module` 類別的實例方法。

```ruby
Module.private_instance_methods.include?(:attr_accessor)
# => true
```

其實我們在 `Class` 上用 `private_instance_methods` 也可以找到 `attr_accessor` 這個方法，不過這其實是我們思考上的漏洞。因為 `attr_accessor` 是私有方法，所以我們沒辦法直接在 `instance_methods` 取得。

## DSL in Class

回到正題，關於 `has_many` 是如何定義的？

既然我們已經知道：

* 所有類別都是 `Class` 的實例
* 定義類別呼叫的是父類別的實例方法

這樣回到第一個範例的程式

```ruby
class A
  def self.my_name_is(str)
    puts str
  end
end
```

實際上是在定義類別 `A` 的時候， 同時對叫做 `A` 的類別 `Class` 物件實例，動態的追加 `my_name_is` 這個方法。也因此能夠讓 `A` 類別在進行 `class_eval` 的時候，提供 `my_name_is` 這個方法。

## 結論

每一種語言都有其特別的地方，在討論 DSL 的時候 Ruby 也經常會被拿出來討論。主要就是因為 Ruby 擁有這樣的性質，讓我們能夠動態的去定義類別和物件上的行為，進而讓實現 DSL 變的相對的容易。

雖然是一些相對冷門的知識，不過在必要的時候善用這些技巧可以幫助你用更優雅的方式去寫程式。