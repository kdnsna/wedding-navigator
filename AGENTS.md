# 甜囍手册 - 婚礼全流程导航项目规范

## 项目概述

甜囍手册 —— 婚礼全流程导航产品，专为主人 2026年11月14日婚礼打造。集婚书请柬、路书导航、流程时间线、宾客管理于一体。

当前主力产品为**微信小程序版**（uni-app），静态网页版已归档移除。

## 技术栈

- **框架**：uni-app (Vue3) + Vite
- **UI 框架**：uni-ui + 自定义婚礼主题组件
- **状态管理**：Pinia
- **后端**：微信云开发（CloudBase）— 数据库 + 存储 + 云函数
- **地图**：腾讯位置服务
- **设计系统**：全局 SCSS（uni.scss），3套配色体系
- **项目类型**：微信小程序

## 目录结构

```
wedding-navigator/
├── wedding-miniprogram/    # 小程序源码（uni-app）
│   ├── pages/              # 宾客端（7页）：首页/相册/路书/流程/RSVP/祝福墙/更多
│   ├── pages-owner/        # 主人端（10页，subPackages分包）：向导/管理/编辑页
│   ├── cloudfunctions/     # 云函数：CRUD / RSVP / 祝福 / 统计 / 海报 / 天气
│   ├── components/         # 公共组件（海报绘制等）
│   ├── stores/             # Pinia：user.js + wedding.js
│   ├── composables/        # useCloud.js + useOwnerGuard.js
│   ├── utils/              # 工具函数库
│   ├── config/             # 云配置集中管理
│   ├── App.vue             # 全局应用配置
│   ├── main.js             # 入口
│   ├── manifest.json       # 小程序配置
│   ├── pages.json          # 页面路由
│   ├── package.json        # 依赖
│   └── uni.scss            # 全局SCSS设计系统
│
├── assets/                 # 设计素材与参考文档
│   ├── 小程序设计方案.md
│   └── 调研报告.md
│
├── DESIGN.md               # 设计方案参考1
├── DESIGN-v2.md            # 综合设计方案
├── AGENTS.md               # 项目规范（本文档）
└── README.md               # 项目说明
```

## 关键入口 / 核心模块

### 宾客端页面
- `pages/index/index.vue` — 首页，倒计时、新人信息、快速入口
- `pages/album/index.vue` — 婚纱相册
- `pages/guide/index.vue` — 婚礼路书（地图/天气/交通/住宿）
- `pages/timeline/index.vue` — 流程时间线
- `pages/rsvp/index.vue` — RSVP回执
- `pages/blessing/index.vue` — 祝福墙
- `pages/more/index.vue` — 更多入口
- `pages/poster/index.vue` — 海报生成与分享

### 主人端页面
- `pages-owner/wizard/index.vue` — 创建婚礼向导
- `pages-owner/manage/index.vue` — 管理后台首页
- `pages-owner/invitation/edit.vue` — 婚书编辑（含背景音乐设置）
- `pages-owner/guide/edit.vue` — 路书编辑（场地/交通/住宿）
- `pages-owner/timeline/edit.vue` — 流程编辑
- `pages-owner/guests/manage.vue` — 宾客管理
- `pages-owner/album/manage.vue` — 相册管理
- `pages-owner/blessing/manage.vue` — 祝福管理
- `pages-owner/share/index.vue` — 分享设置
- `pages-owner/stats/index.vue` — 数据统计
- `pages-owner/poster/index.vue` — 海报管理

### 云函数
- `createWedding` — 创建婚礼（自动生成 weddingId，初始化所有集合）
- `getWedding` — 读取婚礼完整数据（所有关联集合并行查询）
- `updateWedding` — 更新指定集合（带权限校验）
- `submitRSVP` — 提交 RSVP
- `submitBlessing` — 提交祝福
- `pinBlessing` — 置顶/取消置顶祝福
- `recordView` — 记录浏览
- `getStats` / `getRSVPStats` — 统计数据
- `generatePoster` — 生成小程序码海报
- `getWeather` — 获取婚礼当天天气预报

### 配置与状态
- `config/cloud.js` — 云环境配置集中管理
- `stores/user.js` — 用户状态（openid、isOwner、ownerVerified、weddingId）
- `stores/wedding.js` — 婚礼数据状态（wedding、invitation、venues、timeline 等）
- `composables/useCloud.js` — 云函数调用封装 + 文件上传
- `composables/useOwnerGuard.js` — 主人端权限守卫

