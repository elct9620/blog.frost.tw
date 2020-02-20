---
title: 客製化你樹莓派上運行的 Linux
date: 2018-10-09 21:29:53
tags: [物聯網,筆記,IoT,Linux,Ruby]
thumbnail: https://blog.frost.tw/images/2018-10-09-customize-a-linux-for-your-raspberrypi/thumbnail.jpg
---

最近因為手邊有一個工作以外的專案需要搭配硬體做一些 IoT 類型的應用，雖然之前在五倍紅寶石開發的 Tamashii 系列應用已經足以應對在這個專案上開發所需的解決方案，但是依舊缺少了一些功能。

也就是我們過去並沒有考慮到的，如果裝置是交給一般使用者的狀況下，如何在透過網路的前提將裝置更新。

這是很多硬體都會有的功能，但是就目前而言 Tamashii 並不支援。

<!--more-->

經過幾天的調查，發現有一個 Open Source 的專案似乎符合條件。

# Mender 的 OTA 伺服器

這個開源專案叫做 [Mender](https://mender.io/) 是透過好幾種程式語言組合而成，功能也很簡單。在預先製作好的 Linux 發行版本中寫入 Mender 伺服器的位置，只要在伺服器上「認證」這一台裝置，未來就能夠收到來自 Mender 伺服器所提供的更新。

而更新的方式基本上就是製作一份新的 Rootfs 提供給硬體裝置下載，並且嘗試將這個新的版本加入到現有硬體中，並且嘗試是否能夠正常的運行，如果失敗的話再將舊版的 Rootfs 載入。

也因此，要能夠使用 Mender 來發布 OTA (Over the Air）更新的話，就必須要能夠製作自己的 Linux 發行版本才可以。

# Yocto 專案

想要讓所有人都知道怎麼自己編譯完整的 Linux 作業系統是很困難的，從韌體、核心（Kernel）到各種開機所需要的套件庫（Library）等等，光是編譯的步驟就非常繁複，更何況還要配合使用不同開發版或者晶片的使用者。

所以 Mender 也採許了另一套開放原始碼的解決方案，叫做 Yocto 專案。這個專案跟另一個開源專案 OpenEmbedded 已經整合在一起，或者說能夠互通使用。

在 Yocto 之中，我們透過所謂的 Layer 的疊加就能夠製作出我們所需的 Linux 系統，而有很多硬體上所需要配合的韌體，也大多會有社群貢獻，因此在大部分的情況下都不太需要擔心。

> Mender 團隊也提供付費協助處理硬體整合上的問題，也許這是主要的收入之一？

舉例來說，我想要製作一個能在 RaspberryPi 上面執行的 Linux 環境，就需要叫做 `meta-respberrypi` 這一個 Layer 來幫助我。

他會依賴於 `oe-core` 和幾個相關的 Layer 才能夠正確編譯（因為已經有的設定不用重複撰寫）

當我加入 `meta-raspberry` 之後，我在選擇編譯的機器類型時，就能夠用像是 `MACHINE=raspberrypi3` 這樣的模式告知我希望得到能在 Raspberry Pi 3 上執行的 Linux。

最棒的是，當我們完成這個動作之後，生成的 Linux 鏡像檔案燒入到 SD 卡中就能夠正常運行。

> 以前嘗試過使用 Buildroot 來製作，但是失敗率非常高。

簡單來說 Yocto 就是一堆社群貢獻預先撰寫好的建置腳本，因此我們只需要專注在自己需要預先加入這個 Linux 環境的部分，像是 Tamashii 或者 Ruby 的運行環境。

# 初次嘗試

首先，我們需要可以運行的環境。這篇文章使用的是 CentOS 7 來進行示範，所需的相關套件可以參考 [Yocto 官方文件](https://www.yoctoproject.org/docs/2.4/yocto-project-qs/yocto-project-qs.html#yp-resources)來配置，另外要注意的是目前較新版本是需要有 Python 3 的環境，但是 CentOS 7 還是使用 Python 2 需要自己配置。

## 下載 Poky

```
git clone -b sumo git://git.yoctoproject.org/poky
```

Poky 類似於一個基礎的樣板，裡面將生成 Yocto 版本的 Linux 必要的相關檔案都放在裡面，我們可以基於這個資料夾來進行後續的設定跟配置。

> Yocto 每個版本都會有代號，目前最新的穩定版是 Sumo (2.5) 版

## 加入 Mender

這篇文章會以 Mender 作為例子，這樣在成品階段的時候也比較好用 Mender 來體驗。

```
cd poky
git clone -b sumo git://github.com/mendersoftware/meta-mender
```

如此一來，我們就可以在後續的階段使用由 Mender 所製作的 Layer 來提供 OTA 的功能。
不過在此之前，因為我們希望製作的是 Raspberry Pi 版本的 Linux 發行版本，所以還需要先把 Raspberry Pi 對應的 Layer 加入。

```
git clone -b sumo git://git.yoctoproject.org/meta-raspberrypi
git clone -b sumo git://git.openembedded.org/meta-openembedded
```

## 配置 Layer

```
source oe-init-build-env
```

因為 Yocto 已經提供好了各種設置，所以我們只需要透過上面的指令就能切換到對應的建置環境中。

> 預設會產生一個 `build` 目錄，如果想要其他目錄的話也可以在後面指定。

然後我們要告訴 Yocto 想要使用哪些 Layer 才能夠正常運作。

```
bitbake-layers add-layer ../meta-mender/meta-mender-core
bitbake-layers add-layer ../meta-openembedded/meta-oe
bitbake-layers add-layer ../meta-raspberrypi
bitbake-layers add-layer ../meta-mender/meta-mender-raspberrypi
```

加入上述的 Layer 後，我們就可以產生一個能在 Raspberry Pi 上運行，以及透過 Mender 來做 OTA 更新的 Linux 發行版本。

不過礙於篇幅的關係，這次我們直接使用 Mender 提供的 Demo Layer 來加入客製化的內容。

> 如果想加入自己編譯的程式、服務等等，是需要自己建立一個 Layer 來加入的，這樣也能對原有的 Layer 做擴充或者增加設定。

```
bitbake-layers add-layer ../meta-mender/meta-mender-demo
bitbake-layers add-layer ../meta-mender/meta-mender-raspberrypi
```

接下來，我們要對 `conf/local.conf` 進行設定，把伺服器位置等等設定值都加入到產生的 Linux 發行版本中，才能夠連接到正確的 Mender 伺服器。


```conf
# 釋出的版本，需要不同才能被辨識出來
MENDER_ARTIFACT_NAME = "release-1"

INHERIT += "mender-full"

# 指定為 Raspberry Pi 3 是預設的目標
MACHINE ?= "raspberrypi3"

# 針對 Raspberry Pi 的額外設定
RPI_USE_U_BOOT = "1"
MENDER_PARTITION_ALIGNMENT = "4194304"
MENDER_BOOT_PART_SIZE_MB = "40"
IMAGE_INSTALL_append = " kernel-image kernel-devicetree"
IMAGE_FSTYPES_remove += " rpi-sdimg"

# 你的 Mender OTA 更新伺服器
MENDER_SERVER_URL = "https://ota.tamashii.io"

DISTRO_FEATURES_append = " systemd"
VIRTUAL-RUNTIME_init_manager = "systemd"
DISTRO_FEATURES_BACKFILL_CONSIDERED = "sysvinit"
VIRTUAL-RUNTIME_initscripts = ""

ARTIFACTIMG_FSTYPE = "ext4"

# Raspberry Pi WiFi 設定（Demo 才有開啟 WiFi 功能）
MENDER_DEMO_WIFI_SSID ?= "ssid"
MENDER_DEMO_WIFI_PASSKEY ?= "password"
```

## 建置

```
bitbake core-image-full-cmdline
```

執行這個指令後，大概會要花上數小時才會完成，這段時間可以睡覺或打個遊戲。

> 開發階段我會推薦使用 `full-cmdline` 的版本，因為可以直接 SSH 到機器或者接上鍵盤除錯。

確認跑起來都沒問題之後，就可以改為使用 `core-image-minimal` 製作出刪減掉除了開啟 Linux 以及自己加入的額外功能之外，所有不必要的檔案來盡可能的縮小檔案大小。

# 後記

到這篇文章完成建置的段落，其實從頭到尾只花上數小時。不過目前還在測試如何讓有 C Extension 的 Ruby Gem 可以正常的被 Cross Compile 並且放進自訂的發行版本。

如果只是想單純的啟用 Ruby 的功能，直接在 `conf/local.conf` 裡面加上這行。

```
IMAGE_INSTALL_append = "ruby "
```

在自訂的發行版本就可以使用 ruby 指令（目前預設是 2.5.0 版）

# 總結

這篇文章其實只是很粗略的將 Yocto 可以做的事情介紹出來，實際上深入了解 `bitbake` 這套工具以及 Layer 機制後，就會發現還有很多東西可以做。

舉例來說能透過 `.bbclass` 定義一個範本（Ex. `rubygem.bbclass`）讓其他套件（`Package`）繼承使用，而除了 Layer 之外，底下還有細分了食譜（`Receipe`）和套件（`Package`）可以做很多變的調整。

或者透過 `.bbappend` 來對原本的套件修訂，像是目前正在製作的 Tamashii Linux 就是利用這種方法讓 Ruby Gem 的 Cross Compile 得以實現。

如果之後已經有成熟的 Tamashii Linux 案例，會在分享該如何在 Yocto 上面客製化以 Ruby 為基底的 IoT 裝置嵌入是系統。
