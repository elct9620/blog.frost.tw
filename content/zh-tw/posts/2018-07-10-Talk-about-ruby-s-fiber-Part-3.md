---
title: 淺談 Ruby 的 Fiber（三）
publishDate: 2018-07-10 21:35:01
tags: [Ruby,Thread,Concurrency]
thumbnail: https://blog.frost.tw/images/2018-07-10-talk-about-ruby-s-fiber-part-3/thumbnail.jpg
---

延續[上一篇](https://blog.frost.tw/posts/2018/07/03/Talk-about-ruby-s-fiber-Part-2/)文章的實作，我們已經有一個簡易的 Thread 版本 TCP Socket 伺服器可以運作，那麼該怎麼用 Fiber 修改呢？

<!--more-->

## 思考

在我們使用 Thread 的時候，應該要先執行哪個 Thread 中的任務會由作業系統或者語言本身底層的實作來協助我們處理，但是 Fiber 目前只能用來在不同的程式碼片段中切換，所以我們就需要自己管理應該要切換到哪一個片段。

所以我們要先定義一個情境：

當 Blocking I/O 發生的時候，會發生什麼事情？

```ruby
# Server 嘗試讀取 Client 的資料
resp = client.gets
# Blocking I/O 發生
# ...
# ...
# 使用者輸入 HELLO
# Blocking I/O 結束
puts resp
# => HELLO
```

其實就是當我們嘗試做 Read（讀取）跟 Write（寫入）的時候，暫時無法操作的狀態。

Ex. 想讀取資料卻無法讀取

所以，根據上一篇文章的案例，當我們嘗試 `#gets` 卻沒有得到使用者的回應時，就應該先透過 `Fiber.yield` 把執行權限釋放出來。

## 嘗試

因為邏輯上跟以往我們習慣的方式不太一樣，所以我們需要進行多次的嘗試，讓 Fiber 可以像我們預期的一樣運作。

```ruby
server = TCPServer.new 3000

fibers = []
loop do
  client = server.accept
  client.puts 'Hello World'

  fibers.each(&:resume)

  fiber = Fiber.new do
    Fiber.yield
    puts client.gets
    client.close
  end

  fiber.resume
  fibers << fiber
end
```

這樣看起來好像會運作，不過當我們嘗試執行的時候，卻發現有一些奇怪的地方。

1. 輸入訊息後沒有馬上斷線
2. 第二個人連上後才會斷線

## 分析

當第一個人連上後，會發生以下事情：

1. 先把 `fibers` 裡面存在的 Fiber 執行 `#resume` 一次
2. 對這次連上的使用者產生一個 `Fiber`
3. 先執行一次（抵達第一次的 `Fiber.yield`）被暫停
4. 將目前的 Fiber 物件儲存在 `fibers` 中
5. 重新呼叫 `server.accept` -> Blocking I/O

第二個人連上後，會發生以下的事情

1. 先把 `fibers` 裡面存在的 Fiber 執行 `#resume` 一次
2. 第一個連線的使用者執行 `#gets` 行為 -> Blocking I/O

到目前為止已經被 Blocking I/O 堵住兩次，還比原本沒有 Fiber 的版本更難懂，那麼問題出在哪裡呢？

## 解析

首先，我們希望程式上遇到 Blocking I/O 時先不要卡住我們，所以我們需要將 `server.accept` 和 `client.gets` 這兩個行為調整成 Nonblocking I/O 的使用方式。

也就是當遇到 Blocking I/O 的時候我們希望直接回傳「沒有資料」之類的訊息給我們，而不是直接停住。

```ruby
loop do
  puts 'LOOPING'
  begin
    client = server.accept_nonblock
    # 有人連上了！
  rescue IO::WaitReadable
    # 目前都沒有人連線！
  end
end
```

以 `#accept_nonoblock` 這個用法作為例子，我們會發現，假設我們做 `puts 'LOOPING'` 這段程式碼，如果是 `#accept` 的時候，需要有人連上才會顯示訊息，但是在 `#accept_nonblock` 的時候，則會不斷出現。

同時，我們也會得到一個叫做 `IO::WaitReadable` 的錯誤，告訴我們現在雖然讀取了，但是實際上是無法讀取任何東西的，需要等待有東西可以讀取。

透過這樣的機制，我們就可以在碰到這個錯誤時進行 `Fiber.yield` 先讓他暫停，等到我們確認他可以讀取後，再繼續執行。

## 小結

這篇文章我們發現如果使用 Thread 的話，基本上是由作業系統去管理碰到 Blocking I/O 時該怎麼做，但是如果是 Fiber 的話，我們就得完全靠 Ruby 來解決。

同時也會遇到某些情境無法使用的狀況，像是 `net/http` 這個標準函式庫，並沒有提供 Nonblocking I/O 的方法，我們就無法透過在 Blocking I/O 狀態下先讓他暫停，並且先切換到其他工作上。
