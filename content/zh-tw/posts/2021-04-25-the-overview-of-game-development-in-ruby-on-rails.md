---
title: "淺談用 Ruby on Rails 開發遊戲"
publishDate: 2021-04-25T12:01:25+08:00
date: 2021-04-25T12:01:25+08:00
tags: ["Ruby", "Ruby on Rails", "遊戲", "心得"]
toc: true
thumbnail: https://blog.frost.tw/images/2021-04-25-the-overview-of-game-development-in-ruby-on-rails/thumbnail.jpg
credit: 攝影師：Anete Lusina，連結：Pexels
---

最近剛好被人問到使用 Ruby on Rails 應該如何開發遊戲，因為是個很有趣的題目所以就利用週末的時間來簡單討論一下這個問題。雖然是以 Ruby on Rails 作為案例，不過這些經驗大致上是適用於所有程式語言的。

<!--more-->

## 迷思{#myth}

在開始之前我想先討論一個問題——我該用什麼語言去開發遊戲？

當我們思考這個問題的時候，有很高的機率會卡住而且一直沒辦法去做出想做的東西。這個道理適用任何情境，不論是遊戲開發、網站開發甚至料理等等，當我們給自己訂下了「框架」之後就很難離開這個框架，也因此讓原有的可能性消失。

所以我給的建議是「如果沒有 Ruby on Rails 的參考資料，就去看其他語言的！」

我們先不討論伺服器跟客戶端的差異，但是大多數語言像是 C/C++、Ruby、Python、C#、Golang 都存在用於開發遊戲的專案，語言、框架從一開始就不是問題，選擇使用某個語言或者框架不外乎是「適合」的問題。

這幾年我對程式技巧的理解是從「多做」到「多變」到「提煉」再更進一步的則是「適合」的使用，他剛好對應著初學者的多練習，熟悉之後要能夠帶入自己的想法變化，接著將多餘的動作去除，最後當我們理解了商業上的考量後，選擇最為適合的方式去實踐。

因此，我們討論用 Ruby on Rails 開發遊戲從一開始就沒有意義，我們應該討論的是「遊戲的程式該怎麼設計」

## 卡牌遊戲{#the-card-game}

會用 Ruby on Rails 當前提討論，通常不外乎是跟手遊、卡牌類型的遊戲有關，以大部分的情境來看這類手遊扣除掉連線的部分，基本上就是一個 API Server 的實現，使用開發 Web 的框架搭配 HTTP 協定來設計，確實會讓開發容易、快速很多。

因為被問到的問題也是跟卡牌遊戲相關的，因此後面的文章也會以此為基礎來討論。

## 架構{#architecture}

