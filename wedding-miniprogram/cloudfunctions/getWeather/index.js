const cloud = require('wx-server-sdk')
const https = require('https')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

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

function requestWeather(key, lon, lat) {
  const url = `https://devapi.qweather.com/v7/weather/3d?key=${encodeURIComponent(key)}&location=${encodeURIComponent(`${lon},${lat}`)}`

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
      req.destroy(new Error('天气服务请求超时'))
    })

    req.on('error', reject)
  })
}

function buildMockWeather(weddingDate, tips = '天气服务暂时不可用，先为您展示模拟天气') {
  return {
    success: true,
    isMock: true,
    data: {
      isMock: true,
      text: '晴',
      temp_max: '28',
      temp_min: '18',
      wind: '东南风 2级',
      humidity: '65%',
      precip: '0',
      icon: 'sunny',
      date: weddingDate,
      tips
    }
  }
}

async function geocodeVenue(venue) {
  const key = process.env.TENCENT_MAP_KEY || process.env.QQMAP_KEY || process.env.MAP_KEY || ''
  const keyword = [venue?.address, venue?.name].filter(Boolean).join(' ').trim()
  if (!key || !keyword) return null

  try {
    const data = await requestJson('https://apis.map.qq.com/ws/geocoder/v1/', {
      address: keyword,
      key
    })
    const location = data.status === 0 ? data.result?.location : null
    if (!location) return null
    return {
      latitude: Number(location.lat),
      longitude: Number(location.lng),
      source: 'tencent-geocoder'
    }
  } catch (err) {
    console.warn('[getWeather] geocode fallback failed:', err)
    return null
  }
}

