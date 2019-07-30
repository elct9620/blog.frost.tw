---
title: 你大概沒機會遇到的 Bug - 跟 Ruby Committer 聊 Enumerator 跟 Fiber
date: 2019-07-30 14:11:31
tags: [RubyConfTW, Bug, Ruby, Enumerator, Fiber]
thumbnail: https://images/2019-07-30-talk-with-the-ruby-commiter-about-enumerator-and-fiber-the-bug-you-may-never-touch/thumbnail.jpg
---

今年 [RubyConf Taiwan](https://2019.rubyconf.tw/) 嘗試辦了 After Hack 這個活動，也因此有機會可以跟 Ruby 語言的 Commiter 聊一些有趣的問題。

當天我的預定是把活動這幾天寫的 Gem 認真的補完測試，不過沒想到還剩下一個多小時就做完了，那就順便來思考一下 [Tamashii](https://tamashii.io) 專案能怎樣去改進，在今年的演講中大家應該都對 Fiber 有一個認識，而這個也許是一個不錯的選項。

所以就馬上去看了一下講者（Samuel）的 [Async](https://github.com/socketry/async) 這個 Gem 做了些什麼事情，因為剛講完關於 Enumerator 的演講，所以自然地看到了一段引起我興趣的說明。

> Due to limitations within Ruby and the nature of this library, it is not possible to use to_enum on methods which invoke asynchronous behavior. We hope to fix this issue in the future.

既然作者本人就在現場，而且 Issue 的內容也看不太出來發生什麼問題，那麼就直接問吧！

<!-- more -->

## 關於 Fiber

詳細的部分可以參考之前寫過的 [Fiber 簡介](https://blog.frost.tw/posts/2018/06/26/Talk-about-ruby-s-fiber-Part-1/) 以下只做簡單的介紹方便跟上這篇文章的內容，另外因為這幾年很多語言都在努力的更新，雖然 Ruby 是一個相容性非常好的語言，但是還是有不少變化是隱含的。

> 以文章中的 4K 堆疊為例，今年另一位講者（[Delton Ding](https://github.com/dsh0416)）在 [Twitter](https://twitter.com/DeltonDing/status/1155853101586214918) 提醒我這個特性在 2010 年和 2017 年都修改過，在 Ruby 2.5 之後的版本是不會產生，而改用指標的方式來處理。

Fiber 機制用很簡單的方式說明，就是我們可以在單一的 Thread 下面，再做一次切割來切換執行順序。

```ruby
f = Fiber.new do
  # A: 做某些事情
  Fiber.yield # I/O Blocking 先跳出給其他人做事
  # B: 繼續做事情
end

# 執行 Fiber (A 區塊）
f.resume
# 繼續執行（B 區塊）
f.resume
```

以前我們會需要用切分 Thread 的方式來對應 I/O Blocking 的情況，現在我們可以用一些 Non-Blocking 的操作來判斷是否有賭塞現象，進而控制執行的流程。

## Enumerator 中的 Fiber

今年我自己的演講主要是著重在 Enumerator 的生成與運作上，所以討論了 Ruby 能用哪些技巧去做到讓 `yield` 行為暫時不發生，以及讓某些動作能夠被「延遲（`#lazy`）」執行。

當我跟 Samuel 聊到這個 Enumerator 的 Bug 時候，我問了一句「Which ruby version this will happen?」得到的是「All versions」的解答，然後我馬上就知道這是我「沒有讀」的那一個部分，也就是關於 Enumerator 如何去迭代數值的部分。

> 寫這篇文章的時候我再去看了一次 `enumerator.c` 裡面有出現 Fiber 的區段，基本上應該是有使用到 `#next` 的情況會發生，如果是一些 `#zip` 和 `#map` 的情況，因為不一定會去呼叫到 `#next` 就不會產生問題。

那麼，到底是在哪裡產生了 Fiber 呢？

`enumerator.c`（Ruby 2.6.2）裡面只有一個 `fiber_new` 我們照呼叫的順序去來追蹤，首先會看到 `enumerator_next` 這個實作。

```c
static VALUE
enumerator_next(VALUE obj)
{
    VALUE vs = enumerator_next_values(obj);
    return ary2sv(vs, 0);
}
```

這邊會把 `enumerator_next_values` 回傳的數值找出第一個（如果是陣列）或者直接回傳，基本上就是把下一個元素找出來。

```c
static VALUE
enumerator_next_values(VALUE obj)
{
    struct enumerator *e = enumerator_ptr(obj);
    VALUE vs;

    if (e->lookahead != Qundef) {
        vs = e->lookahead;
        e->lookahead = Qundef;
        return vs;
    }

    return get_next_values(obj, e);
}
```

然後這邊會拿當下作用的 Enumerator 來去找接下來會出現的數值，所以我們再繼續往下看到 `get_next_values` 這個方法。

```c
static VALUE
get_next_values(VALUE obj, struct enumerator *e)
{
    VALUE curr, vs;

    if (e->stop_exc)
      rb_exc_raise(e->stop_exc);

    curr = rb_fiber_current();

    if (!e->fib || !rb_fiber_alive_p(e->fib)) {
      next_init(obj, e);
    }

    vs = rb_fiber_resume(e->fib, 1, &curr);
    if (e->stop_exc) {
      e->fib = 0;
      e->dst = Qnil;
      e->lookahead = Qundef;
      e->feedvalue = Qundef;
      rb_exc_raise(e->stop_exc);
    }
    return vs;
}
```

到了這段，我們終於發現了 Fiber 的蹤跡，稍微來看一下發生了哪些事情。

1. 呼叫 `Fiber.current` 取得當下作用中的 Fiber
2. **如果 Enumerator 的 Fiber 不存在或者執行完畢**，就做 `next_init` 這個動作
3. 對 Enumerator 的 Fiber 呼叫 `#resume` 

因為 `#resume` 的回傳值是 `Fiber.yield` 傳入的參數，所以我們只要再找到 Enumerator 的 Fiber 就能了解是怎樣運作的。

```c
static void
next_init(VALUE obj, struct enumerator *e)
{
    VALUE curr = rb_fiber_current();
    e->dst = curr;
    e->fib = rb_fiber_new(next_i, obj);
    e->lookahead = Qundef;
}
```

回到 `next_init` 這段，我們會發現 Ruby 將 `next_i` 的方法當作是 Fiber 執行的區段來呼叫（就是我們 Fiber.new 給的 Block）

繼續往下追會看到 `next_i` 和 `next_ii` 兩個方法

```c
static VALUE
next_ii(RB_BLOCK_CALL_FUNC_ARGLIST(i, obj))
{
    struct enumerator *e = enumerator_ptr(obj);
    VALUE feedvalue = Qnil;
    VALUE args = rb_ary_new4(argc, argv);
    rb_fiber_yield(1, &args);
    if (e->feedvalue != Qundef) {
        feedvalue = e->feedvalue;
        e->feedvalue = Qundef;
    }
    return feedvalue;
}

static VALUE
next_i(VALUE curr, VALUE obj)
{
    struct enumerator *e = enumerator_ptr(obj);
    VALUE nil = Qnil;
    VALUE result;

    result = rb_block_call(obj, id_each, 0, 0, next_ii, obj);
    e->stop_exc = rb_exc_new2(rb_eStopIteration, "iteration reached an end");
    rb_ivar_set(e->stop_exc, id_result, result);
    return rb_fiber_yield(1, &nil);
}
```

首先看 `next_i` 這個方法，他會去呼叫我們定義的 Enumerator 的 `#each` 方法來做迭代，跟我們對 Enumerator 的理解上是一致的，而迭代的行為（給 `#each` 的 Block）就是 `next_ii` 本身。
繼續看到 `next_ii` 這個方法，可以理解為他就是單純的呼叫 `Fiber.yield` 而已，所以我們可以把這段轉換成下面的 Ruby 來理解。

```ruby
(1..10).each do |item|
  Fiber.yield item
end
```

也就是說，每次我們用 `#next` 的時候，Ruby 會產生一個 Fiber 然後每執行一次迭代就用 `Fiber.yield` 跳出來，直到都沒有任何元素可以被迭代後，再產生 `StopIteration` 的 Exception 同時做最後一次的 `Fiber.yield`

我們可以用 Ruby簡單模擬這個行為

```ruby
# frozen_string_literal: true

require 'fiber'

# :nodoc:
class FiberNext
  def initialize(items)
    @items = items
    @fiber = create_fiber
  end

  def next
    return unless @fiber.alive?

    @fiber.resume
  end

  private

  def create_fiber
    Fiber.new do
      @items.each do |item|
        Fiber.yield item
      end
      Fiber.yield
    end
  end
end

enum = FiberNext.new(%i[apple water flashlight])

3.times do
  puts "Next: #{enum.next}"
end
```

讀到這裡，不得不感嘆一下 Ruby Commiter 們用如此漂亮的方式設計了一個機能，我們都知道 Enumerator 對應的 `#each` 裡面只要給了 `yield` 基本上就是一個無法停止的狀態，他會不斷呼叫我們給的 Block 直到沒有 `yield` 再被呼叫，所以在 Ruby 裡面這算是一種「迭代」

但是想要控制迭代的進度，用步進的方式進行呢？如果採用一般的方式可能要做很多動作才能達成，此時 Fiber 這種可以暫時某個位置執行其他任務，再跳回去的機制就變得非常實用。以應用案例來說，我想這大概也是非常漂亮的一個學習參考，以我過去對 Fiber 的理解是沒辦法想到這樣的使用方式的。

## 被少考慮的情境

前情提要終於結束了，回到我們的主題，那個你不會遇到的 Bug 到底是什麼？

在 Samuel 對 Ruby 的 [PR](https://github.com/ruby/ruby/pull/2002#issuecomment-515749562) 中你可以看到一段使用 `#to_enum` 和 `Fiber` 的程式碼，這段是當天再向我解釋時給的一個範例。

我稍微整理一下，讓大家比較好看到問題

```ruby
def items(&block)
  yield :apple
  Fiber.yield # 我想在這跳出我的 Fiber
  yield :water
  yield :flashlight
end

enum = to_enum(:items)

f = Fiber.new do
  3.times do
    puts "Next: #{enum.next}"
  end
end

f.resume
```

執行的結果卻是這樣的

```bash
[elct9620] Desktop % ruby fiber.rb
Next: apple
Next:
Next: water
```

照正常的迭代器運作，不應該是把 `:apple`, `:water` 和 `:flashlight` 印出來，為什麼多了一個 `nil` 的數值呢？

如果我們把 `Fiber.yield` 改成 `Fiber.yield :oops` 執行看看

```ruby
[elct9620] Desktop % ruby fiber.rb
Next: apple
Next: oops
Next: water
```

問題就出在 `Fiber.yield` 竟然變得跟 `yield` 一樣，這是怎麼一回事？

回想一下前面介紹 Enumerator 在做 `#next` 的時候，是不是會產生一個新的 Fiber 然後用那個 Fiber 去做事情？

我們把前面那段產生 `#next` 的 Fiber 區段找出來，然後代入 `#items` 方法，會變成怎樣呢？

```ruby
# ...
    Fiber.new do
      # @items.each do |item|
        items do |item|
          # 第一次 => item = (yield :apple)
          # 第一次 => Fiber.yield :oops
          # 第二次 => item = (yield :water)
          # 第三次 => item = (yield :flashlight)
          Fiber.yield item
        end
      end
      Fiber.yield
    end
# ...
```

大家有沒有發現，我們在第一次到第二次迭代的時候，被偷做了一次 `Fiber.yield` 然後他就跑回去變成 `#resume` 的回傳值，然後 `#next` 行為的次數就大亂了，歸咎原因在於他在執行的時候被 Ruby 判斷為「屬於 Enumerator 的 Fiber」

所以如果我們修改成像下面這樣執行，反而就不會出問題

```ruby
def items(&block)
  yield :apple
  Fiber.yield # 我想在這跳出我的 Fiber
  yield :water
  yield :flashlight
end

enum = to_enum(:items)

f = Fiber.new do
  items do |item|
    puts "Next: #{item}"
  end
end

f.resume
f.resume # 因為被正確 `Fiber.yield` 所以要再做一次讓他能繼續
```

因為沒有使用 `#next` 所以不會產生一個 Fiber 也就不會有被判斷錯誤的問題。

## 解決方案與 Fiber 的切換機制

目前我們看到的 PR 算是一個暫時性的解法，Samuel 告訴我這跟目前 Fiber 的設計有關係，所以只能先處理掉這個問題（大概會是 2.7 or 2.8 之類的會好）目前 PR 上已經是另一個版本，也就是最後展示給我會動的版本。中間也還有使用像是 `Fiber.transfer` 之類的方式做切換，就能指定應該要跳回哪一個 Fiber 上。

不過 Samuel 告訴我的想法我還不太清楚他想表達的是哪一個，不過只能說目前大致上有一個解決方法可以用。

1. Enumerator 的 Fiber 要能跟普通的 Fiber 區分開來
2. Fiber 要加入一些類似 Call Stack 的機制，用來判斷要跳回去的 Fiber（以解釋來說比較像是多存一個指標）

最後，我們來談談目前（Ruby 2.6.2）的 Fiber 切換機制是怎樣的。

目前已知 `Fiber.yield` `Fiber.transfer` 和 `#resume` 三個方法可以做切換，那麼來看一下這三個的實作

```c
VALUE
rb_fiber_resume(VALUE fibval, int argc, const VALUE *argv)
{
    rb_fiber_t *fib = fiber_ptr(fibval);

    if (fib->prev != 0 || fiber_is_root_p(fib)) {
      rb_raise(rb_eFiberError, "double resume");
    }
    if (fib->transferred != 0) {
      rb_raise(rb_eFiberError, "cannot resume transferred Fiber");
    }

    return fiber_switch(fib, argc, argv, 1);
}

VALUE
rb_fiber_yield(int argc, const VALUE *argv)
{
    return fiber_switch(return_fiber(), argc, argv, 0);
}

VALUE
rb_fiber_transfer(VALUE fibval, int argc, const VALUE *argv)
{
    return fiber_switch(fiber_ptr(fibval), argc, argv, 0);
}
```

仔細一看，除了 `#resume` 有做一些檢查去避免重複執行之外，基本上都是做同樣的事情。（也就是文章前面提到的在新版的 Fiber 已經採用指標切換）

而 `Fiber.yield` 和 `Fiber.transfer` 的差異幾乎是只剩下「是否能指定 Fiber」這點，這也是 Samuel 有提到可能可以用 `Fiber.transfer` 去解決 Enumerator 裡面的 Fiber 問題的原因，因為我們可以利用這樣的方式「手動指定」而不是交由 Ruby 自己判斷，那麼就能讓我們指定正確的 Fiber 去繼續執行。

至於為什麼會選到錯誤的 Fiber 執行，我們看一下 `fiber_siwtch` 和 `return_fiber` 大概就可以猜到原因。

```c
static inline VALUE
fiber_switch(rb_fiber_t *fib, int argc, const VALUE *argv, int is_resume)
{
    VALUE value;
    rb_context_t *cont = &fib->cont;
    rb_thread_t *th = GET_THREAD();

    // 略

    if (is_resume) {
      fib->prev = fiber_current();
    }

    // 略

    return value;
}

static inline rb_fiber_t*
return_fiber(void)
{
    rb_fiber_t *fib = fiber_current();
    rb_fiber_t *prev = fib->prev;

    if (!prev) {
      rb_thread_t *th = GET_THREAD();
      rb_fiber_t *root_fiber = th->root_fiber;

      VM_ASSERT(root_fiber != NULL);

      if (root_fiber == fib) {
        rb_raise(rb_eFiberError, "can't yield from root fiber");
    	}
      return root_fiber;
    }
    else {
      fib->prev = NULL;
      return prev;
    }
}
```

簡單說當我們呼叫 `#resume` 的時候，會把當下的 Fiber 標記成前一個 Fiber，而做 `Fiber.yield` 的時候就會因為有紀錄，就把這個 Fiber 當作前一個目標做切換。

過程大概像是這樣：

1. Fiber.new （我們的）
2. #resume （我們的）
3. #next （產生 Enumerator 的 Fiber）
4. Fiber.yield => 找到的是 Enumerator 的 Fiber

所以在這中間，我們的 Fiber 已經不被我們自定義的迭代方法中的 `Fiber.yield` 認識。

## 總結

在 After Hack 回到家之後，才發現原來是被 Commiter 直接一對一教學了一個多小時，算是很不錯的經驗。大概也是因為克服了這類心理上的障礙，所以即使聽得蠻吃力的但還是能夠繼續嘗試，我想之後的活動大概不會有不敢用英文對話的困擾了吧！

最大的收穫大概是有 Commiter 帶你看了一部分的原始碼，還有去理解這些國外的高手是怎樣思考問題的。至少以台灣人來說算是不錯的經驗，以比例來看台灣人不多的狀況下能遇到的高手是固定的但是如果有像是研討會這類活動，我們就有機會接觸到篩選出來的高手，把握機會跟這些人交流就能很快地學到新東西跟進步，畢竟算是短時間的讓台灣的高手比例上升吧 XD

雖然會覺得能早點突破心理障礙就能更快接觸到，不過有時候很多知識還沒準備齊全（像是嘗試過 Fiber 和了解基本原理等等）也蠻難能問對問題，可以的話真的蠻需要平常多準備一些問題或者寫下來，才不會遇到機會都沒辦法問。

> 不過我自己也沒有這個習慣，但是看起來還是要準備一點會比較好呢 XD