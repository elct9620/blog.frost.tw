---
title: 可維護的 CSS
date: 2017-03-05 00:47:33
tags: [CSS, 前端]
---

這週的 CSS Weekly 以及幾個前端相關的電子報都提到了叫做 [Maintainable CSS](http://maintainablecss.com/) 的專案，乍看之下還以為是討論可維護 CSS 專案的文章，沒想到是一種 CSS 框架。

幾年前 Responsive Web Design 和 Single Web Application 開始熱門起來的時候，大家也注意到網站使用的 CSS 逐漸複雜。所以開始有像是 OOCSS、SMACSS、BEM 等等理論出現，綜合來看這些技巧對於維護網站的樣式上都是很有幫助的。

會寫這篇文章是因為 Maintainable CSS 在很多地方上跟我自己使用的方式類似，而我目前採用的則是 SMACSS 跟 BEM 的混合版本，所以就打算來分享一下自己的經驗和技巧。

<!-- more -->

## 語意化

Maintainable CSS 第一個章節在討論使用「語意化」的情境，也就是該怎麼對元素的樣式做命名這件事情。

像是 `.col-md-12` 被分類在非語意化的類型，而 `.product` 則屬於語意化。就我自己的習慣，其實是偏向於語意化的，雖然說 `.col-md-12` 必須改寫成 `.column-medium-12` 或者 `.column-pad-12` 之類的形式，會要多打不少字，但是從結果上來看，原始碼的可讀性就會增加非常多。

關於「語意化」的應用實例，可以參考 [Semantic UI](http://semantic-ui.com/) 的應用，這套 CSS Framework 就是以語意化為前提所設計，可以從中學習到非常多語意化的範例。

至於是否要堅持完全的語意化，我個人是認為不需要的。畢竟很多情境都不是絕對的，如果太過於堅持這些地方的話，反而會變成干擾排版的障礙，在可容許的範圍內有一些例外狀況是沒有關係的。

## 重用性

第二個章節在討論重用性，不過我自己其實沒有很注重這部分，反而沒有太多的經驗可以分享。不過裡面提到了 SCSS 的 `mixin` 機制，確實是在重用性上非常有利的輔助。不過這部分是減少原始碼的使用，而個人認為真正的重用是對一些常用屬性的拆分，像是下面這樣的例子。

```scss
.centered {
  &.text {
   text-align: center;
  }

  &.block {
    margin: 0 auto;
  }
}
```

```html
<div class="red centered text block is-fixed-size width-80">
  Important Message!
</div>
```

不過在 `mixin` 的應用技巧上，如果純熟使用的話也能減少不少多餘的步驟，像是下面這樣。

```scss
@mixin button-skin($color) {
  @extend %button;
  background-color: $color;
}

.profile__link--button {
  @include button-skin($pattle-primary);
}

```

透過包裝 `mixin` 讓一些常用的樣式設定可以用很簡單的方式被套用。我自己最常用的是 Media Query 的情境，使用起來類似下面這樣。

```scss
.article__quote {
  width: 100%;

  @include at-screen($pad) {
    width: 75%;
  }

  @include at-screen($pc) {
    width: 50%;
  }
}
```

> 順帶一提，上面這種切 Breakpoint 的做法不一定是最好的，推薦閱讀 [The 100% correct way to do CSS breakpoints](https://medium.freecodecamp.com/the-100-correct-way-to-do-css-breakpoints-88d6a5ba1862?gi=2f6c0c5f72ef) 這篇文章，看看怎樣切割 Breakpoint 會更恰當。

## ID 的使用

關於這部分，如果使用像是 SMACSS 或者 BEM 之類的，其實就很少會碰到需要用 ID 選擇器的情境。一般我都用在切割 Namespace 或者例外處理。

```html
<section id="home" class="page">
  <aside class="profile">
    <div class="profile__avatar"></div>
    <div class="profile__information"></div>
  </div>
</section>

<section id="about" class="page">
  <aside class="profile">
    <div class="profile__avatar"></div>
    <div class="profile__information"></div>
  </div>
</section>
```

像是上述的情況，就可以利用下面的方式在 `#home` 的時候取消掉 `.profile__information` 的顯示，這部分用在套版上帶入通用的 Widget 時就很方便。

```scss
#home {
  .profile__information {
    display: none;
  }
}
```

> 使用 BEM 的好處是，在大部分的情況下 SCSS 都只會有一個層級。一般建議的 SCSS 層級是在 3 層以內，利用這個方式可以大大的減少層級的使用，並用來針對像是 `::after` `:hover` 這些情境使用。

## 架構

Maintainable CSS 到最後才討論這個問題，不過 SMACSS 最初會先講這個通西。主要是因為對於架構的區分會影響到後續的設計，如果架構規劃不完整的話，之後其實是很難區分的。

我自己目前使用的是 SMACSS 的精簡版本，畢竟大多數專案用不到這樣的情況。

* /stylesheet
  * application.scss
  * _variables.scss
  * _base.scss
  * /layouts
    * _home.scss
    * _about.scss
  * /modules
    * _header.scss
    * _footer.scss
    * _profile.scss
  * /mixins
    * _breakpoint.scss
  * /vendors
   * _normalize.scss

`application.scss` 其實只是集合 CSS 檔案的用途，裡面是不寫任何樣式的（同時也做排序安排正確的讀取順序）

```scss
// application.css

@import 'variables';

// Vendors
@import 'vendors/normalize';

// Mixins
@import 'mixins/breakpoint';

// Default Skin
@import 'base';

// Modules
@import 'modules/header';
@import 'modules/footer';
@import 'modules/profile';

// Layouts
@import 'layouts/home';
@import 'layouts/about';
```

先引用變數，再套用第三方的樣式到專案中。接著讓 Mixin 可以被後續的樣式使用，然後透過 `_base.scss` 先將預設的樣式（連結、表單這類）定義好，之後從模組開始定義，最後才是套用個別頁面的樣式。

其中把 Layout 放最後的好處就是 `id` 的使用，一般針對個別頁面設定 `id` 是相對容易的，也就是說覆蓋模組樣式微調去搭配排版的做法，也就可以相對容易地做到。

## 命名/模組

Maintainable CSS 分開討論，不過因為 BEM 的特性比較適合一起討論這件事情。

對 BEM 來看，所有的外觀都應該要自成一個模組。但是因為我在這之中使用了 SMACSS 的理論，所以其實是有著「通用模組」跟「頁面模組」的差異，不過實際上兩者並沒有太大的差別就是了。

一個模組會由 `Block` `Element` `Modifier` 三個部分所結合而成，命名規則就是 `.block__element--modifier` 這樣的形式，不過大家應該也會注意到缺少了表示 `State` (狀態) 的規則，關於這部分對 BEM 來說大多數都是透過 Modifier 來表示的，不過我個人比較喜歡利用獨立的樣式來表示，類似下面的方式。

```scss
.profile {
  // ...
}

.profile__details {
  &.is-expanded {
    max-height: auto;
  }

  &.is-collapsed {
    max-height: 0;
  }
}

```

而 Modifier 則用於額外情境的樣式設定，像是上面舉例的 `.profile__link--button` 的形式，針對原有外觀「改變」的做法才使用 Modifier 的方式。

> 至於是否要用 `is-` 開頭，則看情況而定。（像是 SCSSLint 選用 BEM 命名風格，這種寫法就會被抱怨 XD）

## 風格變化

Maintainable CSS 是透過 `.profile` 跟 `.profile2` 的方式來區分，如果是 BEM 的話其實採用 Modifier 就可以了。如果是全站樣式的變更，那就是針對架構上追加 `/themes` 目錄，然後針對不同風格做微調。

---

技巧上大致就是這些，透過這些技巧其實可以看出一些有趣的地方。

### Webpack

寫過 Vue/React 和用 Webpack 的話，應該都碰過一個 Component 裡面會把 HTML / JavaScript / CSS 一起寫進去的作法。其實我個人是不太喜歡這樣的做法，至少專案複雜起來這樣要管理對我的習慣其實反而不方便。

不過假設有需要（例如專案某個 Module 要抽出來當做多專案功用的元件）就可以直接從 `/modules` 下面把對應的模組拉出來，當作獨立的元件組到 Vue/React 裡面。

如果是這樣的情境，將 CSS 抽離專案管理我認為這才是合理的，不然大多數時候統一管理還是會比較節省力氣（不過也許對第一次接觸前端就學 Vue.js 的人來說反而相反也說不定）

### UIKit

國外的設計師後來其實也對這個情況改變設計習慣，以前在學校或者公司目前大多數的做法都是設計師把每一個頁面都設計好，在轉成前端的時候才做整理跟區分元件。

不過這樣就會有一個嚴重的缺點，那就是可重用性會變很低，除非是非常有經驗的設計師。不然大多數時候即使是相似的元件，也會在不同頁面上有細微的差異造成需要整個調整樣式。

也因此，如果專案允許的話，加入 Wireframe 的規劃並且在企劃期（後端討論技術細節以及跟客戶確認功能時）就做好 UIKit 的安排。改變設計流程為 Wireframe -> UIKit -> Mockup 就能夠有效的改善整體的開發。

專案基本上能獲得這樣的優點：

1. 同時產出 Styleguide （前端套版有統一依據）
2. 設計師調整版型速度加快（重排 UIKit 就可以）
3. 前端工作量減少（跟套 Bootstrap 差不多）
4. 調整樣式更容易

不過看似簡單實際上做起來卻很困難，有一種折衷的練習方式就是以 Bootstrap 當基底設計 UIKit 來做，設計模組大多是重設 Bootstrap 樣式，改變習慣時這個做法會比較沒有壓力一點。

> 不過說真的，用 Bootstrap 當基底卻有大量 Bootstrap 味道的網站樣式真是太多了，每次看到都倒抽一口氣。

---

開始上班後下班就很想耍廢，再加上時間也沒有多到可以一直學新技術，反而文章寫的變少。之後會盡力再多學點東西，然後分享出來給大家圍觀 XD
