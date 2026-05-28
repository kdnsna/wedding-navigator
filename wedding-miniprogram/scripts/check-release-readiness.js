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
  return fs.readdirSync(cloudRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && fs.existsSync(path.join(cloudRoot, entry.name, 'index.js')))
    .map(entry => entry.name)
    .sort()
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
  assert(source.includes('weddingId'), 'useOwnerGuard must check current weddingId')
  assert(source.includes('ownerVerified'), 'useOwnerGuard must check owner verification state')
  assert(source.includes('navigateTo'), 'useOwnerGuard must redirect users without owner access')
}

function checkCloudSafety() {
  const weatherSource = stripComments(read('cloudfunctions/getWeather/index.js'))
  assert(!weatherSource.includes('ea363fcdd56742fa84a17c4b11b37bdc'), 'getWeather must not hardcode a production API key')
  assertIncludes('cloudfunctions/submitRSVP/index.js', 'CONTENT_SAFETY_MODE', 'submitRSVP must support configurable content safety fallback')
  assertIncludes('cloudfunctions/submitRSVP/index.js', 'err.errCode === -502005', 'submitRSVP must handle missing guest documents consistently')
  assertIncludes('cloudfunctions/submitBlessing/index.js', 'CONTENT_SAFETY_MODE', 'submitBlessing must support configurable content safety fallback')
  assertIncludes('cloudfunctions/submitBlessing/index.js', 'isDocNotExistError', 'submitBlessing must create missing blessing documents for older weddings')
  assertIncludes('cloudfunctions/recordView/index.js', 'ensureStatsDocument', 'recordView must initialize missing stats documents')
  assertIncludes('cloudfunctions/recordView/index.js', 'isDocNotExistError(err)', 'recordView must distinguish missing stats docs from transient failures')
  assertIncludes('composables/useCloud.js', 'recordShare', 'useCloud must expose share tracking')
  assertIncludes('pages/index/index.vue', 'recordShare', 'index share handlers must track shares')
  assertIncludes('cloudfunctions/geocodeVenue/index.js', 'TENCENT_MAP_KEY', 'geocodeVenue must use configurable Tencent Map key')
  assertIncludes('cloudfunctions/geocodeVenue/index.js', 'MISSING_MAP_KEY', 'geocodeVenue must expose a typed missing-key error')
  assertIncludes('cloudfunctions/geocodeVenue/index.js', '5000', 'geocodeVenue must allow enough time for external map requests')
  assertIncludes('composables/useCloud.js', 'geocodeVenue', 'useCloud must expose venue geocoding')
  assert(readJson('cloudfunctions/geocodeVenue/config.json').timeout >= 20, 'geocodeVenue timeout must cover external map requests')
  assert(readJson('cloudfunctions/getWeather/config.json').timeout >= 20, 'getWeather timeout must cover weather and geocoding requests')
  assert(readJson('cloudfunctions/updateWedding/config.json').timeout >= 20, 'updateWedding timeout must cover larger owner-side saves')
  assertIncludes('cloudbaserc.json', '"geocodeVenue"', 'cloudbaserc must include geocodeVenue deploy config')
  assertIncludes('cloudbaserc.json', '"generatePoster"', 'cloudbaserc must include generatePoster deploy config')
  assertIncludes('cloudbaserc.json', '"timeout": 20', 'cloudbaserc must keep cloud function timeout deploy config')
}

