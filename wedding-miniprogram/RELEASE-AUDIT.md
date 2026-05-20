# 甜囍手册上线前全功能审查报告

审查日期：2026-05-19  
小程序 AppID：`wx2477cb578d01e89f`  
云环境：`cloud1-d5gqyur7g5a4d3c8d`

## 总结

本轮按“代码 + 云函数 + 主链路 + 上线配置”的口径完成静态审查，并修复了仓库内可以直接解决的上线风险。当前代码侧最主要的阻断项已经清理：15 个云函数全部写入 `cloudbaserc.json`，内容安全接口权限补齐，上传脚本移除本机私钥路径，上传版本改为优先读取 `manifest.versionName`，RSVP/祝福提交增加服务端必填和长度校验。

真云部署状态仍需要在微信开发者工具或云开发控制台做最后确认。本机未发现 `tcb` / `cloudbase` CLI，也没有可用的 CloudBase 管理 MCP；微信开发者工具 CLI 可启动且 `islogin` 返回登录态，但执行 `cloud env list` / `cloud functions list` 时云端接口返回 `code 10，需要重新登录`。因此本轮无法从终端直接读取云端已部署函数、环境变量、数据库索引和小程序码权限。下面的“真云必验清单”是上线前必须逐项点亮的人工检查。

## 本轮已修复

| 项目 | 修复内容 | 上线影响 |
|------|----------|----------|
| 云函数部署清单 | `cloudbaserc.json` 从 5 个函数补齐为 15 个函数，并统一 runtime、handler、timeout、description | 避免只部署地图/天气/海报等部分函数，导致创建、更新、RSVP、祝福、统计等链路线上缺函数 |
| 内容安全权限 | `submitRSVP`、`submitBlessing` 的 `config.json` 增加 `security.msgSecCheck` | 避免留言/祝福内容安全接口因权限缺失降级或失败 |
| 宾客回执识别 | `getWedding` 对非主人只返回当前宾客回执，并增加 `is_current_user` 标记；RSVP 页据此识别已提交状态 | 避免宾客重复打开后无法识别自己的回执 |
| 服务端表单校验 | `submitRSVP` 校验姓名、手机号长度、关系、随行备注、留言；`submitBlessing` 校验祝福内容和称呼 | 避免绕过前端提交空姓名、空祝福或超长文本 |
| 主人身份保护 | `createWedding` 在没有微信 `OPENID` 时拒绝创建 | 避免产生无主人归属的婚礼数据 |
| 上传脚本 | `upload.mjs` 上传版本优先读取 `manifest.versionName`；`upload-ci.mjs` 改为环境变量读取 AppID、构建目录、私钥、版本和描述 | 避免上传旧版本号或把本机私钥路径写进仓库 |
| 构建产物 | `postbuild:mp-weixin` 自动同步 `cloudfunctions/` 和 `cloudbaserc.json` 到 `dist/build/mp-weixin` | 避免开发者工具打开构建目录时看不到云函数 |
| 发布检查 | `npm run check:release` 新增云函数全量部署、OpenAPI 权限、CI 上传脚本安全和当前宾客回执断言 | 后续迭代更难漏掉上线关键配置 |

## 云函数审查矩阵

| 云函数 | 代码状态 | 权限/安全 | 真云状态 |
|--------|----------|-----------|----------|
| `createWedding` | 校验微信身份，创建婚礼及 8 个关联文档，失败清理半成品 | 只写当前 `OPENID` 为主人 | 需确认已部署 |
| `getWedding` | 并行读取婚礼、请柬、相册、路书、流程、统计，兼容旧数据结构 | 非主人隐藏 `owner_openid`，只返回当前宾客 RSVP，按设置隐藏祝福 | 需确认已部署 |
| `updateWedding` | 只允许白名单集合，兼容缺失关联文档 | 所有写操作先校验 `owner_openid` | 需确认已部署 |
| `deleteWedding` | 删除婚礼、请柬、相册、路书、流程、宾客、祝福、统计、访客和相册云存储文件 | 需要 `confirmText=DELETE`，且校验主人 | 需真机验证旧链接失效 |
| `checkOwnership` | 返回当前用户是否为主人 | 基于 `OPENID` 和 `owner_openid` | 需确认已部署 |
| `syncOwnerProfile` | 同步主人资料、权益、套餐和婚礼工作区 | 基于微信 `OPENID` | 需确认已部署 |
| `submitRSVP` | 支持新旧字段、电话可选/必填、重复修改开关、服务端校验 | `show_rsvp` 关闭时拒绝；已补 `security.msgSecCheck` | 需真机提交测试 |
| `submitBlessing` | 支持祝福提交、匿名开关、缺文档自动创建、服务端校验 | `show_blessing` 关闭时拒绝；已补 `security.msgSecCheck` | 需真机提交测试 |
| `pinBlessing` | 主人置顶/取消置顶祝福 | 写操作校验主人 | 需确认已部署 |
| `recordView` | 初始化统计文档，记录浏览、分享、独立访客 | 只写统计，不暴露隐私 | 需真机分享进入测试 |
| `getStats` | 主人端统计浏览、分享、RSVP、祝福 | 只允许主人查看 | 需确认已部署 |
| `getRSVPStats` | 主人端 RSVP 统计 | 只允许主人查看 | 需确认已部署 |
| `generatePoster` | 调用 `wxacode.getUnlimited` 返回 base64 小程序码 | 已配置 `wxacode.getUnlimited`；scene 限 32 字符 | 需确认小程序已有可生成码版本 |
| `geocodeVenue` | 腾讯地图地理编码，缺 Key 返回明确错误 | 依赖 `TENCENT_MAP_KEY` / `QQMAP_KEY` / `MAP_KEY` | 需确认环境变量 |
| `getWeather` | 坐标缺失时尝试地理编码，天气缺 Key 时返回模拟天气和原因 | 依赖地图 Key + `HEFENG_KEY` / `QWEATHER_KEY` / `WEATHER_KEY` | 需确认环境变量 |

