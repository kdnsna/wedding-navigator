<template>
  <view class="inv" :class="{ reduced: reducedMotion }">
    <!-- 开场 A：门启，光至。长页在进入故事后才挂载，首屏只取 opening-couple。 -->
    <view v-if="!entered" class="opening" :class="[phase, { reduced: reducedMotion }]">
      <view class="scene">
        <view class="layer" :style="P.opening.layer">
          <image
            v-if="srcOf('opening')"
            class="img"
            :style="P.opening.img"
            :src="srcOf('opening')"
            :alt="P.opening.alt"
            mode="scaleToFill"
            webp
            @error="onErr('opening')"
          />
          <view v-if="isFailed('opening')" class="img-fallback">
            <text>照片暂时未能加载</text>
            <button class="retry-btn" hover-class="hit-on" @tap="retryPhoto('opening')">重新加载</button>
          </view>
        </view>
      </view>

      <view class="door left">
        <view class="door-copy" :style="{ top: doorTop + 'px' }">
          <view class="eyebrow">婚礼请柬</view>
          <view class="door-names">
            <view>{{ C.groomName }}</view>
            <view class="amp">{{ amp }}</view>
            <view>{{ C.brideName }}</view>
          </view>
          <view class="door-invite">
            <view v-for="(line, i) in inviteLines" :key="i">{{ line }}</view>
          </view>
        </view>
      </view>

      <view class="door right">
        <view class="door-facts" :style="{ top: factsTop + 'px' }">
          <view class="door-date">{{ C.opening.date }}</view>
          <view class="door-time">
            <view>{{ weekShort }}</view>
            <view>{{ timeCompact }}</view>
          </view>
          <view class="door-venue">
            <view>{{ placeCity }}</view>
            <view>{{ hotelName }}</view>
            <view>{{ lawn }}</view>
          </view>
        </view>
        <view class="door-note" :style="{ bottom: noteBottom + 'px' }">
          <view v-for="(line, i) in noteLines" :key="i">{{ line }}</view>
        </view>
      </view>

      <view class="cover-actions">
        <button class="hit open-btn" hover-class="hit-on" @tap="openDoors">
          <text>开启请柬</text>
          <text class="glyph">↔</text>
        </button>
      </view>

      <view class="after-info">
        <view class="after-head">
          <view class="after-names">
            <view class="after-title">
              <text>{{ C.groomName }}</text>
              <text class="amp inline"> {{ amp }} </text>
              <text>{{ C.brideName }}</text>
            </view>
            <view class="after-invite">{{ C.invitation.zh }}</view>
          </view>
          <button class="hit enter-btn" hover-class="hit-on" @tap="enterStory">
            <text>进入故事</text>
            <text class="glyph">↓</text>
          </button>
        </view>
        <view class="after-facts">
          <view class="after-date">{{ C.opening.date }} · {{ weekShort }} · {{ timeCompact }}</view>
          <view class="after-venue">{{ placeCity }} · {{ hotelName }} · {{ lawn }}</view>
          <view class="after-address">{{ C.venue.address }}</view>
        </view>
        <button v-if="musicOn" class="text-hit after-music" hover-class="hit-on" @tap="toggleMusic">
          {{ openMusicLabel }}
        </button>
      </view>
    </view>

    <block v-if="entered">
      <!-- 02 来处与相遇 -->
      <view id="story" class="origins" :style="{ height: winH + 'px' }">
        <view class="eyebrow abs" :style="{ top: eyebrowTop + 'px', left: '48rpx' }">{{ C.story.tag }}</view>
        <view class="story-h1" :style="{ top: y(130) }">
          <view>{{ storyText(0) }}</view>
          <view class="ln2">{{ storyText(1) }}</view>
        </view>
        <view class="origin-meta" :style="{ top: y(302) }">
          <view>{{ originA }}</view>
          <view>{{ originB }}</view>
        </view>
        <view class="gold-line abs" :style="{ top: y(391) }" />
        <view class="shot glance" :style="{ height: box.glance + 'px' }">
          <view class="layer" :style="P.glance.layer">
            <image v-if="srcOf('glance')" class="img" :style="P.glance.img" :src="srcOf('glance')" :alt="P.glance.alt" mode="scaleToFill" webp lazy-load @error="onErr('glance')" />
            <view v-if="isFailed('glance')" class="img-fallback"><text>照片暂时未能加载</text><button class="retry-btn" hover-class="hit-on" @tap="retryPhoto('glance')">重新加载</button></view>
          </view>
        </view>
      </view>

      <view class="city">
        <view class="eyebrow wine">{{ originA }} · {{ originB }}</view>
        <view class="city-h">
          <view>{{ storyText(2) }}</view>
          <view class="stop">
            <view v-for="(line, i) in stopLines" :key="i">{{ line }}</view>
          </view>
        </view>
      </view>

      <view class="shot" :style="{ height: box.portrait + 'px' }">
        <view class="layer" :style="P.story1.layer">
          <image v-if="srcOf('story1')" class="img" :style="P.story1.img" :src="srcOf('story1')" :alt="P.story1.alt" mode="scaleToFill" webp lazy-load @error="onErr('story1')" />
          <view v-if="isFailed('story1')" class="img-fallback"><text>照片暂时未能加载</text><button class="retry-btn" hover-class="hit-on" @tap="retryPhoto('story1')">重新加载</button></view>
        </view>
      </view>

      <view class="meaning">
        <view class="meaning-h">
          <view>{{ storyText(4) }}</view>
          <view>{{ togetherLine }}</view>
        </view>
      </view>

      <view class="depart-copy">
        <view v-for="(line, i) in departLines" :key="i">{{ line }}</view>
      </view>
      <view class="shot" :style="{ height: box.depart + 'px' }">
        <view class="layer" :style="P.departure.layer">
          <image v-if="srcOf('departure')" class="img" :style="P.departure.img" :src="srcOf('departure')" :alt="P.departure.alt" mode="scaleToFill" webp lazy-load @error="onErr('departure')" />
          <view v-if="isFailed('departure')" class="img-fallback"><text>照片暂时未能加载</text><button class="retry-btn" hover-class="hit-on" @tap="retryPhoto('departure')">重新加载</button></view>
        </view>
      </view>
      <view class="next on-deep" hover-class="next-on" aria-role="button" @tap="go('#shanhai')">
        <text>03 · 山海</text>
        <text class="next-arrow">→</text>
      </view>

      <!-- 03 山与海 -->
      <view id="shanhai" class="mountain" :style="{ height: winH + 'px' }">
        <view class="layer" :style="P.mountain.layer">
          <image v-if="srcOf('mountain')" class="img" :style="P.mountain.img" :src="srcOf('mountain')" :alt="P.mountain.alt" mode="scaleToFill" webp lazy-load @error="onErr('mountain')" />
          <view v-if="isFailed('mountain')" class="img-fallback"><text>照片暂时未能加载</text><button class="retry-btn" hover-class="hit-on" @tap="retryPhoto('mountain')">重新加载</button></view>
        </view>
        <view class="eyebrow abs on-sky" :style="{ top: eyebrowTop + 'px', left: '48rpx' }">03 · 奔赴山海</view>
        <view class="character mountain-char" :style="{ top: y(105) }">山</view>
        <view class="mountain-note" :style="{ height: box.mountainNote + 'px' }">{{ C.interlude.lines[0] }}</view>
      </view>

      <view class="invite-pause">
        <view class="gold-line" />
        <view class="pause-copy">{{ shanhaiInvite }}</view>
      </view>

      <view id="sea" class="sea light-status">
        <view class="sea-head" :style="{ height: box.seaHead + 'px' }">
          <view class="eyebrow">{{ C.opening.sub2 }}</view>
          <view class="character">海</view>
          <view v-if="musicOn" class="sea-music">{{ C.music.credit }}</view>
        </view>
        <view class="shot" :style="{ height: box.sea + 'px' }">
          <view class="layer" :style="P.sea.layer">
            <image v-if="srcOf('sea')" class="img" :style="P.sea.img" :src="srcOf('sea')" :alt="P.sea.alt" mode="scaleToFill" webp lazy-load @error="onErr('sea')" />
            <view v-if="isFailed('sea')" class="img-fallback"><text>照片暂时未能加载</text><button class="retry-btn" hover-class="hit-on" @tap="retryPhoto('sea')">重新加载</button></view>
          </view>
        </view>
        <view class="sea-quote" :style="{ height: box.seaQuote + 'px' }">
          <view>{{ C.interlude.lines[1] }}</view>
          <view class="sea-small">{{ C.ending.lines[0] }}</view>
        </view>
      </view>

      <view class="evidence">
        <view class="shot" :style="{ height: box.evidence + 'px' }">
          <view class="layer" :style="P.evidence.layer">
            <image v-if="srcOf('evidence')" class="img" :style="P.evidence.img" :src="srcOf('evidence')" :alt="P.evidence.alt" mode="scaleToFill" webp lazy-load @error="onErr('evidence')" />
            <view v-if="isFailed('evidence')" class="img-fallback"><text>照片暂时未能加载</text><button class="retry-btn" hover-class="hit-on" @tap="retryPhoto('evidence')">重新加载</button></view>
          </view>
        </view>
        <view class="evidence-cap">
          <text class="evidence-place">{{ placeCity }}</text>
          <text>荣成海湾</text>
        </view>
      </view>
      <view class="next on-ivory" hover-class="next-on" aria-role="button" @tap="go('#guide')">
        <text>04 · 赴约指南</text>
        <text class="next-arrow">→</text>
      </view>

      <!-- 04 赴约指南 -->
      <view id="guide">
        <view id="guide-hero" class="hero" :style="{ paddingTop: eyebrowTop + 'px' }">
          <view class="eyebrow wine">04 · 赴约指南</view>
          <view class="hero-names">
            <text>{{ C.groomName }}</text>
            <text class="amp inline"> {{ amp }} </text>
            <text>{{ C.brideName }}</text>
          </view>
          <view class="hero-invite">{{ C.invitation.zh }}</view>
          <view class="date-lockup">
            <view class="day">{{ monthDay }}</view>
            <view class="year">
              <view>{{ C.date.y }}</view>
              <view>{{ weekShort }}</view>
            </view>
          </view>
          <view class="hero-time">{{ timeCompact }}</view>
          <view class="hero-venue">
            <view v-for="(line, i) in C.invitation.venueLines" :key="i">{{ line }}</view>
          </view>
          <view class="hero-address" user-select selectable>{{ C.venue.address }}</view>
          <button class="text-hit share-link" open-type="share" hover-class="hit-on">
            <text>把请柬发给好友</text>
            <view class="ne" />
          </button>
          <button class="hit map-btn" hover-class="hit-on" @tap="openMap">
            <text>{{ C.invitation.mapLabel }}</text>
            <view class="ne light" />
          </button>
        </view>

        <view id="guide-rest">
          <view class="guide">
            <view class="guide-title">{{ C.guide.title }}</view>
            <view v-for="block in timeline" :key="block.date" class="tl-row">
              <view class="tl-date">{{ block.date }}</view>
              <view class="tl-copy">
                <view class="tl-title">{{ block.title }}</view>
                <view v-for="(line, j) in block.lines" :key="j" class="tl-p">
                  <text v-for="(s, k) in line" :key="k" :class="{ b: s.b }">{{ showSeg(s.t) }}</text>
                </view>
              </view>
            </view>

            <view class="details">
              <view v-for="(item, i) in details" :key="item.title" class="detail">
                <view class="summary" hover-class="summary-on" aria-role="button" :aria-expanded="item.open ? 'true' : 'false'" @tap="toggleDetail(i)">
                  <text>{{ item.title }}</text>
                  <text class="mark">{{ item.open ? '−' : '＋' }}</text>
                </view>
                <view v-show="item.open" class="detail-body">
                  <view v-for="(line, j) in item.lines" :key="j" class="detail-p">
                    <text v-for="(s, k) in line" :key="k" :class="{ b: s.b }">{{ showSeg(s.t) }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <view class="contacts">
            <view class="contacts-title">联系我们</view>
            <view class="contacts-intro">{{ contactsIntro }}</view>
            <view v-for="c in C.contacts" :key="c.tel" class="person">
              <view class="person-head">
                <view class="person-name">{{ c.name }}</view>
                <view class="person-tel" user-select selectable hover-class="text-on" @tap="call(c.tel)">{{ c.tel }}</view>
              </view>
              <view class="person-actions">
                <view class="call" hover-class="text-on" aria-role="button" @tap="call(c.tel)">拨打电话</view>
                <view v-if="c.wechat" class="wechat-row">
                  <text user-select selectable>微信 {{ c.wechat }}</text>
                  <button class="copy-btn" hover-class="hit-on" @tap="copyWechat(c.wechat)">
                    {{ copyState === 'copied' ? '已复制' : copyState === 'failed' ? '请长按' : '复制' }}
                  </button>
                </view>
                <view v-else class="phone-only">仅电话联系</view>
              </view>
              <view v-if="c.wechat && copyNote" class="copy-note">{{ copyNote }}</view>
            </view>
          </view>

          <view class="next on-deep" hover-class="next-on" aria-role="button" @tap="go('#finale')">
            <text>05 · 归处</text>
            <text class="next-arrow">→</text>
          </view>
        </view>
      </view>

      <!-- 05 归处 -->
      <view id="finale" class="finale light-status">
        <view class="final-photo" :style="{ height: winH + 'px' }">
          <view class="layer" :style="P.finale.layer">
            <image v-if="srcOf('finale')" class="img" :style="P.finale.img" :src="srcOf('finale')" :alt="P.finale.alt" mode="scaleToFill" webp lazy-load @error="onErr('finale')" />
            <view v-if="isFailed('finale')" class="img-fallback"><text>照片暂时未能加载</text><button class="retry-btn" hover-class="hit-on" @tap="retryPhoto('finale')">重新加载</button></view>
          </view>
          <view class="eyebrow abs on-finale" :style="{ top: eyebrowTop + 'px', left: '48rpx' }">05 · 归处</view>
          <view class="final-words" :style="{ top: y(130) }">
            <view v-for="(line, i) in finaleLines" :key="i">{{ line }}</view>
          </view>
        </view>
        <view class="thanks">
          <view class="thanks-quote">
            <view v-for="(line, i) in thanksLines" :key="i">{{ line }}</view>
          </view>
          <view class="thanks-names">
            <text>{{ C.groomName }}</text>
            <text class="amp inline"> {{ amp }} </text>
            <text>{{ C.brideName }}</text>
          </view>
          <view class="thanks-date">{{ C.opening.date }} · {{ placeCity }}</view>
          <view v-if="musicOn" class="letter-end">
            <view class="music-title">《{{ C.music.title }}》</view>
            <view class="music-credit">{{ C.music.credit }}</view>
            <button class="text-hit finale-music" hover-class="hit-on" @tap="toggleMusic">{{ endMusicLabel }}</button>
          </view>
          <button class="finale-share" open-type="share" hover-class="hit-on">
            <text>把这封请柬发给好友</text>
            <view class="ne light" />
          </button>
        </view>
        <view class="footer">
          <view>{{ C.opening.sub2 }}</view>
          <view>{{ C.opening.date }} · {{ placeCity }}</view>
        </view>
      </view>

      <button v-if="musicOn && !finaleVisible" class="music-fab" :class="{ 'above-map': mapBarOn }" hover-class="music-fab-on" :aria-label="musicFabLabel" @tap="toggleMusic">
        {{ musicFabLabel }}
      </button>
      <view class="map-bar" :class="{ visible: mapBarOn, 'with-music': musicOn && !finaleVisible }">
        <button class="hit map-btn center" hover-class="hit-on" @tap="openMap">
          <text>{{ C.invitation.mapLabel }}</text>
          <view class="ne light" />
        </button>
      </view>
    </block>

    <canvas canvas-id="shareCanvas" id="shareCanvas" class="share-canvas" :style="{ width: '750px', height: '600px' }" />
  </view>
</template>

<script setup>
import { ref, reactive, computed, getCurrentInstance, nextTick } from 'vue'
import { onLoad, onReady, onShow, onHide, onPageScroll, onShareAppMessage, onShareTimeline, onUnload } from '@dcloudio/uni-app'
import CONFIG from '@/config/invite.js'
import { layoutPhoto } from '@/utils/invite-photo.js'

const C = CONFIG
const amp = '&'
const inst = getCurrentInstance()

function windowInfo() {
  try {
    if (uni.getWindowInfo) return uni.getWindowInfo()
  } catch (e) { /* noop */ }
  return uni.getSystemInfoSync()
}
const win = windowInfo()
const W = win.windowWidth || 390
const winH = win.windowHeight || 844
const dpr = win.pixelRatio || 2
const safeBottom = Math.max(0, winH - ((win.safeArea && win.safeArea.bottom) || winH))

function yPx(designPx) {
  return Math.round((designPx / 844) * winH)
}
function y(designPx) {
  return yPx(designPx) + 'px'
}

let menuBottom = 0
try {
  const rect = uni.getMenuButtonBoundingClientRect && uni.getMenuButtonBoundingClientRect()
  if (rect && rect.bottom) menuBottom = rect.bottom
} catch (e) { /* noop */ }
const statusBar = win.statusBarHeight || 20
const eyebrowTop = Math.max(yPx(27), statusBar + 6)
const doorTop = eyebrowTop
const factsTop = Math.max(yPx(166), menuBottom + 12)
const noteBottom = 120 + safeBottom

const box = {
  glance: yPx(370),
  portrait: yPx(590),
  depart: yPx(330),
  mountainNote: yPx(164),
  seaHead: yPx(280),
  sea: yPx(300),
  seaQuote: yPx(264),
  evidence: yPx(218)
}

const P = {
  opening: layoutPhoto('openingCouple', W, winH, { dpr, maxEdge: 1200 }),
  glance: layoutPhoto('storyGlance', W, box.glance, { dpr, maxEdge: 1200 }),
  story1: layoutPhoto('story1', W, box.portrait, { dpr, maxEdge: 750 }),
  departure: layoutPhoto('departure', W, box.depart, { dpr, maxEdge: 1200 }),
  mountain: layoutPhoto('gallery7', W, winH, { dpr, maxEdge: 1200 }),
  sea: layoutPhoto('interlude', W, box.sea, { dpr, maxEdge: 1200 }),
  evidence: layoutPhoto('journey2', W, box.evidence, { dpr, maxEdge: 1080 }),
  finale: layoutPhoto('gallery8', W, winH, { dpr, maxEdge: 1200 })
}

const failed = reactive({})
function srcOf(key) {
  const shot = P[key]
  if (!shot) return ''
  if ((failed[key] || 0) >= 2) return ''
  if (failed[key] === 1) return shot.fallback
  return shot.src
}
function onErr(key) {
  const shot = P[key]
  const next = (failed[key] || 0) + 1
  failed[key] = shot && shot.fallback === shot.src && next === 1 ? 2 : next
}
function isFailed(key) {
  return (failed[key] || 0) >= 2
}
function retryPhoto(key) {
  if (P[key]) failed[key] = 0
}

function readReducedMotion() {
  const bags = []
  try { if (typeof uni.getSystemSetting === 'function') bags.push(uni.getSystemSetting() || {}) } catch (e) { /* noop */ }
  try { if (typeof uni.getAppBaseInfo === 'function') bags.push(uni.getAppBaseInfo() || {}) } catch (e) { /* noop */ }
  try { bags.push((uni.getSystemInfoSync && uni.getSystemInfoSync()) || {}) } catch (e) { /* noop */ }
  return bags.some((info) => info.reducedMotion === 'reduce' || info.reducedMotion === true || info.prefersReducedMotion === true)
}
const reducedMotion = ref(readReducedMotion())

const phase = ref('closed')
const entered = ref(false)

const weekShort = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(C.date.y, C.date.m - 1, C.date.d).getDay()]
const timeCompact = C.ceremonyTime.replace(/\s+/g, '')
const monthDay = C.date.m + '.' + String(C.date.d).padStart(2, '0')
const inviteLines = C.invitation.zh.split(/(?<=，)/)
const noteLines = C.opening.sub2.split(/(?<=，)/)
const placeCity = C.invitation.venueLines[0].split('·').pop().trim()
const venuePair = C.invitation.venueLines[1].split('·').map((s) => s.trim())
const hotelName = venuePair[0]
const lawn = venuePair[1] || ''

