# 婚礼导航小程序 — 综合设计方案 v2.0

> 版本：v2.0（综合版）
> 目标：将现有静态网页升级为微信小程序，建立"主人编辑端 + 客人展示端"双角色体系

---

## 一、核心定位

```
┌─────────────────────────────────────────────────────────────────┐
│                      婚礼导航小程序                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   【主人端】                              【客人端】              │
│   ┌─────────────────────┐               ┌─────────────────────┐ │
│   │  婚书编辑器           │               │  精美请柬展示页      │ │
│   │  婚纱照片上传/管理     │ ──分享──▶     │  婚纱照片瀑布流      │ │
│   │  婚礼信息编辑         │               │  婚礼时间地点信息    │ │
│   │  宾客管理/RSVP统计    │               │  RSVP一键回执       │ │
│   │  地图路线配置         │               │  一键导航           │ │
│   │  流程时间线编辑       │               │  婚礼流程时间线      │ │
│   │  祝福墙管理           │               │  祝福留言板         │ │
│   │  分享与数据统计       │               │                     │ │
│   └─────────────────────┘               └─────────────────────┘ │
│                                                                 │
│   一个入口：进入时通过主人手机号后4位判断身份                      │
│   一条链路：编辑完成 → 生成分享卡片/小程序码 → 客人进入展示页      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 双角色架构

| 维度 | 主人端（新郎/新娘） | 客人端（被分享者） |
|------|---------------------|---------------------|
| **入口方式** | 手机号+验证码 / 主人身份验证 | 分享卡片 / 小程序码 / 链接 |
| **核心诉求** | 编辑内容、管理数据、查看统计 | 获取信息、确认出席、导航到场、发送祝福 |
| **页面风格** | 工具化、功能密集、可编辑 | 精美展示、沉浸浏览、轻交互 |
| **数据权限** | 读写全部 | 只读 + RSVP提交 + 祝福提交 |
| **常驻页面** | 管理后台（工作台） | 请柬展示页 + Tab功能页 |

---

## 二、技术架构

### 2.1 技术选型

| 层次 | 方案 | 理由 |
|------|------|------|
| **框架** | uni-app (Vue3) | 开发效率高，Vue语法普及，一套代码可发布到微信小程序/支付宝/抖音等多平台，与现有网页项目可共享部分代码 |
| **UI 框架** | uni-ui + 自定义组件 | uni-app官方组件库，轻量稳定，同时保留自定义婚礼主题组件 |
| **样式方案** | SCSS + CSS 变量 | 支持嵌套和变量，保留当前设计系统资产，易于维护多主题 |
| **状态管理** | Pinia | Vue3官方推荐，TypeScript友好，开发体验优于Vuex |
| **云开发** | 微信云开发（CloudBase） | 免费额度够用，免运维，内置数据库+存储+云函数，与微信生态深度集成 |
| **地图** | 腾讯位置服务 + 微信地图组件 | 小程序内原生唤起地图导航，体验最佳，支持一键导航插件 |
| **图片存储** | 云存储 COS | 婚纱照片、头像等静态资源，支持CDN加速 |
| **后端** | 云函数 | 免服务器运维，自动扩缩容，微信登录/支付/消息推送直接对接 |

### 2.2 为什么不继续用静态网页？

| 能力 | 静态网页 | 微信小程序 |
|------|----------|------------|
| 微信分享 | H5链接，卡片样式不可控 | 可自定义分享卡片标题/图片/描述 |
| 扫码进入 | 需要配置域名/二维码 | 天然支持小程序码，带参数直达 |
| 照片上传 | 需要自建上传服务 | 云存储SDK一行代码上传 |
| 数据持久化 | localStorage（易丢失） | 云数据库（可靠持久，多端同步） |
| 一键导航 | 唤起第三方App（体验断层） | 内置地图组件，无缝导航 |
| 用户体验 | 需浏览器打开 | 原生体验，下拉刷新、手势返回、沉浸式 |
| RSVP收集 | 无后端支持困难 | 云数据库直接写入，实时统计 |
| 消息推送 | 无法实现 | 微信服务通知，婚礼提醒触达 |
| 语音祝福 | 无法实现 | 原生录音API，30秒语音祝福 |

### 2.3 项目架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        微信小程序端                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    uni-app (Vue3)                    │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │   │
│  │  │  Pages      │  │  Components │  │  Composables│ │   │
│  │  │  页面层      │  │  组件层      │  │  逻辑复用   │ │   │
│  │  └─────────────┘  └─────────────┘  └────────────┘ │   │
│  │                                                     │   │
│  │  ┌─────────────────────────────────────────────────┐│   │
│  │  │                 Pinia Store                     ││   │
│  │  │              状态管理（全局状态）                ││   │
│  │  └─────────────────────────────────────────────────┘│   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                               │
│                              ▼                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  API Service Layer                   │   │
│  │                 云函数 / 本地API                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                               │
│                              ▼                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Cloud Services                    │   │
│  │   云数据库 | 云存储 | 云函数 | 消息推送 | 数据分析    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 三、数据库设计

### 3.1 集合结构

采用微信云开发 MongoDB，每个模块独立集合，避免单文档过大。

```javascript
// ===== 用户表 =====
db.collection('users').doc()
{
  _id: string,
  openid: string,              // 微信openid
  role: 'owner' | 'guest',      // 角色
  phone: string,               // 手机号（登录用）
  nickname: string,
  avatar_url: string,
  wedding_ids_owned: string[], // 创建的婚礼ID列表
  attended_wedding_ids: string[], // 参加的婚礼ID
  created_at: Date,
  updated_at: Date
}

// ===== 婚礼主表 =====
db.collection('weddings').doc()
{
  _id: string,
  wedding_id: string,          // 短ID（小程序码参数）
  owner_id: string,            // 创建者用户ID
  owner_phone_last4: string,   // 主人手机号后4位（验证用）
  
  basic_info: {
    date: string,              // "2026-11-14"
    time: string,              // "12:00"
    week_day: string,          // "星期二"
  },
  
  status: 'draft' | 'published' | 'ended',
  
  stats: {
    views: number,
    shares: number,
    rsvp_count: number,
    blessing_count: number,
    unique_viewers: number
  },
  
  // 分享配置
  share_config: {
    title: string,
    description: string,
    cover_image: string
  },
  
  created_at: Date,
  updated_at: Date
}

