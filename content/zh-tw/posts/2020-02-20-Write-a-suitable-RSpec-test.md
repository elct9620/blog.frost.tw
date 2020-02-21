---
title: 撰寫一個合適的 RSpec 測試
date: 2020-02-20 00:26:16
tags: [Ruby, RSpec, 心得, BDD, TDD, Rails]
slug: Write-a-suitable-RSpec-test
thumbnail: https://blog.frost.tw/images/2020-02-20-write-a-suitable-rspec-test/thumbnail.jpg
credit: Photo by Rodolfo Clix from Pexels
toc: true
---

包括我自己在內，寫測試有時候是一個非常不想面對的工作。也有很多剛入門的工程師覺得很難去分辨該怎麼去寫測試，在今天跟同事說明完一些技巧後就決定來寫一下這篇分享一下我自己的經驗。

<!--more-->

在開始之前我們先不要管什麼 TDD 或者 BDD 之類或是你之前讀過的一些測試相關的文章，然後反思一下什麼是「測試」為什麼我們需要「測試」？

基本上，我們會把測試放到專案裡面大多是為了要避免一些人會不小心犯的錯誤。所以透過定義一些自動化的程式，來確定我們的實作跟「規格」是相同的。

不過，規格跟程式碼都還是由人來撰寫跟產生的，所以很明顯的如果我們使用錯誤的規格或者錯誤的程式去測試，依舊還是會得到錯的結果。

所以盡量保持一切單純會是個不錯的做法，至少你在寫測試的時候會覺得快樂一點。

## 純 Ruby 的範例 {#pure-ruby-example}

在我的經驗中測試其實跟你寫的程式碼是有關聯的，如果你本身寫出來的程式就很糟糕，那麼測試也會變得超級難寫。也因此不管是先寫測試還是後寫測試，最重要的事情是要想清楚你的需求還有你想要測試哪些東西。

話不多說，我們先簡單實作一個 `Calculator` 物件來測試看看。

```ruby
class Calculator
  def initialize
    @inputs = []
  end
end
```

這是一個很簡單的 `Calculator` 物件，在初始化的時候會產生一個  `@inputs` 陣列。

然後就可以先搭出一個簡單的測試檔案出來：

```ruby
RSpec.describe Calculator do
  let(:calculator) { Calculator.new }
end
```

然後我們來增加一個 `#add` 方法，讓我們可以簡單的對這個物件做一些操作。

```ruby
class Calculator
  def initialize
    @inputs = []
  end

  def add(number)
    @inputs << number
  end

  def perform
    @inputs.sum
  end
end
```

接下來就是修改一下我們的測試，讓我們可以去測試這個物件提供的方法跟行為。

```ruby
RSpec.describe Calculator do
  let(:calculator) { Calculator.new }

  describe '#add' do
    let(:number) { 1 }
    subject { calculator.add(number) }

    it { is_expected.to include(number) }
  end

  describe '#perform' do
    subject { calculator.perform }

    before { calculator.add(1) }

    it { is_expected.to eq(1) }
  end
end
```

在我的經驗裡面，如果是一個很不錯的測試情境應該是可以透過定義 `subject` 來指定目前測試的對象，而且我們基本上可以用一行斷言來完成測試，而且大部分的時候我都會盡量讓我寫出來的東西可以像這樣被測試。

> 不過現實情況永遠不會這麼理想，之後有機會可能會再討論看看，至少這篇文章應該不會提到這些情況。

## 實際案例 {#real-world-example}

現在我們對一個理想的測試有一些概念了，那麼我們就繼續在實際的情況中來應用看看。

今天早上討論的是一段用來處理付款的物件，不過是好幾年前寫的。

```ruby
class PaymentService
  def initialize(payment)
    @order = payment.order
    @payment = payment
     # ...
    setup
  end

  def setup
    @payment.amount = amount
    @payment.currency = @order.currency
    # ...
  end

  def perform
    return false unless @payment.valid?

    ActiveRecord::Base.transaction do
       @payment.save
       VendorAPI.payment.create(amount: @payment.amount)
       # ...
    end
  end

  private
  def amount
    @order.items.sum(&:subtotal)
  end
end
```

當我們想測試這個物件的時候會發現很難測試，因為他把所有東西都塞到 `@payment` 裡面，而且又無法在外部存取。

一般來說我們可能會想直接地把 `@payment` 曝露出去，變成像是 `service.payment.amount` 這樣的形式。

這樣我們確實可以寫出一段測試並檢查結果，不過這段測試其實有點不直覺。

```ruby
subject { service.payment.amount }
it { is_expected.to eq(100) }
```

我們測試的是「Service Object」本身而不是「Payment」這個封裝在裡面的 Model，根據這樣的推論，我們的測試實際上應該要像下面這樣。

