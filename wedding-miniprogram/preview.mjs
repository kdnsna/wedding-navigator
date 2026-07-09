import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'))
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'))

const cliPath = process.env.WECHAT_DEVTOOLS_CLI_PATH || '/Applications/wechatwebdevtools.app/Contents/MacOS/cli'
const projectPath = process.env.MINIPROGRAM_PROJECT_PATH || path.join(__dirname, 'dist/build/mp-weixin')
const version = process.env.MINIPROGRAM_VERSION || manifest.versionName || pkg.version || '1.0.0'
const port = process.env.WECHAT_DEVTOOLS_PORT || '12890'
const qrOutput = process.env.MINIPROGRAM_PREVIEW_QR_OUTPUT || path.join(__dirname, '.release', `preview-${version}.png`)
const infoOutput = process.env.MINIPROGRAM_PREVIEW_INFO_OUTPUT || path.join(__dirname, '.release', `preview-${version}.json`)
const copyCloudfunctionsScript = path.join(__dirname, 'scripts/copy-cloudfunctions-to-dist.js')
const skipBuild = process.env.MINIPROGRAM_PREVIEW_SKIP_BUILD === '1'

function assertConfig(condition, message) {
  if (!condition) {
    console.error(`配置缺失：${message}`)
    process.exit(1)
  }
}

assertConfig(fs.existsSync(cliPath), `微信开发者工具 CLI 不存在：${cliPath}`)
assertConfig(fs.existsSync(copyCloudfunctionsScript), `云函数同步脚本不存在：${copyCloudfunctionsScript}`)

fs.mkdirSync(path.dirname(qrOutput), { recursive: true })
fs.mkdirSync(path.dirname(infoOutput), { recursive: true })

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    cwd: __dirname,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 12
  })
  process.stdout.write(result.stdout || '')
  process.stderr.write(result.stderr || '')
  return result
}

function syncCloudfunctions() {
  const result = runCommand(process.execPath, [copyCloudfunctionsScript, projectPath])
  if (result.status !== 0) {
    console.error(`同步云函数失败，退出码：${result.status}`)
    process.exit(result.status || 1)
  }
}

function buildProject() {
  if (skipBuild) return
  console.log('开始构建微信小程序产物...')
  const result = runCommand('npm', ['run', 'build:mp-weixin'])
  if (result.status !== 0) {
    console.error(`构建失败，退出码：${result.status}`)
    process.exit(result.status || 1)
  }
}

function outputContainsCliError(result) {
  const output = `${result.stdout || ''}\n${result.stderr || ''}`
  return output.includes('[error]') || output.includes('✖')
}

const args = [
  'preview',
  '--project', projectPath,
  '--port', port,
  '--lang', 'zh',
  '--qr-format', 'image',
  '--qr-output', qrOutput,
  '--info-output', infoOutput
]

buildProject()
assertConfig(fs.existsSync(projectPath), `构建目录不存在：${projectPath}，请先运行 npm run build:mp-weixin`)
assertConfig(fs.existsSync(path.join(projectPath, 'project.config.json')), `微信项目配置不存在：${path.join(projectPath, 'project.config.json')}`)
syncCloudfunctions()
fs.rmSync(qrOutput, { force: true })
fs.rmSync(infoOutput, { force: true })
console.log(`开始使用微信开发者工具 CLI 生成 v${version} 预览码...`)
const result = runCommand(cliPath, args)
syncCloudfunctions()

if (result.status !== 0 || outputContainsCliError(result)) {
  console.error(`生成预览码失败，退出码：${result.status}`)
  process.exit(result.status || 1)
}
assertConfig(fs.existsSync(qrOutput), `预览二维码未生成：${qrOutput}`)
assertConfig(fs.existsSync(infoOutput), `预览详情文件未生成：${infoOutput}`)

console.log(`预览码已生成：${qrOutput}`)
console.log(`预览详情文件：${infoOutput}`)
