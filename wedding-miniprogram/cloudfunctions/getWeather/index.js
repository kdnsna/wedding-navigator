const cloud = require('wx-server-sdk')
const https = require('https')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

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
    const venue = venues.find(item => item.coordinate?.latitude && item.coordinate?.longitude)

    if (!venue?.coordinate?.latitude || !venue?.coordinate?.longitude) {
      return { success: false, message: '场地缺少经纬度坐标' }
    }

    // 生产环境请在云函数环境变量中配置 HEFENG_KEY。
    const WEATHER_KEY = process.env.HEFENG_KEY || ''
    const lat = venue.coordinate.latitude
    const lon = venue.coordinate.longitude
    const weddingDate = wedding.data?.basic_info?.date || wedding.data?.wedding_date || ''

    if (!WEATHER_KEY || WEATHER_KEY === 'YOUR_HEFENG_KEY') {
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
      '300': { text: '阵雨', icon: 'rain' },
      '301': { text: '小雨', icon: 'rain' },
      '302': { text: '中雨', icon: 'rain' },
      '303': { text: '大雨', icon: 'rain' },
      '304': { text: '雷阵雨', icon: 'thunder' },
      '500': { text: '雾', icon: 'fog' },
      '503': { text: '强雾', icon: 'fog' },
    }

    const weather = weatherMap[daily.iconDay] || { text: daily.textDay, icon: 'sunny' }
    const tips = weather.text.includes('雨') ? '建议携带雨具，注意出行安全' : '天气宜人，适合户外活动'

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
        tips
      }
    }
  } catch (err) {
    console.error('getWeather error:', err)
    return buildMockWeather('', '天气服务暂时不可用，先为您展示模拟天气')
  }
}
