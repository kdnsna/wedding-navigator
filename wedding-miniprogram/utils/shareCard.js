import { resolveImagePath } from '@/utils/imagePaths.js'

export const DEFAULT_SHARE_IMAGE = '/static/visuals/default-cover.png'

const resolvedImageCache = new Map()

export function getShareImageSource(store) {
  const configured = String(store?.wedding?.share_config?.cover_image || '').trim()
  if (configured) return configured

  const photos = store?.album?.photos || []
  const cover = photos.find(photo => photo?.type === 'cover' && photo?.url)
  return cover?.url || photos.find(photo => photo?.url)?.url || DEFAULT_SHARE_IMAGE
}

export async function prepareShareImage(store) {
  const source = getShareImageSource(store)
  if (!source || source === DEFAULT_SHARE_IMAGE || source.startsWith('/static/')) {
    return source || DEFAULT_SHARE_IMAGE
  }

  if (!resolvedImageCache.has(source)) {
    const pending = resolveImagePath(source, 'share-card')
      .then(path => path || DEFAULT_SHARE_IMAGE)
      .catch(() => DEFAULT_SHARE_IMAGE)
    resolvedImageCache.set(source, pending)
  }

  return resolvedImageCache.get(source)
}
