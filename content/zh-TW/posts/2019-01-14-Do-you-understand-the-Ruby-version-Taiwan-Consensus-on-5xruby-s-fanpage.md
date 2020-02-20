---
title: 你看懂五倍紅寶石粉專上的 Ruby 版台灣共識了嗎？
date: 2019-01-14 22:00:39
tags: [Ruby, 筆記, 台灣共識]
thumbnail: https://blog.frost.tw/images/2019-01-14-do-you-understand-the-ruby-version-taiwan-consensus-on-5xruby-s-fanpage/thumbnail.jpg
---

最近「台灣共識」很熱門，公司的粉專也分享了 Ruby 版的台灣共識。

我們在公司內部的群組大家其實討論了蠻久，如果只是單純的去實作跟其他語言一樣的內容，不就沒有意義了嗎？

我們之所以會選擇用 Ruby 來當作工作上的工具，就表示他有一些特別的地方吸引我們。

所以，上面用了哪些 Ruby 技巧讓我們一起來分析看看！

<!--more-->

先來看一下原始的版本，這是一個可以實際執行的 Ruby 語法。

```ruby
def Consensus92(countries:, system:)
  Module.new do
    define_method 'definition' do
      { countries: countries, system: system }
    end
    
    define_method 'build_consensus_with?' do |other|
      return true if definition == other.definition
      raise "This is not #{other} consensus"
    end
  end
end

class Taiwan
  extend Consensus92(countries: 2, system: 2)
end

class China
  extend Consensus92(countries: 1, system: 2)
end

China.build_consensus_with?(Taiwan)
```

## include 與 extend

大多數時候我們都是對 `include` 比較熟悉，因為它可以把一些方法切割到一個 Module 裡面，然後在物件中呼叫。

我們先來看一下這段程式碼：

```ruby
module Extension
  def echo
    puts 'ECHO'
  end
end

class A
  include Extension
end

class B
  extend Extension
end

p A.ancestors
# => [A, Extension, Object, Kernel, BasicObject]
A.new.echo
p B.ancestors
# => [B, Object, Kernel, BasicObject]
B.echo
```

我們會發現在 `B` 上面的繼承上，是沒有 `Extension` 模組的，所以兩者的差異在哪邊呢？

> 因為我們希望是 `China.build_consensus_with?(Taiwan)` 而不是 `China.new.build_consensus_with?(Taiwan.new)` 的寫法，才選擇用 `extend`

### 線索一

調查了 Ruby 的文件會發現 `include` 屬於 `Module` 物件的行為，而 `extend` 則是屬於 `Object` 物件的行為。

簡單說就表示 `include` 只能作用在 `Class` 上，物件的實例是不行的，像是下面這樣：

```ruby
A.new.include Extension
```

但是 `extend` 是屬於 `Object` 的行為，所以原本我們預期是這樣

```ruby
B.new.extend Extension
```

但是同時 Ruby 的所有東西都是物件的一種，所以同理可以證明 `Module` 也是一種物件（而 `Class` 物件繼承於 `Module`）所以下面的用法也會成立：

```ruby
B.extend Extension
```

### 線索二

根據 Ruby 文件提供的 `extend` 實作，大概是長這樣的，意外的很簡單。

```c
static VALUE
rb_obj_extend(int argc, VALUE *argv, VALUE obj)
{
    int i;
    ID id_extend_object, id_extended;

    CONST_ID(id_extend_object, "extend_object");
    CONST_ID(id_extended, "extended");

    rb_check_arity(argc, 1, UNLIMITED_ARGUMENTS);
    for (i = 0; i < argc; i++)
        Check_Type(argv[i], T_MODULE);
    while (argc--) {
        rb_funcall(argv[argc], id_extend_object, 1, obj);
        rb_funcall(argv[argc], id_extended, 1, obj);
    }
    return obj;
}
```

裡面其實就只是把 `extend` 傳入的 Module 都帶入，並且呼叫 `extended` 和 `extend_object` 兩個方法。

經過簡單的測試，像下面這樣的修改就能阻止 `extend` 複製方法。

```ruby
module Extension
  def self.extend_object(obj)
    # Do Nothing
  end

  def echo
    puts 'ECHO'
  end
end

class B
  extend Extension
end

B.echo
# => undefine method
```

也就是說，在 `extend` 的行為下，我們會透過 `extend_object` 方法做某些處理後，才得以「複製」方法，而不是像 `include` 一樣把整個 Module 放入物件的繼承體系之中。

> 因為文章篇幅限制，我們先不去追 `extend_object` 的源頭。

