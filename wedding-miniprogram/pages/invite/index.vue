<template>
  <page-meta :page-style="sheetOpen ? 'overflow:hidden;' : ''" />
  <view class="inv" :class="{ ready }">
    <!-- 纸张颗粒 -->
    <view class="grain" :style="{ backgroundImage: art.grain }" />

    <!-- 固定快捷入口 -->
    <view
      v-if="musicOn"
      class="fab fab-music"
      :class="{ on: musicPlaying, lifted: !infoAway }"
      @tap="toggleMusic"
    ><text class="note">♪&#xFE0E;</text></view>
    <view class="fab fab-info" :class="{ 'is-away': infoAway }" @tap="goInvitation">{{ C.infoFab }}</view>

    <!-- ============ 01 · THE OPENING ============ -->
    <view class="act act-opening" id="opening">
      <view class="photo photo-flat hero-photo">
        <view class="layer kb" :class="{ loaded: loaded.hero }" :style="P.hero.layer">
          <image class="img" :style="P.hero.img" :src="srcOf('hero')" mode="scaleToFill" webp
            @load="onLoad('hero')" @error="onErr('hero')" />
        </view>
      </view>
      <view class="veil" />
      <view class="bokeh"><view v-for="n in 6" :key="n" class="bk" :class="'bk' + n" /></view>
      <view class="frame"><view class="frame-in" /></view>
      <view class="opening-copy" :style="openingStyle">
        <view class="opening-names">
          <text>{{ C.groomName }}</text><text class="opening-cross">×</text><text>{{ C.brideName }}</text>
        </view>
        <view class="h1"><view>{{ C.opening.title[0] }}</view><view>{{ C.opening.title[1] }}</view></view>
        <view class="sub">
          <text>{{ C.opening.date }}</text><text class="dot">·</text><text class="place">{{ C.opening.place }}</text>
        </view>
        <view class="sub2">{{ C.opening.sub2 }}</view>
      </view>
      <view class="scroll-hint"><view class="hint-line" /></view>
    </view>

    <!-- ============ 02 · OUR STORY ============ -->
    <view class="act act-story" id="story">
      <view id="rv0" class="act-tag reveal" :class="rc(0)">{{ C.story.tag }}</view>
      <view id="rv1" class="photo photo-shadow story-photo-main reveal" :class="rc(1)">
        <view class="sp" style="padding-top:125%" />
        <view class="layer" :class="{ loaded: loaded.story1 }" :style="P.story1.layer">
          <image class="img" :style="P.story1.img" :src="srcOf('story1')" mode="scaleToFill" webp lazy-load
            @load="onLoad('story1')" @error="onErr('story1')" />
        </view>
      </view>
      <view id="rv2" class="photo photo-shadow story-photo-detail reveal" :class="rc(2)">
        <view class="sp" style="padding-top:100%" />
        <view class="layer" :class="{ loaded: loaded.story2 }" :style="P.story2.layer">
          <image class="img" :style="P.story2.img" :src="srcOf('story2')" mode="scaleToFill" webp lazy-load
            @load="onLoad('story2')" @error="onErr('story2')" />
        </view>
      </view>
      <view class="story-text">
        <view v-for="(line, i) in C.story.lines" :key="i" :id="'rv' + (3 + i)" class="p reveal-line"
          :class="rc(3 + i)" :style="dl(3 + i)">
          <text v-for="(s, j) in line" :key="j" :class="{ em: s.em }">{{ s.t }}</text>
        </view>
      </view>
      <view id="rv9" class="story-names reveal" :class="rc(9)">
        <text>{{ C.story.origins[0] }} </text><text class="mist">×</text><text> {{ C.story.origins[1] }}</text>
      </view>
    </view>

    <!-- ============ 03 · THE JOURNEY ============ -->
    <view class="act act-journey" id="journey">
      <view class="journey-copy" :style="journeyStyle">
        <view id="rv10" class="act-tag reveal" :class="rc(10)">{{ C.journey.tag }}</view>
        <view id="rv11" class="p lead reveal-line" :class="rc(11)" :style="dl(11)">{{ C.journey.lead }}</view>
        <view v-for="(t, i) in C.journey.lines" :key="i" :id="'rv' + (12 + i)" class="p reveal-line"
          :class="rc(12 + i)" :style="dl(12 + i)">{{ t }}</view>
        <view id="rv15" class="journey-place reveal-line" :class="rc(15)" :style="dl(15)">{{ C.journey.place }}</view>
      </view>
      <view class="j-scene" :style="{ height: S.journeyH + 'px' }">
        <view class="j-photo">
          <view class="layer j-layer" :class="{ loaded: loaded.journey1 }" :style="P.journey1.layer">
            <image class="img" :style="P.journey1.img" :src="srcOf('journey1')" mode="scaleToFill" webp lazy-load
              @load="onLoad('journey1')" @error="onErr('journey1')" />
          </view>
          <view class="j-fade-top" />
          <view class="j-fade-bottom" />
        </view>
        <view class="j-waves">
          <view class="j-wave l1" :style="{ backgroundImage: art.waves[0] }" />
          <view class="j-wave l2" :style="{ backgroundImage: art.waves[1] }" />
          <view class="j-wave l3" :style="{ backgroundImage: art.waves[2] }" />
        </view>
      </view>
      <view class="j-after">
        <view id="rv16" class="j-card reveal" :class="rc(16)">
          <view class="matte r-r">
            <view class="photo photo-flat">
              <view class="sp" style="padding-top:75%" />
              <view class="layer" :class="{ loaded: loaded.journey2 }" :style="P.journey2.layer">
                <image class="img" :style="P.journey2.img" :src="srcOf('journey2')" mode="scaleToFill" webp lazy-load
                  @load="onLoad('journey2')" @error="onErr('journey2')" />
              </view>
            </view>
            <view class="figcaption jc-cap">{{ C.journey.postcard }}</view>
          </view>
        </view>
      </view>
    </view>

    <!-- ============ 04 · THE GALLERY ============ -->
    <view class="act act-gallery" id="gallery">
      <view id="rv17" class="act-tag reveal g-tag" :class="rc(17)">{{ C.gallery.tag }}</view>
      <view class="g-grid">
        <view class="g-row">
          <view v-for="g in galleryRows[0]" :key="g.key" :id="'rv' + g.rv" class="g-item reveal" :class="[g.cls, rc(g.rv)]">
            <view class="matte" :class="g.rot">
              <view class="photo photo-flat">
                <view class="sp" :style="{ paddingTop: g.pt }" />
                <view class="layer" :class="{ loaded: loaded[g.key] }" :style="P[g.key].layer">
                  <image class="img" :style="P[g.key].img" :src="srcOf(g.key)" mode="scaleToFill" webp lazy-load
                    @load="onLoad(g.key)" @error="onErr(g.key)" />
                </view>
              </view>
              <view v-if="C.gallery.captions[g.key]" class="figcaption">{{ C.gallery.captions[g.key] }}</view>
            </view>
          </view>
        </view>

        <view id="rv20" class="g-phrase reveal-line" :class="rc(20)" :style="dl(20)">{{ C.gallery.phrases[0] }}</view>

        <view id="rv21" class="g-bleed reveal" :class="rc(21)">
          <view class="photo photo-flat">
            <view class="sp" style="padding-top:62.5%" />
            <view class="layer bleed-layer" :class="{ loaded: loaded.gallery3 }" :style="P.gallery3.layer + par.gallery3">
              <image class="img" :style="P.gallery3.img" :src="srcOf('gallery3')" mode="scaleToFill" webp lazy-load
                @load="onLoad('gallery3')" @error="onErr('gallery3')" />
            </view>
          </view>
        </view>

        <view class="g-row">
          <view v-for="g in galleryRows[1]" :key="g.key" :id="'rv' + g.rv" class="g-item reveal" :class="[g.cls, rc(g.rv)]">
            <view class="matte" :class="g.rot">
              <view class="photo photo-flat">
                <view class="sp" :style="{ paddingTop: g.pt }" />
                <view class="layer" :class="{ loaded: loaded[g.key] }" :style="P[g.key].layer">
                  <image class="img" :style="P[g.key].img" :src="srcOf(g.key)" mode="scaleToFill" webp lazy-load
                    @load="onLoad(g.key)" @error="onErr(g.key)" />
                </view>
              </view>
              <view v-if="C.gallery.captions[g.key]" class="figcaption">{{ C.gallery.captions[g.key] }}</view>
            </view>
          </view>
        </view>

        <view id="rv24" class="g-phrase reveal-line" :class="rc(24)" :style="dl(24)">{{ C.gallery.phrases[1] }}</view>

        <view id="rv25" class="g-bleed g-rings reveal" :class="rc(25)">
          <view class="photo photo-flat">
            <view class="sp" style="padding-top:62.5%" />
            <view class="layer bleed-layer" :class="{ loaded: loaded.gallery6 }" :style="P.gallery6.layer + par.gallery6">
              <image class="img" :style="P.gallery6.img" :src="srcOf('gallery6')" mode="scaleToFill" webp lazy-load
                @load="onLoad('gallery6')" @error="onErr('gallery6')" />
            </view>
          </view>
        </view>

        <view class="g-row">
          <view v-for="g in galleryRows[2]" :key="g.key" :id="'rv' + g.rv" class="g-item reveal" :class="[g.cls, rc(g.rv)]">
            <view class="matte" :class="g.rot">
              <view class="photo photo-flat">
                <view class="sp" :style="{ paddingTop: g.pt }" />
                <view class="layer" :class="{ loaded: loaded[g.key] }" :style="P[g.key].layer">
                  <image class="img" :style="P[g.key].img" :src="srcOf(g.key)" mode="scaleToFill" webp lazy-load
                    @load="onLoad(g.key)" @error="onErr(g.key)" />
                </view>
              </view>
              <view v-if="C.gallery.captions[g.key]" class="figcaption">{{ C.gallery.captions[g.key] }}</view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- ============ 04.5 · 所爱隔山海 ============ -->
    <view class="act interlude" id="interlude" :style="{ height: S.interH + 'px' }">
      <view class="inter-bg">
        <view class="layer inter-layer" :class="{ loaded: loaded.interlude }" :style="P.interlude.layer + par.interlude">
          <image class="img" :style="P.interlude.img" :src="srcOf('interlude')" mode="scaleToFill" webp lazy-load
            @load="onLoad('interlude')" @error="onErr('interlude')" />
        </view>
      </view>
      <view class="inter-veil" />
      <view class="inter-copy">
        <view v-for="(t, i) in C.interlude.lines" :key="i" :id="'rv' + (28 + i)" class="p reveal-line"
          :class="rc(28 + i)" :style="dl(28 + i)">{{ t }}</view>
        <view id="rv30" class="small reveal-line" :class="rc(30)" :style="dl(30)">{{ C.interlude.en }}</view>
      </view>
    </view>

    <!-- ============ 05 · THE INVITATION ============ -->
    <view class="act act-invite" id="invitation">
      <view id="rv31" class="invite-card reveal" :class="rc(31)">
        <view class="card-inner-line" />
        <view class="cn tl" /><view class="cn tr" /><view class="cn bl" /><view class="cn br" />
        <view class="seal"><view class="seal-ring" />{{ seal }}</view>
        <view class="invite-families">{{ C.invitation.families }}</view>
        <view class="h2">{{ C.invitation.title }}</view>
        <view class="invite-zh">{{ C.invitation.zh }}</view>
        <view class="invite-date">
          <view class="day">{{ C.date.d }}</view>
          <view class="ym">{{ C.invitation.month }}</view>
        </view>
        <view class="invite-week">{{ weekday }}</view>
        <view class="invite-line"><view class="diamond" /></view>
        <view class="invite-names">
          <text>{{ C.groomName }}</text><text class="amp">&amp;</text><text>{{ C.brideName }}</text>
        </view>
        <view class="invite-time">婚礼仪式时间：{{ C.ceremonyTime }}</view>
        <view class="invite-venue">
          <view v-for="(t, i) in C.invitation.venueLines" :key="i">{{ t }}</view>
          <view class="small">地址：{{ C.venue.address }}</view>
        </view>
        <view class="invite-line"><view class="diamond" /></view>
        <view class="btn-map" hover-class="btn-map-on" @tap="openMap">
          <text>{{ C.invitation.mapLabel }}</text>
          <view class="arrow">
            <view class="arrow-img a-wine" :style="{ backgroundImage: art.mapArrow.wine }" />
            <view class="arrow-img a-ivory" :style="{ backgroundImage: art.mapArrow.ivory }" />
          </view>
        </view>
        <view class="invite-note">{{ C.invitation.note }}</view>
      </view>

      <!-- 赴约指南 -->
      <view id="rv32" class="guide reveal" :class="rc(32)">
        <view class="guide-title"><text>{{ C.guide.title }}</text></view>
        <view v-for="(item, i) in C.guide.items" :key="i" class="guide-item" :class="{ open: openGuide[i] }">
          <view class="guide-head" @tap="toggleGuide(i)">
            <view class="glabel">
              <view class="gicon" :style="{ backgroundImage: art.guideIcons[item.icon] }" />
              <text>{{ item.title }}</text>
            </view>
            <view class="chev" />
          </view>
          <view class="guide-body" :style="{ maxHeight: guideH[i] + 'px' }">
            <view class="inner" :id="'gb' + i">
              <block v-for="(line, j) in item.lines" :key="j">
                <block v-if="line.contacts">
                  <view v-for="c in C.contacts" :key="c.tel" class="contact-line">
                    <text>{{ c.name }}　</text><text class="tel-link" @tap.stop="call(c.tel)">{{ fmtTel(c.tel) }}</text>
                  </view>
                </block>
                <view v-else class="gline">
                  <text v-for="(s, k) in line" :key="k" :class="{ b: s.b }">{{ fill(s.t) }}</text>
                </view>
              </block>
            </view>
          </view>
        </view>
      </view>

      <!-- 宾客回执（只拨号 / 复制微信，不收集任何信息） -->
      <view id="rv33" class="rsvp reveal" :class="rc(33)">
        <view class="rsvp-p">{{ C.rsvp.prompt }}</view>
        <view class="btn-rsvp" hover-class="btn-rsvp-on" @tap="openSheet">
          <view class="env" :style="{ backgroundImage: art.envelope }" />
          <text>{{ C.rsvp.button }}</text>
        </view>
      </view>
    </view>

    <!-- ============ 06 · THE ENDING ============ -->
    <view class="act act-ending" id="ending">
      <view class="bokeh"><view v-for="n in 6" :key="n" class="bk" :class="'bk' + n" /></view>
      <view class="words">
        <view v-for="(t, i) in C.ending.lines" :key="i" :id="'rv' + (34 + i)" class="p reveal-line"
          :class="rc(34 + i)" :style="dl(34 + i)">{{ t }}</view>
      </view>
      <view id="rv37" class="ending-wave reveal" :class="rc(37)" :style="{ backgroundImage: art.endingWave }" />
      <view id="rv38" class="tail reveal" :class="rc(38)">
        <view>{{ C.ending.date }}</view>
        <view class="names"><text>{{ C.groomName }}</text><text class="amp">&amp;</text><text>{{ C.brideName }}</text></view>
        <view>{{ C.ending.place }}</view>
      </view>
    </view>

    <view class="footer" :class="{ 'has-music': musicOn }">
      <view>{{ C.footer }}</view>
      <view v-if="musicOn && C.music.credit" class="credit">{{ C.music.credit }}</view>
    </view>

    <!-- 回执抽屉：电话 + 微信 -->
    <view class="sheet" :class="{ open: sheetOpen }" @touchmove.stop.prevent="noop">
      <view class="sheet-mask" @tap="closeSheet" />
      <view class="sheet-panel">
        <view class="grip" />
        <view class="sheet-title">{{ C.rsvp.sheetTitle }}</view>
        <view class="sheet-sub"><view v-for="(t, i) in C.rsvp.sheetSub" :key="i">{{ t }}</view></view>
        <view class="sheet-list">
          <view v-for="c in C.contacts" :key="c.tel" class="sheet-person">
            <view class="sheet-name">{{ c.name }}</view>
            <view class="sheet-row">
              <view><text class="k">电话</text><text class="v">{{ fmtTel(c.tel) }}</text></view>
              <view class="sheet-btn solid" hover-class="sheet-btn-on" @tap="call(c.tel)">拨打</view>
            </view>
            <view v-if="c.wechat" class="sheet-row">
              <view><text class="k">微信</text><text class="v">{{ c.wechat }}</text></view>
              <view class="sheet-btn" hover-class="sheet-btn-on" @tap="copyWechat(c.wechat)">复制</view>
            </view>
          </view>
        </view>
        <view class="sheet-close" @tap="closeSheet">{{ C.rsvp.close }}</view>
      </view>
    </view>
    <view class="toast" :class="{ show: toast.show }">{{ toast.msg }}</view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, getCurrentInstance, nextTick } from 'vue'
