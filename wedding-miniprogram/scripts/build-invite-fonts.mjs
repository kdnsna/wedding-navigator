#!/usr/bin/env node
/**
 * 生成小程序请柬用的字体（WOFF，Data URL 打进主包）：
 *   - 马善政：只保留 config/invite.js 里用马善政显示的汉字（开场名字、故事、山海、所爱隔山海、请柬、指南标题、回执标题、尾声）
 *   - Cormorant Garamond / Pinyon Script：沿用 H5 已经子集化的拉丁字符，转成 WOFF（低版本 iOS 不认 WOFF2）
 * 输出：config/invite-fonts.js（base64）+ invite-assets/fonts/*.woff（以后想放云存储 / CDN 走 https 时直接上传）
 *
 * 依赖：python3 + fonttools（pip install fonttools brotli）
 * 用法：node scripts/build-invite-fonts.mjs [--h5 /path/to/our-wedding] [--mashanzheng /path/MaShanZheng-Regular.ttf]
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const arg = (name, dflt) => {
  const i = process.argv.indexOf(name)
  return i > -1 ? process.argv[i + 1] : dflt
}
const h5 = arg('--h5', '/workspace/our-wedding')
const msz = arg('--mashanzheng', '/usr/share/fonts/truetype/sand-box/google/Ma Shan Zheng/MaShanZheng-Regular.ttf')

const src = fs.readFileSync(path.join(root, 'config/invite.js'), 'utf8')
const { default: C } = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'))

const join = (lines) => lines.map((l) => (Array.isArray(l) ? l.map((s) => s.t).join('') : l)).join('')
const brushText = [
  C.groomName, C.brideName, '×·',
  C.opening.sub2,
  join(C.story.lines),
  C.journey.lead, join(C.journey.lines),
  join(C.interlude.lines),
  C.invitation.zh, join(C.invitation.venueLines),
  C.guide.title,
  C.rsvp.sheetTitle, C.contacts.map((c) => c.name).join(''),
  join(C.ending.lines),
  C.music && C.music.enabled ? C.music.title || '' : ''
].join('')
const glyphs = [...new Set([...brushText])].filter((ch) => ch.trim()).sort().join('')

const outDir = path.join(root, 'invite-assets/fonts')
fs.mkdirSync(outDir, { recursive: true })
const py = (code) => execFileSync('python3', ['-c', code], { stdio: ['ignore', 'pipe', 'inherit'] }).toString()

// 1) 马善政子集 → WOFF + WOFF2
fs.writeFileSync('/tmp/invite-glyphs.txt', glyphs)
for (const flavor of ['woff', 'woff2']) {
  execFileSync('pyftsubset', [msz, '--text-file=/tmp/invite-glyphs.txt', `--flavor=${flavor}`,
    '--layout-features=*', '--no-hinting', '--desubroutinize',
    `--output-file=${path.join(outDir, `MaShanZheng-invite.${flavor}`)}`], { stdio: 'inherit' })
}
// 2) 拉丁字体：H5 的 woff2 子集换壳成 woff
const latin = {
  cormorant: path.join(h5, 'assets/fonts/CormorantGaramond-500-latin.woff2'),
  pinyon: path.join(h5, 'assets/fonts/PinyonScript-latin.woff2')
}
const outName = { cormorant: 'CormorantGaramond-500-latin', pinyon: 'PinyonScript-latin', mashanzheng: 'MaShanZheng-invite' }
for (const [key, file] of Object.entries(latin)) {
  py(`from fontTools.ttLib import TTFont
f=TTFont(${JSON.stringify(file)}); f.flavor='woff'; f.save(${JSON.stringify(path.join(outDir, outName[key] + '.woff'))})`)
}

const data = {}
for (const key of Object.keys(outName)) {
  const buf = fs.readFileSync(path.join(outDir, outName[key] + '.woff'))
  data[key] = buf.toString('base64')
  console.log(`${outName[key]}.woff  ${(buf.length / 1024).toFixed(1)} KB`)
}
const banner = `// 自动生成：node scripts/build-invite-fonts.mjs —— 请勿手改\n// 马善政子集 ${[...glyphs].length} 字：${glyphs}\n// 许可：三款字体均为 SIL Open Font License 1.1（见 invite-assets/fonts/LICENSES.txt）\n`
fs.writeFileSync(path.join(root, 'config/invite-fonts.js'),
  banner + 'export default ' + JSON.stringify(data, null, 0).replace(/","/g, '",\n"') + '\n')
console.log(`glyphs: ${[...glyphs].length}`)
