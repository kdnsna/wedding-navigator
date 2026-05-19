# 甜囍手册 小程序

甜囍手册 —— 基于 uni-app + Vue3 + Pinia + 微信云开发的婚礼当天行动手册小程序。

## 最新更新（2026-05-19）

本次产品化更新已落地到小程序代码、云函数和文档：

- 创建婚礼时，模板会初始化请柬文案、路书提示和角色化流程
- 主人端婚书编辑新增 RSVP 手机号必填、允许修改回执、祝福公开展示、允许匿名祝福等设置
- 宾客端首页、更多页、RSVP、祝福墙、流程页均读取同一套功能开关
- `submitRSVP`、`submitBlessing`、`getWedding` 已收敛隐私与提交权限
- 分享设置页会把 `share_config` 保存到云端，并提供分享好友、生成海报和复制路径入口
- README 已补充功能开关字段、上线部署提示、模板规范和商业化边界说明

本轮同时完成 P1 像素级一致性优化：

- `uni.scss` 新增页面边距、按钮高度、点击热区、卡片圆角和安全区基线，宾客端与主人端共用同一套尺寸
- 首页、路书、RSVP、祝福墙、流程、更多页统一头部层级、行动按钮、空状态和底部安全区
- 管理后台、创建向导、婚书编辑、路书编辑、流程编辑、宾客管理、祝福管理、分享设置、统计页统一表单、列表、弹层和固定底部按钮
- 大面积英文装饰字距归零，过重阴影降级，卡片圆角收敛，避免风格漂移
- 长标题、长地址、长祝福、长流程名称增加省略或换行策略，降低小屏文本溢出风险

P2 大众化/商业化基础已完成第一版：

- 新增 `syncOwnerProfile` 云函数，使用微信 `OPENID` 同步主人资料、权益、套餐和婚礼工作区
- 主人端新增“账号与权益”页面，展示免费版/高级版/商家版边界，以及高级模板、海报套装、去品牌水印、多工作区等权益位
- 主人端新增“发布诊断”页面，集中检查云环境、婚书、封面、场地坐标、天气/地图 Key、隐私、分享、小程序码海报和模板权益
- 模板配置新增 `tier` 与 `commercial` 字段，创建向导和婚书编辑会展示免费/高级模板状态，并把商业化状态写入云端
- 发布检查脚本已加入账号、权益、诊断和模板分层断言，避免后续迭代漏掉 P2 基础设施

相册上传稳定性修复：主人端相册页已移除不稳定的 `wx.chooseMedia` 兜底，统一使用 `uni.chooseImage` 选择图片，避免部分机型或开发者工具反复出现 `chooseMedia:fail`。

地图、天气、地理编码和海报链路继续补强：

- 首页支持从小程序码 `scene` 参数进入婚礼详情，扫码不再依赖普通分享链接参数
- 海报绘制支持 `cloud://` 相册封面和 base64 小程序码转本地临时文件，减少封面/小程序码不显示
- 分享设置页会尝试生成并展示真实小程序码，失败时显示具体配置原因
- 路书天气页会显示缺 Key、缺坐标或服务超时等具体失败原因，并支持重试
- 主人端路书增加手动经纬度兜底，自动匹配和地图选点失败时也能补坐标
- `cloudbaserc.json` 已加入 `generatePoster`，方便和地图/天气函数一起部署

模板预览与首页封面继续优化：

- 主人端新增完整模板预览页，每套模板带虚拟婚礼数据，可切换首页、路书、流程、RSVP、祝福墙、相册和海报模拟界面
- 创建向导与婚书编辑均可进入完整预览，并可从预览页直接选择当前模板
- 首页默认窄竖封面改为满屏裁切和底部信息渐变，移除两侧色带与灰雾遮罩
- 首页“确认出席/分享”操作不再固定悬浮遮挡宾客行动台，改为页面底部动作区

## 功能特性