function checkCloudFunctionDeployConfig() {
  const cloudFunctions = listCloudFunctionDirs()
  assert(cloudFunctions.length === 15, `expected 15 cloud functions, got ${cloudFunctions.length}: ${cloudFunctions.join(', ')}`)

  const cloudbaserc = readJson('cloudbaserc.json')
  assert(cloudbaserc.envId === 'cloud1-d5gqyur7g5a4d3c8d', 'cloudbaserc must target the production CloudBase env')
  assert(cloudbaserc.functionRoot === 'cloudfunctions', 'cloudbaserc must deploy from cloudfunctions root')
  assert(Array.isArray(cloudbaserc.functions), 'cloudbaserc must declare deployable functions')

  const deployNames = cloudbaserc.functions.map(fn => fn.name).sort()
  assert(new Set(deployNames).size === deployNames.length, 'cloudbaserc must not contain duplicate cloud function entries')
  assert(JSON.stringify(deployNames) === JSON.stringify(cloudFunctions), `cloudbaserc must include every cloud function. expected ${cloudFunctions.join(', ')}, got ${deployNames.join(', ')}`)

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
    assert(deploy.runtime === 'Nodejs16.13', `${name}: cloudbaserc runtime must be Nodejs16.13`)
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
  assertIncludes('cloudfunctions/getWedding/index.js', 'is_current_user', 'getWedding must mark the current guest RSVP without exposing other guests')
  assertIncludes('cloudfunctions/getStats/index.js', 'normalizeListDocument', 'getStats must normalize legacy nested list documents')
  assertIncludes('cloudfunctions/getRSVPStats/index.js', 'normalizeListDocument', 'getRSVPStats must normalize legacy nested guest documents')
  assertIncludes('cloudfunctions/generatePoster/index.js', 'WXACODE_ENV_VERSION', 'generatePoster must support configurable wxacode env version')
  assertIncludes('cloudfunctions/generatePoster/index.js', 'envVersion', 'generatePoster must pass camelCase envVersion to cloud.openapi.wxacode')
  assertIncludes('cloudfunctions/generatePoster/index.js', 'checkPath: false', 'generatePoster must disable path check for preview and trial smoke tests')
  assertIncludes('pages/index/index.vue', 'parseWeddingIdFromOptions', 'home page must read ids opened from wxacode scene')
  assert(fs.existsSync(path.join(root, 'cloudfunctions/deleteWedding/index.js')), 'deleteWedding cloud function must exist')
  assertIncludes('cloudfunctions/deleteWedding/index.js', 'owner_openid', 'deleteWedding must verify owner before deleting data')
  assertIncludes('cloudfunctions/deleteWedding/index.js', 'removeByWeddingId', 'deleteWedding must remove wedding-scoped viewer records')
  assertIncludes('composables/useCloud.js', 'deleteWedding', 'useCloud must expose deleteWedding')
  assertIncludes('pages-owner/manage/index.vue', 'confirmDeleteWedding', 'manage page must expose delete confirmation flow')
  assertIncludes('pages-owner/manage/index.vue', 'danger-zone', 'manage page must render a distinct danger zone')
}

