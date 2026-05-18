const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function assertIncludes(file, text, message) {
  assert(read(file).includes(text), `${file}: ${message}`)
}

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/gm, '')
}

function collectVueRoutes() {
  const pagesJson = JSON.parse(read('pages.json'))
  const routes = []
  for (const page of pagesJson.pages || []) {
    routes.push(page.path)
  }
  for (const pkg of pagesJson.subPackages || []) {
    for (const page of pkg.pages || []) {
      routes.push(`${pkg.root}/${page.path}`)
    }
  }
  return routes
}

function checkPagesExist() {
  for (const route of collectVueRoutes()) {
    const file = `${route}.vue`
    assert(fs.existsSync(path.join(root, file)), `pages.json route is missing file: ${file}`)
  }
}

function checkNavigationTargets() {
  const validRoutes = new Set(collectVueRoutes())
  const files = walk(root).filter(file => /\.(vue|js)$/.test(file))
  const targetPattern = /uni\.(?:navigateTo|switchTab|reLaunch|redirectTo)\s*\(\s*\{\s*url:\s*[`'"]([^`'"]+)/g

  for (const abs of files) {
    const rel = path.relative(root, abs)
    const source = read(rel)
    for (const match of source.matchAll(targetPattern)) {
      const normalized = match[1]
        .replace(/^\//, '')
        .replace(/\?.*$/, '')
        .replace(/\$\{[^}]+\}/g, '')
      if (!normalized || normalized.endsWith('/')) continue
      assert(validRoutes.has(normalized), `${rel}: navigation target is not in pages.json: ${match[1]}`)
    }
  }
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const result = []
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      result.push(...walk(abs))
    } else {
      result.push(abs)
    }
  }
  return result
}

function checkRsvpContract() {
  const rsvpPage = read('pages/rsvp/index.vue')
  assert(rsvpPage.includes('rsvp_status'), 'pages/rsvp/index.vue must submit canonical rsvp_status')
  assert(rsvpPage.includes('attending_count'), 'pages/rsvp/index.vue must submit canonical attending_count')
  assert(rsvpPage.includes('diet_preference'), 'pages/rsvp/index.vue must submit canonical diet_preference')
  assert(rsvpPage.includes('relationship'), 'pages/rsvp/index.vue must collect guest relationship')
  assert(rsvpPage.includes('arrival_time'), 'pages/rsvp/index.vue must submit arrival_time for real-world planning')
  assert(rsvpPage.includes('transport_mode'), 'pages/rsvp/index.vue must submit transport_mode for arrival planning')
  assertIncludes('cloudfunctions/submitRSVP/index.js', 'normalizeRSVP', 'submitRSVP must normalize canonical and legacy RSVP fields')
  assertIncludes('cloudfunctions/submitRSVP/index.js', 'companion_note', 'submitRSVP must persist companion notes')
}

function checkOwnerGuard() {
  const source = read('composables/useOwnerGuard.js')
  assert(source.includes('weddingId'), 'useOwnerGuard must check current weddingId')
  assert(source.includes('ownerVerified'), 'useOwnerGuard must check owner verification state')
  assert(source.includes('navigateTo'), 'useOwnerGuard must redirect users without owner access')
}

function checkCloudSafety() {
  const weatherSource = stripComments(read('cloudfunctions/getWeather/index.js'))
  assert(!weatherSource.includes('ea363fcdd56742fa84a17c4b11b37bdc'), 'getWeather must not hardcode a production API key')
  assertIncludes('cloudfunctions/submitRSVP/index.js', 'CONTENT_SAFETY_MODE', 'submitRSVP must support configurable content safety fallback')
  assertIncludes('cloudfunctions/submitBlessing/index.js', 'CONTENT_SAFETY_MODE', 'submitBlessing must support configurable content safety fallback')
  assertIncludes('cloudfunctions/recordView/index.js', 'ensureStatsDocument', 'recordView must initialize missing stats documents')
  assertIncludes('composables/useCloud.js', 'recordShare', 'useCloud must expose share tracking')
  assertIncludes('pages/index/index.vue', 'recordShare', 'index share handlers must track shares')
}

function checkDataContracts() {
  assertIncludes('stores/wedding.js', 'cachedWeddingId', 'wedding store must bind cache to the current weddingId')
  assertIncludes('stores/wedding.js', 'isCacheValidFor', 'wedding store must expose weddingId-aware cache validation')
  assertIncludes('stores/wedding.js', 'normalizeListDocument', 'wedding store must normalize legacy nested list documents')
  assertIncludes('stores/wedding.js', 'activeTemplate', 'wedding store must expose the active visual template')
  assertIncludes('composables/useCloud.js', 'isCacheValidFor(weddingId)', 'fetchWedding must not reuse cache across weddingId values')
  assertIncludes('cloudfunctions/updateWedding/index.js', 'const updateData = { ...cleanData, updated_at: Date.now() }', 'updateWedding must write root objects for all editable collections')
  assertIncludes('cloudfunctions/updateWedding/index.js', "'invitations'", 'updateWedding must allow invitation edits without nested wrappers')
  assertIncludes('cloudfunctions/updateWedding/index.js', "'weddings'", 'updateWedding must allow wedding edits without nested wrappers')
  assertIncludes('cloudfunctions/updateWedding/index.js', "'guests'", 'updateWedding must persist guests without nested wrappers')
  assertIncludes('cloudfunctions/updateWedding/index.js', "'blessings'", 'updateWedding must persist blessings without nested wrappers')
  assertIncludes('cloudfunctions/updateWedding/index.js', 'isDocNotExistError', 'updateWedding must create missing related documents for older weddings')
  assertIncludes('cloudfunctions/createWedding/index.js', "'viewers'", 'createWedding must create the viewers collection used by view tracking')
  assertIncludes('cloudfunctions/recordView/index.js', "ensureCollection('viewers')", 'recordView must initialize the viewers collection')
  assertIncludes('cloudfunctions/getWedding/index.js', 'normalizeListDocument', 'getWedding must normalize legacy nested list documents')
  assertIncludes('cloudfunctions/getStats/index.js', 'normalizeListDocument', 'getStats must normalize legacy nested list documents')
  assertIncludes('cloudfunctions/getRSVPStats/index.js', 'normalizeListDocument', 'getRSVPStats must normalize legacy nested guest documents')
  assertIncludes('cloudfunctions/generatePoster/index.js', 'WXACODE_ENV_VERSION', 'generatePoster must support configurable wxacode env version')
}

function checkTemplateSystem() {
  assertIncludes('utils/templates.js', 'rose-couture', 'templates must include rose couture as the default direction')
  assertIncludes('utils/templates.js', 'champagne-editorial', 'templates must include champagne editorial')
  assertIncludes('utils/templates.js', 'noir-banquet', 'templates must include noir banquet')
  assertIncludes('utils/templates.js', 'garden-film', 'templates must include garden film')
  assertIncludes('pages-owner/wizard/index.vue', 'WEDDING_TEMPLATES', 'wizard must use shared template definitions')
  assertIncludes('pages-owner/invitation/edit.vue', 'WEDDING_TEMPLATES', 'invitation editor must use shared template definitions')
  assertIncludes('pages-owner/invitation/edit.vue', 'previewTemplate', 'invitation editor must preview the currently selected template before saving')
  assertIncludes('pages-owner/invitation/edit.vue', 'applyTemplatePreset', 'invitation editor must expose built-in template preset copy')
  assertIncludes('pages/index/index.vue', 'templateClass', 'home page must apply template styling')
  assertIncludes('pages/rsvp/index.vue', 'rsvp-brief', 'RSVP page must show a template-aware wedding brief')
  assertIncludes('pages/album/index.vue', 'activeTemplate.albumMood', 'album page must adapt copy to the active template')
  assertIncludes('pages-owner/album/manage.vue', 'chooseAlbumImages', 'album manager must handle modern WeChat image selection')
  assertIncludes('pages-owner/album/manage.vue', 'buildAlbumCloudPath', 'album manager must upload into wedding-scoped cloud paths')
  assertIncludes('composables/useCloud.js', 'wx.cloud?.uploadFile', 'uploadFile must prefer the native WeChat cloud upload API')
  assertIncludes('pages/guide/index.vue', 'snow', 'guide weather icons must handle weather types returned by getWeather')
}

function checkUploadScript() {
  const source = read('upload.mjs')
  assert(source.includes('MINIPROGRAM_PRIVATE_KEY_PATH'), 'upload script must read private key path from environment')
  assert(source.includes('MINIPROGRAM_PROJECT_PATH'), 'upload script must allow overriding project path')
  assert(!source.includes('/Users/kdnsna/Desktop'), 'upload script must not hardcode local private key paths')
  assert(!source.includes('/Users/kdnsna/Documents/06-项目代码'), 'upload script must not hardcode local build paths')
  assertIncludes('package.json', 'upload:mp-weixin', 'package scripts must expose the miniprogram upload command')
}

function checkReleaseDocs() {
  assert(fs.existsSync(path.join(root, '.nvmrc')), '.nvmrc must pin the preferred Node LTS version')
  const readme = read('README.md')
  assert(readme.includes('Node.js 20 LTS'), 'README must document Node.js 20 LTS')
  assert(readme.includes('发布前检查清单'), 'README must include a release checklist')
}

function readPngSize(file) {
  const abs = path.join(root, file)
  assert(fs.existsSync(abs), `visual asset is missing: ${file}`)
  const buf = fs.readFileSync(abs)
  assert(buf.slice(1, 4).toString('ascii') === 'PNG', `${file}: must be a PNG image`)
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

function assertPngSize(file, width, height) {
  const size = readPngSize(file)
  assert(size.width === width && size.height === height, `${file}: expected ${width}x${height}, got ${size.width}x${size.height}`)
}

function checkVisualAssets() {
  assertPngSize('static/visuals/default-cover.png', 640, 1349)

  const visualsDir = path.join(root, 'static/visuals')
  const visualFiles = fs.readdirSync(visualsDir).filter(name => name.endsWith('.png'))
  for (const file of visualFiles) {
    if (file.startsWith('empty-')) {
      assertPngSize(`static/visuals/${file}`, 180, 180)
    }
    if (file.startsWith('icon-')) {
      assertPngSize(`static/visuals/${file}`, 96, 96)
    }
  }
  assertPngSize('static/visuals/venue-marker.png', 128, 128)

  const files = walk(root).filter(file => /\.(vue|js|json)$/.test(file))
  const visualRefPattern = /['"]((?:\/|@\/)?static\/visuals\/[^'"]+\.png)['"]/g
  for (const abs of files) {
    const rel = path.relative(root, abs)
    const source = read(rel)
    for (const match of source.matchAll(visualRefPattern)) {
      const normalized = match[1].replace(/^@\//, '').replace(/^\//, '')
      assert(fs.existsSync(path.join(root, normalized)), `${rel}: visual asset reference is missing: ${match[1]}`)
    }
  }

  assertIncludes('pages/index/index.vue', 'coverImageMode', 'home hero must use default-cover safe display mode')
  assertIncludes('pages/index/index.vue', 'hero-image.default', 'home hero must style default cover separately')
}

checkPagesExist()
checkNavigationTargets()
checkRsvpContract()
checkOwnerGuard()
checkCloudSafety()
checkDataContracts()
checkTemplateSystem()
checkUploadScript()
checkReleaseDocs()
checkVisualAssets()

console.log('release readiness checks passed')
