---
title: Stripe 的 Idempotency Key 設計機制
publishDate: 2017-10-30 22:46:43
tags: [Ruby, API, 心得]
---

週末看到一篇 Stripe 工程師所寫的文章，是一篇關於 Idempotency Key （幂等鍵）的設計機制。因為是一篇非常棒的文章，而且裡面的概念除了可以應用在 API 設計之外，很多程式設計上需要解決的問題都可以透過這個概念來處理。

原文非常的長而且很詳細，這篇文章只會做簡單的重點整理。

有興趣的話可以打開[原文](https://brandur.org/idempotency-keys)來讀，是一篇很有用的文章。

> 作者是很厲害的工程師，部落格上的文章都是非常精實的技術文。

<!--more-->

在 API 的設計中，我們可能會遭遇到一些問題而讓操作失敗。像是`網路連線中斷`、`第三方服務異常`等等情況，此時就會需要客戶端進行重新嘗試的動作。

不過，如果是類似於 Stripe 這類金流服務，我們就不得不重視「重新呼叫」的問題，也就是「如果重複扣款」該怎麼處理，這就是 Idempotency Key 機制的由來。

> 目前中文對「Idempotency Key 」是叫做幂等鍵，而 Stripe 表示這是他們自己發明的詞，所以後面都以原文稱呼。

## Idempotency Key  是什麼？

所以 Idempotency Key 到底是什麼？簡單來說就是一種類似於 ID 的機制，用來區分某個 API 請求是同一個。

像是下面這個 API 請求，就會帶有 Idempotency Key 的 Header 來表示是哪個請求。

> POST /api/chargs
> ...
> Idempotency-Key: 0ccb7813-e63d-4377-93c5-476cb93038f3
> ...
> amount=100&currency=TWD

同時，也會透過驗證傳入的 `amount` 和 `currency` 等「參數」來確保同一個 API 請求的內容是完全相同的。

## 實際應用

[原文](https://brandur.org/idempotency-keys)中用「火箭背包版 Uber」的範例專案來實作，在 Stripe 的 Github 上面可以找到原始碼。

這個 App 會在你發射火箭後向你收費，中間會有幾個步驟。

* 產生駕駛紀錄
* 向 Stripe 呼叫收費 API
* 更新駕駛紀錄
* 透過 Mailgun 發送收據

加入 Idempotency Key 機制之後，則會轉變成這樣。

* 產生 Idempotency Key
* 產生駕駛紀錄
* 產生「駕駛紀錄產生」的操作記錄
* 向 Stripe 呼叫收費 API
* 更新駕駛紀錄
* 透過 Mailgun 發送收據
* 更新 Idempotency Keys

看起來多了一些東西，但是這些的影響是怎樣的呢？

> 原文有繪製成圖片，對照的時候會比較方便。

### Idempotency Key

首先，我們需要一個 Idempotency Keys 表來紀錄最近的 API 操作。

|Column|Type|
|----------|-----|
| **idempotency_key** | TEXT (max length <= 100)
| **locked_at** | datetime
| 
| **request_method** | TEXT (max length <= 100)
| **request_params** | JSONB
| **request_path** | TEXT (max length <= 100)
|
| **response_code** | INTEGER
| **response_body** | JSONB
| **recovery_point**| TEXT (max length <= 100)
| **user_id** | BIGINT

> UNIQUE INDEX (idempotency_key, user_ud)

PS. 上面只列了比較重要的欄位。

首先，我們要確定我們有一組 Key 他可能是 UUID 或者其他形式，因為是跟 `user_id` 綁定在一起的，所以實際上交給 Client 生成似乎也不影響 API 的操作。

接下來我們要儲存這次 API 操作的完整資訊，這是用來**確認是相同 API 操作**的保護機制。

最後是在這個 API 操作完成後，不論成功失敗都紀錄操作的結果。如果再次收到相同的 API 查詢時，我們可以回復完全樣的結果給這個呼叫者，達到快取的效果。

比較特別的是 `recovery_point` 這個欄位，為什麼會有這個欄位呢？

因為在前面我們可能會在 Stripe 扣款或者 Mailgun 發信時發生錯誤，此時就可以讓 API 從這一個操作步驟重新開始，而不會影響到原本已經成功地操作。

> 原文裡面有提到資料庫的原子性，而這個就是為了讓我們的 API 也擁有原子性。

### 其他資料表

主角  Idempotency Keys 介紹完之後，還有像是騎乘資料表、操作紀錄等等，就不另外介紹。

只是需要注意的是，被操作的「騎乘紀錄」表中，會對應某一個  Idempotency Key 來提供查詢，畢竟不一定是每一次的 API 操作都是一次性成功的，此時就要透過這個  Idempotency Key 來找回正在操作的騎乘紀錄。

> 反過來說，如果資料表上的  Idempotency Key 是有值得狀況下，就代表有其他人正在操作。也可以被視為一種「上鎖」的機制。

## 原子操作

原作提供了一個方法的實作，來輔助每一個原子操作。

```ruby
def atomic_phase(key, &block)
  error = false
  begin
    DB.transaction(isolation: :serializable) do
      ret = block.call
      # 根據 block 傳回值產生回應
    end
  rescue
     error = true
    # 處理各種錯誤
  ensure
      if error && key.present?
        begin
          key.update(locked_at: nil)
          # 操作失敗，解鎖
        rescue
          # 無法解鎖（記錄到 Log 中）
        end 
      end
  end
end
```

原文中定義了三種回應：

* NoOp - 不做事（初次產生）
* RecoveryPoint - 更新紀錄點（原子操作成功）
* Response - 回應（API 操作完全成功）

###  Idempotency Key 初始化

```ruby
key = nil
atomic_phase(key) do
  key = IdempotencyKey.find_by(user_id: current_user.id, idempotency_key: params[:key])
  
  if key
    # 1. 檢查 params 是否一致
    # 2. 檢查上鎖時間是否超時（時間內回傳操作中錯誤）
    # 3. 操作如果未完成，更新上鎖時間
  else
    # 產生新的 Idempotency Key
    # `locked_at` 是現在時間（因為是馬上開始操作，所以立刻上鎖）
  end
end
```

透過上述的程式碼，我們可以產生出一把需要使用的 key 供我們使用。並且在每次 API 呼叫時，確保上一次的 API 操作不會被影響，而運行過久的時候又可以透過從客戶端的 API 重新請求延續原本的操作直到完成。

### 後續操作

有了初始的 Idempotency Key 之後，就可以繼續把後面的 API 行為完成。

```ruby
loop do
  case key.recovery_point
  when RECOVER_POINT_START
    atomic_phase(key) do
      # ...
    end
  when RECOVERY_POINT_RIDE_CREATED
    atomic_phase(key) do
      # ...
    end
  when RECOVERY_POINT_FINISHED
    break
  #...
  else
    # 未知的 RecoveryPoint 丟出錯誤
  end
end

# 回傳結果
```

如此一來，我們就可以將每一個 API 的細部操作都切割成一個「原子」並且建構一個可恢復並且繼續運行的 API 了。

## 總結

這篇文章省略了不少細節，指把重點的部分拉出來討論，可以的話還是希望大家能去閱讀原文（雖然很長）

簡單來說，這個機制讓我們可以得到：

* 不怕重複呼叫的 API 服務
* 呼叫失敗也可以恢復運作
* 能夠有效的定位 API 運作問題發生的時機點

除此之外，文章最後還有提到一些像是「完成器」的技巧。

> 完成器是因為有些用戶端達到重試最大次數後，就會放棄運行。此時這些「即將完成」的操作就會變得無法完成，所以由伺服器定時拉出來重現 API 操作讓這個 API 操作得以完全完成。

另一方面，這個機制可以應用在很多地方。像是表單送出的時候，用來檢查是不是重複表單的送出等等，雖然是以 API 設計的方式呈現，但是背後的概念卻非常值得思考，我們如何讓程式能夠更加的健壯。

