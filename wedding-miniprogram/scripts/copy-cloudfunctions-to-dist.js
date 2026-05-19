const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const targetDir = path.resolve(root, process.argv[2] || 'dist/build/mp-weixin')
const sourceDir = path.join(root, 'cloudfunctions')
const targetCloudDir = path.join(targetDir, 'cloudfunctions')

function copyCloudFunctions() {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`cloudfunctions source is missing: ${sourceDir}`)
  }
  if (!fs.existsSync(targetDir)) {
    throw new Error(`mp-weixin build output is missing: ${targetDir}`)
  }

  fs.rmSync(targetCloudDir, { recursive: true, force: true })
  fs.cpSync(sourceDir, targetCloudDir, {
    recursive: true,
    filter: source => !source.split(path.sep).includes('node_modules')
  })

  fs.copyFileSync(path.join(root, 'cloudbaserc.json'), path.join(targetDir, 'cloudbaserc.json'))
  console.log(`cloudfunctions copied to ${targetCloudDir}`)
}

copyCloudFunctions()