function storyText(i) {
  return (C.story.lines[i] || []).map((s) => s.t).join('')
}
const originA = C.story.origins[0]
const originBits = String(C.story.origins[1] || '').split('·').map((s) => s.trim())
const originB = originBits[0] || ''
const together = originBits[1] || ''
const togetherLine = together ? (together.endsWith('。') ? together : together + '。') : ''
const stopLines = (() => {
  const text = storyText(3)
  const at = text.indexOf('停下脚步')
  if (at < 0) return [text]
  return [text.slice(0, at), text.slice(at)]
})()
const departLines = (() => {
  const text = storyText(5)
  const at = text.indexOf('都是为了')
  if (at < 0) return [text]
  return [text.slice(0, at), text.slice(at)]
})()
const shanhaiInvite = C.journey.lines.join('').replace('邀请你，', '邀请你')
const finaleLines = (C.ending.lines[0] || '').split(/(?<=，)/).filter(Boolean)
const thanksLines = (() => {
  const rest = C.ending.lines[2] || ''
  const at = rest.indexOf('，')
  return [C.ending.lines[1], at < 0 ? rest : rest.slice(0, at + 1), at < 0 ? '' : rest.slice(at + 1)].filter(Boolean)
})()

function linesOf(item) {
  return (item.lines || []).filter((line) => Array.isArray(line))
}
const timeline = [
  { date: '11.13', title: '亲友抵达', lines: linesOf(C.guide.items[0]) },
  {
    date: '11.14',
    title: '婚礼当天 · ' + timeCompact,
    lines: linesOf(C.guide.items[1]).filter((line) => {
      const text = line.map((s) => s.t).join('')
      return !text.startsWith('仪式时间') && !text.startsWith('联系人')
    })
  }
]
const details = reactive(C.guide.items.slice(2, 6).map((item, i) => ({
  title: item.title,
  open: i === 0,
  lines: linesOf(item)
})))
function toggleDetail(i) {
  details[i].open = !details[i].open
  nextTick(measureDark)
}
const contactsIntro = (C.guide.items[6].lines[0] || []).map((s) => s.t).join('')
const fill = (t) => String(t).replace('{ceremonyTime}', C.ceremonyTime)
const showSeg = (t) => fill(t).replace('点击上方「婚礼地点导航」', '点击下方「婚礼地点导航」')