### 宾客端（客人展示）
- **婚书首页**：精美请柬长页，含封面、倒计时、宾客行动台、婚礼信息、预览入口；倒计时、RSVP、流程、祝福均受主人开关控制
- **婚纱相册**：瀑布流展示婚纱照，支持图片预览
- **婚礼路书**：到场助手 + 地图标记 + 场地列表 + 停车/住宿/角色路线提示，一键导航、拨打电话
- **流程时间线**：婚礼当天完整时间轴，支持普通宾客、伴郎伴娘、双方父母、摄影司仪角色视图
- **RSVP回执**：在线填写出席信息、关系、人数、预计到达、交通方式、饮食偏好；手机号默认可选，可由主人设为必填
- **祝福墙**：发送文字祝福，主人可审核置顶，可配置是否公开展示、是否允许匿名祝福

### 主人端（编辑管理）
- **创建向导**：4步流程创建婚礼（模板→婚期→场地→新人信息），模板会同步生成请柬文案、默认流程和路书提示，并支持完整模拟预览
- **管理后台**：发布准备度、数据概览、功能导航、快捷操作、删除婚礼邀请
- **婚书编辑**：模板切换、文案编辑、新人信息、功能开关、RSVP/祝福隐私设置
- **相册管理**：上传、删除、设为封面
- **路书编辑**：场地CRUD管理（名称/地址/坐标/电话/时间），支持路线角色提示
- **流程编辑**：时间节点CRUD管理，支持给节点标记适用角色
- **宾客管理**：RSVP统计、筛选查看、添加/编辑/删除宾客
- **祝福管理**：查看祝福、置顶/取消置顶、删除
- **分享设置**：分享卡片文案、分享图配置、云端保存、小程序路径复制、海报生成入口
- **数据统计**：浏览量、分享次数、RSVP统计、饮食偏好、到场方式、关系来源
- **账号与权益**：主人资料、权益边界、婚礼工作区，为手机号授权和模板付费预留结构
- **发布诊断**：上线前检查云环境、地图天气配置、隐私、分享海报和模板权益状态

## 技术栈

- **框架**：uni-app (Vue3 + Vite)
- **状态管理**：Pinia
- **样式**：SCSS + CSS 变量设计系统
- **后端**：微信云开发（CloudBase）
- **地图**：腾讯位置服务 / 微信小程序原生 map 组件
- **数据库**：云开发 MongoDB（10个集合）

## 目录结构

```
wedding-miniprogram/
├── cloudfunctions/          # 微信云函数
│   ├── createWedding/       # 创建婚礼
│   ├── getWedding/          # 获取婚礼数据
│   ├── updateWedding/       # 更新婚礼数据
│   ├── deleteWedding/       # 删除婚礼邀请及关联数据
│   ├── submitRSVP/          # 提交RSVP
│   ├── getRSVPStats/        # RSVP统计
│   ├── submitBlessing/      # 提交祝福
│   ├── pinBlessing/         # 置顶祝福
│   ├── recordView/          # 记录浏览/分享
│   ├── getStats/            # 获取统计数据
│   ├── syncOwnerProfile/    # 主人账号、权益和工作区
│   ├── geocodeVenue/        # 场地坐标匹配
│   ├── getWeather/          # 天气预报
│   ├── generatePoster/      # 小程序码海报
│   └── checkOwnership/      # 主人身份校验
├── pages/                   # 宾客端页面
│   ├── index/               # 婚书首页
│   ├── album/               # 婚纱相册
│   ├── guide/               # 婚礼路书
│   ├── timeline/            # 流程时间线
│   ├── more/                # 更多
│   ├── rsvp/                # RSVP回执
│   └── blessing/            # 祝福墙
├── pages-owner/             # 主人端页面（分包）
│   ├── wizard/              # 创建向导
│   ├── manage/              # 管理后台
│   ├── invitation/edit      # 婚书编辑
│   ├── album/manage         # 相册管理
│   ├── guide/edit           # 路书编辑
│   ├── timeline/edit        # 流程编辑
│   ├── guests/manage        # 宾客管理
│   ├── blessing/manage      # 祝福管理
│   ├── share/index          # 分享设置
│   ├── stats/index          # 数据统计
│   ├── diagnostics/index    # 发布诊断
│   └── profile/index        # 账号与权益
├── stores/                  # Pinia 状态管理
│   ├── user.js              # 用户状态
│   └── wedding.js           # 婚礼数据状态
├── composables/             # 组合式函数
│   └── useCloud.js          # 云开发 API 封装
├── utils/                   # 工具函数
│   ├── index.js             # 通用工具
│   ├── templates.js         # 内置婚礼模板配置
│   ├── commercial.js        # 套餐与权益配置
│   ├── imagePaths.js        # cloud/base64/http 图片转本地可绘制路径
│   └── releaseDiagnostics.js # 发布诊断规则
├── static/                  # 静态资源
├── App.vue                  # 应用根组件
├── main.js                  # 应用入口
├── manifest.json            # 小程序配置
├── pages.json               # 页面路由配置
└── uni.scss                 # 全局 SCSS 变量
```

