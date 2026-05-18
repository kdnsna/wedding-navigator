const cloud = require('wx-server-sdk')
const https = require('https')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { name = '', address = '' } = event || {}
  const keyword = [address, name].filter(Boolean).join(' ').trim()

  if (!keyword) {
    return { success: false, message: '缺少场地名称或地址' }
  }

  const key = process.env.TENCENT_MAP_KEY || process.env.QQMAP_KEY || process.env.MAP_KEY || ''
  if (!key) {
    return {
      success: false,
      needConfig: true,
      message: '请在 geocodeVenue 云函数环境变量中配置 TENCENT_MAP_KEY'
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
    return { success: false, message: err.message || '地图匹配失败' }
  }
}

function requestJson(baseUrl, params) {
  const query = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&')
  const url = `${baseUrl}?${query}`

  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let body = ''
      res.on('data', chunk => { body += chunk })
      res.on('end', () => {
        try {
          resolve(JSON.parse(body))
        } catch (err) {
          reject(err)
        }
      })
    })

    req.setTimeout(5000, () => {
      req.destroy(new Error('地图服务请求超时'))
    })
    req.on('error', reject)
  })
}