import { onLoad as onPageLoad, onReady, onPageScroll, onShareAppMessage, onShareTimeline, onUnload } from '@dcloudio/uni-app'
import CONFIG from '@/config/invite.js'
import { layoutPhoto } from './photo.js'
import * as art from '@/utils/invite-art.js'

const C = CONFIG
const inst = getCurrentInstance()

/* ---------- 尺寸（等同 H5 的 vw / vh / sizes） ---------- */
function windowInfo() {
  try {
    if (uni.getWindowInfo) return uni.getWindowInfo()
  } catch (e) { /* noop */ }
  return uni.getSystemInfoSync()
}
const win = windowInfo()
const W = win.windowWidth || 375
const H = win.windowHeight || 667
const dpr = win.pixelRatio || 2

const S = (() => {
  const storyW = Math.min(W, 640) - 52
  const gW = Math.min(W, 760) - 44
  const col = (n) => ((gW - 176) * n) / 12 + (n - 1) * 16
  return {
    heroH: Math.max(H, 560),
    storyW,
    detailW: storyW * 0.52 - 12,
    journeyH: Math.min(W, 620),
    cardW: Math.min(W * 0.48, 250) - 18,
    c7: col(7) - 18,
    c5: col(5) - 18,
    c6: col(6) - 18,
    bleedW: gW + 44,
    interH: Math.max(H * 0.74, 460)
  }
})()

