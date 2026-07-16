const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const scanRoots = ['pages', 'pages-owner', 'components', 'composables', 'stores', 'utils']

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const result = []
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) result.push(...walk(abs))
    else result.push(abs)
  }
  return result
}

function read(abs) {
  return fs.readFileSync(abs, 'utf8')
}

function rel(abs) {
  return path.relative(root, abs)
}

const files = scanRoots
  .flatMap(dir => walk(path.join(root, dir)))
  .filter(file => /\.(vue|js)$/.test(file))

function collectRoutes() {
  const pagesJson = JSON.parse(fs.readFileSync(path.join(root, 'pages.json'), 'utf8'))
  const routes = []
  for (const page of pagesJson.pages || []) routes.push(page.path)
  for (const pkg of pagesJson.subPackages || []) {
    for (const page of pkg.pages || []) routes.push(`${pkg.root}/${page.path}`)
  }
  return routes
}

function checkNoUnregisteredPageFiles() {
  const registered = new Set(collectRoutes())
  const pageFiles = files
    .map(file => rel(file).replace(/\.vue$/, ''))
    .filter(file => file.startsWith('pages/') || file.startsWith('pages-owner/'))
  for (const file of pageFiles) {
    assert(registered.has(file), `${file}.vue: page file is not registered in pages.json`)
  }
}

function checkNoSilentCatch() {
  const pattern = /catch\s*\(\s*err\s*\)\s*\{\s*\}/
  const promisePattern = /\.catch\(\s*\(\s*(err)?\s*\)\s*=>\s*\{\s*\}\s*\)/
  for (const file of files) {
    const source = read(file)
    assert(!pattern.test(source), `${rel(file)}: do not silently swallow catch(err)`)
    assert(!promisePattern.test(source), `${rel(file)}: do not silently swallow Promise catch`)
  }
}

function checkNoDirectModalDismiss() {
  const pattern = /@click="[^"]*(show[A-Za-z0-9_]*Modal|showModal|showHotelM)\s*=\s*false"/
  for (const file of files.filter(file => file.endsWith('.vue'))) {
    assert(!pattern.test(read(file)), `${rel(file)}: modal masks and close buttons should use guarded close handlers`)
  }
}

function checkPosterCanvasResponsive() {
  const pageFiles = files.filter(file => file.endsWith('.vue') && rel(file).includes('poster'))
  for (const file of pageFiles) {
    const source = read(file)
    assert(!/^\s*width:\s*375px;\s*$/m.test(source), `${rel(file)}: poster preview must not hard-code 375px width`)
    assert(!/^\s*height:\s*667px;\s*$/m.test(source), `${rel(file)}: poster preview must not hard-code 667px height`)
    assert(source.includes('previewScale') || !source.includes('posterCanvas'), `${rel(file)}: poster canvas pages should scale preview to viewport`)
  }
}

function checkPosterCanvasTextGuards() {
  const posterCanvas = read(path.join(root, 'utils/posterCanvas.js'))
  assert(posterCanvas.includes('function drawFittedText'), 'utils/posterCanvas.js: poster names need fitted canvas text')
  assert(posterCanvas.includes('function drawWrappedText'), 'utils/posterCanvas.js: poster venue copy needs wrapped canvas text')
  assert(posterCanvas.includes('drawFittedText(ctx, groom'), 'utils/posterCanvas.js: groom name must use fitted canvas text')
  assert(posterCanvas.includes('drawFittedText(ctx, bride'), 'utils/posterCanvas.js: bride name must use fitted canvas text')
  assert(posterCanvas.includes('drawWrappedText(ctx, venueName'), 'utils/posterCanvas.js: venue name must wrap inside poster canvas')
  assert(posterCanvas.includes('drawWrappedText(ctx, venueAddress'), 'utils/posterCanvas.js: venue address must wrap inside poster canvas')

  const drawer = read(path.join(root, 'components/poster-drawer/poster-drawer.vue'))
  assert(drawer.includes("from '@/utils/posterCanvas.js'"), 'poster-drawer must reuse the shared poster canvas renderer')
  assert(!drawer.includes('fillText(groom'), 'poster-drawer must not duplicate raw groom canvas text drawing')
  assert(!drawer.includes('fillText(venueAddress'), 'poster-drawer must not duplicate raw venue canvas text drawing')
}

