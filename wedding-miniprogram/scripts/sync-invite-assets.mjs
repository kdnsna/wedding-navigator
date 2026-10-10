#!/usr/bin/env node
/**
 * 核对 / 下载请柬用到的线上资源（照片、字体、分享封面）。
 *   node scripts/sync-invite-assets.mjs              核对：CONFIG 里每个文件在 H5 线上都存在、类型正确
 *   node scripts/sync-invite-assets.mjs --download   另外下载到 invite-assets/cloud/（目录结构与 CONFIG 相同）
 *
 * 换云存储（一步）：下载后把 invite-assets/cloud/our-wedding/ 整个上传到云开发「存储」根目录，
 * 再把 config/invite.js 的 assetBase 改成 'cloud://<环境ID>.<存储桶ID>/our-wedding/'。
 * H5 重新构建后文件名指纹变了（照片内容改了），这里会报出哪一个找不到。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = fs.readFileSync(path.join(root, 'config/invite.js'), 'utf8')
const { default: C } = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'))
const download = process.argv.includes('--download')
const H5 = 'https://kdnsna.github.io/our-wedding/'

const files = new Set()
for (const im of Object.values(C.images)) {
  im.variants.forEach(([, f]) => files.add(f))
  files.add(im.fallback)
}
const extra = [C.share.imageUrl, ...C.fonts.map((f) => f.https)]

let bad = 0
let total = 0
const check = async (url, rel) => {
  const res = await fetch(url, { headers: { Origin: 'https://servicewechat.com' } })
  const type = res.headers.get('content-type') || ''
  const ok = res.ok && /^(image|font)\//.test(type)
  const buf = ok && download ? Buffer.from(await res.arrayBuffer()) : null
  if (!ok) bad++
  console.log(`${ok ? 'ok ' : 'BAD'} ${res.status} ${type.padEnd(11)} ${rel}`)
  if (buf) {
    const out = path.join(root, 'invite-assets/cloud/our-wedding', rel)
    fs.mkdirSync(path.dirname(out), { recursive: true })
    fs.writeFileSync(out, buf)
    total += buf.length
  }
}
for (const f of files) await check(C.assetBase.startsWith('http') ? C.assetBase + f : H5 + f, f)
for (const u of extra) await check(u, u.replace(H5, ''))
if (download) console.log(`downloaded ${(total / 1024 / 1024).toFixed(2)} MB → invite-assets/cloud/our-wedding/`)
if (bad) { console.error(`${bad} file(s) missing or wrong type`); process.exit(1) }
