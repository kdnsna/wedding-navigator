const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const targetDir = path.resolve(root, process.argv[2] || 'dist/build/mp-weixin')
const sourceDir = path.join(root, 'cloudfunctions')
const targetCloudDir = path.join(targetDir, 'cloudfunctions')
const cloudbasercPath = path.join(root, 'cloudbaserc.json')

function getExpectedFunctionNames() {
  const config = JSON.parse(fs.readFileSync(cloudbasercPath, 'utf8'))
  const names = (config.functions || []).map(fn => fn.name).filter(Boolean)
  if (!names.length) {
    throw new Error('cloudbaserc.json does not declare any cloud functions')
  }

  const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index)
  if (duplicateNames.length) {
    throw new Error(`cloudbaserc.json contains duplicate cloud functions: ${[...new Set(duplicateNames)].join(', ')}`)
  }

  const invalidNames = names.filter(name => name.includes('/') || name.includes('\\') || name.includes('..') || /\s+\d+$/.test(name))
  if (invalidNames.length) {
    throw new Error(`cloudbaserc.json contains invalid cloud function names: ${invalidNames.join(', ')}`)
  }

  return names.sort()
}

function validateCopiedFunctions(expectedNames) {
  const actualNames = fs.readdirSync(targetCloudDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()
  const expected = expectedNames.join(',')
  const actual = actualNames.join(',')
  if (actual !== expected) {
    throw new Error(`copied cloudfunctions mismatch. expected ${expected}; got ${actual}`)
  }

  const duplicateSuffixedNames = actualNames.filter(name => /\s+\d+$/.test(name))
  if (duplicateSuffixedNames.length) {
    throw new Error(`copied cloudfunctions include duplicate-suffixed directories: ${duplicateSuffixedNames.join(', ')}`)
  }
}

function copyCloudFunctions() {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`cloudfunctions source is missing: ${sourceDir}`)
  }
  if (!fs.existsSync(targetDir)) {
    throw new Error(`mp-weixin build output is missing: ${targetDir}`)
  }

  const expectedNames = getExpectedFunctionNames()
  fs.rmSync(targetCloudDir, { recursive: true, force: true })
  fs.mkdirSync(targetCloudDir, { recursive: true })

  for (const name of expectedNames) {
    const source = path.join(sourceDir, name)
    const target = path.join(targetCloudDir, name)
    if (!fs.existsSync(path.join(source, 'index.js'))) {
      throw new Error(`cloud function is missing index.js: ${name}`)
    }
    fs.cpSync(source, target, {
      recursive: true,
      filter: item => !item.split(path.sep).includes('node_modules')
    })
  }

  validateCopiedFunctions(expectedNames)
  fs.copyFileSync(cloudbasercPath, path.join(targetDir, 'cloudbaserc.json'))
  console.log(`cloudfunctions copied to ${targetCloudDir} (${expectedNames.length}: ${expectedNames.join(', ')})`)
}

copyCloudFunctions()