function checkNumericInputsHaveLength() {
  const inputPattern = /<input\b[^>]*type="(?:number|digit)"[^>]*>/g
  for (const file of files.filter(file => file.endsWith('.vue'))) {
    const source = read(file)
    for (const match of source.matchAll(inputPattern)) {
      assert(match[0].includes('maxlength='), `${rel(file)}: numeric input must declare maxlength`)
    }
  }
}

function checkModeledTextControlsHaveLength() {
  const controlPattern = /<(input|textarea)\b[^>]*v-model=[^>]*>/g
  for (const file of files.filter(file => file.endsWith('.vue'))) {
    const source = read(file)
    for (const match of source.matchAll(controlPattern)) {
      assert(match[0].includes('maxlength='), `${rel(file)}: v-model ${match[1]} must declare maxlength`)
    }
  }
}

function checkGuestLoadErrorCopy() {
  for (const file of files) {
    assert(!read(file).includes('load failed'), `${rel(file)}: user-facing load failures should use localized copy`)
  }
}

function checkTypographyContract() {
  const appSource = read(path.join(root, 'App.vue'))
  assert(appSource.includes("@import '@/styles/global.scss';"), 'App.vue: global styles must be imported exactly once')
  assert(read(path.join(root, 'styles/global.scss')).includes('font-family: $font-serif;'), 'styles/global.scss: global body copy must use the wedding serif stack')
  const fontPattern = /font-family:[^;\n]*(?:-apple-system|Helvetica|Arial|Inter|Roboto|system-ui|Georgia)/
  assert(!fontPattern.test(appSource), 'App.vue: global font stack must not override the wedding typography contract')

  const tokenSource = read(path.join(root, 'uni.scss'))
  assert(tokenSource.includes('$font-serif: "Noto Serif SC", "Songti SC", "STSong", "SimSun", serif;'), 'uni.scss: display typography must use Noto Serif SC/Songti SC/STSong')
  assert(tokenSource.includes('$font-sans: "PingFang SC"'), 'uni.scss: body typography must use PingFang SC')

  for (const file of files.filter(file => file.endsWith('.vue'))) {
    assert(!fontPattern.test(read(file)), `${rel(file)}: avoid off-contract font-family declarations`)
  }
}

function checkTimelineFilteredLineUsesVisibleEvents() {
  const source = read(path.join(root, 'pages/timeline/index.vue'))
  assert(source.includes('index < visibleEvents.length - 1'), 'pages/timeline/index.vue: filtered timeline line must use visibleEvents length')
}