const P = {
  hero: layoutPhoto('hero', W, S.heroH, { dpr }),
  story1: layoutPhoto('story1', S.storyW, S.storyW * 1.25, { dpr }),
  story2: layoutPhoto('story2', S.detailW, S.detailW, { dpr }),
  journey1: layoutPhoto('journey1', W, S.journeyH, { dpr }),
  journey2: layoutPhoto('journey2', S.cardW, S.cardW * 0.75, { dpr }),
  gallery1: layoutPhoto('gallery1', S.c7, (S.c7 * 4) / 3, { dpr }),
  gallery2: layoutPhoto('gallery2', S.c5, (S.c5 * 4) / 3, { dpr }),
  gallery3: layoutPhoto('gallery3', S.bleedW, S.bleedW * 0.625, { dpr, scale: 1.15 }),
  gallery4: layoutPhoto('gallery4', S.c6, S.c6, { dpr }),
  gallery5: layoutPhoto('gallery5', S.c6, S.c6, { dpr }),
  gallery6: layoutPhoto('gallery6', S.bleedW, S.bleedW * 0.625, { dpr, scale: 1.15 }),
  gallery7: layoutPhoto('gallery7', S.c7, (S.c7 * 4) / 3, { dpr }),
  gallery8: layoutPhoto('gallery8', S.c5, (S.c5 * 4) / 3, { dpr }),
  interlude: layoutPhoto('interlude', W, S.interH, { dpr, layerPct: 140, scale: 1.16 })
}

// 画廊三行（与 H5 的 g-a…g-f 排法、旋转、比例一致）；rv = 滚动显现序号（决定 H5 里的错峰延迟）
const galleryRows = [
  [
    { key: 'gallery1', cls: 'g-a', rot: 'r-l', pt: '133.333%', rv: 18 },
    { key: 'gallery2', cls: 'g-b', rot: 'r-r', pt: '133.333%', rv: 19 }
  ],
  [
    { key: 'gallery4', cls: 'g-c', rot: 'r-r', pt: '100%', rv: 22 },
    { key: 'gallery5', cls: 'g-d', rot: 'r-l', pt: '100%', rv: 23 }
  ],
  [
    { key: 'gallery7', cls: 'g-e', rot: 'r-l', pt: '133.333%', rv: 26 },
    { key: 'gallery8', cls: 'g-f', rot: 'r-r', pt: '133.333%', rv: 27 }
  ]
]

/* ---------- 照片：成功淡入；WebP 失败换 JPEG，再失败就留底色 ---------- */
const loaded = reactive({})
const failed = reactive({})
const srcOf = (key) => (failed[key] === 1 ? P[key].fallback : failed[key] === 2 ? '' : P[key].src)
function onLoad(key) {
  loaded[key] = true
  scheduleMeasure()
}
function onErr(key) {
  failed[key] = (failed[key] || 0) + 1
}

/* ---------- 文案辅助 ---------- */
const fmtTel = (t) => t.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1 $2 $3')
const fill = (t) => t.replace('{ceremonyTime}', C.ceremonyTime)
const seal = C.groomName.charAt(0) + ' · ' + C.brideName.charAt(0)
const weekday = (() => {
  const d = new Date(C.date.y, C.date.m - 1, C.date.d)
  return ['SUNDAY · 星期日', 'MONDAY · 星期一', 'TUESDAY · 星期二', 'WEDNESDAY · 星期三', 'THURSDAY · 星期四', 'FRIDAY · 星期五', 'SATURDAY · 星期六'][d.getDay()]
})()

/* ---------- 页面淡入 + 滚动显现（IntersectionObserver，threshold 0.18，同 H5） ---------- */
const ready = ref(false)
const revealed = reactive({})
const rc = (n) => (revealed[n] ? 'in' : '')
// H5：reveal-line 的 transitionDelay = (全局序号 % 6) × 0.12s
const dl = (n) => `transition-delay:${((n % 6) * 0.12).toFixed(2)}s;`

