---
title: 利用 Ruby 的 Lambda 做條件判斷
publishDate: 2019-05-20 21:59:53
tags: [Ruby, 心得, Lambda]
thumbnail: https://blog.frost.tw/images/2019-05-20-use-ruby-s-lambda-as-case-when-condition/thumbnail.png
---

週末在思考一些 Ruby 特性可以應用的小技巧時，想到龍哥大概跟我講了三次以上的一個特性。

```ruby
fn = ->(other) { other == 1 }
fn == 1
# => false
fn === 1
# => true
```

剛好最近工作的專案上有個問題，似乎挺適合用這個技巧。

<!--more-->

## Proc 物件的 === 方法

我們在 Proc 的原始碼可以看到，`Proc` 類別被特別定義了 `#===` 方法，但不包括了 `#==` 方法，而這個 `#===` 方法又剛好指定成呼叫方法。

```c
rb_add_method(rb_cProc, rb_intern("==="), VM_METHOD_TYPE_OPTIMIZED,
		  (void *)OPTIMIZED_METHOD_TYPE_CALL, METHOD_VISI_PUBLIC);
```

同樣還有像是 `#[]` 也有類似的性質，簡單說就是 `#call` 方法的別名。這個使用方式也可以在 [Ruby Doc](https://ruby-doc.org/core-2.6.2/Proc.html#method-i-3D-3D-3D) 上找到。
因為這樣的特性，剛好有些情境就是不錯的應用情況。

## Excel 的產生難題

最近花了不少時間在幫客戶處理 Excel 報表的生成功能，中間就發現了一個問題，因為客戶的報表有很多種（十幾種）而且需要的欄位又不太一樣，每種都寫一次程式的話其實是很沒有效率的（而且未來還希望能自訂報表的呈現）所以用設定檔方式設計是最適合的，不過產生的 Excel 檔案卻無法指定格式（Ex. 文字、日期）尤其是「日期」客戶每張報表的要求又不太一樣，這讓生成就變成一個難題。

```yaml
- name: KPI Report
  columns:
    - name: user_id
      display: User ID
      format: :integer
    - name: signup_at
      display: Signup At
      format: :datetime
      datetime: :customize
      excel_format: '[$-409]yyyy-MM-dd;@'
    - name: last_active_at
      display: Last Active At
      format: :datetime
      datetime: :split
```

以上面這個 YAML 設定檔為例子，客戶可能會希望顯示 `yyyy-MM-dd` 或者 `yyyy-MM-dd` + `HH:mm` 之類的格式，所以在判斷 Excel 要提供怎樣的欄位的時候，就變得相對的複雜。

```ruby
def formats
  @columns.map do |column|
    next unless column[:format] == :datetime
    
    case column[:datetime]
    when :split then [@date_format, @time_format]
    when :customize then format(column[:excel_format])
    else
      @date_format
    end
  end.flatten
end
```

雖然上面的情況看起來還算單純，不過最後再加入其他不同類型的欄位判斷後，可能就會越來越複雜跟難以辨識。

在這個狀況下，利用 `Proc` 的 `#===` 特性就可能會是一個不錯的作法。

```ruby
is_datetime = ->(c) { c[:format] == :datetime }
is_split_datetime = ->(c) { c[:format] == :datetime && c[:datetime] == :split }
# ...

case column
when is_split_datetime then [@date_format, @time_format]
when is_datetime then @date_format
# ...
end
```

不過這實際上並無法解決有很多複雜情況的時候，不過既然我們已經知道了 `#===` 在 `case ... when` 上可以發揮作用，那麼是否可以進一步封裝呢？

## 自訂物件

假設我們有個可以把設定檔轉成 `ExcelColumn` 物件的設計，也許可以像這樣實作。

先定義 `ExcelColumn` 物件，而且可以被做 `Pattern Matching`（簡易版）然後在提供回傳對應的格式跟數值的機制。

```ruby
class ExcelColumn
  def initialize(format = nil, **pattern, &block)
    @name = name
    @format = format
    @pattern = pattern
    @value_of = block
  end
  
  def ===(other)
    @pattern.reduce(true) do |prev, (key, value)|
      prev & (other[key] == value)
    end
  end
  
  def format
    return @format if @format.nil? || @format.is_a?(Symbol)
    
    format(@format) # Customize Format
  end
  
  def value(name, row)
    return row.send(name) if @value_of.nil?
    
    @value_of.call(name, row)
  end
end
```

然後再設計 DSL 讓我們可以定義需要的格式。

```ruby
class ExcelGenerator
  class << self
    attr_reader :patterns
    
    def pattern(format, **pattern, &block)
      @patterns ||= []
      @patterns << ExcelColumn.new(name, format, pattern, &block)
    end
  end
  
  def columns
    @columns ||=
      @config.columns.map do |column|
        [
         column,
         self.patterns.find { |pattern| pattern === column } || ExcelColumn.new
        ]
      end
  end
end
```

接下來就可以在實際使用時，像這樣去拓展 Excel 產生器，然後定義我們所需要的報表格式生成。

```ruby
class ExcelReportGnerator < ExcelGenerator
  pattern format(:date), datetime: :date do |name, row|
    row.send(name)&.to_datetime
  end
  
  # ...
end
```

如此一來就能夠利用 DSL 跟 `#===` 的特性，針對我們需要有特殊格式的欄位挑選出來，然後給予特定的規則來產生對應的 Excel Cell 設定。

```ruby
insert_header(headers)

formats = columns.map(&:last).map(&:format)
rows.each do |row|
  items = columns.map { |column, pattern| pattern.value_of(column[:name], row) }
  insert_row(items, formats: formats)
end
```

## 總結

最後實作的版本其實還是一個構想，畢竟這樣的情境是不常使用到的，不過在某些時候似乎又是個非常有用的小技巧。而這樣的構想是否適合這樣使用，以及能不能有更好的改進（例如一開始就直接定義好對應的欄位類型物件，而不要像這樣動態的定義）都還要再討論。

不過在 Ruby 中確實有不少有趣的應用技巧，多多挖掘的話其實能在不少不同的應用情況下用足夠簡單的方式實現，而不是繞一大圈去做。

更重要的是，這些技巧往往會是在時間緊迫下的輔助，有些功能透過這些技巧就可以很快地實現，而將時間投資在其他地方，而不是只能用一些折衷的方案暫時做好，之後再回來慢慢修改。

> 這是最近做專案的心得，因為客戶是新成立的部門很需要有一個實績，所以開發上難免偏向以開發進度為主。很多其實花時間思考後能做更好的部分，就這樣變成技術債了⋯⋯
