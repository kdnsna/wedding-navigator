function getCloudApi() {
  if (typeof wx !== 'undefined' && wx.cloud?.downloadFile) return wx.cloud
  if (typeof uni !== 'undefined' && uni.cloud?.downloadFile) return uni.cloud
  return null
}

function getFileSystem() {
  if (typeof wx !== 'undefined' && wx.getFileSystemManager && wx.env?.USER_DATA_PATH) {
    return {
      fs: wx.getFileSystemManager(),
      root: wx.env.USER_DATA_PATH
    }
  }
  return null
}

function dataUriToTempFilePath(dataUri, prefix = 'image') {
  const match = String(dataUri || '').match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/)
  const fsInfo = getFileSystem()
  if (!match || !fsInfo) return Promise.resolve('')

  const ext = match[1].toLowerCase().includes('jpeg') ? 'jpg' : match[1].toLowerCase().replace(/[^a-z0-9]/g, '') || 'png'
  const filePath = `${fsInfo.root}/${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

  return new Promise((resolve) => {
    fsInfo.fs.writeFile({
      filePath,
      data: match[2],
      encoding: 'base64',
      success: () => resolve(filePath),
      fail: () => resolve('')
    })
  })
}

function downloadHttpImage(url) {
  return new Promise((resolve) => {
    uni.downloadFile({
      url,
      success: (res) => resolve(res.tempFilePath || ''),
      fail: () => resolve('')
    })
  })
}

function downloadCloudImage(fileID) {
  const cloudApi = getCloudApi()
  if (!cloudApi) return Promise.resolve('')

  return new Promise((resolve) => {
    cloudApi.downloadFile({
      fileID,
      success: (res) => resolve(res.tempFilePath || ''),
      fail: () => resolve('')
    })
  })
}

export async function resolveImagePath(source, prefix = 'image') {
  const value = String(source || '').trim()
  if (!value) return ''
  if (value.startsWith('data:image/')) return dataUriToTempFilePath(value, prefix)
  if (value.startsWith('cloud://')) return downloadCloudImage(value)
  if (/^https?:\/\//.test(value)) return downloadHttpImage(value)
  return value
}
