import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import ci from 'miniprogram-ci'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'))

const appid = 'wx2477cb578d01e89f'
const projectPath = path.join(__dirname, 'dist/build/mp-weixin')
const privateKeyPath = path.join(process.env.HOME, 'Desktop/private.wx2477cb578d01e89f.key')
const version = manifest.versionName || '1.0.0'
const desc = `甜囍手册 v${version} 发布`

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
