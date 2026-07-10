const fs = require('fs')
const path = require('path')
const sass = require('sass')

const root = path.resolve(__dirname, '..')
const buildRoot = path.join(root, 'dist', 'build', 'mp-weixin')
const MAIN_PACKAGE_BUDGET = 1.2 * 1024 * 1024

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && ['node_modules', '.git', 'dist', 'unpackage'].includes(entry.name)) return []
    const target = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(target) : [target]
  })
}

function checkUniScssOutput() {
  const result = sass.compile(path.join(root, 'uni.scss'), { style: 'compressed' })
  assert(!result.css.trim(), 'uni.scss must emit zero CSS; move global rules to styles/global.scss')
}

function checkComponentSelectors() {
  const typeSelector = /(^|[,\s>+~])(view|text|image|button|input|textarea|scroll-view|navigator)(?=[\s,.#:{>+~]|$)/
  for (const file of walk(path.join(root, 'components')).filter(item => item.endsWith('.vue'))) {
    const source = fs.readFileSync(file, 'utf8')
    for (const style of source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
      assert(!/\[[^\]]+\]/.test(style[1]), `${path.relative(root, file)}: component styles must not use attribute selectors`)
      for (const block of style[1].matchAll(/([^{}]+)\{/g)) {
        const selector = block[1].trim()
        if (selector.startsWith('@') || selector === 'from' || selector === 'to' || /^\d+%/.test(selector)) continue
        assert(!typeSelector.test(selector), `${path.relative(root, file)}: component styles must use class selectors only: ${selector}`)
      }
    }
  }
}

function checkReadableTypography() {
  const roots = ['pages', 'pages-owner', 'components']
  const vueFiles = roots.flatMap(dir => walk(path.join(root, dir))).filter(file => file.endsWith('.vue'))
  for (const file of vueFiles) {
    const lines = fs.readFileSync(file, 'utf8').split('\n')
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index]
      assert(!/font-size:\s*(?:1\d|2[1-3])rpx/.test(line), `${path.relative(root, file)}:${index + 1}: readable text must be at least 24rpx`)
      if (!/font-size:\s*20rpx/.test(line)) continue
      const selector = lines.slice(0, index + 1).reverse().find(item => item.trim().endsWith('{')) || ''
      assert(/(?:kicker|eyebrow)/.test(selector), `${path.relative(root, file)}:${index + 1}: 20rpx is reserved for English eyebrows`)
    }
  }
}

