---
title: 淺談 Ruby 的 Fiber（五）
date: 2018-07-24 20:24:31
tags: [Concurrency,Ruby,Thread]
thumbnail: https://blog.frost.tw/images/2018-06-26-talk-about-ruby-s-fiber-part-1/thumbnail.jpg
---

經過[上次](https://blog.frost.tw/posts/2018/07/17/Talk-about-ruby-s-fiber-Part-4/)的嘗試，我們已經開始對於 Fiber 的性質有一些了解，目前還需要解決已經結束的 Fiber 被呼叫，以及來不及處理的問題。

<!-- more -->

## 思考

實際上在上週我們已經很明確的之到如果遇到 `dead fiber called (FiberError)` 錯誤，是表示 Fiber 已經無法再繼續執行。舉例來說，我們執行了三次 `Fiber.yield` 那麼這個 Fiber 最多只能執行四次（包含產生的那次）再多就會失敗。

而另一個問題則是我們在做 `#resume` 的時候總是在 `#accept_nonblock` 之後，所以當失敗的時候並不會優先的做 `#resume` 才重新檢查是否有人嘗試連線。

所以，我們只需要做一點小修改。

## 嘗試

首先，我們將 `fibers.each(&:resume)` 的順序放到 `server.accept_nonblock` 之前，讓他在發生 `IO::WaitReadable`

```ruby
client = server.accept_nonblock
client.puts 'Hello World'

fibers.each(&:resume)

# ...
```

所以會變成像這個樣子

```ruby
fibers.each(&:resume)

client = server.accept_nonblock
client.puts 'Hello World'

# ...
```

如此一來，我們就可以正常的讓伺服器進入等待的狀態。

不過當我們連上並且傳送一些訊息後，就會再次出現 `dead fiber called (FiberError)` 錯誤訊息，因為我們在關閉連線後並沒有把處理完畢的 Fiber` 清除掉。

所以我們還需要做下面的修改。

```ruby
# ...
        buffer << client.read_nonblock(1024)
        if buffer.include?("\n")
          puts buffer
          client.close
        end
# ...
```

增加一行在 `client.close` 下方。

```ruby
# ...
        buffer << client.read_nonblock(1024)
        if buffer.include?("\n")
          puts buffer
          client.close
          fibers.delete(fiber)
        end
# ...
```

到這一階段，我們大致上就算是讓 Fiber 正常運作。

不過當我們把 `client.close` 刪除，準備讓他變成聊天室的形式時，又會再次出現 `dead fiber called (FiberError)` 錯誤，因為我們並沒有繼續透過 `Fiber.yield` 讓他可以繼續執行。

## 小結

到這個階段，我們已經可以初步的使用 Fiber 並且控制運行的流程，但是繼離將簡易的 TCP 聊天室實作出來還差上一小段。下一篇開始我們會嘗試將 `client.close` 和 `fiber.delete(fiber)` 去除，並且嘗試加入一些輔助程式來讓他可以持續的接收資料。