## 数据库集合

| 集合名 | 说明 |
|--------|------|
| weddings | 婚礼主文档（基础信息、主人openid） |
| invitations | 请柬配置（模板、文案、新人信息） |
| albums | 相册数据（照片列表） |
| venues | 场地数据（路书点位） |
| timelines | 流程数据（时间节点） |
| guests | 宾客数据（RSVP信息） |
| blessings | 祝福数据（文字/语音祝福） |
| share_stats | 分享统计（浏览量、分享次数） |
| viewers | 访客记录（独立访客去重） |
| owners | 主人账号资料、套餐、权益、工作区索引 |

### 主人账号与商业化字段

`owners` 以微信 `OPENID` 作为文档 ID，核心字段为：

- `profile.nickname`：主人称呼，可为空
- `profile.phone`：主人手机号，仅主人端使用，不展示给宾客
- `profile.role`：主人/策划师/家人等身份
- `plan`：`free` / `pro` / `business`
- `entitlements.premium_templates`：是否拥有高级模板
- `entitlements.poster_pack`：是否拥有海报套装
- `entitlements.remove_branding`：是否允许去品牌水印
- `entitlements.workspace_multi`：是否允许多婚礼工作区

`weddings.commercial` 与 `invitations.commercial` 会记录当前模板的 `template_tier`、`template_entitlement` 和 `billing_state`。当前版本为体验期，不阻断个人婚礼发布；正式商业化时可在这里接微信支付结果。

### RSVP 字段契约

`guests.guests[]` 保持向后兼容，核心字段为：

- `rsvp_status`：`attending` / `uncertain` / `declined` / `pending`
- `attending_count`：实际到场人数，缺席时为 `0`
- `diet_preference`：`normal` / `vegetarian` / `halal` / `other`
- `relationship`：宾客与新人的关系，可为空
- `arrival_time`：预计到达时间，可为空
- `transport_mode`：交通方式，可为空
- `companion_note`：随行备注，可为空
- `phone`：默认可为空；当 `features.rsvp_phone_required` 为 `true` 时由云函数强制校验
- `openid`：由云函数写入，仅主人可见；普通宾客只会拿到自己的回执摘要

### 邀请功能开关与隐私字段

`invitations.features` 控制宾客端入口展示和云函数提交权限：

- `show_countdown`：首页是否显示倒计时
- `show_rsvp`：首页、更多页、RSVP 页面及 `submitRSVP` 是否开放
- `show_blessing`：首页、更多页、祝福墙页面及 `submitBlessing` 是否开放
- `show_timeline`：首页、更多页、流程页面是否开放
- `rsvp_phone_required`：RSVP 手机号是否必填
- `allow_rsvp_update`：宾客是否可以重复修改自己的 RSVP
- `blessing_public`：普通宾客是否可见祝福列表
- `allow_anonymous_blessing`：是否允许匿名祝福

## 本地开发

