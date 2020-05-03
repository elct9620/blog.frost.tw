---
title: "做一個 Rails Form Helper 相容的 Form Object"
publishDate: 2020-05-03T16:29:36+08:00
date: 2020-05-03T16:29:36+08:00
tags: ["Rails", "Ruby", "Ruby on Rails", "心得"]
toc: true
thumbnail: https://blog.frost.tw/images/post/image/2020-05-03-build-a-form-helper-capable-form-object-in-rails/thumbnail.jpg
credit:
---

當我們的 Rails 專案邊複雜的時候，Form Object 算是一個常見的方法。不過網路上的教學似乎大多都沒有能夠相容 Rails 的 Form Helper 的版本。

所以我就開始思考，有沒有辦法法在比較少的修改下去支援 Form Helper 呢？

<!--more-->

## 常見的 Form Object 實作 {#common-form-object-implementation}

為了要改善我們的 Form Object，我們至少要先知道目前在使用的原始版本。

```ruby
class RegistrationForm
  include ActiveModel::Model
  include ActiveModel::Validations

  attr_accessor :email, :password, :password_confirmation

  def initialize(user, params = {})
    @user = user
    super params
  end

  # ...

  def attributes
    {
      email: @email,
      password: @password
    }
  end

  def save
    return unless valid?

    @user.assign_attributes(attributes)
    @user.save
  end
end
```

這是一個網路上很常見的 Form Object，基本上它提供了類似 Model 行為讓我們可以不用在 Controller 上有太多的修改。

不過在 View 裡面的時候，我們的 Form Helper 就會變成一直需要設定 Method 和 URL 了。

```ruby
<%= form_for @form, method: :post, url: users_path do |f| %>
<% # ... %>
<% end %>
```

## 關於 Form Helper {#the-form-helper}

為了改善 Form Object 我開始去看 Form Helper 的原始碼。

在 [action_view/helpers/form_helper.rb#L440](https://github.com/rails/rails/blob/bdc581616b760d1e2be3795c6f0f3ab4b1e125a5/actionview/lib/action_view/helpers/form_helper.rb#L440) 裡面，ActionView 會嘗試在我們傳入物件的時候用 `apply_form_for_options!` 來處理。

```ruby
apply_form_for_options!(record, object, options)
```

而在 [`apply_form_for_options!`](https://github.com/rails/rails/blob/bdc581616b760d1e2be3795c6f0f3ab4b1e125a5/actionview/lib/action_view/helpers/form_helper.rb#L457-L474) 方法中，我們可以發現他會設定 `method` 和 `url`。

```ruby
action, method = object.respond_to?(:persisted?) && object.persisted? ? [:edit, :patch] : [:new, :post]
# ...
options[:url] ||= if options.key?(:format)
  polymorphic_path(record, format: options.delete(:format))
else
  polymorphic_path(record, {})
end
```

這表示如果我們的 Form Object 可以提供相同的介面給 Form Helper 的話，基本上我們就不用做什麼事情就能正確的設定 Method 和 URL 參數。

## persisted? 方法 {#the-persisted}

當 Form Helper 決定用 `POST` 去產生新物件，或者用 `PUT` 去更新一個現有物件時，他取決於 Model 的 `persisted?` 方法。

這表示當我們加入 `persisted?` 方法到我們的 Form Object 之後，就能夠被偵測到。

```ruby
class BaseForm
  # ...

  def initialize(record, params = {})
    @record = record
    super params
  end

  def persisted?
    @record && @record.persisted?
  end
end
```

不過我們還可以再改善這個寫法，利用 ActiveSupport 提供的 [`delegate`](https://api.rubyonrails.org/classes/Module.html#method-i-delegate) 來實作。

```ruby
class BaseForm
  # ...

  delegate :persisted?, to: :@record, allow_nil: true

  def initialize(record, params = {})
    @record = record
    super params
  end
end
```

## model_name 和 to_param {#the-to_param-and-model_name}

URL 是透過 [`polymorphic_path`](https://api.rubyonrails.org/classes/ActionDispatch/Routing/PolymorphicRoutes.html#method-i-polymorphic_path) 生成的，他會使用 `model_name` 和 `to_param` 來產生路徑。

所以我們可以像這樣在 Rails Console 嘗試：

```bash
> app.polymorphic_path(User.new)
=> "/users"
> app.polymorphic_path(User.last)
=> "/users/1234"
```

當我們加入 `model_name` 和 `to_param` 的 Delegate 到 Form Object 之後，我們就可以取得一樣的結果。

```ruby
delegate :persisted?, :model_name, :to_param, to: :@record, allow_nil: true
```

再次確認效果：

```bash
> app.polymorphic_path(RegistrationForm.new(User.new))
=> "/users"
> app.polymorphic_path(RegistrationForm.new(User.last))
=> "/users/1234"
```

現在我們就有跟 Model 相同的介面可以使用。

## 讀取屬性 {#load-attributes}

當我們可以讓 Form Helper 正確運作後，我們還是沒有辦法讓資料自動在編輯的情況下被自動載入。

為了解決這個問題，我們可以調整我們的 `initialize` 方法來讀取必要的欄位。

```ruby
class RegistrationForm < BaseForm
  def initialize(record, params = {})
    attributes = record.slice(:email, :password).merge(params)
    super record, params
  end
end
```

另一種方法是透過 Attribute API 來支援這個功能，但是我們必須明確的在 Form Object 指定每個屬性。

```ruby
class BaseForm
  # ...
  include ActiveModel::Attributes

  def initialize(record, params = {})
    @record = record
    attributes = record.attributes.slice(*.self.class.attribute_names)
    super attributes.merge(params)
  end
end

# app/forms/registration_form.rb
class RegistrationForm < BaseForm
  attribute :email, :string
end
```

> 不過我們必須注意 `params` 的使用，Model 回傳的屬性會是 `{"name" => "Joy"}` 但是我們用 `{name: "Joy"}` 的話，我們最後會得到混合字串和 Symbol 的 `{"name" => "Joy", name: "Joy"}` 而且可能會讓我們在設定 Form Object 屬性時發生點問題。

## 後續改進 {#future-improve}

在目前的版本，我們必須將 Model 實體傳入到 Form Object 裡面，也許我們可以加入一些 DSL 去自動產生。

```ruby
# Option 1
class RegistrationForm < BaseForm
  model_class 'User'

  attribute :name
end

# Option 2
class RegistrationForm < BaseForm[User]
  attribute :name
end
```

不過這樣的做法在比較複雜的系統是是需要考量的，不一定會是個好做法。

舉例來說，我們已經在 Controller 或者其他物件讀取 `User` 。但是我們無法將它傳給 Form Object 這表示我們的 Form Object 會永遠的在我們取用時讀取一次。
假設我們這是一個 Nested Form 的話，在這個情況還會導致 N+1 問題。

這是另外一個主題需要去討論，當我們使用 Form Object 或者其他 Service Object 來重構的時候，我們可能減少了重複的程式碼卻造成我們的系統出現沒有被注意到的隱藏問題，或者讓整體變慢。

## 總結 {#conclusion}

實際上我並沒有太說使用 Form Object 的經驗，不過我認為這應該是一個很常見的使用情境。
這個版本的 Form Object 還有很多限制，而且我也沒有完善考慮到所有的情況。

不過我打算繼續在之後的工作中改進，並且嘗試保持單純。我認為並不是所有的情況都需要提供複雜的行為或者透過 Gem 來解決一些應該要很單純的情境。