function checkTemplateSystem() {
  assertIncludes('utils/templates.js', 'rose-couture', 'templates must include rose couture as the default direction')
  assertIncludes('utils/templates.js', 'champagne-editorial', 'templates must include champagne editorial')
  assertIncludes('utils/templates.js', 'noir-banquet', 'templates must include noir banquet')
  assertIncludes('utils/templates.js', 'garden-film', 'templates must include garden film')
  assertIncludes('utils/templates.js', 'themeClass', 'templates must expose a theme class beyond the legacy tpl class')
  assertIncludes('utils/templates.js', 'TEMPLATE_HERO_IMAGES', 'templates must define photorealistic default hero images')
  assertIncludes('utils/templates.js', 'defaultHero', 'templates must bind a default hero image to each template')
  assertIncludes('utils/templates.js', 'getTemplateHeroImage', 'templates must expose a reusable hero image resolver')
  assertIncludes('utils/templates.js', 'getTemplatePosterTheme', 'templates must expose poster colors for template-aligned sharing')
  assertIncludes('utils/templates.js', 'buildTemplatePreviewData', 'templates must provide filled mock data for full previews')
  assertIncludes('uni.scss', '--theme-hero-overlay', 'global design tokens must include template hero overlays')
  assertIncludes('uni.scss', '--theme-default-cover-opacity', 'global design tokens must tune default cover opacity by template')
  assertIncludes('pages-owner/wizard/index.vue', 'WEDDING_TEMPLATES', 'wizard must use shared template definitions')
  assertIncludes('pages-owner/wizard/index.vue', '先选择婚礼模板', 'wizard must show templates before asking for details')
  assertIncludes('pages-owner/wizard/index.vue', 'selectedTemplate', 'wizard must derive preset copy from the selected template')
  assertIncludes('pages-owner/wizard/index.vue', 'template-visual', 'wizard template choices must include rich visual previews')
  assertIncludes('pages-owner/wizard/index.vue', '完整预览', 'wizard must let owners inspect filled template previews before choosing')
  assertIncludes('pages-owner/wizard/index.vue', 'preset?.mainText', 'wizard must use template preset invitation copy')
  assertIncludes('pages-owner/invitation/edit.vue', 'WEDDING_TEMPLATES', 'invitation editor must use shared template definitions')
  assertIncludes('pages-owner/invitation/edit.vue', 'previewTemplate', 'invitation editor must preview the currently selected template before saving')
  assertIncludes('pages-owner/template/preview.vue', 'buildTemplatePreviewData', 'template preview page must render mock wedding data')
  assertIncludes('pages-owner/template/preview.vue', 'previewHeroImage', 'template preview page must render the template hero image')
  assertIncludes('pages-owner/template/preview.vue', 'RSVP CARD', 'template preview page must show RSVP mock state')
  assertIncludes('pages-owner/template/preview.vue', '祝福墙', 'template preview page must show blessing wall mock state')
  assertIncludes('pages-owner/invitation/edit.vue', 'applyTemplatePreset', 'invitation editor must expose built-in template preset copy')
  assertIncludes('pages/index/index.vue', 'templateClass', 'home page must apply template styling')
  assertIncludes('pages/index/index.vue', 'getTemplateHeroImage', 'home page must fall back to the active template hero image')
  assertIncludes('pages/index/index.vue', '--theme-hero-overlay', 'home page must use template-aware hero image overlays')
  assertIncludes('pages/index/index.vue', "const coverImageMode = computed(() => 'aspectFill')", 'home page must fill narrow default covers without visible side bars')
  assertIncludes('pages/guide/index.vue', '--theme-panel-gradient', 'guide page must use template-aware panel colors')
  assertIncludes('pages/timeline/index.vue', '--theme-accent', 'timeline page must use template accent colors')
  assertIncludes('pages/rsvp/index.vue', 'rsvp-brief', 'RSVP page must show a template-aware wedding brief')
  assertIncludes('pages/album/index.vue', 'activeTemplate.albumMood', 'album page must adapt copy to the active template')
  assertIncludes('utils/posterCanvas.js', 'getTemplatePosterTheme', 'poster canvas must draw with the active template palette')
  assertIncludes('utils/posterCanvas.js', 'getTemplateHeroImage', 'poster canvas must use template hero images when no album cover exists')
  assertIncludes('pages-owner/album/manage.vue', 'chooseAlbumImages', 'album manager must handle modern WeChat image selection')
  assertIncludes('pages-owner/album/manage.vue', 'ensureAlbumPrivacyAuthorized', 'album manager must request WeChat privacy authorization before photo picking')
  assertIncludes('pages-owner/album/manage.vue', 'chooseWithFallback', 'album manager must fall back across supported WeChat image pickers')
  assertIncludes('pages-owner/album/manage.vue', 'getChooseImageApi', 'album manager must choose the native WeChat image API when available')
  assertIncludes('pages-owner/album/manage.vue', 'extractChosenImagePaths', 'album manager must normalize image paths from tempFilePaths and tempFiles')
  assertIncludes('pages-owner/album/manage.vue', 'buildAlbumCloudPath', 'album manager must upload into wedding-scoped cloud paths')
  assertIncludes('pages-owner/album/manage.vue', 'fetchWedding(userStore.weddingId, true)', 'album manager must force-refresh cloud data on entry')
  assertIncludes('pages-owner/album/manage.vue', 'previousAlbum', 'album manager must rollback local album state when cloud save fails')
  assertIncludes('pages-owner/album/manage.vue', 'deleteUploadedPhotos', 'album manager must clean uploaded files after failed album saves')
  assertIncludes('pages-owner/album/manage.vue', 'saveAlbumData', 'album manager must await cloud persistence before showing success')
  assertIncludes('composables/useCloud.js', "getCloudApi('uploadFile')", 'uploadFile must use the shared CloudBase API resolver')
  assertIncludes('composables/useCloud.js', "targets.push({ name: 'wx.cloud'", 'cloud init must initialize native wx.cloud when available')
  assertIncludes('composables/useCloud.js', 'deleteFiles', 'useCloud must expose cloud storage cleanup for failed album transactions')
  assertIncludes('App.vue', 'onNeedPrivacyAuthorization', 'app must resolve WeChat privacy authorization for album and map APIs')
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
  assert(countOccurrences(read('pages/index/index.vue'), '<view class="preview-header">') === 2, 'home page must not contain duplicated preview headers')
  assertIncludes('cloudfunctions/getWeather/index.js', 'geocodeVenue', 'getWeather must geocode venue fallback when coordinates are missing')
  assertIncludes('cloudfunctions/getWeather/index.js', 'QWEATHER_KEY', 'getWeather must support common weather key env aliases')
  assertIncludes('utils/posterCanvas.js', 'resolveImagePath', 'poster canvas must resolve cloud and base64 images before drawing')
  assertIncludes('utils/imagePaths.js', 'data:image/', 'image path helper must support base64 wxacode images')
  assertIncludes('utils/imagePaths.js', 'cloud://', 'image path helper must support cloud storage images')
  assertIncludes('pages-owner/share/index.vue', 'refreshQrCode', 'share page must render real wxacode generation status')
}