### 环境要求
- Node.js 20 LTS（项目已提供 `.nvmrc`，建议 `nvm use` 后再构建）
- npm >= 10（当前仓库使用 `package-lock.json`，推荐 npm 安装依赖）
- HBuilderX 或 VS Code + uni-app 插件
- 微信开发者工具

### 安装依赖

```bash
cd wedding-miniprogram
nvm use
npm install
```

### 配置

1. 在 `manifest.json` 中配置你的微信小程序 AppID
2. 在 `config/cloud.js` 中配置云开发环境 ID：`CLOUD_ENV`
3. 如需路书自动匹配地图坐标，在 `geocodeVenue` 和 `getWeather` 云函数环境变量中配置 `TENCENT_MAP_KEY`
4. 如需真实天气，在 `getWeather` 云函数环境变量中配置 `HEFENG_KEY`，也兼容 `QWEATHER_KEY` / `WEATHER_KEY`
5. 如需内容安全接口失败时阻断提交，在 `submitRSVP`、`submitBlessing` 云函数环境变量中配置 `CONTENT_SAFETY_MODE=strict`
6. 如需生成体验版/开发版小程序码，在 `generatePoster` 云函数环境变量中配置 `WXACODE_ENV_VERSION=trial` 或 `develop`
7. 在 `cloudfunctions/*/config.json` 中按需配置权限
8. 需要支持主人删除邀请时，确认 `deleteWedding` 已部署；该函数会校验 `owner_openid`，并删除婚礼、请柬、相册记录、路书、流程、宾客、祝福、统计和访客记录
9. 本次产品化能力依赖 `createWedding`、`getWedding`、`submitRSVP`、`submitBlessing`、`updateWedding`，上线前请重新部署这些云函数
10. P2 账号与商业化基础依赖 `syncOwnerProfile`，上线前请部署该云函数并在主人端“账号与权益”页面确认可同步

### 运行到微信开发者工具

使用 HBuilderX：
```
运行 -> 运行到小程序模拟器 -> 微信开发者工具
```

或使用 CLI：
```bash
npm run dev:mp-weixin
```

然后在微信开发者工具中打开 `dist/dev/mp-weixin` 目录。

### 本地构建检查

```bash
npm run check:release
npm run build:mp-weixin
```

构建完成后，在微信开发者工具中打开 `dist/build/mp-weixin` 目录进行模拟器预览。

## 部署

### 1. 开通微信云开发

在微信公众平台/小程序后台开通云开发，获取环境ID。

### 2. 部署云函数

在微信开发者工具中：
```
云开发 -> 云函数 -> 右键每个云函数目录 -> 创建并部署：云端安装依赖
```

天气云函数如需真实天气，请在云函数环境变量中设置以下任一变量：

```
HEFENG_KEY=你的和风天气Key
# 或
QWEATHER_KEY=你的和风天气Key
# 或
WEATHER_KEY=你的和风天气Key
```

未配置时会返回模拟天气，不会阻断路书页。

路书自动匹配地图坐标依赖腾讯位置服务 Key。请为 `geocodeVenue` 和 `getWeather` 配置：

```
TENCENT_MAP_KEY=你的腾讯位置服务Key
```

主人端保存场地时会按「详细地址 + 场地名称」自动匹配坐标，也可手动地图选点；如果自动匹配和地图选点都失败，可展开“手动填写坐标”录入经纬度。宾客端只会展示已匹配坐标的地图标记，避免无坐标场地被错误打到默认城市。

祝福和 RSVP 留言会调用微信内容安全接口。默认策略为“接口不可用时降级放行，接口明确判定违规时阻断”；如果希望接口不可用也阻断提交，请为 `submitRSVP`、`submitBlessing` 配置：

```
CONTENT_SAFETY_MODE=strict
```

小程序码默认生成正式版。如需主人端预览体验版或开发版小程序码，请为 `generatePoster` 配置：

```
WXACODE_ENV_VERSION=trial
```

