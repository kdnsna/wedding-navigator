import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'))

const envId = process.env.CLOUD_ENV_ID || 'cloud1-d5gqyur7g5a4d3c8d'
const appid = process.env.MINIPROGRAM_APPID || manifest['mp-weixin']?.appid
const cliPath = process.env.WECHAT_DEVTOOLS_CLI_PATH || '/Applications/wechatwebdevtools.app/Contents/MacOS/cli'
const projectPath = process.env.MINIPROGRAM_PROJECT_PATH || path.join(root, 'dist/build/mp-weixin')
const idePort = Number(process.env.WECHAT_DEVTOOLS_PORT || 9420)
const autoPort = Number(process.env.WECHAT_AUTOMATOR_PORT || 9421)
const outputPath = process.env.SMOKE_OUTPUT || path.join(root, '.release', 'smoke-cloud-e2e.json')

function assertConfig(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function runDevtoolsAuto() {
  assertConfig(fs.existsSync(cliPath), `WeChat DevTools CLI is missing: ${cliPath}`)
  assertConfig(fs.existsSync(projectPath), `mp-weixin project is missing: ${projectPath}`)
  const result = spawnSync(cliPath, [
    'auto',
    '--project', projectPath,
    '--appid', appid,
    '--port', String(idePort),
    '--auto-port', String(autoPort),
    '--lang', 'zh',
    '--trust-project'
  ], { encoding: 'utf8' })
  if (result.status !== 0) {
    throw new Error(`DevTools auto failed:\n${result.stdout}\n${result.stderr}`)
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function connectWs(endpoint, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(endpoint)
    const timer = setTimeout(() => {
      try { ws.close() } catch {}
      reject(new Error(`Timed out connecting to ${endpoint}`))
    }, timeoutMs)
    ws.addEventListener('open', () => {
      clearTimeout(timer)
      resolve(ws)
    })
    ws.addEventListener('error', () => {
      clearTimeout(timer)
      reject(new Error(`Failed connecting to ${endpoint}`))
    })
  })
}

async function connectDevtoolsAuto(port) {
  const endpoints = [
    `ws://localhost:${port}`,
    `ws://127.0.0.1:${port}`,
    `ws://[::1]:${port}`
  ]
  let lastError = null
  for (let attempt = 0; attempt < 12; attempt += 1) {
    for (const endpoint of endpoints) {
      try {
        return await connectWs(endpoint, 2000)
      } catch (err) {
        lastError = err
      }
    }
    await sleep(1000)
  }
  throw lastError || new Error(`Failed connecting to DevTools automator port ${port}`)
}

class DevtoolsConnection {
  constructor(ws) {
    this.ws = ws
    this.nextId = 1
    this.callbacks = new Map()
    ws.addEventListener('message', event => {
      const payload = JSON.parse(event.data)
      if (!payload.id) return
      const callback = this.callbacks.get(payload.id)
      if (!callback) return
      this.callbacks.delete(payload.id)
      if (payload.error) {
        callback.reject(new Error(payload.error.message || 'DevTools protocol error'))
      } else {
        callback.resolve(payload.result)
      }
    })
  }

  send(method, params = {}, timeoutMs = 30000) {
    const id = String(this.nextId++)
    const message = JSON.stringify({ id, method, params })
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.callbacks.delete(id)
        reject(new Error(`Timed out waiting for ${method}`))
      }, timeoutMs)
      this.callbacks.set(id, {
        resolve: value => {
          clearTimeout(timer)
          resolve(value)
        },
        reject: err => {
          clearTimeout(timer)
          reject(err)
        }
      })
      this.ws.send(message)
    })
  }

  close() {
    try { this.ws.close() } catch {}
  }
}

async function callAppFunction(connection, fn, args = [], timeoutMs = 60000) {
  const response = await connection.send('App.callFunction', {
    functionDeclaration: fn.toString(),
    args
  }, timeoutMs)
  return response.result
}

async function callCloudFunction(connection, name, data = {}) {
  const fn = function (name, data, envId) {
    return new Promise(function (resolve) {
      if (!wx.cloud) return resolve({ ok: false, reason: 'wx.cloud missing' })
      wx.cloud.init({ env: envId, traceUser: true })
      wx.cloud.callFunction({
        name: name,
        data: data || {},
        success: function (res) { resolve({ ok: true, result: res.result || {} }) },
        fail: function (err) { resolve({ ok: false, error: err && (err.errMsg || err.message || String(err)) }) }
      })
    })
  }
  return callAppFunction(connection, fn, [name, data, envId])
}

