/**
 * 照片排版计算：小程序 <image> 没有 object-position，这里按 H5 的 object-fit: cover + object-position
 * 算出图片层的宽高和偏移（百分比），再用 mode="scaleToFill" 放进去，比例刚好不变形。
 * 同时按显示宽度 × 像素比挑 H5 已经压好的 WebP 尺寸（等同 H5 的 srcset / sizes）。
 */
import CONFIG from '@/config/invite.js'

export function assetUrl(rel) {
  return CONFIG.assetBase + rel
}

/**
 * @param {string} key      CONFIG.images 的键
 * @param {number} boxW     照片框 CSS 宽度（px）
 * @param {number} boxH     照片框 CSS 高度（px）
 * @param {object} [o]
 * @param {number} [o.layerPct=100] 图片层高度占框高的百分比（所爱隔山海那张是 140%，顶端对齐）
 * @param {number} [o.scale=1]      图片层的放大（视差留余量）
 * @param {number} [o.dpr=2]
 */
export function layoutPhoto(key, boxW, boxH, o = {}) {
  const im = CONFIG.images[key]
  const layerPct = o.layerPct || 100
  const scale = o.scale || 1
  const dpr = Math.min(o.dpr || 2, 3)
  const [px, py] = im.pos
  const Ai = im.w / im.h
  const layerH = (boxH * layerPct) / 100
  const AL = boxW / layerH
  let img
  let renderW
  if (Ai > AL) {
    const wPct = (Ai / AL) * 100
    img = `width:${wPct.toFixed(3)}%;height:100%;left:${(-(wPct - 100) * px).toFixed(3)}%;top:0;`
    renderW = boxW * (Ai / AL)
  } else {
    const hPct = (AL / Ai) * 100
    img = `width:100%;height:${hPct.toFixed(3)}%;left:0;top:${(-(hPct - 100) * py).toFixed(3)}%;`
    renderW = boxW
  }
  const need = renderW * scale * dpr
  const pick = im.variants.find(([w]) => w >= need) || im.variants[im.variants.length - 1]
  return {
    src: assetUrl(pick[1]),
    fallback: assetUrl(im.fallback),
    alt: im.alt,
    layer: `height:${layerPct}%;`,
    img
  }
}
