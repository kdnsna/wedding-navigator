# 甜囍手册

> 主人 2026年11月14日婚礼的专属婚礼导航小程序

「甜囍手册」不是普通电子请柬，而是给宾客看的**婚礼当天行动手册**。它集**婚书请柬**、**今日行动台**、**婚礼路书**、**流程时间线**、**RSVP 宾客管理**、**祝福墙**、**海报分享**于一体，建立「主人编辑端 + 宾客展示端」双角色体系。

- 🎴 主人端：基于 7 套主题模板的婚书编辑、向导式创建、宾客/相册/祝福/流程管理、统计、发布诊断
- 📱 宾客端：聚合倒计时、路线、流程、RSVP、祝福、相册、海报分享的「行动台」
- 🎨 视觉系统：「高级简约无界」设计语言，7 套主题、3 套模板、零 JS 风险精修的视觉细节

---

## 最新更新（Phase 14 · 2025 年 6 月）

本次以**「零功能改动、零 JS 改动、零新 bug 风险」**为前提，对宾客端 8 个页面 + 全局设计系统做了纯视觉精修：

### 设计系统层（`uni.scss`，仅追加）

- 新增 `hairline-soft / medium / strong` 三档边框透明度，替代裸用 `$border-color` 时的生硬感
- 新增 `ink-soft`、`surface-soft`、`surface-strong` 文本与背景灰阶，支持细腻层次
- 新增 `shadow-xs` / `shadow-sm` 两档阴影，与原有 `shadow-md` 形成三级深度
- 新增 `tracking-kicker (0.12em)` / `tracking-cn (0.04em)` / `tracking-cn-soft (0.02em)` 三档字距 token —— 保留原有 `$ui-letter-spacing: 0` 为全局中文默认
- 新增 `ease-editorial` 编辑感缓动曲线，用于 hover / active 微动效
- 新增 `letter-spacing-en` 工具变量供英文小标签使用

### 7 个宾客端页面通用精修

- `page-tag` 改为「细横线 + 文字 + 细横线」编辑感装饰，字距 0.12em
- `page-title` 加 letter-spacing 0.04em；行高统一 1.25
- `page-desc` 增加左侧 2rpx 近黑细线作为编辑感装饰
- `section-header` 装饰线条全部使用 `$hairline-medium`
- 卡片使用 `shadow-xs + 1rpx hairline-soft 边框`，弱化盒子感
- 按钮点击改为 `opacity 0.85 + scale(0.99)`，更克制
- `menu-arrow` / `quick-arrow` 使用 Georgia 衬线 + 4rpx 右滑微动效
- `quote-mark` 改为 Georgia 衬线 + `translateY(8rpx)` 基线对齐

### 逐页面精修

| 页面 | 关键改动 |
|---|---|
| `pages/index` | hero tag 双线装饰、couple-heart 12rpx + 圆角微化、quick 图标统一 64rpx、preview-more 添加 Georgia "›" 装饰、quick 卡片加 `::before` 4rpx 顶色 |
| `pages/rsvp` | 表单 textarea focus 加左侧 accent line、submit 圆环动画、成功页 editorial 装饰、result-circle 重画为对勾+双圆环 |
| `pages/blessing` | 置顶条目加左侧 4rpx accent line + Georgia 引号装饰、send-card 渐入动画 |
| `pages/timeline` | role filter 改为纯文字 + 下划线（无背景 pill）、timeline dot 加 outer ring、date banner 编辑感装饰 |
| `pages/guide` | tab 改为纯文字 + 2rpx 细线下划线指示器、venue/transport/hotel 卡片加 shadow-xs、weather 卡片渐入 |
| `pages/album` | photo-item 按压 scale(0.98)、empty state 容器调整 |
| `pages/more` | menu-group 加 shadow-xs、menu-item 箭头按压右滑、share-btn 加 letter-spacing |
| `pages/poster` | action-btn 加 letter-spacing + shadow、状态条加边框 |

### 安全保障

- 所有改动只涉及 `<style>` 块
- 未修改任何 JS / TS 逻辑、未修改路由、未修改主题色 token、未修改 icon SVG
- 新增 token 与原有 token 命名规范一致（`$xxx` 风格）
- 新增 utility class（`.quick-item::before` 等）使用 `var(--theme-xxx, $fallback)` 双兜底，在 7 套主题下行为一致
- 所有 `page-tag` / `page-title` 的 padding / gutter 数值未变，**未破坏**现有页面布局
- font-size / line-height 调整均在 ±2rpx 范围内

