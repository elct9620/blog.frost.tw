---
title: 在 PostgreSQL 中使用遞迴查詢來找尋父節點
date: 2017-10-23 18:00:00
tags: [PostgreSQL, 筆記, 資料庫]
---

老爸的公司在去年設計了一個紅利積點的消費回饋機制，裡面採用了樹狀的結構。用來改善傳統多層次傳銷造成的下線提供好處給上線，而下線卻需要去找更多下線來獲取回饋的異常機制。

不過這個設計有一個問題，就是他比傳統的樹成長的速度還會再更快些。也就表示在 Rails 裡面現有用來解決樹狀結構的一些套件並不適合使用。

<!--more-->

建構一個樹狀結構，一般在資料庫中會這樣設計。

|id|name|parent_id|
|--|----|---------|
|1 |Jimmy||
|2 |John |1|
|3 |Alice|1|
|4 |Alex |2|

在指查詢一代的情況下，可以直接使用 Rails 的 `belongs_to` 和 `has_many` 來解決。

但是如果想知道 `Alex` 的父代有哪些，就必須先找到 `John` 再繼續往回找。

```ruby
def ancestors(user, path = [])
  return path if user.parent.nil?
  path << user.parent
  ancestors(user.parent, path)
end

ancestors(User.find_by(name: 'Alex'))
# => [User<@name="John">, User<@name="Jimmy">]
```

很明顯的，這會執行 N 次的 SQL 查詢，稍微有經驗就會注意到這樣是非常沒有效率的。

於是，就會出現幾種常見的解法。

* Adjacency List
* Path Enumeration
* Nested Sets
* Closure Table

