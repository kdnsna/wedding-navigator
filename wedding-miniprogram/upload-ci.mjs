import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'))

const appid = process.env.MINIPROGRAM_APPID || manifest['mp-weixin']?.appid || ''
const projectPath = process.env.MINIPROGRAM_PROJECT_PATH || path.join(__dirname, 'dist/build/mp-weixin')
const privateKeyPath = process.env.MINIPROGRAM_PRIVATE_KEY_PATH || ''
const version = process.env.MINIPROGRAM_VERSION || manifest.versionName || '1.0.0'
const desc = process.env.MINIPROGRAM_UPLOAD_DESC || `甜囍手册 v${version} 发布`

function assertConfig(condition, message) {
  if (!condition) {
    console.error(`配置缺失：${message}`)
    process.exit(1)
  }
}

assertConfig(appid && appid !== '__UNI__WEDDING_NAV', '请在 manifest.json 或 MINIPROGRAM_APPID 中配置正式 AppID')
assertConfig(fs.existsSync(projectPath), `构建目录不存在：${projectPath}，请先运行 npm run build:mp-weixin`)
assertConfig(privateKeyPath, '请设置 MINIPROGRAM_PRIVATE_KEY_PATH 指向微信小程序上传私钥')
assertConfig(fs.existsSync(privateKeyPath), `上传私钥不存在：${privateKeyPath}`)

let ci
try {
  const mod = await import('miniprogram-ci')
  ci = mod.default || mod
} catch (err) {
  console.error('缺少 miniprogram-ci，请先安装依赖或使用微信开发者工具 CLI 上传。')
  console.error(err.message)
  process.exit(1)
}

const project = new ci.Project({
  appid,
  type: 'miniProgram',
  projectPath,
  privateKeyPath,
  ignores: ['node_modules/**/*'],
})

console.log(`miniprogram-ci 上传 v${version}...`)
const result = await ci.upload({
  project,
  version,
  desc,
  onProgressUpdate: console.log,
})
console.log('上传成功:', JSON.stringify(result))
