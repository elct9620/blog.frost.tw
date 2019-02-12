---
title: 探索 Ruby 的 each 方法（一）
date: 2019-02-13 01:00:23
tags: [Ruby,心得,程式,Enumerable,Enumerator]
thumbnail: https://blog.frost.tw/images/2019-02-13-deep-into-ruby-s-each-method-part-1/thumbnail.jpg
---

原本是想討論 Enumerable 這個 Module 的機制跟運作原理，不過越寫越發現光是一篇文章很難講明白。

所以就一邊查資料跟 Ruby 原始碼，慢慢的把 Enumerable / Enumerator 這兩個讓 `#each` 運作起來的機制討論清楚。

在 Ruby 裡面我們已經很熟悉使用 `#each` 來對陣列相關的物件進行操作，不過在大部分的語言我們都需要透過迴圈的方式來取出陣列的元素，那麼 `#each` 這個方法到底是怎麼讓我們用這麼方便的機制來操作陣列的呢？

<!-- more -->

## 迭代器

在[維基百科](https://zh.wikipedia.org/wiki/%E8%BF%AD%E4%BB%A3%E5%99%A8)裡面提到 Ruby 是隱式的將迭代器內建在語言裡面的。

我們可以先來看看迭代器通常是怎麼實現的：

```ruby
class Iterator
  def initialize(collection)
    @collection = collection
    @ptr = 0
  end

  def next
   ret = @collection[@ptr]
   @ptr += 1
   ret
  end

  def rewind
    @prt = 0
  end
end
```

那麼我們就可以用像下面這樣的方式來讀取陣列的內容

```ruby
array = (1..10).to_a
iter = Iterator.new(array)
iter.next # => 1
iter.next # => 2
iter.rewind
iter.next # => 1
```

實際上，在 Ruby 中已經有內建這樣的機制，那就是 `Enumerator` 類別。

```ruby
array = (1..10).to_a
iter = Enumerator.new(array)
# warning: Enumerator.new without a block is deprecated; use Object#to_enum
iter.next # => 1
iter.next # => 2
iter.rewind
iter.next # => 1
```

那麼，假設我們對陣列使用 `#each` 方法時，不傳入 Block 的話，會看到什麼呢？

```ruby
irb(main):067:0> [1, 2, 3].each
=> #<Enumerator: [1, 2, 3]:each>
```

我們會得到一個 `Enumerator` 物件，也就是說 `#each` 方法回傳的就是迭代器。

## 使用 Block 的情境

不過，當我們提供了 Block 之後，回傳的卻是普通的陣列，又是怎麼一回事？

```ruby
irb(main):070:0> [1, 2, 3].each { |v| p v }.class
1
2
3
=> Array
```

而且，當我們使用不同類型的物件時，也會得到同樣的物件類型

```ruby
irb(main):074:0> (1..2).each
=> #<Enumerator: 1..2:each>
irb(main):075:0> (1..2).each { |v| p v }.class
1
2
=> Range
```

這就表示在 Ruby 中 `#each` 的行為並不單純是我們所看到的這樣，不過這就要再跟 `Enumerator` 的實作有所關聯，所以就將它留到下一篇文章再討論吧！

## 小結

在寫這篇文章之前其實都沒有認真思考過 `#each` 是怎麼運作的，雖然他是很常見而且很常使用的功能。但是從 Ruby 1.8 到現在的 Ruby 2.6 中間所出現的改變一些新的特性，其實是蠻值得去探討的。

會寫這系列文章主要是因為最近手邊的專案遇到了一個蠻有趣的問題，就是如果靠 ActiveRecord 的話，會產生多餘的 N+1 Query 而如果是直接針對讀取出來的資料進行普通的陣列操作，反而可以避開，又不會浪費太多的資源。

這就成為了一個盲點，也就是我們大多數時候已經習慣了 Rails 提供給我們的便利功能，而忘記應該評估使用情境去選擇適合的方案來處理。
