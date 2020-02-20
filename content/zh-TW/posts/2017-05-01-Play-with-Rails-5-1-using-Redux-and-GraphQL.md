---
title: 用 Redux 跟 GraphQL 玩 Rails 5.1
date: 2017-05-01 23:09:40
tags: [Rails, Redux, GraphQL]
---

上週五在處理網址續費的時候，發現幫老爸公司管理的網址已經多到一個程度。所以就決定把手邊可以轉移的服務都往 Gandi 丟過去。畢竟粗略估算可以達到 Grid B 的費率（實際上只有九五折）不過考量到有 API 能夠管理，以及一些自動化的手段，雖然相對還是稍微貴了一點，但是省去後續不少麻煩確實是有利的。

也因為這樣，就打算以串 Gandi 的 API 來練手一下，原本是想做完管理 Domain 的部分，不過沒想到在實作一些技術面上的東西花了不少時間，只做完簡單的價格查詢。

<!--more-->

根據我的習慣，我通常會在新專案使用新的技術，這次是使用 Rails 5.1 支援 Webpack 的功能搭配上 Redux 和 GraphQL 來應用。我學 React 的時間是在 Redux 出來之前，所以一直都使用手刻 Flux 架構的方式去寫。

而 GraphQL 之前因為沒有成熟的 Ruby Gem 也一直沒有去碰，最近除了有相容 Rails 之外，也出現了透過 ActiveRecord 的 Association Reflect 去解決 GraphQL 會出現 N+1 問題的 Gem 讓我總算是下定決心去嘗試看看。

這個專案我自己的規劃是這樣的：

* Dashboard
    * Domain Manager
        * Auto Renew
        * DNS Zone
            * CloudFlare Intergate
        * DNSSEC
    * SSL Manager
        * Auto Renew
        * Auto Deploy
* API
    * GraphQL (Front-end)
    * RESTFul API (3rd-party)

 大致上定位是基於 Gandi 給的 API 做自動化的管理，以及在一些服務上的部署可以有效率的處理（會整合 DevOps 之類的）

---

不過既然要買網址，所以就需要先了解 Gandi 上的收費以及可以購買的網址。

```ruby
gem 'gandi'
```

運氣不錯，已經有人將原本的 XMLRPC API 封裝成一個 Gem 可以用很簡單的方式來操作。

> 如果像我一樣使用 Ruby 2.4 因為 XMLRPC 已經從 Core 移除，所要自行追加 `gem 'xmlrpc'` 來補齊功能。

這個 Gem 的使用方法大致上如下：

```ruby
api = Gandi::Session.new(ENV['GANDI_API_TOKEN'])
api.domain.list # 顯示帳號下所有的 Domain
```

不過對於 Rails 來說其實不容易使用，既然是第三方的 API 就先封裝成一個 Service 物件比較容易處理。
至於建立 API Client 實例的動作也可以封裝一下方便使用。

```ruby config/initializers/gandi.rb
# frozen_string_literal: true

# :nodoc:
module Gandi
  def self.api
    options = {}
    options[:env] = :test unless Rails.env.production?
    @api ||= Gandi::Session.new(Settings.gandi.token, options)
  end
end
```

我習慣會使用 `SettingsLogic` 這個 Gem 來管理設定，這邊也可以將 `Settings.gandi.token` 替換成 `ENV['GANDI_API_TOKEN']`  之類的。

> 因為 Gandi 有提供測試環境，所以在非 Production 時一律採用測試環境。

接下來就是封裝 Gandi 的價格查詢（`Catalog`）成為一個 Service 供系統使用（可能是歐洲服務商的關係，API 相當慢，在本地端足存一份副本會好很多。）

```ruby app/services/domain/price_services.rb
# frozen_string_literal: true

module Domain
  class PriceService
    def initialize(currency = :EUR, grid = :A)
        @currency = currency
        @grid = grid
    end

    def query(query)
        query = {product: query.merge(type: :domain)}
        Gandi.api.catalog.list(query, @currency, @grid)
    end

    def all
        query({})
    end
  end
end
```

基本上就是對原本的 Gandi 做簡單的封裝，現在透過 `Domain::PriceService.new.all` 就可以輕鬆存取到需要的價格資訊。
不過因為要匯入到本地的資料庫，回傳的資料結構並不是我所期望的狀況，所以就再做了一層封裝。

```ruby app/services/domain/price_services.rb
# frozen_string_literal: true

module Domain
    class PriceService
        class Result < Array
            def to_domain
                map { |item| build_domain(item) }
            end

            private

            def build_domain(item)
                CatalogDomain.new(
                    description: item.product.description,
                    action: item.action.name.parameterize(separator: '_'),
                    phase: item.action&.params&.tld_phase,
                    price: convert_to_price(item),
                    grid: item.unit_price.first.grid
                )
            end

            def convert_to_price(item)
                Money.from_amout(
                    item.unit_price.first.price,
                    item.unit_price.first.currency
                )
            end
        end

        # 略
        def query(query)
            # ...
            Result.new(Gandi.api.catalog.list(query, @currency, @grid))
        end
    end
end
```