## Consensus92 的用法

首先，大家可能會有點疑惑為什麼可以用 `extend Consensus92()` 這樣的寫法，我們先釐清一下「方法」和「常數」的差異。

```ruby
def Consensus92; end
p Consensus92()
p Consensus92 # => uninitialized constant Consensus92
```

從上面這段程式碼我們可以發現，實際上「方法」和「常數」的命名空間是不同的，也就是說他們兩者並不衝突可以並存。而 Ruby 在這個情況下是透過有沒有 `()` 來判斷到底是個方法，還是一個常數。

> 這邊省略 Ruby 的 Keyword Arguments 解釋，這部分雖然不常見但還是屬於日常使用的一部分。

那麼，為什麼 `Consensus92()` 的回傳結果可以被 `extend` 呢？

這個問題大家可能很快就猜到了，因為我們使用了「匿名模組」的技巧，雖然不確定是否真的有這個詞，不過大多數我們都用「匿名 XX」來稱呼一些沒有取名的定義，所以這邊也就這樣使用吧！

```ruby
def Consensus92
  Module.new; end
end

class Taiwan
  extend Consensus92
end
```

因為不論 `include` 還是 `extend` 都只會確認對象是不是一個 Module 所以在這邊我們「即時」產生一個新的 Module 是符合 Ruby 在運作上的判定，也因此會被視為合法的行為。

所以實際上我們在 `Taiwan` 和 `China` 擴充的模組是不一樣的，這樣在程式的意義上，剛好也跟「九二共識沒有共識」的意思重疊在一起，畢竟從一開始「拓展（extend）」的共識就是不同的。

> 如果有在使用 Rails 的話，可能會注意到像是 `Association_User_CollectionProxy` 之類的類別名稱，其實就是運用這種技巧去動態產生的 Class 喔！

## define_method 的理由

實際上，我們使用 `Module.new do; end` 和 `module Extension; end` 的效果是相同的，從下面的程式碼可以得到驗證：

```ruby
A = Module.new
  def echo
    puts 'ECHO'
  end
end

class B
  extend A
end

B.echo
```

既然這樣也會運作，那麼我們為什麼還需要用 `define_method` 呢？

這是因為我們希望達到類似 Closure 的技巧，看看下面這段程式就會注意到一個有趣的問題：

```ruby
def Consensus92(countries:)
  Module.new
    def definition
      { countries: countries }
    end
  end
end

class Taiwan
  extend Consensus(countries: 2)
end

Taiwan.definition
# => undefine variable countries
```

為什麼會這樣，因為對 `def` 來說 `countries` 已經是屬於在執行階段的一部分，所以我們在呼叫 `definition` 的時候才會嘗試去尋找 `countries` 這個東西，但是他已經無法被找到。

但是 `define_method` 就不太一樣了！

```ruby
def Consensus92(countries:)
  Module.new do
    define_method 'definition' do
      { countries: countries }
    end
  end
end

class Taiwan
  extend Consensus92(countries: 2)
end
```

實際上 `define_method` 在被呼叫的當下，會被轉成像這樣的樣子

```ruby
def definition
  { countries: 2 }
end
```

這是因為對於 `define_method` 所傳入的 Block 是用來定義方法的內容，但是因為我們是在呼叫一個方法，所以 `countries` 變數就被視為是處於 `Consensus92` 方法的環境下，而不是呼叫的當下。

> 稍微有點難懂，不過是不是很像 Closure 的感覺呢？

## 總結

這段程式碼其實算是有不少巧思在裡面，把程式碼換成中文讀起來意思也是很容易懂的。

```ruby
def 九二共識(國家:, 制度:)
  Module.new do
    define_method '定義' do
      { 國家: 國家, 制度: 制度 }
    end
    
    define_method '建立共識？' do |定義|
      return 是 如果 定義 == 對方.定義
      raise "這不是#{對方}共識"
    end
  end
end

class 台灣
  擴充 九二共識(國家: 2, 制度: 2)
end

class 中國
  擴充 九二共識(國家: 1, 制度: 2)
end

中國.建立共識?（台灣）
# => 錯誤「這不是台灣共識」
```

這也是 Ruby 在 DSL 表現優異上的原因之一，我們可以透過許多動態定義或者語法上的特殊技巧，製作出非常接近我們習慣的語言跟用法。

這篇文章提到關於 Ruby 類別上的應用，可以參考之前寫過的[自由的 Ruby 類別](https://blog.frost.tw/posts/2017/10/22/The-ruby-s-class-is-free-Part-1/)來了解背後的機制。
