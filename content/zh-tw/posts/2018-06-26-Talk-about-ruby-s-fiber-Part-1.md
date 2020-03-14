---
title: 淺談 Ruby 的 Fiber（ㄧ）
publishDate: 2018-06-26 20:29:19
tags: [Ruby,Thread,Concurrency]
thumbnail: https://blog.frost.tw/images/2018-06-26-talk-about-ruby-s-fiber-part-1/thumbnail.jpg
---

前陣子再研究 Ruby 從 1.9.3 就開始提供的 Fiber 該怎麼使用，不過網路上的資料大多都只是簡單的討論。那麼 Fiber 到底是什麼呢？這系列的文章會詳細的介紹 Fiber 的基本概念，還有一些可以應用的方式。

<!--more-->

原本只想一篇文章寫完，但是其實 Fiber 需要大量的改變以往習慣的思考模式，所以還是用系列文來呈現比較恰當。

## 概觀

所以，Fiber 是怎樣的東西呢？從 Ruby 文件上的第一句話可以看到。

> Fibers are primitives for implementing light weight cooperative concurrency in Ruby.

他是用來實作 Concurrency 的標準函式庫，當時看到這裡我就想到 Golang 的 Goruntine 機制，可以像這樣的去實現非同步的操作。

```go
func resp() {
  go func() {
    // Write Later ...
  }
  
  // Respond now ...
}
```

所以在 Ruby 中使用 Fiber 應該也要一樣簡單才對吧！

```ruby
def resp
  Fiber.new do
    # Write Later ...
  end
  
  # Respond now ...
end
```

不過很可惜，這樣是不會像 Golang 一樣運作的！

> 所以我每次講到 Fiber 的運作，都要跟同事說 Ruby 增加 AutoFiber ([RubyChina 介紹](https://ruby-china.org/topics/34992)) 是因為大家都不懂怎麼用。

## 基本概念

有一些文章會提到 Fiber 是一種「流程控制」的工具，主要是因為 `Fiber` 可以利用 `Fiber.yield` 和 `#resume` 來切換要繼續執行的部分。

```ruby
f1 = Fiber.new do
  puts 'A'
  Fiber.yield
  puts 'B'
end

f2 = Fiber.new do
 puts 'C'
 Fiber.yield
 puts 'D'
end

f1.resume # => A
f2.resume # => C
f1.resume # => B
f2.resume # => D
```

由上面的範例來看，我們會發現 Fiber 在 `Fiber.yield` 之後，其實就離開原本執行的 Context (Block) 然後其他人就可以繼續執行他想執行的東西。

> 這邊的 Context 指的是一個方法包含起來的範圍，在 Ruby 裡面 Block 基本是是透過 `Proc.new` 實現的，而方法的本體也是。不過要注意的是 Fiber 是可以跟外部交換變數的，這也是 Golang 要用 Channel 機制來交換 Goroutine 的資料，確保類似 Thread 實現的 Race Condition 問題不會發生。

## 範例

一次性的獲取這樣充滿衝擊性的資訊可能對大家有點吃力，我們稍微修改前面的範例改成類似 JavaScript 的 Generator 機制來習慣一下這樣的變化。

```ruby
f = Fiber.new do
 counter = 0
 loop do
  Fiber.yield counter += 1
 end
end

puts f.resume # => 1
puts f.resume # => 2
```

上面這個調整的版本我們用了一個 `loop` 當作無限迴圈，但是實際上並不會阻塞我們進行後續的操作，因為 `Fiber.yield` 可以暫時的跳出目前執行的 Context 把它暫停，而在執行 `#resume` 的時候才會繼續執行到下一個 `Fiber.yield` 被呼叫。

所以，如果想實現一個類似 Generator 的行為，可以像這樣封裝。

```ruby
class Generator
  attr_reader :counter
  
  def initialize
    @counter = 0
    @fiber = Fiber.new do
      loop do
        Fiber.yield @counter += 1
      end
    end
  end
  
  def next
    @fiber.resume
  end
end

generator = Generator.new
puts generator.next
puts generator.next
puts "Counter: #{generator.counter}"
```

## 小結

透過 Fiber 這樣的特性，我們可以做到一些非同步的行為，但是又不需要依賴其他的 Ruby Gem 或者 C Extension 來實現，另一方面根據 Ruby Doc 表示，產生一個 Fiber 佔用的記憶體是 4K 左右的堆疊大小，相對於產生 Thread 都要輕量不少。

> 所以從以前以 Process 之後加入 Thread 到現在的 Concurrency 機制，剛好就是三個不同記憶體使用量級，在適合的情況下使用適當的機制可以讓程式更加易讀跟好用（不過 Fiber 沒封裝好會很難讀就是了 XD）

下一篇開始會用一些範例來示範，不然這篇文章也要跟目前能找到的資料一樣沒有講到大家最關心的實際應用。因為跟 I/O Blocking 相關的機制很搭，所以後面會介紹像是非同步的 HTTP 請求跟不用 Thread 的 TCP 伺服器等等。
