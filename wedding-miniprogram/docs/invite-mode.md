# 单场请柬模式：高嘉琪 × 张靖 · 2026.11.14 威海荣成

这个小程序现在只做一件事：打开就是两位新人的婚礼请柬。它是 H5（kdnsna/our-wedding，线上 https://kdnsna.github.io/our-wedding/ ）的原生移植，内容、配色、间距、动效逐项对照 H5。

## 结构

| 文件 | 作用 |
|---|---|
| `config/invite.js` | **唯一配置**：姓名、时间、联系人、地点坐标、全部文案、照片地址、音乐开关、分享卡片 |
| `pages/invite/index.vue` | 请柬页，`pages.json` 里唯一的页面（入口） |
| `utils/invite-photo.js` | 还原 H5 的 `object-fit: cover` + `object-position`，并按屏宽 × 像素比挑 WebP 尺寸 |
| `utils/invite-art.js` | 线条图标、浪花、纸纹（H5 里的内联 SVG，改成 Data URL） |
| `styles/invite-palette.scss` | 色板（与 H5 相同） |
| `config/invite-fonts.js` | 自动生成的字体（WOFF，base64），`npm run build:invite-fonts` |
| `scripts/check-invite.js` | 自检：只有请柬页可达、无 web-view/表单/UGC、文案与 H5 逐字一致、主包体积 |
| `scripts/sync-invite-assets.mjs` | 核对线上照片/字体是否都在；`--download` 下载一份准备传云存储 |
| `config/pages.platform.json` | 多新人平台版的页面清单（存档，**未注册**，宾客不可达） |
| `legacy-assets/visuals/hero/` | 平台模板封面图（已移出代码包） |

## 和 H5 的对应

开场（名字、A LOVE STORY / BY THE SEA、2026.11.14、WEIHAI · RONGCHENG、光斑、慢推镜头）→ 02 Our Story（两张照片 + 六行文案）→ 03 The Journey（深海蓝渐变、华星桥通栏、三层浪花、海湾明信片 *See you by the sea*）→ 04 The Gallery（同样的 8 张、分组、旋转、取景、图注）→「所爱隔山海，山海皆可平」（日落剪影，诗句压在天空上）→ 请柬卡（上午 10:58、荣成华星宾馆 · 户外草坪、地址、导航）→ 赴约指南 7 张折叠卡 → 回复赴约抽屉（两位电话一键拨号，只有高嘉琪显示微信 `Kdnsna7` 可复制）→ 尾声 → 页脚。

动效只用 transform / opacity：滚动显现用 `createIntersectionObserver`（threshold 0.18，错峰延迟同 H5），首屏渐隐、山海文字和两张通栏照片、过场照片的视差用 `onPageScroll`。

## 刻意去掉 / 隐藏的（个人主体）

- 祝福墙、RSVP 表单（收集姓名/手机号）、相册上传、创建向导、模板、付费权益、AI 发布助手、宾客管理、统计、诊断、海报、隐私页：全部不再注册在 `pages.json`，也没有 tabBar，**宾客无法进入**。代码仍在仓库里（`pages/`、`pages-owner/`、`cloudfunctions/`），需要时用 `config/pages.platform.json` 恢复。
- 不用 web-view，不发任何网络请求（只有 `<image>` 加载图片、`loadFontFace` 的回退）。
- `manifest.json` 去掉了 `getLocation` / `chooseLocation` 和 `scope.userLocation`：导航用的 `openLocation` 不需要定位授权。
- 背景音乐：网易云外链播放器在小程序里用不了，`CONFIG.music.enabled = false`，**包里没有任何音频**。

## 图片

`<image>` 加载网络图片**不需要**配置合法域名（合法域名只管 request / uploadFile / downloadFile / socket）。现在直接用 H5 在 GitHub Pages 上已经压缩好的 WebP（失败自动换 JPEG），由 `CONFIG.assetBase` 一处控制。

**github.io 在国内的可达性不稳定**（时快时慢，个别网络 DNS 解析失败），大规模发给宾客前建议换到云存储，一步：

```bash
node scripts/sync-invite-assets.mjs --download   # 下载到 invite-assets/cloud/our-wedding/（约 6 MB）
```

1. 云开发控制台 → 存储 → 新建文件夹 `our-wedding`，把 `invite-assets/cloud/our-wedding/` 里的 `assets/` 整个上传进去（权限保持「所有用户可读」）。
2. 随便点开一个文件复制 File ID，前缀形如 `cloud://cloud1-xxxx.xxxx-cloud1-xxxx-1234567890/`。
3. 把 `config/invite.js` 的 `assetBase` 改成 `'cloud://…/our-wedding/'`，重新构建。`App.vue` 会自动 `wx.cloud.init`。
4. 分享封面 `share.imageUrl` 继续用 https（或换成一张 5:4 本地小图，见下文风险）。

## 字体

三款字体都打成 WOFF Data URL 放进主包（马善政只留请柬里用马善政显示的 109 个字，47 KB；三款合计约 120 KB base64），`App.vue` 在 `onLaunch` 里 `uni.loadFontFace({ global: true })`。不走网络，所以**不需要配置 downloadFile 合法域名**，也不怕 github.io 打不开。基础库 < 3.7.9（不支持 Data URL）时回退到 H5 线上的 https WOFF2（GitHub Pages 返回 `content-type: font/woff2` 和 `Access-Control-Allow-Origin: *`，满足 loadFontFace 的要求）。改了文案后运行 `npm run build:invite-fonts` 重新子集化。

## 地点坐标（需要新人确认）

`openLocation` 要 GCJ-02 经纬度：`37.167282, 122.521789`。来源：Tripadvisor 猫途鹰（tripadvisor.cn，地图为高德）与中国假日旅游网「荣成华星宾馆」酒店页的地图中心点，两处一致。请在腾讯地图坐标拾取器 https://lbs.qq.com/getPoint/ 搜「荣成华星宾馆」核对；Google 数据里的「华星宾馆二部」在约 1 km 外，不要用那个。地图打不开时按钮会改为复制地址。

## 本地开发 / 预览

```bash
npm install
npm run build:mp-weixin   # 产物 dist/build/mp-weixin
npm run check:invite      # 自检 + 主包体积
npm run check:release     # 自检 + 平台版原有检查
```

## 用微信开发者工具出体验版

1. 先在公众平台（mp.weixin.qq.com）**设置 → 服务内容声明 → 用户隐私保护指引**里补一项「剪切板」，用途写「复制新人的微信号，方便宾客添加好友」。不声明的话「复制」会失败（页面会提示长按微信号手动复制）。
2. 服务器域名：**不用配**。
3. 开发者工具 → 导入项目 → 目录选 `wedding-miniprogram/dist/build/mp-weixin`，AppID 会自动读出来；不要勾「不校验合法域名」也能正常显示。
4. 点「编译」看模拟器；点「预览」扫码在自己手机上看（真机效果以这个为准）。
5. 点「上传」，版本号填 `3.0.0`，备注「高嘉琪×张靖婚礼请柬」。
6. 公众平台 → 管理 → 版本管理 → 开发版本 → 「选为体验版」，拿体验版二维码；成员管理 → 体验成员里加上要先看的家人微信号（个人主体名额有限，以后台为准）。
