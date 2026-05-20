const cloud = require('wx-server-sdk')
const https = require('https')
const zlib = require('zlib')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { name = '', address = '' } = event || {}
  const keyword = [address, name].filter(Boolean).join(' ').trim()

  if (!keyword) {
    return { success: false, code: 'MISSING_KEYWORD', message: '缺少场地名称或地址' }
  }

  const key = process.env.TENCENT_MAP_KEY || process.env.QQMAP_KEY || process.env.MAP_KEY || ''
  if (!key) {
    return {
      success: false,
      code: 'MISSING_MAP_KEY',
      needConfig: true,
      message: '自动匹配服务尚未配置腾讯地图 Key，请先使用地图选点，或补齐云函数环境变量 TENCENT_MAP_KEY'
    }
  }

  try {
    const data = await requestJson('https://apis.map.qq.com/ws/geocoder/v1/', {
      address: keyword,
      key
    })

    if (data.status !== 0 || !data.result?.location) {
      return {
        success: false,
        code: 'NO_MATCH',
        message: data.message || '未匹配到地图坐标'
      }
    }

    const location = data.result.location
    return {
      success: true,
      data: {
        latitude: Number(location.lat),
        longitude: Number(location.lng),
        title: data.result.title || name || address,
        address: data.result.address || address,
        source: 'tencent-geocoder',
        matched_at: Date.now()
      }
    }
  } catch (err) {
    console.error('[geocodeVenue] failed:', err)
    const message = err.message || '地图匹配失败'
    return {
      success: false,
      code: message.includes('超时') || message.includes('timeout') ? 'MAP_TIMEOUT' : 'MAP_ERROR',
      message
    }
  }
}

function requestJson(baseUrl, params) {
  const query = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&')
  const url = `${baseUrl}?${query}`

  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'Accept-Encoding': 'gzip,deflate,br' } }, (res) => {
      readJsonResponse(res, resolve, reject)
    })

    req.setTimeout(5000, () => {
      req.destroy(new Error('地图服务请求超时'))
    })
    req.on('error', reject)
  })
}

function readJsonResponse(res, resolve, reject) {
  const chunks = []
  res.on('data', chunk => { chunks.push(Buffer.from(chunk)) })
  res.on('end', () => {
    const buffer = Buffer.concat(chunks)
    const encoding = String(res.headers['content-encoding'] || '').toLowerCase()

    const parse = (err, decoded) => {
      if (err) {
        reject(err)
        return
      }
      try {
        resolve(JSON.parse(decoded.toString('utf8')))
      } catch (parseErr) {
        reject(parseErr)
      }
    }

    if (encoding.includes('gzip')) {
      zlib.gunzip(buffer, parse)
    } else if (encoding.includes('br')) {
      zlib.brotliDecompress(buffer, parse)
    } else if (encoding.includes('deflate')) {
      zlib.inflate(buffer, parse)
    } else {
      parse(null, buffer)
    }
  })
}