// ===== 婚书/请柬配置表 =====
db.collection('invitations').doc()
{
  wedding_id: string,
  
  template: string,            // 模板类型: 'classic' | 'modern' | 'luxury'
  color_scheme: string,        // 当前配色方案
  
  content: {
    title: string,             // 主标题
    main_text: string,         // 正文
    sub_text: string,          // 副标题
    story: string              // 爱情故事
  },
  
  couple: {
    groom: {
      name: string,
      phone: string,
      photo: string            // cloudID
    },
    bride: {
      name: string,
      phone: string,
      photo: string
    }
  },
  
  wedding: {
    date: string,
    time: string,
    venue_name: string,
    venue_address: string
  },
  
  media: {
    music: {
      url: string,
      name: string,
      auto_play: boolean
    },
    cover_photos: string[],    // 封面图cloudID列表
    story_photos: string[]     // 故事图cloudID列表
  },
  
  features: {
    show_countdown: boolean,
    show_rsvp: boolean,
    show_blessing: boolean,
    show_timeline: boolean
  },
  
  updated_at: Date
}

// ===== 相册表 =====
db.collection('albums').doc()
{
  wedding_id: string,
  
  photos: [{
    id: string,
    url: string,               // cloudID
    thumbnail_url: string,     // 缩略图cloudID
    width: number,
    height: number,
    caption: string,           // 图片说明
    type: 'cover' | 'gallery' | 'story',
    sort_order: number,
    created_at: Date
  }],
  
  settings: {
    display_mode: 'waterfall' | 'grid' | 'carousel',
    autoplay: boolean,
    autoplay_interval: number,
    enable_download: boolean
  },
  
  updated_at: Date
}

// ===== 场地/路书表 =====
db.collection('venues').doc()
{
  wedding_id: string,
  
  venues: [{
    id: string,
    name: string,
    type: 'home' | 'hotel' | 'venue' | 'hotel_guest' | 'photo',
    address: string,
    coordinate: {
      latitude: number,
      longitude: number
    },
    arrival_time: string,      // "10:00"
    departure_time: string,    // "12:00"
    notes: string,
    contact_phone: string,
    is_recommended_hotel: boolean,
    distance_from_main: number, // 距离主场地距离(米)
    sort_order: number
  }],
  
  routes: [{
    id: string,
    name: string,
    type: 'driving' | 'walking',
    waypoints: string[],       // 场地ID数组
    total_distance: number,    // 米
    total_duration: number     // 分钟
  }],
  
  updated_at: Date
}

// ===== 婚礼流程/时间线表 =====
db.collection('timelines').doc()
{
  wedding_id: string,
  
  events: [{
    id: string,
    time: string,              // "10:30"
    title: string,
    venue_id: string,          // 关联场地ID
    assignee_ids: string[],    // 负责人ID列表
    notes: string,
    is_important: boolean,
    sort_order: number
  }],
  
  roles: [{
    id: string,
    name: string,               // 角色名称
    type: 'couple' | 'bridesmaid' | 'bestman' | 'parent' | 'guest' | 'vendor',
    members: string[]           // 成员名单
  }],
  
  settings: {
    show_countdown: boolean,
    enable_reminder: boolean,
    reminder_minutes_before: number
  },
  
  updated_at: Date
}

// ===== 宾客表 =====
db.collection('guests').doc()
{
  wedding_id: string,
  
  guests: [{
    id: string,
    name: string,
    phone: string,
    rsvp_status: 'pending' | 'attending' | 'declined' | 'uncertain',
    attending_count: number,
    diet_preference: 'normal' | 'vegetarian' | 'halal' | 'other',
    diet_notes: string,
    type: 'family' | 'friend' | 'parent_friend' | 'business',
    table_number: number,
    special_requests: string,
    openid: string,
    created_at: Date,
    updated_at: Date
  }],
  
  updated_at: Date
}

// ===== 祝福墙表 =====
db.collection('blessings').doc()
{
  wedding_id: string,
  
  blessings: [{
    id: string,
    sender: {
      name: string,
      openid: string,
      avatar_url: string
    },
    type: 'text' | 'voice',
    content: string,            // 文字内容或语音cloudID
    voice_duration: number,     // 语音时长(秒)
    is_pinned: boolean,
    is_approved: boolean,
    is_deleted: boolean,
    created_at: Date
  }],
  
  settings: {
    enable_voice: boolean,
    max_voice_duration: number,
    require_approval: boolean,
    show_sender_info: boolean
  },
  
  pinned_blessing: {
    content: string,
    created_at: Date
  },
  
  updated_at: Date
}

// ===== 分享统计表 =====
db.collection('share_stats').doc()
{
  wedding_id: string,
  
  share_count: number,
  view_count: number,
  unique_viewers: number,
  rsvp_count: number,
  blessing_count: number,
  
  daily_stats: [{
    date: string,
    views: number,
    shares: number
  }],
  
  updated_at: Date
}
```

### 3.2 权限规则

```javascript
// 主人权限判断
function isOwner(wedding_id, user_id) {
  const wedding = db.collection('weddings').doc(wedding_id).get()
  return wedding.owner_id === user_id
}

// 主人验证（手机号后4位）
function verifyOwner(wedding_id, phone_last4) {
  const wedding = db.collection('weddings').doc(wedding_id).get()
  return wedding.owner_phone_last4 === phone_last4
}

