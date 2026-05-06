const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { page, scene, width = 430 } = event

  if (!page) {
    return { success: false, message: '缺少 page 参数' }
  }

  try {
    const result = await cloud.openapi.wxacode.getUnlimited({
      scene: scene || '',
      page,
      width: parseInt(width),
      env_version: 'release' // 生产环境
    })

    // 返回临时文件流
    const buffer = result.buffer
    const base64 = buffer.toString('base64')

    return {
      success: true,
      data: `data:image/png;base64,${base64}`
    }
  } catch (err) {
    // 如果是体验版/开发版，降级处理
    if (err.errCode === 41030) {
      return {
        success: false,
        message: '请先在微信公众平台配置体验版或发布正式版',
        isConfigError: true
      }
    }
    return {
      success: false,
      message: err.message || '生成二维码失败'
    }
  }
}
