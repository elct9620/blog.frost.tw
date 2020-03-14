---
title: 淺談 Ruby 的 Fiber（二）
publishDate: 2018-07-03 19:26:44
tags: [Ruby, Concurrency, Thread]
thumbnail: https://blog.frost.tw/images/2018-07-03-talk-about-ruby-s-fiber-part-2/thumbnail.jpg
---

[第一篇](https://blog.frost.tw/posts/2018/06/26/Talk-about-ruby-s-fiber-Part-1/)我們已經大致上了解 Fiber 的運作原理，不過要能夠實際上的掌握跟應用，我認為是需要靠實作來熟悉的。

所以，這一篇我們先來講學習 Socket 最常見的 TCP 伺服器實作吧！

<!--more-->

為了要比較 Fiber 和 Thread 版，這次我們會先用 TCPServer 來實做一個簡易的 TCP 伺服器，並且用來比較兩者的差異。

## TCPServer

首先，我們先用 Ruby 建立一個可以接收連線的 TCP 伺服器。

```ruby
require 'socket'

server = TCPServer.new 3000
loop do
  client = server.accept
  client.puts "HELLO WORLD"
  client.close
end
```

我們可以用 telnet 指令來做簡單的測試。

```bash
telnet localhost 3000
```

目前的版本在連上之後就會馬上顯示 `HELLO WORLD` 然後關閉連線。

## Blocking I/O

那麼，我們希望接收來自使用者的訊息，會像這樣修改。

```ruby
require 'socket'

server = TCPServer.new 3000
loop do
  client = server.accept
  client.puts "HELLO WORLD"
  puts client.gets
  client.close
end
```

這個時候，如過我們用像這樣的順序進行操作，就會發現無法正常運作。

```bash
# 視窗一
telnet localhost 3000 # => 顯示 HELLO WORLD
# 視窗二
telnet localhost 3000 # => 沒有顯示
```

這是因為在 `client.gets` 的時候發生了 Blocking I/O（I/O 阻塞）的情況，也就是操作因為 `#gets` 嘗試讀取，但是因為讀取不到而阻止接下來的程式執行。

## Thread

在這個時候，我們可以透過幾種方式解決。

1. Process
2. Thread
3. Fiber

第一個方案因為是記憶體完全獨立的，所以我們就無法知道其他連線的用戶存在，所以一般來說不會使用。而 Thread 則是把 Process 切割後，遇到了一些情境像是 `sleep` 和 `Blocking I/O` 等情況，就會先把執行權轉交給其他 Thread 繼續執行。

所以，我們可以將程式修改成這樣。

```ruby
require 'socket'

server = TCPServer.new 3000
loop do
  client = server.accept
  client.puts "HELLO WORLD"
  Thread.new do
    puts client.gets
    client.close
  end
end
```

如此一來，當我們碰到 Blocking I/O（`#gets`）的情況，就會先將目前佔用的 Thread 轉交給其他可以繼續執行的 Thread 身上，先執行任務。

## 小結

這篇文章簡單的介紹了 Thread 的使用方式，以及該如何避免遇到 Blocking I/O 的處理方式，下一篇就來看看透過 Fiber 的流程控制機制，是怎樣迴避這個問題的。