const heroGone = ref(false)
const guideVisible = ref(false)
const finaleVisible = ref(false)
const mapBarOn = computed(() => heroGone.value && guideVisible.value)
let observers = []
let measureTimer = 0
function makeObserver(opts) {
  const scope = inst.proxy && inst.proxy.$scope
  if (scope && typeof scope.createIntersectionObserver === 'function') return scope.createIntersectionObserver(opts)
  return uni.createIntersectionObserver(inst.proxy, opts)
}
function observeGuide() {
  if (typeof uni.createIntersectionObserver !== 'function') return
  observers.forEach((item) => item.disconnect && item.disconnect())
  observers = []
  const hero = makeObserver({ thresholds: [0] })
  hero.relativeToViewport().observe('#guide-hero', (res) => {
    const bottom = (res.boundingClientRect || {}).bottom || 0
    heroGone.value = !(res.intersectionRatio > 0) && bottom < 1
  })
  observers.push(hero)
  const rest = makeObserver({ thresholds: [0] })
  rest.relativeToViewport().observe('#guide-rest', (res) => {
    guideVisible.value = res.intersectionRatio > 0
  })
  observers.push(rest)
  const finale = makeObserver({ thresholds: [0] })
  finale.relativeToViewport().observe('#finale', (res) => {
    finaleVisible.value = res.intersectionRatio > 0
  })
  observers.push(finale)
}