function checkCommercializationFoundations() {
  const routes = new Set(collectVueRoutes())
  assert(routes.has('pages-owner/profile/index'), 'pages.json must register owner profile and entitlements page')
  assert(routes.has('pages-owner/diagnostics/index'), 'pages.json must register release diagnostics page')
  assert(fs.existsSync(path.join(root, 'utils/commercial.js')), 'commercial config helper must exist')
  assertIncludes('utils/commercial.js', 'PLAN_TIERS', 'commercial helper must define plan tiers')
  assertIncludes('utils/commercial.js', 'DEFAULT_ENTITLEMENTS', 'commercial helper must define default entitlements')
  assertIncludes('utils/commercial.js', 'buildTemplateCommercialState', 'commercial helper must build template billing state')
  assertIncludes('utils/templates.js', "tier: 'premium'", 'templates must mark premium template candidates')
  assertIncludes('utils/templates.js', 'premium_templates', 'templates must bind premium templates to entitlement keys')
  assertIncludes('pages-owner/wizard/index.vue', 'getTemplateTierLabel', 'wizard must show template tier labels')
  assertIncludes('pages-owner/wizard/index.vue', 'buildTemplateCommercialState', 'wizard must persist template commercial state')
  assertIncludes('pages-owner/invitation/edit.vue', 'getCommercialHint', 'invitation editor must explain commercial template state')
  assertIncludes('pages-owner/invitation/edit.vue', 'buildTemplateCommercialState', 'invitation editor must persist template commercial state')
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
}

