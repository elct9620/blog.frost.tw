---
title: Ruby 中 Constant 和 Class 的關係
date: 2019-06-18 19:13:17
tags: ['Ruby', '筆記', 'C']
thumbnail: https://blog.frost.tw/images/2019-06-18-the-relationship-between-constant-and-class-in-ruby/thumbnail.png
---

下班前[龍哥](https://kaochenlong.com/)說在 Mailing List 看到了一段 Code 很有趣。

```ruby
a = Class.new

p a        #=> #<Class:0x0000558d34f68b48>
p a.name   #=> nil

B = a
p a.name   #=> 'B'

C = a
p C.name   #=> 'B'
```

裡面 `C = a` 到底發生了什麼事情，是很值得討論的，因為有了線索是 `rb_const_set` 可以找到原因，所以就利用下班時間來讀看看這段。

> 關於前面的用法可以參考之前寫過的[自由的 Ruby 類別](https://blog.frost.tw/posts/2017/10/22/The-ruby-s-class-is-free-Part-1/)來了解原因。

<!-- more -->

我大致上翻了一下 Ruby 的原始碼，這段程式主要是定義在 `variable.c` 這個檔案，在 Ruby 裡面我們可以簡單把 Constant（常數）理解為一種特殊的變數，跟一些語言在使用了 `const` 關鍵字後無法更改的概念上是不太一樣。

## 常數如何被賦值

因為 `rb_const_set` 接受了一些參數我們不好理解，所以先看看是由誰來呼叫他。

```c
void
rb_define_const(VALUE klass, const char *name, VALUE val)
{
    ID id = rb_intern(name);

    if (!rb_is_const_id(id)) {
	      rb_warn("rb_define_const: invalid name `%s' for constant", name);
    }
    rb_const_set(klass, id, val);
}

void
rb_define_global_const(const char *name, VALUE val)
{
    rb_define_const(rb_cObject, name, val);
}
```

在 Ruby 裡面我們要定義一個常數 `A = x` 是透過 `rb_define_const` 來實現的，如果是 Global 的話，就會直接定義在 `Object` 下面，而我們提供給 `rb_const_set` 的三個參數裡面 `ID` 這個數值可以先來看一下 `rb_intern` 的用法。

現在我們在 Ruby 裡面會經常使用 `:name` 這樣的寫法，表示他是一種 Symbol 而在 Ruby 裡面的實作，都會透過 `rb_intern` 這個方法來從 `char*` 轉換過去，基本上我們可以理解 Ruby 所有物件、常數的命名，都會被統一記錄起來，方便之後重複使用。

不過這邊有趣的地方其實是他會檢查這個 `ID` 類型，往下追之後會看到像這樣的檢查

```c
#define is_const_id(id) (id_type(id)==ID_CONST)
```

> 不過關於這段稍微追了下發現又是一個有點長的過程，這邊簡單解釋就是在定義 Symbol 的時候 Ruby 會依照這個 Symbol 的特性去區分出他的類型，像是 `$` 開頭會標記成 Golbal Variable 這樣的感覺

## 常數賦值的過程

接下來我們就可以往 `rb_const_set` 深入來看，因為整體是相對長的，我們就針對需要的部份重點式的閱讀。

```c
    rb_const_entry_t *ce;
    struct rb_id_table *tbl = RCLASS_CONST_TBL(klass);

    if (NIL_P(klass)) {
	    rb_raise(rb_eTypeError, "no class/module to define constant %"PRIsVALUE"", QUOTE_ID(id));
    }

    check_before_mod_set(klass, id, val, "constant");
    if (!tbl) {
      // PART1
    }
    else {
      // PART2
    }
```

第一階段 Ruby 會先去看看這個 Class 裡面是不是已經初始化過紀錄下面所屬的常數的一個表格，如果沒有的話就初始化一個出來。已經存在的話則是做 Autoload 動作，如果有讀取到對應的常數，那就會跳出錯誤警告，沒有的話就跟前面產生表的行為一樣，把這個常數插入進去。

看起來常數的賦值應該就這樣結束了，不過為了處理一些特殊情況，所以往下會看到一段註解。

```c
    /*
     * Resolve and cache class name immediately to resolve ambiguity
     * and avoid order-dependency on const_tbl
     */
```

這就是我們這次要討論的問題來源，要觸發這個處理依照原始碼的實作要滿足某些條件才行。

```c
if (rb_cObject && (RB_TYPE_P(val, T_MODULE) || RB_TYPE_P(val, T_CLASS))) {
```

1. `Object` 是有被定義的（正常情況下都應該是被定義的）
2. 賦予的數值必須是 Module 或者 Class

接下來要再滿足另一個條件，就是通過 `rb_class_path_cached` 的檢查

```c
if (NIL_P(rb_class_path_cached(val))) {
```

因為裡面的實作也有點多，所以這邊直接去找了一下[文件](https://docs.ruby-lang.org/ja/latest/function/rb_class_path.html)關於 `rb_class_path` 的用途，然後再去看 `rb_class_path_cached` 的這段實作。

```c
VALUE
rb_class_path_cached(VALUE klass)
{
    st_table *ivtbl;
    st_data_t n;

    if (!RCLASS_EXT(klass)) return Qnil;
    if (!(ivtbl = RCLASS_IV_TBL(klass))) return Qnil;
    if (st_lookup(ivtbl, (st_data_t)classpath, &n)) return (VALUE)n;
    if (st_lookup(ivtbl, (st_data_t)tmp_classpath, &n)) return (VALUE)n;
    return Qnil;
}
```

大致上我們可以理解成每個有名字的 Class 或 Module 都會被記錄起來，所以這邊要找的條件是「匿名的 Class 或是 Module」都符合條件後，就會做下面的動作。

```c
  if (klass == rb_cObject) {
	  rb_ivar_set(val, classpath, rb_id2str(id));
	  rb_name_class(val, id);
  }
  else {
		VALUE path;
		ID pathid;
		st_data_t n;
		st_table *ivtbl = RCLASS_IV_TBL(klass);
		if (ivtbl &&
		    (st_lookup(ivtbl, (st_data_t)(pathid = classpath), &n) ||
		     st_lookup(ivtbl, (st_data_t)(pathid = tmp_classpath), &n))) {
		    path = rb_str_dup((VALUE)n);
		    rb_str_append(rb_str_cat2(path, "::"), rb_id2str(id));
		    OBJ_FREEZE(path);
		    rb_ivar_set(val, pathid, path);
		    rb_name_class(val, id);
		}
  }
```

假設這個常數是定義在 `Object`（全域）的情況，那麼就直接對他做兩件事情：

1. 設定 `classpath` （就是前面的暫存檢查）
2. 對這個匿名的 Class 或 Module 設定名字為當下的常數

如果是定義在某個 Class 或 Module 下面的話，因為 `classpath` 就不會是剛好的，所以要先算過（產生） `classpath` 然後再做一樣的事情。

## 總結

找完之後我們就可以解釋為什麼文章一開始的 `C = a` 再去問 `C.name` 會得到 `B` 這個結果了，主要是因為已經被命名過的 Class 會在記憶體中製作一個類似捷徑的東西，讓下次去呼叫這個 Class 或 Module 可以更快。

而給這個 Class 或 Module 物件命名的時機點，就在於它被記錄到捷徑的時機，所以即使再次賦予給其他常數，也不會改變他的名字。

> 這樣我們可以延伸出來的問題是 `C = a` 的情況下，因為 `classpath` 是 Cache 在 `B` 上面，這時候使用 `C` 是不是會比 `B` 更慢呢？而匿名的 Class 和 Module 會不會對效能有所影響。