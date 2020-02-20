---
title: Apartment 與 Globalize 隱藏在方便背後的陷阱
date: 2018-03-18 23:59:56
tags: [Ruby on Rails,筆記,Gem]
---

手邊有一個專案剛好是需要滿足「多網站」並且每個網站都能夠「多語言切換」這兩個條件，在這兩個解決方案中最好處理的就是 Apartment 和 Globalize 這兩個 Ruby Gem 了。

不過，在某些情況卻變成了問題。幸好運氣不錯的是還在開發階段，還有辦法將這個問題透過替換 Gem 進行修正。

<!--more-->

首先，我們先來大概了解 Apartment 和 Globalize 這兩個 Ruby Gem 是擔任怎樣的任務。

## Apartment

Apartment 是一個 Multi-Tenancy (多租戶) 的套件，可以協助我們利用同樣的程式碼架設功能完全相同的多個網站。在一般的解決方案來說，就是自動切換連接的資料庫來達成這個效果。

另外，在 PostgreSQL 中則有 [Schema](https://www.postgresql.org/docs/9.5/static/ddl-schemas.html) 這個機制，可以讓我們在同一個資料庫做出類似 Namespace （命名空間）的效果。

透過 `SET SEARCH_PATH = 'site1, public'` 的設定後，當我們嘗試 `SELECT * FROM users` 的時候，就會先去找 `site1.users` 再去找 `public.users` （預設）的資料表，這對開發多用戶類型的系統有相當大的優勢。

> 不過這在大規模的網站（像是 Shopify 之類服務）在 Ruby on Rails 上就不會是個好選擇，會有效能和記憶體上的瓶頸。所以在設計上要考量應用的情境和規模。

## Globalize

Globalize 可以幫助我們對 Model 設定，讓特定幾個欄位的值能夠依照當下 `I18n.locale` 設定的數值來自動反映出不同語言的呈現。原理上來說其實也相當簡單，他會產生一個 `post_translations` 資料表，並且記錄語言和需要翻譯的欄位。

使用方法如下：

```ruby
class Post < ApplicationRecord
  translates :title, :content
end
```

如此一來就能夠自動的呈現出對應的語言（如果有存到對應語言的資料）

## 陷阱

會發生問題其實是稍微特殊的案例，因為這個專案需要針對每次的活動產生一個新網站，但是又需要支援多語言。原本想要支援多語言，其實我們可以單純用 Apartment 去開設不同語言的網站。

但是因為這個「機制」被開設活動網站所佔用，所以我們只好借用 Globalize 的功能來完成多語言的呈現。

一般的使用上並不會有問題，不過當我們碰到「共用」的資料表（不管在哪個網站都會用這張資料表），就會發生問題。

因為是多網站，所以需要有一張表儲存目前存在的網站：

```ruby
Apartment.configure do |config|
  config.excluded_models = %w[Site]
end
```

因為每個網站的名稱都需要有中文和英文版本，所以很自然的補上了翻譯的設定：

```ruby
class Site < ApplicationRecord
 translates :name
end
```

還有將 Migration 資訊也設定後，嘗試運行 `rake db:migrate` **表現上**是正常的。不過這是在**完全沒有 Site 資料**的情況下。

```ruby
  def up
    Site.create_translation_table!(
      {
        name: :string,
      },
      migrate_data: true
    )
  end
```

當我們在做 Migrate 的時候，是不希望遺失資料。所以會將 `migrate_data` 選項開啟，不過這也造成了第一個我們發現第一個問題——Globalize 生成的 `CREATE TABLE` 是錯誤的。

## 解析

從 Globalize 的[原始碼](https://github.com/globalize/globalize/blob/master/lib/globalize/active_record/migration.rb#L81)可以看到下面這段：

```ruby
t.references table_name.sub(/^#{table_name_prefix}/, '').singularize, :null => false, :index => false, :type => column_type(model.primary_key).to_sym
```

他會依據對應的 Model 來取出 `table_name` 這個參數，但是 `table_name` 因為 Apartment 要確保他是切換在正確的網站上，所以會從 `sites` 變成了 `public.sites` 來避免出問題。

基於這樣的設計，原本應該是要叫做 `site_id` 的欄位名稱，就變成了 `public.site_id` 存在於資料庫上。當 Globalize 嘗試把原本在 `sites` 資料表上的 `name` 欄位複製到翻譯的資料表上時，運行的 SQL 查詢就會恢復正常。

因為 Apartment 是對資料表層級的調整，所以在這樣的狀態下，在 Ruby on Rails 中的 ActiveRecord 預期會有的 `site_id` 欄位變成了 `public.site_id` 就會發生「找不到欄位」的錯誤。

不過這個問題並沒有想像中的困難，從原始碼可以看到清除 `table_name_prefix` 的機制。我們可以善加利用這個特性，在執行 Migrate 的階段暫時性的設定 `table_name_prefix` 在 Model 上就能正常運行。

## 限制

不過，當 `Site` 是跨網站的資料表時，我們也預期 `Site::Translation` 這個由 Globalize 動態生成的 Model 也應該要是跨網站的（否則 Apartment 會因為沒有指定到共用資料表，而無法取得正確的翻譯資訊。）

所以我們理所當然的增加了這樣的設定：

```ruby
Apartment.configure do |config|
  config.excluded_models = %w[Site Site::Translation]
end
```

這時候我們再次執行 `rake db:migrate` 卻發現出現了「資料表已存在」的錯誤。仔細一看，又是 Globalize 生成錯誤的 `CREATE TABLE` 查詢。

> 注意，這是在 Site 有存在資料的情況下，因為 Apartment 在已存在的 Schema 會採取跑 Migrate 的方式更新資料結構。

來去追查原因，原來在產生翻譯資料表 `site_translations` 的時候，資料表名稱是透過一個叫做 `translations_table_name` 的方法所定義，而這個方法則源自於 Globalize 對 Model 的擴充。

從 Globalize [原始碼](https://github.com/globalize/globalize/blob/master/lib/globalize/active_record/class_methods.rb#L51)可以發現：

```ruby
      def translation_class
        @translation_class ||= begin
          if self.const_defined?(:Translation, false)
            klass = self.const_get(:Translation, false)
          else
            klass = self.const_set(:Translation, Class.new(Globalize::ActiveRecord::Translation))
          end

          klass.belongs_to :globalized_model,
            class_name: self.name,
            foreign_key: translation_options[:foreign_key],
            inverse_of: :translations,
            touch: translation_options.fetch(:touch, false)
          klass
        end
      end

      def translations_table_name
        translation_class.table_name
      end
```

他會透過剛剛動態生成的 `Site::Translation` Model 來推斷該用什麼當做資料表的名稱。在正常的狀況下，我們會理所當然的認為是 `site_translations`。

不過，我們使用的是 Apartment 來產生多網站的效果，也就是說名稱會變成 `site1.site_translations` 但是因為我們剛剛又設定了這是一張「共用資料表」所以就被改為 `public.site_translations` 了。

到目前為止其實都沒有問題，不過 Apartment 為了讓維護資料表是簡單的，所以實際上每一個網站的資料表會是完全一樣（直接重複所有 Migrate 動作，即使沒用到）

假設我們有 10 筆 Site 資料，那們就會變成嘗試 `CREATE TABLE` 10 次 `public.site_translations` 這個資料表，也就理所當然地會出現「資料表已存在」的錯誤。

## 總結

身為 Ruby on Rails 開發者，我們通常習慣於採取「已知可行」的現有解決方案，透過社群的力量共同維護一份穩定的套件來對應各種不同的情況。也因此，我們經常性地將很多細節封裝起來，造成許多人並不了解其底層的運作原理。

這也是為什麼會踩到這個陷阱的原因，因為即使是兩個知名的 Ruby Gem 兩邊的團隊也不見得會預想到「有人會想這樣使用」也不會去採取對應的措施。

可以的話，盡可能的進行事前的評估和測試（雖然本文的案例其實有點極端），就可以避免不少方法。

> 最後的解法是替換成使用 PostgreSQL JSON 欄位特性的 Gem 避開產生新資料表的問題，更換後的成本需要擔心的大概是 SQL 查詢受影響的程度。


