# 甜囍手册 小程序

甜囍手册 —— 基于 uni-app + Vue3 + Pinia + 微信云开发的婚礼全流程管理小程序。

## 功能特性

### 宾客端（客人展示）
- **婚书首页**：精美请柬长页，含封面、倒计时、宾客行动台、婚礼信息、预览入口
- **婚纱相册**：瀑布流展示婚纱照，支持图片预览
- **婚礼路书**：到场助手 + 地图标记 + 场地列表，一键导航、拨打电话
- **流程时间线**：婚礼当天完整时间轴，自动高亮当前节点
- **RSVP回执**：在线填写出席信息、关系、人数、预计到达、交通方式、饮食偏好
- **祝福墙**：发送文字祝福，主人可审核置顶

### 主人端（编辑管理）
- **创建向导**：4步流程创建婚礼（模板→婚期→场地→新人信息），先选精美模板再填资料
- **管理后台**：发布准备度、数据概览、功能导航、快捷操作、删除婚礼邀请
- **婚书编辑**：模板切换、文案编辑、新人信息、功能开关
- **相册管理**：上传、删除、设为封面
- **路书编辑**：场地CRUD管理（名称/地址/坐标/电话/时间）
- **流程编辑**：时间节点CRUD管理
- **宾客管理**：RSVP统计、筛选查看、添加/编辑/删除宾客
- **祝福管理**：查看祝福、置顶/取消置顶、删除
- **分享设置**：分享卡片文案、复制小程序路径
- **数据统计**：浏览量、分享次数、RSVP统计、饮食偏好、到场方式、关系来源

## 技术栈

- **框架**：uni-app (Vue3 + Vite)
- **状态管理**：Pinia
- **样式**：SCSS + CSS 变量设计系统
- **后端**：微信云开发（CloudBase）
- **地图**：腾讯位置服务 / 微信小程序原生 map 组件
- **数据库**：云开发 MongoDB（9个集合）

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
│   └── getStats/            # 获取统计数据
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
│   └── stats/index          # 数据统计
├── stores/                  # Pinia 状态管理
│   ├── user.js              # 用户状态
│   └── wedding.js           # 婚礼数据状态
├── composables/             # 组合式函数
│   └── useCloud.js          # 云开发 API 封装
├── utils/                   # 工具函数
│   ├── index.js             # 通用工具
│   └── templates.js         # 内置婚礼模板配置
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

### RSVP 字段契约

`guests.guests[]` 保持向后兼容，核心字段为：

- `rsvp_status`：`attending` / `uncertain` / `declined` / `pending`
- `attending_count`：实际到场人数，缺席时为 `0`
- `diet_preference`：`normal` / `vegetarian` / `halal` / `other`
- `relationship`：宾客与新人的关系，可为空
- `arrival_time`：预计到达时间，可为空
- `transport_mode`：交通方式，可为空
- `companion_note`：随行备注，可为空

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
3. 如需真实天气，在 `getWeather` 云函数环境变量中配置 `HEFENG_KEY`
4. 如需内容安全接口失败时阻断提交，在 `submitRSVP`、`submitBlessing` 云函数环境变量中配置 `CONTENT_SAFETY_MODE=strict`
5. 如需生成体验版/开发版小程序码，在 `generatePoster` 云函数环境变量中配置 `WXACODE_ENV_VERSION=trial` 或 `develop`
6. 在 `cloudfunctions/*/config.json` 中按需配置权限
7. 需要支持主人删除邀请时，确认 `deleteWedding` 已部署；该函数会校验 `owner_openid`，并删除婚礼、请柬、相册记录、路书、流程、宾客、祝福、统计和访客记录

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

天气云函数如需真实天气，请在云函数环境变量中设置：

```
HEFENG_KEY=你的和风天气Key
```

未配置时会返回模拟天气，不会阻断路书页。

祝福和 RSVP 留言会调用微信内容安全接口。默认策略为“接口不可用时降级放行，接口明确判定违规时阻断”；如果希望接口不可用也阻断提交，请为 `submitRSVP`、`submitBlessing` 配置：

```
CONTENT_SAFETY_MODE=strict
```

小程序码默认生成正式版。如需主人端预览体验版或开发版小程序码，请为 `generatePoster` 配置：

```
WXACODE_ENV_VERSION=trial
```

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
- 已部署 `deleteWedding`，并在主人端管理后台验证删除后旧邀请链接失效、新建向导可重新打开
- 数据库集合已创建：`weddings`、`invitations`、`albums`、`venues`、`timelines`、`guests`、`blessings`、`share_stats`、`viewers`
- 数据库索引已创建：`viewers.wedding_id + viewers.openid`、`guests.guests.phone`、`blessings.blessings.id`
- 已运行 `npm run check:release` 并通过
- 已运行 `npm run build:mp-weixin`，并确认 `dist/build/mp-weixin` 可由微信开发者工具打开
- 如使用 CLI 上传，已设置 `MINIPROGRAM_PRIVATE_KEY_PATH`，且未把上传密钥路径写入仓库
- 在微信开发者工具中完成首页宾客行动台、RSVP 新字段、祝福墙、到场助手、管理后台发布准备度、宾客管理、统计页的模拟器检查

## 设计系统

四套内置模板方案：
- **红玫瑰高定**（默认主推）：红玫瑰 + 近黑 + 暖金，适合正式婚礼和大多数酒店/宴会厅场景
- **香槟杂志**：香槟金 + 象牙白，适合草坪、极简、浅色照片
- **黑金晚宴**：近黑 + 暖金，适合晚宴、酒店宴会厅、高级餐厅
- **花园胶片**：自然绿 + 胶片留白，适合户外、旅拍、生活感婚礼

模板配置集中在 `utils/templates.js`，创建向导会先展示四套模板并套用对应预设文案，婚书编辑、首页、RSVP、相册、路书、流程和更多页都会读取同一份模板配置。

## 双角色架构

| 维度 | 主人端 | 宾客端 |
|------|--------|--------|
| 入口 | 手机号+验证码 | 分享卡片/小程序码 |
| 权限 | 读写全部 | 只读 + RSVP/祝福 |
| 页面 | 管理后台（10+页） | Tab导航（5 Tab） |
| 分包 | pages-owner | pages |

## 注意事项

1. **云开发免费额度**：注意图片存储按量计费，建议压缩后上传
2. **主包大小**：主人端使用 subPackages 分包，确保主包不超过 2MB
3. **地图Key**：生产环境需申请腾讯位置服务 Key
4. **手机号验证**：主人端目前使用模拟验证，生产环境建议接入微信手机号验证组件
5. **音乐播放**：婚书首页背景音乐需配置合法域名或使用 base64 音频

## License

MIT
