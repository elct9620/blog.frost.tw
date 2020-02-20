---
title: 淺談 Ruby 的 Fiber（四）
date: 2018-07-17 19:17:26
tags: [Ruby, Concurrency, Thread]
thumbnail: https://blog.frost.tw/images/2018-07-17-talk-about-ruby-s-fiber-part-4/thumbnail.jpg
---

在上週的[文章](https://blog.frost.tw/posts/2018/07/10/Talk-about-ruby-s-fiber-Part-3/)我們注意到 Fiber 的使用並不是那麼容易的，因為我們需要自行管理每一個 Fiber 被恢復（`#resume`）的時機，這週就繼續來挑戰吧！

<!--more-->

## 思考

在上週我們已經知道需要將行為從原本會阻塞 I/O 的操作，轉換為非阻塞的操作。所以我們會進行以下的嘗試，來修正 Fiber 的運行。

1. 使用 `#accept_nonblock` 來取得用戶端
2. 使用 `#read_nonblock` 來讀取使用者的資料

## 嘗試

```ruby
server = TCPServer.new 3000

fibers = []
loop do
  begin
    client = server.accept_nonblock
    client.puts 'Hello World'

    fibers.each(&:resume)

    fiber = Fiber.new do
      buffer ||= ''
      begin
        buffer << client.read_nonblock(1024)
        if buffer.include?("\n")
          puts buffer
          client.close
        end
      rescue IO::WaitReadable
        puts 'RETRY'
        Fiber.yield
        retry
      end
    end

    fiber.resume
    fibers << fiber
  rescue IO::WaitReadable
    sleep 1
    retry
  end
end
```

我們對原本的做了一些修改，把 `#accept_nonblock` 和 `#read_nonblock` 加入到了程式碼中，在這邊我們可以利用 `retry` 關鍵字觸發重試的行為，讓我們遇到 `IO::WaitReadable` 錯誤時，可以自動地重新開始。

不過，我們還是發現了一些問題不太正常。

1. 依然要在第下一個連線開始後才會斷線
2. 到第三次之後就不正常的斷線

## 分析

首先我們來分析一下為什麼還是無法在使用者輸入訊息後關閉連線。

1. 等待連線
2. 重試（...）
3. 第一個連線連上
4. 執行 `fibers.each(&:resume)` 動作
5. 執行初次連線的 Fiber 生成和 `#resume` 動作
6. 等待連線
7. 重試（...）

透過上面的流程，我們會發現要觸發使用者輸入訊息後斷線的行為，會因為「沒有人連上」的重試行為，一直被卡在 `#accept_nonblock` 這個狀態上（因為他會產生 `IO::WaitReadable` 錯誤）

而第二個錯誤，則是在第三次連線後，會出現 `dead fiber called (FiberError)` 這個錯誤訊息，這是因為當我們用盡 `Fiber.yield` 次數後，這個 Fiber 就無法再繼續進行 `#resume` 否則就會發生這個錯誤。

## 解析

事實上，這兩個問題是一起發生的。假設我們先將 `fibers.each(&:resume)` 放到 `#accept_nonblock` 前面，那麼很快地就會將 `dead fiber called` 這個錯誤觸發，所以我們還需要搭配在關閉連線時，將目前所屬的 Fiber 從 `fibers` 移除掉，才能夠確保程式正常運行。

## 小結

目前已經逐漸抓到一些線索，可以讓我們針對 Fiber 進行應用，基本上這次的錯誤修正後就可以獲得跟我們預期中一樣運行的 TCP Server 了。

不過，如果想要將它改寫成一個簡易的聊天室，又要怎麼做？會碰到什麼問題呢？

