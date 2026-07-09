const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

const EVIDENCE_ITEMS = [
  {
    arg: 'theme-switch',
    row: '四色情绪色随机切换，无第五种彩色',
    fileBase: 'theme-switch'
  },
  {
    arg: 'guest-scroll',
    row: '宾客端从扉页滑到卷尾，整体像请柬',
    fileBase: 'guest-scroll'
  },
  {
    arg: 'hero-photo',
    row: '扉页照片满幅且底部纸色渐变收边',
    fileBase: 'hero-photo'
  },
  {
    arg: 'mounted-photos',
    row: '内页照片白边、发丝线、展签完整',
    fileBase: 'mounted-photos'
  },
  {
    arg: 'legacy-sakura',
    row: '旧 theme=sakura-pink 数据打开为酒红且无报错',
    fileBase: 'legacy-sakura',
    requiresWeddingId: true,
    appendEvidence: '.release/legacy-sakura-query.json'
  },
  {
    arg: 'wizard-flow',
    row: '四幕向导一气呵成',
    fileBase: 'wizard-flow'
  },
  {
    arg: 'wizard-photo-preview',
    row: '第三幕选照立即看到装裱预览',
    fileBase: 'wizard-photo-preview'
  },
  {
    arg: 'premium-entitlement',
    row: '主人端高级色权益状态生效',
    fileBase: 'premium-entitlement'
  }
]

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))
}

function parseArgs(argv) {
  const args = {}
  for (const item of argv.slice(2)) {
    if (!item.startsWith('--')) continue
    const eq = item.indexOf('=')
    if (eq === -1) {
      args[item.slice(2)] = true
    } else {
      args[item.slice(2, eq)] = item.slice(eq + 1)
    }
  }
  return args
}

function version() {
  return readJson('manifest.json').versionName || 'unknown'
}

function recordPathForVersion(currentVersion) {
  return path.join(root, '.release', `v2-real-device-acceptance-${currentVersion}.md`)
}

function evidenceDirForVersion(currentVersion) {
  return path.join(root, '.release', `v2-evidence-${currentVersion}`)
}

function rel(filePath) {
  return path.relative(root, filePath).split(path.sep).join('/')
}

function ensureRecord(recordPath) {
  if (!fs.existsSync(recordPath)) {
    console.error(`Missing acceptance record: ${recordPath}`)
    console.error('Run `npm run create:v2-acceptance-record` first.')
    process.exit(1)
  }
}

function copyEvidence(source, evidenceDir, fileBase) {
  const sourcePath = path.resolve(source)
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`证据文件不存在：${source}`)
  }
  const ext = path.extname(sourcePath) || '.bin'
  const target = path.join(evidenceDir, `${fileBase}${ext}`)
  fs.copyFileSync(sourcePath, target)
  return rel(target)
}

function replaceMeta(markdown, label, value) {
  const line = `${label}: ${value}`
  const matcher = new RegExp(`^${escapeRegExp(label)}:.*$`, 'm')
  if (matcher.test(markdown)) return markdown.replace(matcher, line)

  const previewMatcher = /^预览码:.*$/m
  if (previewMatcher.test(markdown)) {
    return markdown.replace(previewMatcher, match => `${match}\n${line}`)
  }
  return markdown.replace('\n## 自动门禁', `\n${line}\n\n## 自动门禁`)
}

function metaValue(markdown, label) {
  const matcher = new RegExp(`^${escapeRegExp(label)}:\\s*(.+)$`, 'm')
  const match = markdown.match(matcher)
  return match ? match[1].trim() : ''
}

function isPlaceholder(value) {
  return !String(value || '').trim() || /待填写|待真机|待测|待真实|未找到/.test(String(value || ''))
}

function replaceSection(markdown, heading, body) {
  const matcher = new RegExp(`\\n## ${escapeRegExp(heading)}\\n[\\s\\S]*?(?=\\n## |$)`)
  const next = `\n## ${heading}\n\n${body.trim()}\n`
  if (matcher.test(markdown)) return markdown.replace(matcher, next)
  return `${markdown.trimEnd()}\n${next}`
}

function updateRow(markdown, itemName, { result, evidence, note }) {
  const lines = markdown.split('\n')
  const index = lines.findIndex(line => line.startsWith(`| ${itemName} |`))
  if (index === -1) {
    throw new Error(`验收记录中找不到项目：${itemName}`)
  }
  const cells = lines[index].split('|').slice(1, -1).map(cell => cell.trim())
  const next = [
    cells[0],
    result || cells[1],
    evidence !== undefined ? evidence : cells[2],
    note !== undefined ? note : cells[3]
  ]
  lines[index] = `| ${next.join(' | ')} |`
  return lines.join('\n')
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function main() {
  const args = parseArgs(process.argv)
  const currentVersion = version()
  const recordPath = recordPathForVersion(currentVersion)
  const evidenceDir = evidenceDirForVersion(currentVersion)
  ensureRecord(recordPath)
  fs.mkdirSync(evidenceDir, { recursive: true })

  let markdown = fs.readFileSync(recordPath, 'utf8')
  markdown = replaceMeta(markdown, '证据目录', rel(evidenceDir))

  if (args.device) {
    markdown = replaceMeta(markdown, '真机设备', args.device)
  }
  if (args['old-wedding-id']) {
    markdown = replaceMeta(markdown, '旧数据婚礼 ID', args['old-wedding-id'])
  }
  if (args['friend-quote']) {
    if (!args['friend-evidence']) {
      throw new Error('朋友反馈需要同时传入 --friend-evidence=<截图或记录文件>')
    }
    markdown = replaceSection(markdown, '朋友反馈原话', `> ${args['friend-quote']}`)
    markdown = updateRow(markdown, '不知情朋友第一反应是请柬/邀请函', {
      result: '通过',
      evidence: copyEvidence(args['friend-evidence'], evidenceDir, 'friend-feedback'),
      note: '记录原话'
    })
  }
  if (args['runtime-errors']) {
    markdown = replaceSection(markdown, '运行时报错', `- ${args['runtime-errors']}`)
  } else if (args['no-errors']) {
    markdown = replaceSection(markdown, '运行时报错', '- 无')
  }

  for (const item of EVIDENCE_ITEMS) {
    const source = args[item.arg]
    if (!source) continue
    if (item.requiresWeddingId && !args['old-wedding-id'] && isPlaceholder(metaValue(markdown, '旧数据婚礼 ID'))) {
      throw new Error(`${item.row}: 需要同时传入 --old-wedding-id=<真实 weddingId>`)
    }

    const evidencePath = copyEvidence(source, evidenceDir, item.fileBase)
    const evidence = item.appendEvidence ? `${evidencePath}; ${item.appendEvidence}` : evidencePath
    markdown = updateRow(markdown, item.row, {
      result: '通过',
      evidence
    })
  }

  fs.writeFileSync(recordPath, markdown)
  console.log(`Manual v2 evidence recorded: ${recordPath}`)
  console.log(`Evidence directory: ${rel(evidenceDir)}`)
}

main()