---

## 核心功能

### 婚书请柬

- 7 套视觉/方案模板（传统红金、现代简约、极简纯白、新中式礼宴、山东家宴、异地宾客友好等）
- 支持免费/高级模板分层、写实模板主图、统一主题色、完整模拟预览
- 背景音乐、封面文案、婚礼信息、隐私与功能开关

### 宾客行动台（首页）

- 倒计时 + 新人信息 + 婚礼信息
- 6 个快速入口（相册/路书/流程/RSVP/祝福/海报）
- 浮窗快捷分享

### 婚纱相册

- 主人端上传 + 宾客端瀑布流/轮播展示
- 海报封面支持 `cloud://` 与 base64 小程序码

### 婚礼路书

- 腾讯位置服务地图标记、一键导航
- 婚礼当天天气预报（含降级/重试）
- 交通方式、酒店住宿、停车、角色路线提示

### 流程时间线

- 婚礼当天完整时间轴，自动高亮「进行中/已完成/即将开始」
- 支持普通宾客、伴郎伴娘、双方父母、摄影司仪角色筛选

### RSVP 宾客管理

- 回执收集、出席统计、饮食偏好记录
- 手机号是否必填由主人配置
- 服务端必填、长度、内容安全三重校验

### 祝福墙

- 文字祝福提交、主人审核置顶
- 支持公开/私密展示、匿名祝福开关
- 同一宾客重复打开识别（`is_current_user`）

### 海报生成

- Canvas 绘制精美分享海报
- 读取当前模板调色板，不再固定黑金风格
- 含小程序码（`wxacode.getUnlimited`）

### 主人端运营/商业化基础

- 主人资料同步（`syncOwnerProfile`）、权益位（免费版/高级版/商家版）
- 「账号与权益」页面、「发布诊断」页面
- 模板配置含 `commercial` 状态字段，便于后续接微信支付
- 完整模板预览：每套模板带虚拟婚礼示例，可切换首页/路书/流程/RSVP/祝福/相册/海报模拟界面

---

## 技术栈

| 模块 | 选型 |
|---|---|
| 框架 | uni-app (Vue 3) + Vite |
| UI | uni-ui + 自定义婚礼主题组件 |
| 状态管理 | Pinia |
| 后端 | 微信云开发（CloudBase）— 数据库 + 存储 + 云函数 |
| 地图 | 腾讯位置服务 |
| 设计系统 | 全局 SCSS（`uni.scss`），3 套配色 + 7 套主题 + 3 级字距 + 3 级阴影 |
| 校验 | 微信 `security.msgSecCheck` 内容安全 |
| CI | `upload.mjs` / `upload-ci.mjs`（环境变量注入） |

---

## 快速开始

### 1. 克隆与安装

```bash
git clone https://github.com/kdnsna/wedding-navigator.git
cd wedding-navigator/wedding-miniprogram
pnpm install
```

### 2. 配置云开发环境

修改 `config/cloud.js` 中的 `CLOUD_ENV` 为你的云开发环境 ID：

```js
export const CLOUD_ENV = 'your-cloud-env-id'
```

### 3. 填写 manifest

- `manifest.json` 中填入你的小程序 `appid`
- 生产环境需在腾讯位置服务申请 Key，填入 `manifest.json` 地图字段
- 体验版/已发布后才能生成小程序码海报（`wxacode.getUnlimited`）

### 4. 运行到微信开发者工具

```bash
pnpm dev:mp-weixin
```

### 5. 部署云函数

在微信开发者工具中，右键 `cloudfunctions/` 下的每个云函数目录，选择「上传并部署：云端安装依赖」。

也可以用 `cloudbaserc.json` 一次性部署：

```bash
# 当前已加入 generatePoster、getWedding、createWedding 等 15 个云函数
tcb fn deploy
```

### 6. 发布前自检

```bash
pnpm check:release
```

会校验云函数全量部署、OpenAPI 权限、CI 上传脚本安全、宾客回执识别、模板分层等 P0/P1/P2 断言。

---

## 项目结构

