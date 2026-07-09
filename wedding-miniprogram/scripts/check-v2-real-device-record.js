const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))
}

function recordPathForVersion() {
  const version = readJson('manifest.json').versionName || 'unknown'
  return path.join(root, '.release', `v2-real-device-acceptance-${version}.md`)
}

function isPass(value) {
  return /^(通过|pass|passed|yes|done|完成)$/i.test(String(value || '').trim())
}

function isPlaceholder(value) {
  return !String(value || '').trim() || /待填写|待真机|待测|待真实|未找到/.test(String(value || ''))
}

function section(markdown, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = markdown.match(new RegExp(`\\n## ${escaped}\\n([\\s\\S]*?)(?=\\n## |$)`))
  return match ? match[1].trim() : ''
}

function metaValue(markdown, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = markdown.match(new RegExp(`^${escaped}:\\s*(.+)$`, 'm'))
  return match ? match[1].trim() : ''
}

function parseRows(markdown) {
  return section(markdown, '真机验收')
    .split('\n')
    .filter(line => line.startsWith('|') && !line.includes('---'))
    .slice(1)
    .map(line => line.split('|').slice(1, -1).map(cell => cell.trim()))
    .filter(cells => cells.length >= 4)
}

function evidencePaths(evidence) {
  return String(evidence || '')
    .replace(/<br\s*\/?>/gi, ';')
    .split(/[;,，、]/)
    .map(item => item.trim())
    .filter(Boolean)
}

function resolveEvidencePath(item) {
  if (path.isAbsolute(item)) return item
  return path.join(root, item)
}

function friendQuoteIsFilled(markdown) {
  const body = section(markdown, '朋友反馈原话')
  return Boolean(body && !/待填写/.test(body))
}

function runtimeErrorsFilled(markdown) {
  const body = section(markdown, '运行时报错')
  return Boolean(body && !/待填写/.test(body))
}

function main() {
  const recordPath = recordPathForVersion()
  if (!fs.existsSync(recordPath)) {
    console.error(`Missing real-device acceptance record: ${recordPath}`)
    console.error('Run `npm run create:v2-acceptance-record` first.')
    process.exit(1)
  }

  const markdown = fs.readFileSync(recordPath, 'utf8')
  const rows = parseRows(markdown)
  const failingRows = rows.filter(cells => !isPass(cells[1]))
  const passingRows = rows.filter(cells => isPass(cells[1]))
  const automaticChecks = [
    '- [x] npm run check:release 通过',
    '- [x] npm run build:mp-weixin 通过',
    '- [x] npm run check:v2-acceptance 通过'
  ]
  const missingAutomatic = automaticChecks.filter(text => !markdown.includes(text))
  const completionChecked = markdown.includes('- [x] 全部通过，可以标记 v2.0 目标完成')
  const metadataIssues = []
  const evidenceIssues = []

  const device = metaValue(markdown, '真机设备')
  const preview = metaValue(markdown, '预览码')
  const evidenceDir = metaValue(markdown, '证据目录')
  if (isPlaceholder(device)) metadataIssues.push('真机设备必须填写具体机型/系统/微信版本')
  if (isPlaceholder(preview) || !fs.existsSync(resolveEvidencePath(preview))) metadataIssues.push('预览码文件必须存在')
  if (isPlaceholder(evidenceDir)) metadataIssues.push('证据目录必须填写')
  else if (!fs.existsSync(resolveEvidencePath(evidenceDir))) metadataIssues.push('证据目录必须存在')
  if (!runtimeErrorsFilled(markdown)) metadataIssues.push('运行时报错必须填写；无报错时写“无”')

  for (const [item, result, evidence] of passingRows) {
    if (item.includes('朋友第一反应')) {
      if (!friendQuoteIsFilled(markdown)) {
        evidenceIssues.push(`${item}: 必须填写朋友反馈原话`)
      }
      continue
    }

    const paths = evidencePaths(evidence)
    if (!paths.length) {
      evidenceIssues.push(`${item}: 通过行必须填写本地截图/录屏证据路径`)
      continue
    }

    for (const evidencePath of paths) {
      if (!fs.existsSync(resolveEvidencePath(evidencePath))) {
        evidenceIssues.push(`${item}: 证据文件不存在 ${evidencePath}`)
      }
    }

    if (item.includes('旧 theme=sakura-pink') && isPlaceholder(metaValue(markdown, '旧数据婚礼 ID'))) {
      evidenceIssues.push(`${item}: 必须填写真实旧数据 weddingId`)
    }
  }

  if (missingAutomatic.length || failingRows.length || metadataIssues.length || evidenceIssues.length || !completionChecked) {
    console.error('v2 real-device acceptance is not complete.')
    if (missingAutomatic.length) {
      console.error('Automatic evidence not marked complete:')
      for (const item of missingAutomatic) console.error(`- ${item.replace('- [x] ', '')}`)
    }
    if (metadataIssues.length) {
      console.error('Record metadata is incomplete:')
      for (const item of metadataIssues) console.error(`- ${item}`)
    }
    if (failingRows.length) {
      console.error('Manual rows still pending or failed:')
      for (const [item, result, evidence, note] of failingRows) {
        console.error(`- ${item}: ${result || '未填写'}${evidence ? ` (${evidence})` : ''}${note ? ` - ${note}` : ''}`)
      }
    }
    if (evidenceIssues.length) {
      console.error('Manual evidence is incomplete:')
      for (const item of evidenceIssues) console.error(`- ${item}`)
    }
    if (!completionChecked) {
      console.error('Final completion checkbox is not checked.')
    }
    process.exit(1)
  }

  console.log(`v2 real-device acceptance complete: ${recordPath}`)
}

main()
