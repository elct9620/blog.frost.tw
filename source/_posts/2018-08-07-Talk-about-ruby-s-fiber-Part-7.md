---
title: 淺談 Ruby 的 Fiber（七）
date: 2018-08-07 19:00:21
tags: [Ruby, Concurrency, Thread]
thumbnail: https://blog.frost.tw/images/2018-08-07-talk-about-ruby-s-fiber-part-7/thumbnail.jpg
---

上週我們開始重構 Fiber 的結構，透過一個統一的 `Selector` 物件來選取這個「當下」可以進行 I/O 操作的物件。

不過，我們原本預期是因為使用 `rescue` 來捕捉錯誤控制流程才讓他運行不正常，經過一週的思考後，卻發現事情跟預想的不太一樣。

<!-- more -->

## 調整

我們先快速的使用 `exception: false` 的模式調整程式，會變成類似這樣的結構。

```ruby
Fiber.new do
  loop do
    client = server.accept_nonblock(exception: false)
    selector.register(server) if client == :wait_readable
    next if client == :wait_readable

    Fiber.new do
      buffer ||= ''
      loop do
        read = client.read_nonblock(1024, exception: false)
        selector.register(client) if read == :wait_readable
        next if read == :wait_readable
        buffer << read
        puts buffer if buffer.include?("\n")
      end
    end.resume
  end
end.resume
```

然而，現實上並沒有實際的改善卡住的問題，和我們原本預測只要釐清流程就會正常的方向不太一樣。

## 反思

目前我們已經透過 `Selector` 物件來管理所有的 I/O 行為，現在程式碼只有一個地方能夠對 I/O 造成阻塞，那就是 `IO.select` 這個方法，會將最後一次我們紀錄「等待中」的物件傳入，等待作業系統提供可繼續 I/O 行為的通知。

```ruby
def resume
    puts @fibers.keys
    readable, = IO.select(@fibers.keys)
    readable.each do |io|
      @fibers[io].resume
      @fibers.delete(io)
    end
  end
```

我們嘗試將放在 `@fibers` 中的物件列出來，就會發現實際上一直都只有一個。原本預期會存在的 `TCPServer` 會在第一個使用者連上後就被移除。

而我們預期的應該要是在這一個 I/O 操作完畢後，將他移除。

## 修改

我們對 `Selector` 做出一些修改，變成類似像這樣的結構。

```ruby
class Selector
  def initialize
    @fibers = {}
  end

  def register(io)
    @fibers[io] = Fiber.current
    Fiber.yield
    @fibers.delete(io)
  end

  def resume
    readable, = IO.select(@fibers.keys)
    readable.each do |io|
      @fibers[io].resume
    end
  end
end
```

如此一來，所有使用者都能夠正常的連上並且寫入資料到伺服器上。

## 小結

不過，現實並沒有我們預期的那麼容易，因為我們在其中一個使用者離開後，發現 `@fibers.delete(io)` 並沒有被執行，在下一篇文章我們要來尋找原因並且將它解決。

在這將近一個半月的文章，我們會發現使用 `Fiber` 並沒有預期中的容易，而且似乎並沒有想像中的實用，但是透過這樣的方式，也可以去思考為什麼 Ruby 中要存在 `Fiber` 以及到底是用來處理怎麼樣的特殊狀況，才會需要用到。