## 页面与主链路审查

| 模块 | 审查结论 |
|------|----------|
| 宾客首页 | 已接功能开关、scene 参数、小程序分享统计、模板主图兜底、行动台优先级 |
| 相册 | 主人端已改用 `wx.chooseImage` / `uni.chooseImage`，上传失败会回滚并清理已上传文件 |
| 路书 | 地图只渲染真实坐标点，天气失败显示明确原因，主人端支持自动匹配、地图选点和手动坐标 |
| 流程 | 功能关闭时有明确空状态；角色筛选已接入 |
| RSVP | 电话默认可选，主人可开启必填；云函数已补服务端校验和当前宾客识别 |
| 祝福墙 | 功能关闭、公开/私密、匿名开关均已接入；云函数已补内容校验 |
| 更多页 | RSVP、祝福、流程入口跟随功能开关；管理后台仅主人可见 |
| 分享/海报 | 分享设置保存到云端，小程序码失败会提示配置原因，Canvas 支持 `cloud://` 和 base64 图片 |
| 主人管理端 | 发布诊断、账号权益、统计、删除婚礼、模板预览、路书/流程/宾客/祝福管理均已纳入检查脚本 |

## 真云必验清单

上线前请在微信开发者工具或云开发控制台完成以下检查：

1. 运行 `npm run build:mp-weixin` 后，确认 `dist/build/mp-weixin/cloudfunctions` 中存在 15 个云函数目录。
2. 在云开发环境 `cloud1-d5gqyur7g5a4d3c8d` 中确认 15 个云函数全部已部署，并选择“云端安装依赖”。
3. 确认 `submitRSVP`、`submitBlessing` 云函数权限包含 `security.msgSecCheck`，`generatePoster` 包含 `wxacode.getUnlimited`。
4. 为 `geocodeVenue` 和 `getWeather` 配置 `TENCENT_MAP_KEY`；为真实天气配置 `HEFENG_KEY`，也可用 `QWEATHER_KEY` / `WEATHER_KEY`。
5. 按需为 `submitRSVP`、`submitBlessing` 配置 `CONTENT_SAFETY_MODE=strict`；不配置时为“接口不可用则降级放行”。
6. 确认数据库集合存在：`owners`、`weddings`、`invitations`、`albums`、`venues`、`timelines`、`guests`、`blessings`、`share_stats`、`viewers`。
7. 确认索引存在：`viewers.wedding_id + viewers.openid`、`guests.guests.phone`、`blessings.blessings.id`。
8. 用微信开发者工具打开 `dist/build/mp-weixin`，完整跑通：创建婚礼 -> 选模板 -> 编辑婚书 -> 上传照片 -> 配路书坐标 -> 提交 RSVP -> 写祝福 -> 生成小程序码/海报 -> 分享进入 -> 删除婚礼后旧链接失效。
9. 在真机上检查 375px、390px、430px 常见宽度：无文字重叠、无按钮截断、无底部按钮遮挡、模板预览图片主体不被顶部裁掉。

## 自动验收命令

每次上线前至少运行：

```bash
npm run check:release
npm run build:mp-weixin
git diff --check
```

如果使用微信开发者工具 CLI 上传，推荐：

```bash
npm run build:mp-weixin
npm run upload:mp-weixin
```

如果使用 `miniprogram-ci` 上传，必须通过环境变量传入私钥路径：

```bash
MINIPROGRAM_PRIVATE_KEY_PATH=/path/to/private.key node upload-ci.mjs
```

## 本轮自动复验记录

本轮已在本机完成以下检查：

- `npm run check:release` 通过
- `npm run build:mp-weixin` 通过
- `git diff --check` 通过
- `node --check` 已覆盖 `scripts/copy-cloudfunctions-to-dist.js`、`upload.mjs`、`upload-ci.mjs`、`scripts/check-release-readiness.js`
- `dist/build/mp-weixin/cloudfunctions` 已确认包含 15 个云函数目录