async function openPosterPage(connection, weddingId) {
  const fn = function (weddingId) {
    return new Promise(function (resolve) {
      wx.reLaunch({
        url: '/pages/poster/index?id=' + weddingId,
        success: function () { resolve({ ok: true }) },
        fail: function (err) { resolve({ ok: false, error: err && (err.errMsg || err.message || String(err)) }) }
      })
    })
  }
  return callAppFunction(connection, fn, [weddingId], 30000)
}

async function queryPosterRuntime(connection) {
  const fn = function () {
    return new Promise(function (resolve) {
      const pages = getCurrentPages()
      const page = pages[pages.length - 1]
      const selectors = [
        '.poster-container',
        '.poster-image',
        '.poster-placeholder',
        '.poster-canvas-export',
        '.actions',
        '.action-btn.primary',
        '.loading-overlay',
        '.poster-status'
      ]
      const result = {
        routes: pages.map(function (item) { return item.route }),
        rects: {},
        data: {}
      }
      if (!page) return resolve(result)
      const query = wx.createSelectorQuery().in(page)
      selectors.forEach(function (selector) {
        query.select(selector).boundingClientRect(function (rect) {
          result.rects[selector] = rect || null
        })
      })
      query.exec(function () {
        result.data = {
          hasPreview: Boolean(page.data && page.data.c),
          previewPath: page.data && page.data.d ? String(page.data.d).slice(0, 80) : '',
          saveDisabled: Boolean(page.data && page.data.i),
          loading: Boolean(page.data && page.data.m)
        }
        resolve(result)
      })
    })
  }
  return callAppFunction(connection, fn, [], 30000)
}

async function smokePosterRuntime(connection, weddingId) {
  const opened = await openPosterPage(connection, weddingId)
  if (!opened?.ok) {
    throw new Error(`Failed to open poster page: ${opened?.error || 'unknown error'}`)
  }

  const samples = []
  let latest = null
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await sleep(1000)
    latest = await queryPosterRuntime(connection)
    samples.push({
      second: attempt + 1,
      routes: latest.routes,
      hasImage: Boolean(latest.rects?.['.poster-image']),
      hasPlaceholder: Boolean(latest.rects?.['.poster-placeholder']),
      hasLoading: Boolean(latest.rects?.['.loading-overlay']),
      data: latest.data
    })
    if (latest.rects?.['.poster-image']) break
  }

  const rects = latest?.rects || {}
  const checks = {
    imageRendered: Boolean(rects['.poster-image']),
    canvasOffscreen: Boolean(rects['.poster-canvas-export']) &&
      (
        rects['.poster-canvas-export'].left < -1000 ||
        rects['.poster-canvas-export'].top < -1000
      ),
    actionsNotCovered: Boolean(rects['.poster-container']) &&
      Boolean(rects['.actions']) &&
      rects['.poster-container'].bottom < rects['.actions'].top,
    saveEnabled: latest?.rects?.['.action-btn.primary']?.dataset?.ready === '1'
  }

  if (!checks.imageRendered) throw new Error('Poster preview image did not render')
  if (!checks.canvasOffscreen) throw new Error('Poster export canvas is not safely offscreen')
  if (!checks.actionsNotCovered) throw new Error('Poster preview overlaps action buttons')
  if (!checks.saveEnabled) throw new Error('Poster save button did not become enabled')

  return { checks, latest, samples }
}

