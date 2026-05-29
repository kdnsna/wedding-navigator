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
const outputPath = process.env.SMOKE_OUTPUT || path.join(root, '.release', 'smoke-cloud-functions-full.json')

const expectedStats = {
  views: 1,
  shares: 2,
  poster_saves: 1,
  share_channels: { friend: 1, timeline: 1, poster: 1 },
  unique_viewers: 1,
  rsvp: { total: 1, attending: 1, attending_people: 2 },
  blessings: 1
}

function assertConfig(condition, message) {
  if (!condition) throw new Error(message)
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
      if (payload.error) callback.reject(new Error(payload.error.message || 'DevTools protocol error'))
      else callback.resolve(payload.result)
    })
  }

  send(method, params = {}, timeoutMs = 30000) {
    const id = String(this.nextId++)
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
      this.ws.send(JSON.stringify({ id, method, params }))
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
  return callAppFunction(connection, fn, [name, data, envId], 90000)
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
        title: 'Codex Full Cloud Function Smoke',
        description: 'Full CloudBase function smoke',
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
        allow_rsvp_update: true,
        allow_anonymous_blessing: true
      }
    },
    venues: {
      venues: [{
        id: 'venue',
        type: 'venue',
        name: 'Codex Smoke Hotel',
        address: 'Shanghai Smoke Road 1',
        coordinate: { latitude: 31.2304, longitude: 121.4737, source: 'smoke' }
      }]
    },
    timeline: {
      events: [{ id: 'event-1', time: '12:00', title: 'Ceremony', roleIds: ['guest'], notes: 'Smoke event', isImportant: true }]
    }
  }
}

function summarize(label, functionName, result) {
  const body = result?.result || {}
  return {
    label,
    function: functionName,
    transportOk: Boolean(result?.ok),
    success: Boolean(body.success),
    expected: false,
    code: body.code || '',
    reason: body.reason || '',
    needConfig: Boolean(body.needConfig),
    message: result?.error || body.message || '',
    weddingId: body.weddingId || '',
    blessingId: body.blessingId || '',
    dataLength: body.data ? String(body.data).length : 0,
    stats: body.stats || null,
    isMock: Boolean(body.isMock || body.data?.isMock)
  }
}

function expectSuccess(body) {
  return Boolean(body.success)
}

function expectStats(body) {
  const stats = body.stats || {}
  return Boolean(body.success) &&
    stats.views === expectedStats.views &&
    stats.shares === expectedStats.shares &&
    stats.poster_saves === expectedStats.poster_saves &&
    stats.share_channels?.friend === expectedStats.share_channels.friend &&
    stats.share_channels?.timeline === expectedStats.share_channels.timeline &&
    stats.share_channels?.poster === expectedStats.share_channels.poster &&
    stats.unique_viewers === expectedStats.unique_viewers &&
    stats.rsvp?.total === expectedStats.rsvp.total &&
    stats.rsvp?.attending === expectedStats.rsvp.attending &&
    stats.rsvp?.attending_people === expectedStats.rsvp.attending_people &&
    stats.blessings === expectedStats.blessings
}

async function main() {
  runDevtoolsAuto()
  const ws = await connectDevtoolsAuto(autoPort)
  const connection = new DevtoolsConnection(ws)
  const report = {
    envId,
    appid,
    projectPath,
    startedAt: new Date().toISOString(),
    steps: [],
    functionsCovered: []
  }
  let weddingId = ''
  let blessingId = ''
  let failure = null

  async function runStep(label, functionName, data, expect = expectSuccess) {
    const result = await callCloudFunction(connection, functionName, data)
    const step = summarize(label, functionName, result)
    const body = result?.result || {}
    step.expected = Boolean(step.transportOk && expect(body, step))
    report.steps.push(step)
    report.functionsCovered = [...new Set([...report.functionsCovered, functionName])]
    if (!step.expected) {
      throw new Error(`${label} failed expectation: ${step.message || step.code || step.reason || 'unexpected result'}`)
    }
    return body
  }

  try {
    await connection.send('Tool.getInfo')
    const profile = { nickname: 'Codex QA', phone: '', role: 'Owner' }
    await runStep('syncOwnerProfile', 'syncOwnerProfile', { profile })

    const created = await runStep('createWedding', 'createWedding', buildSmokeWedding())
    weddingId = created.weddingId

    await runStep('checkOwnership', 'checkOwnership', { weddingId }, body => body.success && body.isOwner === true)
    await runStep('getWedding.owner', 'getWedding', { weddingId }, body => body.success && body.data?.wedding)
    await runStep('updateWedding.venues', 'updateWedding', {
      weddingId,
      collection: 'venues',
      data: {
        venues: [{
          id: 'venue',
          type: 'venue',
          name: 'Codex Smoke Hotel Updated',
          address: 'Shanghai Smoke Road 1',
          coordinate: { latitude: 31.2304, longitude: 121.4737, source: 'smoke-update' }
        }]
      }
    })
    await runStep('submitRSVP', 'submitRSVP', {
      weddingId,
      rsvpData: {
        name: 'Codex Guest',
        phone: '',
        status: 'attending',
        attending_count: 2,
        relationship: 'friend',
        message: 'Looking forward to it'
      }
    })
    await runStep('getRSVPStats', 'getRSVPStats', { weddingId }, body => {
      return body.success && body.stats?.attending_people === 2 && body.stats?.attending === 1
    })
    const blessing = await runStep('submitBlessing', 'submitBlessing', {
      weddingId,
      blessing: {
        content: 'Best wishes from Codex smoke',
        sender: { name: 'Codex Guest' }
      }
    })
    blessingId = blessing.blessingId
    await runStep('pinBlessing', 'pinBlessing', { weddingId, blessingId, isPinned: true })
    await runStep('recordView.view', 'recordView', { weddingId, type: 'view' })
    await runStep('recordView.share.friend', 'recordView', { weddingId, type: 'share', channel: 'friend' })
    await runStep('recordView.share.timeline', 'recordView', { weddingId, type: 'share', channel: 'timeline' })
    await runStep('recordView.poster', 'recordView', { weddingId, type: 'poster_save', channel: 'poster' })
    await runStep('generatePoster.develop', 'generatePoster', { page: 'pages/index/index', scene: weddingId, width: 430, envVersion: 'develop' }, body => {
      return body.success && String(body.data || '').length > 1000
    })
    await runStep('getWeather', 'getWeather', { weddingId }, body => body.success && body.data)
    await runStep('geocodeVenue.realAddress', 'geocodeVenue', {
      name: '上海外滩',
      address: '上海市黄浦区中山东一路'
    }, body => body.success && body.data?.latitude && body.data?.longitude)
    await runStep('getStats.full', 'getStats', { weddingId }, expectStats)
    report.ok = true
  } catch (err) {
    failure = err
    report.ok = false
    report.error = err.message
  } finally {
    if (weddingId) {
      try {
        await runStep('deleteWedding.cleanup', 'deleteWedding', { weddingId, confirmText: 'DELETE' })
      } catch (cleanupErr) {
        if (!failure) failure = cleanupErr
      }
    }
    report.finishedAt = new Date().toISOString()
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`)
    connection.close()
  }

  if (failure) throw failure
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