let darkZones = []
let statusLight = false
let guideGeometry = null
function measureDark() {
  const q = uni.createSelectorQuery().in(inst.proxy)
  q.select('#sea').boundingClientRect()
  q.select('#finale').boundingClientRect()
  q.select('#guide-hero').boundingClientRect()
  q.select('#guide-rest').boundingClientRect()
  q.selectViewport().scrollOffset()
  q.exec((res) => {
    if (!res || !res[4]) return
    const scrollTop = res[4].scrollTop || 0
    darkZones = [res[0], res[1]].filter(Boolean).map((rect) => ({
      a: rect.top + scrollTop,
      b: rect.bottom + scrollTop
    }))
    if (res[2] && res[3]) {
      guideGeometry = {
        heroBottom: res[2].bottom + scrollTop,
        restTop: res[3].top + scrollTop,
        restBottom: res[3].bottom + scrollTop
      }
    }
    syncStatus(scrollTop)
  })
}
function syncStatus(scrollTop) {
  if (guideGeometry) {
    heroGone.value = scrollTop >= guideGeometry.heroBottom - 1
    guideVisible.value = scrollTop + winH > guideGeometry.restTop && scrollTop < guideGeometry.restBottom
  }
  const y0 = scrollTop + 8
  const light = darkZones.some((zone) => y0 >= zone.a && y0 < zone.b)
  if (light === statusLight) return
  statusLight = light
  if (typeof uni.setNavigationBarColor !== 'function') return
  uni.setNavigationBarColor({
    frontColor: light ? '#ffffff' : '#000000',
    backgroundColor: light ? '#243D49' : '#F7F2E8',
    fail: () => {}
  })
}
onPageScroll((e) => {
  syncStatus(e.scrollTop || 0)
})

function go(selector) {
  uni.pageScrollTo({ selector, duration: reducedMotion.value ? 0 : 320 })
}
function openDoors() {
  if (phase.value !== 'closed') return
  phase.value = 'opened'
  if (musicOn && !musicPlaying.value) {
    wantPlay = true
    startMusic()
  }
}
function enterStory() {
  entered.value = true
  nextTick(() => {
    observeGuide()
    measureDark()
    clearTimeout(measureTimer)
    measureTimer = setTimeout(measureDark, 600)
  })
}

function openMap() {
  const v = C.venue
  uni.openLocation({
    latitude: v.latitude,
    longitude: v.longitude,
    name: v.name,
    address: v.address,
    scale: v.scale,
    fail: () => {
      uni.setClipboardData({
        data: v.address,
        showToast: false,
        success: () => {
          try { uni.hideToast() } catch (e) { /* noop */ }
          uni.showToast({ title: '地址已复制：' + v.address, icon: 'none' })
        },
        fail: () => {
          uni.showToast({ title: '地址：' + v.address, icon: 'none' })
        }
      })
    }
  })
}
function call(tel) {
  uni.makePhoneCall({
    phoneNumber: String(tel),
    fail: (err) => {
      if (/cancel/i.test(String((err && err.errMsg) || ''))) return
      uni.showToast({ title: '未能打开拨号，请长按号码拨打', icon: 'none' })
    }
  })
}

const copyState = ref('')
const copyNote = computed(() => {
  if (copyState.value === 'copied') return C.rsvp.copied
  if (copyState.value === 'failed') return C.rsvp.copyFailed.replace('{wechat}', wechatId)
  return ''
})
const wechatId = (C.contacts.find((c) => c.wechat) || {}).wechat || ''
function copyWechat(id) {
  uni.setClipboardData({
    data: id,
    showToast: false,
    success: () => {
      try { uni.hideToast() } catch (e) { /* noop */ }
      copyState.value = 'copied'
      uni.showToast({ title: C.rsvp.copied, icon: 'none' })
    },
    fail: () => {
      copyState.value = 'failed'
      uni.showToast({ title: C.rsvp.copyFailed.replace('{wechat}', id), icon: 'none' })
    }
  })
}

