---
title: Ruby 中該如何 Raise 一個錯誤
date: 2018-01-09 17:28:13
tags: Ruby, 筆記
---

前幾天的晚上朋友在 Facebook 上問了一個問題。

```ruby
raise HTTPError, 'Not Found'
```

和

```ruby
raise HTTPError.new('Not Found')
```

哪個比較快？也因為這樣，我們意外的發現 Ruby 對上面兩段程式碼的定義上其實是不太一樣的。

<!-- more -->

在 Ruby 中 `raise` 一般情況下有以下幾種運作方式。

## 預設情況
```ruby
# Case 1
raise # => #<RuntimeError>

# Case 2
raise 'NotFound' # => #<RuntimeError: "Not Found">
```

## 一般用法

```ruby
# Case 3
raise HTTPError, 'Not Found'

# Case 4
raise HTTPError.new('Not Found')
```

不過，上面這兩段程式碼的差異在哪裡呢？從 Ruby 的原始碼可以看到 `.new` 的行為會多做一次檢查。

```c
static VALUE
make_exception(int argc, const VALUE *argv, int isstr)
{
    VALUE mesg, exc;
    int n;

    mesg = Qnil;
    switch (argc) {
      case 0:
        break;
      case 1:
        exc = argv[0];
        if (NIL_P(exc))
            break;
        // 檢查了是否為字串
        if (isstr) {
            mesg = rb_check_string_type(exc);
            if (!NIL_P(mesg)) {
                mesg = rb_exc_new3(rb_eRuntimeError, mesg);
                break;
            }
        }
        n = 0;
        // 繼續跟 raise HTTPError, 'Not Fonud' 一樣的行為
        goto exception_call;

      case 2:
      case 3:
        exc = argv[0];
        n = 1;
      exception_call:
        mesg = rb_check_funcall(exc, idException, n, argv+1);
        if (mesg == Qundef) {
            rb_raise(rb_eTypeError, "exception class/object expected");
        }
        break;
      default:
        rb_check_arity(argc, 0, 3);
        break;
    }
    if (argc > 0) {
        if (!rb_obj_is_kind_of(mesg, rb_eException))
            rb_raise(rb_eTypeError, "exception object expected");
        if (argc > 2)
            set_backtrace(mesg, argv[2]);
    }

    return mesg;
}

```

從這個角度看，我們會發現差異其實只是「多一次檢查」的程度，甚至不太影響運行的效能。不過從 [Programming Ruby](ruby-doc.com/docs/ProgrammingRuby/html/tut_exceptions.html) 這本書中的範例，卻發現了一個稍微意想不到的使用方法。

```ruby
def readData(socket)
  data = socket.read(512)
  if data.nil?
    raise RetryException.new(true), "transient read error"
  end
  # .. normal processing
end

# ...

begin
  stuff = readData(socket)
  # .. process stuff
rescue RetryException => detail
  retry if detail.okToRetry
  raise
end
```

仔細一看，明明應該是 `@message` 的數值，被放入了非字串的數值，而且這個錯誤還提供了 `#okToRetry` 這樣的方法讓我們可以獲取到這個數值。

回到剛剛 Ruby 中 `make_exception` 的原始碼，在 2 ~ 3 個參數的情況下，回傳的 `mesg` 變數是透過呼叫一個透過 `idException` 指標定義的方法來產生的，而傳入的參數剛好是 `raise` 的第二個參數。

```c
     case 2:
      case 3:
        exc = argv[0];
        n = 1;
      exception_call:
        mesg = rb_check_funcall(exc, idException, n, argv+1); // 呼叫 idException 指標對應的某個方法
        if (mesg == Qundef) {
            rb_raise(rb_eTypeError, "exception class/object expected");
        }
        break;
```

> `idException` 對應的其實是呼叫物件上的 `#exception` 方法，是所有 `Error` 類型物件必須存在的方法。

也就是說，實際上我們可以讓我們的 `Error` 附帶一些額外資訊，在一些情況下處理錯誤的時候可以用來輔助我們。

不過，既然第一個參數已經被我們自訂的錯誤資訊替換了，那麼 Ruby 是怎麼設定錯誤訊息的？

實際上，在 `idException` 對應的 `#exception` 方法上，會複製現有的物件，件並且把錯誤訊息放進去。

在 `#exception` 的原始碼是這樣實作的。

```c
static VALUE
exc_exception(int argc, VALUE *argv, VALUE self)
{
    VALUE exc;

    if (argc == 0) return self;
    if (argc == 1 && self == argv[0]) return self;
    exc = rb_obj_clone(self);
    exc_initialize(argc, argv, exc);

    return exc;
}
```

```c
static VALUE
exc_initialize(int argc, VALUE *argv, VALUE exc)
{
    VALUE arg;

    rb_scan_args(argc, argv, "01", &arg);
    rb_ivar_set(exc, id_mesg, arg);
    rb_ivar_set(exc, id_bt, Qnil);

    return exc;
}
```

也就是說，我們實際上 `raise` 出來的例外，其實是被重新修改過的，不過這也讓我們在使用 Ruby 的錯誤上可以更加的彈性。

這也是為什麼像是 Rubocop 之類的軟體，會建議使用下面這種方式產生錯誤的原因。

```ruby
raise NotFoundError

raise NotFoundError, 'Current page is unavailable'
```

> 關於 `#exception` 的部分感謝五倍的同事在討論的時候提出來，才發現還有後續的處理將 `#message` 設定上去。