function checkReleaseDocs() {
  assert(fs.existsSync(path.join(root, '.nvmrc')), '.nvmrc must pin the preferred Node LTS version')
  assert(fs.existsSync(path.join(root, 'RELEASE-AUDIT.md')), 'RELEASE-AUDIT.md must document the pre-launch full audit')
  const audit = read('RELEASE-AUDIT.md')
  assert(audit.includes('15 个云函数'), 'RELEASE-AUDIT.md must cover all 15 cloud functions')
  assert(audit.includes('真云必验清单'), 'RELEASE-AUDIT.md must include true-cloud manual verification steps')
  const readme = read('README.md')
  assert(readme.includes('Node.js 20 LTS'), 'README must document Node.js 20 LTS')
  assert(readme.includes('发布前检查清单'), 'README must include a release checklist')
  assert(readme.includes('RELEASE-AUDIT.md'), 'README must link the pre-launch full audit')
  assert(readme.includes('P2 大众化/商业化'), 'README must document P2 commercialization foundations')
  assert(readme.includes('写实模板主图'), 'README must document photorealistic template hero images')
  assert(readme.includes('syncOwnerProfile'), 'README must document owner profile sync deployment')
}

function checkFriendsInvitationIteration() {
  const researchPath = 'docs/product/2026-05-28-friends-invitation-research.md'
  assert(fs.existsSync(path.join(root, researchPath)), 'friends invitation research and evaluation doc must exist')
  const research = read(researchPath)
  for (const text of [
    '年轻人需求仿真',
    '竞品功能矩阵',
    '甜囍手册现状评分',
    '隐私边界',
    '迭代路线',
    'https://www.hunbei.com/article_detail/208.html',
    'https://www.chinanews.com.cn/sh/2026/01-12/10550047.shtml'
  ]) {
    assert(research.includes(text), `${researchPath}: missing ${text}`)
  }

  const pkg = readJson('package.json')
  const manifest = readJson('manifest.json')
  assert(pkg.version === manifest.versionName, 'package.json version must match manifest.versionName')
  assert(
    pkg.scripts?.['postbuild:mp-weixin']?.includes('normalize-wechat-project-config.js'),
    'mp-weixin postbuild must normalize project.config.json for real-device preview'
  )
  assert(
    pkg.scripts?.['smoke:cloud-e2e']?.includes('smoke-cloud-e2e.mjs'),
    'package.json must expose repeatable CloudBase E2E smoke'
  )
  assertIncludes('scripts/normalize-wechat-project-config.js', 'miniprogramRoot', 'WeChat config normalizer must set miniprogramRoot')
  assertIncludes('scripts/normalize-wechat-project-config.js', 'libVersion', 'WeChat config normalizer must set a stable base library version')
  assertIncludes('scripts/normalize-wechat-project-config.js', 'encodeURIComponent', 'WeChat config normalizer must encode projectname for DevTools CLI')
  assertIncludes('scripts/smoke-cloud-e2e.mjs', 'generatePoster.develop', 'CloudBase E2E smoke must test wxacode generation in mini program context')
  assertIncludes('scripts/smoke-cloud-e2e.mjs', 'recordView.poster', 'CloudBase E2E smoke must test poster save aggregate tracking')
  if (fs.existsSync(path.join(root, '.npmrc'))) {
    assert(!read('.npmrc').includes('shamefully-hoist'), '.npmrc must not use npm-unsupported shamefully-hoist')
  }

  for (const text of ['audienceTags', 'shareCopyPresets', 'posterVariants', 'coverGuidance']) {
    assertIncludes('utils/templates.js', text, `templates must expose ${text} for friends invitation publishing`)
  }
  assertIncludes('utils/templates.js', 'buildDefaultShareConfig', 'templates must build default friends invitation share config')

  for (const text of ['moments_text', 'group_text', 'formal_text', 'poster_variant', 'poster_image', 'share_cover_mode']) {
    assertIncludes('pages-owner/wizard/index.vue', text, `wizard must initialize share_config.${text}`)
    assertIncludes('pages-owner/share/index.vue', text, `publishing center must edit share_config.${text}`)
  }
  assertIncludes('pages-owner/share/index.vue', '发布中心', 'share page must be positioned as a publishing center')
  assertIncludes('pages-owner/share/index.vue', '发布前检查', 'publishing center must show a pre-publish checklist')
  assertIncludes('pages-owner/share/index.vue', 'copyShareText', 'publishing center must copy ready-to-send share copy')
  assertIncludes('pages-owner/share/index.vue', 'privacy-note', 'publishing center must explain privacy-friendly aggregate stats')
  assertIncludes('pages-owner/share/index.vue', 'coverGuidance', 'publishing center must surface template cover guidance')
  assertIncludes('pages-owner/share/index.vue', 'audienceTags', 'publishing center must surface template audience tags')

  assertIncludes('pages/index/index.vue', '朋友圈打开即懂', 'home first screen must be optimized for social entry')
  assertIncludes('pages/index/index.vue', 'goToPoster', 'home first screen must expose poster saving')
  assertIncludes('pages/index/index.vue', 'sharePreviewText', 'home first screen must show social share copy')
  assertIncludes('pages/index/index.vue', 'shareImageUrl', 'home sharing must honor share_cover_mode')
  assertIncludes('pages/index/index.vue', "recordShare(userStore.weddingId, 'timeline')", 'timeline sharing must track aggregate channel only')

  assertIncludes('pages/rsvp/index.vue', '快速回执', 'RSVP must present a quick reply path')
  assertIncludes('pages/rsvp/index.vue', 'detailsExpanded', 'RSVP details must be collapsed by default')
  assertIncludes('pages/rsvp/index.vue', 'toggleDetails', 'RSVP must let guests expand optional planning details')

  assertIncludes('composables/useCloud.js', 'recordPosterSave', 'useCloud must expose poster save aggregate tracking')
  assertIncludes('cloudfunctions/recordView/index.js', 'poster_save', 'recordView must support poster_save aggregate events')
  assertIncludes('cloudfunctions/recordView/index.js', 'share_channels', 'recordView must store aggregate share channels')
  assertIncludes('cloudfunctions/recordView/index.js', 'poster_saves', 'recordView must store aggregate poster save count')
  assertIncludes('cloudfunctions/getStats/index.js', 'poster_saves', 'getStats must return poster save count')
  assertIncludes('cloudfunctions/getStats/index.js', 'share_channels', 'getStats must return aggregate share channels')
  assertIncludes('pages-owner/stats/index.vue', '海报保存', 'owner stats page must show poster save count')
  assertIncludes('pages-owner/stats/index.vue', '分享渠道', 'owner stats page must show share channels')
  assertIncludes('cloudfunctions/createWedding/index.js', 'share_channels', 'createWedding must initialize aggregate share channels')
  assertIncludes('cloudfunctions/createWedding/index.js', 'poster_saves', 'createWedding must initialize poster save count')
  const recordView = read('cloudfunctions/recordView/index.js')
  for (const forbidden of ['visitor_profiles', 'last_viewers', 'viewer_list', 'visited_at_list']) {
    assert(!recordView.includes(forbidden), `recordView must not introduce identifiable visitor tracking: ${forbidden}`)
  }
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
    'hero-rose-couture.jpg',
    'hero-champagne-editorial.jpg',
    'hero-noir-banquet.jpg',
    'hero-garden-film.jpg',
    'hero-heritage-ritual.jpg',
    'hero-shandong-family.jpg',
    'hero-travel-friendly.jpg'
  ]
  for (const file of expectedHeroImages) {
    assertJpegSize(`static/visuals/hero/${file}`, 750, 1334)
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
  assertIncludes('pages/index/index.vue', 'hero-gradient.default', 'home hero must soften the default cover overlay separately')
}

checkPagesExist()
checkNavigationTargets()
checkRsvpContract()
checkOwnerGuard()
checkCloudSafety()
checkCloudFunctionDeployConfig()
checkDataContracts()
checkTemplateSystem()
checkCommercializationFoundations()
checkUploadScript()
checkReleaseDocs()
checkFriendsInvitationIteration()
checkVisualAssets()

console.log('release readiness checks passed')