const musicOn = !!(C.music && C.music.enabled && C.music.src)
const musicPlaying = ref(false)
const openMusicLabel = computed(() => (musicPlaying.value ? '暂停《' + C.music.title + '》' : '播放《' + C.music.title + '》'))
const endMusicLabel = computed(() => (musicPlaying.value ? '暂停《' + C.music.title + '》' : '播放这封来信的旋律'))
const musicFabLabel = computed(() => (musicPlaying.value ? '暂停音乐' : '播放音乐'))
let audio = null
let wantPlay = false
let hidden = false
function reportMusicError() {
  musicPlaying.value = false
  if (!wantPlay || hidden) return
  wantPlay = false
  uni.showToast({ title: '音乐暂时无法播放，请稍后再试', icon: 'none' })
}
function ensureAudio() {
  if (audio || !musicOn) return audio
  try {
    if (typeof uni.setInnerAudioOption === 'function') uni.setInnerAudioOption({ obeyMuteSwitch: false, fail: () => {} })
    audio = uni.createInnerAudioContext()
  } catch (e) {
    reportMusicError()
    return null
  }
  audio.src = C.music.src
  audio.loop = true
  audio.autoplay = false
  audio.obeyMuteSwitch = false
  audio.volume = typeof C.music.volume === 'number' ? C.music.volume : 0.6
  audio.onPlay(() => { musicPlaying.value = true })
  audio.onPause(() => { musicPlaying.value = false })
  audio.onStop(() => { musicPlaying.value = false })
  audio.onEnded(() => { if (audio && wantPlay && !hidden) audio.play() })
  audio.onError(reportMusicError)
  return audio
}
function startMusic() {
  if (hidden || !ensureAudio()) return
  try { audio.play() } catch (e) { reportMusicError() }
}
function toggleMusic() {
  if (!musicOn) return
  if (musicPlaying.value) {
    wantPlay = false
    if (audio) audio.pause()
  } else {
    wantPlay = true
    startMusic()
  }
}

const SHARE_LOCAL = C.share.imageUrl || '/static/share-card.jpg'
const shareImagePath = ref(SHARE_LOCAL)
function enableShareMenu() {
  if (typeof uni.showShareMenu === 'function') {
    uni.showShareMenu({ withShareTicket: false, menus: ['shareAppMessage', 'shareTimeline'], fail: () => {} })
  }
}
function buildSharePayload(imageUrl) {
  return {
    title: C.share.title,
    desc: C.share.desc,
    path: C.share.path,
    imageUrl: imageUrl || shareImagePath.value || SHARE_LOCAL
  }
}
function prepareShareImage() {
  uni.getImageInfo({
    src: SHARE_LOCAL,
    success: (info) => {
      if (info && info.path) shareImagePath.value = info.path
      try {
        const ctx = uni.createCanvasContext && uni.createCanvasContext('shareCanvas', inst && inst.proxy)
        if (!ctx) return
        const w = info.width || 750
        const h = info.height || 600
        ctx.drawImage(SHARE_LOCAL, 0, 0, w, h)
        ctx.draw(false, () => {
          uni.canvasToTempFilePath({
            canvasId: 'shareCanvas',
            width: w,
            height: h,
            destWidth: 750,
            destHeight: 600,
            fileType: 'jpg',
            quality: 0.92,
            success: (res) => { if (res && res.tempFilePath) shareImagePath.value = res.tempFilePath },
            fail: () => {}
          }, inst && inst.proxy)
        })
      } catch (e) { /* 继续用包内分享图 */ }
    },
    fail: () => { shareImagePath.value = SHARE_LOCAL }
  })
}

onLoad(() => { enableShareMenu() })
onShareAppMessage(() => {
  const sync = buildSharePayload()
  const promise = new Promise((resolve) => {
    let settled = false
    const done = (img) => {
      if (settled) return
      settled = true
      resolve(buildSharePayload(img))
    }
    if (shareImagePath.value && shareImagePath.value !== SHARE_LOCAL) {
      done(shareImagePath.value)
      return
    }
    uni.getImageInfo({
      src: SHARE_LOCAL,
      success: (info) => done((info && info.path) || SHARE_LOCAL),
      fail: () => done(SHARE_LOCAL)
    })
    setTimeout(() => done(shareImagePath.value || SHARE_LOCAL), 1800)
  })
  return { ...sync, promise }
})
onShareTimeline(() => buildSharePayload())
onReady(() => {
  enableShareMenu()
  prepareShareImage()
})
onShow(() => {
  hidden = false
  enableShareMenu()
  if (musicOn && wantPlay && !musicPlaying.value) startMusic()
})
onHide(() => {
  hidden = true
  if (audio && musicPlaying.value) audio.pause()
})
onUnload(() => {
  clearTimeout(measureTimer)
  observers.forEach((item) => item.disconnect && item.disconnect())
  observers = []
  if (audio) {
    try { audio.stop() } catch (e) { /* noop */ }
    audio.destroy()
    audio = null
  }
})
</script>

<style lang="scss">
$iv-ivory: #F7F2E8;
$iv-paper: #FCF9F2;
$iv-ink: #292B2C;
$iv-muted: #5F6263;
$iv-wine: #742F35;
$iv-deep: #243D49;
$iv-gold: #B89B6A;
$iv-hair: #C9C4B9;
$iv-serif: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", "SimSun", serif;
$iv-sans: "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif;
$iv-door: cubic-bezier(0.22, 1, 0.36, 1);

page { background: $iv-ivory; }
.inv {
  background: $iv-ivory;
  color: $iv-ink;
  font-family: $iv-sans;
  font-size: 30rpx;
  line-height: 1.8;
  overflow-x: hidden;
}
.serif { font-family: $iv-serif; }
.eyebrow {
  font-size: 30rpx;
  line-height: 1.5;
  letter-spacing: 0.16em;
}
.eyebrow.abs { position: absolute; z-index: 2; }
.eyebrow.wine { color: $iv-wine; }
.amp { color: $iv-gold; font-weight: 400; font-family: $iv-serif; }
.amp.inline { margin: 0 8rpx; }
.gold-line { width: 68rpx; height: 2rpx; background: $iv-gold; }
.gold-line.abs { position: absolute; left: 48rpx; z-index: 2; }
.b { font-weight: 600; }

button.hit,
button.text-hit,
button.copy-btn,
button.finale-share,
button.retry-btn,
button.music-fab {
  margin: 0;
  border-radius: 0;
  line-height: 1.5;
  font-family: $iv-sans;
  box-sizing: border-box;
}
button.hit::after,
button.copy-btn::after,
button.retry-btn::after { border: none; }
.hit {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: $iv-wine;
  color: $iv-ivory;
  font-size: 32rpx;
  font-weight: 500;
  letter-spacing: 0.04em;
}
.hit-on { opacity: 0.85; }
.text-hit {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: auto;
  min-height: 88rpx;
  padding: 16rpx 0;
  background: transparent;
  color: $iv-wine;
  font-size: 30rpx;
  font-weight: 500;
  letter-spacing: 0.02em;
  text-decoration: none;
}
button.text-hit::after {
  content: "";
  position: absolute;
  top: auto;
  left: 0;
  right: 0;
  bottom: 10rpx;
  width: auto;
  height: 1px;
  border: none;
  border-radius: 0;
  background: rgba(116, 47, 53, 0.62);
  transform: none;
  transform-origin: 0 0;
  pointer-events: none;
}
.shot { position: relative; width: 100%; overflow: hidden; background: #E7E1D4; }
.layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; }
.img { position: absolute; display: block; max-width: none; }
.img-fallback {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #E7E1D4;
  color: $iv-muted;
  font-size: 30rpx;
}
button.retry-btn {
  min-width: 144rpx;
  min-height: 88rpx;
  margin-top: 24rpx;
  padding: 16rpx 28rpx;
  border: 1rpx solid rgba(116, 47, 53, 0.72);
  border-radius: 8rpx 24rpx 8rpx 24rpx;
  background: transparent;
  color: $iv-wine;
  font-size: 30rpx;
  font-weight: 500;
  letter-spacing: 0.04em;
}