function buildSmokeWedding() {
  return {
    wedding: {
      basic_info: { date: '2026-10-01', time: '12:00', week_day: 'Thursday' },
      status: 'published',
      stats: {
        views: 0,
        shares: 0,
        poster_saves: 0,
        rsvp_count: 0,
        blessing_count: 0,
        unique_viewers: 0,
        share_channels: { friend: 0, timeline: 0, poster: 0 }
      },
      commercial: { plan: 'free', template_id: 'rose-couture' },
      workspace: { plan: 'free', template_id: 'rose-couture', commercial_status: 'trial' },
      share_config: {
        title: 'Codex Smoke Final Wedding Invitation',
        description: 'Cloud function end-to-end smoke',
        cover_image: '',
        moments_text: 'Codex smoke moments',
        group_text: 'Codex smoke group',
        formal_text: 'Codex smoke formal',
        poster_variant: 'classic',
        poster_image: '',
        share_cover_mode: 'template'
      }
    },
    invitation: {
      template: 'rose-couture',
      content: { title: 'Wedding invitation', main_text: 'Cloud function smoke test', sub_text: '', story: '' },
      couple: {
        groom: { name: 'Codex Groom', phone: '', photo: '' },
        bride: { name: 'Codex Bride', phone: '', photo: '' }
      },
      wedding: {
        date: '2026-10-01',
        time: '12:00',
        venue_name: 'Codex Smoke Hotel',
        venue_address: 'Shanghai Smoke Road 1'
      },
      features: {
        show_countdown: true,
        show_rsvp: true,
        show_blessing: true,
        show_timeline: true,
        rsvp_phone_required: false,
        allow_rsvp_update: true
      }
    },
    venues: {
      venues: [{
        id: 'venue',
        type: 'venue',
        name: 'Codex Smoke Hotel',
        address: 'Shanghai Smoke Road 1',
        coordinate: { latitude: 31.2304, longitude: 121.4737 }
      }]
    },
    timeline: {
      events: [{ id: 'event-1', time: '12:00', title: 'Ceremony', roleIds: ['guest'], notes: 'Smoke event', isImportant: true }]
    }
  }
}

function summarize(label, result) {
  const body = result?.result || {}
  return {
    label,
    ok: Boolean(result?.ok),
    success: Boolean(body.success),
    code: body.code || '',
    message: result?.error || body.message || '',
    weddingId: body.weddingId || '',
    dataLength: body.data ? String(body.data).length : 0,
    stats: body.stats || null
  }
}

function assertStep(step) {
  if (!step.ok || !step.success) {
    throw new Error(`${step.label} failed: ${step.message || step.code || 'unknown error'}`)
  }
}

async function main() {
  runDevtoolsAuto()
  const ws = await connectDevtoolsAuto(autoPort)
  const connection = new DevtoolsConnection(ws)
  let weddingId = ''
  const report = {
    envId,
    appid,
    projectPath,
    startedAt: new Date().toISOString(),
    steps: []
  }

  try {
    await connection.send('Tool.getInfo')
    const smoke = buildSmokeWedding()
    let result = await callCloudFunction(connection, 'createWedding', smoke)
    let step = summarize('createWedding', result)
    report.steps.push(step)
    assertStep(step)
    weddingId = step.weddingId

    for (const [label, name, data] of [
      ['recordView.timeline', 'recordView', { weddingId, type: 'share', channel: 'timeline' }],
      ['recordView.poster', 'recordView', { weddingId, type: 'poster_save', channel: 'poster' }],
      ['generatePoster.develop', 'generatePoster', { page: 'pages/index/index', scene: weddingId, width: 430, envVersion: 'develop' }],
      ['getStats', 'getStats', { weddingId }]
    ]) {
      result = await callCloudFunction(connection, name, data)
      step = summarize(label, result)
      report.steps.push(step)
      assertStep(step)
    }

    const statsStep = report.steps.find(item => item.label === 'getStats')
    const stats = statsStep?.stats || {}
    if (stats.poster_saves !== 1 || stats.share_channels?.timeline !== 1 || stats.share_channels?.poster !== 1) {
      throw new Error(`Unexpected aggregate stats: ${JSON.stringify(stats)}`)
    }
    const posterStep = report.steps.find(item => item.label === 'generatePoster.develop')
    if (!posterStep || posterStep.dataLength < 1000) {
      throw new Error('generatePoster did not return a base64 image')
    }

    report.posterRuntime = await smokePosterRuntime(connection, weddingId)
  } finally {
    if (weddingId) {
      const result = await callCloudFunction(connection, 'deleteWedding', { weddingId, confirmText: 'DELETE' })
      report.steps.push(summarize('deleteWedding', result))
    }
    report.finishedAt = new Date().toISOString()
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`)
    connection.close()
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