let observers = []
function observeReveals() {
  if (typeof uni.createIntersectionObserver !== 'function') {
    for (let i = 0; i <= 38; i++) revealed[i] = true
    return
  }
  const io = uni.createIntersectionObserver(inst.proxy, { thresholds: [0, 0.18], observeAll: true })
  io.relativeToViewport().observe('.reveal, .reveal-line', (res) => {
    const n = Number(String(res.id || '').replace('rv', ''))
    if (Number.isNaN(n) || revealed[n]) return
    const r = res.boundingClientRect || {}
    if (res.intersectionRatio >= 0.17 || (res.intersectionRatio > 0 && r.height > H)) revealed[n] = true
  })
  observers.push(io)

  // 邀请页进入视口（或已经滚过它到尾声）就收起「婚礼信息」按钮
  const io2 = uni.createIntersectionObserver(inst.proxy, { thresholds: [0] })
  io2.relativeToViewport({ bottom: -Math.round(H * 0.12) }).observe('#invitation', (res) => {
    const top = (res.boundingClientRect || {}).top || 0
    infoAway.value = res.intersectionRatio > 0 || top < 0
  })
  observers.push(io2)
}

/* ---------- 视差：首屏渐隐 / 山海文字 / data-speed 照片（只动 transform、opacity） ---------- */
const scrollY = ref(0)
const pos = reactive({ journeyTop: 0, journeyH: 0, g3Top: 0, g3H: 0, g6Top: 0, g6H: 0, interTop: 0, interH: 0 })
const reduced = false
const openingStyle = computed(() => {
  const y = scrollY.value
  if (reduced || y >= H) return y >= H ? 'opacity:0;' : ''
  const p = y / H
  return `opacity:${Math.max(0, 1 - p * 1.6).toFixed(3)};transform:translateY(${(y * 0.28).toFixed(1)}px);`
})
const journeyStyle = computed(() => {
  const top = pos.journeyTop - scrollY.value
  if (!pos.journeyH || !(top < H && top + pos.journeyH > 0)) return ''
  const p = (H - top) / (H + pos.journeyH)
  return `transform:translateY(${((p - 0.5) * 56).toFixed(1)}px);`
})
function speedStyle(top, h, speed, scale) {
  const t = top - scrollY.value
  if (!h || !(t < H && t + h > 0)) return `transform:scale(${scale});`
  const room = ((scale - 1) / 2) * h - 1
  const raw = (t + h / 2 - H / 2) * speed
  const off = Math.max(-room, Math.min(room, raw))
  return `transform:translateY(${off.toFixed(1)}px) scale(${scale});`
}
const par = reactive({ gallery3: 'transform:scale(1.15);', gallery6: 'transform:scale(1.15);', interlude: 'transform:scale(1.16);' })
function updateParallax() {
  par.gallery3 = speedStyle(pos.g3Top, pos.g3H, 0.09, 1.15)
  par.gallery6 = speedStyle(pos.g6Top, pos.g6H, 0.09, 1.15)
  if (pos.interH) par.interlude = speedStyle(pos.interTop, pos.interH, 0.12, 1.15)
}

let measureTimer = 0
function scheduleMeasure() {
  clearTimeout(measureTimer)
  measureTimer = setTimeout(measure, 160)
}
function measure() {
  const q = uni.createSelectorQuery().in(inst.proxy)
  q.select('#journey').boundingClientRect()
  q.select('#rv21 .photo').boundingClientRect()
  q.select('#rv25 .photo').boundingClientRect()
  q.select('#interlude').boundingClientRect()
  q.selectViewport().scrollOffset()
  q.exec((r) => {
    if (!r || !r[4]) return
    const st = r[4].scrollTop || 0
    const set = (i, k) => {
      if (r[i]) {
        pos[k + 'Top'] = r[i].top + st
        pos[k + 'H'] = r[i].height
      }
    }
    set(0, 'journey'); set(1, 'g3'); set(2, 'g6'); set(3, 'inter')
    scrollY.value = st
    updateParallax()
  })
}

let lastScroll = 0
onPageScroll((e) => {
  const now = Date.now()
  scrollY.value = e.scrollTop
  if (now - lastScroll > 16) {
    lastScroll = now
    updateParallax()
  }
})

/* ---------- 婚礼信息按钮 ---------- */
const infoAway = ref(false)
function goInvitation() {
  uni.pageScrollTo({ selector: '#invitation', duration: 600 })
}

/* ---------- 手风琴 ---------- */
const openGuide = reactive(C.guide.items.map(() => false))
const guideH = reactive(C.guide.items.map(() => 0))
function toggleGuide(i) {
  const open = !openGuide[i]
  openGuide[i] = open
  if (!open) {
    guideH[i] = 0
    return
  }
  uni.createSelectorQuery().in(inst.proxy).select('#gb' + i).boundingClientRect((rect) => {
    guideH[i] = rect ? Math.ceil(rect.height) + 2 : 600
    scheduleMeasure()
  }).exec()
}

/* ---------- 地图导航：openLocation（GCJ-02），失败就复制地址 ---------- */
function openMap() {
  const v = C.venue
  uni.openLocation({
    latitude: v.latitude,
    longitude: v.longitude,
    name: v.name,
    address: v.address,
    scale: v.scale,
    fail: () => copyText(v.address, `地址已复制：${v.address}`, `地址：${v.address}`)
  })
}

/* ---------- 回执抽屉 ---------- */
const sheetOpen = ref(false)
const openSheet = () => { sheetOpen.value = true }
const closeSheet = () => { sheetOpen.value = false }
const noop = () => {}
function call(tel) {
  uni.makePhoneCall({ phoneNumber: tel, fail: () => {} })
}
const toast = reactive({ show: false, msg: '' })
let toastTimer = 0
function showToast(msg) {
  toast.msg = msg
  toast.show = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.show = false }, 2200)
}
function copyText(text, okMsg, failMsg) {
  uni.setClipboardData({
    data: text,
    showToast: false,
    success: () => {
      try { uni.hideToast() } catch (e) { /* noop */ }
      showToast(okMsg)
    },
    fail: () => showToast(failMsg)
  })
}
const copyWechat = (w) => copyText(w, C.rsvp.copied, C.rsvp.copyFailed.replace('{wechat}', w))

/* ---------- 音乐（默认关闭；CONFIG.music.enabled + src 才出现 ♪，只在点按后播放） ---------- */
const musicOn = !!(C.music && C.music.enabled && C.music.src)
const musicPlaying = ref(false)
let audio = null
function toggleMusic() {
  if (!musicOn) return
  if (!audio) {
    audio = uni.createInnerAudioContext()
    audio.src = C.music.src
    audio.loop = true
    audio.onPlay(() => { musicPlaying.value = true })
    audio.onPause(() => { musicPlaying.value = false })
    audio.onStop(() => { musicPlaying.value = false })
  }
  if (musicPlaying.value) audio.pause()
  else audio.play()
}

/* ---------- 分享 ---------- */
onPageLoad(() => {
  if (typeof uni.showShareMenu === 'function') {
    uni.showShareMenu({ withShareTicket: false, menus: ['shareAppMessage', 'shareTimeline'], fail: () => {} })
  }
})
onShareAppMessage(() => ({ title: C.share.title, path: C.share.path, imageUrl: C.share.imageUrl }))
onShareTimeline(() => ({ title: C.share.title, query: '', imageUrl: C.share.imageUrl }))

onReady(() => {
  ready.value = true
  nextTick(() => {
    observeReveals()
    measure()
    // 字体（马善政）晚一点到，排版高度会变：再量两次
    setTimeout(measure, 800)
    setTimeout(measure, 2500)
  })
})
onUnload(() => {
  observers.forEach((o) => o.disconnect && o.disconnect())
  observers = []
  if (audio) audio.destroy()
})
</script>