.opening {
  position: fixed;
  z-index: 30;
  top: 0; right: 0; bottom: 0; left: 0;
  overflow: hidden;
  background: $iv-ink;
}
.scene { position: absolute; z-index: 0; top: 0; right: 0; bottom: 0; left: 0; overflow: hidden; background: #D8D2C6; }
.door {
  position: absolute;
  z-index: 2;
  top: 0;
  bottom: 0;
  width: calc(50% - 32rpx);
  background: $iv-ivory;
  color: $iv-ink;
  overflow: hidden;
  transition: transform 1.2s $iv-door;
}
.door.left { left: 0; }
.door.right { right: 0; }
.door-copy { position: absolute; right: 24rpx; left: 48rpx; }
.door-names {
  margin-top: 176rpx;
  font-family: $iv-serif;
  font-size: 88rpx;
  font-weight: 600;
  line-height: 1.35;
}
.door-names .amp { display: block; margin: 12rpx 0; font-size: 58rpx; line-height: 1; }
.door-invite { margin-top: 56rpx; font-family: $iv-serif; font-size: 34rpx; line-height: 1.9; }
.door-facts { position: absolute; right: 36rpx; left: 36rpx; }
.door-date { font-family: $iv-serif; font-size: 48rpx; line-height: 1.4; color: $iv-wine; }
.door-time { margin-top: 28rpx; font-size: 32rpx; line-height: 1.9; }
.door-venue { margin-top: 64rpx; font-size: 32rpx; line-height: 2; }
.door-note {
  position: absolute;
  left: 36rpx;
  right: 36rpx;
  font-size: 30rpx;
  line-height: 1.9;
  color: $iv-muted;
}
.cover-actions {
  position: absolute;
  z-index: 5;
  right: 0;
  bottom: calc(78rpx + env(safe-area-inset-bottom));
  left: 0;
  display: flex;
  justify-content: center;
  transition: opacity 0.3s ease, transform 0.5s ease;
}
button.open-btn {
  width: 384rpx;
  min-height: 108rpx;
  padding: 0 36rpx;
  border: 1rpx solid rgba(247, 242, 232, 0.52);
  border-radius: 32rpx 32rpx 12rpx 12rpx;
  box-shadow: 0 8rpx 18rpx rgba(41, 43, 44, 0.12);
}
.open-btn::before {
  content: "";
  position: absolute;
  top: 6rpx;
  right: 6rpx;
  bottom: 6rpx;
  left: 6rpx;
  border: 1rpx solid rgba(247, 242, 232, 0.38);
  border-radius: 26rpx 26rpx 8rpx 8rpx;
  pointer-events: none;
}
.open-btn .glyph {
  flex: none;
  width: 48rpx;
  margin-left: 24rpx;
  font-size: 32rpx;
  font-weight: 400;
  letter-spacing: 0;
  text-align: center;
}
.after-info {
  position: absolute;
  z-index: 4;
  right: 0;
  bottom: 0;
  left: 0;
  min-height: 488rpx;
  padding: 36rpx 48rpx calc(88rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  background: $iv-ivory;
  color: $iv-ink;
  opacity: 0;
  transform: translateY(56rpx);
  transition: opacity 0.45s ease 0.45s, transform 0.45s ease 0.45s;
  pointer-events: none;
}
.after-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16rpx; }
.after-names { flex: 1; min-width: 0; }
.after-title {
  font-family: $iv-serif;
  font-size: 56rpx;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
}
.after-title .amp { font-size: 46rpx; }
.after-invite { margin-top: 4rpx; font-size: 30rpx; line-height: 1.6; }
button.enter-btn {
  flex: none;
  width: 244rpx;
  min-height: 96rpx;
  margin-left: 0;
  padding: 0 20rpx;
  border: 1rpx solid rgba(247, 242, 232, 0.48);
  border-radius: 10rpx 28rpx 10rpx 28rpx;
  box-shadow: 0 4rpx 12rpx rgba(41, 43, 44, 0.08);
  font-size: 30rpx;
  letter-spacing: 0.03em;
  white-space: nowrap;
}
.enter-btn::before {
  content: "";
  position: absolute;
  top: 5rpx;
  right: 5rpx;
  bottom: 5rpx;
  left: 5rpx;
  border: 1rpx solid rgba(247, 242, 232, 0.36);
  border-radius: 6rpx 22rpx 6rpx 22rpx;
  pointer-events: none;
}
.enter-btn .glyph {
  flex: none;
  width: 32rpx;
  margin-left: 16rpx;
  font-size: 30rpx;
  font-weight: 400;
  letter-spacing: 0;
  text-align: center;
}
.after-facts { margin-top: 24rpx; }
.after-date { font-size: 34rpx; line-height: 1.7; color: $iv-wine; font-weight: 600; }
.after-venue { margin-top: 4rpx; font-size: 30rpx; line-height: 1.7; }
.after-address { font-size: 30rpx; line-height: 1.7; color: $iv-muted; }
.after-music {
  position: absolute;
  right: 48rpx;
  bottom: calc(8rpx + constant(safe-area-inset-bottom));
  bottom: calc(8rpx + env(safe-area-inset-bottom));
  min-height: 88rpx;
  padding: 16rpx 0;
}
button.text-hit.after-music::after { background: rgba(116, 47, 53, 0.58); }

.opening.mid .door.left { transform: translateX(-50%); }
.opening.mid .door.right { transform: translateX(50%); }
.opening.mid .cover-actions { opacity: 0; transform: translateY(24rpx); pointer-events: none; }
.opening.mid .after-info { opacity: 1; transform: translateY(0); }
.opening.opened .door.left { transform: translateX(-101%); }
.opening.opened .door.right { transform: translateX(101%); }
.opening.opened .cover-actions { opacity: 0; transform: translateY(24rpx); pointer-events: none; }
.opening.opened .after-info { opacity: 1; transform: translateY(0); pointer-events: auto; }

.origins { position: relative; overflow: hidden; background: $iv-ivory; }
.story-h1 {
  position: absolute;
  z-index: 2;
  left: 48rpx;
  right: 48rpx;
  font-family: $iv-serif;
  font-size: 56rpx;
  font-weight: 500;
  line-height: 1.8;
}
.story-h1 .ln2 { margin-top: 60rpx; margin-left: 68rpx; }
.origin-meta {
  position: absolute;
  z-index: 2;
  right: 48rpx;
  text-align: right;
  font-size: 30rpx;
  line-height: 1.9;
  color: $iv-wine;
}
.glance { position: absolute; right: 0; bottom: 0; left: 0; }

.city { padding: 128rpx 48rpx 144rpx; background: $iv-paper; }
.city-h { margin-top: 48rpx; font-family: $iv-serif; font-size: 56rpx; font-weight: 500; line-height: 2; }
.city-h .stop { margin-top: 40rpx; color: $iv-wine; }
.meaning { padding: 112rpx 48rpx 120rpx; }
.meaning-h { font-family: $iv-serif; font-size: 58rpx; font-weight: 500; line-height: 1.9; }
.depart-copy { padding: 64rpx 48rpx 80rpx; font-family: $iv-serif; font-size: 54rpx; line-height: 1.8; }

.next {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 112rpx;
  padding: 32rpx 48rpx;
  font-size: 30rpx;
  font-weight: 500;
  letter-spacing: 0.08em;
}
.next-on, .summary-on, .text-on { opacity: 0.72; }
.next-arrow {
  display: flex;
  align-items: center;
  flex: none;
  font-size: 40rpx;
  font-weight: 400;
  letter-spacing: 0;
  line-height: 1.5;
}
.next-arrow::before {
  content: "";
  width: 32rpx;
  height: 1px;
  margin-right: 16rpx;
  background: currentColor;
  pointer-events: none;
}
.on-deep { background: $iv-deep; color: $iv-ivory; border-bottom: 1rpx solid rgba(247, 242, 232, 0.24); }
.on-ivory { background: $iv-ivory; color: $iv-wine; border-top: 1px solid $iv-hair; }

.mountain { position: relative; overflow: hidden; background: #D5D0C6; }
.mountain-char {
  position: absolute;
  z-index: 2;
  left: 40rpx;
  font-family: $iv-serif;
  font-size: 184rpx;
  font-weight: 500;
  line-height: 1;
  color: $iv-deep;
}
.on-sky { color: $iv-deep; }
.mountain-note {
  position: absolute;
  z-index: 2;
  right: 0;
  bottom: 0;
  left: 0;
  box-sizing: border-box;
  padding: 72rpx 48rpx;
  background: $iv-ivory;
  font-family: $iv-serif;
  font-size: 62rpx;
  line-height: 1.6;
}
.invite-pause { padding: 112rpx 48rpx 128rpx; background: $iv-paper; }
.invite-pause .gold-line { margin-bottom: 48rpx; }
.pause-copy { max-width: 620rpx; font-family: $iv-serif; font-size: 56rpx; line-height: 1.95; }

.sea { background: $iv-deep; color: $iv-ivory; }
.sea-head { box-sizing: border-box; padding: 56rpx 48rpx 0; }
.sea .character { margin-top: 80rpx; font-family: $iv-serif; font-size: 176rpx; line-height: 1; }
.sea-music { margin-top: 34rpx; font-size: 30rpx; letter-spacing: 0.08em; }
.sea-quote { box-sizing: border-box; padding: 84rpx 48rpx; font-family: $iv-serif; font-size: 72rpx; line-height: 1.6; }
.sea-small { display: block; margin-top: 34rpx; font-family: $iv-sans; font-size: 30rpx; line-height: 1.8; letter-spacing: 0.05em; }
.evidence { padding-top: 80rpx; background: $iv-ivory; }
.evidence-cap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 36rpx 48rpx 50rpx;
  font-size: 30rpx;
}
.evidence-place { font-family: $iv-serif; font-size: 42rpx; font-weight: 500; }

.hero { padding: 0 48rpx 92rpx; background: $iv-paper; }
.hero-names { margin-top: 80rpx; font-family: $iv-serif; font-size: 72rpx; font-weight: 600; line-height: 1.4; }
.hero-names .amp { font-size: 58rpx; }
.hero-invite { margin-top: 26rpx; font-family: $iv-serif; font-size: 36rpx; }
.date-lockup { display: flex; align-items: flex-end; margin-top: 64rpx; color: $iv-wine; }
.day {
  font-family: $iv-serif;
  font-size: 164rpx;
  line-height: 0.95;
  letter-spacing: -0.04em;
}
.year { margin-left: 32rpx; padding-bottom: 10rpx; font-family: $iv-serif; font-size: 44rpx; line-height: 1.45; }
.hero-time { margin-top: 36rpx; font-size: 38rpx; font-weight: 600; }
.hero-venue { margin-top: 40rpx; font-family: $iv-serif; font-size: 40rpx; line-height: 1.85; }
.hero-address { margin-top: 14rpx; color: $iv-muted; font-size: 30rpx; }
.share-link { margin-top: 32rpx; }
button.map-btn {
  width: 100%;
  min-height: 104rpx;
  margin-top: 40rpx;
  padding: 0 36rpx;
  border: 1rpx solid rgba(247, 242, 232, 0.46);
  border-radius: 12rpx 32rpx 12rpx 32rpx;
  box-shadow: 0 4rpx 12rpx rgba(41, 43, 44, 0.08);
}
.map-btn::before {
  content: "";
  position: absolute;
  top: 5rpx;
  right: 5rpx;
  bottom: 5rpx;
  left: 5rpx;
  border: 1rpx solid rgba(247, 242, 232, 0.34);
  border-radius: 8rpx 26rpx 8rpx 26rpx;
  pointer-events: none;
}
.map-btn.center { justify-content: center; margin-top: 0; box-shadow: none; }
.map-btn.center .ne { margin-left: 24rpx; }
.ne {
  position: relative;
  width: 22rpx;
  height: 22rpx;
  margin-left: 12rpx;
  flex: none;
}
.ne::before {
  content: "";
  position: absolute;
  left: 0;
  bottom: 4rpx;
  width: 20rpx;
  height: 2rpx;
  background: $iv-wine;
  transform: rotate(-42deg);
  transform-origin: left center;
}
.ne::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  width: 10rpx;
  height: 10rpx;
  border-top: 2rpx solid $iv-wine;
  border-right: 2rpx solid $iv-wine;
}
.ne.light::before { background: $iv-ivory; }
.ne.light::after { border-top-color: $iv-ivory; border-right-color: $iv-ivory; }

