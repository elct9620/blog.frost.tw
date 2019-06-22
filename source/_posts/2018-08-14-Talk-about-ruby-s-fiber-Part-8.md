---
title: 淺談 Ruby 的 Fiber（八）
date: 2018-08-14 20:47:48
tags: [Concurrency,Thread,Ruby]
thumbnail: https://blog.frost.tw/images/2018-07-17-talk-about-ruby-s-fiber-part-4/thumbnail.jpg
---
到這篇為止，我們已經完成了將 Fiber 應用在程式中的基本雛型，現在只需要將上週未完成的錯誤處理，我們就能獲得一個可以正常發送訊息到伺服器的伺服器。

<!-- more -->

## 觀察

經過幾次的測試，我們會發現原本預期沒有正常運作的 `@fibers.delete(io)` 實際上是有在執行的，但是在使用者離開時，我們還在等待「讀取」所以就會觸發 `end of file reached (EOFError)` 這個錯誤，也就是使用者離開的瞬間，我們可以讀取。但是讀取到的是終止的訊息。

針對這個問題，我們只需要增加 `rescue EOFError` 讓他不要產生錯誤，就可以順利解決。

> 不過以邏輯上來說，我們更這種由我們掌控的機制，不應該是一種例外，所以採取 `exception: false` 的做法也許是一個不錯的選擇。

## 重構

既然我們已經了解完整的運作原理，但是程式碼依舊還是處於混亂的狀態。因此我們最好先進行一次重構會比較適合。

```ruby
class Selector
  def initialize
    @readers = {}
  end

  def wait_readable(io)
    Fiber.new do
      @readers[io] = Fiber.current
      Fiber.yield
      yield
    end.resume
  end

  def resume
    readable, = IO.select(@readers.keys)
    readable.each do |io|
      io = @readers.delete(io)
      io.resume
    end
  end
end
```

`Selector` 的部分我們沒有做太多的修改，為了配合後面會有寫入的行為，我們先把原本的 `@fibers` 修改為 `@readers` 來對應。

```ruby
class Client
  def initialize(selector, server, socket)
    @socket = socket
    @selector = selector
    @server = server
    @buffer = ''
  end

  def listen
    buffer = @socket.read_nonblock(1, exception: false)
    case buffer
    when :wait_readable then wait
    when nil then close
    else
      @buffer << buffer
      show_message if @buffer.include?("\n")
      listen
    end
  end

  def wait
    @selector.wait_readable(@socket) do
      listen
    end
  end

  def show_message
    puts last_message while @buffer.include?("\n")
  end

  def last_message
    (_, @buffer = @buffer.to_s.split("\n", 2)).first
  end

  def close
    @server.close(self)
  end
end
```

這次增加了 `Client` 來針對客戶端的部分處理，當我們收到訊息時會不斷重試直到有 `\n` 符號出現，並且將它顯示出來。

```ruby
class Server < TCPServer
  def initialize(port)
    super port
    @selector = Selector.new
    @clients = []
    async_accept
  end

  def async_accept
    socket = accept_nonblock(exception: false)
    case socket
    when :wait_readable then wait_accept
    else
      client = (@clients.push Client.new(@selector, self, socket)).last
      client.listen
      async_accept
    end
  end

  def wait_accept
    @selector.wait_readable(self) do
      async_accept
    end
  end

  def close(client)
    @clients.delete(client)
  end

  def start
    loop do
      @selector.resume
    end
  end
end

server = Server.new 3000
server.start
```

最後伺服器部分跟客戶端的部分採取類似的邏輯，不過我們將大部分的行為封裝進去，統一進行處理。

## 解析

這次比較特別的有兩個部分，第一個是伺服器的 `@clients` 陣列，會用來記錄在線上上的使用者，這會讓我們之後在實作發送聊天訊息的功能上方便不少。

另一個則是我們利用 Ruby 的 Block 特性，將產生 Fiber 的工作交給 Selector 來負責，如此一來其他部分的程式碼除了需要利用一些遞迴的特性之外，就不會看到 Fiber 也更崇義理解。

## 小結

Fiber 在思考上跟我們以往習慣的方式不太一樣，不過隨著將程式碼整理之後，實際上會發現並沒有那麼複雜，但是需要特別注意程式的執行時機點可能會被稍微的改變。

下一篇文章我們可以嘗試加入廣播訊息的機制，讓這個 TCP 聊天室完成他的實作。
