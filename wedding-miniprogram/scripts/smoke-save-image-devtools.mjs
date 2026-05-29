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
const outputPath = process.env.SMOKE_OUTPUT || path.join(root, '.release', 'smoke-save-image-devtools.json')
const failOnBlockedSave = process.env.SAVE_ALBUM_EXPECT_SUCCESS === '1'

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
        name,
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
      basic_info: { date: '2026-10-01', time: '12:00' },
      status: 'published',
      share_config: {
        title: 'Codex Save Album Smoke',
        description: 'Save album smoke',
        poster_variant: 'classic',
        poster_image: '',
        share_cover_mode: 'template'
      }
    },
    invitation: {
      template: 'rose-couture',
      couple: {
        groom: { name: 'Codex Groom' },
        bride: { name: 'Codex Bride' }
      },
      wedding: {
        date: '2026-10-01',
        time: '12:00',
        venue_name: 'Codex Hall',
        venue_address: 'Shanghai'
      },
      features: { show_rsvp: true, show_blessing: true }
    },
    venues: {
      venues: [{
        id: 'venue',
        name: 'Codex Hall',
        address: 'Shanghai',
        coordinate: { latitude: 31.2304, longitude: 121.4737, source: 'smoke' }
      }]
    },
    timeline: { events: [] }
  }
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

async function queryPosterReady(connection) {
  const fn = function () {
    return new Promise(function (resolve) {
      const pages = getCurrentPages()
      const page = pages[pages.length - 1]
      const result = {
        route: page && page.route,
        rects: {},
        previewPath: '',
        posterReady: false
      }
      if (!page) return resolve(result)

      const query = wx.createSelectorQuery().in(page)
      query.select('.poster-image').boundingClientRect(function (rect) {
        result.rects.image = rect || null
      })
      query.select('.action-btn.primary').boundingClientRect(function (rect) {
        result.rects.button = rect || null
        result.posterReady = rect?.dataset?.ready === '1'
      })
      query.exec(function () {
        const dataValues = Object.values(page.data || {})
        result.previewPath = String(dataValues.find(function (value) {
          return typeof value === 'string' && value.startsWith('http://tmp/') && value.includes('.png')
        }) || '')
        resolve(result)
      })
    })
  }
  return callAppFunction(connection, fn, [], 30000)
}

async function waitForPosterReady(connection) {
  let latest = null
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await sleep(1000)
    latest = await queryPosterReady(connection)
    if (latest.previewPath && latest.posterReady) return latest
  }
  return latest
}

async function getPrivacySetting(connection) {
  const fn = function () {
    return new Promise(function (resolve) {
      if (!wx.getPrivacySetting) return resolve({ available: false })
      wx.getPrivacySetting({
        success: resolve,
        fail: function (err) { resolve({ fail: err && (err.errMsg || err.message || String(err)) }) }
      })
    })
  }
  return callAppFunction(connection, fn, [], 30000)
}

async function saveImageToPhotosAlbum(connection, filePath) {
  const fn = function (filePath) {
    return new Promise(function (resolve) {
      wx.saveImageToPhotosAlbum({
        filePath,
        success: function (res) { resolve({ ok: true, errMsg: res.errMsg || '' }) },
        fail: function (err) { resolve({ ok: false, errMsg: err && (err.errMsg || err.message || String(err)) }) }
      })
    })
  }
  return callAppFunction(connection, fn, [filePath], 30000)
}

function isPrivacyDeclarationBlocked(saveResult) {
  return String(saveResult?.errMsg || '').includes('api scope is not declared')
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
    steps: []
  }
  let weddingId = ''
  let failure = null

  try {
    await connection.send('Tool.getInfo')
    const created = await callCloudFunction(connection, 'createWedding', buildSmokeWedding())
    weddingId = created.result?.weddingId || ''
    report.steps.push({
      label: 'createWedding',
      ok: Boolean(created.ok),
      success: Boolean(created.result?.success),
      weddingId
    })
    if (!weddingId) throw new Error(created.error || created.result?.message || 'createWedding did not return weddingId')

    const opened = await openPosterPage(connection, weddingId)
    report.steps.push({ label: 'openPoster', ...opened })
    if (!opened.ok) throw new Error(opened.error || 'failed to open poster page')

    report.poster = await waitForPosterReady(connection)
    if (!report.poster?.previewPath || !report.poster?.posterReady) {
      throw new Error('posterReady failed before save-to-album smoke')
    }

    report.privacySetting = await getPrivacySetting(connection)
    report.saveImageToPhotosAlbum = await saveImageToPhotosAlbum(connection, report.poster.previewPath)
    report.privacyDeclarationBlocked = isPrivacyDeclarationBlocked(report.saveImageToPhotosAlbum)
    report.ok = Boolean(report.saveImageToPhotosAlbum?.ok)
  } catch (err) {
    failure = err
    report.ok = false
    report.error = err.message
  } finally {
    if (weddingId) {
      const deleted = await callCloudFunction(connection, 'deleteWedding', { weddingId, confirmText: 'DELETE' })
        .catch(err => ({ ok: false, error: err.message }))
      report.steps.push({
        label: 'deleteWedding',
        ok: Boolean(deleted.ok),
        success: Boolean(deleted.result?.success),
        error: deleted.error || ''
      })
    }
    report.finishedAt = new Date().toISOString()
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`)
    connection.close()
  }

  if (failure) throw failure
  if (failOnBlockedSave && !report.ok) {
    throw new Error(report.saveImageToPhotosAlbum?.errMsg || 'saveImageToPhotosAlbum failed')
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
