---
title: 用 CloudFlare Workers 製作簡單的 Uptime Status 頁面
publishDate: 2019-07-09 19:09:08
tags: [CloudFlare, JavaScript, DevOps, Ruby, NoSQL]
thumbnail: https://blog.frost.tw/images/2019-07-09-build-a-simple-uptime-status-page-use-cloudflare-workers/thumbnail.png
---

最近跟朋友弄了一個透過 Chatbot 做出手遊效果的專案，沒出什麼意外的話大概能在九月看到一個雛形。不過既然是手遊類型的遊戲，更新資料跟維護其實就會遇到一些困難點。

如果是線上遊戲或者手遊，大多數只要在公告後把玩家切斷連線然後升級過程中避免玩家連上就好。不過因為是 Chatbot 所以除非能做到不停機升級，不然是很困難的。
如此一來，讓玩家知道遊戲（機器人）正在更新，處於無法使用的狀態，就是一個重要的關鍵。

<!--more-->

不過因為算是業餘的作品，玩家數量可能也不會到預期的那樣多。最簡單的方法就是開一個網頁，或者把流量都倒去一個暫時的伺服器就可以。
直覺想到的就是利用一些 Uptime Monitor 服務的狀態頁面，不過市面上能選的不多，有些方案即使最簡單的也要 $20/月，其實對小專案來說不太划算。

> 其實還是有不少服務商能選，不過因為用量可能小到不忍直視就放棄這個念頭。

## 需求分析

回來思考我們的需求，其實很簡單：

1. 伺服器出現任何問題時還能被查詢
2. 只需要最基本的正常或不正常的狀態呈現

這種時候其實可以考慮人工用 GitHub Pages 的方式人工更新，不過身為工程師還是會想要偷懶一點，看看有沒有辦法自動化。

## CloudFlare Workers

評估了一下這類 Uptime Mointer 服務，做法都是簡單地去戳某個網站看看是否正常。不過因為只需要知道伺服器是否還在線上，所以直接由伺服器回報狀態其實也是個不錯的方法。
考量了像是 AWS Lambda / GCP Cloud Functions / Firebase 等等選項，意外想到 CloudFlare Workers 也許是一個選擇。

其實大家都很清楚使用雲端服務的花費是相對高的，但是整個服務互相串連整合的方便性就很難是一般虛擬主機服務可以比擬的。

不過像是簡單的應用情境，用一些簡單的服務反而能在性價比上得到一個不錯的結果。以 CloudFlare Workers 來看，光是基本的服務用量其實就足夠我們使用。
但是要保存狀態，所以我們還需要儲存資料的地方，而 CloudFlare Workers KV 也剛好提供了類似 NoSQL 的 Key-Value 儲存機制。

以花費來看，每個月 $5 美金可以換到 1000 萬次的請求額度，跟至少 10 萬次寫入以作為 Uptime Status 服務來說，基本上要監控上百台機器都沒問題。

> 不過上百台機器的話，還是乖乖買服務比較實在⋯⋯

## 實作

至於實作非常簡單，不過就是剛好因為 CloudFlare 正在改這個服務，所以 UI 有點混亂，要先做好以下的設定。

1. 付費啟用 CloudFlare Workers Pro 方案
2. 到任一一個 Domain 下面的 Workers 分頁啟用 KV 功能

### 產生 Namespace

我們可以把 CloudFlare Workers KV 當作是一個超巨大的 Key-Value 儲存庫，而我們要在自己的資料庫下面切出一個區塊來存放特定資料。

> 正確啟用後不用透過 API 直接在後台手動新增，拿到 Namespace Key 就好，會比打 API 方便很多

### 上傳資訊

因為是 Ruby on Rails 專案，所以我簡單的封裝了一個物件讓我的 Rake Task 可以透過呼叫這個物件上傳伺服器的狀態。之後搭配 Whenever 就能以每分鐘的頻率去回報資訊。

```ruby
class Updater
  attr_reader :hostname

  API = 'https://api.cloudflare.com/client/%<version>s/accounts'
  ENDPOINT = '/%<account>s/storage/kv/namespaces/%<namespace>s/values/%<node>s'

  def initialize
    @node_name = ENV['NODE_NAME'] || Socket.gethostname
  end

  def update!
    Net::HTTP.start(uri.host, uri.port, use_ssl: ssl?) do |http|
      http.request request
    end
  end

  def request
    request = Net::HTTP::Put.new(uri)
    request['X-Auth-Email'] = ENV['CF_EMAIL']
    request['X-Auth-Key'] = ENV['CF_TOKEN']
    request.body = body.to_json
    request
  end

  def ssl?
    uri.scheme == 'https'
  end

  def uri
    @uri ||=
      URI(format("#{API}#{ENDPOINT}", options))
  end

  def options
    {
      version: 'v4',
      account: ENV['CF_ACCOUNT_ID'],
      namespace: ENV['CF_NAMESPACE_ID'],
      node: @node_name
    }
  end

  def body
    {
      status: :online,
      timestamp: Time.now.to_i
    }
  end
end
```