如此一來，我就可以用 `Domain::PriceService.new.all.to_domain` 轉成對應的 Model 方便匯入的動作。

* Gandi 這個 Gem 已經用 Hashie 封裝過，所以可以透過類似物件的方式存取屬性
* 因為主要是使用的是台幣，但是也希望儲存不同幣種的價格所以使用了 `Money` Gem 的功能

至於 Model 的部分就不多論敘，不過因為域名的資料現在有約 4000 筆，所以需要借助 `activerecord-import` 這個 Gem 做一次性的匯入，即使透過 Rails 的 Batch 功能也沒有辦法高效率的做匯入。

不過，在 Gandi 回傳的資料會有以下情況。

* `action` 的差異：新增、轉入、續約等等
* `phase` 的差異：已上線、日升期等等（域名術語，日升期這類是給商標註冊者購買或者預先用高價保留域名用的）

所以如果再沒有對這些欄位增加限制的話，就會碰到匯入時重複的問題而發生錯誤。

所以在寫 Migration 的時候要補上下面的索引來增加限制。

```ruby
add_index [:description, :action, :phase, :currency, :grid],
          name: :catalog_domain_constriant,
          unique: true
```

要這樣做的理由，是因為 `activerecord-import` 支援 `ON CONFLICT` 的 SQL 語法，在 PostgreSQL 上可以在碰到重複的資料改為對特定欄位更新，而不是插入一筆資料。

於是就可以撰寫一個 Rake Task 來處理定期同步價格的任務。

```ruby lib/tasks/domain.rb
# frozen_string_literal: true

namespace :domain do
  desc 'Load domain prices from Gandi'
  task :refresh, [:currency, :grid] => [:environment] do |_, args|
    currency = args[:currency] || :EUR
    grid = args[:grid] || :A
    domains = Domain::PriceService.new(currency, grid).all.to_domain
    CatalogDomain.import domains, on_duplicate_key_update: {
      conflict_target: [:description, :action, :phase, :grid, :currency],
      columns: [:price]
    }
    puts "Total #{domains.size} rows in #{currency} loaded."
  end
end
```

透過 `on_duplicate_key_update` 的設定，就可以在碰到相同的資料時只更新價格，如此一來就可以利用 CronJob 來每天同步當日最新的價格資訊。

到此為止，就「域名資料」的部分就算是已經處理完畢了。

接下來對 GraphQL 設定，依照教學配置好之後，要先讓 GraphQL 可以支援顯示我們需要的資料。

```ruby app/graphql/types/query_type.rb
# frozen_string_literal: true

Types::QueryType = GraphQL::ObjectType.define do
  name 'Query'

  field :domains do
    type types[Types::CatalogDomainType]
    argument :tld, types.String
    resolve ->(obj, args, ctx) {
      if args[:tld]
        CatalogDomain.where('description LIKE ?', "%#{args[:tld]}%")
      else
        CatalogDomain.all
      end
    }
  end
end
```

這邊先簡單的支援查詢域名的功能，先不討論透過幣種或者價格來查詢，先讓使用者可以查詢現有可以註冊的域名有哪些類型即可。

> 至於 `CatalogDomainType` 只是單純的設定欄位而已，這邊就跳過不多做討論。

另外似乎是因為資料蠻多的關係，連生成 JSON 都有點慢，所以這邊額外設定了 `oj` 這個 Gem 來加速（大約是十倍快）

```ruby config/initializers/oj.rb
# frozen_string_literal: true

Oj::Rails.set_encoder
Oj::Rails.set_decoder
Oj::Rails.optimize(Array, BigDecimal, Hash, Range, Regexp, Time)
```

到這邊，我們的 Backend 就全部完成處置，接下來就是要讓前端可以使用這些資料來呈現。

首先到原本的 Layout 上面追加 Webpack 的 JS 檔案。
（預設還是傳統的方式，所以要手動加上由 Webpack 生成的版本）

```erb app/views/layout/application.html.erb
<!-- 略 --->
    <%= javascript_pack_tag    'application' %>
</head>
<!-- 略 --->
```

接下來開啟 Rails 的 Webpack 伺服器（`./bin/webpack-dev-server`）之前使用 beta1 的時候還有 Watcher 的選項，不過正式版似乎去掉了，不過用 dev-server 效果基本上是相同的。

> 要注意的是，強烈不建議 Webpack 跟原本的 Sprocket 混用，除了自己會搞混之外，原有的 ExecJS 也挺容易出錯的，統一寫在 `app/javascript/packs` 會是不錯的選擇。

接下來安裝一下需要的套件。

```bash
yarn add react redux react-redux react-dom redux-observable rxjs prop-types immutable redux-thunk
```

> 關於 UI 互動上，我偏向 RxJS 的解法，所以採用的是 `redux-observable` 的方式，至於 `redux-thunk` 因為不熟，大多教學都會裝一下，所以這邊單純跟風。

