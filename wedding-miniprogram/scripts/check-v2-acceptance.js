const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const automaticOnly = process.argv.includes('--automatic')

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

function readJson(file) {
  return JSON.parse(read(file))
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertIncludes(file, text, message) {
  assert(read(file).includes(text), `${file}: ${message}`)
}

function walk(dir) {
  const result = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['dist', 'node_modules', 'unpackage'].includes(entry.name)) continue
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) result.push(...walk(abs))
    else result.push(abs)
  }
  return result
}

function vueFiles() {
  return walk(root).filter(file => file.endsWith('.vue'))
}

function checkNoVueColorOrLegacyThemeLeaks() {
  const hexPattern = /#[0-9a-fA-F]{3,8}\b/
  const oldThemePattern = /\btheme-(?:red-classic|sakura-pink|champagne|minimal-white|ocean-blue|violet-dream|garden-green|rose|noir|heritage|shandong|travel)\b/
  const oldTemplateClassPattern = /\.tpl-(?:rose|champagne|noir|garden)\b/
  for (const abs of vueFiles()) {
    const rel = path.relative(root, abs)
    const source = read(rel)
    assert(!hexPattern.test(source), `${rel}: .vue files must not contain hardcoded hex colors`)
    assert(!oldThemePattern.test(source), `${rel}: .vue files must not contain old theme class names`)
    assert(!oldTemplateClassPattern.test(source), `${rel}: .vue files must not contain legacy tpl-* selectors`)
  }
}

function checkThemeConstitution() {
  const pagesJson = readJson('pages.json')
  assert(pagesJson.globalStyle.navigationBarBackgroundColor === '#F7F2E9', 'pages.json: navigation bar must use paper background')
  assert(pagesJson.globalStyle.backgroundColor === '#F7F2E9', 'pages.json: global background must use paper background')
  assert(pagesJson.tabBar.selectedColor === '#8A3B45', 'pages.json: selected tab must use the free wine accent')

  const theme = read('styles/theme.scss')
  for (const name of ['wine', 'cinnabar', 'indigo', 'pine']) {
    assert(theme.includes(`theme-${name}`), `styles/theme.scss: must define theme-${name}`)
  }
  for (const variable of ['--accent', '--accent-ink', '--accent-soft', '--accent-line', '--accent-glow', '--on-accent']) {
    assert(theme.includes(variable), `styles/theme.scss: must define ${variable}`)
  }
  assert(theme.includes('--theme-hero-filter: none'), 'styles/theme.scss: photos must be unfiltered by default')

  const uni = read('uni.scss')
  for (const token of ['$paper-bg', '$ink', '$ink-soft', '$gold', '$photo-matte', '@mixin photo-mount', '@mixin photo-hero-scrim']) {
    assert(uni.includes(token), `uni.scss: missing v2 token ${token}`)
  }
}

function checkLegacyThemeNormalization() {
  assertIncludes('utils/legacy-theme-map.js', "'sakura-pink': 'wine'", 'sakura-pink must normalize to wine')
  assertIncludes('utils/legacy-theme-map.js', "VALID_THEMES = ['wine', 'cinnabar', 'indigo', 'pine']", 'valid themes must be the four v2 moods')
  assertIncludes('utils/legacy-theme-map.js', 'resolveTheme(key)', 'theme resolver must be the single JS entrypoint')
  assertIncludes('stores/wedding.js', 'resolveTheme', 'store must normalize fetched wedding theme data')
  assertIncludes('cloudfunctions/createWedding/index.js', "'sakura-pink': 'wine'", 'createWedding must normalize old persisted themes')
  assertIncludes('cloudfunctions/updateWedding/index.js', "'sakura-pink': 'wine'", 'updateWedding must normalize old persisted themes')
  assertIncludes('cloudfunctions/createWedding/index.js', 'resolveTheme(', 'createWedding must call resolveTheme')
  assertIncludes('cloudfunctions/updateWedding/index.js', 'resolveTheme(', 'updateWedding must call resolveTheme')
}

