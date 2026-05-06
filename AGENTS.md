# Wedding Navigator - 婚礼导航项目规范

## 项目概述

婚礼全流程导航产品，专为主人 2026年11月14日婚礼打造的专属婚礼导航网页应用。集婚书请柬、路书导航、流程时间线、宾客管理于一体。

## 技术栈

- **前端框架**：原生 HTML + CSS + JavaScript（无构建工具）
- **样式方案**：Tailwind CSS (CDN) + 自定义 CSS 设计系统
- **地图服务**：高德地图 Web API
- **字体**：思源宋体 (Noto Serif SC) + 思源黑体 (Noto Sans SC) 从 Google Fonts 加载
- **设计系统**：完整的色彩变量、阴影层级、动画缓动曲线、圆角系统
- **视觉效果**：玻璃拟态导航、渐变卡片、微交互动效、页面装饰纹理
- **项目类型**：纯静态多页面 Web 应用
- **项目类型 (coze)**：web（可预览、可部署为静态服务）

## 目录结构

```
wedding-navigator/
├── index.html          # 首页/导航入口
├── invitation.html     # 婚书/请柬页面
├── route.html          # 路书/导航页面
├── timeline.html       # 流程时间线页面
├── guests.html         # 宾客管理页面（RSVP、名单、统计）
├── setting.json        # 配置文件（新人信息、场地、时间线等）
├── css/
│   └── style.css       # 全局样式
├── js/
│   ├── app.js          # 主应用逻辑
│   ├── config.js       # 配置加载模块
│   ├── map.js          # 地图功能模块
│   ├── export.js       # 导出功能模块（图片/PDF/二维码）
│   └── guests.js       # 宾客管理模块
├── scripts/            # Coze 预览/部署脚本
│   ├── coze-preview-build.sh
│   ├── coze-preview-run.sh
│   ├── coze-deploy-build.sh
│   └── coze-deploy-run.sh
├── .coze               # Coze 项目配置
├── AGENTS.md           # 项目规范（本文档）
└── README.md
```

## 关键入口 / 核心模块

### 入口页面
- `index.html` - 首页，显示倒计时和新人大名，提供三个功能入口

### 功能页面
- `invitation.html` - 婚书请柬，支持三种模板风格（传统红金、现代简约、极简高级），可编辑婚礼日期/时间/地点，支持图片/PDF导出和二维码分享
- `route.html` - 婚礼路书，多点路线串联，一键导航，场地与时间关联显示
- `timeline.html` - 流程时间线，婚礼当天完整时间轴，角色筛选，当前节点自动高亮
- `guests.html` - 宾客管理，RSVP回执、出席统计、二维码邀请、饮食偏好记录

### 配置系统
- `setting.json` - 统一配置，包含新人信息、婚礼日期、场地坐标、时间线等
- `js/config.js` - 配置加载和校验模块

### 功能模块
- `js/app.js` - 主应用逻辑，首页和通用功能，时间线节点状态管理
- `js/map.js` - 高德地图集成，路线规划和导航，距离/时间估算
- `js/export.js` - 请柬导出功能（图片/PDF/二维码分享）
- `js/guests.js` - 宾客管理模块（CRUD、筛选、统计、RSVP）

## 运行与预览

### 本地预览
```bash
# 使用 Python 方式
python -m http.server 8080

# 使用 Node.js 方式
npx serve .

# 直接打开
open index.html
```

### Coze 预览
```bash
# 构建
bash scripts/coze-preview-build.sh

# 运行
bash scripts/coze-preview-run.sh
# 预览地址: http://localhost:5000
```

### 部署方式
- GitHub Pages（已有配置）
- 任意静态文件托管服务
- Coze 部署（静态服务，端口 5000）

## 用户偏好与长期约束

1. **配置优先**：所有可定制内容都在 `setting.json` 中管理，同时支持 localStorage 本地持久化
2. **模板风格**：支持三种请柬风格切换（传统红金、现代简约、极简高级）
3. **移动端优化**：使用 Tailwind 的响应式类，确保手机端体验
4. **日期格式**：统一使用 "2026年11月14日" 格式
5. **宾客数据**：宾客名单和 RSVP 数据仅存储在浏览器 localStorage 中，不上传服务器
6. **时间线高亮**：婚礼当天自动根据当前时间高亮进行中/已完成/即将开始的节点
7. **视觉系统**：使用思源宋体作为标题字体，思源黑体作为正文字体，保持中国传统婚礼美学
8. **动画规范**：使用 CSS 变量 `--ease-out-expo` 和 `--ease-out-back` 作为标准缓动曲线

## Coze 配置说明

### .coze 结构
- 工作区根目录与技术项目根目录重合（`/workspace/projects`）
- `path = "."`，根 `.coze` 同时承担子项目 `.coze` 的职责

