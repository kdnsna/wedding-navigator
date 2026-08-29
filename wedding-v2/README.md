# 甜囍手册 · wedding-v2

大众版婚礼请柬小程序（原生，零构建）。任何新人打开小程序都能创建自己的婚礼请柬：填信息、传照片、分享给亲友、收回执和祝福。

## 产品形态

- **新人（主人）**：首页创建婚礼 → 编辑信息/传照片 → 分享卡片给亲友 → 主人台看回执统计与祝福
- **宾客**：点分享卡片进入对应婚礼的请柬，看流程/路书/相册，写祝福、提交回执
- 多婚礼隔离：分享链接带 `?w=weddingId`，数据按 weddingId 隔离

## 页面

| 页面 | 角色 | 说明 |
| --- | --- | --- |
| `pages/home` | 主人 | 产品首页：创建入口 + 我的婚礼列表（启动页） |
| `pages/edit` | 主人 | 一页式婚礼编辑器（创建=空表单，编辑=载入当前婚礼） |
| `pages/photos` | 主人 | 照片管理：chooseMedia → 压缩 → 云存储上传，图注/删除 |
| `pages/owner` | 主人 | 主人台：回执统计（总/席位/待定/缺席）+ 明细 + 祝福汇总 + 管理入口 |
| `pages/invite` | 宾客（tab） | 请柬：新人、日期、倒计时、入口、分享；主人额外可见「管理」入口 |
| `pages/timeline` | 宾客（tab） | 流程时间线，婚礼当天自动高亮进行中节点 |
| `pages/guide` | 宾客（tab） | 路书：一键导航（openLocation）、电话、交通/停车/提示 |
| `pages/blessing` | 宾客（tab） | 祝福墙：写祝福 + 列表 |
| `pages/rsvp` | 宾客 | 出席回执：姓名/出席状态/人数/留言 |
| `album/index` | 宾客（分包） | 婚纱影像：画册式照片流（云存储 fileID 直读） |

## 技术架构

- **原生小程序**，无构建工具，微信开发者工具直接导入
- **微信云开发**：数据库客户端直连（权限规则即身份）+ 1 个云函数
- 数据层集中在 `services/store.js`；身份 = openid，主人判断 = `weddings._openid`

### 数据模型

| 集合 | 权限规则 | 说明 |
| --- | --- | --- |
| `weddings` | 所有用户可读，仅创建者可写 | 一场婚礼一个文档（couple/date/venue/timeline/guide/photos/rsvp） |
| `blessings` | 所有用户可读，仅创建者可写 | 按 weddingId 隔离 |
| `rsvps` | 所有用户可读，仅创建者可写 | 按 weddingId 隔离 |

### 照片链路（为什么有一个云函数）

免费版云存储 ACL 固定为「仅创建者可读写」且不可修改（升级付费版才能改），宾客端无法直接读 fileID。因此：

- 上传：主人端 `wx.cloud.uploadFile` 直传云存储（主人自己可写 ✓）
- 读取：`cloudfunctions/getPhotos` 以管理员身份换取临时 https 链接（2 小时有效）返回给相册页
- 部署命令：`cli cloud functions deploy -e <envId> -n getPhotos`（或开发者工具里右键函数目录「上传并部署」）

### 关键路径

- 分享：`onShareAppMessage` path 拼 `?w=weddingId`；`app.js onLaunch` 解析进 globalData
- 数据加载：各页 `onShow` → `app.loadWedding()`（带缓存）→ 渲染；加载失败/无婚礼 → 空态卡
- `wx.chooseLocation` 选场地坐标（app.json 已声明 `requiredPrivateInfos`）

## 设计

「流光玻璃」：暖调极光渐变底 + `backdrop-filter` 磨砂玻璃层 + 绛红 `#8E2F28` + 衬线标题。token 集中在 `app.wxss` 顶部 CSS 变量。自定义浮动玻璃 tabBar（`custom-tab-bar/`），全部页面沉浸式自定义导航。

## 脚本（双击即用）

- `脚本/预览.command` — 编译并弹出真机预览二维码
- `脚本/上传.command` — 上传新版本到微信平台

## 文档

- 《新人使用指南.md》— 给用小程序做请柬的新人
- 《部署指南.md》— 给把这套系统跑起来的人
