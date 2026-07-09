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

function assertConfig(condition, message) {
  if (!condition) {
    console.error(`配置缺失：${message}`)
    process.exit(1)
  }
}

assertConfig(fs.existsSync(cliPath), `微信开发者工具 CLI 不存在：${cliPath}`)
assertConfig(fs.existsSync(projectPath), `构建目录不存在：${projectPath}，请先运行 npm run build:mp-weixin`)
assertConfig(fs.existsSync(path.join(projectPath, 'project.config.json')), `微信项目配置不存在：${path.join(projectPath, 'project.config.json')}`)
assertConfig(fs.existsSync(copyCloudfunctionsScript), `云函数同步脚本不存在：${copyCloudfunctionsScript}`)

fs.mkdirSync(path.dirname(qrOutput), { recursive: true })
fs.mkdirSync(path.dirname(infoOutput), { recursive: true })

function syncCloudfunctions() {
  const result = spawnSync(process.execPath, [copyCloudfunctionsScript, projectPath], { stdio: 'inherit' })
  if (result.status !== 0) {
    console.error(`同步云函数失败，退出码：${result.status}`)
    process.exit(result.status || 1)
  }
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

syncCloudfunctions()
console.log(`开始使用微信开发者工具 CLI 生成 v${version} 预览码...`)
const result = spawnSync(cliPath, args, { stdio: 'inherit' })
syncCloudfunctions()

if (result.status !== 0) {
  console.error(`生成预览码失败，退出码：${result.status}`)
  process.exit(result.status || 1)
}

console.log(`预览码已生成：${qrOutput}`)
console.log(`预览详情文件：${infoOutput}`)
