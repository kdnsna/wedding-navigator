# Wedding Navigator Mini Program

婚礼导航微信小程序 —— 基于 uni-app + Vue3 + Pinia + 微信云开发的婚礼全流程管理小程序。

## 功能特性

### 宾客端（客人展示）
- **婚书首页**：精美请柬长页，含封面、倒计时、婚礼信息、快速入口
- **婚纱相册**：瀑布流展示婚纱照，支持图片预览
- **婚礼路书**：地图标记 + 场地列表，一键导航、拨打电话
- **流程时间线**：婚礼当天完整时间轴，自动高亮当前节点
- **RSVP回执**：在线填写出席信息、人数、饮食偏好
- **祝福墙**：发送文字祝福，主人可审核置顶

### 主人端（编辑管理）
- **创建向导**：4步流程创建婚礼（婚期→场地→模板→新人信息）
- **管理后台**：数据概览、功能网格导航、快捷操作
- **婚书编辑**：模板切换、文案编辑、新人信息、功能开关
- **相册管理**：上传、删除、设为封面
- **路书编辑**：场地CRUD管理（名称/地址/坐标/电话/时间）
- **流程编辑**：时间节点CRUD管理
- **宾客管理**：RSVP统计、筛选查看、添加/编辑/删除宾客
- **祝福管理**：查看祝福、置顶/取消置顶、删除
- **分享设置**：分享卡片文案、复制小程序路径
- **数据统计**：浏览量、分享次数、RSVP统计、饮食偏好

## 技术栈

- **框架**：uni-app (Vue3 + Vite)
- **状态管理**：Pinia
- **样式**：SCSS + CSS 变量设计系统
- **后端**：微信云开发（CloudBase）
- **地图**：腾讯位置服务 / 微信小程序原生 map 组件
- **数据库**：云开发 MongoDB（8个集合）

## 目录结构

```
wedding-miniprogram/
├── cloudfunctions/          # 微信云函数
│   ├── createWedding/       # 创建婚礼
│   ├── getWedding/          # 获取婚礼数据
│   ├── updateWedding/       # 更新婚礼数据
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
│   └── index.js             # 通用工具
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

## 本地开发

### 环境要求
- Node.js >= 18
- HBuilderX 或 VS Code + uni-app 插件
- 微信开发者工具

### 安装依赖

```bash
cd wedding-miniprogram
pnpm install
```

### 配置

1. 在 `manifest.json` 中配置你的微信小程序 AppID
2. 在 `composables/useCloud.js` 中配置云开发环境ID（如已绑定则留空）
3. 在 `cloudfunctions/*/config.json` 中按需配置权限

### 运行到微信开发者工具

使用 HBuilderX：
```
运行 -> 运行到小程序模拟器 -> 微信开发者工具
```

或使用 CLI：
```bash
pnpm dev:mp-weixin
```

然后在微信开发者工具中打开 `dist/dev/mp-weixin` 目录。

## 部署

### 1. 开通微信云开发

在微信公众平台/小程序后台开通云开发，获取环境ID。

### 2. 部署云函数

在微信开发者工具中：
```
云开发 -> 云函数 -> 右键每个云函数目录 -> 创建并部署：云端安装依赖
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

### 5. 配置分享

在小程序后台配置页面分享权限，确保 `pages/index/index` 可被分享。

## 设计系统

三套配色方案：
- **传统中国风**（默认）：中国红 + 金色
- **现代简约风**：香槟金 + 象牙白
- **轻奢金棕风**：深棕 + 玫瑰金

修改 `uni.scss` 中的颜色变量即可切换主题。

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
