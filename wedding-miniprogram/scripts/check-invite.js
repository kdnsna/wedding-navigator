#!/usr/bin/env node
/**
 * 单场请柬（高嘉琪 × 张靖）发布前自检 —— 个人主体小程序的硬性要求 + 与 H5 逐字一致。
 *   node scripts/check-invite.js            静态检查
 *   node scripts/check-invite.js --dist     另外检查 dist/build/mp-weixin 的主包体积（先 npm run build:mp-weixin）
 * H5 源码默认在 /workspace/our-wedding，可用 H5_DIR=... 指定；找不到就跳过逐字比对。
 */
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8')
const fails = []
const assert = (cond, msg) => { if (!cond) fails.push(msg) }

async function loadConfig() {
  const src = read('config/invite.js')
  const mod = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'))
  return mod.default
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git', 'unpackage'].includes(e.name)) continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

;(async () => {
  const C = await loadConfig()

  /* ---------- 路由：只有请柬页可达 ---------- */
  const pages = JSON.parse(read('pages.json'))
  const routes = (pages.pages || []).map((p) => p.path)
  for (const pkg of pages.subPackages || []) for (const p of pkg.pages || []) routes.push(`${pkg.root}/${p.path}`)
  assert(routes[0] === 'pages/invite/index', 'pages.json: 第一个页面（入口）必须是 pages/invite/index')
  assert(routes.length === 1, `pages.json: 单场请柬模式只允许注册请柬页，现在有 ${routes.join(', ')}`)
  assert(!pages.tabBar, 'pages.json: 不能有 tabBar（会把相册/路书/流程等平台页带出来）')
  assert(!pages.preloadRule, 'pages.json: 不需要 preloadRule')
  const banned = /blessing|rsvp|wizard|template|profile|manage|diagnostics|stats|guests|share|poster|album|timeline|guide|more|privacy/
  for (const r of routes) assert(!banned.test(r), `pages.json: 平台页面不应被注册：${r}`)

  /* ---------- 个人主体：无 web-view、无表单、无 UGC、无定位隐私接口 ---------- */
  const page = read('pages/invite/index.vue')
  assert(!/<web-view/.test(page), 'pages/invite: 个人主体不能用 web-view')
  assert(!/<(input|textarea|form|editor)\b/.test(page), 'pages/invite: 不能有输入框/表单（不收集宾客信息）')
  assert(!/callFunction|uni\.request|wx\.request|uploadFile|chooseImage|chooseMedia/.test(page), 'pages/invite: 不应调用云函数/网络请求/上传')
  assert(/uni\.makePhoneCall/.test(page), 'pages/invite: 回执需要 uni.makePhoneCall')
  assert(/uni\.setClipboardData/.test(page), 'pages/invite: 回执需要 uni.setClipboardData 复制微信')
  assert(/uni\.openLocation/.test(page), 'pages/invite: 导航需要 uni.openLocation')
  assert(/onShareAppMessage/.test(page) && /onShareTimeline/.test(page), 'pages/invite: 需要 onShareAppMessage + onShareTimeline')
  const manifest = JSON.parse(read('manifest.json'))
  const mp = manifest['mp-weixin'] || {}
  assert(!(mp.requiredPrivateInfos || []).length, 'manifest.json: 请柬不需要 getLocation/chooseLocation 等 requiredPrivateInfos')
  assert(!mp.permission, 'manifest.json: 请柬不需要 scope.userLocation')
  assert(mp.__usePrivacyCheck__ === true, 'manifest.json: 保留 __usePrivacyCheck__（复制微信号会走官方隐私弹窗）')

  /* ---------- CONFIG ---------- */
  assert(C.contacts.length === 2 && C.contacts.every((c) => /^1\d{10}$/.test(c.tel)), 'CONFIG.contacts: 两位联系人，手机号 11 位')
  const withWechat = C.contacts.filter((c) => c.wechat)
  assert(withWechat.length === 1 && withWechat[0].name === '高嘉琪' && withWechat[0].wechat === 'Kdnsna7', 'CONFIG.contacts: 只有高嘉琪显示微信 Kdnsna7')
  assert(C.ceremonyTime === '上午 10:58', 'CONFIG.ceremonyTime 应为 上午 10:58')
  const v = C.venue
  assert(v.latitude > 36.9 && v.latitude < 37.5 && v.longitude > 122.2 && v.longitude < 122.8, 'CONFIG.venue: 经纬度应在荣成市区附近')
  assert(v.address === '荣成市成山大道东段1号', 'CONFIG.venue.address')
  assert(C.guide.items.length === 7 && C.guide.items.some((g) => g.title === '住宿安排'), 'CONFIG.guide: 7 张卡，含「住宿安排」')
  const musicPkg = /^\/static\/music\/[\w.-]+\.(m4a|mp3|aac)$/.test(C.music.src || '')
  assert(!C.music.enabled || /^(https|cloud):\/\//.test(C.music.src) || musicPkg, 'CONFIG.music: 开启时 src 必须是 https / cloud:// 授权音频，或包内的 /static/music/*.m4a|mp3|aac（原创/有授权）')
  if (C.music.enabled && musicPkg) {
    const mf = path.join(root, C.music.src.slice(1))
    assert(fs.existsSync(mf), `CONFIG.music.src 指向的包内音频不存在：${C.music.src}`)
    if (fs.existsSync(mf)) assert(fs.statSync(mf).size < 1.2 * 1024 * 1024, `${C.music.src}: 背景音乐应压到 1.2 MB 以内（AAC ~80 kbps）`)
    assert(/createInnerAudioContext/.test(page) && !/getBackgroundAudioManager/.test(page), 'pages/invite: 背景音乐用 InnerAudioContext（不用 BackgroundAudioManager，免 requiredBackgroundModes）')
    assert(!(mp.requiredBackgroundModes || []).length, 'manifest.json: 请柬不需要 requiredBackgroundModes')
  }
  assert(/^https:\/\//.test(C.share.imageUrl) || C.share.imageUrl === '/static/share-card.jpg', 'CONFIG.share.imageUrl 必须是 https，或包内的 /static/share-card.jpg（5:4 分享卡）')
  assert(/^(https:\/\/|cloud:\/\/)/.test(C.assetBase) && C.assetBase.endsWith('/'), 'CONFIG.assetBase 必须是 https:// 或 cloud://，并以 / 结尾')
  for (const [k, im] of Object.entries(C.images)) {
    assert(im.variants.length && im.fallback && im.w && im.h && im.pos.length === 2, `CONFIG.images.${k} 不完整`)
  }

  /* ---------- 包内不放照片、音频 ---------- */
  const staticFiles = walk(path.join(root, 'static'))
  for (const f of staticFiles) {
    const rel = path.relative(root, f)
    const isMusic = C.music.enabled && musicPkg && '/' + rel.split(path.sep).join('/') === C.music.src
    assert(isMusic || !/\.(mp3|m4a|aac|wav|ogg|flac)$/i.test(f), `${rel}: 包内只允许 CONFIG.music.src 指向的那一首背景音乐`)
    assert(!/\.(jpe?g|webp)$/i.test(f) || rel.endsWith('static/share-card.jpg'), `${rel}: 照片不要打进包里（走 CONFIG.assetBase）`)
  }
  assert(!fs.existsSync(path.join(root, 'static/visuals/hero')), 'static/visuals/hero: 平台模板封面图应留在 legacy-assets/（包外）')
  const fonts = read('config/invite-fonts.js')
  for (const f of C.fonts) assert(fonts.includes(`"${f.key}"`), `config/invite-fonts.js 缺少 ${f.key}（运行 node scripts/build-invite-fonts.mjs）`)

  /* ---------- 与 H5 逐字一致 ---------- */
  const h5 = path.join(process.env.H5_DIR || '/workspace/our-wedding', 'index.html')
  if (fs.existsSync(h5)) {
    const html = fs.readFileSync(h5, 'utf8')
    const text = html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&[a-z#0-9]+;/gi, '')
    const flat = text.replace(/\s+/g, '')
    const seg = (lines) => lines.map((l) => (Array.isArray(l) ? l.map((s) => s.t).join('') : '')).filter(Boolean)
    const strings = [
      ...C.opening.title, C.opening.date, C.opening.place, C.opening.sub2,
      C.story.tag, ...seg(C.story.lines), ...C.story.origins,
      C.journey.tag, C.journey.lead, ...C.journey.lines, C.journey.place, C.journey.postcard,
      C.gallery.tag, ...Object.values(C.gallery.captions).filter(Boolean), ...C.gallery.phrases,
      ...C.interlude.lines, C.interlude.en,
      C.invitation.families, C.invitation.title, C.invitation.zh, C.invitation.month, ...C.invitation.venueLines,
      C.invitation.mapLabel, C.invitation.note, `地址：${C.venue.address}`,
      C.guide.title, ...C.guide.items.map((g) => g.title),
      ...C.guide.items.flatMap((g) => seg(g.lines)).map((t) => t.replace('{ceremonyTime}', '${CONFIG.ceremonyTime}')),
      C.rsvp.prompt, C.rsvp.button, C.rsvp.sheetTitle, ...C.rsvp.sheetSub, C.rsvp.copied,
      ...C.ending.lines, C.ending.date, C.ending.place, C.footer, C.infoFab,
      C.share.title, C.share.desc
    ]
    // H5 里由脚本拼出来的几句（guideDay / guideContact / 时间）在 <script> 的模板字符串里，同样能在源码里找到
    const src = html.replace(/\s+/g, '')
    for (const s of strings) {
      const k = String(s).replace(/\s+/g, '')
      assert(flat.includes(k) || src.includes(k), `与 H5 不一致（H5 里找不到）：${s}`)
    }
    const m = html.match(/ceremonyTime:\s*"([^"]+)"/)
    assert(m && m[1] === C.ceremonyTime, 'ceremonyTime 与 H5 CONFIG 不一致')
    for (const c of C.contacts) assert(html.includes(`tel: "${c.tel}"`), `电话与 H5 CONFIG 不一致：${c.tel}`)
  } else {
    console.log(`(跳过 H5 逐字比对：找不到 ${h5})`)
  }

  /* ---------- 主包体积 ---------- */
  if (process.argv.includes('--dist')) {
    const dist = path.join(root, 'dist/build/mp-weixin')
    assert(fs.existsSync(dist), '先运行 npm run build:mp-weixin')
    if (fs.existsSync(dist)) {
      // 代码包 = 产物里除云函数目录（单独部署）和 cloudbaserc.json 之外的全部文件
      const files = walk(dist).filter((f) => !path.relative(dist, f).startsWith('cloudfunctions') && !f.endsWith('cloudbaserc.json'))
      const bytes = files.reduce((n, f) => n + fs.statSync(f).size, 0)
      console.log(`主包（mp-weixin 产物，不含云函数）：${(bytes / 1024).toFixed(1)} KB（${bytes} 字节，上限 2048 KB）`)
      // 不含音频时应远小于 1 MB；包内背景音乐（≤ 1.2 MB）另算，总量仍须给 2 MB 上限留足余量
      const musicBytes = files.filter((f) => /\.(mp3|m4a|aac)$/i.test(f)).reduce((n, f) => n + fs.statSync(f).size, 0)
      if (musicBytes) console.log(`  其中背景音乐：${(musicBytes / 1024).toFixed(1)} KB；其余：${((bytes - musicBytes) / 1024).toFixed(1)} KB`)
      assert(bytes - musicBytes < 1024 * 1024, `主包（不含音频）${bytes - musicBytes} 字节：单场请柬应远小于 1 MB`)
      assert(bytes < 1.75 * 1024 * 1024, `主包 ${bytes} 字节：含音频也要给 2 MB 上限留余量（< 1.75 MB）`)
      const app = JSON.parse(fs.readFileSync(path.join(dist, 'app.json'), 'utf8'))
      assert(JSON.stringify(app.pages) === '["pages/invite/index"]' && !app.subPackages && !app.tabBar, 'dist app.json: 只应有 pages/invite/index')
    }
  }

  if (fails.length) {
    console.error('invite checks FAILED:\n- ' + fails.join('\n- '))
    process.exit(1)
  }
  console.log('invite checks passed')
})()
