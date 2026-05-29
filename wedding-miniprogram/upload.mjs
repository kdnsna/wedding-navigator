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
const desc = process.env.MINIPROGRAM_UPLOAD_DESC || `甜囍手册 ${version} 发布`
const port = process.env.WECHAT_DEVTOOLS_PORT || '9420'
const infoOutput = process.env.MINIPROGRAM_UPLOAD_INFO_OUTPUT || path.join(__dirname, '.release', `upload-${version}.json`)

function assertConfig(condition, message) {
  if (!condition) {
    console.error(`配置缺失：${message}`)
    process.exit(1)
  }
}

assertConfig(fs.existsSync(cliPath), `微信开发者工具 CLI 不存在：${cliPath}`)
assertConfig(fs.existsSync(projectPath), `构建目录不存在：${projectPath}，请先运行 npm run build:mp-weixin`)

fs.mkdirSync(path.dirname(infoOutput), { recursive: true })

const args = [
  'upload',
  '--project', projectPath,
  '--version', version,
  '--desc', desc,
  '--port', port,
  '--lang', 'zh',
  '--info-output', infoOutput
]

console.log(`开始使用微信开发者工具 CLI 上传 v${version}...`)
const result = spawnSync(cliPath, args, { encoding: 'utf8' })
const stdout = result.stdout || ''
const stderr = result.stderr || ''
if (stdout) process.stdout.write(stdout)
if (stderr) process.stderr.write(stderr)
const combinedOutput = `${stdout}\n${stderr}`

if (
  result.status !== 0 ||
  combinedOutput.includes('[error]') ||
  combinedOutput.includes('✖ 上传') ||
  !fs.existsSync(infoOutput) ||
  fs.statSync(infoOutput).size === 0
) {
  console.error(`上传失败，退出码：${result.status}`)
  process.exit(result.status || 1)
}

console.log(`上传完成，详情文件：${infoOutput}`)