首先，先來處理 Reducer 的部分，這邊直接利用 Immutable 的 `fromJS` 直接把資料轉換。不過筆數這麼多的情況下，其實是不建議這樣做的，不過暫時還沒有找到恰當的處理方式，所以就先這樣做。

```js app/javascript/packs/reducers/domain.js
import { List, fromJS } from 'immutable';

import {
  QUERY_DOMAIN,
  RECEIVED_DOMAIN,
} from '../constriants';

const initState = Map({
  fetching: true,
  domains: List([]),
});

export const domainReducer = (state = initState, action) => {
  switch (action.type) {
    case START_REQUEST: {
      return state.set('fetching', true);
    }
    case FINISHED_REQUEST: {
      return state.set('fetching', false)
                  .set('data', fromJS(action.response.data.domains));
    }
    default: {
      return state;
    }
  }
};

export default domainReducer;
```

關於 `constriants` 就不多做說明，從以前的習慣就是會開一個目錄（或者檔案）把全部的 Action Type 統一塞在裡面管理，雖然說直接寫字串沒什麼問題，但是難免出錯，這種統一管理的方式倒是可以避免一些人為疏失。

接下來對 Action 做處理。

```js app/javascript/packs/action/domain.js
import { ajax } from 'rxjs/observable/dom/ajax';
import 'rxjs';

import {
  QUERY_DOMAIN,
  RECEIVED_DOMAIN,
} from '../constriants';

const ENDPOINT = '/graphql';

export const queryDomain = query => (
  {
    type: QUERY_DOMAIN,
    payload: JSON.stringify({ query }),
  }
);

export const receivedDomain = response => (
  {
    type: RECEIVED_DOMAIN,
    response,
  }
);

export const queryDomainEpic = action$ => (
  action$.ofType(QUERY_DOMAIN)
         .debounceTime(1000)
         .mergeMap(action =>
           ajax({ url: ENDPOINT, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: action.payload })
           .map(result => receivedDomain(result.response)),
         )
);
```

基本上跟一般的 Redux 沒有太大的差別，比較特別的是以 `Epic` 結尾的這個動作，這個就是 `redux-observable` 所提供的特殊 Action 行為，可以把它視為 Action 的管理者。

裡面的實作則是透過 RxJS 所實現的，簡單說就是碰到 `QUERY_DOMAIN` 類型的動作，先等待 1000ms 確認沒有其他操作後，用「最後一次」的操作繼續，並且合併另一個動作（Ajax 查詢）繼續進行。

此時的 `QUERY_DOMAIN` 被觸發後，會再等待被合併的 Ajax 查詢完成後才一起回傳。而這個 Ajax 查詢則是我們要做的 GraphQL 查詢。

接下來把焦點放到查詢畫面的元件上，這邊我們只討論做 Dispatch 的這個動作。

```js
  componentDidMount() {
    this.props.dispatch(startRequest('{domains { description, price, currency }}'));
  }

  onSearchChange() {
    const tld = this.text.input.value;
    this.setState({ search: tld });
    this.props.dispatch(
      startRequest(`{domains(tld: "${tld}") { description, price, currency }}`),
    );
  }
```

實際上也是很淺顯易懂的，在前面的 Action 中我們是採取直接將整個 GraphQL 傳入的方式，所以在觸發動作時也是直接將查詢寫到裡面。

> 還不熟悉 Redux 綁定輸入框的方式，因為有點晚了所以直接用 `ref` 的做法做綁定。

到這邊眼尖讀者可能會發現，我們並沒有去呼叫 `queryDomainEpic` 但是似乎卻自己運作起來了，這部分是 `redux-observable` 的特性，也就是說我們將呼叫實際動作的任務交給 `Epic` 來管理。

最後要統整一下所有的 `Epic` 整合到 Redux 裡面（跟 Reducers 類似）

```
const epics = combineEpics(queryDomainEpic);
const epicMiddleware = createEpicMiddleware(epics);

const store = createStore(
    applyMiddleware(epicMiddleware),
    reducers
);
```

接下來就會正常運作了！

---

其實這樣的進度大約花了快一天左右的時間，雖然中間有跑去設定 `pry` 跟打遊戲之類的，不過整體上來說要反覆的把 Redux 練熟之外，還要掌握 GraphQL 的應用，也是要花上不少時間在上面的。

不過學技術就是這樣，當原本的技術熟悉到一個程度後，做起來當然是非常熟練的。不過如果不願意花時間在新技術上，就會一直沒辦法便的熟練，雖然目前有遊戲跟很多坑的關係，其實也不太能練新技術。但是有機會的話，還是會想在各種專案上做一些嘗試，來看看自己到底能做到怎麼樣的效果。

這篇文章大多是省略了查文件就可以做到的部分，所以看起來挺簡單的。不過要查完文件後再踩雷之後做出來，倒也是一件不太容易的事情。不過 Rails 5.1 提供了 Webpack 環境以及一些好用的 Gem 倒是大大改善不少在這部分所浪費掉的時間。

雖然沒有如預期的完成到最基本可以購買域名，但是整體上來說倒是累積了不少經驗。

