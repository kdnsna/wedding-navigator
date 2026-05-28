# 2026-05-28 真机与云函数复验记录

## 结论

- 已通过本机可自动化验证的发布前检查、微信包构建、云函数部署状态、CloudBase 小程序上下文端到端烟测。
- 已生成微信开发者工具预览二维码和上传包证据，可用于手机微信扫码继续真机 UI 流程。
- 本机当前未检测到可控 iOS/Android 真机通道，因此无法代替真实手机完成扫码、系统分享面板、保存相册权限和不同机型触控体验验收。

## 环境

- 验证时间：2026-05-28 12:11 CST
- CloudBase 环境：`cloud1-d5gqyur7g5a4d3c8d`
- 小程序 AppID：`wx2477cb578d01e89f`
- 小程序版本：`2.0.14`
- 构建目录：`dist/build/mp-weixin`

## 自动化验证

| 项目 | 命令/证据 | 结果 |
| --- | --- | --- |
| 发布前检查 | `npm run check:release` | 通过，输出 `release readiness checks passed` |
| CloudBase E2E | `npm run smoke:cloud-e2e` | 通过，证据见 `.release/smoke-cloud-e2e.json` |
| 微信包构建 | `npm run build:mp-weixin` | 通过，云函数复制并规范化 `project.config.json` |
| 空白/尾随检查 | `git diff --check` | 通过 |
| 云函数数量 | `find dist/build/mp-weixin/cloudfunctions -mindepth 1 -maxdepth 1 -type d | wc -l` | 15 |
| 预览二维码 | `.release/preview-2.0.14-stability-final.png` | 已生成，约 48 KB，预览包体总量 2,089,901 bytes |
| 上传包 | `.release/upload-2.0.14-stability-final.json` | 已上传，上传包体总量 2,146,047 bytes |

## CloudBase E2E 覆盖

`npm run smoke:cloud-e2e` 通过微信开发者工具自动化 WebSocket，在真实小程序云开发上下文中执行：

- `createWedding`：创建临时婚礼成功。
- `recordView.timeline`：朋友圈渠道聚合分享计数成功。
- `recordView.poster`：海报保存渠道聚合计数成功。
- `generatePoster.develop`：生成带小程序码的海报成功，base64 数据长度 146,046。
- `getStats`：读取统计成功，`shares=1`、`poster_saves=1`、`share_channels.timeline=1`、`share_channels.poster=1`、`unique_viewers=0`。
- `deleteWedding`：清理临时婚礼成功。

这轮验证重点覆盖了本次朋友圈请柬迭代中最容易出线上问题的云函数链路：分享聚合统计、海报保存统计、小程序码生成、主人统计读取和测试数据清理。

## 已确认的云函数部署状态

`tcb fn list --env-id cloud1-d5gqyur7g5a4d3c8d --limit 100 --json` 返回 15 个云函数，状态均为 `Deployment completed`。本轮改动相关函数部署时间如下：

| 云函数 | Runtime | 最近部署时间 | 状态 |
| --- | --- | --- | --- |
| `createWedding` | Nodejs16.13 | 2026-05-28 12:07:50 | Deployment completed |
| `recordView` | Nodejs16.13 | 2026-05-28 12:08:11 | Deployment completed |
| `generatePoster` | Nodejs16.13 | 2026-05-28 12:08:33 | Deployment completed |
| `getStats` | Nodejs16.13 | 2026-05-28 12:08:56 | Deployment completed |

## 数据清理核验

本轮 CloudBase E2E 临时婚礼 ID 为 `9e779e646a17c0020101585e24dadbae`。`deleteWedding` 后使用 `tcb db nosql execute` 查询 `weddings`、`invitations`、`albums`、`venues`、`timelines`、`guests`、`blessings`、`share_stats` 均为空结果，`viewers` 计数为 0。

## 真机手动验收清单

需要使用真实手机微信扫描 `.release/preview-2.0.14-stability-final.png` 后继续确认：

- 首页首屏：新人姓名、婚期、场地、封面和 CTA 在 375/390/430px 常见宽度下不遮挡。
- 分享入口：右上角分享、朋友圈路径、保存海报入口可用。
- 发布中心：朋友圈文案、微信群文案、长辈正式文案保存后再次进入仍存在。
- 海报：生成、预览、保存到相册权限链路正常。
- 宾客 RSVP：姓名、出席状态、人数可快速提交，展开项不阻塞首次回执。
- 祝福：长祝福输入与提交后展示不溢出。
- 路书：场地导航入口、地址长文本和地图打开链路正常。
- 隐私：不展示可识别访客列表，不出现访问次数、转发对象等足迹信息。
- 相册：上传入口仍只触发相册照片/视频权限边界。

## 当前阻塞

本机复查未发现可控真机入口：

- `idevice_id`、`ideviceinfo`、`ios-deploy` 未找到。
- `adb` 未找到。
- `xcrun xctrace list devices` 与 `system_profiler SPUSBDataType` 未返回可控手机设备。

因此，目前只能证明云函数和开发者工具预览链路可用，不能宣称已经完成真实手机上的完整交互验收。
