---
title: "針對遺留代碼加入單元測試的藝術課程心得"
publishDate: 2021-01-10T03:24:59+08:00
date: 2021-01-10T03:24:59+08:00
tags: ["測試","RSpec","Ruby","心得"]
toc: true
thumbnail: https://blog.frost.tw/images/2021-01-10-experience-of-unit-testing-effectively-with-legacy-code/thumbnail.jpg
credit: Pexels
---

大概在 2019 年底就有考慮要來報名，結果一直拖到 2020 才下定決心。寫測試這件事情雖然很早就知道，不過一直到出社會開始工作後才逐漸的接觸，而且最開始的時候其實寫了很多糟糕的測試，直到這幾年逐漸摸索才有一個比較有系統的測試撰寫方式。

但是透過自學比較大的問題就是知識很多時候是沒有系統的，大多是碎片的形式同時我自己也不太擅長將這些東西歸納整理，也就會出現一些盲點。也因此這次參加課程主要有兩個目的，一個是看看是否適合作為公司內部訓練的選項建議老闆，另一方面就是我自己學東西的習慣，反覆的練習基礎來達到熟練一個技能。

<!--more-->

## 課程節奏、內容

大概開始一小時左右我就確定節奏很適合當作公司內部訓練的選項，[91 哥](https://www.facebook.com/91agile)作為專業講師一直都很讓我佩服，幾年前在 PHPConf 聽到的分享就讓我一直很有印象，直到現在也還在工作使用裡面的一些概念。

原本是想整理一份 Ruby 版本的課程心得來完善課程中 Ruby 範例的，不過既然決定寫一篇文章跟大家分享，後面就會以我自己的經驗跟學到的概念跟大家分享，想要知道課程內容的話就請大家趕快去報名吧！

## Ruby 的測試

在 Ruby 中最主流的會是使用 [RSpec](https://rspec.info/) 來進行測試，這是一套 BDD（Behaviour Driven Development）框架， [Ruby on Rails](https://rubyonrails.org/) 則是使用 [MiniTest](https://github.com/seattlerb/minitest) 來進行測試，除此之外也會使用 [Cucumber](https://cucumber.io/) 來撰寫測試。

> Ruby on Rails 專案預設會使用 MiniTest 但是大多數的人都會使用 RSpec 來寫測試，因此常常會看到新手把 `test` 和 `spec` 目錄放在專案中，這是兩種測試框架習慣使用的目錄不同的關係，正確的做法應該是在 `rails new` 就指定使用 RSpec 作為測試框架。

我自己是沒有在使用 MiniTest 不過倒是對 Cucumber 很有興趣，跟 RSpec 需要由工程師撰寫程式碼不同，使用 Cucumber 會先由工程師設計出一些文法規則，而 PO（Product Owner）或者 PM（Project Manager）就能夠透過描述的方式將規格自行填入，進而減少工程師去確認規格的時間，不過前幾年有看過一些團隊在推行，但似乎沒有看到一些好的成效。

> 實際上寫測試最困難的地方是根據「正確的規格」去撰寫，我們更多的時候是經過一層又一層的傳話拿到一些「有問題的規格」也因此跟客戶確認清楚是很重要的環節。

## 更好的 RSpec 測試

在這幾年應徵[五倍紅寶石](https://5xruby.com)的時候，我們會給出一份還算簡單的 Ruby on Rails 專案來確認面試者是否具備最基本的獨立開發功能的實力，裡面有一個環節就是使用 RSpec 撰寫 Feature Test（功能測試）這個環節會用來觀察面試者對撰寫測試的理解程度，另一方面也是因為 Feature Test 大多只要能達到針對某個畫面檢測就可以，相對於單元測試來說容易很多。

不過到目前為止都還沒有看到過寫的特別好的情況，也因此大部分面試者在加入五倍的第一個專案通常都會卡住一到兩週在 Code Review 上面，這個階段我會不斷的從測試和重構兩個階段讓新同事習慣一些技巧，像是在撰寫的時候就要同時思考該怎麼測試，而測試該怎麼寫才會更乾淨。

跟學程式語言最困難的地方在「了解語言特性」一樣，學習測試框架也需要知道框架的功能和性質，像是 RSpec 一直都有一份叫做 [Better Specs](https://www.betterspecs.org/) 的文件，裡面就提到了非常多 RSpec 撰寫時應該善用的技巧，不過這份文件最近翻新了一次，原本的中文翻譯也一起消失了。

## 從 Lint 學習 RSpec 測試

2020 年大概是 Ruby 社群有很多大變動的年份吧，除了 Ruby 3 終於推出開始跟上其他語言的效能上改進之外，經常被用來檢查 Coding Style（程式碼風格）的工具 [Rubocop](https://github.com/rubocop-hq/rubocop) 也迎來了大改版正式邁入 1.0 而在這個大版本前的幾個版本也開始將 RSpec、Rails、ThreadSafety 等等跟 Ruby 核心比較不相關的檢查獨立出來，如果你的專案想使用 RSpec 的話也請把 Rubocop RSpec 加入到 Rubocop 的檢查中，這樣至少能知道 Ruby 社群的偏好。

不過使用 Rubocop 其實也有蠻多爭議，像是 GitHub 和 Shopify 都有自己客製化的 Rubocop 風格設定，而且和預設的差異非常大，詳細的理由大多可以在他們說明 Coding Style 的部落格或者 Repoistory 上面找到。

> Rubocop RSpec 給了很多限制，像是 Example Group（`describe` 和 `context`）不能巢狀超過三層、每一個 Example Group 裡面至少要有一個 Example 等等

## 測試意圖

課程中我印象中比較深刻的幾個關鍵，這個是其中一個。雖然想示範糟糕的 RSpec 寫法，但是這邊更接近我目前使用的測試撰寫方式要如何改進會更好，因此下面是一段我原本會這樣寫的測試。

```ruby
# frozen_string_literal: true

require 'spec_helper'

RSpec.describe RedeemService do
  # Rubocop RSpec 建議對「物件實例」造假，因此建議用 `instance_double` 代替 `double`
  let(:redeem_code) { instance_double(RedeemCode) }
  # Rubocop RSpec 建議用 `described_class` 來表示測試物件，重構名稱時就不用修改 `RSpec.describe` 之後的程式碼
  let(:service) { described_class.new(redeem_code) }

  # RSpec 慣例用 `#method` 表示 Instance Method 用 `.method` 表示 Static Method
  describe '#available?' do
    # RSpec 特性，利用 `subject` 建立 One line test case
    subject { service.available? }

    # Rubocop RSpec 要求 `context` 以 `when` 開頭
    context 'when redeem code valid' do
      # RSpec 內建支援 Stub / Mock 機制，這邊對 RedeemCode 物件做 Stub 處理
      before { allow(redeem_code).to receive(:valid?).and_return(true) }

      # `is_expected` 等同 `expect(subject)` 使用單行測試案例時會用 `is_expected` 去表示
      # RSpec 中會自動將 `be_` 呼叫，像是 `truthy` 就會呼叫該物件的 `truthy` 方法，如果有指定 Matcher 時則以 Matcher 為主
      it { is_expected.to be_truthy }
    end

    context 'when reedeem code invalid' do
      before { allow(redeem_code).to receive(:valid?).and_return(false) }

      it { is_expected.to be_falsy }
    end
  end
end
```

上面的範例實際上沒辦法完整表示所有的技巧，不過在「意圖」這塊是還能夠改善的，在課程中了解到上面的測試描述的只是「程式上的定義」也因此我們可以繼續改進

```ruby
# frozen_string_literal: true

require 'spec_helper'

RSpec.describe RedeemService do
  # 這邊也可以用 self.given_redeem_code 來定義，但是因為 Rubocop RSpec 建議一個 Group 只有一個 before / after 因此就採取這種方式
  def given_redeem_code(valid: true)
    allow(redeem_code).to receive(:valid?).and_return(valid)
  end

  let(:redeem_code) { instance_double(RedeemCode) }
  let(:service) { described_class.new(redeem_code) }

  subject { service }

  describe '#available?' do
    context 'when redeem code valid' do
      before { given_redeem_code(valid: true) }

      it { is_expected.to be_available }
    end

    context 'when reedeem code invalid' do
      before { given_redeem_code(valid: false) }

      it { is_expected.not_to be_available }
    end
  end
end
```

一時之間想不到更好的範例，在課程中提供的範例涵蓋的範圍太廣，不過不方便拿來當例子因此就只能用這個來做簡單的分析跟解釋。

> 在寫這篇文章的時候又發現一些可以改進的地方，像是可以直接用 `be_available` 而不用定義 `subject` 而這更接近所謂測試的「意圖」

在 RSpec 裡面支援使用 Helper Method （輔助方法）來幫助我們撰寫一些輔助測試的行為，像是在 RSpec Rails 就提供了像是 `get` 這類可以模擬 HTTP 請求的輔助方法。

我們定義了 `given_redeem_code(valid: true)` 這個方法，用來代替原本的 `allow(redeem_code).to receive(:valid?).and_return(true)` 讓測試可以更明確的表示「給出正確的兌換碼」這個情境，另外要注意的是這個方法一定要定義在測試群組裡面，才不會在其他測試被載入到而互相影響。

> 不過在我自己的經驗中 Ruby 社群似乎不太常使用這樣的技巧，而想要使用像是 `Given` 和 `When` 的語法其實也有人做了 [RSpec Given](https://github.com/jimweirich/rspec-given) 套件，但在我的記憶中並沒有太多人使用，而這樣的應用方式反而是在寫 Cucumber 時因為語言性質會被應用。

## 優雅的 RSpec 測試

在這次的課程中因為提到了不少之前寫測試沒有特別注意的細節，也因此我在空檔花了一些時間去看 RSpec 文件提供了哪些機制來輔助，以我個人偏好來說我會優先採取 One-liner Syntax（單行測試）的方式，除了寫的程式碼相對少之外，使用恰當在 RSpec 預設的「輸出選項」也能適當的呈現出非常容易理解的測試文件。

```bash
rspec --format doc
```

我們就可以獲取這樣的結果

```
RedeemService
  when code valid
    is expected to be available
  when code invalid
    is expected not to be available

Finished in 0.02296 seconds (files took 0.27232 seconds to load)
2 examples, 0 failures
```

這其實也是 Ruby 語言在 DSL（Domain Specific Language）的強項，我們在測試寫的東西幾乎是 100% 接近文件的輸出，這也是為什麼 Rubocop RSpec 會要求測試群組的巢狀層級數量跟要使用 `when` 作為 `context` 描述起始，這樣就能在輸出上達到一制性也更容易閱讀。

> 另外一個值得探討的地方是，還需要寫 `describe '#available?'` 來建立一個測試群組嗎，而以 Context 為基礎的話，下面再切割的群組又會是怎樣的。這也是我在不同專案上看到不同的習慣，目前我自己還是以「方法」區分為主。

而上面的程式碼我們還能在做改進，前面我們使用的 Helper Method 叫做 Arbitrary Helper Method 也就是「任意定義」的意思，假設 RedeemCode 經常會被設定，我們就可以利用 Ruby 的 Module 特性將這些設定統一到一個模組中管理。

```ruby
# spec/support/helpers/redeem_test_helper.rb

module RedeemTestHelper
  def given_redeem_code_with_state(valid: true)
    allow(redeem_code).to receive(:valid?).and_return(valid)
  end

  def given_redeem_code_with_rewards(rewards)
    allow(redeem_code).to receive(:rewards).and_return(rewards)
  end
end

# 我個人偏好直接在 Helper Module 加入設定，我們通常會習慣在 spec_helper.rb 直接導引用所有 `support/` 目錄下的檔案

RSpec.configure do |config|
  config.include RedeemTestHelper, :redeem_module
end
```

接下來我們在測試裡面就可以像這樣使用

```ruby
# frozen_string_literal: true

require 'spec_helper'

# RSpec 的 Metadata 功能可以標記 Tag 之類的，常見的會是 `type: :controller` 這種
RSpec.describe RedeemService, :redeem_module do
  # ...

  describe '#available?' do
    context 'when redeem code valid' do
      before { given_redeem_code_with_state(valid: true) }

      it { is_expected.to be_available }
    end

    # ...
  end
end
```

如此一來我們就能在有用到 RedeemCode 相關邏輯的地方加上 `:redeem_module` 的標記，讓對應的輔助方法可以被載入進來使用。

## 對方法呼叫的檢驗

之前在嘗試處理一些問題時有看過 `spy` 這個使用方式，但是一直不清楚該如何使用以及跟 Mock / Stub 的關係，在課程中經過練習和說明後就稍微有概念，而這部分確實也是我目前沒有使用在測試中的技巧。

假設 RedeemService 在成功兌換後會發送一封通知信，但我們只關注通知的訊息是否正確而不在意怎麼發出去，就可以用這個技巧來處理。

```ruby
# frozen_string_literal: true

require 'spec_helper'

RSpec.describe RedeemService, :redeem_module do
  # TODO: 移動到 Helper Module
  def player_notification_should_notify_with(message)
    expect(notification).to have_received(:notify).with(include(message))
  end

  # 我個人偏好在做 Mock 處理時直接指定對應的物件，出現錯誤訊息比較好確認當下假定會使用的物件是什麼
  let(:notification) { spy(PlayerNotification) }
  let(:service) { described_class.new(redeem_code, notification) }

  # ...

  context 'when redeem code valid' do
    before { given_redeem_code_with_state(valid: true) }

    it { is_expected.to be_available }

    describe '#perform' do
      subject(:when_redeem) { service.perform }

      before do
        given_redeem_code_with_rewards [
          RewardItem.new('Sowrd'),
          RewardItem.new('Bow')
        ]
      end

      it 'is expected to send notify' do
        when_redeem
        player_notification_should_notify_with('2 rewards')
      end
    end
  end

  # ...
end
```

這樣我們就可以確認我們會呼叫某種屬於 Notification 類型的物件上的 `#notify` 方法並且訊息含有 `2 rewards` 的字串，這邊就沒辦法單純的用單行去呈現，並且最好將 `it` 的描述用 `is expected to` 來撰寫，這樣在 RSpec 輸出的文件中會更容易閱讀，雖然 Rubocop RSpec 沒有強制這個規格，不過用 `is expected to` 會相對整齊多，在我的印象中也有一些流派是建議這樣使用的。

> 在這邊 `describe '#perform'` 似乎就變得突兀，是否能有其他改進的方式就可能會需要進行探討

## 小結

不知不覺就寫到半夜，其實還有不少東西沒辦法寫到。但是這次的課程雖然在框架應用上大多我已經知道，或者了解的更詳細。不過更重要的是課程中還帶出了很多觀念上的問題讓我對於測試能再更近一步的方法有了一些方向，不過同時也蠻感概這個領域我們知道的也許比想像中的少。

即使在一些知名的開源專案中，也不一定能看到像這樣完整的測試撰寫跟明確的表達意圖。不過同樣的要完成到這樣的測試花費的心力跟資源也是非常值得評估的，因此在課程結束前也在跟大家討論何時該寫測試的問題，以及怎樣判斷哪些測試該先寫跟對覆蓋率的迷思。

整體上來說這門課對我自己的意義更多在心法上的改進，在技巧上現有的方法已經相當不錯只是缺少了對應的心法讓他更近一步。