// 权限矩阵
const permissions = {
  // 所有人
  viewWedding: (wedding_id) => true,
  submitRSVP: (wedding_id) => true,
  submitBlessing: (wedding_id) => true,
  
  // 仅主人
  editWedding: (wedding_id, user_id) => isOwner(wedding_id, user_id),
  manageGuests: (wedding_id, user_id) => isOwner(wedding_id, user_id),
  manageBlessings: (wedding_id, user_id) => isOwner(wedding_id, user_id),
  viewStats: (wedding_id, user_id) => isOwner(wedding_id, user_id)
}
```

---

## 四、页面结构设计

### 4.1 宾客端页面（TabBar 导航）

宾客端采用 **TabBar + 内页** 结构，首屏为精美婚书长滚动，功能模块通过Tab切换。

```
┌──────────────────────────────────────────┐
│              宾客端 TabBar                 │
├────────┬────────┬────────┬────────┬─────┤
│  首页   │  相册   │  路书   │  流程   │ 更多 │
│  💌    │  📷    │  🗺    │  📅    │ ➕  │
└────────┴────────┴────────┴────────┴─────┘
```

| 页面 | 路径 | 功能描述 |
|------|------|----------|
| **婚书首页** | `pages/index/index` | 精美婚书长滚动展示：封面→请柬→照片墙→婚礼信息→RSVP→祝福墙 |
| **相册页** | `pages/album/index` | 婚纱照瀑布流/网格展示，点击放大预览，轮播浏览 |
| **路书页** | `pages/guide/index` | 地图标记所有场地，场地列表，一键导航，路线规划 |
| **流程页** | `pages/timeline/index` | 婚礼当天时间轴，角色筛选，当前节点自动高亮，倒计时 |
| **更多页** | `pages/more/index` | RSVP回执、祝福墙、分享给朋友、我也要制作 |

#### 婚书首页详细结构（长滚动单页）

```
pages/index/index?id=WEDDING_ID

长滚动页面结构：
┌─────────────────────────────────────┐
│  Section 1: 封面（全屏）             │
│  - 婚纱封面图轮播                     │
│  - 新人姓名 + 婚礼日期                │
│  - 倒计时组件                        │
│  - 向下滚动提示动画                   │
├─────────────────────────────────────┤
│  Section 2: 婚书请柬                 │
│  - 选中的模板风格展示                 │
│  - 传统文案/爱情故事                  │
│  - 新人照片                          │
├─────────────────────────────────────┤
│  Section 3: 婚礼信息卡片              │
│  - 日期/时间/农历                     │
│  - 地点名称/详细地址                  │
│  - 一键添加到日历                     │
│  - 一键导航（唤起腾讯地图）           │
├─────────────────────────────────────┤
│  Section 4: 快速入口                  │
│  - [查看相册] [查看路书] [查看流程]   │
├─────────────────────────────────────┤
│  Section 5: 底部区域                  │
│  - 感谢语                            │
│  - "我要出席"按钮 → 跳转RSVP         │
│  - "发送祝福"按钮 → 跳转祝福墙       │
│  - "分享给好友"按钮                   │
│  - "我也要制作"引流入口               │
└─────────────────────────────────────┘

常驻元素：
- 右上角音乐播放/暂停按钮（如有背景音乐）
- 底部快捷工具栏（RSVP / 祝福 / 分享）
```

### 4.2 主人端页面（管理后台 + 子包）

主人端采用 **管理后台首页 + 子包编辑页面** 结构，减少主包体积。

```
┌──────────────────────────────────────────────────────────────┐
│                       管理后台主页                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │  👋 张三 & 李四 的婚礼                    2026.11.14 │    │
│  │  ─────────────────────────────────────────────────  │    │
│  │  📊 数据概览                                        │    │
│  │  浏览 156  │  分享 42  │  RSVP 86人  │  祝福 128条  │    │
│  │                                                     │    │
│  │  🎨 婚书编辑    🖼️ 相册管理    🗺️ 路书设置          │    │
│  │                                                     │    │
│  │  📅 流程编辑    👥 宾客管理    💬 祝福管理           │    │
│  │                                                     │    │
│  │  📤 分享设置    📊 数据统计                        │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

| 页面 | 路径 | 功能描述 |
|------|------|----------|
| **管理后台** | `pages-owner/manage/index` | 数据概览、快捷入口网格、婚礼状态管理 |
| **婚书编辑** | `pages-owner/invitation/edit` | 模板切换、文案编辑、新人信息、婚礼信息、音乐设置、预览 |
| **相册管理** | `pages-owner/album/manage` | 上传/删除/排序/设置封面、批量管理 |
| **路书编辑** | `pages-owner/guide/edit` | 添加/编辑场地、地图选点、路线规划、时间关联 |
| **流程编辑** | `pages-owner/timeline/edit` | 时间轴编辑、节点增删改、角色管理、场地关联 |
| **宾客管理** | `pages-owner/guests/manage` | 宾客CRUD、RSVP统计、筛选搜索、导出名单、发送提醒 |
| **祝福管理** | `pages-owner/blessing/manage` | 祝福审核、置顶/删除、统计、语音播放 |
| **分享设置** | `pages-owner/share/index` | 小程序码生成、分享卡片设置、封面图选择 |
| **数据统计** | `pages-owner/stats/index` | 浏览/分享/RSVP/祝福数据统计、趋势图表 |
| **创建向导** | `pages-owner/wizard/index` | 首次使用引导：婚期→场地→模板→发布 |

### 4.3 页面路由配置

```json
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": { "navigationBarTitleText": "我们的婚礼", "navigationStyle": "custom" }
    },
    {
      "path": "pages/album/index",
      "style": { "navigationBarTitleText": "婚纱相册" }
    },
    {
      "path": "pages/guide/index",
      "style": { "navigationBarTitleText": "婚礼路书" }
    },
    {
      "path": "pages/timeline/index",
      "style": { "navigationBarTitleText": "婚礼流程" }
    },
    {
      "path": "pages/more/index",
      "style": { "navigationBarTitleText": "更多" }
    },
    {
      "path": "pages/rsvp/index",
      "style": { "navigationBarTitleText": "出席回执" }
    },
    {
      "path": "pages/blessing/index",
      "style": { "navigationBarTitleText": "祝福墙" }
    }
  ],
  "subPackages": [
    {
      "root": "pages-owner",
      "pages": [
        { "path": "wizard/index", "style": { "navigationBarTitleText": "创建婚礼" } },
        { "path": "manage/index", "style": { "navigationBarTitleText": "婚礼管理" } },
        { "path": "invitation/edit", "style": { "navigationBarTitleText": "编辑婚书" } },
        { "path": "album/manage", "style": { "navigationBarTitleText": "相册管理" } },
        { "path": "guide/edit", "style": { "navigationBarTitleText": "编辑路书" } },
        { "path": "timeline/edit", "style": { "navigationBarTitleText": "编辑流程" } },
        { "path": "guests/manage", "style": { "navigationBarTitleText": "宾客管理" } },
        { "path": "blessing/manage", "style": { "navigationBarTitleText": "祝福管理" } },
        { "path": "share/index", "style": { "navigationBarTitleText": "分享设置" } },
        { "path": "stats/index", "style": { "navigationBarTitleText": "数据统计" } }
      ]
    }
  ],
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#C41E3A",
    "backgroundColor": "#ffffff",
    "borderStyle": "black",
    "list": [
      { "pagePath": "pages/index/index", "text": "首页", "iconPath": "static/tabbar/home.png", "selectedIconPath": "static/tabbar/home-active.png" },
      { "pagePath": "pages/album/index", "text": "相册", "iconPath": "static/tabbar/album.png", "selectedIconPath": "static/tabbar/album-active.png" },
      { "pagePath": "pages/guide/index", "text": "路书", "iconPath": "static/tabbar/guide.png", "selectedIconPath": "static/tabbar/guide-active.png" },
      { "pagePath": "pages/timeline/index", "text": "流程", "iconPath": "static/tabbar/timeline.png", "selectedIconPath": "static/tabbar/timeline-active.png" },
      { "pagePath": "pages/more/index", "text": "更多", "iconPath": "static/tabbar/more.png", "selectedIconPath": "static/tabbar/more-active.png" }
    ]
  }
}
```