<style lang="scss">
/* ============================================================
   A LOVE STORY, BY THE SEA（小程序版，逐项对照 H5 index.html）
   配色：象牙白 #F5F0E8 / 纸面白 #FBF7EF / 沙色 #E6DCCB / 酒红 #773747（小字 #5E2A38）/ 海雾蓝 #A9C1CB / 深海蓝 #5F8494 / 墨色 #343A3D
   ============================================================ */
$ivory: #F5F0E8;
$paper: #FBF7EF;
$sand: #E6DCCB;
$ivory-deep: #EDE6D9;
$wine: #773747;
$wine-ink: #5E2A38;
$wine-soft: rgba(119, 55, 71, 0.45);
$mist: #A9C1CB;
$sea-deep: #5F8494;
$graphite: #343A3D;
$serif-en: "Cormorant Garamond", "Baskerville", "Palatino", "Times New Roman", serif;
$serif-cn: "MaShanZheng", "Xingkai SC", "STXingkai", "Kaiti SC", "Songti SC", "Noto Serif SC", serif;
$script-en: "Pinyon Script", "Snell Roundhand", "Savoye LET", "Apple Chancery", cursive;
$script-cn: "MaShanZheng", "Xingkai SC", "STXingkai", "Kaiti SC", cursive;
$sans-cn: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
$ease: cubic-bezier(0.22, 1, 0.36, 1);

page {
  background: $ivory;
}
.inv {
  position: relative;
  background: $ivory;
  color: $graphite;
  font-family: $sans-cn;
  line-height: 1.8;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  opacity: 0;
  transition: opacity 0.9s ease;
}
.inv.ready { opacity: 1; }
.grain {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  z-index: 80;
  pointer-events: none;
}

/* ---------- 照片槽位 ---------- */
.photo {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, $ivory-deep 0%, $sand 50%, $mist 130%);
}
.photo::after {
  content: "";
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  box-shadow: inset 0 0 0 1px rgba(251, 247, 239, 0.55);
  pointer-events: none;
  z-index: 2;
}
.photo-shadow { box-shadow: 0 14px 40px rgba(52, 58, 61, 0.10); }
.sp { width: 100%; height: 0; }
.layer {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%;
  overflow: hidden;
  opacity: 0;
  transition: opacity 1.2s ease, transform 1.4s $ease;
}
.layer.loaded { opacity: 1; }
.img { position: absolute; display: block; max-width: none; }

/* ---------- 漂浮光斑 ---------- */
.bokeh { position: absolute; top: 0; left: 0; right: 0; bottom: 0; overflow: hidden; pointer-events: none; z-index: 2; }
.bk {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(251, 247, 239, 0.9), rgba(251, 247, 239, 0) 70%);
  filter: blur(1px);
  animation: floatUp linear infinite;
  opacity: 0;
}
.bk1 { width: 10px; height: 10px; left: 12%; bottom: 18%; animation-duration: 11s; animation-delay: 0s; }
.bk2 { width: 6px; height: 6px; left: 24%; bottom: 10%; animation-duration: 14s; animation-delay: 3s; }
.bk3 { width: 14px; height: 14px; left: 70%; bottom: 14%; animation-duration: 12s; animation-delay: 1.5s; }
.bk4 { width: 7px; height: 7px; left: 84%; bottom: 26%; animation-duration: 16s; animation-delay: 5s; }
.bk5 { width: 9px; height: 9px; left: 45%; bottom: 8%; animation-duration: 13s; animation-delay: 7s; }
.bk6 { width: 5px; height: 5px; left: 58%; bottom: 30%; animation-duration: 15s; animation-delay: 2.2s; }
@keyframes floatUp {
  0% { transform: translateY(0); opacity: 0; }
  15% { opacity: 0.85; }
  70% { opacity: 0.5; }
  100% { transform: translateY(-46vh); opacity: 0; }
}

/* ---------- 滚动显现 ---------- */
.reveal {
  opacity: 0;
  transform: translateY(36px);
  transition: opacity 1.1s $ease, transform 1.1s $ease;
}
.reveal.in { opacity: 1; transform: translateY(0); }
.reveal-line { opacity: 0; transform: translateY(18px); transition: opacity 0.9s ease, transform 0.9s ease; }
.reveal-line.in { opacity: 1; transform: translateY(0); }

/* ---------- 固定快捷按钮 ---------- */
.fab {
  position: fixed;
  z-index: 90;
  right: 16px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid rgba(119, 55, 71, 0.35);
  background: rgba(245, 240, 232, 0.92);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  color: $wine;
  border-radius: 999px;
  box-shadow: 0 4px 18px rgba(52, 58, 61, 0.12);
  font-family: $sans-cn;
  line-height: 1.8;
}
.fab-info {
  bottom: calc(20px + env(safe-area-inset-bottom));
  padding: 10px 20px;
  font-size: 13px;
  letter-spacing: 0.2em;
  transition: opacity 0.35s ease, transform 0.35s ease;
}
.fab-info:active { transform: scale(0.94); }
.fab-info.is-away { opacity: 0; pointer-events: none; transform: translateY(14px); }
.fab-music {
  bottom: calc(20px + env(safe-area-inset-bottom));
  width: 42px; height: 42px;
  font-size: 15px;
  transition: transform 0.25s ease, bottom 0.35s ease;
}
.fab-music.lifted { bottom: calc(72px + env(safe-area-inset-bottom)); }
.fab-music.on { background: $wine; color: $ivory; border-color: $wine; }
.fab-music.on .note { animation: bob 1.6s ease-in-out infinite; }
.note { display: inline-block; }
@keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }

/* ---------- 幕 通用 ---------- */
.act { position: relative; }
.act-tag {
  display: flex;
  align-items: center;
  font-family: $serif-en;
  font-size: 11px;
  letter-spacing: 0.42em;
  color: $wine-ink;
  text-transform: uppercase;
}
.act-tag::before {
  content: "";
  width: 26px; height: 1px;
  margin-right: 14px;
  background: $wine;
  opacity: 0.55;
  flex: none;
}