.guide { padding: 112rpx 48rpx 88rpx; }
.guide-title { margin-bottom: 56rpx; font-family: $iv-serif; font-size: 62rpx; font-weight: 500; }
.tl-row { display: flex; margin-bottom: 64rpx; }
.tl-date {
  width: 164rpx;
  flex: none;
  font-family: $iv-serif;
  font-size: 46rpx;
  line-height: 1.4;
  color: $iv-wine;
}
.tl-copy {
  flex: 1;
  min-width: 0;
  margin-left: 36rpx;
  padding-left: 36rpx;
  border-left: 1px solid $iv-gold;
}
.tl-title { font-size: 34rpx; line-height: 1.6; }
.tl-p { margin-top: 18rpx; font-size: 30rpx; line-height: 1.95; }
.detail { border-top: 1px solid $iv-hair; }
.detail:last-child { border-bottom: 1px solid $iv-hair; }
.summary {
  min-height: 128rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 34rpx;
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: 0.04em;
}
.mark {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 40rpx;
  height: 64rpx;
  margin-left: 24rpx;
  border-bottom: 1rpx solid $iv-wine;
  color: $iv-wine;
  font-size: 40rpx;
  font-weight: 400;
  letter-spacing: 0;
  line-height: 1;
}
.detail-body { padding-bottom: 44rpx; font-size: 30rpx; line-height: 1.95; }
.detail-p + .detail-p { margin-top: 24rpx; }