關於上述這幾種解法的說明，可以參考 Percona 這[這份簡報](https://www.slideshare.net/billkarwin/models-for-hierarchical-data)。

## Closure Table

在 Rails 中，速度最快的是 Closure table 這個解法，可以使用 `closure_tree` gem 來實作，不過在文章一開始描述的情境，卻是一個噩夢。

* 每個交易是一個節點
* 回饋會往上追溯（但不往下）
* 節點的世代增長會很快
* 樹可以無限成長

而 Closure table 是空間換時間的方法，所以假設當發展到 300,00 代的時候，因為 Closure Tree 會把每一個節點跟所有父代做一次關聯來加速查詢，所以在第 300,00 代基本上是需要插入 `300,00 - 1` 條紀錄的。

所以，這個解法會在後期出現效能貧頸。

## Path Enumeration

在 PostgreSQL 內，有一個叫做 `ltree` 的 Extension 可以使用。

因為紅利回饋的往回追溯會有極限制，畢竟是基於交易的金額來計算可用的回饋，所以受到影響的父代是有限的。

在 Path Enumeration 的特性中，是利用建立「路徑」來記錄的。

|id|name|path|
|--|----|---------|
|1 |Jimmy||
|2 |John |Jimmy|
|3 |Alice|Jimmy|
|4 |Alex |Jimmy.John|

也就是說，當 `Alex` 想知道有多少父代只需要從 `path` 這個 `ltree` 類型的欄位下查詢就可以了！

這個解法看起來一切完美，但是卻有一個問題。

> 欄位的內容有上限，也就是說當發展到一定的世代到達極限後，就無法再繼續下去。

這很適合用來儲存多層的文章分類，但是卻不適合無限成長的樹。

### 限制世代數

不論是 Closure Table 或者 Path Enumeration 的情況，其實只要限制紀錄的世代數就可以解決這個問題。

> 畢竟追訴的世代有上限，只要存需要的部分就好了！

這個方法聽起來不錯，不過對 Path Enumeration 來說，當 Path 不完整的時候，查詢就會失去準確度（無法用標準的 Path 查詢去問路徑）

至於 Closure Table 看似這樣做是沒有問題的，但是一樣會失去關於深度的正確數值。

在考慮一些細節之後，發現這並不是恰當的方法。

## Adjacency List

回到 Adjacency List 的方法上，在 Rails 中使用會產生類似下面的 SQL 查詢。

```sql
SELECT * FROM users WHERE id = 4;
SELECT * FROM users WHERE id = 2;
SELECT * FROM users WHERE id = 1;
...
```

一般來說我們應該用 `WHERE id IN(1, 2, 3)` 來查詢才對。

在這邊 PostgreSQL 提供了叫做 Recursive Query 的功能，官網的範例長這樣。

```sql
WITH RECURSIVE t(n) AS (
    VALUES(1)
  UNION ALL
    SELECT n+1 FROM t
    WHERE n < 100
)
SELECT sum(n) FROM t;
```

然後就可以做出 1 + 2 + ... + 100 的效果。

在 Ruby, PHP, JavaScript 等語言中，遞迴已經不容易理解，在 SQL 中實現這件事情，其實也並不容易。

先來理解一下範例的意思。

```sql
WITH RECURSIVE 遞迴結果表(回傳欄位) AS (
    初始值
  UNION ALL
    遞迴查詢
)
SELECT * FROM 遞迴結果表;
```

也就是說，官網範例的 SQL 是給了初始值 `1` 並且不斷的 `SELECT n + 1` 後重新呼叫自己，直到 `n < 100` 才停止。

### 建構 SQL 查詢

接下來，以這張表來建構查詢。

|id|name|parent_id|
|--|----|---------|
|1 |Jimmy||
|2 |John |1|
|3 |Alice|1|
|4 |Alex |2|

按照前面的原則，撰寫下面這張表。

```sql
WITH RECURSIVE ancestors(id, parent_id, name) AS (
    SELECT users.id, users.parent_id, users.name
    FROM users
    WHERE id = 4
  UNION ALL
    SELECT users.id, users.parent_id, users.name
    FROM users
    JOIN ancestors ON ancestors.parent_id = users.id
)
SELECT * FROM ancestors;
```

如此一來我們就會得到如下的結果

|id|parent_id|name|
|--|----|---------|
|4 |2   |Alex|
|2 |1   |John|
|1 |    |Jimmy|

首先，我們將 `id = 4` 的 Alex 選出來，作為第一筆資料。

> 實務上，應該是將 John (`id = 2`) 直接帶入（父代預設不包含自己）

接下來，我們的下一筆資料的 `users.id` 必須等於上一筆資料的 `users.parent_id` 才行。

這邊簡單的使用 `JOIN` 將 `ancestors` 跟現有的 `users` 連接起來。

> `JOIN ancestors ON ancestors.parent_id = users.id` 可能會讓你有點疑惑。
> 這邊的 `ancestors` 是指「上一個找到的父代」也就是說上面這句 `JOIN` 查詢，是找下一個父代的查詢，用上一個的父代 `id` 去比對是意思正確的。

至於效能上，目前在 800,00 rows 狀態下，用 `JOIN` 還是單純 `FROM users, ancestors` 是差不多的耗時跟解析 SQL 之後可能還需要多觀察是否有改進空間。

> 相對於 Closure Table 還是慢上不少。

### 轉換成 Model

既然是使用 Rails 的專案，那麼就需要封裝成 Model 的方法才行。

在這之前，我們要先知道幾個前提。

* `WITH RECURSIVE ancestors(...) AS (...)` 裡面給的欄位，是回傳的欄位。
* `UNION` 所 `SELECT` 的欄位必須一至，不可使用 `*` 符號。

因為有以上的限制，我們的 Model 會呈現這樣的狀態。

```ruby
class User < ApplicationRecord

  def ancestors(max_depth: 10)
    return_columns = User.column_names.join(', ')
    select_columns = column_names_for_recursive_query.join(', ')
    table_name = User.table_name

    query = <<-SQL
      WITH RECURSIVE ancestors(#{return_columns}, depth) AS (
        SELECT #{select_columns}, 1
        FROM #{table_name}
        WHERE #{table_name.id} = #{parent_id}
      UNION ALL
        SELECT #{select_columns}, depth + 1
        FROM #{table_name}
        JOIN ancestors ON ancestors.parent_id = #{table_name}.id
        WHERE depth < #{max_depth}
      )
      SELECT * FROM ancestors ORDER BY depth
    SQL
    User.find_by_sql(query)
  end

  private

  def column_names_for_recursive_query
    @column_names ||= User.column_names.map |name|
      [User.table_name, name].join('.')
    end
  end
end
```

如此一來，我們就可以用 `User.last.ancestors` 取得對應的 Model 物件回傳。

不過，上面的查詢也還有不少限制，像是無法繼續加上 `order` `limit` 等其他透過 ORM 產生的 SQL 查詢。

## 總結

其實整體看下來，所謂樹狀的結構解法，是要看當時的情境。

以文章一開始的案例來看，選用 Adjacency List by SQL 的方式最為適合，理由如下。

* 產生節點要快
* 世代只會不斷成長
* 樹狀結構的追溯有上限
  * 每個節點只會運行一次追溯

以這個案例來看，耗費在 `Recursive Query` 的成本每個節點只有一次，相比 Closure Table 會因為世代成長造成的消耗，或者 Path Enumeration 的儲存限制，這個成本是很低的。

> 下一步是封裝成 Concern 方便取用，畢竟這類型的系統有時候很仰賴樹狀結構的查詢。

另外，樹狀結構比較常拿去查詢子代，畢竟子代數量不確定的時候非常難以管理。

