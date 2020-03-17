---
title: 從 Functional Programming 重新思考程式設計
publishDate: 2020-03-14T22:02:23+08:00
tags: ["Functional", "C", "Ruby", "心得"]
toc: true
series: Functional
thumbnail: https://blog.frost.tw/images/2020-03-14-rethink-programming-by-functional/thumbnail.jpg
credit:
promote:
  image: /images/banners/functional-670x120.png
  link: http://bit.ly/2IUIxWO
  title: 工作上用得到的函數式程式設計
---

因為時間的關係錯過了實體課程，不過利用 228 連假把[工作上用得到的函數式程式設計](http://bit.ly/2IUIxWO)這門課補完。

在 Functional Programming（函數式程式設計）裡面有許多概念是可以提取出來應用的，如果你使用的語言有支援一定程度的特性的話，就能更做出更多的變化。

<!--more-->

## 更彈性的設計 {#the-flexible-design}

以我工作上常用的 Ruby 作為例子我們可以用一個稍微極端的例子來看

```ruby
# 來源資料
users = [
  [1, 'Jimmy', 'male', 180, 72, 70],
  [2, 'Mary', 'female', 160, 50, 65],
  [3, 'Gary', nil, 166, 80, 95],
  [4, 'Bob', 'male', 160, 75, 90]
]

# Curry 化的 Function
gender_is = ->(gender, (_, _, item, *)) { gender == item }.curry
waistline_less_than = ->(max, (*_args, waistline)) { max > waistline }.curry

health_users =
  users
  .filter do |user|
    # 利用語言特性跟 Curry 動態設定條件
    case user
    when gender_is.('male') then waistline_less_than.(90)
    when gender_is.('female') then waistline_less_than.(80)
    else ->(_) { true }
    end.(user)
  end

# 因為 Bob 腰圍大於 90 因此被篩選掉
pp health_users
```

以 Ruby 來說 Matz（Ruby 語言之父）曾在他的[松本行弘談程式世界的未來](https://www.tenlong.com.tw/products/9789863473312)這本書中提過 Ruby 的一些語法是受到 Lisp 語言的影響，也因此在 Ruby 中保有了一些函數式語言的特性。

實際上最實用的是 Ruby 在迭代器（Enumerator）提供了非常多函數式語言才有的方法，像是 `map`、`filter` 這類都能讓我們很輕鬆的篩選跟處理資料。

## 重新思考方法的設計 {#rethink-the-method-design}

在函數式程式設計中，以課程裡面使用的 Elixir 作為例子，我們可以利用 Pattern Matching 的特性設計出像這樣的程式碼：

```elixir
defmodule Server.Connection do
  # ...

  def input("exit", socket), do: :gen_tcp.close(socket)
  def input("help", socket), do: socket |> Server.Helper.print
  def input(action, socket), do: socket |> Server.Handler.process(action)
end
```

如果是在我們熟悉的物件導向語言處理的話，就會變成類似像這樣的程式碼

```ruby
class Server::Connection
  # ...

  def input(action)
    case action
    when "exit" then @socket.close
    when "help" then Server::Helper.print_to(@socket)
    else @handler.process(action)
  end
end
```

有趣的地方在於，假設我們想要在 Ruby 裡面拓展更多「指令」的話就會讓 `#input` 這個方法不斷地增長，最後我們會變成需要設計一個像是 Registry（註冊器）來管理這些指令。

但是在支援 Pattern Matching 的函數式語言裡面，我們只需要將這些方法加以分類就可以很輕鬆的拓展出來，也因此像是在 Elixir 這類語言我們幾乎不需要使用到判斷式就能決定要做什麼，這也能讓程式碼在另一種形式上變得簡潔。

> 以 Ruby 的語法檢查器 Rubocop 來說，一個方法基本上建議上只能有 10 ~ 15 行的內容，要符合一些最佳實踐的話通常會需要拆分很多方法跟物件來處理，也因此我常跟同事說我們應該試著在呼叫之前就做好判斷，讓每一個方法都明確知道自己該做些什麼。

## 重新思考狀態的定義 {#rethink-the-definition-of-state}

函數式語言之所以會被叫做 Functional 某方面來說也是跟數學非常有關係的，以數學的函式來說 `f(x) = x + 1` 其實也只會有輸入跟輸出兩種情況，也因此在函數式語言比較難實現出狀態這樣的概念。

如果我在 Ruby 想將一個資料（狀態）傳遞給下一個處理，在沒有應用物件的情況下就會需要像這樣寫：

```ruby
get_username(parse_json(fetch(url)))
```

展開之後會像是這樣：

```ruby
response = fetch(url)
parsed_json = parse_json(response)
username = get_username(parsed_json)
```

但實際上以物件導向的方式來處理的話我們會用 Instance Variable（實例變數）來保存狀態：

```ruby
class User
  def initialize(url)
    @url = url
  end

  def username
    parsed_json.fetch(:username)
  end

  def parsed_json
    @parsed_json ||= JSON.parse(response)
  end

  def response
    @responsd ||= Net::HTTP.get(@url)
  end
end

User.new(url).username
```

透過這樣的方式使用者就能夠透過很簡單的方式直接的取得所需的資訊，而在 Elixir 中則會像這樣實現：

```elixir
defmodule User do
  def username(user), do: user |> Map.fetch(:username)
  def load(url), do: HTTP.get(url) |> JSON.parse
end

{:ok, username } = User.get(url) |> User.username
```

因為沒有內部的狀態保存，所以通常會將狀態透過參數傳遞，雖然無法保存但是透過語言的特性依舊能夠恰當處理，甚至我們需要反思封裝狀態這件事情是否是在多數情況下「必要」的。

有趣的是，我們平常享受 Ruby 的物件導向特性讓我們可以透過物件來保存狀態，但是在 CRuby 或者 mruby 每次處理也是需要將狀態當作參數傳遞進去的。

```c
// mruby

mrb_value user_get_name(mrb_state* mrb, mrb_value self) {
  return mrb_str_new_cstr(mrb, "Username");
}

void init_user(mrb_state* mrb) {
  struct RClass *klass = mrb_define_class(mrb, "User", mrb->object_class);
  mrb_define_method(mrb, klass, "username", user_get_name, MRB_ARGS_NONE());
}
```

> 不過 C 語言不是函數式語言，方法頂多是一種指標而已。只是在非物件導向語言裡面，保存狀態通常都是透過參數傳遞。

像這樣去接觸不同的語言了且背後的設計是一件很有趣的事情，尤其是函數式語言在思考上跟物件導向語言差異很大的時候更能夠幫助我們反思為什麼要這樣設計，原本自己在物件導向語言的設計是否還有沒考慮到的地方。

## 感想 {#impression}

第一次接觸 Elixir 跟函數式語言應該也是在一兩年前，也是因為課程的[泰安](https://taian.su/)老師在五倍紅寶石上課時介紹給我的。不過當時雖然也會寫 JavaScript 而且常常看到一些對於 Functional Programming 相關的文章，不過實際上對函數式程式設計還是處於一知半解的狀態。

在課程中其實也有提到以 JavaScript 作為範例其實有點不適合，畢竟有一些特性跟功能以一個函數式語言來說還不太足夠。所以在上完這次的課程之後，原本寫起來覺得很卡的 Elixir 在正確理解一些正確的特性之後，就能很順利地使用。

也趁著還有印象的時候趕快用 Elixir 和 Ruby 搭配寫了一款 [MUD](https://github.com/elct9620/elixir-mud) 類型遊戲練習，如果對寫 JavaScript 無法寫得乾淨有困擾或者想多善用一些語言特性，是很推薦試試看這門課程的。

最後補上 MUD 遊戲製作中的畫面：

![MUD 有限狀態機](/images/2020-03-14-rethink-programming-by-functional/mud.gif)