function checkPhotoSystem() {
  assertIncludes('pages/index/index.vue', '@include photo-hero-scrim', 'guest cover must have the paper hero scrim')
  assertIncludes('pages/index/index.vue', 'photoTreatmentClass', 'guest cover and previews must only apply opt-in photo treatments')
  assertIncludes('pages/index/index.vue', 'filter: none', 'guest photos must not be filtered by default')
  assertIncludes('pages/index/index.vue', 'lux-footer-section', 'guest scroll must have a designed closing section')
  assertIncludes('pages/album/index.vue', 'MAX_ALBUM_PHOTOS = 9', 'album page must cap the curated story at nine photos')
  assertIncludes('pages/album/index.vue', '.slice(0, MAX_ALBUM_PHOTOS)', 'album page must enforce the nine-photo limit')
  assertIncludes('pages/album/index.vue', '@include photo-mount', 'album photos must use mounted photo styling')
  assertIncludes('pages/album/index.vue', 'photoCaption(photo, index)', 'album photos must render exhibition-style captions')
  assertIncludes('pages-owner/album/manage.vue', 'MAX_ALBUM_PHOTOS = 9', 'owner album manager must cap uploaded photos at nine')
  assertIncludes('pages-owner/template/preview.vue', '@include photo-mount', 'template preview photos must use mounted photo styling')
  assertIncludes('components/t-photo/t-photo.vue', '@include photo-mount', 'shared t-photo component must use mounted photo styling')
}

function checkFourActWizard() {
  const wizard = read('pages-owner/wizard/index.vue')
  for (const label of ['具名', '择地', '选照', '定色']) {
    assert(wizard.includes(label), `pages-owner/wizard/index.vue: wizard must include act ${label}`)
  }
  assert(wizard.indexOf('具名') < wizard.indexOf('择地'), 'pages-owner/wizard/index.vue: act order must start with naming')
  assert(wizard.indexOf('择地') < wizard.indexOf('选照'), 'pages-owner/wizard/index.vue: venue act must precede photo act')
  assert(wizard.indexOf('选照') < wizard.indexOf('定色'), 'pages-owner/wizard/index.vue: photo act must precede mood act')
  for (const text of [
    'MAX_ALBUM_PHOTOS = 9',
    'remainingPhotoSlots',
    'chooseWizardImages',
    'pickedPhotos',
    '@include photo-mount',
    '@include photo-hero-scrim',
    'persistWizardPhotos',
    "updateWedding(weddingId, 'albums'",
    'photo_treatment: \'original\''
  ]) {
    assert(wizard.includes(text), `pages-owner/wizard/index.vue: missing wizard acceptance hook ${text}`)
  }
}

function checkPremiumThemeEntitlements() {
  assertIncludes('utils/legacy-theme-map.js', 'isPremiumTheme(key)', 'premium theme helper must exist')
  assertIncludes('utils/commercial.js', 'canUseTemplate', 'commercial helper must expose entitlement checks')
  assertIncludes('utils/commercial.js', 'billing_state', 'commercial state must record locked premium usage')
  assertIncludes('pages-owner/wizard/index.vue', 'locked: premium && !canUseTemplate', 'wizard mood switch must compute locked premium states')
  assertIncludes('pages-owner/wizard/index.vue', '高级色体验中', 'wizard must surface premium mood state when selected')
  assertIncludes('pages-owner/invitation/edit.vue', 'getCommercialHint', 'invitation editor must explain premium state')
  assertIncludes('pages-owner/invitation/edit.vue', 'buildTemplateCommercialState', 'invitation editor must persist premium state')
  assertIncludes('pages-owner/invitation/edit.vue', ':color="nativeAccentColor"', 'native switches must receive JS-resolved theme color')
  assertIncludes('pages-owner/timeline/edit.vue', ':color="nativeAccentColor"', 'native checkboxes must receive JS-resolved theme color')
  assertIncludes('pages/guide/index.vue', 'mapInk', 'native map callouts must receive JS-resolved theme color')
}

function checkTemplateRuntimeClasses() {
  assertIncludes('utils/templates.js', 'return getThemeClass(template.theme || template.themeClass)', 'runtime templates must emit mood theme classes only')
  assert(!read('utils/templates.js').includes('return [template.className'), 'utils/templates.js: must not emit legacy tpl-* classes at runtime')
  for (const page of ['pages/index/index.vue', 'pages/album/index.vue', 'pages/rsvp/index.vue', 'pages/guide/index.vue', 'pages/timeline/index.vue', 'pages/blessing/index.vue', 'pages/more/index.vue']) {
    assertIncludes(page, 'theme-wine', 'guest pages must style the v2 mood classes')
    assertIncludes(page, 'theme-cinnabar', 'guest pages must style the v2 mood classes')
    assertIncludes(page, 'theme-indigo', 'guest pages must style the v2 mood classes')
    assertIncludes(page, 'theme-pine', 'guest pages must style the v2 mood classes')
  }
}

