# 甜囍手册 v2.0 真机验收记录

本记录用于证明 v2.0 是否真正“立住”。自动门禁只能证明代码合同，不能替代真机观感、旧数据打开、相册权限和外部用户第一印象。

## 使用方式

1. 先运行自动门禁：

```bash
npm run check:release
npm run build:mp-weixin
```

2. 生成本次真机验收草稿：

```bash
npm run create:v2-acceptance-record
```

3. 生成微信预览码：

```bash
npm run preview:mp-weixin
```

这个命令会先构建微信小程序产物，再把预览码生成到 `.release/preview-<version>.png`，用于真机扫码验收。

4. 用 `.release/v2-real-device-acceptance-<version>.md` 记录真机证据。

真机截图、录屏和朋友反馈截图统一放到 `.release/v2-evidence-<version>/`，表格里的“证据路径/截图编号”必须填写本地文件路径。最终检查器会验证这些文件真实存在，不能只写“已看过”。

5. 如果已经从手机导出了截图/录屏，可用脚本导入并自动改表：

```bash
npm run record:v2-manual-evidence -- \
  --device="iPhone 15 / iOS 18 / WeChat 8.0.xx" \
  --theme-switch=/path/to/theme-switch.mp4 \
  --guest-scroll=/path/to/guest-scroll.mp4 \
  --hero-photo=/path/to/hero-photo.png \
  --mounted-photos=/path/to/mounted-photos.png \
  --wizard-flow=/path/to/wizard-flow.mp4 \
  --wizard-photo-preview=/path/to/wizard-photo-preview.png \
  --premium-entitlement=/path/to/premium-entitlement.png \
  --friend-quote="这是请柬" \
  --friend-evidence=/path/to/friend-feedback.png \
  --no-errors
```

如果后续拿到真实旧库 `sakura-pink` weddingId，再追加：

```bash
npm run record:v2-manual-evidence -- \
  --old-wedding-id=<真实weddingId> \
  --legacy-sakura=/path/to/legacy-sakura.png
```

6. 记录自动门禁证据：

```bash
npm run record:v2-automatic-evidence
```

这个命令会运行微信小程序构建、release 检查和 v2 自动验收，并把通过结果写入 `.release/v2-real-device-acceptance-<version>.md`。

7. 填完真机证据后运行最终判定：

```bash
npm run check:v2-real-device-record
```

只有自动门禁、全部真机行和最终结论都勾选通过时，这个命令才会成功。

8. 如果要找真实旧数据，先登录 CloudBase，再运行只读查询：

```bash
npm exec --yes --package @cloudbase/cli -- tcb login
npm run find:legacy-sakura
```

查询结果会写入 `.release/legacy-sakura-query.json`，从中选择一个真实 weddingId 做旧库验收。
如果查询结果为空，不代表旧数据项通过；需要继续从控制台或历史数据中提供真实 `sakura-pink` weddingId，或确认生产库确无该类存量数据后单独记录例外说明。

## 必填证据

| 项目 | 判定标准 | 证据 |
| --- | --- | --- |
| 四色情绪色 | wine/cinnabar/indigo/pine 随机切换，宾客端任一屏不出现第五种彩色 | 四组真机截图或录屏 |
| 宾客端长卷 | 从扉页滑到卷尾，整体第一印象是请柬/信件，而不是后台/小程序工具 | 真机录屏 |
| 扉页照片 | 满幅照片顶天立地，底部纸色渐变收边，文字不压脸 | 真机截图 |
| 内页照片 | 相册和首页预览照片都有白边、发丝线、展签文字 | 真机截图 |
| 旧数据 | 真实旧库中 theme=sakura-pink 的婚礼打开为酒红，无报错 | 婚礼 ID、截图、控制台无错记录 |
| 四幕向导 | 具名 -> 择地 -> 选照 -> 定色可连续走完 | 真机录屏 |
| 选照预览 | 第三幕选照后立即看到装裱预览，最多九张 | 真机录屏或截图 |
| 高级色权益 | 主人端切换 cinnabar/indigo/pine 时显示高级/体验/权益状态，并写入 commercial 状态 | 真机截图和保存后数据 |
| 朋友第一反应 | 给不知情的人看任意宾客端截图，对方第一反应是“请柬/邀请函/婚礼信件” | 反馈原话 |

## 完成标准

全部必填证据填写为通过，本地证据文件存在，朋友反馈原话已填写，且没有未解释的运行时报错时，才可以把 v2.0 目标标记为完成。
