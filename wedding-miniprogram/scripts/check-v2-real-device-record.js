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

function parseRows(markdown) {
  return markdown
    .split('\n')
    .filter(line => line.startsWith('|') && !line.includes('---'))
    .slice(1)
    .map(line => line.split('|').slice(1, -1).map(cell => cell.trim()))
    .filter(cells => cells.length >= 4)
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
  const automaticChecks = [
    '- [x] npm run check:release 通过',
    '- [x] npm run build:mp-weixin 通过',
    '- [x] npm run check:v2-acceptance 通过'
  ]
  const missingAutomatic = automaticChecks.filter(text => !markdown.includes(text))
  const completionChecked = markdown.includes('- [x] 全部通过，可以标记 v2.0 目标完成')

  if (missingAutomatic.length || failingRows.length || !completionChecked) {
    console.error('v2 real-device acceptance is not complete.')
    if (missingAutomatic.length) {
      console.error('Automatic evidence not marked complete:')
      for (const item of missingAutomatic) console.error(`- ${item.replace('- [x] ', '')}`)
    }
    if (failingRows.length) {
      console.error('Manual rows still pending or failed:')
      for (const [item, result, evidence, note] of failingRows) {
        console.error(`- ${item}: ${result || '未填写'}${evidence ? ` (${evidence})` : ''}${note ? ` - ${note}` : ''}`)
      }
    }
    if (!completionChecked) {
      console.error('Final completion checkbox is not checked.')
    }
    process.exit(1)
  }

  console.log(`v2 real-device acceptance complete: ${recordPath}`)
}

main()