/* ============ 01 THE OPENING ============ */
.act-opening { height: 100vh; min-height: 560px; overflow: hidden; }
.hero-photo { position: absolute; top: 0; left: 0; right: 0; bottom: 0; }
.kb { animation: kenburns 24s ease-in-out infinite alternate; }
@keyframes kenburns { from { transform: scale(1); } to { transform: scale(1.09); } }
.frame {
  position: absolute;
  top: 14px; left: 14px; right: 14px; bottom: 14px;
  border: 1px solid rgba(119, 55, 71, 0.25);
  pointer-events: none;
  z-index: 3;
}
.frame-in {
  position: absolute;
  top: 4px; left: 4px; right: 4px; bottom: 4px;
  border: 1px solid rgba(119, 55, 71, 0.12);
}
.veil {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  z-index: 1;
  background: linear-gradient(to bottom, rgba(245,240,232,0.06) 30%, rgba(245,240,232,0.52) 76%, $ivory 100%);
}
.opening-copy {
  position: absolute;
  left: 0; right: 0;
  bottom: 15%;
  text-align: center;
  padding: 0 24px;
  z-index: 4;
}
.opening-names {
  font-family: $serif-cn;
  color: $wine;
  font-size: clamp(22px, 5.4vw, 28px);
  letter-spacing: 0.14em;
  line-height: 1.6;
  margin-bottom: 14px;
  opacity: 0;
  animation: fadeIn 1s ease 0.3s forwards;
}
.opening-cross { color: $sea-deep; margin: 0 12px; }
.h1 {
  font-family: $serif-en;
  font-weight: 400;
  color: $wine;
  font-size: clamp(30px, 8.4vw, 58px);
  letter-spacing: 0.34em;
  line-height: 1.4;
  opacity: 0;
  animation: titleIn 2.4s $ease 0.5s forwards;
}
@keyframes titleIn {
  0% { opacity: 0; letter-spacing: 0.42em; transform: translateY(10px); }
  100% { opacity: 1; letter-spacing: 0.18em; transform: translateY(0); }
}
.sub {
  margin-top: 20px;
  font-size: 12.5px;
  letter-spacing: 0.26em;
  line-height: 2.3;
  color: $graphite;
  opacity: 0;
  animation: fadeIn 1.6s ease 1.8s forwards;
}
.sub .dot { display: none; margin: 0 10px; color: $wine-ink; }
.sub .place { display: block; margin: 0 10px; color: $wine-ink; }
@media (min-width: 481px) {
  .sub { font-size: 13px; letter-spacing: 0.34em; line-height: 1.8; }
  .sub .dot { display: inline; }
  .sub .place { display: inline; }
}
.sub2 {
  margin-top: 18px;
  font-family: $serif-cn;
  font-size: 15px;
  letter-spacing: 0.22em;
  color: rgba(119, 55, 71, 0.9);
  opacity: 0;
  animation: fadeIn 1.8s ease 2.6s forwards;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.scroll-hint {
  position: absolute;
  left: 50%; bottom: 34px;
  transform: translateX(-50%);
  opacity: 0;
  animation: fadeIn 1.5s ease 3.2s forwards;
  z-index: 4;
}
.hint-line {
  width: 1px; height: 44px;
  background: linear-gradient($wine, rgba(119, 55, 71, 0));
  animation: hint 2.2s ease-in-out infinite;
}
@keyframes hint { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }

/* ============ 02 OUR STORY ============ */
.act-story { padding: 120px 26px 100px; max-width: 640px; margin: 0 auto; }
.act-story .act-tag { margin-bottom: 38px; }
.story-photo-main { width: 100%; border-radius: 2px; }
.story-photo-detail {
  width: 52%;
  margin: -64px 0 0 auto;
  border: 6px solid $ivory;
  border-radius: 2px;
  z-index: 2;
}
.story-text {
  margin-top: 56px;
  font-family: $serif-cn;
  font-size: clamp(19px, 5vw, 23px);
  line-height: 2.3;
  color: $graphite;
}
.story-text .p { margin-bottom: 4px; }
.story-text .em { color: $wine; }
.story-names {
  margin-top: 34px;
  display: flex;
  align-items: center;
  font-size: 12px;
  letter-spacing: 0.28em;
  color: $wine-ink;
}
.story-names::before {
  content: "";
  width: 26px; height: 1px;
  margin-right: 14px;
  background: $wine;
  opacity: 0.55;
  flex: none;
}
.story-names .mist { color: $sea-deep; }

/* ============ 03 THE JOURNEY ============ */
.act-journey {
  overflow: hidden;
  padding-top: clamp(150px, 22vh, 200px);
  background: linear-gradient(180deg, $ivory 0, #DCE5E7 60px, $mist 130px, #7D9DAA 220px, $sea-deep 320px, $sea-deep 100%);
}
.journey-copy {
  position: relative;
  display: flex; flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0 30px;
  z-index: 3;
}
.journey-copy .act-tag { color: rgba(253, 251, 244, 0.95); text-shadow: 0 1px 8px rgba(36, 56, 66, 0.35); margin-bottom: 26px; justify-content: center; }
.journey-copy .act-tag::before { background: rgba(253, 251, 244, 0.75); opacity: 1; }
.journey-copy .p {
  font-family: $serif-cn;
  font-size: clamp(23px, 6.2vw, 31px);
  color: #FDFBF4;
  text-shadow: 0 1px 2px rgba(36, 56, 66, 0.25), 0 2px 16px rgba(36, 56, 66, 0.35);
  line-height: 2.15;
  letter-spacing: 0.12em;
}
.journey-copy .lead { font-size: clamp(14px, 3.8vw, 17px); opacity: 0.95; letter-spacing: 0.3em; margin-bottom: 14px; }
.journey-place {
  margin-top: 18px;
  font-family: $serif-en;
  font-size: 11px;
  letter-spacing: 0.4em;
  color: rgba(253, 251, 244, 0.82);
}
.j-scene { position: relative; margin-top: clamp(-10px, 2vh, 24px); width: 100%; }
.j-photo { position: absolute; top: 0; left: 0; right: 0; bottom: 0; overflow: hidden; background: $sea-deep; }
.j-layer { transition: opacity 1.4s ease; }
.j-fade-top, .j-fade-bottom { position: absolute; left: 0; right: 0; z-index: 1; pointer-events: none; }
.j-fade-top { top: 0; height: 34%; background: linear-gradient(180deg, $sea-deep 0%, rgba(95, 132, 148, 0.55) 40%, rgba(95, 132, 148, 0) 100%); }
.j-fade-bottom { bottom: 0; height: 34%; background: linear-gradient(180deg, rgba(245, 240, 232, 0) 0%, rgba(245, 240, 232, 0.5) 55%, rgba(245, 240, 232, 0.92) 88%, $ivory 100%); }
.j-waves { position: absolute; left: 0; right: 0; bottom: -1px; height: 64px; pointer-events: none; z-index: 2; overflow: hidden; }
.j-wave {
  position: absolute; left: 0; bottom: 0;
  width: 200%;
  background-repeat: repeat-x;
  background-size: 50% 100%;
  background-position: 0 0;
}
.j-wave.l1 { height: 100%; opacity: 0.35; animation: tide 32s linear infinite; }
.j-wave.l2 { height: 78%; opacity: 0.6; animation: tide 24s linear infinite reverse; }
.j-wave.l3 { height: 52%; animation: tide 18s linear infinite; }
@keyframes tide { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(-50%, 0, 0); } }
.j-after { display: flow-root; background: $ivory; padding-bottom: 8px; }
.j-card {
  position: relative;
  width: 48%;
  max-width: 250px;
  margin: -96px 24px 0 auto;
  z-index: 4;
}
.jc-cap { font-size: 16px !important; padding-top: 7px !important; }

/* ============ 04 THE GALLERY ============ */
.act-gallery { padding: 120px 0 80px; max-width: 760px; margin: 0 auto; overflow: hidden; }
.g-tag { margin: 0 22px 56px; }
.g-grid { padding: 0 22px; }
.g-row { display: flex; align-items: flex-start; }
.g-item { position: relative; flex: none; }
.matte {
  background: $paper;
  padding: 9px 9px 10px;
  box-shadow: 0 18px 46px rgba(52, 58, 61, 0.16);
  border-radius: 2px;
}
.figcaption {
  font-family: $script-en;
  text-align: center;
  color: rgba(52, 58, 61, 0.72);
  font-size: 18px;
  letter-spacing: 0.02em;
  padding: 9px 0 0;
  line-height: 1.8;
}
.r-l { transform: rotate(-1.3deg); }
.r-r { transform: rotate(1.4deg); }
/* 12 栏网格（栏距 16px）用 flex 还原：7/5、6/6、7/5 */
.g-a, .g-e { width: calc((100% - 176px) * 7 / 12 + 96px); }
.g-b, .g-f { width: calc((100% - 176px) * 5 / 12 + 64px); margin-left: 16px; }
.g-c, .g-d { width: calc((100% - 176px) / 2 + 80px); }
.g-d { margin-left: 16px; }
.g-b { margin-top: 68px; }
.g-c { margin-top: 34px; }
.g-d { margin-top: 86px; }
.g-e { margin-top: 40px; }
.g-f { margin-top: 104px; }
.g-bleed { margin: 44px -22px 0; }
.bleed-layer { transform: scale(1.15); }
.g-phrase {
  text-align: center;
  font-family: $script-en;
  color: $wine;
  font-size: clamp(26px, 7vw, 36px);
  letter-spacing: 0.02em;
  line-height: 1.8;
  padding: 56px 0 30px;
}

/* ============ 04.5 所爱隔山海 ============ */
.interlude { min-height: 460px; overflow: hidden; }
.inter-bg { position: absolute; top: 0; left: 0; right: 0; bottom: 0; overflow: hidden; }
.inter-layer { transition: opacity 1.2s ease; transform: scale(1.16); }
.inter-veil {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to bottom, $ivory 0%, rgba(245, 240, 232, 0.25) 18%, rgba(52, 58, 61, 0.28) 55%, rgba(52, 58, 61, 0.42) 100%);
}
.inter-copy {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center;
  padding: 0 30px;
  z-index: 3;
}
.inter-copy .p {
  font-family: $serif-cn;
  font-size: clamp(25px, 7vw, 36px);
  color: #FDFBF4;
  text-shadow: 0 2px 22px rgba(52, 58, 61, 0.45);
  line-height: 2.1;
  letter-spacing: 0.22em;
}
.inter-copy .small {
  margin-top: 22px;
  font-family: $script-en;
  font-size: clamp(18px, 4.8vw, 23px);
  color: rgba(253, 251, 244, 0.9);
  text-shadow: 0 1px 10px rgba(52, 58, 61, 0.55);
  letter-spacing: 0.06em;
  line-height: 1.8;
}

