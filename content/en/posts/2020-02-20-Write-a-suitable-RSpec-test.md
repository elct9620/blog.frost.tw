---
title: Write a suitable RSpec test
date: 2020-02-20 00:26:16
tags: [Ruby, RSpec, Experience, BDD, TDD, Rails]
thumbnail: https://blog.frost.tw/images/2020-02-20-write-a-suitable-rspec-test/thumbnail.jpg
credit: Photo by Rodolfo Clix from Pexels
toc: true
---

Include me, write test is many people's nightmare. Many junior programmers feel it is hard to define which should be tested. So, I decided to share my experience after I tech my colleague today.

<!--more-->

Before we start talking about how to write a test, let us stop thinking about anything about TDD or BDD or any you may read about it.

And ask yourself, what is "test"? Why we need a "test"?

The target we add the tests to our project usually to prevent human mistake, that means we try to let compute help us to confirm our code matches the "spec".

But we have to know, the test still is human write code and the spec is human to decide. When you have the wrong spec and wrong way to test, we still get the wrong result.

So, let us try to keep everything simple, and you will feel happy when writing the test.

## The Pure Ruby example

In my experience, the test is related to your code. If you have bad code, and you will hard to test it. So, no matter you write the test before implementing anything or after it. The most important thing is the double-check which you want to test and fit your necessities.

Let's write a `Calculator` class, and try to test it.

```ruby
class Calculator
  def initialize
    @inputs = []
  end
end
```

At first, we have a `Calculator` class with initialized `@inputs` array.

And we can create a simple RSpec skeleton.

```ruby
RSpec.describe Calculator do
  let(:calculator) { Calculator.new }
end
```

And next, let us add the `#add` method to the calculator to allow it to add something.

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

And let's update our test

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

In my experience, the best case is you can simply define a `subject` which is the target you want to test for, and we can use one line to test it. So I usually try to let my code can be tested like the above example.

> In the real world, it may not usually ideal. But this post we didn't discuss these case, maybe we can discuss in the future.

## Real-world example

After we have an imagination about the ideal test, let us try to apply it in the real world.

This morning we are discussing a legacy object which is the order's payment processor with my team member.

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

When we try to test this class, we notice it is very hard to add any test for it. Because the information is encapsulation inside the `@payment` but we cannot access it.

You may want to expose the `@payment` as an attribute like `service.payment.amount`

But if we try to check for the amount is correct, our test code does not make sense.

```ruby
subject { service.payment.amount }
it { is_expected.to eq(100) }
```

We test for the "Service Object" not the "Payment Model" inside it. According to this rule, the test should be like below.

```ruby
subject { service.amount }
it { is_expected.to eq(100) }
```

At this moment, the "subject" correctly refers to the service's amount.

Let's refactor the `PaymentService` class to fit our expectations.

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

After refactoring, the `PaymentService` is becoming more straight and we can focus tests on the `PaymentService`.

This is my experience when I design an object and I usually follow this rule in my work.

## More example of Rails

The Rails is the popular framework in Rubyist, I use it almost every workday. How can we use the above skills in Rails?

Just keep your class simple, and everything will be easier to test.

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

For the model, I usually prevent logic inside it. If your project is small and simple, it is ok to do this. But when your project is complex, we usually have to take several steps to process one thing. And that may be a signal to us to split it into an independent class to focus on this process (we usually call them service object)

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

If it is possible, I usually try to make my test more simple. It will help us to think about how to design our class is more clear and easier to use.

The above examples only cover very small parts of tests, but I think it is enough to show the suitable test usually depend on your code.

I still not used to write the test before I start work, and I also skip some tests if I have no time to write it.

But according to my experience, even you didn't write the test you still need to think about "when I try to test my code, which is easier?"

And then, you will notice the best practice we read from the net if we follow it and usually let our code easier to be tested.

For example, the junior will define a method mix different type return values.

```ruby
def sum
  return false if summable?

  @items.sum
end
```

It will cause it hard to predict which type will be returned, and we need to write more test cases to confirm it.

## Conclusion

This may not an advanced skill, but I spend a lot of years to learn and try to write a test suitable.

And I notice my company's junior also has the same problem and feeling confusing when I ask them to try to refactor some legacy code.

They feel lost their way and didn't know where they can start to refactor the code.

So, when you feel confusing, just check for your code about:

* Is the test can focus on my class without depending on others?
* Is my behavior is focused on one thing? (ex. Read and write, validate value, send an API request)
* Is my method returns is expectable? (ex. the only number, object have the same interface)

That sounds very simple and you may read about some object-oriented article about SOLID rules. But it still is hard to design it to a suitable state which didn't have too many over design.

Anyway, hope my article can help you find some inspiration when you try to write some tests.
