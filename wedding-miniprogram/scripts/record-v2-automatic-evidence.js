const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const root = path.resolve(__dirname, '..')

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))
}

function recordPathForVersion() {
  const version = readJson('manifest.json').versionName || 'unknown'
  return path.join(root, '.release', `v2-real-device-acceptance-${version}.md`)
}

function runCommand(label, command, args) {
  const startedAt = new Date().toISOString()
  const res = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 12
  })
  return {
    label,
    command: [command, ...args].join(' '),
    status: res.status,
    startedAt,
    finishedAt: new Date().toISOString(),
    stdout: String(res.stdout || '').trim(),
    stderr: String(res.stderr || '').trim()
  }
}

function commandSucceeded(result) {
  return result.status === 0
}

function ensureRecordExists(recordPath) {
  if (!fs.existsSync(recordPath)) {
    console.error(`Missing acceptance record: ${recordPath}`)
    console.error('Run `npm run create:v2-acceptance-record` first.')
    process.exit(1)
  }
}

function markAutomaticChecks(markdown, results) {
  let next = markdown
  if (commandSucceeded(results.checkRelease)) {
    next = next.replace('- [ ] npm run check:release 通过', '- [x] npm run check:release 通过')
  }
  if (commandSucceeded(results.buildMpWeixin)) {
    next = next.replace('- [ ] npm run build:mp-weixin 通过', '- [x] npm run build:mp-weixin 通过')
  }
  if (commandSucceeded(results.checkV2)) {
    next = next.replace('- [ ] npm run check:v2-acceptance 通过', '- [x] npm run check:v2-acceptance 通过')
  }
  return next
}

function appendEvidence(markdown, results) {
  const summary = [
    '',
    '## 自动证据',
    '',
    `记录时间: ${new Date().toISOString()}`,
    '',
    '| 命令 | 结果 |',
    '| --- | --- |',
    `| npm run build:mp-weixin | ${commandSucceeded(results.buildMpWeixin) ? '通过' : '失败'} |`,
    `| npm run check:release | ${commandSucceeded(results.checkRelease) ? '通过' : '失败'} |`,
    `| npm run check:v2-acceptance -- --automatic | ${commandSucceeded(results.checkV2) ? '通过' : '失败'} |`,
    ''
  ].join('\n')

  if (markdown.includes('## 自动证据')) {
    return markdown.replace(/\n## 自动证据[\s\S]*?(?=\n## 朋友反馈原话|\n## 运行时报错|\n## 旧数据查询|\n## 结论|$)/, `\n${summary}`)
  }
  return markdown.replace('\n## 朋友反馈原话', `${summary}\n## 朋友反馈原话`)
}

function main() {
  const recordPath = recordPathForVersion()
  ensureRecordExists(recordPath)

  const buildMpWeixin = runCommand('buildMpWeixin', 'npm', ['run', 'build:mp-weixin'])
  if (!commandSucceeded(buildMpWeixin)) {
    console.error(buildMpWeixin.stdout)
    console.error(buildMpWeixin.stderr)
    process.exit(buildMpWeixin.status || 1)
  }

  const prepareDist = runCommand('prepareDist', 'node', ['scripts/copy-cloudfunctions-to-dist.js', 'dist/build/mp-weixin'])
  if (!commandSucceeded(prepareDist)) {
    console.error(prepareDist.stdout)
    console.error(prepareDist.stderr)
    process.exit(prepareDist.status || 1)
  }

  const results = {
    buildMpWeixin,
    checkRelease: runCommand('checkRelease', 'npm', ['run', 'check:release']),
    checkV2: runCommand('checkV2', 'npm', ['run', 'check:v2-acceptance', '--', '--automatic'])
  }

  const failed = Object.values(results).filter(result => !commandSucceeded(result))
  if (failed.length) {
    for (const result of failed) {
      console.error(`Command failed: ${result.command}`)
      console.error(result.stdout)
      console.error(result.stderr)
    }
    process.exit(failed[0].status || 1)
  }

  const markdown = fs.readFileSync(recordPath, 'utf8')
  const updated = appendEvidence(markAutomaticChecks(markdown, results), results)
  fs.writeFileSync(recordPath, updated)
  console.log(`Automatic v2 evidence recorded: ${recordPath}`)
}

main()
