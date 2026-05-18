# 甜囍手册

> 2026年11月14日 · 一场专属婚礼的全流程导航小程序

## 项目简介

「甜囍手册」是一款专为婚礼打造的微信小程序，集**婚书请柬**、**婚纱相册**、**婚礼路书**、**流程时间线**、**RSVP 宾客管理**、**祝福墙**、**海报生成**于一体。

采用「主人编辑端 + 宾客展示端」双角色架构，主人通过手机号验证后可编辑所有内容，宾客则浏览请柬、提交回执和祝福。所有数据通过微信云开发实时同步，确保两端数据一致。

### 核心功能

| 模块 | 宾客端 | 主人端 |
|------|--------|--------|
| 婚书请柬 | 浏览请柬（3种模板风格 + 背景音乐） | 编辑请柬、切换风格、设置音乐 |
| 婚纱相册 | 瀑布流 / 轮播浏览 | 上传 / 删除 / 排序管理 |
| 婚礼路书 | 查看场地地图 / 天气 / 交通 / 住宿 | 编辑场地 / 交通 / 住宿信息 |
| 流程时间线 | 查看婚礼当天时间轴，当前节点自动高亮 | 增删改时间节点，角色筛选 |
| RSVP 回执 | 提交出席 / 饮食偏好 / 留言 | 查看出席统计 / 宾客列表 |
| 祝福墙 | 提交文字祝福 | 审核置顶 / 删除祝福 |
| 海报生成 | — | Canvas 绘制分享海报 + 小程序码 |
| 数据统计 | — | 浏览量 / RSVP 统计 / 祝福统计 |
| 分享设置 | — | 自定义分享标题 / 描述 / 封面 |

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | uni-app (Vue3) + Vite |
| UI | uni-ui + 自定义婚礼主题组件 |
| 状态管理 | Pinia |
| 后端 | 微信云开发（CloudBase）— 数据库 + 存储 + 云函数 |
| 地图 | 腾讯位置服务 |
| 设计系统 | 全局 SCSS（uni.scss），3 套配色体系 |

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/sanchui/wedding-navigator.git
cd wedding-navigator/wedding-miniprogram
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置云开发环境

修改 `config/cloud.js` 中的 `CLOUD_ENV` 为你的云开发环境 ID：

```js
export const CLOUD_ENV = 'your-cloud-env-id'
```

### 4. 运行到微信开发者工具

```bash
pnpm dev:mp-weixin
```

### 5. 部署云函数

在微信开发者工具中，右键 `cloudfunctions/` 下的每个云函数目录，选择「上传并部署：云端安装依赖」。

> 首次使用时，`createWedding` 云函数会自动创建所需的数据库集合，无需手动建表。

## 项目结构

```
wedding-miniprogram/
├── pages/                  # 宾客端（8页）
│   ├── index/              # 首页 — 倒计时、新人信息、背景音乐
│   ├── album/              # 婚纱相册
│   ├── guide/              # 婚礼路书（地图 / 天气 / 交通 / 住宿）
│   ├── timeline/           # 流程时间线
│   ├── rsvp/               # RSVP 回执
│   ├── blessing/           # 祝福墙
│   ├── poster/             # 海报展示与分享
│   └── more/               # 更多入口
│
├── pages-owner/            # 主人端（10页，subPackages 分包）
│   ├── wizard/             # 创建婚礼向导
│   ├── manage/             # 管理后台首页
│   ├── invitation/edit     # 婚书编辑（含背景音乐设置）
│   ├── guide/edit          # 路书编辑（场地 / 交通 / 住宿）
│   ├── timeline/edit       # 流程编辑
│   ├── guests/manage       # 宾客管理
│   ├── album/manage        # 相册管理
│   ├── blessing/manage     # 祝福管理
│   ├── share/              # 分享设置
│   ├── poster/             # 海报管理
│   └── stats/              # 数据统计
│
├── cloudfunctions/         # 云函数（11个）
│   ├── createWedding       # 创建婚礼（自动建表）
│   ├── getWedding          # 读取婚礼完整数据
│   ├── updateWedding       # 更新指定集合（权限校验）
│   ├── submitRSVP          # 提交 RSVP
│   ├── submitBlessing      # 提交祝福
│   ├── pinBlessing         # 置顶 / 取消置顶
│   ├── recordView          # 记录浏览量
│   ├── getStats            # 综合统计
│   ├── getRSVPStats        # RSVP 统计
│   ├── getWeather          # 天气预报（和风天气 API）
│   ├── generatePoster      # 生成小程序码海报
│   └── checkOwnership      # 主人身份验证
│
├── components/             # 公共组件
├── stores/                 # Pinia 状态管理（user + wedding）
├── composables/            # useCloud + useOwnerGuard
├── utils/                  # 工具函数 + 海报绘制
├── config/                 # 云配置集中管理
├── uni.scss                # 全局 SCSS 设计系统
├── App.vue                 # 全局应用配置
├── main.js                 # 入口
├── manifest.json           # 小程序配置
├── pages.json              # 页面路由
└── package.json            # 依赖
```

## 数据架构

采用微信云开发数据库，核心集合：

| 集合 | 说明 |
|------|------|
| `weddings` | 婚礼主文档（basic_info、owner_openid） |
| `invitations` | 请柬数据（模板风格、背景音乐、文案） |
| `venues` | 场地 + 交通 + 住宿 |
| `timelines` | 流程时间线事件列表 |
| `guests` | 宾客列表与 RSVP 状态 |
| `blessings` | 祝福消息（含置顶标记） |
| `albums` | 相册图片列表 |
| `share_stats` | 浏览 / 分享统计 |

数据流：**主人端编辑 → updateWedding 云函数 → 云数据库 → 宾客端 fetchWedding 读取**，localStorage 作为离线兜底。

## 设计文档

- `DESIGN-v2.md` — 综合设计方案
- `DESIGN.md` — 参考方案 1
- `assets/小程序设计方案.md` — 参考方案 2

## 开发记录

| 阶段 | 内容 | 状态 |
|------|------|------|
| Phase 1 | 婚书 + 相册 + 路书 + 分享 | ✅ |
| Phase 2 | 流程 + RSVP + 祝福墙 | ✅ |
| Phase 3 | 体验优化 + 数据统计 | ✅ |
| Phase 4 | UI 视觉全面升级（中国红 + 香槟金） | ✅ |
| Phase 5 | 高级简约无界设计重构 | ✅ |
| Phase 6 | 海报生成 + 天气 + 交通住宿 + 背景音乐 | ✅ |
| Phase 7 | 云端数据同步架构 + 权限验证 + 边界安全加固 | ✅ |

## 注意事项

- **云开发环境**：首次使用需在小程序后台开通云开发，修改 `config/cloud.js` 中的 `CLOUD_ENV`
- **云函数部署**：新增 / 修改云函数后需右键「上传并部署：云端安装依赖」
- **地图 Key**：生产环境需申请腾讯位置服务 Key，填入 `manifest.json`
- **小程序分包**：主人端使用 subPackages 分包，确保主包不超过 2MB
- **云开发额度**：注意免费额度，图片存储按量计费，建议压缩后上传
- **背景音乐**：iOS 需用户点击页面后才可自动播放，已在首页做兼容处理
- **海报生成**：依赖 `wxacode.getUnlimited`，需小程序已发布或体验版
- **天气数据**：`getWeather` 云函数支持和风天气 API，未配置时返回模拟数据

## License

MIT