### 预览链路
- **preview_enable**: enabled
- **dev.build**: `scripts/coze-preview-build.sh`（空操作）
- **dev.run**: `scripts/coze-preview-run.sh`（Python http.server，端口 5000）

### 部署链路
- **deploy.profile.kind**: service
- **deploy.profile.flavor**: web
- **deploy.build**: `scripts/coze-deploy-build.sh`（空操作）
- **deploy.run**: `scripts/coze-deploy-run.sh`（Python http.server，端口 5000）

## 小程序升级计划

项目已完成静态网页版（MVP）和微信小程序版（uni-app）。小程序源码位于 `wedding-miniprogram/` 目录，建立"主人编辑端 + 客人展示端"双角色体系。

### 技术选型（综合方案）

- **框架**：uni-app (Vue3) — 开发效率高，一套代码可多平台发布
- **UI 框架**：uni-ui + 自定义婚礼主题组件
- **状态管理**：Pinia
- **后端**：微信云开发（CloudBase）— 免运维，数据库+存储+云函数
- **地图**：腾讯位置服务 — 小程序原生导航体验

### 设计方案

- 综合设计方案文档：`DESIGN-v2.md`
- 参考方案1（我方设计）：`DESIGN.md`
- 参考方案2（用户提供的调研方案）：`assets/小程序设计方案.md`

### 双角色架构

| 维度 | 主人端 | 客人端 |
|------|--------|--------|
| 入口 | 手机号+验证码验证 | 分享卡片/小程序码 |
| 权限 | 读写全部 | 只读 + RSVP/祝福提交 |
| 页面 | 管理后台（10+编辑页） | Tab导航（5 Tab + 内页） |

### 核心模块（7大功能）

1. 婚书请柬（3套模板 + 文案/音乐/预览）
2. 婚纱相册（上传/瀑布流/轮播）
3. 婚礼路书（地图标记/一键导航/路线规划）
4. 流程时间线（编辑/角色管理/自动高亮）
5. RSVP宾客管理（回执/统计/导出/提醒）
6. 祝福墙（文字/语音/审核/置顶）
7. 分享与统计（小程序码/卡片/数据面板）

### 小程序源码结构

```
wedding-miniprogram/
├── pages/              # 宾客端（7页）：首页/相册/路书/流程/RSVP/祝福墙/更多
├── pages-owner/        # 主人端（10页，subPackages分包）：向导/管理/编辑页
├── cloudfunctions/     # 9个云函数：CRUD/RSVP/祝福/统计
├── stores/             # Pinia：user.js + wedding.js
├── composables/        # useCloud.js 云开发API封装
├── utils/              # 工具函数库
└── uni.scss            # 全局SCSS设计系统（3套配色）
```

### 开发阶段

- Phase 1（MVP）：婚书 + 相册 + 路书 + 分享 ✅
- Phase 2（V1.0）：流程 + RSVP + 祝福墙 ✅
- Phase 3（V1.1）：体验优化 + 数据统计 ✅
- Phase 4（V1.2）：UI 视觉全面升级 ✅
  - 全局设计系统重构（uni.scss + App.vue）
  - 中国红+香槟金+奶油白配色体系
  - 金色装饰线、渐变背景、毛玻璃卡片
  - 全局动画系统（fadeInUp / fadeInScale / gentleFloat / glowPulse）
  - 宾客端7页 + 主人端10页全面视觉升级
- Phase 5（V1.3）：高级简约无界设计重构 ✅
  - 全新配色：纯白背景 + 近黑文字 + 暗玫瑰红点缀
  - 去装饰化：去掉金色分割线、角落装饰
  - 去卡片化：留白+分隔线替代卡片包裹
  - 大留白 + 大字号排版
  - 按钮统一黑色胶囊
  - 宾客端7页彻底重写
- Phase 6（V2.0）：语音祝福 + 角色视图 + 导出（后续迭代）

---

## 常见问题和预防

1. **高德地图 Key**：生产环境需要申请真实的高德地图 Web API Key
2. **跨域问题**：本地开发时注意 CORS 配置（如需代理）
3. **静态资源路径**：确保 css/js 路径相对于 HTML 文件正确
4. **端口冲突**：预览和部署都使用 5000 端口，脚本内置幂等性处理
5. **宾客数据丢失**：宾客数据存在 localStorage，清除浏览器数据会丢失，建议定期导出备份
6. **二维码分享**：请柬和宾客页面的二维码分享依赖 qrcode.js CDN，网络不稳定时可使用复制链接功能
7. **小程序分包**：主人编辑页使用 subPackages 分包，确保主包不超过 2MB
8. **云开发额度**：注意云开发免费额度，图片存储按量计费，建议压缩后上传
