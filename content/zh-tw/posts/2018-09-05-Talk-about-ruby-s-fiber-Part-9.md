---
title: 淺談 Ruby 的 Fiber（九）
date: 2018-09-05 09:30:34
tags: [Concurrency,Thread,Ruby]
thumbnail: https://blog.frost.tw/images/2018-07-17-talk-about-ruby-s-fiber-part-4/thumbnail.jpg
---

這篇文章我們會把 Broadcast （廣播）功能實作出來，如此一來我們就擁有了可以將訊息透過 Fiber 實作的伺服器廣播給其他使用者的功能。

而這系列文章也就到此告一段落。

<!--more-->

## 觀察

要將廣播功能實作出來，我們需要哪些功能呢？

* 非阻塞的寫入
* 所有連線使用者的列表

其實就卻少了跟 `#wait_readable` 成對的 `#wait_writable` 這個實作。

## 修改 Selector

所以，我們要先針對 Selector 增加 `#wait_writable` 的實作。

```ruby
  def wait_writable(io)
    Fiber.new do
      @writers[io] = Fiber.current
      Fiber.yield
      yield
    end.resume
  end
```

實際上跟 `#wait_readable` 幾乎沒有差異，唯一有差別的是我們將 `@readers` 改為 `@writers`

> 不要忘記在 `initialize` 的時候追加 `@writers = {}` 的行為。

為了要讓在可以寫入的時候能夠將訊息發送出去，所以原本的 `#resume` 也需要增加一些修改，將 `IO.select` 增加觀察可寫入的行為。

```ruby
  def resume
    readable, writable = IO.select(@readers.keys, @writers.keys)
    readable.each do |io|
      io = @readers.delete(io)
      io.resume
    end

    writable.each do |io|
      io = @writers.delete(io)
      io.resume
    end
  end
```

另外 `IO.select` 其實可以接收三個陣列，基本上對應 STDOUT / STDIN / STDERR 三種標準輸出。

## 修改 Client

我們可以將原本的 `#show_message` 稍微修改，變成呼叫 Server 來做廣播的行為。

```ruby
  def show_message
    @server.broadcast self, "#{last_message}\n" while @buffer.include?("\n")
  end
```

這邊我們還要對 Client 增加 `#send` 方法來做寫入。

```ruby
  def send(message)
    result = @socket.write_nonblock(message, exception: false)
    case result
    when :wait_writable
      @selector.wait_writable(@socket) do
        send(message)
      end
    when nil then close
    end
  end
```

因為相比讀取的部分其實簡單很多，所以就沒有額外的拆解。原理上大致就是先嘗試寫入，如果無法寫入的話就讓 Fiber 將他暫時暫停，等到可以寫入之後再把他做完。

## 修改 Server

這邊就是針對 Client 所呼叫的 Broadcast 做實作。

```ruby
  def broadcast(sender, message)
    @clients.each do |client|
      next if client == sender
      client.send("User##{sender.object_id} > #{message}")
    end
  end
```

我們會跳過發出訊息的本人是因為在輸入時，輸入者自己就能看到訊息了，所以就不需要重複顯示。另一方面剛好可以跟收到的訊息做出一個簡單的區隔。

## 總結

經過這大約兩週的實踐，我想大家應該對於 Fiber 有一個簡單的概念。不過實際上，要使用 Fiber 其實還是有很多限制在的。

舉例來說，如果兩個行為是有相依性的，該怎麼設計 Fiber 的組成，而像這個範例不斷的產生新的 Fiber 物件，真的會比使用 Thread 還節省記憶體嗎？

這些都是一些需要探討的問題，另外在這篇文章順便對上一篇[使用 Fiber 能給 Ruby 帶來好處嗎？](https://blog.frost.tw/posts/2018/08/21/Does-the-Fiber-have-any-benefit-for-Ruby/)做一個簡單的補充，就是 Fiber 在 Ruby 中基本上無法比 Thread 還快。但是他有著記憶體使用量非常小的優勢，所以我們可以在不要求執行速度，但是很注重記憶體使用控制的情境下使用 Fiber 來改善記憶體的使用。

之後也會繼續抽空測試關於 Fiber 的可能性，再跟大家分享和討論有哪些地方可以做應用。