`generatePoster` 已加入 `cloudbaserc.json`。如果分享设置页提示小程序码生成失败，请优先确认该云函数已部署，并已在云函数权限中开启 `wxacode.getUnlimited`。

### 3. 创建数据库索引

在云开发数据库控制台中，为以下字段创建索引：
- `weddings`：`_openid`
- `guests`：`guests.phone`（如需要手机号查询）
- `blessings`：`blessings.id`
- `viewers`：`wedding_id`, `openid`

### 4. 上传代码

使用 HBuilderX 发布：
```
发行 -> 小程序-微信 -> 上传
```

或在微信开发者工具中点击【上传】。

也可以使用 CLI 上传，避免把本机路径或密钥写进代码：

```bash
npm run build:mp-weixin
MINIPROGRAM_PRIVATE_KEY_PATH=/path/to/private.key npm run upload:mp-weixin
```

可选环境变量：
- `MINIPROGRAM_APPID`：覆盖 `manifest.json` 中的 AppID
- `MINIPROGRAM_PROJECT_PATH`：覆盖默认的 `dist/build/mp-weixin`
- `MINIPROGRAM_VERSION`：覆盖上传版本号
- `MINIPROGRAM_UPLOAD_DESC`：覆盖上传描述

### 5. 配置分享

在小程序后台配置页面分享权限，确保 `pages/index/index` 可被分享。

## 发布前检查清单

- `manifest.json` 中 `mp-weixin.appid` 已替换为正式小程序 AppID
- `config/cloud.js` 中 `CLOUD_ENV` 已替换为正式云开发环境 ID
- 已部署所有 `cloudfunctions/*`，选择「云端安装依赖」
- 已重新部署 `createWedding`、`getWedding`、`submitRSVP`、`submitBlessing`、`updateWedding`，并验证模板初始化、功能开关、隐私控制和分享设置保存
- 已部署 `syncOwnerProfile`，并验证主人端“账号与权益”能同步 openid、套餐、权益和工作区
- 已部署 `deleteWedding`，并在主人端管理后台验证删除后旧邀请链接失效、新建向导可重新打开
- 已部署 `geocodeVenue`，并为 `geocodeVenue`、`getWeather` 配置 `TENCENT_MAP_KEY` 后验证场地能自动匹配地图和天气
- 已部署 `generatePoster`，并在主人端“分享设置”验证小程序码能展示，扫码能进入对应婚礼
- 如自动地理编码不可用，已在主人端路书手动填写经纬度并验证宾客端导航可打开
- 数据库集合已创建：`owners`、`weddings`、`invitations`、`albums`、`venues`、`timelines`、`guests`、`blessings`、`share_stats`、`viewers`
- 数据库索引已创建：`viewers.wedding_id + viewers.openid`、`guests.guests.phone`、`blessings.blessings.id`
- 已运行 `npm run check:release` 并通过
- 已运行 `npm run build:mp-weixin`，并确认 `dist/build/mp-weixin` 可由微信开发者工具打开
- 已确认 7 张写实模板主图存在于 `static/visuals/hero/`，首页、模板预览和分享海报在未上传相册封面时能正常兜底展示
- 如使用 CLI 上传，已设置 `MINIPROGRAM_PRIVATE_KEY_PATH`，且未把上传密钥路径写入仓库
- 在微信开发者工具中完成首页宾客行动台、RSVP 新字段、祝福墙、到场助手、管理后台发布准备度、宾客管理、统计页的模拟器检查
- 在主人端“发布诊断”页确认无阻断项；天气 Key、小程序码、内容安全策略等人工项已真机验证

## 设计系统

内置模板从单纯视觉模板扩展为婚礼方案模板。每个模板都应定义封面构图、请柬文案、仪式流程默认项、路书默认项和海报样式：