/* ============ 05 THE INVITATION ============ */
.act-invite {
  padding: 130px 24px calc(110px + env(safe-area-inset-bottom));
  background: radial-gradient(ellipse 70% 42% at 50% 30%, rgba(119, 55, 71, 0.05), rgba(119, 55, 71, 0) 70%);
}
.invite-card {
  max-width: 560px;
  margin: 0 auto;
  text-align: center;
  border: 1px solid rgba(119, 55, 71, 0.22);
  padding: 78px 28px 56px;
  position: relative;
  background: $paper;
  box-shadow: 0 24px 70px rgba(52, 58, 61, 0.10);
}
.card-inner-line {
  position: absolute; top: 8px; left: 8px; right: 8px; bottom: 8px;
  border: 1px solid rgba(119, 55, 71, 0.14);
  pointer-events: none;
}
.cn { position: absolute; width: 22px; height: 22px; pointer-events: none; z-index: 2; }
.cn::before, .cn::after { content: ""; position: absolute; background: $wine; opacity: 0.55; }
.cn::before { width: 100%; height: 1px; }
.cn::after { width: 1px; height: 100%; }
.cn.tl { top: -1px; left: -1px; }
.cn.tl::before, .cn.tl::after { top: 0; left: 0; }
.cn.tr { top: -1px; right: -1px; }
.cn.tr::before, .cn.tr::after { top: 0; right: 0; }
.cn.bl { bottom: -1px; left: -1px; }
.cn.bl::before, .cn.bl::after { bottom: 0; left: 0; }
.cn.br { bottom: -1px; right: -1px; }
.cn.br::before, .cn.br::after { bottom: 0; right: 0; }
.seal {
  position: absolute;
  top: -34px; left: 50%;
  margin-left: -36px;
  width: 72px; height: 72px;
  border-radius: 50%;
  background: $paper;
  border: 1px solid $wine-soft;
  display: flex; align-items: center; justify-content: center;
  font-family: $script-cn;
  color: $wine;
  font-size: 19px;
  letter-spacing: 0.02em;
  box-shadow: 0 6px 18px rgba(119, 55, 71, 0.14);
  z-index: 3;
}
.seal-ring {
  position: absolute; top: 5px; left: 5px; right: 5px; bottom: 5px;
  border: 1px solid rgba(119, 55, 71, 0.25);
  border-radius: 50%;
}
.invite-families {
  font-family: $serif-en;
  font-size: 11px;
  letter-spacing: 0.34em;
  color: rgba(52, 58, 61, 0.72);
  margin-bottom: 14px;
}
.h2 {
  font-family: $serif-en;
  font-weight: 400;
  font-size: clamp(26px, 7vw, 38px);
  letter-spacing: 0.3em;
  color: $graphite;
  margin-bottom: 10px;
  line-height: 1.8;
}
.invite-zh {
  font-family: $serif-cn;
  font-size: clamp(15px, 4.4vw, 18px);
  letter-spacing: 0.14em;
  white-space: nowrap;
  color: $graphite;
  margin-top: 12px;
}
.invite-date { margin: 44px 0 10px; font-family: $serif-en; color: $wine; }
.invite-date .day { font-size: clamp(76px, 23vw, 124px); line-height: 1; letter-spacing: 0.02em; }
.invite-date .ym { margin-top: 12px; font-size: 15px; letter-spacing: 0.5em; }
.invite-week { font-size: 12px; letter-spacing: 0.34em; color: $graphite; opacity: 0.75; }
.invite-names {
  margin-top: 38px;
  font-family: $serif-cn;
  font-size: clamp(23px, 6vw, 28px);
  letter-spacing: 0.16em;
  color: $graphite;
}
.invite-names .amp, .tail .names .amp {
  font-family: $serif-en;
  font-style: normal;
  color: $wine;
  margin: 0 10px;
  font-size: 1.1em;
}
.invite-time { margin-top: 12px; font-size: 12.5px; letter-spacing: 0.22em; color: rgba(52, 58, 61, 0.7); }
.invite-venue { margin-top: 26px; font-family: $serif-cn; font-size: 19px; letter-spacing: 0.12em; line-height: 2.15; }
.invite-venue .small { display: block; font-family: $sans-cn; font-size: 12.5px; opacity: 0.7; letter-spacing: 0.2em; }
.invite-line {
  width: 42px; height: 1px;
  background: rgba(119, 55, 71, 0.5);
  margin: 32px auto;
  position: relative;
}
.diamond {
  position: absolute;
  left: 50%; top: 50%;
  width: 5px; height: 5px;
  margin: -3.5px 0 0 -3.5px;
  transform: rotate(45deg);
  background: $paper;
  border: 1px solid $wine;
}
.btn-map {
  display: inline-flex;
  align-items: center;
  margin-top: 6px;
  padding: 13px 36px;
  border: 1px solid $wine;
  color: $wine;
  font-size: 13px;
  letter-spacing: 0.3em;
  line-height: 1.8;
  border-radius: 999px;
  transition: background 0.35s, color 0.35s, transform 0.2s;
}
.btn-map-on { background: $wine; color: $ivory; transform: scale(0.97); }
.arrow { position: relative; width: 11px; height: 11px; margin-left: 10px; }
.arrow-img { position: absolute; top: 0; left: 0; width: 11px; height: 11px; background-size: 11px 11px; background-repeat: no-repeat; }
.a-ivory { opacity: 0; }
.btn-map-on .a-ivory { opacity: 1; }
.btn-map-on .a-wine { opacity: 0; }
.invite-note {
  margin-top: 30px;
  font-family: $script-en;
  font-size: 20px;
  letter-spacing: 0.02em;
  color: rgba(52, 58, 61, 0.68);
}