function styleBlock(source, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = source.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\n\\}`))
  return match ? match[1] : ''
}

function checkLongUserContentCanWrap() {
  const checks = [
    ['pages/guide/index.vue', '.arrival-name'],
    ['pages/guide/index.vue', '.arrival-address'],
    ['pages/guide/index.vue', '.venue-name'],
    ['pages/guide/index.vue', '.venue-address'],
    ['pages/guide/index.vue', '.hotel-name'],
    ['pages/timeline/index.vue', '.content-title'],
    ['pages/blessing/index.vue', '.item-name'],
    ['pages-owner/blessing/manage.vue', '.item-name'],
    ['pages-owner/guests/manage.vue', '.guest-name'],
    ['pages-owner/guide/edit.vue', '.venue-address'],
    ['pages-owner/guide/edit.vue', '.info-row-value'],
    ['pages/index/index.vue', '.lux-venue-name'],
    ['pages/index/index.vue', '.lux-detail-value'],
    ['pages/index/index.vue', '.lux-invite-text'],
    ['pages/index/index.vue', '.lux-rsvp-copy'],
    ['pages/index/index.vue', '.lux-venue-address']
  ]
  for (const [file, selector] of checks) {
    const block = styleBlock(read(path.join(root, file)), selector)
    assert(block, `${file}: missing ${selector} style block for long content audit`)
    assert(!block.includes('white-space: nowrap'), `${file}: ${selector} must wrap long user content`)
    assert(!block.includes('text-overflow: ellipsis'), `${file}: ${selector} must not truncate long user content`)
    assert(!block.includes('-webkit-line-clamp'), `${file}: ${selector} must not line-clamp long user content`)
  }
}

function checkNativeFailureFeedback() {
  const expectations = [
    ['pages/album/index.vue', '图片预览失败'],
    ['pages/guide/index.vue', '打开导航失败'],
    ['pages/guide/index.vue', '拨打电话失败'],
    ['pages/index/index.vue', '首页打开导航失败'],
    ['pages/rsvp/index.vue', '加入日历失败'],
    ['pages-owner/share/index.vue', '复制小程序路径失败'],
    ['pages/poster/index.vue', '打开设置失败'],
    ['pages-owner/album/manage.vue', '打开相册设置失败'],
    ['pages-owner/guide/edit.vue', '拨打酒店电话失败'],
    ['pages-owner/guide/edit.vue', '地图选点能力不可用']
  ]
  for (const [file, text] of expectations) {
    assert(read(path.join(root, file)).includes(text), `${file}: native operation failure should be visible and logged`)
  }
}

function checkCalendarDateGuard() {
  const calendarPages = ['pages/rsvp/index.vue']
  for (const file of calendarPages) {
    const source = read(path.join(root, file))
    assert(source.includes('Number.isFinite(startTime)'), `${file}: calendar actions must validate parsed startTime before calling wx.addPhoneCalendar`)
    assert(source.includes('婚礼日期格式有误'), `${file}: invalid calendar date/time should have a visible user message`)
  }
}

function checkRsvpAttendanceStateSync() {
  const source = read(path.join(root, 'pages/rsvp/index.vue'))
  assert(source.includes('setAttendanceStatus'), 'pages/rsvp/index.vue: attendance status changes should go through a single state-sync function')
  assert(source.includes("form.guestCount = 0"), 'pages/rsvp/index.vue: declined RSVP should clear attending count')
  assert(source.includes("if (form.status === 'declined') return"), 'pages/rsvp/index.vue: guest count steppers should be inert when declined')
}

function checkBottomActionBarPrimaryOnlyDisables() {
  const rsvp = read(path.join(root, 'pages/rsvp/index.vue'))
  assert(rsvp.includes(':primary-disabled="!requiredFieldsReady"'), 'pages/rsvp/index.vue: route secondary action must stay usable while submit is incomplete')

  const poster = read(path.join(root, 'pages/poster/index.vue'))
  assert(poster.includes(':disabled="!posterReady"'), 'pages/poster/index.vue: poster save/share actions must stay disabled until poster is ready')

  const bottomBar = read(path.join(root, 'components/ui/BottomActionBar.vue'))
  assert(bottomBar.includes('primaryDisabled'), 'BottomActionBar must support primary-only disabled state')
  assert(bottomBar.includes('secondaryDisabled'), 'BottomActionBar must support secondary-only disabled state')
  assert(bottomBar.includes('secondaryLoading'), 'BottomActionBar must support secondary-only loading state')

  const share = read(path.join(root, 'pages-owner/share/index.vue'))
  assert(share.includes(':secondary-loading="qrLoading"'), 'pages-owner/share/index.vue: QR regeneration should not block share setting saves')
  assert(!share.includes(':disabled="saving || qrLoading"'), 'pages-owner/share/index.vue: QR loading must not globally disable the bottom bar')

  const album = read(path.join(root, 'pages-owner/album/manage.vue'))
  assert(album.includes(':loading="uploading"'), 'pages-owner/album/manage.vue: upload loading should stay on the upload action')
  assert(album.includes(':secondary-loading="refreshing"'), 'pages-owner/album/manage.vue: refresh loading should stay on the refresh action')
  assert(album.includes('function guardAlbumBusy'), 'pages-owner/album/manage.vue: image operations should use a visible busy guard')
  assert(album.includes('照片正在上传，请稍候'), 'pages-owner/album/manage.vue: upload busy taps must show visible feedback')
  assert(album.includes('相册正在保存，请稍候'), 'pages-owner/album/manage.vue: save busy taps must show visible feedback')
  assert(album.includes(':class="{ disabled: albumBusy }" v-else @click.stop="setCover(photo.id)"'), 'pages-owner/album/manage.vue: set-cover action should look disabled while busy')
  assert(album.includes('photos.length === 0 && !uploading && !refreshing'), 'pages-owner/album/manage.vue: empty state should not fight upload or refresh state')

  const profile = read(path.join(root, 'pages-owner/profile/index.vue'))
  assert(profile.includes(':secondary-disabled="saving"'), 'pages-owner/profile/index.vue: diagnostics navigation should be disabled while account sync is saving')
}

function checkOwnerGuardCoverage() {
  const ownerRoutes = collectRoutes()
    .filter(route => route.startsWith('pages-owner/'))
    .filter(route => !['pages-owner/wizard/index', 'pages-owner/template/preview'].includes(route))
  for (const route of ownerRoutes) {
    const source = read(path.join(root, `${route}.vue`))
    assert(source.includes('useOwnerGuard'), `${route}.vue: owner management page must use useOwnerGuard`)
    assert(source.includes('PageShell'), `${route}.vue: owner management page must use the shared PageShell layout`)
  }

  for (const route of ['pages-owner/share/index', 'pages-owner/invitation/edit', 'pages-owner/guide/edit']) {
    const source = read(path.join(root, `${route}.vue`))
    assert(source.includes('if (!(await useOwnerGuard())) return'), `${route}.vue: owner guard failures must stop follow-up page logic`)
  }

  for (const route of ownerRoutes) {
    const source = read(path.join(root, `${route}.vue`))
    assert(!source.includes('if (!useOwnerGuard()) return'), `${route}.vue: owner guard must be awaited`)
  }
}

function checkOwnerGuardFailureFeedback() {
  const source = read(path.join(root, 'composables/useOwnerGuard.js'))
  assert(source.includes('export async function useOwnerGuard'), 'useOwnerGuard.js: owner guard must be awaitable')
  assert(source.includes('await syncWorkspaceProfile'), 'useOwnerGuard.js: pending workspace verification must be awaited')
  assert(source.includes('await fetchWedding'), 'useOwnerGuard.js: active wedding verification must be awaited')
  assert(source.includes('recoverUnavailableWorkspace'), 'useOwnerGuard.js: stale active weddings must recover through the authoritative workspace list')
  assert(source.includes('return true'), 'useOwnerGuard.js: successful owner verification must resolve true')
  assert(source.includes('resolve(false)'), 'useOwnerGuard.js: failed owner verification must resolve false')
  assert(source.includes('goCreateWizard'), 'useOwnerGuard.js: missing wedding fallback should use a guarded create-wizard navigation')
  assert(source.includes('goGuestHome'), 'useOwnerGuard.js: failed owner access should use a guarded home fallback')
  assert(source.includes('创建向导打开失败，请稍后重试'), 'useOwnerGuard.js: create-wizard navigation failure must be visible')
  assert(source.includes('返回首页失败，请稍后重试'), 'useOwnerGuard.js: home navigation failure must be visible')
  assert(source.includes('书案暂时无法核验'), 'useOwnerGuard.js: owner verification failures must be visible to users')
  assert(source.includes('当前显示上次保存的书案'), 'useOwnerGuard.js: cached owners should get a visible degraded-verification hint')
  assert(!source.includes('允许访问（云端会做最终校验）'), 'useOwnerGuard.js: unknown owner verification failures must not be silently allowed')
}

function checkDeleteActionsLockDuringPersistence() {
  const checks = [
    ['pages-owner/guests/manage.vue', 'function deleteGuest', 'saving.value = true', 'saving.value = false', 'refreshing.value || saving.value'],
    ['pages-owner/timeline/edit.vue', 'function deleteEvent', 'saving.value = true', 'saving.value = false', 'refreshing.value || saving.value'],
    ['pages-owner/blessing/manage.vue', 'function deleteBlessing', 'saving.value = true', 'saving.value = false', 'guardBlessingBusy()'],
    ['pages-owner/guide/edit.vue', 'function deleteVenue', 'savingVenue.value = true', 'savingVenue.value = false', 'guardGuideBusy()'],
    ['pages-owner/guide/edit.vue', 'function deleteHotel', 'savingHotel.value = true', 'savingHotel.value = false', 'guardGuideBusy()'],
    ['pages-owner/album/manage.vue', 'function deletePhoto', 'saving.value = true', 'saving.value = false', 'guardAlbumBusy()']
  ]
  for (const [file, marker, startFlag, endFlag, guard] of checks) {
    const source = read(path.join(root, file))
    assert(source.includes(marker), `${file}: missing ${marker}`)
    assert(source.includes(startFlag), `${file}: delete action must set saving state before persistence`)
    assert(source.includes(endFlag), `${file}: delete action must clear saving state after persistence`)
    assert(source.includes(guard), `${file}: delete/refresh actions must guard against concurrent persistence`)
  }
}

function checkGuideBusyBlocksEntryActions() {
  const source = read(path.join(root, 'pages-owner/guide/edit.vue'))
  const entryFunctions = ['function showAddModal', 'function editVenue', 'function editTransportation', 'function showHotelModal', 'function editHotel']
  for (const marker of entryFunctions) {
    const start = source.indexOf(marker)
    assert(start >= 0, `pages-owner/guide/edit.vue: missing ${marker}`)
    const chunk = source.slice(start, start + 180)
    assert(chunk.includes('if (guardGuideBusy()) return'), `pages-owner/guide/edit.vue: ${marker} must not open while persistence is busy`)
  }
  assert(source.includes('路书数据正在保存或匹配地图，请稍候'), 'pages-owner/guide/edit.vue: busy entry taps must show visible feedback')
  assert(source.includes(':disabled="guideBusy" @click="showAddModal"'), 'pages-owner/guide/edit.vue: add venue button must be disabled while busy')
  assert(source.includes(':disabled="guideBusy" @click="showHotelModal"'), 'pages-owner/guide/edit.vue: add hotel button must be disabled while busy')
  assert(source.includes(':class="{ disabled: guideBusy }" @click="editTransportation"'), 'pages-owner/guide/edit.vue: transport rows must show busy disabled state')
}

function checkOwnerListEditActionsLockDuringPersistence() {
  const checks = [
    ['pages-owner/guests/manage.vue', 'guestBusy', 'function guardGuestBusy', '宾客数据正在同步，请稍候', ':class="{ disabled: guestBusy }" @click="editGuest(guest)"'],
    ['pages-owner/timeline/edit.vue', 'timelineBusy', 'function guardTimelineBusy', '流程数据正在同步，请稍候', ':class="{ disabled: timelineBusy }" @click="editEvent(event)"'],
    ['pages-owner/blessing/manage.vue', 'blessingBusy', 'function guardBlessingBusy', '祝福数据正在同步，请稍候', ':class="{ disabled: blessingBusy }" @click="togglePin(item)"']
  ]
  for (const [file, busy, guard, feedback, disabledEdit] of checks) {
    const source = read(path.join(root, file))
    assert(source.includes(busy), `${file}: list actions need a shared busy computed state`)
    assert(source.includes(guard), `${file}: list edit/delete actions need a visible busy guard`)
    assert(source.includes(feedback), `${file}: busy entry taps must show visible feedback`)
    assert(source.includes(disabledEdit), `${file}: edit action should look disabled while saving or refreshing`)
  }
}

function checkInvitationEditGuards() {
  const source = read(path.join(root, 'pages-owner/invitation/edit.vue'))
  assert(source.includes(':disabled="saving"'), 'pages-owner/invitation/edit.vue: editable controls should lock while saving')
  assert(source.includes('function guardInvitationSaving'), 'pages-owner/invitation/edit.vue: saving entry taps need a visible guard')
  assert(source.includes('婚书正在保存，请稍候'), 'pages-owner/invitation/edit.vue: saving guard must show visible feedback')
  assert(source.includes('if (guardInvitationSaving()) return'), 'pages-owner/invitation/edit.vue: preview/template/music actions must stop while saving')
  assert(source.includes('婚礼日期格式有误'), 'pages-owner/invitation/edit.vue: date format must be validated before save/preview')
  assert(source.includes('请选择婚礼时间'), 'pages-owner/invitation/edit.vue: time must be required before save/preview')
  assert(source.includes('婚礼时间格式有误'), 'pages-owner/invitation/edit.vue: time format must be validated before save/preview')
  assert(source.includes('function isValidDateString'), 'pages-owner/invitation/edit.vue: date validation must reject impossible dates')
  assert(source.includes('function isValidTimeString'), 'pages-owner/invitation/edit.vue: time validation must reject impossible times')
  assert(source.includes('新人姓名请控制在 20 字内'), 'pages-owner/invitation/edit.vue: couple names must keep poster/share text bounded')
  assert(!source.includes('showError(\'请填写新人姓名\')\n  }\n  if (!form.value.venueName'), 'pages-owner/invitation/edit.vue: missing couple names must return false')

  const templateCard = read(path.join(root, 'components/ui/TemplateCard.vue'))
  assert(templateCard.includes('disabled: { type: Boolean'), 'TemplateCard must expose a disabled prop')
  assert(templateCard.includes('if (props.disabled) return'), 'TemplateCard must not emit select/preview while disabled')
}

function checkPosterAuthFailureHandledOnce() {
  const source = read(path.join(root, 'pages/poster/index.vue'))
  assert(source.includes('handledError'), 'pages/poster/index.vue: album authorization failure should be marked as handled')
  assert(source.includes('if (!err?.handled)'), 'pages/poster/index.vue: handled authorization prompts must not show a second save failure toast')
}

function checkSharedUiComponentsExist() {
  const required = [
    'ActionCard.vue',
    'AiSuggestionPanel.vue',
    'BottomActionBar.vue',
    'EmptyState.vue',
    'MetricStrip.vue',
    'PageShell.vue',
    'SectionHeader.vue',
    'TemplateCard.vue'
  ]
  for (const file of required) {
    assert(fs.existsSync(path.join(root, 'components/ui', file)), `components/ui/${file}: required shared UI component is missing`)
  }
}

function checkNoTextSymbolIcons() {
  const forbiddenSymbols = ['›', '‹', '✕', '↗']
  const filesToCheck = files.filter(file => file.endsWith('.vue'))
  for (const file of filesToCheck) {
    const source = read(file)
    for (const symbol of forbiddenSymbols) {
      assert(!source.includes(symbol), `${rel(file)}: use local visual icons instead of text symbol "${symbol}"`)
    }
  }

  const requiredIcons = [
    'static/visuals/icon-chevron-right.svg',
    'static/visuals/icon-back.svg',
    'static/visuals/icon-close.svg',
    'static/visuals/icon-close-light.svg'
  ]
  for (const file of requiredIcons) {
    assert(fs.existsSync(path.join(root, file)), `${file}: required local operation icon is missing`)
  }
  assert(read(path.join(root, 'components/ui/ActionCard.vue')).includes('icon-chevron-right.svg'), 'ActionCard must use the shared chevron icon')
  assert(read(path.join(root, 'pages/poster/index.vue')).includes('icon-back.svg'), 'poster page must use the shared back icon')
  assert(read(path.join(root, 'pages-owner/album/manage.vue')).includes('icon-close-light.svg'), 'album delete action must use a high-contrast close icon')
}

function checkOwnerFallbackNavigation() {
  const ownerBackPages = [
    'pages-owner/blessing/manage.vue',
    'pages-owner/diagnostics/index.vue'
  ]
  for (const file of ownerBackPages) {
    const source = read(path.join(root, file))
    assert(source.includes('getCurrentPages()'), `${file}: owner back action needs a direct-entry fallback`)
    assert(source.includes('/pages-owner/manage/index'), `${file}: owner back fallback should return to manage dashboard`)
    assert(source.includes('返回后台失败，请稍后重试'), `${file}: owner back fallback failures must be visible`)
  }
}

function checkOwnerSharePosterRoute() {
  const source = read(path.join(root, 'pages-owner/share/index.vue'))
  assert(source.includes('/pages/poster/index'), 'pages-owner/share/index.vue: owner share poster action should use the registered poster route')
  assert(source.includes('encodedWeddingId'), 'pages-owner/share/index.vue: share and poster routes should use one encoded wedding id')
  assert(source.includes('海报页打开失败'), 'pages-owner/share/index.vue: poster navigation failure must be visible')
  assert(source.includes('`/pages/index/index?id=${encodedWeddingId.value}`'), 'pages-owner/share/index.vue: copied mini program path should include a leading slash and encoded id')
  assert(source.includes('`/pages/poster/index?id=${encodedWeddingId.value}`'), 'pages-owner/share/index.vue: poster route should carry an encoded wedding id explicitly')
  assert(source.includes('/static/visuals/icon-share.svg'), 'pages-owner/share/index.vue: copy/share actions should use the shared local share icon')

  const poster = read(path.join(root, 'pages/poster/index.vue'))
  assert(poster.includes('open-type="share"') && poster.includes(':disabled="!posterReady"'), 'pages/poster/index.vue: header share action should be a real share button gated by poster readiness')
  assert(poster.includes("const path = guestStore.invitationId ?"), 'pages/poster/index.vue: share path should omit empty id parameters')
  assert(poster.includes('encodeURIComponent(guestStore.invitationId)'), 'pages/poster/index.vue: share path should encode wedding id query values')
  assert(poster.includes('options.scene ? decodeSceneValue(options.scene) :'), 'pages/poster/index.vue: scene parsing should tolerate malformed encoding')
  assert(poster.includes('decodeSceneValue(pair[1])'), 'pages/poster/index.vue: scene id values should be decoded once after query parsing')
  assert(poster.includes('/static/visuals/icon-share.svg'), 'pages/poster/index.vue: friend share action should use a local share icon instead of text arrows')
  assert(!poster.includes('<text class="action-icon">'), 'pages/poster/index.vue: friend share action should not use text arrows as icons')
  assert(poster.includes('海报页返回失败'), 'pages/poster/index.vue: back navigation failure must be visible')
}

function checkGuestSharePathEncoding() {
  const index = read(path.join(root, 'pages/index/index.vue'))
  assert(index.includes('encodeURIComponent(guestStore.invitationId)'), 'pages/index/index.vue: share paths should encode guest invitation id query values')
  assert(index.includes('options.scene ? decodeSceneValue(options.scene) :'), 'pages/index/index.vue: shared scene parsing should tolerate malformed encoding')
  assert(index.includes('decodeSceneValue(idPair[1])'), 'pages/index/index.vue: scene id values should be decoded once after query parsing')

  const more = read(path.join(root, 'pages/more/index.vue'))
  assert(more.includes('encodeURIComponent(guestStore.invitationId)'), 'pages/more/index.vue: share paths should encode guest invitation id query values')
}

function checkOwnerDashboardFailureFeedback() {
  const source = read(path.join(root, 'pages-owner/manage/index.vue'))
  assert(source.includes('loadError'), 'pages-owner/manage/index.vue: dashboard load failures must have page state')
  assert(source.includes('书案暂未更新'), 'pages-owner/manage/index.vue: dashboard load failures must be visible')
  assert(source.includes('refreshDashboard(true)'), 'pages-owner/manage/index.vue: dashboard load failure should offer retry')
  assert(source.includes('页面打开失败，请稍后重试'), 'pages-owner/manage/index.vue: dashboard navigation failures must show feedback')
  assert(source.includes('预览页打开失败，请稍后重试'), 'pages-owner/manage/index.vue: preview navigation failures must show feedback')
  assert(source.includes("function shareWedding() { goTo('share/index') }"), 'pages-owner/manage/index.vue: share navigation must use the guarded owner route helper')
}

function checkGuestNavigationFailureFeedback() {
  const expectations = [
    ['pages/index/index.vue', 'routeFail(label, err)', '打开路书', '打开回执'],
    ['pages/more/index.vue', 'routeFail(label, err)', '打开主人书案', '打开祝福墙'],
    ['pages/rsvp/index.vue', 'routeFail(label, err)', '返回首页', '打开祝福墙'],
    ['pages/album/index.vue', '路书打开失败，请稍后重试'],
    ['pages/timeline/index.vue', '路书打开失败，请稍后重试'],
    ['pages/blessing/index.vue', '路书打开失败，请稍后重试']
  ]
  for (const [file, ...needles] of expectations) {
    const source = read(path.join(root, file))
    for (const text of needles) {
      assert(source.includes(text), `${file}: guest navigation failure must be visible`)
    }
  }
}

function checkGuestAccentSolidDiscipline() {
  const rsvp = read(path.join(root, 'pages/rsvp/index.vue'))
  assert(rsvp.includes('.radio-item.active,\n  .tag-item.active {\n    background: var(--theme-accent-soft'), 'pages/rsvp/index.vue: active RSVP chips must use accent-soft, not solid accent')
  assert(!rsvp.includes('.radio-item.active,\n  .tag-item.active,\n  .feature-action,\n  .submit-btn'), 'pages/rsvp/index.vue: active RSVP chips must not share the solid submit-button rule')

  const blessing = read(path.join(root, 'pages/blessing/index.vue'))
  assert(blessing.includes('.pinned-tag {\n    background: var(--theme-accent-soft'), 'pages/blessing/index.vue: pinned blessing tag must use accent-soft, not solid accent')
}

function checkOwnerNavigationFailureFeedback() {
  const expectations = [
    ['pages-owner/stats/index.vue', '宾客管理打开失败，请稍后重试'],
    ['pages-owner/diagnostics/index.vue', '处理页面打开失败，请稍后重试'],
    ['pages-owner/template/preview.vue', '返回创建向导失败，请稍后重试'],
    ['pages-owner/wizard/index.vue', '模板预览打开失败，请稍后重试'],
    ['pages-owner/wizard/index.vue', '婚礼已创建，但管理后台打开失败'],
    ['pages-owner/invitation/edit.vue', '预览页打开失败，请稍后重试'],
    ['pages-owner/invitation/edit.vue', '模板预览打开失败，请稍后重试'],
    ['pages-owner/profile/index.vue', '发布诊断打开失败，请稍后重试']
  ]
  for (const [file, text] of expectations) {
    assert(read(path.join(root, file)).includes(text), `${file}: owner navigation failure must be visible`)
  }
}

function checkWeddingDateDefaults() {
  const wizard = read(path.join(root, 'pages-owner/wizard/index.vue'))
  assert(wizard.includes("date: ''") && wizard.includes("time: ''"), 'pages-owner/wizard/index.vue: creation wizard must not persist suggested date or time before selection')
  assert(read(path.join(root, 'stores/wedding.js')).includes("date: ''"), 'stores/wedding.js: guest fallback wedding date must stay empty until real invitation data loads')
}

function checkCloudSuccessLogsDoNotExposePayloads() {
  const source = read(path.join(root, 'composables/useCloud.js'))
  assert(!source.includes('[cloud] ${name} success'), 'composables/useCloud.js: cloud success logs must not expose full response payloads')
}

function checkPersonalArrivalPlan() {
  const store = read(path.join(root, 'stores/wedding.js'))
  const guide = read(path.join(root, 'pages/guide/index.vue'))
  const rsvp = read(path.join(root, 'pages/rsvp/index.vue'))
  const home = read(path.join(root, 'pages/index/index.vue'))

  assert(store.includes('currentGuestRsvp'), 'stores/wedding.js: store must expose the current guest RSVP safely')
  assert(store.includes('guest?.is_current_user === true'), 'stores/wedding.js: current guest selection must use the server privacy marker')
  assert(guide.includes('class="guest-pass"'), 'pages/guide/index.vue: guide must render the personal RSVP arrival pass')
  assert(guide.includes('currentGuestRsvp.arrival_time'), 'pages/guide/index.vue: arrival pass must show the guest arrival time')
  assert(guide.includes('currentGuestRsvp.transport_mode'), 'pages/guide/index.vue: arrival pass must show the guest transport mode')
  assert(rsvp.includes('is_current_user: true'), 'pages/rsvp/index.vue: local RSVP updates must immediately identify the current guest')
  assert(store.includes("if (!guests.value) guests.value = { guests: [] }"), 'stores/wedding.js: first RSVP must initialize a missing guest document locally')
  assert(store.includes('guest?.is_current_user'), 'stores/wedding.js: RSVP updates must deduplicate phone-optional guests by current-user identity')
  assert(home.includes('const guest = store.currentGuestRsvp'), 'pages/index/index.vue: home RSVP state must never use another guest response')
}

checkNoSilentCatch()
checkNoUnregisteredPageFiles()
checkNoDirectModalDismiss()
checkPosterCanvasResponsive()
checkPosterCanvasTextGuards()
checkNumericInputsHaveLength()
checkModeledTextControlsHaveLength()
checkGuestLoadErrorCopy()
checkTypographyContract()
checkTimelineFilteredLineUsesVisibleEvents()
checkLongUserContentCanWrap()
checkNativeFailureFeedback()
checkCalendarDateGuard()
checkRsvpAttendanceStateSync()
checkBottomActionBarPrimaryOnlyDisables()
checkOwnerGuardCoverage()
checkOwnerGuardFailureFeedback()
checkDeleteActionsLockDuringPersistence()
checkGuideBusyBlocksEntryActions()
checkOwnerListEditActionsLockDuringPersistence()
checkInvitationEditGuards()
checkPosterAuthFailureHandledOnce()
checkSharedUiComponentsExist()
checkNoTextSymbolIcons()
checkOwnerFallbackNavigation()
checkOwnerSharePosterRoute()
checkGuestSharePathEncoding()
checkOwnerDashboardFailureFeedback()
checkGuestNavigationFailureFeedback()
checkGuestAccentSolidDiscipline()
checkOwnerNavigationFailureFeedback()
checkWeddingDateDefaults()
checkCloudSuccessLogsDoNotExposePayloads()
checkPersonalArrivalPlan()

console.log('ui polish checks passed')