---

## 五、功能模块设计

### 5.1 婚书请柬模块

#### 主人编辑
- **模板选择**：3套模板（传统红金/现代简约/极简高级），实时预览切换
- **文案编辑**：主标题、正文、副标题、爱情故事，提供6种预设文案
- **新人信息**：姓名、手机号、头像上传
- **婚礼信息**：日期选择器、时间选择器、场地搜索（腾讯地图POI）
- **背景音乐**：5首预设音乐 + 本地上传（限制5MB，mp3/m4a）
- **高级设置**：字体大小、间距微调、功能开关（倒计时/RSVP/祝福/流程）
- **实时预览**：编辑时右侧/下方实时预览宾客视角效果

#### 宾客展示
- **开场动画**：2-3秒入场动画，封面图淡入 + 文字依次出现
- **婚书展示**：根据模板渲染精美请柬，支持竖排文字（传统模板）
- **背景音乐**：自动播放（需用户授权），右上角悬浮控制按钮
- **倒计时**：实时计算距离婚礼的天/时/分/秒

### 5.2 婚纱相册模块

#### 主人编辑
- **批量上传**：支持多选照片，自动压缩（canvas处理，最大1920px，质量0.8）
- **拖拽排序**：拖拽调整照片顺序
- **设置封面**：指定某张照片为婚书封面/分享卡片封面
- **添加说明**：为每张照片添加文字说明
- **展示设置**：瀑布流/网格/轮播三种模式

#### 宾客展示
- **瀑布流**：照片瀑布流展示，懒加载
- **点击预览**：点击图片进入全屏轮播，支持手势滑动
- **下载控制**：主人可设置是否允许宾客下载原图

### 5.3 婚礼路书模块

#### 主人编辑
- **添加场地**：名称、类型（家/酒店/场地/住宿/摄影点）、地址、地图选点
- **时间关联**：设置到达时间、离开时间
- **路线规划**：多点串联，自动计算行车距离和时间
- **推荐酒店**：标记附近推荐住宿（宾客住宿推荐）
- **联系电话**：添加场地联系电话

#### 宾客展示
- **地图展示**：腾讯地图组件，标记所有场地， polyline 绘制路线
- **场地列表**：按时间排序的场地卡片列表
- **一键导航**：唤起腾讯地图导航插件 / 微信内置地图
- **地址复制**：长按复制地址
- **电话拨打**：点击直接拨打电话

### 5.4 流程时间线模块

#### 主人编辑
- **时间轴编辑**：可视化时间轴，拖拽排序
- **添加节点**：时间、事件名称、关联场地、负责人/角色、备注
- **角色管理**：添加角色（新郎/新娘/伴郎/伴娘/司仪/摄影等），分配成员
- **重要标记**：标记重要节点（如仪式开始）
- **提醒设置**：是否启用婚礼当天提醒

#### 宾客展示
- **时间轴展示**：垂直时间轴，婚礼当天流程一览
- **当前高亮**：婚礼当天自动根据当前时间高亮进行中/已完成/即将开始的节点
- **角色筛选**：切换角色查看专属任务（如伴郎视角）
- **倒计时**：距离下一个节点的倒计时
- **我的日程**：筛选出与当前宾客相关的节点（基于RSVP信息）

### 5.5 RSVP/宾客管理模块

#### 主人编辑
- **宾客CRUD**：手动添加、批量导入（Excel/文本）、编辑、删除
- **RSVP统计**：出席/待定/缺席/未填写统计卡片
- **筛选搜索**：按状态/类型/姓名/手机号筛选搜索
- **饮食统计**：普通/素食/清真/其他统计
- **导出名单**：导出Excel/CSV
- **发送提醒**：向未填写宾客发送提醒（微信服务通知/短信）
- **桌号分配**：为确认出席宾客分配桌号

#### 宾客填写
- **RSVP表单**：
  - 是否出席（出席/遗憾缺席）
  - 出席人数（含本人，步进器）
  - 饮食偏好（单选：普通/素食/清真/其他）
  - 特殊要求（多行文本）
- **提交成功页**：显示婚礼地址、时间，提供一键导航和拨打电话

### 5.6 祝福墙模块

#### 主人管理
- **祝福列表**：文字祝福和语音祝福混合展示
- **审核管理**：置顶/取消置顶、删除、审核开关
- **语音播放**：点击播放语音祝福，带进度条
- **统计**：文字祝福数、语音祝福数、今日新增

#### 宾客发送
- **文字祝福**：多行文本输入，发送
- **语音祝福**：长按录音（最长30秒），播放预览，确认发送
- **祝福墙展示**：瀑布流展示所有祝福，主人置顶的优先显示
- **实时更新**：新祝福实时显示（轮询或云数据库实时推送）

### 5.7 分享模块

#### 主人分享
- **小程序码生成**：生成带参数的小程序码（wedding_id）
- **分享卡片设置**：自定义分享标题、描述、封面图
- **保存图片**：将小程序码保存到相册
- **复制链接**：复制小程序路径
- **分享到微信**：一键分享给好友/群聊/朋友圈
- **数据统计**：分享次数、浏览次数、独立访客数