- **红玫瑰高定**（默认主推）：红玫瑰 + 近黑 + 暖金，适合正式婚礼和大多数酒店/宴会厅场景
- **香槟杂志**：香槟金 + 象牙白，适合草坪、极简、浅色照片
- **黑金晚宴**：近黑 + 暖金，适合晚宴、酒店宴会厅、高级餐厅
- **花园胶片**：自然绿 + 胶片留白，适合户外、旅拍、生活感婚礼
- **新中式礼宴**：暗玫瑰红 + 宣纸白 + 雅金，适合敬茶、证婚、双方父母出席感较强的传统婚礼
- **山东家宴**：正红 + 香槟金，强调席设、接亲路线、停车、住宿、回门/会亲等家庭语境
- **异地宾客友好**：清爽白底 + 蓝绿点缀，强调到达时间、交通、住宿、天气和提醒

模板配置集中在 `utils/templates.js`，创建向导会先展示模板并套用对应预设文案、流程角色、路书提示和默认场地信息，婚书编辑、首页、RSVP、相册、路书、流程和更多页都会读取同一份模板配置。

写实模板主图集中在 `static/visuals/hero/`，并通过 `TEMPLATE_HERO_IMAGES` / `defaultHero` 绑定到每套模板。首页封面、完整模板预览和 Canvas 分享海报会优先使用用户上传的相册封面；没有上传时才使用当前模板的竖版婚纱照兜底，旧的 `default-cover.png` 仅保留为极端兜底。

模板商业化配置集中在 `utils/commercial.js` 与 `utils/templates.js`：

- 免费模板：不限制发布，适合个人婚礼基本上线
- 高级模板：当前体验期可预览和发布，会记录 `billing_state=trial`
- 推荐收费边界：优先收费高级模板、海报套装、去品牌水印，不锁 RSVP、路书、流程等宾客刚需功能
- 后续接微信支付时，只需要根据支付结果更新 `owners.entitlements`，页面会自动读取权益状态

功能图标统一使用 `static/visuals/icon-*.svg` 矢量线性图标，透明画布、无方形底板，主描边为近黑，局部使用玫瑰红和香槟金点缀。需要调整或重新生成图标时运行：

```bash
node scripts/generate-vector-icons.js
```

### P1 像素级验收基线

- 页面横向基线：常规页面 `48rpx`，紧凑内容可使用 `32rpx`
- 控件高度：主按钮 `88rpx`，紧凑按钮 `72rpx`，可点击热区不低于 `80rpx`
- 圆角：列表/卡片不超过 `16rpx`，弹层顶部圆角 `32rpx`，芯片/胶囊按钮允许全圆角
- 字距：英文装饰和中文标题默认 `letter-spacing: 0`，不再使用大面积拉宽英文标签
- 安全区：底部固定按钮必须使用 `env(safe-area-inset-bottom)`，页面内容需预留不被遮挡的底部空间
- 截图检查：375px、390px、430px 宽度下，首页、路书、RSVP、祝福墙、流程、更多页、管理后台、创建向导、婚书编辑、路书编辑、分享设置应无文本重叠、按钮截断和底部遮挡

## 双角色架构

| 维度 | 主人端 | 宾客端 |
|------|--------|--------|
| 入口 | 微信身份 + 主人校验 | 分享卡片/小程序码 |
| 权限 | 读写全部 | 只读 + RSVP/祝福 |
| 页面 | 管理后台（含发布诊断、账号权益） | Tab导航（5 Tab） |
| 分包 | pages-owner | pages |

## 注意事项

1. **云开发免费额度**：注意图片存储按量计费，建议压缩后上传
2. **主包大小**：主人端使用 subPackages 分包，确保主包不超过 2MB
3. **地图Key**：生产环境需申请腾讯位置服务 Key
4. **手机号验证**：主人端已预留主人资料与手机号字段，生产环境建议接入微信手机号授权组件
5. **音乐播放**：婚书首页背景音乐需配置合法域名或使用 base64 音频
6. **商业化边界**：当前已具备模板分层、账号权益和发布诊断基础；微信支付、订单表、退款与发票等交易闭环仍需后续接入

## License

MIT
