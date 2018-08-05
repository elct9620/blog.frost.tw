---
title: 淺談 Ruby 的 Fiber（六）
date: 2018-07-29 20:56:09
tags: [Ruby, Thread, Concurrency]
thumbnail: https://blog.frost.tw/images/2018-07-03-talk-about-ruby-s-fiber-part-2/thumbnail.jpg
---

經過前面幾篇文章的介紹，我們已經初步的了解 Fiber 的性質。這系列的文章目標是利用 Fiber 實現再不透過 Thread 或者 Process 的情境，來實現支援多人連線的 TCP 聊天伺服器。

從這一篇開始，我們就要正式的來挑戰完整的實作了！

<!-- more -->

在開始之前，我們已經注意到前幾篇的程式碼已經開始有點複雜而且不好維護，所以我們要先做兩件事情來改善這個問題。

1. 釐清功能
2. 重構

## 功能分析

因為 Fiber 的特性，我們必須在所有遭遇到 Blocking I/O 的情境下轉為 Nonblocking I/O 來操作，也因此我們回來看一下前面幾篇需要處理 Blocking I/O 的情境。

1. 接受連線的 `#accept` 行為
2. 讀取使用者資料的 `#gets` 行為

為了能夠實現聊天室功能，我們至少還會需要再加入傳送資料給使用者的 `#puts` 行為。

而這些動作，我們都需要透過一個統一的物件來處理。

我們可以簡單的把他整理成類似像這樣的行為流程圖。

![FlowchartDiagram1.png](https://blog.frost.tw/images/2018-07-29-talk-about-ruby-s-fiber-part-6/flowchart.png)

如果照我們原來的做法，會發現很難統一管理 Fiber 來在可以操作時執行對應的動作，所以上圖執行 `Fiber.yield` 的部分，我們會用一個物件來做統一管理，其他部分則可以先維持原樣。

## 重構

首先，我們先嘗試實現一個 `Selector` 來將可以讀取或者寫入的 I/O 物件找出來。

修改後的程式碼大致上會像這樣，我們提供了一個 `#register` 方法讓暫時無法讀取的物件被記錄下來。

```ruby
require 'socket'
require 'fiber'

# :nodoc:
class Selector
  def initialize
    @fibers = {}
  end

  def register(io)
    @fibers[io] = Fiber.current
    Fiber.yield
  end

  def resume
    readable, = IO.select(@fibers.keys)
    readable.each do |io|
      @fibers[io].resume
      @fibers.delete(io)
    end
  end
end

selector = Selector.new
server = TCPServer.new 3000

loop do
  begin
    selector.resume

    client = server.accept_nonblock
    client.puts 'Hello World'

    Fiber.new do
      buffer ||= ''
      begin
        buffer << client.read_nonblock(1024)
        puts buffer if buffer.include?("\n")
      rescue IO::WaitReadable
        selector.register(client)
      end
    end.resume
  rescue IO::WaitReadable
    sleep 1
    retry
  end
end
```

不過這樣是無法正確執行的，因為 `IO.select` 行為是一個 Blocking I/O 的行為，不過我們可以將大量的 I/O 物件一次性的選取，只要有一個符合條件就可以解除。

而這段程式碼出問題的主因是，當開始後就會進入 `IO.select` 的阻塞狀態，但是伺服器的阻塞狀態並沒有被加入到其中管理，而造成無法正確運行。

因此，我們要將原本的程式碼再做出一些修正。

```ruby
Fiber.new do
  loop do
    begin
      client = server.accept_nonblock
      client.puts 'Hello World'

      Fiber.new do
        buffer ||= ''
        begin
          buffer << client.read_nonblock(1024)
          puts buffer if buffer.include?("\n")
        rescue IO::WaitReadable
          selector.register(client)
          retry
        end
      end.resume
    rescue IO::WaitReadable
      selector.register(server)
      retry
    end
  end
end.resume

loop do
  selector.resume
end
```

不過修改之後，卻發現因為加入了 `Fiber.new` 給伺服器後，原本的 `retry` 和 `loop` 的角色似乎有點微妙，如果不使用 `loop` 的話，成功連線後就不會嘗試等待下一個新連線，而失敗的話不使用 `retry` 一樣也不會繼續嘗試處理新的連線，這樣整個工作分配變得有點混亂。

## 解析

要解決這樣的問題，最為理想的狀態是在 `#accept_nonblock` 的下一行馬上使用 `Fiber.yield` 以便 `Fiber#resume` 發生時能夠繼續還未完成的動作。

在 Ruby 裡面大部分的 Nonblocking I/O 方法都提供了 `exception: false` 的選項，讓我們達成這個條件。

## 小結

雖然開始嘗試重構，但是馬上又發現程式碼變的複雜，在下一篇我們會先嘗試採取 `exception: false` 的做法調整 Fiber 繼續執行的流程，然後再做一次重構讓程式碼恢復乾淨的狀態。