```
wedding-navigator/
├── wedding-miniprogram/           # 小程序源码（uni-app）
│   ├── pages/                     # 宾客端（7 页）：首页/相册/路书/流程/RSVP/祝福墙/更多
│   │   └── poster/                # 海报页
│   ├── pages-owner/               # 主人端（10 页，subPackages 分包）
│   │   ├── wizard/                # 创建婚礼向导
│   │   ├── manage/                # 管理后台首页
│   │   ├── invitation/edit.vue    # 婚书编辑（含背景音乐）
│   │   ├── guide/edit.vue         # 路书编辑（场地/交通/住宿）
│   │   ├── timeline/edit.vue      # 流程编辑
│   │   ├── guests/manage.vue      # 宾客管理
│   │   ├── album/manage.vue       # 相册管理
│   │   ├── blessing/manage.vue    # 祝福管理
│   │   ├── share/index.vue        # 分享设置
│   │   ├── stats/index.vue        # 数据统计
│   │   └── poster/index.vue       # 海报管理
│   ├── cloudfunctions/            # 15 个云函数
│   │   ├── createWedding/         # 创建婚礼（初始化所有集合）
│   │   ├── getWedding/            # 读取婚礼（并行查询所有关联集合）
│   │   ├── updateWedding/         # 更新指定集合（带权限校验）
│   │   ├── deleteWedding/         # 删除婚礼
│   │   ├── submitRSVP/            # 提交 RSVP（内容安全 + 服务端必填）
│   │   ├── submitBlessing/        # 提交祝福（内容安全 + 服务端必填）
│   │   ├── pinBlessing/           # 置顶/取消置顶祝福
│   │   ├── recordView/            # 记录浏览
│   │   ├── getStats/              # 统计数据
│   │   ├── getRSVPStats/          # RSVP 统计
│   │   ├── generatePoster/        # 生成小程序码海报
│   │   ├── getWeather/            # 婚礼当天天气
│   │   ├── geocodeVenue/          # 地理编码
│   │   ├── checkOwnership/        # 权限校验
│   │   └── syncOwnerProfile/      # 主人资料同步（商业化基础）
│   ├── components/                # 公共组件（海报绘制等）
│   ├── stores/                    # Pinia：user.js + wedding.js
│   ├── composables/               # useCloud.js + useOwnerGuard.js
│   ├── utils/                     # 工具函数库
│   ├── config/                    # 云配置集中管理
│   ├── scripts/                   # check-release-readiness.js + copy-cloudfunctions
│   ├── upload.mjs                 # 微信开发者工具上传
│   ├── upload-ci.mjs              # 微信 CI 上传（环境变量注入）
│   ├── cloudbaserc.json           # 15 个云函数部署清单
│   ├── App.vue                    # 全局应用配置
│   ├── main.js                    # 入口
│   ├── manifest.json              # 小程序配置
│   ├── pages.json                 # 页面路由
│   ├── uni.scss                   # 全局 SCSS 设计系统
│   └── RELEASE-AUDIT.md           # 上线前全功能审查清单
│
├── assets/                        # 设计素材与参考文档
│   ├── 小程序设计方案.md
│   └── 调研报告.md
│
├── DESIGN.md                      # 设计方案参考 1
├── DESIGN-v2.md                   # 综合设计方案
├── AGENTS.md                      # 项目规范与长期记忆
└── README.md                      # 本文件
```

---

## 设计系统速查

详细设计规范见 `wedding-miniprogram/uni.scss` 与 `AGENTS.md`，核心 token：

| 类别 | 变量 | 默认值 | 用途 |
|---|---|---|---|
| 主色 | `$text-primary` | `#1A1A1A` | 标题、按钮、核心文字 |
| 暗玫瑰红 | `$text-accent` | `#B03A5B` | 强调、点缀、链接 |
| 香槟金 | `$text-gold` | `#C9A96E` | 装饰、辅助强调 |
| 边框 | `$border-color` / `$hairline-soft` | 6% / 6% / 8% / 12% 透明度 | 4 档 |
| 阴影 | `$shadow-xs` / `$shadow-sm` / `$shadow-md` | 0.04 / 0.06 / 0.10 | 3 级深度 |
| 字距 | `$ui-letter-spacing` | `0` | 全局中文默认 |
| 字距 | `$tracking-cn` | `0.04em` | 标题（已默认应用） |
| 字距 | `$tracking-kicker` | `0.12em` | 英文小标 |
| 缓动 | `$ease-editorial` | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | hover/active |
| 动效 | `fadeInUp` / `fadeInScale` / `gentleFloat` / `glowPulse` | — | 8 套预设动效 |

