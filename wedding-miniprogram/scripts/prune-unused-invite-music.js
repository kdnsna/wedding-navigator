#!/usr/bin/env node
/**
 * 构建后只保留 CONFIG.music.src 指向的那一首。
 * 《海风来信》haifeng-laixin.m4a 仍留在 static/music/，这里从 dist 删掉，避免两首一起打进主包。
 * 回退：把 config/invite.js 的 music.src 改回 /static/music/haifeng-laixin.m4a 再构建，本脚本会改留那一首。
 * 不要删除或覆盖仓库里的原文件。
 */
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const dist = path.resolve(root, process.argv[2] || 'dist/build/mp-weixin')
const AUDIO = /\.(mp3|m4a|aac|wav|ogg|flac)$/i

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

;(async () => {
  if (!fs.existsSync(dist)) {
    console.error(`mp-weixin build output is missing: ${dist}`)
    process.exit(1)
  }
  const src = fs.readFileSync(path.join(root, 'config/invite.js'), 'utf8')
  const mod = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'))
  const musicSrc = mod.default && mod.default.music && mod.default.music.src
  if (!musicSrc || !musicSrc.startsWith('/static/music/')) {
    console.error(`CONFIG.music.src 不是包内音频：${musicSrc}`)
    process.exit(1)
  }
  const removed = []
  for (const file of walk(dist)) {
    const rel = path.relative(dist, file)
    if (rel.split(path.sep).includes('cloudfunctions')) continue
    if (!AUDIO.test(file)) continue
    const posix = '/' + rel.split(path.sep).join('/')
    if (posix === musicSrc) continue
    fs.unlinkSync(file)
    removed.push(posix)
  }
  const kept = path.join(dist, musicSrc.slice(1))
  if (!fs.existsSync(kept)) {
    console.error(`要打进包的曲子不在产物里：${musicSrc}`)
    process.exit(1)
  }
  console.log(`invite music prune: keep ${musicSrc}; removed ${removed.join(', ') || '(none)'}`)
})()