function checkManualAcceptanceArtifacts() {
  assert(fs.existsSync(path.join(root, 'docs', 'v2-real-device-acceptance.md')), 'docs/v2-real-device-acceptance.md: manual acceptance checklist must exist')
  assert(fs.existsSync(path.join(root, 'scripts', 'create-v2-acceptance-record.js')), 'scripts/create-v2-acceptance-record.js: release acceptance record generator must exist')
  assert(fs.existsSync(path.join(root, 'scripts', 'record-v2-automatic-evidence.js')), 'scripts/record-v2-automatic-evidence.js: automatic evidence recorder must exist')
  assert(fs.existsSync(path.join(root, 'scripts', 'check-v2-real-device-record.js')), 'scripts/check-v2-real-device-record.js: final real-device record checker must exist')
  assert(fs.existsSync(path.join(root, 'scripts', 'find-legacy-sakura-wedding.js')), 'scripts/find-legacy-sakura-wedding.js: legacy sakura-pink query helper must exist')
  assert(fs.existsSync(path.join(root, 'preview.mjs')), 'preview.mjs: real-device preview QR generator must exist')
  assertIncludes('docs/v2-real-device-acceptance.md', '朋友第一反应', 'manual checklist must capture the uninformed friend reaction')
  assertIncludes('docs/v2-real-device-acceptance.md', 'theme=sakura-pink', 'manual checklist must capture old sakura-pink data validation')
  assertIncludes('docs/v2-real-device-acceptance.md', 'npm run preview:mp-weixin', 'manual checklist must document preview QR generation')
  assertIncludes('docs/v2-real-device-acceptance.md', 'npm run record:v2-automatic-evidence', 'manual checklist must document automatic evidence recording')
  assertIncludes('docs/v2-real-device-acceptance.md', 'npm run find:legacy-sakura', 'manual checklist must document the old-data query command')
  assertIncludes('package.json', 'preview:mp-weixin', 'package scripts must expose the real-device preview command')
  assertIncludes('scripts/create-v2-acceptance-record.js', 'v2-real-device-acceptance-', 'record generator must write versioned release evidence')
  assertIncludes('scripts/record-v2-automatic-evidence.js', 'Automatic v2 evidence recorded', 'automatic evidence recorder must update the release record')
  assertIncludes('scripts/check-v2-real-device-record.js', 'v2 real-device acceptance is not complete', 'final real-device checker must fail while evidence is pending')
  assertIncludes('scripts/find-legacy-sakura-wedding.js', "'sakura-pink'", 'legacy query helper must search for sakura-pink')
  assertIncludes('preview.mjs', 'preview-${version}.png', 'preview QR generator must write a versioned QR image')
}

function runAutomaticChecks() {
  checkNoVueColorOrLegacyThemeLeaks()
  checkThemeConstitution()
  checkLegacyThemeNormalization()
  checkPhotoSystem()
  checkFourActWizard()
  checkPremiumThemeEntitlements()
  checkTemplateRuntimeClasses()
  checkManualAcceptanceArtifacts()
  console.log('v2 automatic acceptance checks passed')
}

function printManualChecklist() {
  if (automaticOnly) return
  console.log('')
  console.log('Manual evidence still required before marking v2.0 complete:')
  console.log('- Scan the latest preview on a real phone, switch wine/cinnabar/indigo/pine, and inspect every guest screen for fifth-color leaks.')
  console.log('- Scroll the guest invitation from cover to footer on device and confirm the impression is an invitation, not an app dashboard.')
  console.log('- Use a real wedding record with theme=sakura-pink and confirm it opens as wine without console/runtime errors.')
  console.log('- Run the four-act owner wizard on device, pick photos in act 3, and confirm mounted previews appear immediately.')
  console.log('- Ask an uninformed person to look at any guest screenshot and record whether their first reaction is invitation/card.')
}

runAutomaticChecks()
printManualChecklist()
