---
title: 關於 Rails 中的 Form Object / Presenter 這些物件該怎麼用（一）
date: 2019-05-28 23:54:08
tags: [Ruby, 心得, Rails, Presenter, Form Object, Service Object]
thumbnail: https://blog.frost.tw/images/2019-05-28-how-to-use-form-object-and-others-for-rails/thumbnail.png
---

前陣子在 Review 新專案中同事的程式碼時，發現同事對像是 Service Object / Form Object 這類物件不太有概念。不過這個新專案因為是接手其他公司的專案，所以有不少地方要微調。至少那個值得吐槽的「因為 Controller 程式碼太長不知道放哪裡，就都丟去 Service Object 好了！」的神奇用法，完全沒有幫助改善程式碼。

也因為這個機會，我用了一點時間跟專案的同事分享了一下我對這些物件的看法。畢竟當出我也是搞不太懂，不過隨著了解物件導向和 Ruby 的語言特性，從這些角度切入後，就比較能理解該怎麼使用。

<!-- more -->

我想，在能夠應用 Rails 開發網站後，撇除 Controller / Model 之外，要在加入其他的物件類型，就很難去「區分」該如何使用了！所以，我們應該要先來看「物件向語言」之所以要製作成物件的理由。

## 物件導向

剛開始，我們寫程式就是直接把想要做的事情描述出來，類似這樣

```ruby
puts '[INFO] Server started'
```

不過隨著行為重複的使用，每次都要複製同樣的程式碼，我們通常會包裝成一個「方法」

```ruby
def log(level, message)
  puts "[#{level.upcase}] #{message}"
end
```

隨著這些行為變得複雜，我們可能會有一些希望共用的情境跟邏輯，那就會製作成一個「物件」

```ruby
class Logger
  def initialize(output)
    @output = output
  end
  
  def info(message)
    log('info', message)
  end
  
  # ...
  
  def log(level, message)
    @output.write "[#{level.upcase}] #{message}"
  end
end
```

我們依照這個脈絡來看，其實我們都是在做「輸出紀錄」的功能，只是輸出記錄這件事情有越來越多行為，所以我們一步一步的把它封裝起來。

> 其實這也是重構的基本思考方式，我們該如何將散落的「相似程式」整理歸納，變成一個統一的行為跟功能。

有了這樣的概念，我們再去看隨著學習 Rails （或是任何框架）不斷出現的新物件類型，就能夠抓到這樣應用的理由。

## Form Object

