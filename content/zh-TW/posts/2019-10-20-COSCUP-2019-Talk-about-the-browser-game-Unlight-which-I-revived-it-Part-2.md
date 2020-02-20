---
title: COSCUP 2019 - 演講後談復活的頁遊 - Unlight （二）
date: 2019-10-20 17:09:31
tags: [COSCUP, Game, Ruby, Golang, HTML5, JavaScript, DevOps, Docker, Unlight]
thumbnail: https://blog.frost.tw/images/2019-09-03-coscup-2019-talk-about-the-browser-game-unlight-which-i-revived-it/screenshot.png
---

寫完[上篇](https://blog.frost.tw/posts/2019/09/03/COSCUP-2019-Talk-about-the-browser-game-Unlight-which-I-revived-it/)後就開始員工旅遊、鐵人賽（[從讀遊戲原始碼學做連線遊戲](https://ithelp.ithome.com.tw/users/20065771/ironman/2734)）反而一直都沒有時間把下篇寫完，離 COSCUP 都已經過了一個多月自己都忘記還剩什麼沒有寫在文章裡面。

中間在鐵人賽的部分花了一些時間把目前理解到關於 Unlight 的一些基本設計整理出來，後面則是實作。至於近期也已經開始在搭建 HTML5 版本的底層設計，還有 mruby 的[整合](https://github.com/elct9620/mruby.wasm)（因為想提供 Mod 功能到遊戲中）等等東西都在進行中，十一月還要飛日本一趟參加 [Ruby World Conference](https://2019.rubyworld-conf.org/en/)，可以說是完全都閒不下來。

總之，讓我們在來看看 COSCUP 這場演講的後續吧 XD

<!--more-->

## 營運

前面基本上已經把整個遊戲能緊急處理的都做過一遍了，因此後需要繼續的明顯就是要怎麼讓遊戲可以持續的運作。最初基本上都是用看 Log 的方式在觀察玩家，連上線人數都要開一個 SSH 連線到伺服器刷 Log 來看，很明顯是不太 OK 的做法。

因此就開始評估有什麼解法比較適合，因為大量的改動不熟悉的程式碼（遊戲量很大）是一件危險很高的事情，尤其是雖然專案看起來有測試但是卻完全找不到。

所以最後決定的做法就是在某些特定檔案做小規模的修改，先以「增加監控」能力為主，因此我們先做的就是讓上線人數可以到 CloudWatch 上面被看到，至少能統計 DAU (Daily Active User) 來評估遊戲是否該做調整之類的。

解決方案也是簡單粗暴，因為只有 Auth Server 在連上的狀態遊戲才能正常遊玩，因此直接對 Auth Server 吐線上玩家統計 Log 的地方用同樣的方式 Hack 出一個定時把資料吐回 CloudWatch 的功能。

```ruby
                          EM::PeriodicTimer.new(60, proc {
                            begin
                              SERVER_LOG.info("AuthServer: [cloud_watch:] updated online number")
                              CLOUD_WATCH.put_metric_data({
                                namespace: 'Unlight',
                                metric_data: [{
                                  metric_name: 'OnlineNumber',
                                  dimensions: [
                                    {
                                      name: 'Hostname',
                                      value: ENV['SERVER_NAME'] || 'unlight.app'
                                    }
                                  ],
                                  timestamp: Time.now,
                                  value: AuthServer.class_variable_get(:@@online_list).size,
                                  unit: 'Count'
                                }]
                              })
                            rescue =>e
                              SERVER_LOG.fatal("AuthServer: [cloud_watch:] fatal error #{e}:#{e.backtrace}")
                            end
                          })
```

除此之外我們也盡量使用像是 Google Analytics 等工具追蹤一些我們額外掛上去的功能，不過受限於 Flash 很多東西還是追不到的狀態。

## 客製化

不過想要加額外的東西是會影響到我們目前在 [GitHub](https://github.com/open-unlight/legacy-unlight-docker) 公開的版本，這個版本是基於 CPA 釋出的原始碼建構並且修正一些有問題的小地方。如果去調整的話會造成所有人都需要跟我們使用一樣的架構。

但是這很明顯不應該出現在一個 Open Source 專案上，從設計的角度看也應該提供選擇才對，所以最後的作法就是增加一個 `customize` 目錄來放這些客製化的東西。

在 Docker 的建置過程中，我們可以使用多次 `ADD` 來加入檔案，如果是重複的檔案就會被覆蓋掉，利用這樣的特性就可以做到類似這樣的客製化調整。

```
原始 Gemfile -> 自訂 Gemfile -> 原始檔案 -> 自訂檔案
```

如此一來最後整合出來的專案就會是被客製化修改過的，利用這樣的特性我們就把 CloudWatch 的線上玩家監控，還有遊戲中透過 API 方式開放的課金道具商店給實作出來。

## Rack

不過在 Unlight 這樣的 TCP 專案上要怎麼擴充出 API 呢？因為本質上他還是一個 Ruby 專案，因此我們只需要時做一個符合 Rack 介面的標準就可以任意讓 Web Server 啟動他跑起來。實際上在這方面 Unlight 做得還算不錯，整體專案上分為幾個大區塊

* `model/` - 資料相關，通常會連接資料庫
* `controller/` 邏輯相關，遊戲的運作本體
* 其他大多是輔助的工具，還有比較特殊的是遊戲規則定義（Rule 目錄）

因為操作的部分已經被封裝到 Model 裡面，像是「發放給玩家一個道具」這樣的動作是封裝好的，因此我們可以在 API 透過這樣的方式直接發放道具給玩家。

> 在 Controller 裡面會是「檢查玩家是否符合條件，然後發放道具」的組合動作。

## 客服

這段基本上很難做，我們後來的作法就是搭配各種工具。像是 [Zendesk](https://help.unlight.com.tw/hc/zh-tw) 這類工具來提供玩家回報問題的地方，網頁右下角直接會有能回報錯誤的按鈕可以查詢 FAQ 或者回報問題。

內部的話則是用 Discord 和 Asana 等工具溝通跟討論下一階段更新要做什麼、有什麼事情要優先處理等等。

> 幫助按鈕後來改左邊，因為我們加上了 Discord Widget 讓玩家可以透過 Chatbot 在我們的玩家群組裡面發言而不需要登入或者註冊。

## HTML5

最後是 HTML5 改版，考慮到只有 WebSocket 可以使用的情況下勢必要去改伺服器來實現 WebSocket 不然就無法使用。不過運氣不錯的是這件事情剛好因為 Unlight 是使用 EventMachine 來處理 TCP 連線的，因此我把 WebSocket 套件加上去之後做一些簡單的修改，就勉強可以使用 WebSocket 來作為伺服器。

> Ruby 目前的 WebSocket Gem 是基於 EventMachine 開發的，因此在連線處理上幾乎沒有太大的變化。

不過還是缺失了不少功能，演講當時基本上就簡單分享了一下 WebSocket 的機制跟目前的進度。寫這篇文章的時候已經透過 Electron.js 製作桌機版讓 Flash 續命時間增加了一定程度，又發現能夠直接透過 Node.js 做 TCP 連線，因此目前的主力已經先轉移到將 HTML5 Client 開發出來後先直接使用原有伺服器來運行，等到 Client 穩定後再去修改伺服器的作法。

在這之前，因為 Unlight 的指令是很用 Byte 去組合而成的結構在 JavaScript 上也很難處理。因此又開了一個 [Go UL](https://github.com/open-unlight/go-ul) 的專案想利用 Golang 來解析，在轉換成 WebAssembly 整合到 JavaScript 上面來改善這方面的處理問題（SPR 的密碼加密計算用 Golang 也會比 JavaScript 容易處理，畢竟 BigInt 在 JavaScript 上也需要額外的支援）

## 後記

這場演講基本上算是一個過程上的紀錄，在短短一到兩週內的時間怎麼去讓一款遊戲可以運行、營運，以及我們是怎樣慢慢的改造跟重構一個古老的遊戲專案讓他變得容易維護。

不過實際上當時評估如果要繼續做下去的話，絕對是花上一兩年都跑不到的大工程，雖然不知道能堅持到什麼時候但至少每一個階段都能發現有趣的東西，應該是還可以繼續在努力很久。反而是關於 IP 上的問題，也就是遊戲的內容本身因為並沒有實際的完全開放，反而讓未來改版完畢後遊戲想要進入新的階段變得非常受限⋯⋯

不過也因為這款遊戲，讓我自己在遊戲開發上有很多不確定的東西有了一個大概知道能怎麼做的方案，以及很多新的想法可以嘗試。

那麼，就請大家期待在不久的未來我們重新開發過的 Unlight 會是怎樣的面貌了 XD