## 运行与预览

### 微信小程序开发者工具
1. 导入 `wedding-miniprogram/` 目录
2. 填写 `manifest.json` 中的 appid
3. 初始化云开发环境并部署云函数
4. 编译预览

### HBuilderX
```bash
cd wedding-miniprogram
pnpm install
# 运行到微信开发者工具
pnpm dev:mp-weixin
```

## 用户偏好与长期约束

1. **云端优先**：主人端所有写操作先调用云函数同步云端，再缓存本地（离线兜底）
2. **双角色架构**：主人端（读写全部）+ 宾客端（只读 + RSVP/祝福提交）
3. **模板风格**：3套请柬风格（传统红金、现代简约、极简纯白）
4. **移动端优化**：uni-app 跨端适配，以微信小程序为主
5. **日期格式**：统一使用 "2026年11月14日" 格式
6. **时间线高亮**：婚礼当天自动根据当前时间高亮进行中/已完成/即将开始的节点
7. **视觉系统**：高级简约无界设计（纯白背景 + 近黑文字 + 暗玫瑰红点缀）
8. **动画规范**：fadeInUp / fadeInScale / gentleFloat / glowPulse

## 全面检查修复记录

### 2025 年 6 月 — 云端数据同步架构修复与边界安全加固

本次全面遍历修复了以下关键问题：

1. **向导页 `week_day` 自动计算**：`pages-owner/wizard/index.vue` 创建婚礼时自动根据日期计算星期几，不再留空；初始 `guests`/`blessings` 改为 `{guests:[]}`/`{blessings:[]}`，避免 store 中传入 `null`。
2. **路书页生命周期修复**：`pages/guide/index.vue` 将 `onMounted` 改为 `onShow`，解决 tabBar 页面切换后数据不刷新问题。
3. **海报页权限守卫修复**：`pages-owner/poster/index.vue` 将 `onLoad` 中生成海报逻辑移到 `onShow`，确保 `useOwnerGuard()` 先执行，避免未验证用户触发海报生成。
4. **首页数据刷新增强**：`pages/index/index.vue` 的 `onShow` 增加 `fetchWedding` 兜底加载，解决从其他页面切回首页时数据缺失。
5. **主人端页面 null 安全检查**：`timeline/edit.vue`、`guide/edit.vue`、`guests/manage.vue`、`blessing/manage.vue`、`album/manage.vue` 的删除/保存操作均增加 `store.xxx` 为 null 的防护，防止云函数返回空文档时报错。
6. **路书编辑页数据同步修复**：`guide/edit.vue` 的 `saveToStorage` 原来从 `venueList`/`transportForm`/`hotelList` 同步回 store，实际 save 操作已直接修改 store，改为直接传递 `store.venues`，避免覆盖。
7. **请柬编辑页数据构建修复**：`invitation/edit.vue` 的 `buildWeddingData` 原来使用 `...store.wedding` 展开全部字段，改为仅构建 `basic_info`，避免意外覆盖云端 `_id`、`owner_openid` 等系统字段。
8. **统计页数据格式统一**：`pages-owner/stats/index.vue` 的 `onShow` 中将 `getStats` 返回的 `rsvp` 对象和 `blessings` 数字统一映射为 `rsvp_count`/`blessing_count`，与 `manage/index.vue` 的 stats computed 兼容。

## 常见问题与预防

1. **云开发环境**：首次使用需在小程序后台开通云开发，并修改 `config/cloud.js` 中的 `CLOUD_ENV`
2. **云函数部署**：新增/修改云函数后需右键「上传并部署：云端安装依赖」
3. **地图 Key**：生产环境需申请腾讯位置服务 Key，填入 `manifest.json`
4. **小程序分包**：主人端使用 subPackages 分包，确保主包不超过 2MB
5. **云开发额度**：注意免费额度，图片存储按量计费，建议压缩后上传
6. **背景音乐**：iOS 需用户点击页面后才可自动播放，已在首页做兼容处理
7. **海报生成**：依赖 `wxacode.getUnlimited`，需小程序已发布或体验版
8. **天气数据**：`getWeather` 云函数支持和风天气 API，未配置时返回模拟数据
