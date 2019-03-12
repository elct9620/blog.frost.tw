---
title: 我在 Ruby 埋了一個陷阱 - Signal 的應用
date: 2019-03-12 21:29:15
tags: [Ruby, 作業系統, Daemon, 心得]
thumbnail: https://blog.frost.tw/images/2019-03-12-i-make-a-trap-in-the-ruby-the-usage-of-signal/thumbnail.jpg
---

在 Ruby 之中，其實隱藏了很多非常實用的標準函式庫，而 Signal 就是其中一個。

我們在寫 Ruby 大多數時候都是 Ruby on Rails 框架的應用，但是你們有想過當我們在一些 Gem 運行的時候，使用 Ctrl + C 為什麼不會出現錯誤嗎？

例如我們常常用到的 `irb` 和 `pry` 為什麼按下 Ctrl + C 的時候不是直接中斷，卻還能繼續運作？

<!-- more -->

## 常駐程式

一般來說我們很少會用 Ruby 寫一個常駐程式（Daemon）不過有時候我們希望持續的抓資料或者監聽一個 Socket 的時候，還是會需要用到類似下面這樣的實作。

```ruby
# ...

loop do
  # ...
end
```

當我們跑起來之後，用 Ctrl + C 去中斷的話，就會出現類似下面的錯誤訊息。

```
Traceback (most recent call last):
        2: from loop.rb:3:in `<main>'
        1: from loop.rb:3:in `loop'
loop.rb:5:in `block in <main>': Interrupt
```

這是因為我們的程式在未預期的狀況下被「中斷（Interrupt）」的關係。

## Signal

在很多 Unix 作業系統中，我們可以對任一一個執行中的程式（Process）發送一個 Signal 來告訴這個程式該做什麼。

也因此，我們可以從[維基百科](https://zh.wikipedia.org/wiki/Unix%E4%BF%A1%E5%8F%B7)的解說其實可以了解到，平常我們很習慣的 Ctrl + C 其實就是發送訊號的動作，而這個訊號剛好就是 SIGINT （中斷訊號）

另一方面，我們的程式卡住又無法關閉的時候，也會使用 `kill` 指令來強致終止程式，其實也是對程式發送訊號的一種形式。

像是我想要終止 PID 1000 的程式，可以像這樣下指令。

```
kill -int 1000
```

如此一來就可以發送一個 SIGINT 給 PID 1000 的程式。

由此可見，有很多我們平常在使用的東西都有支援接收訊號，例如 Nginx 的[文件](http://nginx.org/en/docs/control.html)就有說明哪些訊號可以做哪些事情。

像是 `SIGHUP` 可以讓 Nginx 重新讀取設定檔，也就是 `nginx -s reload` 的指令（雖然大多數時候我們可能都會直接重開 Nginx 吧⋯⋯）

有了這些概念後，我們就可以用 Ruby 提供的 Signal 來做一些應用。

## Graceful Shutdown

當我們在執行一個迴圈處理事情的時候，如果遇到中斷的情況，很有可能會沒有把事情做完。

例如我們嘗試插入三筆資料到資料庫，到第二筆的時候就被中斷，那麼就會損失第三筆資料，而且下次重新執行的時候就會有錯誤的結果。

> 這個情況實務上應該是要善用資料庫的 Transaction （交易）功能，來確保該做的事情都完成後一起 Commit （確認）

所以，要避免一些「不應該直接被中斷」的情況，我們就可以善用 `Signal.trap` 這個方法。

稍微改良一下文章一開始的無限迴圈，變成像這樣：

```ruby
# ...

running = true
Signal.trap(:INT) { running = false }

loop do
  break unless running
  # ...
end
```

按下 Ctrl + C 就不會有任何錯誤，因為對 Ruby 來說他還是確實的執行完畢一個迴圈才停止，而不是跑到一半就被直接中斷。

## 小結

這算是一個超級冷知識吧，不過大多數的程式語言其實都有提供這樣的機制。而且這個功能其實也很好用，例如我們可以做一個 Ctrl + C 兩次才離開的功能。

```ruby
try_exit = 0
Signal.trap(:INT) do
  try_exit += 1
  puts "Are you sure exit? Press Ctrl + C Again" if try_exit == 1
  running = true if try_exit == 2
end

loop do
  break if try_exit == 2
  # ...
end
```

如此一來，我們就可以有效的避免程式意外中斷。

> 剩下要擔心的大概就是停電或者被強制中開機的狀況了吧⋯⋯

另外 Ruby 還有一個叫做 `at_exit` 的方法，之後機會可以來和 Signal 比較一下使用情境上的差異。