#### 宾客分享
- **二次传播**：宾客也可分享婚礼给其他人
- **分享卡片**：自动使用主人设置的分享配置

---

## 六、UI/UX 设计规范

### 6.1 配色方案

支持三套配色方案，用户在创建婚礼时选择，可随时切换。

#### 方案A：传统中国风（默认）

```css
:root {
  --primary: #C41E3A;         /* 中国红 - 主按钮、标题、强调 */
  --secondary: #FFD700;       /* 金色 - 装饰线条、图标边框 */
  --background: #FFF8F0;      /* 米白色 - 页面背景 */
  --surface: #FFFFFF;         /* 纯白 - 卡片背景 */
  --text-primary: #2D2D2D;    /* 墨色 - 正文 */
  --text-secondary: #666666;  /* 灰色 - 次要说明 */
  --accent: #FFB7C5;          /* 桃粉色 - 温馨装饰 */
  --border: #F0E6D8;          /* 浅棕 - 分割线 */
}
```

#### 方案B：现代简约风

```css
:root {
  --primary: #E91E63;         /* 玫瑰粉 */
  --secondary: #9C27B0;       /* 淡紫色 */
  --background: #FFFFFF;
  --surface: #FAFAFA;
  --text-primary: #1A1A1A;
  --text-secondary: #666666;
  --accent: #F8BBD9;
  --border: #F0F0F0;
}
```

#### 方案C：轻奢金棕风

```css
:root {
  --primary: #8B6914;         /* 古铜金 */
  --secondary: #4A3C31;       /* 深棕色 */
  --background: #FAF8F5;      /* 象牙白 */
  --surface: #FFFFFF;
  --text-primary: #333333;
  --text-secondary: #888888;
  --accent: #D4AF37;
  --border: #E8E0D5;
}
```

#### 功能色（通用）

```css
:root {
  --success: #52c41a;
  --warning: #faad14;
  --error: #f5222d;
  --info: #1890ff;
  
  --attending: #52c41a;
  --uncertain: #faad14;
  --declined: #999999;
  --pending: #1890ff;
}
```

### 6.2 字体规范

```css
/* 字体优先级 */
font-family:
  -apple-system,              /* iOS系统 */
  "PingFang SC",              /* 苹果中文 */
  "Microsoft YaHei",          /* 微软雅黑 */
  "Helvetica Neue",
  sans-serif;

/* 婚书特殊字体 */
.wedding-text-classic {
  font-family: 'KaiTi', 'STKaiti', '楷体', serif;
  letter-spacing: 8rpx;
}

/* 竖排文字（传统模板） */
.vertical-text {
  writing-mode: vertical-rl;
  text-orientation: mixed;
}
```

#### 字号体系

| Token | 尺寸 | 用途 |
|-------|------|------|
| h1 | 48rpx | 页面主标题 |
| h2 | 40rpx | 模块标题 |
| h3 | 32rpx | 卡片标题 |
| h4 | 28rpx | 小标题 |
| body | 28rpx | 正文 |
| body-sm | 26rpx | 正文小 |
| caption | 24rpx | 辅助说明 |
| mini | 20rpx | 最小文字 |

### 6.3 组件规范

#### 按钮

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8rpx;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary) 0%, #E91E63 100%);
  color: #fff;
  box-shadow: 0 4rpx 12rpx rgba(196, 30, 58, 0.3);
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn-secondary {
  background: #fff;
  color: var(--primary);
  border: 2rpx solid var(--primary);
}

.btn-block { width: 100%; }
.btn-disabled { opacity: 0.4; pointer-events: none; }
```

#### 卡片

```css
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.06);
}

.card:active {
  transform: translateY(2rpx);
}
```

#### 输入框

```css
.input {
  width: 100%;
  padding: 24rpx;
  border: 2rpx solid #E8E8E8;
  border-radius: 12rpx;
  font-size: 28rpx;
  background: #FAFAFA;
}

.input:focus {
  border-color: var(--primary);
  background: #fff;
}
```

### 6.4 动画规范

```css
/* 页面切换 */
.page-enter { opacity: 0; transform: translateY(20rpx); }
.page-enter-active { transition: all 0.4s ease-out; }
.page-leave-active { transition: all 0.3s ease-in; }
.page-leave-to { opacity: 0; transform: translateY(-20rpx); }

/* 婚书开场动画 */
@keyframes introSequence {
  0% { opacity: 0; transform: scale(1.1); }
  30% { opacity: 1; transform: scale(1); }
  100% { opacity: 1; transform: scale(1); }
}

/* 文字依次出现 */
@keyframes textReveal {
  0% { opacity: 0; transform: translateY(20rpx); }
  100% { opacity: 1; transform: translateY(0); }
}

/* 心跳动画 */
@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* 点击反馈 */
.tap-feedback:active {
  transform: scale(0.96);
  opacity: 0.8;
}

