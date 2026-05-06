const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { weddingId } = event

  if (!weddingId) {
    return { success: false, message: '缺少婚礼ID' }
  }

  try {
    // 获取婚礼场地坐标
    const wedding = await db.collection('weddings').doc(weddingId).field({
      venue: true,
      wedding_date: true
    }).get()

    const venue = wedding.data?.venue
    if (!venue?.latitude || !venue?.longitude) {
      return { success: false, message: '场地缺少经纬度坐标' }
    }

    // 调高德/腾讯天气 API（生产环境建议配置自己的 Key）
    // 这里用和风天气免费接口作为示例
    const WEATHER_KEY = 'YOUR_HEFENG_KEY' // 需要用户自行申请
    const lat = venue.latitude
    const lon = venue.longitude

    // 调用和风天气 API
    const res = await cloud.cloudFunction.invoke('https://devapi.qweather.com/v7/weather/3d', {
      query: {
        key: WEATHER_KEY,
        location: `${lon},${lat}`
      }
    })

    // 如果用户未配置 Key，返回模拟数据（婚礼前记得替换）
    if (!WEATHER_KEY || WEATHER_KEY === 'YOUR_HEFENG_KEY') {
      return {
        success: true,
        isMock: true,
        data: {
          text: '晴',
          temp_max: '28',
          temp_min: '18',
          wind: '东南风 2级',
          humidity: '65%',
          precip: '0%',
          icon: 'sunny',
          date: wedding.data.wedding_date,
          tips: '请配置天气 API Key 以获取真实天气'
        }
      }
    }

    const daily = res.data?.daily?.[0]
    if (!daily) {
      return { success: false, message: '天气数据获取失败' }
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
        date: wedding.data.wedding_date,
        tips
      }
    }
  } catch (err) {
    console.error('getWeather error:', err)
    return { success: false, message: '获取天气失败' }
  }
}