**7 套主题**：`theme-rose`（默认）/ `theme-champagne` / `theme-noir` / `theme-garden` / `theme-heritage` / `theme-shandong` / `theme-travel`，通过根类切换 CSS 变量。

---

## 设计文档

- `DESIGN-v2.md` — 综合设计方案
- `DESIGN.md` — 参考方案 1
- `assets/小程序设计方案.md` — 参考方案 2
- `wedding-miniprogram/RELEASE-AUDIT.md` — 上线前全功能审查清单
- `wedding-miniprogram/uni.scss` — 全局设计系统源码

---

## 开发记录

| 阶段 | 内容 | 状态 |
|---|---|---|
| Phase 1 | 婚书 + 相册 + 路书 + 分享 | ✅ |
| Phase 2 | 流程 + RSVP + 祝福墙 | ✅ |
| Phase 3 | 体验优化 + 数据统计 | ✅ |
| Phase 4 | UI 视觉全面升级（中国红+香槟金） | ✅ |
| Phase 5 | 高级简约无界设计重构 | ✅ |
| Phase 6 | 海报生成 + 天气 + 交通住宿 + 背景音乐 | ✅ |
| Phase 7 | 甜囍手册产品化：方案模板 + 功能开关 + 分享云同步 + 隐私收敛 | ✅ |
| Phase 8 | P1 像素级一致性：全局设计 token、按钮/表单/空状态/安全区统一 | ✅ |
| Phase 9 | P2 大众化/商业化基础：主人账号、权益位、发布诊断、模板分层 | ✅ |
| Phase 10 | 模板主题一致性：封面主图、宾客页背景、模块色彩和海报调色板统一 | ✅ |
| Phase 11 | 模板完整预览：虚拟婚礼数据 + 首页/路书/流程/RSVP/祝福/相册/海报模拟 | ✅ |
| Phase 12 | 写实模板主图：每套模板绑定竖版婚纱照，首页/模板预览/分享海报统一兜底 | ✅ |
| Phase 13 | 上线前全功能审查：15 个云函数部署清单、内容安全权限、上传脚本、RSVP/祝福服务端校验 | ✅ |
| **Phase 14** | **整体视觉精修（uni.scss + 8 个宾客端页面 + App.vue），零 JS 改动** | ✅ |

---

## 常见问题

1. **云开发环境**：首次使用需在小程序后台开通云开发，并修改 `config/cloud.js` 中的 `CLOUD_ENV`
2. **云函数部署**：新增/修改云函数后需右键「上传并部署：云端安装依赖」，或用 `cloudbaserc.json` 一次性部署
3. **地图 Key**：生产环境需申请腾讯位置服务 Key，填入 `manifest.json`
4. **小程序分包**：主人端使用 subPackages 分包，确保主包不超过 2MB
5. **云开发额度**：注意免费额度，图片存储按量计费，建议压缩后上传
6. **背景音乐**：iOS 需用户点击页面后才可自动播放，已在首页做兼容处理
7. **海报生成**：依赖 `wxacode.getUnlimited`，需小程序已发布或体验版
8. **天气数据**：`getWeather` 云函数支持和风天气 API，未配置时返回模拟数据

---

## 长期约束

1. **云端优先**：主人端所有写操作先调用云函数同步云端，再缓存本地（离线兜底）
2. **双角色架构**：主人端（读写全部）+ 宾客端（只读 + RSVP/祝福提交）
3. **模板风格**：3 套请柬风格（传统红金、现代简约、极简纯白）+ 4 套方案模板（新中式、山东家宴、异地宾客友好等）
4. **移动端优化**：uni-app 跨端适配，以微信小程序为主
5. **日期格式**：统一使用 `2026年11月14日` 格式
6. **时间线高亮**：婚礼当天自动根据当前时间高亮进行中/已完成/即将开始的节点
7. **视觉系统**：高级简约无界设计（纯白背景 + 近黑文字 + 暗玫瑰红点缀）
8. **动画规范**：fadeInUp / fadeInScale / gentleFloat / glowPulse
9. **零 JS 风险视觉精修**：所有视觉改动仅限 `<style>` 块，不改逻辑、不改路由、不改主题色 token

---

## License

MIT