exports.main = async (event, context) => {
  const { weddingId } = event

  if (!weddingId) {
    return { success: false, message: '缺少婚礼ID' }
  }

  try {
    const [wedding, venuesRes] = await Promise.all([
      db.collection('weddings').doc(weddingId).get(),
      db.collection('venues').doc(weddingId).get().catch(() => ({ data: null }))
    ])

    const venues = venuesRes.data?.venues || []
    const venue = venues.find(item => item.coordinate?.latitude && item.coordinate?.longitude) || venues[0]
    let coordinate = venue?.coordinate

    if (!coordinate?.latitude || !coordinate?.longitude) {
      coordinate = await geocodeVenue(venue)
    }

    if (!coordinate?.latitude || !coordinate?.longitude) {
      return buildMockWeather(
        wedding.data?.basic_info?.date || '',
        '请在主人端为主场地匹配地图坐标，或为 geocodeVenue 配置腾讯地图 Key'
      )
    }

    // 生产环境请在云函数环境变量中配置 HEFENG_KEY。
    const WEATHER_KEY = process.env.HEFENG_KEY || ''
    const lat = coordinate.latitude
    const lon = coordinate.longitude
    const weddingDate = wedding.data?.basic_info?.date || ''

    if (!WEATHER_KEY) {
      return buildMockWeather(weddingDate, '请配置天气 API Key 以获取真实天气')
    }

    const res = await requestWeather(WEATHER_KEY, lon, lat)
    const daily = res.daily?.[0]
    if (!daily) {
      return buildMockWeather(weddingDate)
    }

    const weatherMap = {
      '100': { text: '晴', icon: 'sunny' },
      '101': { text: '多云', icon: 'cloudy' },
      '102': { text: '少云', icon: 'cloudy' },
      '103': { text: '晴间多云', icon: 'cloudy' },
      '104': { text: '阴', icon: 'overcast' },
      '150': { text: '晴', icon: 'sunny' },
      '151': { text: '多云', icon: 'cloudy' },
      '152': { text: '少云', icon: 'cloudy' },
      '153': { text: '晴间多云', icon: 'cloudy' },
      '300': { text: '阵雨', icon: 'rain' },
      '301': { text: '小雨', icon: 'rain' },
      '302': { text: '中雨', icon: 'rain' },
      '303': { text: '大雨', icon: 'rain' },
      '304': { text: '雷阵雨', icon: 'thunder' },
      '305': { text: '小雨', icon: 'rain' },
      '306': { text: '中雨', icon: 'rain' },
      '307': { text: '大雨', icon: 'rain' },
      '308': { text: '暴雨', icon: 'rain' },
      '309': { text: '大暴雨', icon: 'rain' },
      '310': { text: '特大暴雨', icon: 'rain' },
      '311': { text: '小雨', icon: 'rain' },
      '312': { text: '中雨', icon: 'rain' },
      '313': { text: '冻雨', icon: 'rain' },
      '314': { text: '小雨', icon: 'rain' },
      '315': { text: '中雨', icon: 'rain' },
      '316': { text: '大雨', icon: 'rain' },
      '317': { text: '暴雨', icon: 'rain' },
      '318': { text: '特大暴雨', icon: 'rain' },
      '399': { text: '雨', icon: 'rain' },
      '400': { text: '小雪', icon: 'snow' },
      '401': { text: '中雪', icon: 'snow' },
      '402': { text: '大雪', icon: 'snow' },
      '403': { text: '暴雪', icon: 'snow' },
      '404': { text: '雨夹雪', icon: 'snow' },
      '405': { text: '雨夹雪', icon: 'snow' },
      '406': { text: '雨夹雪', icon: 'snow' },
      '407': { text: '小雪', icon: 'snow' },
      '408': { text: '中雪', icon: 'snow' },
      '409': { text: '大雪', icon: 'snow' },
      '410': { text: '暴雪', icon: 'snow' },
      '499': { text: '雪', icon: 'snow' },
      '500': { text: '雾', icon: 'fog' },
      '501': { text: '雾', icon: 'fog' },
      '502': { text: '雾', icon: 'fog' },
      '503': { text: '强雾', icon: 'fog' },
      '504': { text: '轻雾', icon: 'fog' },
      '507': { text: '浓雾', icon: 'fog' },
      '508': { text: '特强浓雾', icon: 'fog' },
      '509': { text: '轻雾', icon: 'fog' },
      '510': { text: '大雾', icon: 'fog' },
      '511': { text: '特强浓雾', icon: 'fog' },
      '512': { text: '浓雾', icon: 'fog' },
      '513': { text: '大雾', icon: 'fog' },
      '514': { text: '轻雾', icon: 'fog' },
      '515': { text: '雾', icon: 'fog' },
      '600': { text: '浮尘', icon: 'dust' },
      '601': { text: '扬沙', icon: 'dust' },
      '602': { text: '沙尘暴', icon: 'dust' },
      '603': { text: '强沙尘暴', icon: 'dust' },
      '604': { text: '浮尘', icon: 'dust' },
      '605': { text: '扬沙', icon: 'dust' },
      '606': { text: '沙尘暴', icon: 'dust' },
      '999': { text: '未知', icon: 'unknown' },
    }

    const weather = weatherMap[daily.iconDay] || { text: daily.textDay || '未知', icon: 'unknown' }
    const tips = weather.text.includes('雨') ? '建议携带雨具，注意出行安全'
      : weather.text.includes('雪') ? '注意保暖防滑，出行小心'
      : weather.text.includes('雾') ? '能见度较低，出行注意安全'
      : weather.text.includes('沙') || weather.text.includes('尘') ? '空气质量较差，建议佩戴口罩'
      : '天气宜人，适合户外活动'

    return {
      success: true,
      data: {
        text: weather.text,
        icon: weather.icon,
        temp_max: daily.tempMax,
        temp_min: daily.tempMin,
        wind: `${daily.windDayDir} ${daily.windScaleDay}级`,
        humidity: `${daily.humidity}%`,
        precip: daily.precip,
        sunrise: daily.sunrise,
        sunset: daily.sunset,
        date: weddingDate,
        venue_name: venue?.name || '',
        location_source: coordinate.source || venue?.coordinate?.source || 'venue-coordinate',
        tips
      }
    }
  } catch (err) {
    console.error('getWeather error:', err)
    return buildMockWeather('', '天气服务暂时不可用，先为您展示模拟天气')
  }
}