/* 成功反馈 */
@keyframes successPop {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
```

### 6.5 移动端适配

```css
/* 使用 rpx 进行响应式适配（设计稿750px） */
/* 安全区域适配 */
page {
  padding-top: constant(safe-area-inset-top);
  padding-bottom: constant(safe-area-inset-bottom);
}

/* 底部按钮固定 */
.fixed-bottom-btn {
  position: fixed;
  bottom: calc(32rpx + constant(safe-area-inset-bottom));
  left: 32rpx;
  right: 32rpx;
}
```

---

## 七、关键交互设计

### 7.1 分享链路（核心）

```
主人编辑完成
    │
    ▼
┌──────────────────┐
│ 点击"生成分享"    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 生成小程序码      │
│ （带wedding_id）  │
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌─────────┐
│分享给 │ │保存小程序│
│微信好友│ │码到相册 │
└───┬───┘ └────┬────┘
    │          │
    ▼          ▼
┌──────────────────┐
│ 宾客扫码/点链接   │
│ 进入婚书首页      │
└──────────────────┘
```

### 7.2 主人首次使用流程

```
打开小程序
    │
    ▼
手机号+验证码登录
    │
    ▼
创建婚礼向导
┌─────────────────────────────────────────────────────────┐
│ Step 1: 输入婚期（日期+时间）                            │
│ Step 2: 输入场地名称和地址（地图选点）                    │
│ Step 3: 选择婚书模板（传统/现代/轻奢预览）                │
│ Step 4: 输入新人姓名和基本信息                            │
└─────────────────────────────────────────────────────────┘
    │
    ▼
进入管理后台
    │
    ├──→ 编辑婚书文案/上传照片
    ├──→ 添加路书场地
    ├──→ 编辑流程时间线
    ├──→ 导入宾客名单（可选）
    │
    ▼
点击"发布婚礼"
    │
    ▼
生成小程序码 → 分享
```

### 7.3 宾客打开流程

```
扫码/点击分享链接
    │
    ▼
开场动画（2-3秒）
    │
    ▼
婚书首页（长滚动）
    │
    ├──→ 下滑浏览：封面 → 请柬 → 照片 → 信息 → RSVP → 祝福
    │
    ├──→ 点击Tab切换：相册 / 路书 / 流程 / 更多
    │
    ├──→ 点击"我要出席" → 填写RSVP → 提交成功
    │
    └──→ 点击"发送祝福" → 写文字/录语音 → 提交成功
```

### 7.4 主人日常编辑流程

```
打开小程序
    │
    ▼
输入手机号后4位验证主人身份
    │
    ▼
进入管理后台
    │
    ├──→ 查看数据概览（浏览/分享/RSVP/祝福统计）
    │
    ├──→ 点击功能卡片进入对应编辑页
    │       ├──→ 婚书编辑：模板/文案/音乐/预览
    │       ├──→ 相册管理：上传/排序/删除
    │       ├──→ 路书编辑：场地/路线/导航
    │       ├──→ 流程编辑：时间轴/角色/提醒
    │       ├──→ 宾客管理：名单/RSVP/统计/导出
    │       ├──→ 祝福管理：审核/置顶/删除
    │       ├──→ 分享设置：小程序码/卡片配置
    │       └──→ 数据统计：趋势/明细
    │
    ▼
编辑完成 → 保存 → 自动同步到宾客端
```

---

## 八、云函数 API 设计

### 8.1 婚礼相关

```javascript
// 创建婚礼
cloud.functions.define('createWedding', async (event) => {
  const { user_id, phone, date, time, venue_name, venue_address } = event
  const wedding_id = generateShortId() // 6位短码
  
  await db.collection('weddings').add({
    data: {
      wedding_id,
      owner_id: user_id,
      owner_phone_last4: phone.slice(-4),
      basic_info: { date, time },
      status: 'draft',
      stats: { views: 0, shares: 0, rsvp_count: 0, blessing_count: 0, unique_viewers: 0 },
      share_config: { title: '', description: '', cover_image: '' },
      created_at: Date.now(),
      updated_at: Date.now()
    }
  })
  
  return { wedding_id }
})

// 获取婚礼详情（宾客端）
cloud.functions.define('getWedding', async (event) => {
  const { wedding_id } = event
  
  const wedding = await db.collection('weddings').where({ wedding_id }).get()
  if (!wedding.data.length) throw new Error('婚礼不存在')
  
  // 并行获取关联数据
  const [invitation, album, venues, timeline, blessings] = await Promise.all([
    db.collection('invitations').where({ wedding_id }).get(),
    db.collection('albums').where({ wedding_id }).get(),
    db.collection('venues').where({ wedding_id }).get(),
    db.collection('timelines').where({ wedding_id }).get(),
    db.collection('blessings').where({ wedding_id }).get()
  ])
  
  // 记录浏览（非主人）
  await recordView(wedding_id, event.userInfo?.openid)
  
  return {
    wedding: wedding.data[0],
    invitation: invitation.data[0],
    album: album.data[0],
    venues: venues.data[0],
    timeline: timeline.data[0],
    blessings: blessings.data[0]
  }
})

// 更新婚礼（主人）
cloud.functions.define('updateWedding', async (event) => {
  const { user_id, wedding_id, ...updates } = event
  await verifyOwner(wedding_id, user_id)
  
  await db.collection('weddings').where({ wedding_id }).update({
    data: { ...updates, updated_at: Date.now() }
  })
  
  return { success: true }
})
```

### 8.2 RSVP相关

```javascript
// 提交RSVP
cloud.functions.define('submitRSVP', async (event) => {
  const { wedding_id, name, phone, rsvp_status, attending_count, diet_preference, diet_notes } = event
  
  const guestsRecord = await db.collection('guests').where({ wedding_id }).get()
  const guests = guestsRecord.data[0]?.guests || []
  
  const existingIndex = guests.findIndex(g => g.phone === phone)
  
  if (existingIndex >= 0) {
    // 更新已有记录
    guests[existingIndex] = {
      ...guests[existingIndex],
      name,
      rsvp_status,
      attending_count,
      diet_preference,
      diet_notes,
      updated_at: Date.now()
    }
  } else {
    // 新增记录
    guests.push({
      id: generateId(),
      name,
      phone,
      rsvp_status,
      attending_count,
      diet_preference,
      diet_notes,
      created_at: Date.now(),
      updated_at: Date.now()
    })
  }
  
  await db.collection('guests').where({ wedding_id }).update({
    data: { guests, updated_at: Date.now() }
  })
  
  // 更新统计
  if (rsvp_status === 'attending') {
    await db.collection('weddings').where({ wedding_id }).update({
      data: { 'stats.rsvp_count': db.command.inc(1) }
    })
  }
  
  return { success: true }
})

// 获取RSVP统计
cloud.functions.define('getRSVPStats', async (event) => {
  const { wedding_id, user_id } = event
  await verifyOwner(wedding_id, user_id)
  
  const guestsRecord = await db.collection('guests').where({ wedding_id }).get()
  const guests = guestsRecord.data[0]?.guests || []
  
  return {
    total: guests.length,
    attending: guests.filter(g => g.rsvp_status === 'attending').length,
    uncertain: guests.filter(g => g.rsvp_status === 'uncertain').length,
    declined: guests.filter(g => g.rsvp_status === 'declined').length,
    pending: guests.filter(g => g.rsvp_status === 'pending').length,
    diet_breakdown: {
      normal: guests.filter(g => g.diet_preference === 'normal').length,
      vegetarian: guests.filter(g => g.diet_preference === 'vegetarian').length,
      halal: guests.filter(g => g.diet_preference === 'halal').length,
      other: guests.filter(g => g.diet_preference === 'other').length
    }
  }
})
```

### 8.3 祝福相关

```javascript
// 提交祝福
cloud.functions.define('submitBlessing', async (event) => {
  const { wedding_id, sender, type, content, voice_duration } = event
  
  const blessing = {
    id: generateId(),
    sender,
    type,
    content,
    voice_duration,
    is_pinned: false,
    is_approved: true,  // 默认直接通过，主人可开启审核
    is_deleted: false,
    created_at: Date.now()
  }
  
  await db.collection('blessings').where({ wedding_id }).update({
    data: {
      blessings: db.command.push([blessing]),
      updated_at: Date.now()
    }
  })
  
  // 更新统计
  await db.collection('weddings').where({ wedding_id }).update({
    data: { 'stats.blessing_count': db.command.inc(1) }
  })
  
  return { blessing_id: blessing.id }
})

// 置顶/取消置顶祝福（主人）
cloud.functions.define('pinBlessing', async (event) => {
  const { wedding_id, blessing_id, is_pinned, user_id } = event
  await verifyOwner(wedding_id, user_id)
  
  const record = await db.collection('blessings').where({ wedding_id }).get()
  const blessings = record.data[0]?.blessings || []
  
  const updated = blessings.map(b => ({
    ...b,
    is_pinned: b.id === blessing_id ? is_pinned : false // 只能置顶一条
  }))
  
  await db.collection('blessings').where({ wedding_id }).update({
    data: { blessings: updated, updated_at: Date.now() }
  })
  
  return { success: true }
})
```

### 8.4 统计相关

```javascript
// 记录浏览
async function recordView(wedding_id, openid) {
  if (!openid) return
  
  // 使用云数据库的统计功能
  await db.collection('weddings').where({ wedding_id }).update({
    data: { 'stats.views': db.command.inc(1) }
  })
  
  // 记录到每日统计
  const today = new Date().toISOString().split('T')[0]
  await db.collection('share_stats').where({ wedding_id }).update({
    data: {
      view_count: db.command.inc(1),
      [`daily_stats.${today}.views`]: db.command.inc(1)
    }
  })
}

// 获取完整统计
cloud.functions.define('getStats', async (event) => {
  const { wedding_id, user_id } = event
  await verifyOwner(wedding_id, user_id)
  
  const [wedding, guestRecord, shareStats] = await Promise.all([
    db.collection('weddings').where({ wedding_id }).get(),
    db.collection('guests').where({ wedding_id }).get(),
    db.collection('share_stats').where({ wedding_id }).get()
  ])
  
  const guests = guestRecord.data[0]?.guests || []
  
  return {
    views: wedding.data[0]?.stats?.views || 0,
    shares: wedding.data[0]?.stats?.shares || 0,
    rsvp_count: wedding.data[0]?.stats?.rsvp_count || 0,
    blessing_count: wedding.data[0]?.stats?.blessing_count || 0,
    rsvp_stats: {
      total: guests.length,
      attending: guests.filter(g => g.rsvp_status === 'attending').length,
      uncertain: guests.filter(g => g.rsvp_status === 'uncertain').length,
      declined: guests.filter(g => g.rsvp_status === 'declined').length,
      pending: guests.filter(g => g.rsvp_status === 'pending').length
    },
    daily_stats: shareStats.data[0]?.daily_stats || []
  }
})
```

---

## 九、地图集成方案

### 9.1 腾讯地图小程序SDK

```javascript
// manifest.json 配置
{
  "permission": {
    "scope.userLocation": {
      "desc": "你的位置信息将用于导航功能"
    }
  },
  "plugins": {
    "routePlan": {
      "version": "1.0.0",
      "provider": "wx50b5593e5dd2a7d1"
    }
  }
}

// 地图key
const QQ_MAP_KEY = 'YOUR_TENCENT_MAP_KEY'

// 获取用户位置
function getUserLocation() {
  return new Promise((resolve, reject) => {
    uni.getLocation({ type: 'gcj02', success: resolve, fail: reject })
  })
}

// 一键导航
function startNavigation(latitude, longitude, name, address) {
  uni.navigateTo({
    url: `plugin://route-plan/index?key=${QQ_MAP_KEY}&referer=婚礼导航&endLat=${latitude}&endLon=${longitude}&endName=${name}`
  })
}

// 唤起微信内置地图
function openLocation(latitude, longitude, name, address) {
  uni.openLocation({ latitude, longitude, name, address, scale: 18 })
}

// 地址搜索
async function searchAddress(keyword) {
  const res = await uni.request({
    url: `https://apis.map.qq.com/ws/place/v1/search`,
    data: { keyword, key: QQ_MAP_KEY, boundary: 'region(全国,0)' }
  })
  return res.data
}

// 距离计算
async function calculateDistance(from, to) {
  const res = await uni.request({
    url: `https://apis.map.qq.com/ws/distance/v1/`,
    data: {
      mode: 'driving',
      from: `${from.lat},${from.lng}`,
      to: `${to.lat},${to.lng}`,
      key: QQ_MAP_KEY
    }
  })
  return res.data.result.elements[0]
}
```

### 9.2 地图组件

```vue
<template>
  <view class="map-container">
    <map
      :latitude="center.latitude"
      :longitude="center.longitude"
      :scale="scale"
      :markers="markers"
      :polyline="polyline"
      :show-location="true"
      @markertap="onMarkerTap"
    />
    
    <scroll-view class="venue-list" scroll-y>
      <view 
        v-for="venue in venues" 
        :key="venue.id"
        class="venue-item"
        :class="{ active: selectedId === venue.id }"
        @click="selectVenue(venue)"
      >
        <text class="venue-name">{{ venue.name }}</text>
        <text class="venue-time">{{ venue.arrival_time }}</text>
        <button size="mini" @click.stop="navigateTo(venue)">导航</button>
      </view>
    </scroll-view>
  </view>
</template>
```

---

## 十、开发计划

### 10.1 分阶段开发

#### 第一阶段：MVP（预计2周）

**目标：完成最小可用产品，包含婚书展示和路书导航核心功能**

| 功能模块 | 优先级 | 工时 |
|---------|:------:|-----:|
| uni-app项目初始化 + 云开发配置 | P0 | 1天 |
| 主人登录/注册（手机号+验证码） | P0 | 1天 |
| 创建婚礼向导（婚期+场地+模板） | P0 | 1天 |
| 婚书模板系统（3套模板+文案编辑） | P0 | 2天 |
| 婚纱照上传+相册展示 | P1 | 1天 |
| 场地管理+地图标记 | P0 | 1天 |
| 一键导航功能 | P0 | 1天 |
| 分享功能（小程序码+分享卡片） | P0 | 1天 |
| **小计** | | **9天** |

#### 第二阶段：V1.0（预计1.5周）

**目标：完善流程时间线和互动功能**

| 功能模块 | 优先级 | 工时 |
|---------|:------:|-----:|
| 婚礼流程编辑+时间线展示 | P0 | 2天 |
| RSVP回执（宾客填写+主人统计） | P0 | 1.5天 |
| 宾客名单管理（CRUD+导入） | P1 | 1天 |
| 祝福墙（文字祝福+管理） | P1 | 1天 |
| 倒计时组件 | P0 | 0.5天 |
| 分享卡片自定义 | P1 | 0.5天 |
| **小计** | | **6.5天** |

#### 第三阶段：V1.1（预计1周）

**目标：体验优化，完善细节**

| 功能模块 | 优先级 | 工时 |
|---------|:------:|-----:|
| 背景音乐播放控制 | P1 | 1天 |
| 主人实时预览模式 | P0 | 1天 |
| 数据统计面板 | P1 | 1天 |
| 主人验证优化 | P0 | 0.5天 |
| 边缘情况处理（空状态/网络异常） | P1 | 0.5天 |
| 照片轮播特效 | P1 | 0.5天 |
| **小计** | | **3.5天** |

#### 第四阶段：V2.0（预计1周）

**目标：高级功能，差异化竞争**

| 功能模块 | 优先级 | 工时 |
|---------|:------:|-----:|
| 语音祝福（录音+播放） | P2 | 1.5天 |
| 角色分众视图（伴郎/父母专属） | P1 | 1天 |
| 婚礼提醒（微信服务通知） | P2 | 1天 |
| 宾客住宿推荐 | P2 | 0.5天 |
| 电子婚书导出（图片） | P2 | 1天 |
| **小计** | | **5天** |

### 10.2 里程碑时间表

```
Week 1-2        Week 3        Week 4        Week 5
┌───────┐     ┌───────┐     ┌───────┐     ┌───────┐
│  MVP  │────▶│  V1.0 │────▶│  V1.1 │────▶│  V2.0 │
│       │     │       │     │       │     │       │
│ 基础  │     │ 流程  │     │ 优化  │     │ 高级  │
│ 婚书  │     │ 互动  │     │ 体验  │     │ 功能  │
│ 路书  │     │       │     │       │     │       │
└───────┘     └───────┘     └───────┘     └───────┘
    │             │             │             │
    ▼             ▼             ▼             ▼
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│内部测试 │   │内部测试 │   │内部测试 │   │正式发布 │
└─────────┘   └─────────┘   └─────────┘   └─────────┘
```

**目标：2026年11月14日婚礼前完成所有功能，预留充足测试时间。**

---

## 十一、与网页版整合策略

### 11.1 资源共享

```
┌─────────────────────────────────────────────────────────────┐
│                    微信小程序 & 网页版整合                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  【共享资源】                                                │
│  ───────────────────────────────────────                   │
│  ├── 设计规范（配色、字体、组件样式）                         │
│  ├── 婚书模板（HTML/CSS可复用为小程序WXML/WXSS）             │
│  ├── 数据结构（TypeScript interfaces）                       │
│  └── 工具函数（日期处理、图片压缩、地图计算）                 │
│                                                             │
│  【差异化策略】                                              │
│  ───────────────────────────────────────                   │
│  │ 功能        │  小程序版      │  网页版                    │
│  ├─────────────┼────────────────┼─────────────────────────┤ │
│  │ 用户触达    │  微信生态、高留存│  外部传播、SEO            │ │
│  │ 地图导航    │  原生导航体验   │  需唤起第三方App         │ │
│  │ 分享传播    │  微信分享闭环   │  链接/二维码              │ │
│  │ 模板导出    │  受限          │  PNG/PDF完整导出         │ │
│  │ 用户数据    │  微信登录      │  需注册                  │ │
│  │ 消息推送    │  服务通知      │  不支持                  │ │
│  │ 语音祝福    │  原生录音      │  不支持                  │ │
│                                                             │
│  【推荐策略】                                                │
│  ───────────────────────────────────────                   │
│  微信小程序：主要分发渠道，承载分享传播和互动功能              │
│  网页版：作为补充，支持更多导出格式和外部传播                 │
│  数据互通：同一套云开发后端，用户可选择任一入口               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 11.2 数据互通

- 同一套微信云开发数据库
- 网页版通过云开发Web SDK访问数据
- 主人可在网页端编辑，宾客在小程序查看（反之亦然）

---

## 十二、附录

### 12.1 微信小程序限制须知

| 限制项 | 规格 |
|--------|------|
| 主包大小 | 不超过 2MB |
| 分包大小 | 不超过 4MB |
| 请求体大小 | 最大 10MB |
| 单个文件上传 | 最大 10MB |
| 下载文件 | 最大 50MB |
| 本地存储 | 最大 10MB |
| Canvas尺寸 | 最大 4096x4096 |
| 录音时长 | 最大 1000秒（实际限制30秒） |

### 12.2 关键UX设计点

**主人侧：**
1. 首次使用门槛低：扫码即用，手机号+验证码注册
2. 编辑效率高：所见即所得预览，模板化编辑减少输入
3. 分享便捷：一键生成小程序码，分享卡片自动生成

**宾客侧：**
1. 打开即用：无需注册登录，扫码/点链接即可查看
2. 精美展示：开场动画惊喜感，流畅页面切换
3. 功能易用：一键导航无需复制地址，RSVP操作简单

**通用：**
1. 加载速度快：分包加载减少首次等待，图片懒加载
2. 离线可访问：静态内容缓存，优雅的网络异常处理
3. 无障碍考虑：文字对比度足够，点击目标足够大

---

*方案版本：v2.0（综合版）*  
*制定日期：2025年*  
*涵盖：技术架构 / 数据库设计 / 页面结构 / 功能模块 / UI规范 / 开发计划*
