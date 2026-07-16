const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function argValue(name, fallback = '') {
  const prefix = `--${name}=`
  const match = process.argv.find(item => item.startsWith(prefix))
  return match ? match.slice(prefix.length) : fallback
}

function existingPreviewPath(version) {
  const previewPath = path.join(root, '.release', `preview-${version}.png`)
  return fs.existsSync(previewPath) ? previewPath : ''
}

function renderRecord({ version, weddingId, reviewer, device, previewPath }) {
  const today = new Date().toISOString().slice(0, 10)
  const previewLine = previewPath ? `预览码: ${previewPath}` : '预览码: 未找到，请先生成微信预览码'
  const evidenceDir = `.release/v2-evidence-${version}`
  return `# 甜囍手册 v2.0 真机验收记录

版本: ${version}
日期: ${today}
验收人: ${reviewer || '待填写'}
真机设备: ${device || '待填写'}
旧数据婚礼 ID: ${weddingId || '待填写'}
${previewLine}
证据目录: ${evidenceDir}

## 自动门禁

- [ ] npm run check:release 通过
- [ ] npm run build:mp-weixin 通过
- [ ] npm run check:v2-acceptance 通过

## 真机验收

| 项目 | 结果 | 证据路径/截图编号 | 备注 |
| --- | --- | --- | --- |
| 四色情绪色随机切换，无第五种彩色 | 待测 | ${evidenceDir}/theme-switch.mp4 | wine/cinnabar/indigo/pine |
| 宾客端从扉页滑到卷尾，整体像请柬 | 待测 | ${evidenceDir}/guest-scroll.mp4 | 记录完整录屏 |
| 扉页照片满幅且底部纸色渐变收边 | 待测 | ${evidenceDir}/hero-photo.png | 文字不得压脸 |
| 内页照片白边、发丝线、展签完整 | 待测 | ${evidenceDir}/mounted-photos.png | 首页预览和相册页都看 |
| 旧 theme=sakura-pink 数据打开为酒红且无报错 | 待测 | ${evidenceDir}/legacy-sakura.png; .release/legacy-sakura-query.json | 填写真实 weddingId |
| 四幕向导一气呵成 | 待测 | ${evidenceDir}/wizard-flow.mp4 | 具名 -> 择地 -> 选照 -> 定色 |
| 第三幕选照立即看到装裱预览 | 待测 | ${evidenceDir}/wizard-photo-preview.png | 最多九张 |
| 主人端高级色权益状态生效 | 待测 | ${evidenceDir}/premium-entitlement.png | cinnabar/indigo/pine |
| 五种视觉叙事使用同一组真实照片均正确成书 | 待测 | ${evidenceDir}/visual-stories.mp4 | 电影/东方/花园/高定/夜宴 |
| 照片导演显示清晰度、构图建议和扉页焦点 | 待测 | ${evidenceDir}/photo-director.mp4 | 不修改原图 |
| 好友分享卡和朋友圈海报为专属构图 | 待测 | ${evidenceDir}/share-card.png; ${evidenceDir}/share-poster.png | 不得截取更多页 |
| 主人工作区失效后自动切换到仍可用婚书 | 待测 | ${evidenceDir}/owner-workspace-recovery.mp4 | 不得继续显示或操作已删除婚书 |
| 赴约页可滑到全部字段且底部操作不遮挡 | 待测 | ${evidenceDir}/rsvp-scroll.mp4 | 含大字体和安全区 |
| 长姓名、长场地和横竖照片无重叠截断 | 待测 | ${evidenceDir}/long-content.mp4 | iOS/Android 各检查一次 |
| 不知情朋友第一反应是请柬/邀请函 | 待测 |  | 记录原话 |

## 朋友反馈原话

> 待填写

## 运行时报错

- 待填写；如无，写“无”。

## 结论

- [ ] 全部通过，可以标记 v2.0 目标完成
- [ ] 有问题，继续修复
`
}

function main() {
  const manifest = readJson('manifest.json')
  const version = manifest.versionName || 'unknown'
  const releaseDir = path.join(root, '.release')
  const evidenceDir = path.join(releaseDir, `v2-evidence-${version}`)
  ensureDir(releaseDir)
  ensureDir(evidenceDir)

  const recordPath = path.join(releaseDir, `v2-real-device-acceptance-${version}.md`)
  const content = renderRecord({
    version,
    weddingId: argValue('wedding-id'),
    reviewer: argValue('reviewer'),
    device: argValue('device'),
    previewPath: existingPreviewPath(version)
  })
  fs.writeFileSync(recordPath, content)
  console.log(`v2 real-device acceptance record created: ${recordPath}`)
}

main()