```ruby
subject { service.amount }
it { is_expected.to eq(100) }
```

現在我們的 `subject` 就確實是指我們的 Service Object 的 `amount` 而非 Payment Model。

根據我們的預期，修改後的 `PaymentService` 應該會像這樣：

```ruby
class PaymentService
  def initialize(order)
    @order = order
  end

  def amount
    @order.items.sum(&:subtotal)
  end

  def perform
    payment = build_payment
    return false unless payment.valid?

    ActiveRecord::Base.transaction do
      payment.save
      VendorAPI.payment.create(amount: amount)
      # ...
    end
  end

  private

  def build_payment
    @order.payments.build(
      amount: amount,
      currency: @order.currency
    )
  end
end
```

透過這樣的重構，我們的測試就很直覺的關注在 `PaymentService` 物件本身上面。

在工作中基本上我都是用這樣的方式思考怎麼設計一個物件，算是我自己這幾年在寫程式上的經驗。

## 一些關於 Rails 的例子 {#the-rails-examples}

不得不說 Rails 在 Ruby 工程師裡面算是很熱門的框架，我每天工作也會用到。前面提到的這些技巧在 Rails 裡面也能應用嗎？

簡單來說，只要想辦法保持物件單純測試起來就會變得容易。

```ruby
# Model
RSpec.describe User do
  it { should validate_presence_of(:email) }
  # ...

  describe "#avatar_url" do
    let(:email) { "example@example.com" }
    let(:user) { create(:user, email: email) }
    subject { user.avatar_url }

    it "returns Gravatar URL" do
       digest = OpenSSL::Digest::MD5.hexdigest(email)
       should eq("https://www.gravatar.com/avatar/#{hash}")
    end
  end
end
```

像是在寫 Model 的時候我是會避免放太多邏輯在裡面，除非專案真的很小才會考慮直接寫在裡面。當你的專案變複雜的時候，我們常常會要做很多步驟的處理才能完成一件事情，這其實就算是一種訊號告訴我們需要把這些東西拆到一個獨立的物件上，然後我們就可以專心用測試檢查這個處理的流程（通常我們就會叫這類物件 Service Object）

```ruby
# Request
RSpec.describe "/api/users", type: :request do
   describe "GET /api/users" do
     let(:users) { create_list(:user, 5) }
     before { get api_users_path }
     subject { response.code }
     it { should eq("200") }

     describe "body" do
       subject { JSON.parse(response.body) }
       it { should_not be_empty }
       # ...
     end
   end
end
```

在情況的允許下我都會盡量讓測試看起來是簡單的，為了要可以像這樣簡單的檢查就表示我們需要更深入思考我們設計的物件是否是清晰而且簡單使用的。

上面這個範例其實只能涵蓋很小一部分的測試情境，不過我想這應該已經足以讓我們了解到一個恰當的測試是需要我們在寫程式上多注意才能做到的。

當然，我有時候也會因為進度問題跳過測試，而且也還沒有好好寫測試的習慣。

但是根據前面分享的經驗，即使你不寫測試你還是需要思考「當我測試我的程式時，這樣是容易被測試的嗎？」

當你習慣這樣做之後，其實會發現很多網路上的「最佳實踐」如果有認真遵守的話，其實就能讓我們的程式碼便的容易測試。

舉例來說好了，蠻多新手會定義一些回傳不同類型數值的方法。

```ruby
def sum
  return false if summable?

  @items.sum
end
```

其實這就造成我們很難去預測這個方法會回傳什麼，最後還會演變成需要寫更多的測試去檢查這個方法是否正常。

## 總結 {#conclusion}

其實這不算是很高深的技巧，不過實際上我花了好幾年才慢慢了解該怎麼寫一個恰當的測試。

會寫這篇文章主要就是發現我在 Code Review 的時候要求同事重構一些有問題的舊程式碼，但是得到的就是一臉迷茫的表情，因為他們不知道該從哪裡開始重構起來，尤其是他們要補上測試來檢查這些舊的程式。

不過當你也覺得疑惑的話，可以檢查看看你的程式碼：

* 你的測試能不能專注冊單一物件上，而不需要依賴其他物件。
* 實作的行為是不是只專注在一件事情上（像是只處理讀寫或驗證資料或者發送 API 之類的）
* 回傳的數值是否是可以預期的（像是只會有數字、擁有同樣介面的物件）

其實這些東西如果有讀過一些像是 SOLID 這種物件導向的原則會覺得這些東西還蠻簡單的，不過實際上實作的時候還是很難拿捏要怎麼寫才不會過度設計並寫出適當的測試。

總之，希望這篇文章能給大家在寫測試上有一些靈感。