function checkExperienceContracts() {
  const pages = JSON.parse(read('pages.json'))
  assert(pages.tabBar?.custom === true, 'pages.json must use the dynamic text custom tabBar')
  assert(!pages.preloadRule?.['pages/index/index'], 'guest home must not preload the owner subpackage')
  assert(fs.existsSync(path.join(root, 'custom-tab-bar', 'index.wxml')), 'native WeChat custom tabBar is missing')

  const userStore = read('stores/user.js')
  const guestStore = read('stores/guest-invitation.js')
  const ownerStore = read('stores/owner-workspace.js')
  assert(userStore.includes('ownerActiveWeddingId'), 'owner workspace id must be explicit')
  assert(ownerStore.includes('if (legacy && ownerVerified)'), 'legacy wedding id may migrate only after owner verification')
  assert(guestStore.includes('invitationId'), 'guest invitation id must be isolated from owner workspace')
  for (const state of ['idle', 'loading', 'ready', 'invalid', 'closed', 'offline']) {
    assert(guestStore.includes(`'${state}'`), `guest invitation state is missing: ${state}`)
  }
  assert(guestStore.includes('snapshot.value?.invitation?.features'), 'dynamic guest navigation must read invitation feature flags')

  const guestFiles = walk(path.join(root, 'pages')).filter(item => item.endsWith('.vue'))
  for (const file of guestFiles) {
    const source = fs.readFileSync(file, 'utf8')
    assert(!source.includes('userStore.weddingId'), `${path.relative(root, file)}: guest page must not read owner wedding id`)
    assert(!source.includes('setOwnerActiveWeddingId') && !source.includes('setWeddingId('), `${path.relative(root, file)}: guest page must not mutate the owner workspace`)
  }

  const weddingStore = read('stores/wedding.js')
  assert(!weddingStore.includes("name: '新郎'"), 'guest fallback must not invent a groom')
  assert(!weddingStore.includes("name: '新娘'"), 'guest fallback must not invent a bride')
  assert(!weddingStore.includes('诚邀您参加我们的婚礼'), 'guest fallback must not invent invitation copy')

  const wizard = read('pages-owner/wizard/index.vue')
  assert(wizard.includes("date: ''") && wizard.includes("time: ''"), 'wizard date and time must start empty')
  assert(wizard.includes(':primary-disabled="!canContinue"'), 'wizard must visibly disable progression until the current act is complete')
  assert(wizard.includes('scenario_preset') && wizard.includes('photo_treatment'), 'wizard must persist the v2 content fields')
  assert(read('pages-owner/invitation/edit.vue').includes('scenarioPreset'), 'editor must separate scenario preset from theme')
  assert(read('pages/blessing/index.vue').includes('!guestStore.canRenderInvitation'), 'blessing form must be hidden without a valid invitation')
  assert(read('pages/poster/index.vue').includes('const ready = await ensureWeddingLoaded(options)'), 'poster generation must wait for a valid invitation')
  assert(!read('pages/guide/index.vue').includes('getThemeTokens(activeTemplate'), 'native map colors must follow the selected mood, not a scenario')
}

function checkMotionAndCloudHotPath() {
  const source = walk(root)
    .filter(file => /\.(vue|scss)$/.test(file) && !file.includes(`${path.sep}dist${path.sep}`) && !file.includes(`${path.sep}node_modules${path.sep}`))
    .map(file => fs.readFileSync(file, 'utf8'))
    .join('\n')
  assert(!/@keyframes\s+(bounce|pulse|float|breathe|editorialFloat|editorialPulse)/.test(source), 'legacy bounce/pulse/float motion must be removed')
  const recordView = read('cloudfunctions/recordView/index.js')
  assert(!recordView.includes('createCollection') && !recordView.includes('ensureCollection'), 'recordView must not inspect or create collections on the hot path')
  assert(read('composables/useCloud.js').includes("callFunction('getGuestInvitation'"), 'guest data must use getGuestInvitation')
}

function checkDependencyMatrix() {
  const pkg = JSON.parse(read('package.json'))
  const versions = Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })
    .filter(([name]) => name.startsWith('@dcloudio/') && name !== '@dcloudio/types')
    .map(([, version]) => version)
  assert(new Set(versions).size === 1, '@dcloudio packages must use one exact version matrix')
}

function checkPackageBudget() {
  assert(fs.existsSync(buildRoot), 'build output is missing; run npm run build:mp-weixin before release checks')
  const excluded = [
    path.join(buildRoot, 'cloudfunctions') + path.sep,
    path.join(buildRoot, 'pages-owner') + path.sep
  ]
  const bytes = walk(buildRoot)
    .filter(file => !excluded.some(prefix => file.startsWith(prefix)))
    .reduce((total, file) => total + fs.statSync(file).size, 0)
  assert(bytes < MAIN_PACKAGE_BUDGET, `main package is ${(bytes / 1024 / 1024).toFixed(2)}MB; budget is 1.20MB`)

  const localHeroes = walk(path.join(root, 'static', 'visuals', 'hero')).filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
  assert(localHeroes.length <= 1, `main package may keep only one local paper fallback; found ${localHeroes.length} hero images`)
}

checkUniScssOutput()
checkComponentSelectors()
checkReadableTypography()
checkExperienceContracts()
checkMotionAndCloudHotPath()
checkDependencyMatrix()
checkPackageBudget()

console.log('v2 foundation and package budget checks passed')
