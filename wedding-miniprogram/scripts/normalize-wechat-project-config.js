const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const targetDir = path.resolve(root, process.argv[2] || 'dist/build/mp-weixin')
const configPath = path.join(targetDir, 'project.config.json')
const manifestPath = path.join(root, 'manifest.json')

function normalizeProjectConfig() {
  if (!fs.existsSync(configPath)) {
    throw new Error(`WeChat project config is missing: ${configPath}`)
  }
  const projectConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const appid = manifest['mp-weixin']?.appid || projectConfig.appid
  const projectName = manifest.name || projectConfig.projectname || '甜囍手册'

  projectConfig.appid = appid
  projectConfig.projectname = encodeURIComponent(projectName)
  projectConfig.miniprogramRoot = projectConfig.miniprogramRoot || './'
  projectConfig.cloudfunctionRoot = projectConfig.cloudfunctionRoot || 'cloudfunctions/'
  projectConfig.libVersion = projectConfig.libVersion || '3.8.12'

  fs.writeFileSync(configPath, `${JSON.stringify(projectConfig, null, 2)}\n`)
  console.log(`wechat project config normalized at ${configPath}`)
}

normalizeProjectConfig()