一開始我要講的是 Form Object，通常是用來處理不同畫面上不同輸入的需求。依照前面的脈絡，物件導向語言的設計大多遵從 [SOLID](https://zh.wikipedia.org/wiki/SOLID_(%E9%9D%A2%E5%90%91%E5%AF%B9%E8%B1%A1%E8%AE%BE%E8%AE%A1)) 的原則，不過我們先關注 S（單一功能）這件事情就好了。

既然叫做 Form Object 也就表示 Form Object 著重在處理使用者填寫表單的輸入，一開始你可能會覺得直接放到 Model 不就好了嗎？

```ruby
@post = Post.new(post_params)
return redirect_to posts_path if @post.save

render :new
```

大多數時候我們都會這樣寫，不過這建立在的前提就是每次輸入的欄位都相同，假設新增跟編輯可以輸入的欄位有所不同，要怎麼控制？

> 也許你會想到可以用 Validator 的 `on` 選定要在 `#update` 還是 `#create` 處理，這確實是一個方法，但是如果要判定的基準相對複雜，就不一定這麼方便。

所以我們就會用 Form Object 來輔助。

```ruby
class PostUpdateForm
  include ActiveModel::Model
  
  validate :content, presence: true
  
  def save
    @post = Post.find(@id)
    
    attrs = attributes.dup
    attrs.delete(:id)
    @post.update(attrs)
  end
end
```

```ruby
@form = PostUpdateForm.new(create_params)
return render :new unless @form.valid?

@form.save
```

至少像這樣，我們就可以視情況單獨對某個表單做處理，而且 Model 就從要處理資料的角色，變成單純處理從資料庫進行讀寫以及建立資料關聯的角色。

至少在某種意義上，Model 的工作更簡單、更單純。

## Context Object

搭配 Form Object 來講一下在我目前負責的其中一個專案，我們拿來處理「查詢資料」的物件類型。如果是在 PHP 中的 Laravel 的話，類似的物件應該會叫做 Repository。

不過，為什麼會需要 Context Object 呢？在一些比較複雜的系統，我們要處理的查詢條件是非常繁複的，一般的專案可能像是這樣就可以解決。

```ruby
@posts = Post.where(category: 'Ruby')
```

不過如果是一些大的系統，要的查詢條件可能會是跨兩三個資料表同時做 JOIN 查詢，再篩選出結果這樣可能就得變成像這樣有大量的判斷。

```ruby
@posts = Post.all
@posts = @posts.where(category: @categories) if @categories
# ...
```

一方面是看起來不這麼好看，另一方面是可能需要先去從其他資料表篩選出一些資訊才能夠查詢，都塞進去的話 Controller 大概就爆炸了！

所以我們就會像這樣做改寫

```ruby
class PostContext
  def initialize(params)
    @params = params
    @relation = Post
  end
  
  def perform
    scope_by_categories
    # ...
    @relation
  end
  
  def scope_by_categories
    return if @params[:categories].blank?
    
    categories = Category.where(name: @params[:categories])
    @relation = @relation.where(category: caregories)
  end
end
```

如此一來搭配查詢的時候就會像這樣應用

```ruby
@context = PostContext.new(params)
@posts = @context.perform
```

那麼我們就可以將不同的查詢條件處理實作在 Context 裡面，就不需要在 Controller 裡面實作了！（有點類似 Ransack 的感覺）

> 有些人會把這類問題都用 Service Object 解決，其實最近處理專案的經驗看起來，如果分不出來該怎麼做，通常就會被當作 Service Object 去做，但是如果類似的邏輯已經很多了，那麼獨立出來成一類有統一行為的物件會是更好的。

不過即使這樣實作，我們還是會遇到兩類問題：

1. `params` 的參數不是 Context 想要的
2. 查詢條件太過複雜

我們先討論第一點，假設我們只希望使用者查詢一年內的資料，要怎麼限制呢？其實這時候 Form Object 就會再度出場，畢竟他的職責就是處理「使用者的輸入」

```ruby
class PostSearchForm
  # 其實這行應該放在 BaseForm
  include ActiveModel::Model
  
  validate :search_ranges
  
  def search_ranges
    return if (@end_at - @start_at).to_i.abs > 365
    
    errors.add(:end_at, I18n.t('.invalid_search_ranges')
  end
end
```

如此一來，我們就可以像這樣使用

```ruby
@form = PostSearchForm.new(params)
return render :index unless @form.valid?

@context = PostContext.new(@form)
@posts = @context.perform
```

看起來就會精簡很多，不過 Context 似乎出錯了，因為 Form Object 並沒有 `@form[:categories]` 這樣行為可以使用，要怎麼解決呢？

對 Ruby 來說，其實不外乎就是 Duck Typing 的問題，而其他語言來看，其實就是物件有沒有相同的 Interface 而已，我們只需要對 Form Object 做擴充即可。

```ruby
module Form
 module HasHashAccessor
   extend ActiveSupport::Concern
   
   included do
     def [](attribute)
       instance_variable_get("@#{attribute}")
     end
   end
 end
end
```

```ruby
class PostSearchForm
  # ...
  include Form::HasHashAccessor
  # ...
end
```

如此一來，就可以用非常漂亮的方式讓 Form / Context / Model 三種物件串連起來一起運作，並且都只處理一種類型的行為。

> `HasHashAccessor` 的命名方式是我從之前一個日本客戶的專案學來的，他可以很直觀的告訴我們這個物件上擴充了什麼行為，對 Ruby 語言特性來說會是個比 `HashAccessor` 這樣單純的命名更加容易理解。

大家可能會疑惑為什麼要在這個時候用 Module 呢？一方面是剛剛有提到，這是一個通用的 Interface 對 Context 來說，拿到的是 Form Object 或者 Params 其實都沒有關係，只要可以用 `[]` 方法存取他要用來查詢的參數就好了。

但是 `ActionController::Parameters` 物件其實不能滿足我們驗證查詢或者預處理之類的行為，那麼交給 Form Object 來做看起來是更恰當的，那麼要滿足 Context 的使用條件，提供他 `[]` 行為就是合理的，而且這個行為應該只提供給 SearchForm 而非所有的 Form Object。

> 簡單說對 Ruby 來說就是 Duck Typing 只在意有沒有 `[]` 方法，其他語言可能就是有沒有實作 `[]` 行為了！

## 小結

在我目前的專案其實還有像是 Transformer、Calculator 等等各種類型物件的變化，不過如果每一種都討論的話大概是一篇文章無法討論完全的。

下一篇就來討論跟呈現資料有關係的 Presenter 和 Decorator 這兩個物件，還有 Context 還可以怎樣做拆分。

> 要注意的是，不管他是哪類型的物件，其實想要使用都可以使用。只不過這些物件都是在過去經驗總結中，經常會重複使用所以分類出來的物件。照這樣的邏輯來看，只有 Service Object 通常會有 PhotoUploadService 和 PhotoUploader 兩種方式來命名，後者會用這樣的命名邏輯，也許就是當這類物件增加之後，直接分出一類會是更加適合的。