.contacts { padding: 96rpx 48rpx 88rpx; background: $iv-paper; }
.contacts-title { font-family: $iv-serif; font-size: 58rpx; font-weight: 500; }
.contacts-intro { margin-top: 26rpx; font-size: 30rpx; line-height: 1.9; }
.person { padding: 50rpx 0 46rpx; border-bottom: 1px solid $iv-hair; }
.person:first-of-type { margin-top: 38rpx; border-top: 1px solid $iv-hair; }
.person-head { display: flex; align-items: center; justify-content: space-between; }
.person-name { font-family: $iv-serif; font-size: 46rpx; font-weight: 500; }
.person-tel {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-height: 88rpx;
  color: $iv-wine;
  font-size: 36rpx;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  line-height: 1.4;
  text-decoration: none;
}
.person-tel::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 12rpx;
  height: 1px;
  background: rgba(116, 47, 53, 0.58);
  pointer-events: none;
}
.person-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 88rpx;
  margin-top: 16rpx;
  font-size: 30rpx;
}
.call {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-height: 88rpx;
  color: $iv-wine;
  font-weight: 500;
  letter-spacing: 0.02em;
  line-height: 1.5;
  text-decoration: none;
}
.call::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 16rpx;
  height: 1px;
  background: rgba(116, 47, 53, 0.58);
  pointer-events: none;
}
.wechat-row { display: flex; align-items: center; }
button.copy-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: auto;
  min-width: 128rpx;
  min-height: 88rpx;
  margin-left: 16rpx;
  padding: 16rpx 12rpx;
  border: 0;
  border-bottom: 1rpx solid $iv-wine;
  border-radius: 0;
  background: transparent;
  color: $iv-wine;
  font-size: 30rpx;
  font-weight: 500;
  letter-spacing: 0.04em;
}
.phone-only { font-size: 30rpx; line-height: 88rpx; }
.copy-note { margin-top: 14rpx; color: $iv-muted; font-size: 30rpx; }

button.music-fab {
  position: fixed;
  z-index: 21;
  right: 32rpx;
  bottom: calc(24rpx + constant(safe-area-inset-bottom));
  bottom: calc(24rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  min-width: 88rpx;
  min-height: 88rpx;
  padding: 0;
  border: 1rpx solid rgba(247, 242, 232, 0.62);
  border-radius: 50%;
  background: $iv-deep;
  box-shadow: 0 4rpx 12rpx rgba(41, 43, 44, 0.14);
  color: transparent;
  font-size: 0;
  line-height: 0;
  white-space: nowrap;
}
.music-fab::before,
.music-fab::after { pointer-events: none; }
.music-fab::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 44rpx;
  height: 44rpx;
  margin-top: -22rpx;
  margin-left: -22rpx;
  border: 1rpx solid rgba(247, 242, 232, 0.46);
  border-radius: 50%;
}
button.music-fab::after {
  content: "";
  position: absolute;
  top: 50%;
  right: auto;
  bottom: auto;
  left: 50%;
  width: 10rpx;
  height: 10rpx;
  margin-top: -5rpx;
  margin-left: -5rpx;
  border: none;
  border-radius: 50%;
  background: $iv-ivory;
  transform: none;
  transform-origin: 0 0;
}
.music-fab.above-map {
  bottom: calc(28rpx + constant(safe-area-inset-bottom));
  bottom: calc(28rpx + env(safe-area-inset-bottom));
}
.music-fab-on { opacity: 0.82; }
.map-bar {
  position: fixed;
  z-index: 20;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 24rpx 48rpx calc(24rpx + constant(safe-area-inset-bottom));
  padding: 24rpx 48rpx calc(24rpx + env(safe-area-inset-bottom));
  background: $iv-paper;
  border-top: 1px solid #D6D0C5;
  opacity: 0;
  transform: translateY(110%);
  pointer-events: none;
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.map-bar.with-music { padding-right: 224rpx; }
.map-bar.visible { opacity: 1; transform: translateY(0); pointer-events: auto; }
#guide-rest > .next { padding-bottom: calc(52rpx + 184rpx + env(safe-area-inset-bottom)); }

.final-photo { position: relative; overflow: hidden; background: #2A2420; }
.on-finale { color: $iv-ivory; }
.final-words {
  position: absolute;
  z-index: 2;
  left: 48rpx;
  width: 660rpx;
  color: $iv-ivory;
  font-family: $iv-serif;
  font-size: 70rpx;
  font-weight: 500;
  line-height: 1.65;
}
.thanks { padding: 104rpx 48rpx 96rpx; background: $iv-deep; color: $iv-ivory; }
.thanks-quote { font-family: $iv-serif; font-size: 54rpx; line-height: 1.9; }
.thanks-names { margin-top: 64rpx; font-family: $iv-serif; font-size: 58rpx; }
.thanks-names .amp { font-size: 48rpx; }
.thanks-date { margin-top: 18rpx; font-size: 30rpx; letter-spacing: 0.08em; }
.letter-end { margin-top: 64rpx; padding-top: 40rpx; border-top: 1px solid rgba(184, 155, 106, 0.65); }
.music-title { font-family: $iv-serif; font-size: 44rpx; }
.music-credit { margin-top: 10rpx; font-size: 30rpx; line-height: 1.8; }
.finale-music { margin-top: 20rpx; color: $iv-ivory; }
button.text-hit.finale-music::after { background: rgba(247, 242, 232, 0.58); }
button.finale-share {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 104rpx;
  margin-top: 56rpx;
  padding: 26rpx 0;
  border-top: 1px solid rgba(247, 242, 232, 0.4);
  border-bottom: 1px solid rgba(247, 242, 232, 0.4);
  border-left: 0;
  border-right: 0;
  border-radius: 0;
  background: transparent;
  color: $iv-ivory;
  font-size: 32rpx;
  font-weight: 500;
  letter-spacing: 0.04em;
  line-height: 1.5;
  text-align: left;
}
button.finale-share::after {
  content: "";
  position: absolute;
  top: 6rpx;
  right: 0;
  bottom: auto;
  left: auto;
  width: 64rpx;
  height: 1px;
  border: none;
  border-radius: 0;
  background: rgba(247, 242, 232, 0.4);
  transform: none;
  transform-origin: 0 0;
  pointer-events: none;
}
.footer { padding: 54rpx 48rpx 72rpx; background: $iv-deep; color: $iv-ivory; font-size: 30rpx; line-height: 1.8; }
.share-canvas { position: fixed; left: -4000px; top: 0; width: 750px; height: 600px; }

@media (max-width: 350px) {
  .after-head { display: block; }
  button.enter-btn { width: 100%; margin-top: 24rpx; }
}

.opening.reduced .door,
.opening.reduced .cover-actions,
.opening.reduced .after-info,
.reduced .map-bar {
  transition: none;
}
@media (prefers-reduced-motion: reduce) {
  .door,
  .cover-actions,
  .after-info,
  .map-bar {
    animation: none;
    transition: none;
  }
}
</style>
