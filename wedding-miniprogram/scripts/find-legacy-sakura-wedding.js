const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const root = path.resolve(__dirname, '..')
const releaseDir = path.join(root, '.release')
const LEGACY_SAKURA_VALUES = ['sakura-pink', 'theme-sakura-pink']
const WEDDING_THEME_FIELDS = [
  'theme',
  'themeClass',
  'theme_key',
  'basic_info.theme',
  'basic_info.themeClass',
  'commercial.theme',
  'commercial.theme_key',
  'workspace.theme',
  'workspace.theme_key',
  'invitation.theme',
  'invitation.themeClass',
  'settings.theme',
  'settings.themeClass',
  'style.theme',
  'style.themeClass'
]
const INVITATION_THEME_FIELDS = [
  'theme',
  'themeClass',
  'theme_key',
  'commercial.theme',
  'commercial.theme_key',
  'settings.theme',
  'settings.themeClass',
  'style.theme',
  'style.themeClass',
  'template.theme',
  'template.themeClass'
]

function themeFilter(fields) {
  return {
    $or: fields.flatMap(field => LEGACY_SAKURA_VALUES.map(value => ({ [field]: value })))
  }
}

function themeProjection(fields) {
  return fields.reduce((projection, field) => {
    projection[field] = 1
    return projection
  }, { _id: 1, updated_at: 1 })
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))
}

function buildCommands() {
  return [
    {
      TableName: 'weddings',
      CommandType: 'QUERY',
      Command: JSON.stringify({
        find: 'weddings',
        filter: themeFilter(WEDDING_THEME_FIELDS),
        projection: themeProjection(WEDDING_THEME_FIELDS),
        limit: 10
      })
    },
    {
      TableName: 'invitations',
      CommandType: 'QUERY',
      Command: JSON.stringify({
        find: 'invitations',
        filter: themeFilter(INVITATION_THEME_FIELDS),
        projection: themeProjection(INVITATION_THEME_FIELDS),
        limit: 10
      })
    }
  ]
}

function runCloudbaseQuery(envId) {
  const args = [
    'exec',
    '--yes',
    '--package',
    '@cloudbase/cli',
    '--',
    'tcb',
    '-e',
    envId,
    'db',
    'nosql',
    'execute',
    '--json',
    '--command',
    JSON.stringify(buildCommands())
  ]
  return spawnSync('npm', args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 8,
    timeout: 45000
  })
}

function writeResult(payload) {
  fs.mkdirSync(releaseDir, { recursive: true })
  const outputPath = path.join(releaseDir, 'legacy-sakura-query.json')
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2))
  return outputPath
}

function maybeParseJson(raw) {
  const trimmed = String(raw || '').trim()
  if (!trimmed) return null
  try {
    return JSON.parse(trimmed)
  } catch (err) {
    return null
  }
}

function extractCandidateIds(parsed) {
  const results = parsed?.data?.results
  if (!Array.isArray(results)) return []
  return results
    .flat()
    .map(item => item?._id)
    .filter(Boolean)
}

function main() {
  const config = readJson('cloudbaserc.json')
  const envId = process.env.CLOUDBASE_ENV_ID || config.envId
  if (!envId) throw new Error('cloudbaserc.json is missing envId')

  const res = runCloudbaseQuery(envId)
  const stdout = String(res.stdout || '')
  const stderr = String(res.stderr || '')
  const parsed = maybeParseJson(stdout)
  const outputPath = writeResult({
    envId,
    createdAt: new Date().toISOString(),
    status: res.status,
    stdout: parsed || stdout,
    stderr
  })
  const combinedOutput = `${stdout}\n${stderr}`

  if (res.error || res.status !== 0 || combinedOutput.includes('No valid identity information')) {
    if (res.error?.code === 'ETIMEDOUT') {
      console.error('CloudBase CLI query timed out. Run `npm exec --yes --package @cloudbase/cli -- tcb login`, then retry `npm run find:legacy-sakura`.')
    } else if (combinedOutput.includes('No valid identity information')) {
      console.error('CloudBase CLI is not logged in. Run `npm exec --yes --package @cloudbase/cli -- tcb login`, then retry `npm run find:legacy-sakura`.')
    } else {
      console.error(combinedOutput.trim() || 'CloudBase query failed')
    }
    console.error(`Raw query result written to ${outputPath}`)
    process.exit(res.status || 1)
  }

  console.log(`Legacy sakura-pink query result written to ${outputPath}`)
  if (parsed) {
    console.log(JSON.stringify(parsed, null, 2))
    const ids = extractCandidateIds(parsed)
    if (ids.length) {
      console.log(`Candidate wedding IDs: ${ids.join(', ')}`)
    } else {
      console.log('No sakura-pink legacy records were found in weddings or invitations. The old-data real-device item remains pending until a real legacy weddingId is provided or found.')
    }
  } else {
    console.log(stdout.trim())
  }
}

main()