這段實作只是很簡單的 HTTP Client 而已，最重要的主要是要把 `timestamp` 上傳上去，我們才能夠過這個時間戳記去推斷最後一次有反應是什麼時候。

> 理論上關機或者停止這個指令，就不會被更新伺服器狀態上去。不過這實際上還是不太精確的，應該包含像是 CPU 和記憶體的資訊，才能知道伺服器是否過度忙碌而無法提供服務。

### 回傳資訊

接下來我們就利用 CloudFlare Workers 來把存進去的資料抓出來呈現，如果有興趣綁定到特定 Domain 之類的，請利用他的 CLI 工具設定好之後，再繼續操作。

> 主要是目前 KV 功能還無法用 CLI 工具設定，會互相蓋掉（而綁定 Domain / Path 則是都得靠 CLI 工具）

```ruby
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

/**
 * Fetch and log a request
 * @param {Request} request
 */
async function handleRequest(request) {
    // Response as JSON
    let responseInit = {
        status: 200,
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        }
    }

    // Find all request nodes
    let url = new URL(request.url)
    let nodes = url.searchParams.getAll('node[]')
    let status = await getAllNodeStatus(nodes);

    return new Response(JSON.stringify(status), responseInit)
}

// Read nodes status from KV
async function getAllNodeStatus(nodes) {
    let status = {};
    await Promise.all(nodes.map(async (node) => {
        var nodeStatus = await Status.get(node, 'json');
        if (nodeStatus) {
            status[node] = nodeStatus
        }
    }));
    return status;
}
```

因為會有多個服務，所以我設計了一個很簡單的機制去抓取 GET 請求的 Search Params 然後把抓到的 Hostname （當作 Key 的數值）拿去問 Store 是否有存過 JSON 資訊，然後把它組合成新的 JSON 回傳出來。

### 顯示資訊

接下來就是隨意的做一個頁面，把狀態呈現出來。
因為是很前期的東西，所以我先找了一個 Open Source 的佈景，然後用 Jekyll 部署到 GitHub Pages 上。

```js
(function(){
  var STATUS_API = 'https://status.basaltic.tw/api/status.json';
  var $nodes = document.querySelectorAll('.node')
  var nodes = {}
  var uri = new URL(STATUS_API)

  // Load Nodes on Page
  $nodes.forEach(function(node) {
    var hostname = node.dataset.hostname;
    // Cache DOM
    nodes[hostname] = {
      $el: node,
      $color: node.querySelector('.legend__color'),
      $status: node.querySelector('.legend__value'),
      hostname: hostname
    };
    // Add for Query
    uri.searchParams.append('node[]', hostname);
  });

  var currentTime = (new Date()).getTime() / 1000;

  // TODO: Refactor
  fetch(uri)
    .then(function(res) { return res.json() })
    .then(function(statuses) {
      var node = {}
      var $color = null;
      var $status = null;

      for(var hostname in statuses) {
        node = statuses[hostname];

        if ( node && nodes[hostname] ) {
          $color = nodes[hostname]['$color'];
          $status = nodes[hostname]['$status'];

          // Online
          if ((currentTime - node.timestamp) / 60 <= 5) {
            $color.style.cssText = "--color: var(--color-online)";
            $status.innerText = "Online";
          } else {
            $color.style.cssText = "--color: var(--color-offline)";
            $status.innerText = "Offline";
          }
        }
      }
    });
}())
```

主要是這段 JavaScript 我們利用 `data-` 這類 Data Attribute 去把想顯示的 Hostname 抓取出來，然後統一發一次 API 請求出去查詢。

> CloudFlare Workers 有查詢限制 10ms (Free) 50ms (Pro) 但是以 Key-Value Store 來說一次查幾百個大概都沒什麼影響吧⋯⋯

## 總結

大家想看成果的話可以到 [Basaltic Studio Status](https://status.basaltic.tw/) 這個頁面看看，這是我以前大學跟朋友做畢業專題的團隊名稱（Basaltic Studio）至於前面的兩段程式碼都放在 [Gits](https://gist.github.com/elct9620/fc1c75ac7fb9a447bbd1993e840e8eba) 不過直接複製文章的也沒問題就是了。

前幾天剛好跟同事聊到，不是用技術去解決問題，而是要看問題選對的技術去解決。雖然說起來很簡單，不過對工程師來說大概是很困難的。所以最容易做好的就是有技術就玩，別太糾結在「去解決某個問題」這件事情，而是要去了解技術的性質，在未來碰到問題的時候有「解決問題的方案」

以這個小東西來說，大部分時候都是沒用的。不過這也讓我了解 CloudFlare Workers 的應用，而且變化起來其實還能做不少事情。像是 Servier Discovery 其實就跟這個機制很像（服務回報自己節點資訊，給其他人查詢）在某些奇怪的應用狀況下，說不定也是個可以應用的方向（不過我猜不會有人會想把這個功能丟在第三方服務上⋯⋯）