一個卡牌遊戲會需要怎樣的結構呢？如果我們單純以 Model-View-Controller 的角度去思考，就會落入被框架限制住的陷阱。我在 [Ruby World Conference 2019 的演講](https://2019.rubyworld-conf.org/en/program/#a-6-2)就是在討論用 Ruby on Rails 去開發一款 Chatbot 的遊戲中如何突破框架。

後續的例子我們就用「卡牌收集」跟「發動技能」兩個角度來看，在 Ruby on Rails 中我們應該如何去組織出對應的功能實現。

## 遊戲資料{#game-data}

在單機遊戲中，場景、怪物的設定值都是固定的，大多數的遊戲引擎會用 Prefab（預製物件）來規劃，不過現在我們要在手遊之中使用，我們可以將這些資訊放到一個檔案在伺服器啟動時讀取，也可以放到資料庫中儲存。

不過大多會選擇放到資料庫中儲存，是因為當資料量變得龐大時能以比較有效率的方式啟動伺服器以及查詢資料，同時也可以跟遊戲紀錄產生關聯。

> 也因此我們會有 GameData（遊戲資料）跟 GameRecord（遊戲紀錄）兩種資料表同時存在於資料庫，同樣的概念在其他類型的服務也能被觀察到，像是 AWS 的 EC2 型號，很有可能會是有一個資料表儲存了該分配的 vCPU / RAM 等資訊，當我們呼叫時再依照設定值生成。

## 物件導向{#object-oriented}

既然使用 Ruby 來進行開發，我們要思考的就會是「物件導向」在遊戲中扮演的角色為何。此時設計模式（Design Pattern）就是個很好的案例可以被討論，不過當我們思考「該如何使用時」就會再次陷入被框架限制的問題，也因此我們應該是去驗證「當下的設計是否有設計模式幫助我們可以改進」

假設有一個模式是討伐魔物，我們需要依據玩家的「卡牌」生成專屬玩家的卡牌數值，以及玩家所需要對應的「魔物」並且讓雙方進行戰鬥，我們該如何進行呢？

以下是一段假想的範例

```ruby
class BattleActionController < ApplicationController
  before_action :load_battle
  before_action :load_monster
  before_action :load_player

  # 玩家行動
  def create
    @battle.perform(@player.current_card, params[:action])
    @battle.perform(@monster, @monster.random_action)
  end
end
```

在上述的程式中，我們雖然大多是以 ActiveRecord 提供的 API 進行操作，但實際上已經滿足了「工廠模式」的標準，我們以「資料庫的設定值」產生了「玩家和魔物的實體」這樣的概念，同時在這些物件上面定義了可以使用的「行為」

> 從遊戲資料的角度來看，其實就跟 Prefab 會被生成實體的概念一樣，「工廠模式」其實就是對應這樣的情境，但我們不需要思考怎麼使用，而是依照邏輯不斷改進最後自然而然就會符合工廠模式。

## 服務物件{#service-object}

如果對於 Ruby on Rails 有一定程度的了解，那麼勢必會學到使用像是 Service Object、[Form Object](https://blog.frost.tw/posts/2019/05/28/How-to-use-Form-Object-and-others-for-Rails/) 這類技巧用於解決專案中逐漸複雜的情境。

實際上我對於 Service Object 的看法是「所有無法或不足以獨立的物件類型」像是呼叫某個第三方服務，他只需要一個物件就可以處理，因此我們就會用 `Payment::CaptureService` 之類的方式去定義，但是當某一種類型的行為多到一個程度的時候就應該考慮讓他成為獨立的類型，像是 Form Object 這樣單獨存在於 `app/forms` 而不是 `app/services`

同樣的道理也可以應用在遊戲的設計中，當我們的「卡牌動作」不是單純的攻擊、防禦，而是根據 GameData 的設定有不同的技能，而且難以「標準化」的時候，就應該單獨歸類出某一個體系的物件來彙整跟設計。

### STI{#single-table-inheritance}

STI（單一資料表繼承）的技巧在很多 Ruby on Rails 的教學通常都會說「通常不推薦使用」不過在某些情況下卻是非常好用的，像是我們現在要討論的「技能系統」

首先，在資料庫建立像是這樣的 GameData (`skills`)

| id | name | level  | type            | element | power | parameter        |
|----|------|--------|-----------------|---------|-------|------------------|
|1   |攻擊   | 1     |Siklls::Damage   | void    | 1     |
|1000|火球術 | 1     |Skills::Fireball | fire    | 5     |
|1001|火球術+| 2     |Skills::Fireball | fire    | 10    | { "burn": 10 }
|2001|冰箭術 | 1     |Skills::IceArrow | water   | 3     |
|2002|冰箭術+| 2     |Skills::IceArrow | water   | 11    | { "freeze": 5 }

在 Ruby on Rails 中會自動依據 `type` 欄位將 Model 轉換成對應的物件，因此我們就可以用 `app/models/skills` 增加物件來擴充技能

原始物件的傷害是直接套用 `power` 並且不會有減益效果

```ruby
class Skill < ApplicationRecord
  def damage
    power
  end

  def debuff
   []
  end
end
```

接下來我們用「火球術」的技能體系來看

```ruby
module Skills
  class Fireball < Skill
    def damage
      (Random.rand(70.0..130.0) / 100 * power).round
    end

    def debuff
      return [:burn] if burn?

      []
    end

    def burn?
      (parameter['burn'].to_i) >= Random.rand(0..100)
    end
  end
end
```

在這邊，我們對傷害實作進行調整，讓他會有正負 30% 的浮動，並且加入減益效果的判定讓他在設定的機率內對敵人產生「燒傷」的狀態。

放到戰鬥模組的實作，我們就可以像這樣處理

```ruby
class Battle < ApplicationRecord

# ...
def perform(character, action)
  skill = character.skills.find_by(id: action)
  foe_of(character)
    .apply_damage(skill&.damage || 0)
    .apply_buff(skill&.debuff || [])
end
# ...

end
```

我們先從「卡牌」身上取出帶有的「技能」並且 `action` 參數表示的是技能編號（Ex. `1` 攻擊、`1000` 火球術）取出對應的物件之後，直接呼叫 `#damage` 方法來計算出該次行動應有的傷害。
接著用 `foe_of(character)` 取出這次行動者的「對手」並且將傷害套用到對方身上。

這個技巧被應用在 2021 年度的 [Global Game Jam](https://globalgamejam.org/2021/games/final-hope-0) 我用 Ruby on Rails 和 Vue / AFrame 開發的 AR 遊戲中，定義[裝備](https://github.com/elct9620/ar-bottle-royale/blob/main/app/models/weapon.rb)就是物品的一種，並且使用時會「裝備」這個道具。

### 獨立物件{#standalone-object}

跟 STI 的情境基本上是差不多的，差別在於我們會將這類物件獨立劃分出來，像是 `app/skills` 的形式去處理，細節上跟 STI 基本上大同小異。優點是我們不會被 ActiveRecord 的限制阻擋住，缺點則是我們需要自己進行技能的查詢處理。

此時我們就可以善用 Ruby 這類語言的特性，做出類似 Reflect（反射）的效果

```ruby
def skill_class
  Skills.const_get(skill_name)
end
```

利用 `#const_get` 的機制從 `Skills` 模組撈出像是 `Fireball` 這類物件，並且自己產生實例和呼叫，從「技能」的角度來看就顯得非常繁複，但在其他情境可能會是乾淨簡潔的，這部分就需要由開發者自己判斷適合的使用情境。

## 總結 {#conclusion}

文章寫得有點長，不過很多技術上的問題大多是「思考的限制」造成的。即使是我自己在開發不同專案時，也很容易用過去的經驗去思考。這雖然可以加速「製作」的過程，但也可能會「錯過」更優的解決方案，一段時間重構、製作類似的新專案反覆驗證，就能夠一次次在開發的技巧上改進。

透過 Ruby on Rails 開發遊戲的伺服器本身並不困難，困難的是我們要先突破我們是在使用框架本身的概念限制。另外就是跟客戶端的搭配使用，像是卡牌、怪物要在客戶端顯示使用「編號」來對應 Prefab 會是一個很好的方式，但是編號的設定就會變成一件很重要的事情，除了技術本身之外也涵蓋了像是企劃等等領域的知識需要一起考進去才能夠順利進行。

