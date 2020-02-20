---
layout: post
title: '網站開發之路 - Vim(1)'
date: 2012-03-26 21:24
comments: true
tags: 
---


作為起始，我決定先把 Vim 練好。

理由，很簡單。
>相較於 IDE 來說，使用 VIM 可以盡量避免離開 Terminal 的操作。
基於這點，我覺得可以改善我常常用 Ctrl + Tab 切換視窗來回操作的問題。

<!--more-->

作為起始，我先學習了一些基本操作。

> :q **離開**
> 
> :w **儲存**
>
> :e 檔名 **編輯**
>
> i 插入模式（目前字元）o 新行插入 a 目前字元後插入

學會這些後，基本上的編輯就沒什麼問題了！
不過，這樣還是體現不出 Vim 的強大。

於是，花了半天的時間開始安裝一些 Plugin 等等。所謂的 Vim 的強大，這時候才明顯的體現出來！

過去我都不知道一個搭配好的 Vim 可以跟 IDE 一樣好用，而且還是內建的編輯器，許多問題都可以輕鬆的解決。

雖然還不能熟悉使用各種 Vim 的指令、快速鍵。但是我還是盡可能的把一些記起來。

> :set **設定**
>
> G **跳到檔尾**
> 
> gg **跳到檔首**
>
> dd **刪除整行**
> 
> x **刪除一個字**
> 
> Ctrl + w > h/j/k/l **切換視窗**
>
> h/j/k/l **左/下/上/右**
>
> :sp/:vsp **分割新視窗**
>
> :tabnew **新增Tab**
> 
> v **選取**
>
> "[a]y **儲存選取到暫存區a**
> 
> "[a]p **貼上暫存區a到文件**

實際上操作起來真的還有很多需要學習。

經過一番折騰，大致上習慣了 Vim 操作與編輯文件，也稍微配置出了一套自己的常用 Plugin 跟設定檔。

![https://i.imgur.com/KDluE.png](https://i.imgur.com/KDluE.png)

不過，在 Terminal 下的色調總是怪怪的。
怎麼配也是弄不好，在我努力尋找配色方案時，有高手分享他的 Vim 配置。

早上就先照著 Github 上的說明安裝了，步驟也很簡單，就是 git clone 下來後運行 Shell Script 更新 Plugin (從 Github 上) 接著建立連結（.vim / .vimrc / .gvimrc）就完成了！

不愧是高手的配置，用起來不但很順，而且還很合用。
不過因為我自己還有網頁跟寫 PHP 這套比較像是配給 Ruby/Rails 的設定還是不太夠我的需求，經過觀察發現 plugin 的加入方法後，就在加了像是 Zencoding 跟 Neoautocomplcache 的 plugin 進去。

到目前為止，我的 Vim 配置已經告一段落。雖然熟悉使用 Vim 還有很長的一段路，但是至少已經有一套不錯的工具了！

![https://i.imgur.com/DXOSK.png](https://i.imgur.com/DXOSK.png)

也順便給 Terminal 的配色修改了一下，感覺起來自己好像也變威了！
不過，雖然有 Autocomplete 的 Plugin 不過相較 IDE 其實也是遜色很多，希望能夠純熟使用 VIM 之外，也能將許多程式撰寫上該記起來的東西記起來。

趁現在還有本錢，多累積一些實力！ 

---

我使用的是**高見龍**大大的 Vim 配置。
網址：[https://Github.com/kaochenlong/eddie-vim](https://github.com/kaochenlong/eddie-vim)