/* ---------- 赴约指南 ---------- */
.guide { max-width: 560px; margin: 76px auto 0; text-align: left; }
.guide-title {
  text-align: center;
  font-family: $serif-cn;
  letter-spacing: 0.3em;
  font-size: 19px;
  color: $wine;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.guide-title::before, .guide-title::after {
  content: "";
  width: 30px; height: 1px;
  margin: 0 16px;
  background: $wine;
  opacity: 0.4;
}
.guide-item { border-top: 1px solid rgba(52, 58, 61, 0.14); transition: background 0.3s; }
.guide-item:last-child { border-bottom: 1px solid rgba(52, 58, 61, 0.14); }
.guide-item.open { background: rgba(251, 247, 239, 0.6); }
.guide-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 19px 6px;
  font-family: $sans-cn;
  font-size: 14.5px;
  letter-spacing: 0.12em;
  line-height: 1.8;
  color: $graphite;
}
.glabel { display: flex; align-items: center; }
.gicon { width: 18px; height: 18px; margin-right: 12px; opacity: 0.75; flex: none; background-size: 18px 18px; background-repeat: no-repeat; }
.chev {
  width: 8px; height: 8px;
  border-right: 1px solid $wine;
  border-bottom: 1px solid $wine;
  transform: rotate(45deg);
  transition: transform 0.35s ease;
  margin-right: 4px;
  flex: none;
}
.guide-item.open .chev { transform: rotate(225deg); }
.guide-body { max-height: 0; overflow: hidden; transition: max-height 0.45s ease; }
.inner {
  padding: 2px 6px 22px 36px;
  font-size: 13.5px;
  line-height: 2.15;
  color: rgba(52, 58, 61, 0.85);
}
.inner .b { font-weight: 600; color: $graphite; }
.contact-line { display: block; }
.tel-link {
  color: $wine-ink;
  white-space: nowrap;
  border-bottom: 1px solid rgba(119, 55, 71, 0.35);
  padding-bottom: 1px;
}

/* ---------- 回执 ---------- */
.rsvp { max-width: 560px; margin: 60px auto 0; text-align: center; }
.rsvp-p { font-size: 13px; opacity: 0.75; letter-spacing: 0.1em; margin-bottom: 20px; }
.btn-rsvp {
  display: inline-flex;
  align-items: center;
  padding: 13px 42px;
  background: $wine;
  color: $ivory;
  border-radius: 999px;
  font-size: 13px;
  letter-spacing: 0.3em;
  line-height: 1.8;
  box-shadow: 0 10px 26px rgba(119, 55, 71, 0.28);
  transition: transform 0.2s, box-shadow 0.3s;
}
.btn-rsvp-on { transform: scale(0.97); }
.env { width: 15px; height: 15px; margin-right: 10px; background-size: 15px 15px; background-repeat: no-repeat; }

/* ---------- 回执抽屉 ---------- */
.sheet { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 120; visibility: hidden; }
.sheet.open { visibility: visible; }
.sheet-mask {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(52, 58, 61, 0.38);
  opacity: 0;
  transition: opacity 0.35s ease;
}
.sheet.open .sheet-mask { opacity: 1; }
.sheet-panel {
  position: absolute; left: 0; right: 0; bottom: 0;
  max-width: 560px;
  margin: 0 auto;
  background: $paper;
  border-radius: 18px 18px 0 0;
  padding: 30px 26px calc(26px + env(safe-area-inset-bottom));
  box-shadow: 0 -18px 50px rgba(52, 58, 61, 0.16);
  transform: translateY(105%);
  transition: transform 0.45s $ease;
  text-align: center;
}
.sheet.open .sheet-panel { transform: translateY(0); }
.grip {
  position: absolute; top: 10px; left: 50%;
  width: 36px; height: 4px;
  margin-left: -18px;
  border-radius: 2px;
  background: rgba(52, 58, 61, 0.15);
}
.sheet-title { font-family: $serif-cn; font-size: 21px; letter-spacing: 0.2em; color: $wine; }
.sheet-sub { margin: 8px 0 22px; font-size: 13px; line-height: 1.9; letter-spacing: 0.06em; color: rgba(52, 58, 61, 0.72); }
.sheet-list { text-align: left; }
.sheet-person { border-top: 1px solid rgba(52, 58, 61, 0.12); padding: 14px 2px; }
.sheet-person:last-child { border-bottom: 1px solid rgba(52, 58, 61, 0.12); }
.sheet-name { font-family: $serif-cn; font-size: 18px; letter-spacing: 0.14em; color: $graphite; }
.sheet-row {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 8px;
  font-size: 14px;
  letter-spacing: 0.04em;
  color: rgba(52, 58, 61, 0.85);
}
.sheet-row .k { font-size: 12px; letter-spacing: 0.16em; opacity: 0.6; margin-right: 8px; }
.sheet-row .v { white-space: nowrap; }
.sheet-btn {
  flex: none;
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 84px;
  padding: 8px 16px;
  margin-left: 12px;
  border: 1px solid $wine;
  border-radius: 999px;
  background: transparent;
  color: $wine;
  font-size: 13px;
  letter-spacing: 0.2em;
  line-height: 1.8;
}
.sheet-btn.solid { background: $wine; color: $ivory; }
.sheet-btn-on { transform: scale(0.96); }
.sheet-close {
  display: inline-block;
  margin-top: 18px;
  font-size: 13px;
  letter-spacing: 0.3em;
  color: rgba(52, 58, 61, 0.55);
  padding: 8px 20px;
}
.toast {
  position: fixed; left: 50%; top: 22%;
  z-index: 130;
  transform: translate(-50%, -50%);
  background: rgba(52, 58, 61, 0.88);
  color: $ivory;
  font-size: 13px;
  letter-spacing: 0.08em;
  padding: 10px 18px;
  border-radius: 10px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
  max-width: 80vw;
  text-align: center;
}
.toast.show { opacity: 1; }

/* ============ 06 THE ENDING ============ */
.act-ending {
  min-height: 80vh;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center;
  padding: 120px 30px 140px;
  background: linear-gradient(to bottom, $ivory 40%, #E4E6E2 75%, $mist 130%);
  overflow: hidden;
}
.words {
  font-family: $serif-cn;
  font-size: clamp(21px, 5.6vw, 27px);
  line-height: 2.35;
  letter-spacing: 0.14em;
  color: $graphite;
  position: relative;
  z-index: 3;
}
.ending-wave {
  width: 120px; height: 14px;
  opacity: 0.8;
  margin-top: 44px;
  background-size: 120px 14px;
  background-repeat: no-repeat;
  position: relative;
  z-index: 3;
}
.tail {
  margin-top: 40px;
  font-family: $serif-en;
  color: $wine;
  font-size: 14px;
  letter-spacing: 0.4em;
  line-height: 2.5;
  position: relative;
  z-index: 3;
}
.tail .names { font-family: $serif-cn; font-size: 20px; letter-spacing: 0.22em; color: $graphite; }
.tail .names .amp { font-size: 1.15em; }

.footer {
  text-align: center;
  padding: 26px 20px calc(30px + env(safe-area-inset-bottom));
  font-size: 10.5px;
  letter-spacing: 0.24em;
  line-height: 1.8;
  color: rgba(52, 58, 61, 0.45);
  background: $ivory;
}
.footer.has-music { padding-bottom: calc(80px + env(safe-area-inset-bottom)); }
.credit { margin: 10px auto 0; max-width: 300px; font-size: 10px; line-height: 1.7; letter-spacing: 0.06em; color: rgba(52, 58, 61, 0.42); }

@media (prefers-reduced-motion: reduce) {
  .reveal, .reveal-line { transition: none; opacity: 1; transform: none; }
  .kb, .bk, .j-wave { animation: none; }
  .opening-names, .h1, .sub, .sub2, .scroll-hint { animation: none; opacity: 1; }
}
</style>
