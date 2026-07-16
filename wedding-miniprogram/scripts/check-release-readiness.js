const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

function readJson(file) {
  return JSON.parse(read(file))
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function assertIncludes(file, text, message) {
  assert(read(file).includes(text), `${file}: ${message}`)
}

function countOccurrences(source, text) {
  return source.split(text).length - 1
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

function listCloudFunctionDirs() {
  const cloudRoot = path.join(root, 'cloudfunctions')
  const directoryNames = fs.readdirSync(cloudRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()

  assertNoDuplicateSuffixedDirs('cloudfunctions source', directoryNames)

  return directoryNames
    .filter(name => fs.existsSync(path.join(cloudRoot, name, 'index.js')))
    .sort()
}

function listBuildCloudFunctionDirs() {
  const cloudRoot = path.join(root, 'dist/build/mp-weixin/cloudfunctions')
  if (!fs.existsSync(cloudRoot)) return null

  return fs.readdirSync(cloudRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()
}

function getCloudbasercFunctionNames(file = 'cloudbaserc.json') {
  const cloudbaserc = readJson(file)
  assert(Array.isArray(cloudbaserc.functions), `${file} must declare deployable functions`)
  const names = cloudbaserc.functions.map(fn => fn.name).filter(Boolean).sort()
  assert(new Set(names).size === names.length, `${file} must not contain duplicate cloud function entries`)
  return names
}

function assertNoDuplicateSuffixedDirs(label, names) {
  const duplicateSuffixedNames = names.filter(name => /\s+\d+$/.test(name))
  assert(!duplicateSuffixedNames.length, `${label} must not contain duplicate-suffixed directories: ${duplicateSuffixedNames.join(', ')}`)
}

function assertNoDuplicateBuildEntries() {
  const buildRoot = path.join(root, 'dist/build/mp-weixin')
  if (!fs.existsSync(buildRoot)) return
  const duplicates = []
  const pending = [buildRoot]
  while (pending.length) {
    const dir = pending.pop()
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name)
      if (/\s+\d+(?=\.|$)/.test(entry.name)) {
        duplicates.push(path.relative(buildRoot, abs))
      }
      if (entry.isDirectory()) pending.push(abs)
    }
  }
  duplicates.sort()
  assert(!duplicates.length, `dist/build/mp-weixin must not contain duplicate-suffixed entries: ${duplicates.join(', ')}`)
}

function assertCloudFunctionSet(label, actualNames, expectedNames) {
  assertNoDuplicateSuffixedDirs(label, actualNames)

  const missing = expectedNames.filter(name => !actualNames.includes(name))
  const extra = actualNames.filter(name => !expectedNames.includes(name))
  assert(
    !missing.length && !extra.length,
    `${label} must match cloudbaserc functions. missing: ${missing.join(', ') || 'none'}; extra: ${extra.join(', ') || 'none'}`
  )
}

function checkRsvpContract() {
  const rsvpPage = read('pages/rsvp/index.vue')
  assert(rsvpPage.includes('rsvp_status'), 'pages/rsvp/index.vue must submit canonical rsvp_status')
  assert(rsvpPage.includes('attending_count'), 'pages/rsvp/index.vue must submit canonical attending_count')
  assert(rsvpPage.includes('diet_preference'), 'pages/rsvp/index.vue must submit canonical diet_preference')
  assert(rsvpPage.includes('relationship'), 'pages/rsvp/index.vue must collect guest relationship')
  assert(rsvpPage.includes('arrival_time'), 'pages/rsvp/index.vue must submit arrival_time for real-world planning')
  assert(rsvpPage.includes('transport_mode'), 'pages/rsvp/index.vue must submit transport_mode for arrival planning')
  assert(rsvpPage.includes('is_current_user'), 'pages/rsvp/index.vue must detect the current guest RSVP returned by getWedding')
  assertIncludes('cloudfunctions/submitRSVP/index.js', 'normalizeRSVP', 'submitRSVP must normalize canonical and legacy RSVP fields')
  assertIncludes('cloudfunctions/submitRSVP/index.js', 'validateRSVP', 'submitRSVP must validate required RSVP fields server-side')
  assertIncludes('cloudfunctions/submitRSVP/index.js', 'companion_note', 'submitRSVP must persist companion notes')
}

function checkOwnerGuard() {
  const source = read('composables/useOwnerGuard.js')
  const workspaceStore = read('stores/owner-workspace.js')
  const managePage = read('pages-owner/manage/index.vue')
  const profilePage = read('pages-owner/profile/index.vue')
  assert(source.includes('ownerActiveWeddingId'), 'useOwnerGuard must check the isolated owner workspace id')
  assert(source.includes('ownerVerified'), 'useOwnerGuard must check owner verification state')
  assert(source.includes('syncWorkspaceProfile'), 'useOwnerGuard must synchronize the authoritative workspace list')
  assert(source.includes('recoverUnavailableWorkspace'), 'useOwnerGuard must recover from deleted or unauthorized active weddings')
  assert(source.includes('forceWorkspaceSync'), 'useOwnerGuard must support an explicit workspace refresh')
  assert(source.includes('reLaunch'), 'useOwnerGuard must redirect users without a usable owner workspace')
  assert(workspaceStore.includes('workspaces.value.some'), 'owner workspace store must reconcile stale active ids')
  assert(managePage.includes('workspaceReady'), 'owner desk must hide actions until the active wedding is verified')
  assert(managePage.includes('forceWorkspaceSync: force'), 'owner desk retry must force workspace reconciliation')
  assert(profilePage.includes('allowNoWedding: true'), 'account page must remain available when the owner has no active wedding')
  assert(profilePage.includes('selectWorkspace(workspace)'), 'account page must let owners switch to another valid wedding workspace')
  assert(profilePage.includes('setOwnerActiveWeddingId(weddingId)'), 'workspace selection must update the isolated owner active id')
  assertIncludes('package.json', 'test:owner-workspace', 'stale workspace recovery must have an executable regression test')
}

function checkPrivacyAuthorizationFlow() {
  const manifest = readJson('manifest.json')
  const weixin = manifest['mp-weixin'] || {}
  const app = read('App.vue')
  const album = read('pages-owner/album/manage.vue')
  const wizard = read('pages-owner/wizard/index.vue')
  const guide = read('pages-owner/guide/edit.vue')
  const privacyPage = read('pages/privacy/index.vue')
  const pickerPath = path.join(root, 'utils', 'albumPicker.js')

  assert(weixin.__usePrivacyCheck__ === true, 'manifest.json must keep WeChat privacy checks enabled')
  assert(JSON.stringify(weixin.requiredPrivateInfos || []) === JSON.stringify(['chooseLocation']), 'manifest.json must declare only the location picker API that the mini program actually uses')
  assert(!weixin.permission?.['scope.userLocation'], 'manifest.json must not request precise current location when getLocation is unused')
  assert(fs.existsSync(pickerPath), 'utils/albumPicker.js must centralize privacy-safe photo selection')
  const picker = fs.readFileSync(pickerPath, 'utf8')
  assert(picker.includes('requirePrivacyAuthorize'), 'shared album picker must request privacy authorization at the point of use')
  assert(picker.includes('wx.chooseImage') && picker.includes('uni.chooseImage') && picker.includes('wx.chooseMedia'), 'shared album picker must fall back across supported WeChat image APIs')
  assert(picker.includes('收集你选中的照片或视频信息'), 'shared album picker must identify the exact WeChat privacy declaration required by image pickers')
  assert(album.includes("from '@/utils/albumPicker.js'"), 'album manager must use the shared privacy-safe image picker')
  assert(wizard.includes("from '@/utils/albumPicker.js'"), 'creation wizard must use the shared privacy-safe image picker')
  assert(guide.includes('收集你选择的位置信息'), 'guide editor must identify the exact WeChat privacy declaration required by chooseLocation')
  assert(privacyPage.includes('不读取宾客当前位置'), 'privacy page must explain that guest navigation does not collect current location')
  assert(privacyPage.includes('相册（仅写入）权限'), 'privacy page must identify the write-only album permission used by poster saving')
  assert(privacyPage.includes('主动点击“保存到相册”'), 'privacy page must tie write-only album access to the explicit poster save action')
  assert(!app.includes('onNeedPrivacyAuthorization'), 'App.vue must not intercept WeChat privacy authorization without a native agreePrivacyAuthorization button')
  assert(!app.includes('checkPrivacySetting()'), 'App.vue must not interrupt every launch with a non-authorizing privacy modal')
}

function checkReleaseDiagnosticsTruthfulness() {
  const source = read('utils/releaseDiagnostics.js')
  const page = read('pages-owner/diagnostics/index.vue')

  assert(source.includes("key: 'platform-privacy'"), 'release diagnostics must track WeChat platform privacy separately')
  assert(source.includes('收集你选中的照片或视频信息'), 'release diagnostics must name the exact WeChat image privacy declaration')
  assert(source.includes('收集你选择的位置信息'), 'release diagnostics must name the exact WeChat location picker privacy declaration')
  assert(source.includes('使用你的相册（仅写入）'), 'release diagnostics must name the exact WeChat write-only album declaration')
  assert(source.includes("key: 'guest-rules'"), 'release diagnostics must keep guest data rules separate from platform privacy')
  assert(source.includes('ready: blockers === 0 && manual === 0'), 'release diagnostics must not claim ready while manual checks remain')
  assert(page.includes('summaryTitle'), 'diagnostics page must derive a truthful release state title')
  assert(page.includes("return '待确认'"), 'diagnostics page must show a pending state for unresolved manual checks')
}

function checkCloudbaseInspectionConfig() {
  const configPath = path.resolve(root, '..', 'config', 'mcporter.json')
  assert(fs.existsSync(configPath), 'config/mcporter.json must expose the project CloudBase inspection entry')
  const source = fs.readFileSync(configPath, 'utf8')
  const config = JSON.parse(source)
  const server = config.mcpServers?.cloudbase || {}

  assert(server.command === 'npx', 'config/mcporter.json must run CloudBase MCP through npx')
  assert((server.args || []).includes('@cloudbase/cloudbase-mcp@latest'), 'config/mcporter.json must use the CloudBase MCP package')
  assert(!/(secretId|secretKey|apiKey|token)\s*[":=]/i.test(source), 'config/mcporter.json must not contain CloudBase credentials')
}

function checkCloudSafety() {
  const weatherSource = stripComments(read('cloudfunctions/getWeather/index.js'))
  assert(!weatherSource.includes('ea363fcdd56742fa84a17c4b11b37bdc'), 'getWeather must not hardcode a production API key')
  assertIncludes('cloudfunctions/submitRSVP/index.js', 'CONTENT_SAFETY_MODE', 'submitRSVP must support configurable content safety fallback')
  assertIncludes('cloudfunctions/submitRSVP/index.js', 'err.errCode === -502005', 'submitRSVP must handle missing guest documents consistently')
  assertIncludes('cloudfunctions/submitBlessing/index.js', 'CONTENT_SAFETY_MODE', 'submitBlessing must support configurable content safety fallback')
  assertIncludes('cloudfunctions/submitBlessing/index.js', 'isDocNotExistError', 'submitBlessing must create missing blessing documents for older weddings')
  assert(!read('cloudfunctions/recordView/index.js').includes('createCollection'), 'recordView hot path must not create or inspect collections')
  assertIncludes('cloudfunctions/recordView/index.js', 'isDocNotExistError(err)', 'recordView must distinguish missing stats docs from transient failures')
  assertIncludes('cloudfunctions/getGuestInvitation/index.js', 'ownRsvp', 'guest endpoint must return only the current guest RSVP')
  assertIncludes('cloudfunctions/getBlessings/index.js', 'nextCursor', 'public blessings must load through a paginated endpoint')
  assertIncludes('composables/useCloud.js', 'recordShare', 'useCloud must expose share tracking')
  assertIncludes('pages/index/index.vue', 'recordShare', 'index share handlers must track shares')
  assertIncludes('cloudfunctions/geocodeVenue/index.js', 'TENCENT_MAP_KEY', 'geocodeVenue must use configurable Tencent Map key')
  assertIncludes('cloudfunctions/geocodeVenue/index.js', 'MISSING_MAP_KEY', 'geocodeVenue must expose a typed missing-key error')
  assertIncludes('cloudfunctions/geocodeVenue/index.js', '5000', 'geocodeVenue must allow enough time for external map requests')
  assertIncludes('composables/useCloud.js', 'geocodeVenue', 'useCloud must expose venue geocoding')
  assertIncludes('cloudfunctions/aiPublishAssistant/index.js', 'owner_openid', 'aiPublishAssistant must verify the owner before calling AI')
  assertIncludes('cloudfunctions/aiPublishAssistant/index.js', 'TASKS', 'aiPublishAssistant must restrict task types')
  assertIncludes('cloudfunctions/aiPublishAssistant/index.js', 'normalizeAiResponse', 'aiPublishAssistant must normalize model output before returning it')
  assertIncludes('cloudfunctions/aiPublishAssistant/package.json', '@cloudbase/node-sdk', 'aiPublishAssistant must use CloudBase Node AI SDK')
  assertIncludes('composables/useCloud.js', 'generateAiSuggestions', 'useCloud must expose AI publish assistant suggestions')
  assert(readJson('cloudfunctions/geocodeVenue/config.json').timeout >= 20, 'geocodeVenue timeout must cover external map requests')
  assert(readJson('cloudfunctions/getWeather/config.json').timeout >= 20, 'getWeather timeout must cover weather and geocoding requests')
  assert(readJson('cloudfunctions/updateWedding/config.json').timeout >= 20, 'updateWedding timeout must cover larger owner-side saves')
  assert(readJson('cloudfunctions/aiPublishAssistant/config.json').permissions && Array.isArray(readJson('cloudfunctions/aiPublishAssistant/config.json').permissions.openapi), 'aiPublishAssistant must declare config permissions')
  assertIncludes('cloudbaserc.json', '"geocodeVenue"', 'cloudbaserc must include geocodeVenue deploy config')
  assertIncludes('cloudbaserc.json', '"generatePoster"', 'cloudbaserc must include generatePoster deploy config')
  assertIncludes('cloudbaserc.json', '"aiPublishAssistant"', 'cloudbaserc must include aiPublishAssistant deploy config')
  assertIncludes('cloudbaserc.json', '"timeout": 20', 'cloudbaserc must keep cloud function timeout deploy config')
}

function checkCloudFunctionDeployConfig() {
  const cloudFunctions = listCloudFunctionDirs()
  assert(cloudFunctions.length === 18, `expected 18 cloud functions, got ${cloudFunctions.length}: ${cloudFunctions.join(', ')}`)

  const cloudbaserc = readJson('cloudbaserc.json')
  assert(cloudbaserc.envId === 'cloud1-d5gqyur7g5a4d3c8d', 'cloudbaserc must target the production CloudBase env')
  assert(cloudbaserc.functionRoot === 'cloudfunctions', 'cloudbaserc must deploy from cloudfunctions root')
  assert(Array.isArray(cloudbaserc.functions), 'cloudbaserc must declare deployable functions')

  const deployNames = getCloudbasercFunctionNames()
  assertCloudFunctionSet('cloudfunctions source', cloudFunctions, deployNames)

  const deployByName = new Map(cloudbaserc.functions.map(fn => [fn.name, fn]))
  for (const name of cloudFunctions) {
    const configPath = `cloudfunctions/${name}/config.json`
    const packagePath = `cloudfunctions/${name}/package.json`
    assert(fs.existsSync(path.join(root, configPath)), `${name}: config.json is required for deployment permissions`)
    assert(fs.existsSync(path.join(root, packagePath)), `${name}: package.json is required for cloud dependency install`)

    const config = readJson(configPath)
    const pkg = readJson(packagePath)
    const deploy = deployByName.get(name)
    assert(config.permissions && Array.isArray(config.permissions.openapi), `${name}: config.json must declare permissions.openapi`)
    assert(pkg.main === 'index.js', `${name}: package main must be index.js`)
    assert(pkg.dependencies && pkg.dependencies['wx-server-sdk'], `${name}: package.json must depend on wx-server-sdk`)
    if (name === 'aiPublishAssistant') {
      assert(pkg.dependencies['@cloudbase/node-sdk'], 'aiPublishAssistant: package.json must depend on @cloudbase/node-sdk')
      assert(Number(deploy.timeout) >= 60, 'aiPublishAssistant: cloudbaserc timeout must cover AI text generation')
    }
    assert(deploy.runtime === 'Nodejs18.15', `${name}: cloudbaserc runtime must be Nodejs18.15`)
    assert(deploy.handler === 'index.main', `${name}: cloudbaserc handler must be index.main`)
    assert(Number(deploy.timeout) >= 10, `${name}: cloudbaserc timeout must be at least 10 seconds`)
    assert(typeof deploy.description === 'string' && deploy.description.length > 0, `${name}: cloudbaserc description is required`)
  }

  const posterOpenapi = readJson('cloudfunctions/generatePoster/config.json').permissions.openapi
  assert(posterOpenapi.includes('wxacode.getUnlimited'), 'generatePoster must declare wxacode.getUnlimited permission')
  for (const name of ['submitRSVP', 'submitBlessing']) {
    const openapi = readJson(`cloudfunctions/${name}/config.json`).permissions.openapi
    assert(openapi.includes('security.msgSecCheck'), `${name} must declare security.msgSecCheck permission`)
  }
}

function checkBuildCloudfunctionsOutputIfPresent() {
  assertNoDuplicateBuildEntries()
  const actualNames = listBuildCloudFunctionDirs()
  if (!actualNames) return

  const expectedNames = getCloudbasercFunctionNames()
  assertCloudFunctionSet('dist/build/mp-weixin/cloudfunctions', actualNames, expectedNames)
  assert(fs.existsSync(path.join(root, 'dist/build/mp-weixin/cloudbaserc.json')), 'dist/build/mp-weixin must include cloudbaserc.json')
  assertCloudFunctionSet('dist/build/mp-weixin/cloudbaserc.json', getCloudbasercFunctionNames('dist/build/mp-weixin/cloudbaserc.json'), expectedNames)
}

function checkDataContracts() {
  assertIncludes('stores/wedding.js', 'cachedWeddingId', 'wedding store must bind cache to the current weddingId')
  assertIncludes('stores/wedding.js', 'isCacheValidFor', 'wedding store must expose weddingId-aware cache validation')
  assertIncludes('stores/wedding.js', 'normalizeListDocument', 'wedding store must normalize legacy nested list documents')
  assertIncludes('stores/wedding.js', 'activeTemplate', 'wedding store must expose the active visual template')
  assertIncludes('composables/useCloud.js', 'isCacheValidFor(weddingId)', 'fetchWedding must not reuse cache across weddingId values')
  assertIncludes('cloudfunctions/updateWedding/index.js', 'const updateData = { ...normalizedData, updated_at: Date.now() }', 'updateWedding must write normalized root objects for all editable collections')
  assertIncludes('cloudfunctions/updateWedding/index.js', "'invitations'", 'updateWedding must allow invitation edits without nested wrappers')
  assertIncludes('cloudfunctions/updateWedding/index.js', "'weddings'", 'updateWedding must allow wedding edits without nested wrappers')
  assertIncludes('cloudfunctions/updateWedding/index.js', "'guests'", 'updateWedding must persist guests without nested wrappers')
  assertIncludes('cloudfunctions/updateWedding/index.js', "'blessings'", 'updateWedding must persist blessings without nested wrappers')
  assertIncludes('cloudfunctions/updateWedding/index.js', 'isDocNotExistError', 'updateWedding must create missing related documents for older weddings')
  assertIncludes('cloudfunctions/createWedding/index.js', "'viewers'", 'createWedding must create the viewers collection used by view tracking')
  assert(!read('cloudfunctions/recordView/index.js').includes('ensureCollection'), 'recordView must assume deployment-provisioned collections on the hot path')
  assertIncludes('composables/useCloud.js', 'fetchGuestInvitation', 'guest pages must use the public lightweight invitation endpoint')
  assertIncludes('stores/guest-invitation.js', 'GUEST_INVITATION_STATUS', 'guest invitation store must expose explicit loading states')
  assertIncludes('cloudfunctions/getWedding/index.js', 'normalizeListDocument', 'getWedding must normalize legacy nested list documents')
  assertIncludes('cloudfunctions/getWedding/index.js', 'is_current_user', 'getWedding must mark the current guest RSVP without exposing other guests')
  assertIncludes('cloudfunctions/getStats/index.js', 'normalizeListDocument', 'getStats must normalize legacy nested list documents')
  assertIncludes('cloudfunctions/getRSVPStats/index.js', 'normalizeListDocument', 'getRSVPStats must normalize legacy nested guest documents')
  assertIncludes('cloudfunctions/generatePoster/index.js', 'WXACODE_ENV_VERSION', 'generatePoster must support configurable wxacode env version')
  assertIncludes('pages/index/index.vue', 'parseWeddingIdFromOptions', 'home page must read ids opened from wxacode scene')
  assert(fs.existsSync(path.join(root, 'cloudfunctions/deleteWedding/index.js')), 'deleteWedding cloud function must exist')
  assertIncludes('cloudfunctions/deleteWedding/index.js', 'owner_openid', 'deleteWedding must verify owner before deleting data')
  assertIncludes('cloudfunctions/deleteWedding/index.js', 'removeByWeddingId', 'deleteWedding must remove wedding-scoped viewer records')
  assertIncludes('composables/useCloud.js', 'deleteWedding', 'useCloud must expose deleteWedding')
  assertIncludes('pages-owner/manage/index.vue', 'confirmDeleteWedding', 'manage page must expose delete confirmation flow')
  assertIncludes('pages-owner/manage/index.vue', 'danger-zone', 'manage page must render a distinct danger zone')
}

function checkTemplateSystem() {
  const pagesJson = readJson('pages.json')
  assert(pagesJson.globalStyle.navigationBarBackgroundColor === '#F7F2E9', 'pages.json: global navigation bar must use paper background')
  assert(pagesJson.globalStyle.backgroundColor === '#F7F2E9', 'pages.json: global page background must use paper background')
  assert(pagesJson.tabBar.selectedColor === '#8A3B45', 'pages.json: tabBar selected color must use free wine accent')

  for (const component of ['t-eyebrow', 't-section-title', 't-card', 't-photo', 't-seal', 't-btn', 't-field', 't-divider']) {
    assert(fs.existsSync(path.join(root, 'components', component, `${component}.vue`)), `components/${component}/${component}.vue must exist for v2 token migration`)
  }

  const templateSource = read('utils/templates.js')
  assert(!templateSource.includes('return [template.className'), 'getTemplateClass must not emit legacy tpl-* classes at runtime')

  const legacyTemplateThemePattern = /\.theme-(?:rose|champagne|noir|garden|heritage|shandong|travel)\b/
  const legacyTemplateClassPattern = /\.tpl-(?:rose|champagne|noir|garden)\b/
  const vueHexColorPattern = /#[0-9a-fA-F]{3,8}\b/
  for (const abs of walk(root).filter(file => file.endsWith('.vue'))) {
    const rel = path.relative(root, abs)
    const source = read(rel)
    assert(!legacyTemplateThemePattern.test(source), `${rel}: Vue styles must not keep legacy template theme aliases`)
    assert(!legacyTemplateClassPattern.test(source), `${rel}: Vue styles must not keep legacy tpl-* template classes`)
    assert(!vueHexColorPattern.test(source), `${rel}: Vue files must not contain hardcoded hex colors`)
  }

  assertIncludes('utils/templates.js', 'rose-couture', 'templates must include rose couture as the default direction')
  assertIncludes('utils/templates.js', 'champagne-editorial', 'templates must include champagne editorial')
  assertIncludes('utils/templates.js', 'noir-banquet', 'templates must include noir banquet')
  assertIncludes('utils/templates.js', 'garden-film', 'templates must include garden film')
  assertIncludes('utils/templates.js', 'themeClass', 'templates must expose a theme class beyond the legacy tpl class')
  assertIncludes('utils/templates.js', 'TEMPLATE_HERO_IMAGES', 'scenarios must expose a remote hero image map')
  assertIncludes('utils/templates.js', 'LOCAL_PAPER_FALLBACK', 'scenarios must keep one local paper fallback')
  assertIncludes('utils/templates.js', 'defaultHero', 'scenarios must resolve a hero image with a safe fallback')
  assertIncludes('utils/templates.js', 'getTemplateHeroImage', 'templates must expose a reusable hero image resolver')
  assertIncludes('utils/templates.js', 'getTemplatePosterTheme', 'templates must expose poster colors for template-aligned sharing')
  assertIncludes('utils/templates.js', 'buildTemplatePreviewData', 'templates must provide filled mock data for full previews')
  assertIncludes('styles/theme.scss', '--theme-hero-overlay', 'runtime theme variables must include template hero overlays')
  assertIncludes('styles/theme.scss', '--theme-default-cover-opacity', 'runtime theme variables must tune default cover opacity by template')
  assertIncludes('styles/theme.scss', '--theme-hero-filter: none', 'runtime theme variables must not filter photos by default')
  assertIncludes('uni.scss', '$photo-matte', 'design tokens must define photo paper matte')
  assertIncludes('uni.scss', '@mixin photo-mount', 'design tokens must define mounted photo treatment')
  assertIncludes('uni.scss', '@mixin photo-hero-scrim', 'design tokens must define paper hero photo scrim')
  assertIncludes('utils/legacy-theme-map.js', 'LEGACY_THEME_MAP', 'theme resolver must preserve old theme keys during migration')
  assertIncludes('utils/templates.js', "theme: 'wine'", 'templates must bind to the default free wine mood')
  assertIncludes('pages-owner/wizard/index.vue', '具名', 'wizard must start with named couple and date')
  assertIncludes('pages-owner/wizard/index.vue', '择地', 'wizard must collect venue before creation')
  assertIncludes('pages-owner/wizard/index.vue', '选照', 'wizard must include photo selection as the third act')
  assertIncludes('pages-owner/wizard/index.vue', '定色', 'wizard must end with mood color selection')
  assertIncludes('pages-owner/wizard/index.vue', 'MAX_ALBUM_PHOTOS = 9', 'wizard must limit curated photos to nine')
  assertIncludes('pages-owner/wizard/index.vue', 'chooseWizardImages', 'wizard must let owners pick photos inline')
  assertIncludes('pages-owner/wizard/index.vue', '@include photo-mount', 'wizard photo preview must use the mounted photo system')
  assertIncludes('pages-owner/wizard/index.vue', '@include photo-hero-scrim', 'wizard hero preview must show the paper scrim')
  assertIncludes('pages-owner/wizard/index.vue', 'persistWizardPhotos', 'wizard must persist selected photos after creation')
  assertIncludes('pages-owner/wizard/index.vue', "updateWedding(weddingId, 'albums'", 'wizard must write uploaded photos into albums')
  assertIncludes('pages-owner/wizard/index.vue', 'scenario_preset: tpl.id', 'wizard must persist scenario content independently')
  assertIncludes('pages-owner/wizard/index.vue', 'visual_preset: resolveVisualPreset', 'wizard must persist visual storytelling independently')
  assertIncludes('pages-owner/wizard/index.vue', 'theme,', 'wizard must persist mood color independently')
  assertIncludes('pages-owner/wizard/index.vue', 'canUseTheme', 'wizard mood switching must check theme entitlements')
  assertIncludes('pages-owner/wizard/index.vue', 'getThemeTokens', 'wizard native mood swatches must use resolved theme tokens')
  assertIncludes('pages-owner/invitation/edit.vue', 'WEDDING_SCENARIOS', 'invitation editor must use content-only scenario definitions')
  assertIncludes('pages-owner/invitation/edit.vue', 'previewTemplate', 'invitation editor must preview the currently selected template before saving')
  assertIncludes('pages-owner/invitation/edit.vue', 'photoToneOptions', 'invitation editor must expose opt-in photo tone controls')
  assertIncludes('pages-owner/invitation/edit.vue', 'photo_treatment', 'invitation editor must persist opt-in photo tone controls')
  assertIncludes('pages-owner/template/preview.vue', 'buildTemplatePreviewData', 'template preview page must render mock wedding data')
  assertIncludes('pages-owner/template/preview.vue', 'previewHeroImage', 'template preview page must render the template hero image')
  assertIncludes('pages-owner/template/preview.vue', 'RSVP CARD', 'template preview page must show RSVP mock state')
  assertIncludes('pages-owner/template/preview.vue', '祝福墙', 'template preview page must show blessing wall mock state')
  assertIncludes('pages-owner/template/preview.vue', 'selectedVisual.kicker', 'template preview home must match the selected visual story cover')
  assertIncludes('pages-owner/template/preview.vue', 'DETAILS', 'template preview home must show the details chapter instead of dashboard widgets')
  assert(!read('pages-owner/template/preview.vue').includes('GUEST PACK'), 'pages-owner/template/preview.vue: template preview home must not show the old guest action dashboard')
  assertIncludes('pages-owner/invitation/edit.vue', 'applyTemplatePreset', 'invitation editor must expose built-in template preset copy')
  assertIncludes('pages/index/index.vue', 'templateClass', 'home page must apply template styling')
  assert(!read('pages/index/index.vue').includes('getTemplateHeroImage'), 'home page must never use a fictitious template photo when guest data is missing')
  assertIncludes('pages/index/index.vue', '--theme-hero-overlay', 'home page must use template-aware hero image overlays')
  assertIncludes('pages/index/index.vue', "const coverImageMode = computed(() => 'aspectFill')", 'home page must fill narrow default covers without visible side bars')
  assertIncludes('pages/guide/index.vue', '--theme-panel-gradient', 'guide page must use template-aware panel colors')
  assertIncludes('pages/timeline/index.vue', '--theme-accent', 'timeline page must use template accent colors')
  assertIncludes('pages/rsvp/index.vue', 'rsvp-brief', 'RSVP page must show a template-aware wedding brief')
  assertIncludes('pages/album/index.vue', '精选影像 · 银盐相册', 'album page must use guest-facing album copy')
  assert(!read('pages/album/index.vue').includes('photoMood'), 'pages/album/index.vue: guest album must not leak owner upload guidance')
  assertIncludes('pages/album/index.vue', 'MAX_ALBUM_PHOTOS = 9', 'album page must present a curated nine-photo story')
  assertIncludes('pages/album/index.vue', 'photoTreatmentClass', 'album page must keep photo tone opt-in')
  assertIncludes('utils/posterCanvas.js', 'getTemplatePosterTheme', 'poster canvas must draw with the active template palette')
  assertIncludes('utils/posterCanvas.js', 'getTemplateHeroImage', 'poster canvas must use template hero images when no album cover exists')
  assertIncludes('pages-owner/album/manage.vue', 'chooseAlbumImages', 'album manager must handle modern WeChat image selection')
  assertIncludes('pages-owner/wizard/index.vue', 'chooseAlbumImages', 'creation wizard must share the hardened album picker')
  assertIncludes('pages-owner/album/manage.vue', 'MAX_ALBUM_PHOTOS = 9', 'album manager must cap the curated photo set at nine')
  assertIncludes('pages-owner/album/manage.vue', 'remainingPhotoSlots', 'album manager must enforce remaining curated photo slots')
  assertIncludes('utils/albumPicker.js', 'extractAlbumImagePaths', 'shared album picker must normalize image paths from tempFilePaths and tempFiles')
  assertIncludes('pages-owner/album/manage.vue', 'buildAlbumCloudPath', 'album manager must upload into wedding-scoped cloud paths')
  assertIncludes('pages-owner/album/manage.vue', 'fetchWedding(userStore.weddingId, true)', 'album manager must force-refresh cloud data on entry')
  assertIncludes('pages-owner/album/manage.vue', 'previousAlbum', 'album manager must rollback local album state when cloud save fails')
  assertIncludes('pages-owner/album/manage.vue', 'deleteUploadedPhotos', 'album manager must clean uploaded files after failed album saves')
  assertIncludes('pages-owner/album/manage.vue', 'saveAlbumData', 'album manager must await cloud persistence before showing success')
  assertIncludes('composables/useCloud.js', "getCloudApi('uploadFile')", 'uploadFile must use the shared CloudBase API resolver')
  assertIncludes('composables/useCloud.js', "const target = wxCloud?.init", 'cloud init must prefer native wx.cloud when available')
  assertIncludes('composables/useCloud.js', 'Promise.resolve(pending).catch', 'cloud init must observe asynchronous SDK failures')
  assertIncludes('composables/useCloud.js', 'cloudApi.callFunction({ name, data })', 'cloud functions must use the SDK Promise form')
  assert(!read('composables/useCloud.js').includes('success: res =>'), 'cloud function calls must not mix callbacks with the SDK Promise')
  assert(!read('App.vue').includes('initCloud()'), 'App.vue: cloud initialization must stay lazy until the first real cloud operation')
  assertIncludes('App.vue', 'if (!isDevToolsRuntime()) checkUpdate()', 'App.vue: DevTools must not start a pointless update-manager request')
  assertIncludes('composables/useCloud.js', 'deleteFiles', 'useCloud must expose cloud storage cleanup for failed album transactions')
  assertIncludes('utils/albumPicker.js', 'requirePrivacyAuthorize', 'shared album picker must trigger WeChat privacy authorization only when uploading')
  assertIncludes('pages/guide/index.vue', 'snow', 'guide weather icons must handle weather types returned by getWeather')
  assertIncludes('pages/guide/index.vue', 'geocodedVenues', 'guide map must only render venues with real coordinates')
  assertIncludes('pages/guide/index.vue', 'height: 420rpx', 'guide map must have a stable explicit native map height')
  assertIncludes('pages/guide/index.vue', 'mapReady', 'guide map must expose an empty state when venues are not geocoded')
  assertIncludes('pages/guide/index.vue', 'weatherError', 'guide page must show weather failure reasons')
  assertIncludes('pages-owner/guide/edit.vue', 'autoMatchLocation', 'owner guide editor must auto-match venue coordinates')
  assertIncludes('pages-owner/guide/edit.vue', 'chooseVenueLocation', 'owner guide editor must allow manual map point selection')
  assertIncludes('pages-owner/guide/edit.vue', 'applyManualCoordinate', 'owner guide editor must allow manual coordinate fallback')
  assertIncludes('pages-owner/guide/edit.vue', 'confirmMapFallback', 'owner guide editor must surface geocoding failures instead of silently saving')
  assertIncludes('pages-owner/guide/edit.vue', 'formatGeocodeError', 'owner guide editor must avoid exposing raw cloud env errors')
  assertIncludes('pages-owner/guide/edit.vue', 'cloneVenues', 'owner guide editor must rollback venue state when cloud save fails')
  for (const file of ['pages-owner/guests/manage.vue', 'pages-owner/blessing/manage.vue', 'pages-owner/timeline/edit.vue']) {
    assertIncludes(file, 'fetchWedding(userStore.weddingId, true)', `${file} must force-refresh cloud data on entry`)
    assertIncludes(file, 'await saveToStorage()', `${file} must await cloud persistence before success feedback`)
    assertIncludes(file, 'clone', `${file} must keep a rollback snapshot for failed saves`)
  }
  assert(!read('pages/index/index.vue').includes('<view class="preview-header">'), 'home page must not render app-style preview widgets')
  assertIncludes('cloudfunctions/getWeather/index.js', 'geocodeVenue', 'getWeather must geocode venue fallback when coordinates are missing')
  assertIncludes('cloudfunctions/getWeather/index.js', 'QWEATHER_KEY', 'getWeather must support common weather key env aliases')
  assertIncludes('utils/posterCanvas.js', 'resolveImagePath', 'poster canvas must resolve cloud and base64 images before drawing')
  assertIncludes('utils/imagePaths.js', 'data:image/', 'image path helper must support base64 wxacode images')
  assertIncludes('utils/imagePaths.js', 'cloud://', 'image path helper must support cloud storage images')
  assertIncludes('pages-owner/share/index.vue', 'refreshQrCode', 'share page must render real wxacode generation status')
  assertIncludes('pages-owner/share/index.vue', 'publish-pack', 'share page must show a publish package preview')
  assertIncludes('utils/posterCanvas.js', 'poster_line', 'poster canvas must render the saved AI poster line when available')
}

function checkAiPublishAssistant() {
  assertIncludes('components/ui/AiSuggestionPanel.vue', 'AI ASSISTANT', 'AI suggestion panel must use the shared owner-side candidate UI')
  assertIncludes('pages-owner/invitation/edit.vue', "generateAiSuggestions('invitation_copy'", 'invitation editor must use AI suggestions for copy only')
  assertIncludes('pages-owner/invitation/edit.vue', 'aiToneOptions', 'invitation editor must expose AI tone choices')
  assertIncludes('pages-owner/share/index.vue', "generateAiSuggestions('share_card'", 'share page must use AI suggestions for share card candidates')
  assertIncludes('pages-owner/timeline/edit.vue', "generateAiSuggestions('timeline_pack'", 'timeline editor must use AI suggestions for timeline packs')
  assertIncludes('pages-owner/guide/edit.vue', "generateAiSuggestions('guide_tips'", 'guide editor must use AI suggestions for route tips')
  assertIncludes('pages-owner/diagnostics/index.vue', "generateAiSuggestions('diagnostics_advice'", 'diagnostics page must use AI suggestions for next steps')
  assertIncludes('utils/releaseDiagnostics.js', 'AI 发布助手', 'release diagnostics must remind owners to verify AI true-cloud readiness')
  assertIncludes('pages-owner/stats/index.vue', 'opsSummaryTitle', 'stats page must provide an RSVP operations summary')
}

function checkCommercializationFoundations() {
  const routes = new Set(collectVueRoutes())
  assert(routes.has('pages-owner/profile/index'), 'pages.json must register owner profile and entitlements page')
  assert(routes.has('pages-owner/diagnostics/index'), 'pages.json must register release diagnostics page')
  assert(fs.existsSync(path.join(root, 'utils/commercial.js')), 'commercial config helper must exist')
  assertIncludes('utils/commercial.js', 'PLAN_TIERS', 'commercial helper must define plan tiers')
  assertIncludes('utils/commercial.js', 'DEFAULT_ENTITLEMENTS', 'commercial helper must define default entitlements')
  assertIncludes('utils/commercial.js', 'buildThemeCommercialState', 'commercial helper must build theme billing state')
  assertIncludes('utils/templates.js', "themeTier('cinnabar')", 'templates must derive premium candidates from non-wine mood colors')
  assertIncludes('utils/templates.js', 'premium_templates', 'templates must bind premium moods to entitlement keys')
  assertIncludes('utils/commercial.js', 'isPremiumTheme', 'commercial helper must use theme premium rules')
  assertIncludes('pages-owner/wizard/index.vue', 'moodOptions', 'wizard must expose mood color choices and premium state')
  assertIncludes('pages-owner/wizard/index.vue', 'buildThemeCommercialState', 'wizard must persist theme commercial state')
  assertIncludes('pages-owner/invitation/edit.vue', 'scenarioPreset', 'invitation editor must persist scenario preset independently')
  assertIncludes('pages-owner/invitation/edit.vue', 'buildThemeCommercialState', 'invitation editor must persist theme commercial state')
  assertIncludes('cloudfunctions/syncOwnerProfile/index.js', 'owners', 'syncOwnerProfile must persist owner profiles')
  assertIncludes('cloudfunctions/syncOwnerProfile/index.js', 'workspaces', 'syncOwnerProfile must return wedding workspaces')
  assertIncludes('cloudfunctions/syncOwnerProfile/index.js', 'entitlements', 'syncOwnerProfile must return commercial entitlements')
  assertIncludes('cloudfunctions/createWedding/index.js', 'owner_profile_id', 'createWedding must link weddings to owner profiles')
  assertIncludes('stores/user.js', 'setOwnerProfile', 'user store must persist owner profile sync results')
  assertIncludes('stores/user.js', 'workspaces', 'user store must track owner workspaces')
  assertIncludes('composables/useCloud.js', 'syncOwnerProfile', 'useCloud must expose owner profile sync')
  assertIncludes('utils/releaseDiagnostics.js', 'buildReleaseDiagnostics', 'release diagnostics helper must exist')
  assertIncludes('utils/releaseDiagnostics.js', 'TENCENT_MAP_KEY', 'diagnostics must remind about cloud map key readiness')
  assertIncludes('pages-owner/diagnostics/index.vue', 'buildReleaseDiagnostics', 'diagnostics page must render release readiness')
  assertIncludes('pages-owner/profile/index.vue', 'ENTITLEMENT_LABELS', 'profile page must render entitlement boundaries')
  assertIncludes('pages-owner/manage/index.vue', "goTo('diagnostics/index')", 'manage page must link to release diagnostics')
  assertIncludes('pages-owner/manage/index.vue', "goTo('profile/index')", 'manage page must link to account and entitlements')
}

function checkUploadScript() {
  const source = read('upload.mjs')
  assert(source.includes('WECHAT_DEVTOOLS_CLI_PATH'), 'upload script must allow overriding WeChat DevTools CLI path')
  assert(source.includes('MINIPROGRAM_PROJECT_PATH'), 'upload script must allow overriding project path')
  assert(source.includes('manifest.versionName'), 'upload script must use manifest versionName for miniprogram releases')
  assert(source.includes('pkg.version'), 'upload script must keep package.json version as a fallback')
  assert(source.indexOf('manifest.versionName') < source.indexOf('pkg.version'), 'upload script must prefer manifest versionName before package.json version')
  assert(source.includes('cliPath'), 'upload script must use the WeChat DevTools CLI')
  assert(!source.includes('/Users/kdnsna/Desktop'), 'upload script must not hardcode local private key paths')
  assert(!source.includes('/Users/kdnsna/Documents/06-项目代码'), 'upload script must not hardcode local build paths')

  const ciSource = read('upload-ci.mjs')
  assert(ciSource.includes('MINIPROGRAM_PRIVATE_KEY_PATH'), 'miniprogram-ci upload script must read private key path from env')
  assert(ciSource.includes('MINIPROGRAM_PROJECT_PATH'), 'miniprogram-ci upload script must allow overriding project path')
  assert(ciSource.includes('MINIPROGRAM_VERSION'), 'miniprogram-ci upload script must allow overriding version')
  assert(ciSource.includes('manifest.versionName'), 'miniprogram-ci upload script must use manifest versionName')
  assert(ciSource.includes('await import(\'miniprogram-ci\')'), 'miniprogram-ci upload script must load miniprogram-ci with a helpful missing-dependency error')
  assert(!ciSource.includes('Desktop/private'), 'miniprogram-ci upload script must not hardcode local private key paths')
  assert(!ciSource.includes('/Users/kdnsna'), 'miniprogram-ci upload script must not hardcode local user paths')
  assertIncludes('package.json', 'upload:mp-weixin', 'package scripts must expose the miniprogram upload command')
  assertIncludes('package.json', 'postbuild:mp-weixin', 'package scripts must copy cloudfunctions into the WeChat build output')
  assert(fs.existsSync(path.join(root, 'scripts/copy-cloudfunctions-to-dist.js')), 'cloud function copy script must exist')
  assertIncludes('scripts/copy-cloudfunctions-to-dist.js', 'cloudbaserc.json', 'cloud function copy script must copy cloudbaserc into build output')

  const readme = read('README.md')
  assertIncludes('README.md', 'WECHAT_DEVTOOLS_CLI_PATH', 'README must document WeChat DevTools CLI upload configuration')
  assertIncludes('README.md', 'node upload-ci.mjs', 'README must document miniprogram-ci as the private-key upload path')
  assert(!/MINIPROGRAM_PRIVATE_KEY_PATH=[^\n]+npm run upload:mp-weixin/.test(readme), 'README must not imply DevTools CLI upload requires a private key')
}

function checkReleaseDocs() {
  assert(fs.existsSync(path.join(root, '.nvmrc')), '.nvmrc must pin the preferred Node LTS version')
  assert(fs.existsSync(path.join(root, 'RELEASE-AUDIT.md')), 'RELEASE-AUDIT.md must document the pre-launch full audit')
  const audit = read('RELEASE-AUDIT.md')
  assert(audit.includes('18 个云函数'), 'RELEASE-AUDIT.md must cover all 18 cloud functions')
  assert(audit.includes('真云必验清单'), 'RELEASE-AUDIT.md must include true-cloud manual verification steps')
  const readme = read('README.md')
  assert(readme.includes('Node.js 20 LTS'), 'README must document Node.js 20 LTS')
  assert(readme.includes('发布前检查清单'), 'README must include a release checklist')
  assert(readme.includes('RELEASE-AUDIT.md'), 'README must link the pre-launch full audit')
  assert(readme.includes('P2 大众化/商业化'), 'README must document P2 commercialization foundations')
  assert(readme.includes('场景方案原图'), 'README must document remote scenario hero assets')
  assert(readme.includes('syncOwnerProfile'), 'README must document owner profile sync deployment')
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

function readJpegSize(file) {
  const abs = path.join(root, file)
  assert(fs.existsSync(abs), `visual asset is missing: ${file}`)
  const buf = fs.readFileSync(abs)
  assert(buf[0] === 0xFF && buf[1] === 0xD8, `${file}: must be a JPEG image`)

  let offset = 2
  while (offset < buf.length - 9) {
    if (buf[offset] !== 0xFF) {
      offset += 1
      continue
    }
    const marker = buf[offset + 1]
    const length = buf.readUInt16BE(offset + 2)
    if (marker >= 0xC0 && marker <= 0xC3) {
      return {
        height: buf.readUInt16BE(offset + 5),
        width: buf.readUInt16BE(offset + 7)
      }
    }
    offset += 2 + length
  }
  throw new Error(`${file}: could not read JPEG dimensions`)
}

function assertJpegSize(file, width, height) {
  const size = readJpegSize(file)
  assert(size.width === width && size.height === height, `${file}: expected ${width}x${height}, got ${size.width}x${size.height}`)
}

function readSvg(file, viewBox) {
  const abs = path.join(root, file)
  assert(fs.existsSync(abs), `vector asset is missing: ${file}`)
  const source = fs.readFileSync(abs, 'utf8')
  assert(source.includes('<svg') && source.includes(`viewBox="${viewBox}"`), `${file}: must be an SVG vector asset with viewBox ${viewBox}`)
  assert(!source.includes('<rect width="96" height="96"'), `${file}: must not include a square background plate`)
  return source
}

function checkVisualAssets() {
  assertPngSize('static/visuals/default-cover.png', 640, 1349)

  const expectedHeroImages = [
    ['hero-signature-rose.jpg', 1332],
    ['hero-champagne-editorial.jpg', 1334],
    ['hero-noir-banquet.jpg', 1334],
    ['hero-garden-film.jpg', 1334],
    ['hero-heritage-ritual.jpg', 1334],
    ['hero-shandong-family.jpg', 1334],
    ['hero-travel-friendly.jpg', 1334]
  ]
  for (const [file, height] of expectedHeroImages) {
    assertJpegSize(`../assets/scenario-heroes/${file}`, 750, height)
  }

  const visualsDir = path.join(root, 'static/visuals')
  const visualFiles = fs.readdirSync(visualsDir).filter(name => name.endsWith('.png'))
  for (const file of visualFiles) {
    assert(!file.startsWith('empty-'), `static/visuals/${file}: empty states must be SVG, not PNG`)
    assert(!file.startsWith('icon-'), `static/visuals/${file}: functional icons must be SVG, not square PNG`)
  }
  assertPngSize('static/visuals/venue-marker.png', 128, 128)

  const svgIcons = fs.readdirSync(visualsDir).filter(name => name.startsWith('icon-') && name.endsWith('.svg'))
  assert(svgIcons.length >= 28, `expected at least 28 SVG functional icons, got ${svgIcons.length}`)
  for (const file of svgIcons) {
    readSvg(`static/visuals/${file}`, '0 0 96 96')
  }

  const svgEmptyAssets = fs.readdirSync(visualsDir).filter(name => name.startsWith('empty-') && name.endsWith('.svg'))
  assert(svgEmptyAssets.length >= 11, `expected at least 11 SVG empty illustrations, got ${svgEmptyAssets.length}`)
  for (const file of svgEmptyAssets) {
    readSvg(`static/visuals/${file}`, '0 0 220 220')
  }

  const files = walk(root).filter(file => /\.(vue|js|json)$/.test(file))
  const visualRefPattern = /['"]((?:\/|@\/)?static\/visuals\/[^'"]+\.(?:png|svg|jpe?g))['"]/g
  for (const abs of files) {
    const rel = path.relative(root, abs)
    const source = read(rel)
    for (const match of source.matchAll(visualRefPattern)) {
      const normalized = match[1].replace(/^@\//, '').replace(/^\//, '')
      assert(fs.existsSync(path.join(root, normalized)), `${rel}: visual asset reference is missing: ${match[1]}`)
    }
  }
  const legacyIconPngPattern = new RegExp('static/visuals/' + '(?:icon|empty)-[^\\\'"]+\\.png')
  for (const abs of files) {
    const rel = path.relative(root, abs)
    assert(!legacyIconPngPattern.test(read(rel)), `${rel}: icon and empty-state references must use SVG`)
  }

  assertIncludes('pages/index/index.vue', 'coverImageMode', 'home hero must use a stable full-bleed image mode')
  assertIncludes('pages/index/index.vue', 'lux-hero-overlay.default', 'home hero must soften the default cover overlay separately')
}

checkPagesExist()
checkNavigationTargets()
checkRsvpContract()
checkOwnerGuard()
checkPrivacyAuthorizationFlow()
checkReleaseDiagnosticsTruthfulness()
checkCloudbaseInspectionConfig()
checkCloudSafety()
checkCloudFunctionDeployConfig()
checkBuildCloudfunctionsOutputIfPresent()
checkDataContracts()
checkTemplateSystem()
checkAiPublishAssistant()
checkCommercializationFoundations()
checkUploadScript()
checkReleaseDocs()
checkVisualAssets()

console.log('release readiness checks passed')
