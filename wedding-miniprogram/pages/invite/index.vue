<template>
  <view class="inv" :class="{ ready, opened }" @tap="onAnyTap">
    <view class="grain" :style="{ backgroundImage: art.grain }" />
    <view class="topbar-space" :style="{ height: (barSpace) + 'px' }" />
    <view class="topbar" :style="topbarStyle">
      <view class="progress"><view class="progress-bar" :style="{ width: progress + '%' }" /></view>
      <view class="topbar-row">
        <text class="chap">{{ chapterLabel }}</text>
        <view
          v-if="musicOn"
          class="music-chip"
          :class="{ on: musicPlaying }"
          hover-class="music-chip-on"
          :aria-label="musicPlaying ? '暂停背景音乐，海风来信，高嘉琪原创' : '播放背景音乐，海风来信，高嘉琪原创'"
          aria-role="button"
          @tap.stop="toggleMusic"
        >{{ musicPlaying ? '暂停音乐' : '播放音乐' }}</view>
      </view>
      <view v-if="musicOn && musicPlaying" class="music-line">海风来信 · 高嘉琪原创</view>
    </view>

    <!-- ============ 01 · 开场：日期地点在纸上，不压在婚纱上 ============ -->
    <view class="act act-opening" id="opening">
      <view class="lead">
        <view class="lead-date num">{{ dateLabel }}</view>
        <view class="lead-meta">{{ weekdayCn }} · {{ C.ceremonyTime }}</view>
        <view class="lead-place">威海荣成 · {{ C.venue.name }}</view>
      </view>
      <view class="hero-frame">
        <view class="photo photo-flat hero-photo">
          <view class="layer" :class="{ loaded: loaded.hero }" :style="P.hero.layer">
            <image class="img" :style="P.hero.img" :src="srcOf('hero')" mode="scaleToFill" webp
              @load="onLoad('hero')" @error="onErr('hero')" />
          </view>
        </view>
        <view v-if="!opened" class="cover" hover-class="cover-on" aria-role="button" aria-label="翻开请柬。日期、时间和地点已写在上方，轻触即可进入。" @tap.stop="openInvite">
          <view class="cover-names">
            <text>{{ C.groomName }}</text><text class="opening-cross">×</text><text>{{ C.brideName }}</text>
          </view>
          <view class="cover-open">轻触翻开</view>
        </view>
      </view>
      <view class="lead-after">
        <view v-if="opened" class="opening-names">
          <text>{{ C.groomName }}</text><text class="opening-cross">×</text><text>{{ C.brideName }}</text>
        </view>
        <view class="sub2">{{ C.opening.sub2 }}</view>
        <view class="to-info" hover-class="to-info-on" @tap="goInvitation">查看婚礼信息</view>
      </view>
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
      <view v-if="C.story.aside" class="story-aside">{{ C.story.aside }}</view>
      <view id="rv9" class="story-names reveal" :class="rc(9)">
        <text>{{ C.story.origins[0] }}</text><text class="origin-cross">×</text><text>{{ C.story.origins[1] }}</text>
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
                <view class="layer" :class="{ loaded: loaded[g.key], quiet: g.quiet }" :style="P[g.key].layer">
                  <image class="img" :style="P[g.key].img" :src="srcOf(g.key)" mode="scaleToFill" webp lazy-load
                    @load="onLoad(g.key)" @error="onErr(g.key)" />
                </view>
              </view>
              <view v-if="C.gallery.captions[g.key]" class="figcaption">{{ C.gallery.captions[g.key] }}</view>
            </view>
          </view>
        </view>

        <view class="g-gap" />

        <view id="rv21" class="g-bleed reveal" :class="rc(21)">
          <view class="photo photo-flat">
            <view class="sp" style="padding-top:62.5%" />
            <view class="layer bleed-layer" :class="{ loaded: loaded.gallery3 }" :style="P.gallery3.layer + par.gallery3">
              <image class="img" :style="P.gallery3.img" :src="srcOf('gallery3')" mode="scaleToFill" webp lazy-load
                @load="onLoad('gallery3')" @error="onErr('gallery3')" />
            </view>
            <view class="edge-fade ef-top" />
            <view class="edge-fade ef-bot" />
          </view>
          <view class="g-band g-band-top" />
          <view class="g-band g-band-bot" />
        </view>

        <view class="g-row">
          <view v-for="g in galleryRows[1]" :key="g.key" :id="'rv' + g.rv" class="g-item reveal" :class="[g.cls, rc(g.rv)]">
            <view class="matte" :class="g.rot">
              <view class="photo photo-flat">
                <view class="sp" :style="{ paddingTop: g.pt }" />
                <view class="layer" :class="{ loaded: loaded[g.key], quiet: g.quiet }" :style="P[g.key].layer">
                  <image class="img" :style="P[g.key].img" :src="srcOf(g.key)" mode="scaleToFill" webp lazy-load
                    @load="onLoad(g.key)" @error="onErr(g.key)" />
                </view>
              </view>
              <view v-if="C.gallery.captions[g.key]" class="figcaption">{{ C.gallery.captions[g.key] }}</view>
            </view>
          </view>
        </view>

        <view class="g-gap" />

        <view id="rv25" class="g-bleed g-rings reveal" :class="rc(25)">
          <view class="photo photo-flat">
            <view class="sp" style="padding-top:62.5%" />
            <view class="layer bleed-layer" :class="{ loaded: loaded.gallery6 }" :style="P.gallery6.layer + par.gallery6">
              <image class="img" :style="P.gallery6.img" :src="srcOf('gallery6')" mode="scaleToFill" webp lazy-load
                @load="onLoad('gallery6')" @error="onErr('gallery6')" />
            </view>
            <view class="edge-fade ef-top" />
            <view class="edge-fade ef-bot" />
          </view>
          <view class="g-band g-band-top" />
          <view class="g-band g-band-bot" />
        </view>

        <view class="g-row">
          <view v-for="g in galleryRows[2]" :key="g.key" :id="'rv' + g.rv" class="g-item reveal" :class="[g.cls, rc(g.rv)]">
            <view class="matte" :class="g.rot">
              <view class="photo photo-flat">
                <view class="sp" :style="{ paddingTop: g.pt }" />
                <view class="layer" :class="{ loaded: loaded[g.key], quiet: g.quiet }" :style="P[g.key].layer">
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
    <view class="act interlude" id="interlude">
      <view class="inter-kicker">见山</view>
      <view class="inter-copy">
        <view v-for="(t, i) in C.interlude.lines" :key="i" :id="'rv' + (28 + i)" class="p reveal-line"
          :class="rc(28 + i)" :style="dl(28 + i)">{{ t }}</view>
      </view>
      <view class="inter-bg">
        <view class="layer inter-layer" :class="{ loaded: loaded.gallery7 }" :style="P.interlude.layer">
          <image class="img" :style="P.interlude.img" :src="srcOf('gallery7')" mode="scaleToFill" webp lazy-load
            @load="onLoad('gallery7')" @error="onErr('gallery7')" />
        </view>
        <view class="inter-fade" />
      </view>
      <view class="inter-note">草地山前</view>
    </view>

    <!-- ============ 05 · THE INVITATION ============ -->
    <view class="act act-invite" id="invitation">
      <view id="rv31" class="invite-card reveal" :class="rc(31)">
        <view class="card-inner-line" />
        <view class="cn tl" /><view class="cn tr" /><view class="cn bl" /><view class="cn br" />
        <view class="seal"><view class="seal-ring" />{{ seal }}</view>
        <view class="invite-zh">{{ C.invitation.zh }}</view>
        <view class="invite-names">
          <text>{{ C.groomName }}</text><text class="amp">×</text><text>{{ C.brideName }}</text>
        </view>
        <view class="invite-date num">{{ dateLabel }}</view>
        <view class="invite-week">{{ weekdayCn }} · {{ C.ceremonyTime }}</view>
        <view class="invite-line"><view class="diamond" /></view>
        <view class="invite-venue">
          <view v-for="(t, i) in C.invitation.venueLines" :key="i">{{ t }}</view>
          <view class="small"><text user-select selectable>地址：{{ C.venue.address }}</text></view>
        </view>
        <view class="invite-line"><view class="diamond" /></view>
        <view class="btn-map" hover-class="btn-map-on" @tap="openMap">
          <text>{{ C.invitation.mapLabel }}</text>
          <view class="arrow">
            <view class="arrow-img a-wine" :style="{ backgroundImage: art.mapArrow.wine }" />
            <view class="arrow-img a-ivory" :style="{ backgroundImage: art.mapArrow.ivory }" />
          </view>
        </view>
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
        <!-- open-type=share 强制走 onShareAppMessage，避免转发旧空白卡 -->
        <button class="btn-share" open-type="share" hover-class="btn-share-on">发给好友</button>
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
        <view class="names"><text>{{ C.groomName }}</text><text class="amp">×</text><text>{{ C.brideName }}</text></view>
        <view class="num">{{ dateLabel }}</view>
        <view>威海荣成</view>
      </view>
    </view>

    <view class="footer">
      <view class="num">{{ C.groomName }} × {{ C.brideName }} · {{ dateLabel }}</view>
      <view v-if="musicOn" class="credit">海风来信 · 高嘉琪原创</view>
    </view>

    <!-- 回执抽屉：电话 + 微信 -->
    <view class="sheet" :class="{ open: sheetOpen }" @touchmove.stop.prevent="noop">
      <view class="sheet-mask" @tap="closeSheet" />
      <view class="sheet-panel">
        <view class="sheet-title">联系两位新人</view>
        <view class="sheet-sub">高嘉琪留了微信，可以复制添加。张靖没有留微信，请直接打电话。我们不收集你的回复。</view>
        <view class="sheet-list">
          <view v-for="c in C.contacts" :key="c.tel" class="sheet-person">
            <view class="sheet-name">{{ c.name }}</view>
            <view class="sheet-role">{{ c.wechat ? '电话，或加微信' : '请电话联系' }}</view>
            <view class="sheet-row">
              <view><text class="k">电话</text><text class="v num">{{ fmtTel(c.tel) }}</text></view>
              <view class="sheet-btn solid" hover-class="sheet-btn-on" @tap="call(c.tel)">拨打</view>
            </view>
            <view v-if="c.wechat" class="sheet-row">
              <view><text class="k">微信</text><text class="v" user-select selectable>{{ c.wechat }}</text></view>
              <view class="sheet-btn" hover-class="sheet-btn-on" @tap="copyWechat(c.wechat)">复制</view>
            </view>
          </view>
        </view>
        <view class="sheet-close" @tap="closeSheet">{{ C.rsvp.close }}</view>
      </view>
    </view>
    <!-- 离屏画布：把包内分享图导出为 temp 路径，供 onShareAppMessage 使用 -->
    <canvas canvas-id="shareCanvas" id="shareCanvas" class="share-canvas" :style="{ width: '750px', height: '600px' }" />
    <view class="toast" :class="{ show: toast.show }">{{ toast.msg }}</view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, getCurrentInstance, nextTick } from 'vue'
import { onLoad as onPageLoad, onReady, onShow, onHide, onPageScroll, onShareAppMessage, onShareTimeline, onUnload } from '@dcloudio/uni-app'
import CONFIG from '@/config/invite.js'
import { layoutPhoto } from '@/utils/invite-photo.js'
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
// 竖屏才把「所爱隔山海」改成底对齐全身；横屏预览仍走原来的 cover，避免宽屏被拉成一条天空
const barTop = (win.statusBarHeight || 20) + 6
const barSpace = barTop + 52
const topbarStyle = `padding-top:${barTop}px;`

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
    interH: Math.max(Math.round(H * 0.92), 560)
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
  // 山海幕用已有的「草地山前」竖图，不再用只有海天的剪影
  interlude: layoutPhoto('gallery7', W, S.interH, { dpr })
}

// 画廊三行（与 H5 的 g-a…g-f 排法、旋转、比例一致）；rv = 滚动显现序号（决定 H5 里的错峰延迟）
const galleryRows = [
  [
    { key: 'gallery1', cls: 'g-a', rot: 'r-l', pt: '133.333%', rv: 18, quiet: true },
    { key: 'gallery2', cls: 'g-b', rot: 'r-r', pt: '133.333%', rv: 19 }
  ],
  [
    { key: 'gallery4', cls: 'g-c', rot: 'r-r', pt: '100%', rv: 22 },
    { key: 'gallery5', cls: 'g-d', rot: 'r-l', pt: '100%', rv: 23 }
  ],
  [
    { key: 'gallery8', cls: 'g-e', rot: 'r-l', pt: '133.333%', rv: 26 }
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
const dateLabel = `${C.date.y}.${String(C.date.m).padStart(2, '0')}.${String(C.date.d).padStart(2, '0')}`
const weekdayCn = (() => {
  const d = new Date(C.date.y, C.date.m - 1, C.date.d)
  return ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][d.getDay()]
})()
const opened = ref(false)
function openInvite() { opened.value = true }

/* ---------- 页面淡入 + 滚动显现（IntersectionObserver，threshold 0.18，同 H5） ---------- */
const ready = ref(false)
const revealed = reactive({})
const rc = (n) => (revealed[n] ? 'in' : '')
// H5：reveal-line 的 transitionDelay = (全局序号 % 6) × 0.12s
const dl = (n) => `transition-delay:${((n % 6) * 0.12).toFixed(2)}s;`

let observers = []
// 小程序里优先用页面实例自己的 createIntersectionObserver（最稳）；H5 预览用 uni 的实现
function makeObserver(opts) {
  const scope = inst.proxy && inst.proxy.$scope
  if (scope && typeof scope.createIntersectionObserver === 'function') return scope.createIntersectionObserver(opts)
  return uni.createIntersectionObserver(inst.proxy, opts)
}
function observeReveals() {
  if (typeof uni.createIntersectionObserver !== 'function') {
    for (let i = 0; i <= 38; i++) revealed[i] = true
    return
  }
  const io = makeObserver({ thresholds: [0, 0.18], observeAll: true })
  io.relativeToViewport().observe('.reveal, .reveal-line', (res) => {
    const n = Number(String(res.id || '').replace('rv', ''))
    if (Number.isNaN(n) || revealed[n]) return
    const r = res.boundingClientRect || {}
    if (res.intersectionRatio >= 0.17 || (res.intersectionRatio > 0 && r.height > H)) revealed[n] = true
  })
  observers.push(io)

  // 邀请页进入视口（或已经滚过它到尾声）就收起「婚礼信息」按钮
  const io2 = makeObserver({ thresholds: [0] })
  io2.relativeToViewport({ bottom: -Math.round(H * 0.12) }).observe('#invitation', (res) => {
    const top = (res.boundingClientRect || {}).top || 0
    infoAway.value = res.intersectionRatio > 0 || top < 0
  })
  observers.push(io2)
}

/* ---------- 视差：首屏渐隐 / 山海文字 / data-speed 照片（只动 transform、opacity） ---------- */
const scrollY = ref(0)
const progress = ref(0)
const chapterLabel = ref('日期')
const chapterMarks = [
  { id: 'opening', label: '日期' },
  { id: 'story', label: '故事' },
  { id: 'journey', label: '赴海' },
  { id: 'gallery', label: '相册' },
  { id: 'interlude', label: '见山' },
  { id: 'invitation', label: '请柬' },
  { id: 'ending', label: '尾声' }
]
const chapterTop = {}
const pos = reactive({ journeyTop: 0, journeyH: 0, g3Top: 0, g3H: 0, g6Top: 0, g6H: 0, interTop: 0, interH: 0, pageH: 1 })
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
const par = reactive({
  gallery3: 'transform:scale(1.08);',
  gallery6: 'transform:scale(1.06);transform-origin:center 22%;'
})
const interLayerStyle = computed(() => P.interlude.layer)
function updateParallax() {
  par.gallery3 = speedStyle(pos.g3Top, pos.g3H, 0.05, 1.08)
  const g6 = speedStyle(pos.g6Top, pos.g6H, 0.04, 1.06)
  par.gallery6 = g6 + 'transform-origin:center 22%;'
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
  chapterMarks.forEach((c) => q.select('#' + c.id).boundingClientRect())
  q.select('.inv').boundingClientRect()
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
    chapterMarks.forEach((c, i) => {
      const box = r[5 + i]
      if (box) chapterTop[c.id] = box.top + st
    })
    const inv = r[5 + chapterMarks.length]
    if (inv && inv.height) pos.pageH = inv.height
    scrollY.value = st
    updateParallax()
  })
}

let lastScroll = 0
onPageScroll((e) => {
  const now = Date.now()
  scrollY.value = e.scrollTop
  const total = Math.max(1, (pos.pageH || 1) - H)
  progress.value = Math.max(0, Math.min(100, (e.scrollTop / total) * 100))
  let label = chapterMarks[0].label
  for (const c of chapterMarks) {
    if (chapterTop[c.id] != null && e.scrollTop + 80 >= chapterTop[c.id]) label = c.label
  }
  chapterLabel.value = label
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
function silenceNativeToast() {
  ;[0, 40, 120, 360].forEach((ms) => {
    setTimeout(() => { try { uni.hideToast() } catch (e) { /* noop */ } }, ms)
  })
}
function copyText(text, okMsg, failMsg) {
  uni.setClipboardData({
    data: text,
    showToast: false,
    success: () => {
      silenceNativeToast()
      showToast(okMsg)
    },
    fail: () => showToast(failMsg)
  })
}
const copyWechat = (w) => copyText(w, C.rsvp.copied, C.rsvp.copyFailed.replace('{wechat}', w))

/* ---------- 背景音乐「海风来信」（InnerAudioContext；进页尝试自动播放，被拦就等第一次点按） ---------- */
const musicOn = !!(C.music && C.music.enabled && C.music.src)
const musicPlaying = ref(false)
const musicTitleShow = ref(false)
// 按钮位置：胶囊菜单下方 8px，右边缘与胶囊对齐（拿不到胶囊信息时按状态栏 + 44px 估算）
const musicPos = (() => {
  let top = 0
  let right = 16
  try {
    const r = uni.getMenuButtonBoundingClientRect && uni.getMenuButtonBoundingClientRect()
    if (r && r.bottom) {
      top = r.bottom + 8
      right = Math.max(8, W - r.right)
    }
  } catch (e) { /* noop */ }
  if (!top) top = (win.statusBarHeight || 20) + 44 + 8
  return `top:${top}px;right:${right}px;`
})()
let audio = null
let wantPlay = true
let userPaused = false     // 用户暂停后，翻页、回前台、随便点一下都不再自动响起
let hidden = false
let needGesture = false
let gestureTimer = 0
let titleTimer = 0
let titleShown = false
function flashTitle() {
  musicTitleShow.value = true
  clearTimeout(titleTimer)
  titleTimer = setTimeout(() => { musicTitleShow.value = false }, 3000)
}
function ensureAudio() {
  if (audio || !musicOn) return audio
  try {
    if (typeof uni.setInnerAudioOption === 'function') {
      uni.setInnerAudioOption({ obeyMuteSwitch: false, fail: () => {} })
    }
  } catch (e) { /* noop */ }
  audio = uni.createInnerAudioContext()
  audio.src = C.music.src
  audio.loop = true
  audio.autoplay = false
  audio.obeyMuteSwitch = false
  audio.volume = typeof C.music.volume === 'number' ? C.music.volume : 0.6
  audio.onPlay(() => {
    musicPlaying.value = true
    needGesture = false
    clearTimeout(gestureTimer)
    if (!titleShown) { titleShown = true; flashTitle() }
  })
  audio.onPause(() => { musicPlaying.value = false })
  audio.onStop(() => { musicPlaying.value = false })
  audio.onEnded(() => { if (audio && wantPlay && !hidden) audio.play() }) // loop 兜底
  audio.onError(() => {
    musicPlaying.value = false
    needGesture = true
  })
  return audio
}
function startMusic() {
  if (!ensureAudio()) return
  audio.play()
  // 有的机型 play() 既不报错也不出声：1.5 s 内没进 onPlay 就改为等点按
  clearTimeout(gestureTimer)
  gestureTimer = setTimeout(() => { if (!musicPlaying.value) needGesture = true }, 1500)
}
function toggleMusic() {
  if (!musicOn) return
  if (musicPlaying.value) {
    userPaused = true
    wantPlay = false
    needGesture = false
    audio && audio.pause()
  } else {
    userPaused = false
    wantPlay = true
    startMusic()
  }
}
// 只有「还没成功播过、用户也没暂停」时，第一次点按才补播放。暂停之后不再复活。
function onAnyTap() {
  if (userPaused) return
  if (musicOn && needGesture && wantPlay && !musicPlaying.value) {
    needGesture = false
    startMusic()
  }
}
onShow(() => {
  hidden = false
  enableShareMenu()
  if (musicOn && wantPlay && !userPaused && !musicPlaying.value) startMusic()
})
onHide(() => {
  hidden = true
  clearTimeout(gestureTimer)
  if (audio && musicPlaying.value) audio.pause() // wantPlay 保持不变，回来时 onShow 接着放
})

/* ---------- 分享（包内图 + 同步返回；网络图不可靠） ---------- */
const SHARE_LOCAL = '/static/share-card.jpg'
const SHARE_TITLE = (C.share && C.share.title) || '高嘉琪 & 张靖 · 婚礼邀请 · 2026.11.14 威海荣成'
const SHARE_PATH = (C.share && C.share.path) || '/pages/invite/index'
const shareImagePath = ref(SHARE_LOCAL)

function enableShareMenu() {
  if (typeof uni.showShareMenu === 'function') {
    uni.showShareMenu({
      withShareTicket: false,
      menus: ['shareAppMessage', 'shareTimeline'],
      fail: () => {}
    })
  }
}

function buildSharePayload(imageUrl) {
  const payload = {
    title: SHARE_TITLE,
    path: SHARE_PATH,
    imageUrl: imageUrl || shareImagePath.value || SHARE_LOCAL
  }
  try {
    console.log('[invite-share]', payload.title, payload.imageUrl)
  } catch (e) { /* noop */ }
  return payload
}

function prepareShareImage() {
  // 1) 校验包内图，缓存本地绝对路径
  uni.getImageInfo({
    src: SHARE_LOCAL,
    success: (info) => {
      if (info && info.path) shareImagePath.value = info.path
      // 2) 可选：画到离屏 canvas 再导出临时路径（部分基础库对 temp 路径更稳）
      tryDrawShareTemp(info)
    },
    fail: () => {
      shareImagePath.value = SHARE_LOCAL
    }
  })
}

function tryDrawShareTemp(info) {
  try {
    const w = (info && info.width) || 750
    const h = (info && info.height) || 600
    const ctx = uni.createCanvasContext && uni.createCanvasContext('shareCanvas', inst && inst.proxy)
    if (!ctx) return
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
        success: (res) => {
          if (res && res.tempFilePath) shareImagePath.value = res.tempFilePath
        },
        fail: () => {}
      }, inst && inst.proxy)
    })
  } catch (e) { /* canvas 不可用时继续用包内路径 */ }
}

// 必须在 setup 顶层同步注册（不可放进 onMounted）
onPageLoad(() => {
  enableShareMenu()
})
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
  // 同步字段保证标题绝不丢失；promise 在 2s 内带上更稳的 temp 路径
  return { ...sync, promise }
})
onShareTimeline(() => buildSharePayload())

onReady(() => {
  ready.value = true
  enableShareMenu()
  prepareShareImage()
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
  clearTimeout(gestureTimer)
  clearTimeout(titleTimer)
  if (audio) {
    try { audio.stop() } catch (e) { /* noop */ }
    audio.destroy()
    audio = null
  }
})
</script>

<style lang="scss">
/* ============================================================
   A LOVE STORY, BY THE SEA（小程序版，逐项对照 H5 index.html）
   色板见 styles/invite-palette.scss（与 H5 相同）
   ============================================================ */
@import '@/styles/invite-palette.scss';

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
  background: linear-gradient(160deg, $ivory-deep 0%, $sand 100%);
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

/* ---------- 背景音乐按钮（胶囊下方右对齐） ---------- */
.music {
  position: fixed;
  z-index: 91;
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  pointer-events: none;
}
.music-btn {
  position: relative;
  width: 34px; height: 34px;
  border-radius: 50%;
  border: 1px solid rgba(119, 55, 71, 0.32);
  background: rgba(245, 240, 232, 0.9);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  box-shadow: 0 3px 14px rgba(52, 58, 61, 0.12);
  display: flex; align-items: center; justify-content: center;
  pointer-events: auto;
  transition: background 0.4s ease, border-color 0.4s ease, transform 0.25s ease;
}
.music-btn-hover { transform: scale(0.92); }
.music-btn.on { background: $wine; border-color: $wine; }
/* 唱片环：一段缺口的细圆环，播放时慢转 */
.music-ring {
  position: absolute; top: 3px; left: 3px; right: 3px; bottom: 3px;
  border-radius: 50%;
  border: 1px solid rgba(119, 55, 71, 0.28);
  border-top-color: transparent;
  transition: border-color 0.4s ease;
}
.music-btn.on .music-ring {
  border-color: rgba(251, 247, 239, 0.55);
  border-top-color: transparent;
  animation: musicSpin 6s linear infinite;
}
.music-btn.on::after {
  content: "";
  position: absolute; top: -1px; left: -1px; right: -1px; bottom: -1px;
  border-radius: 50%;
  border: 1px solid rgba(119, 55, 71, 0.45);
  animation: musicPulse 2.4s ease-out infinite;
  pointer-events: none;
}
/* 三根音柱：暂停时高低错落静止，播放时轻轻起伏 */
.music-bars { position: relative; display: flex; align-items: flex-end; height: 12px; }
.bar {
  width: 2px; height: 12px;
  margin: 0 1.5px;
  border-radius: 1px;
  background: $wine;
  transform-origin: 50% 100%;
  transition: background 0.4s ease;
}
.b1 { transform: scaleY(0.45); }
.b2 { transform: scaleY(0.9); }
.b3 { transform: scaleY(0.6); }
.music-btn.on .bar { background: $ivory; animation: musicBar 1.2s ease-in-out infinite; }
.music-btn.on .b2 { animation-delay: -0.4s; }
.music-btn.on .b3 { animation-delay: -0.8s; }
@keyframes musicBar { 0%, 100% { transform: scaleY(0.35); } 50% { transform: scaleY(1); } }
@keyframes musicSpin { to { transform: rotate(360deg); } }
@keyframes musicPulse { 0% { transform: scale(1); opacity: 0.7; } 100% { transform: scale(1.45); opacity: 0; } }
/* 曲名：首次出声（或点按播放）时在按钮左侧浮现，3 秒后淡出 */
.music-title {
  margin-right: 10px;
  padding: 5px 12px 6px;
  border-radius: 14px;
  background: rgba(251, 247, 239, 0.86);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  box-shadow: 0 3px 14px rgba(52, 58, 61, 0.08);
  text-align: right;
  opacity: 0;
  transform: translateX(6px);
  transition: opacity 0.6s ease, transform 0.6s $ease;
}
.music-title.show { opacity: 1; transform: translateX(0); }
.mt-zh { font-family: $serif-cn; font-size: 14px; line-height: 1.3; letter-spacing: 0.18em; color: $wine-ink; }
.mt-en { font-family: $serif-en; font-style: italic; font-size: 10px; line-height: 1.3; letter-spacing: 0.06em; color: rgba(52, 58, 61, 0.6); }

/* ---------- 幕 通用 ---------- */
.act { position: relative; scroll-margin-top: 76px; }
.act-tag {
  display: flex;
  align-items: center;
  font-family: $sans-cn;
  font-size: 13px;
  letter-spacing: 0.14em;
  color: $wine-ink;
  text-transform: none;
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
.act-opening { height: auto; min-height: 0; overflow: visible; padding: 12px 22px 36px; }
.hero-photo { position: absolute; top: 0; left: 0; right: 0; bottom: 0; }
.kb { animation: kenburns 24s ease-in-out infinite alternate; }
@keyframes kenburns { from { transform: scale(1); } to { transform: scale(1.09); } }
.frame {
  position: absolute;
  top: calc(14px + env(safe-area-inset-top));
  right: calc(14px + env(safe-area-inset-right));
  bottom: calc(14px + env(safe-area-inset-bottom));
  left: calc(14px + env(safe-area-inset-left));
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
  /* 脸在画面上半：上面几乎不铺白，字落在下半的裙摆上才加重 */
  background: linear-gradient(to bottom,
    rgba(245, 240, 232, 0.02) 18%,
    rgba(245, 240, 232, 0.08) 42%,
    rgba(245, 240, 232, 0.55) 68%,
    rgba(245, 240, 232, 0.9) 88%,
    $ivory 100%);
}
.opening-copy {
  position: absolute;
  left: 0; right: 0;
  bottom: calc(15% + env(safe-area-inset-bottom) * 0.25);
  text-align: center;
  padding: 0 24px;
  z-index: 4;
}
.opening-names {
  font-family: $serif-cn;
  color: $wine;
  font-size: clamp(26px, 7.2vw, 34px);
  letter-spacing: 0.12em;
  line-height: 1.45;
  margin-bottom: 12px;
  white-space: nowrap;
  opacity: 0;
  animation: fadeIn 1s ease 0.3s forwards;
}
/* 分隔号离开书法字，改成衬线斜体香槟金；字距归零，空隙只靠 margin */
.opening-cross {
  display: inline-block;
  margin: 0 0.42em 0 0.28em;
  font-family: $serif-en;
  font-style: italic;
  font-weight: 500;
  font-size: 0.78em;
  line-height: 1;
  letter-spacing: 0;
  color: $gold;
}
.h1 {
  font-family: $serif-en;
  font-weight: 400;
  color: $wine;
  font-size: clamp(24px, 7.4vw, 44px);
  letter-spacing: 0.1em;
  line-height: 1.35;
  opacity: 0;
  animation: titleIn 2.4s $ease 0.5s forwards;
}
@keyframes titleIn {
  0% { opacity: 0; letter-spacing: 0.2em; transform: translateY(10px); }
  100% { opacity: 1; letter-spacing: 0.1em; transform: translateY(0); }
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
  margin-top: 16px;
  font-family: $serif-cn;
  font-size: 14.5px;
  letter-spacing: 0.1em;
  color: rgba(119, 55, 71, 0.9);
  opacity: 0;
  animation: fadeIn 1.8s ease 2.6s forwards;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.scroll-hint {
  position: absolute;
  left: 50%;
  bottom: calc(28px + env(safe-area-inset-bottom));
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
.act-story { padding: 56px 26px 72px; max-width: 640px; margin: 0 auto; }
.act-story .act-tag { margin-bottom: 38px; }
.story-photo-main { width: 100%; border-radius: 2px; }
.story-photo-detail {
  width: 42%;
  margin: 22px 0 0 auto;
  border: 1px solid rgba(176, 141, 87, 0.45);
  border-radius: 2px;
  z-index: 2;
}
.story-text {
  margin-top: 40px;
  font-family: $sans-cn;
  font-size: 16px;
  line-height: 1.95;
  letter-spacing: 0.01em;
  color: $graphite;
}
.story-text .p { margin-bottom: 4px; }
.story-text .em { color: $wine; }
.story-names {
  margin-top: 30px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  font-size: 12px;
  line-height: 1.9;
  letter-spacing: 0.12em;
  color: $wine-ink;
}
.story-names::before {
  content: "";
  width: 26px; height: 1px;
  margin-right: 12px;
  background: $gold;
  opacity: 0.72;
  flex: none;
}
.story-names .origin-cross {
  display: inline-block;
  margin: 0 0.45em;
  font-family: $serif-en;
  font-style: italic;
  font-size: 1.15em;
  line-height: 1;
  letter-spacing: 0;
  color: $gold;
}

/* ============ 03 THE JOURNEY ============ */
.act-journey {
  overflow: hidden;
  padding-top: 36px;
  background: $ivory;
}
.journey-copy {
  position: relative;
  display: flex; flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0 30px;
  z-index: 3;
}
.journey-copy .act-tag { color: $wine-ink; text-shadow: none; margin-bottom: 18px; justify-content: center; }
.journey-copy .act-tag::before { background: $gold; opacity: 0.7; }
.journey-copy .p {
  font-family: $sans-cn;
  font-size: 17px;
  color: $graphite;
  text-shadow: none;
  line-height: 1.9;
  letter-spacing: 0.04em;
}
.journey-copy .lead { font-size: clamp(14px, 3.8vw, 17px); opacity: 0.95; letter-spacing: 0.22em; margin-bottom: 14px; }
.journey-place {
  margin-top: 10px;
  font-family: $sans-cn;
  font-size: 13px;
  letter-spacing: 0.12em;
  color: $wine-ink;
}
.j-scene { position: relative; margin-top: clamp(-10px, 2vh, 24px); width: 100%; }
.j-photo { position: absolute; top: 0; left: 0; right: 0; bottom: 0; overflow: hidden; background: $sea-deep; }
.j-layer { transition: opacity 1.4s ease; }
.j-fade-top, .j-fade-bottom { position: absolute; left: 0; right: 0; z-index: 1; pointer-events: none; }
/* 上沿从深海蓝接到照片自己的天色，少留一层发灰的色块；下沿短一些，船和桥脚还在 */
.j-fade-top {
  top: 0; height: 16%;
  background: linear-gradient(180deg, $ivory 0%, rgba(245, 240, 232, 0.55) 42%, rgba(245, 240, 232, 0) 100%);
}
.j-fade-bottom {
  bottom: 0; height: 24%;
  background: linear-gradient(180deg, rgba(245, 240, 232, 0) 0%, rgba(245, 240, 232, 0.35) 42%, rgba(245, 240, 232, 0.82) 78%, $ivory 100%);
}
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
.act-gallery { padding: 56px 0 48px; max-width: 760px; margin: 0 auto; overflow: hidden; }
.g-tag { margin: 0 22px 56px; }
.g-grid { padding: 0 22px; }
.g-row { display: flex; align-items: flex-start; }
.g-item { position: relative; flex: none; }
.matte {
  background: $paper;
  padding: 9px 9px 10px;
  border-radius: 2px;
  box-shadow: 0 16px 40px rgba(52, 58, 61, 0.13), inset 0 0 0 1px rgba(176, 141, 87, 0.18);
}
.figcaption {
  font-family: $sans-cn;
  text-align: center;
  color: rgba(52, 58, 61, 0.72);
  font-size: 12px;
  letter-spacing: 0.04em;
  padding: 8px 0 0;
  line-height: 1.6;
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
.g-bleed { margin: 28px 0 0; }
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

/* 全出血照片 ↔ 象牙白底色的过渡（与 H5 同一套）：
   照片上下边缘各压一层渐变（色带色 → 照片边缘同色调 → 透明），照片上下再各垫一段淡色带
   （象牙白 → 照片色调的淡色），硬边变成一座色彩的桥。只用叠加 view + linear-gradient，不依赖 mask-image。
   渐变高度按人物位置定：蓝调那张头在 ~30% 处，上 18% / 下 15%；戒指那张头发在 ~7% 处，上边只留 7%。 */
.g-bleed { position: relative; z-index: 0; }
.g-phrase { position: relative; z-index: 1; }
.g-bleed .photo::after { display: none; } /* 去掉 1px 亮边，否则渐变边缘会出一条细线 */
.g-band { position: absolute; left: 0; right: 0; z-index: -1; pointer-events: none; }
.g-band-top { bottom: 100%; height: 120px; background: linear-gradient(180deg, rgba(245, 240, 232, 0) 0%, $band-blue-top 100%); }
.g-band-bot { top: 100%; height: 96px; background: linear-gradient(180deg, $band-blue-bot 0%, rgba(245, 240, 232, 0) 100%); }
.edge-fade { position: absolute; left: 0; right: 0; z-index: 1; pointer-events: none; }
/* 蓝调：淡色带尽快溶进照片自己的钴蓝天，不在天上留一条发白的带；人在中下，渐变不压脸 */
.ef-top {
  top: 0; height: 14%;
  background: linear-gradient(180deg, $band-blue-top 0%, rgba(90, 160, 200, 0.5) 34%, rgba(2, 116, 196, 0.16) 70%, rgba(2, 116, 196, 0) 100%);
}
.ef-bot {
  bottom: 0; height: 12%;
  background: linear-gradient(0deg, $band-blue-bot 0%, rgba(206, 216, 213, 0.8) 28%, rgba(122, 142, 136, 0.22) 64%, rgba(50, 69, 51, 0) 100%);
}
/* 戒指：上边很短；底部青草 → 浅草绿 */
.g-rings .g-band-top { background: linear-gradient(180deg, rgba(245, 240, 232, 0) 0%, $band-rings-top 100%); }
.g-rings .g-band-bot { background: linear-gradient(180deg, $band-rings-bot 0%, rgba(245, 240, 232, 0) 100%); }
.g-rings .ef-top {
  height: 7%;
  background: linear-gradient(180deg, $band-rings-top 0%, rgba(200, 212, 205, 0.55) 45%, rgba(139, 157, 154, 0) 100%);
}
.g-rings .ef-bot {
  height: 17%;
  background: linear-gradient(0deg, $band-rings-bot 0%, rgba(208, 214, 192, 0.8) 26%, rgba(120, 132, 92, 0.3) 64%, rgba(101, 108, 81, 0) 100%);
}

/* ============ 04.5 所爱隔山海 ============ */
.interlude { min-height: 460px; overflow: hidden; }
.inter-bg { position: absolute; top: 0; left: 0; right: 0; bottom: 0; overflow: hidden; }
.inter-layer { transition: opacity 1.2s ease; transform: scale(1.16); }
.inter-sky, .inter-bridge { display: none; }
.inter-veil {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to bottom, $ivory 0%, rgba(245, 240, 232, 0.25) 18%, rgba(52, 58, 61, 0.28) 55%, rgba(52, 58, 61, 0.42) 100%);
}
/* 过场底边：草地剪影 → 暮色灰 → 象牙白，接上请柬那一幕（原来这里是一条硬边） */
.inter-fade {
  position: absolute; left: 0; right: 0; bottom: 0;
  height: 15%;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(0deg, $ivory 0%, rgba(245, 240, 232, 0.86) 22%, rgba(196, 196, 186, 0.5) 52%, rgba(120, 128, 120, 0.18) 78%, rgba(52, 58, 61, 0) 100%);
}
/* 竖屏：照片按原比例放到 2.7 倍屏宽、底对齐。天空用照片顶端的颜色补上，诗句落在天上，人不被裁成半身。 */
.interlude.is-portrait { background: $sky-dusk; }
.interlude.is-portrait .inter-bg { background: $sky-dusk; }
.interlude.is-portrait .inter-layer { transform: none; }
.interlude.is-portrait .inter-sky {
  display: block;
  position: absolute; left: 0; right: 0; top: 0;
  height: 46%;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(180deg, $sky-dusk 0%, $sky-dusk 32%, rgba(76, 122, 174, 0.55) 68%, rgba(76, 122, 174, 0) 100%);
}
.interlude.is-portrait .inter-bridge {
  display: block;
  position: absolute; left: 0; right: 0; top: 0;
  height: 84px;
  z-index: 2;
  pointer-events: none;
  background: linear-gradient(180deg, $ivory 0%, rgba(245, 240, 232, 0.4) 48%, rgba(76, 122, 174, 0) 100%);
}
.interlude.is-portrait .inter-veil { display: none; }
.interlude.is-portrait .inter-fade {
  height: 48px;
  background: linear-gradient(0deg, $ivory 0%, rgba(245, 240, 232, 0.72) 46%, rgba(245, 240, 232, 0) 100%);
}
.interlude.is-portrait .inter-copy {
  justify-content: flex-start;
  padding-top: clamp(108px, 15vh, 148px);
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
  color: $foam;
  text-shadow: 0 1px 2px rgba(28, 52, 74, 0.35), 0 8px 22px rgba(28, 52, 74, 0.28);
  line-height: 2.05;
  letter-spacing: 0.16em;
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
  padding: 36px 20px calc(48px + env(safe-area-inset-bottom));
  background: $ivory;
}
.invite-card {
  max-width: 560px;
  margin: 0 auto;
  text-align: center;
  border: 1px solid rgba(176, 141, 87, 0.34);
  padding: 78px 28px 56px;
  position: relative;
  background: linear-gradient(135deg, rgba(176, 141, 87, 0.04), rgba(176, 141, 87, 0) 46%), $paper;
  box-shadow: 0 22px 58px rgba(52, 58, 61, 0.09);
}
.card-inner-line {
  position: absolute; top: 8px; left: 8px; right: 8px; bottom: 8px;
  border: 1px solid rgba(176, 141, 87, 0.2);
  pointer-events: none;
}
.cn { position: absolute; width: 22px; height: 22px; pointer-events: none; z-index: 2; }
.cn::before, .cn::after { content: ""; position: absolute; background: $gold; opacity: 0.68; }
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
  font-size: 10.5px;
  letter-spacing: 0.18em;
  color: rgba(52, 58, 61, 0.72);
  margin-bottom: 14px;
}
.h2 {
  font-family: $serif-en;
  font-weight: 400;
  font-size: clamp(26px, 7vw, 36px);
  letter-spacing: 0.16em;
  color: $graphite;
  margin-bottom: 10px;
  line-height: 1.35;
}
.invite-zh {
  font-family: $serif-cn;
  font-size: clamp(14px, 4.2vw, 18px);
  letter-spacing: 0.08em;
  white-space: nowrap;
  color: $graphite;
  margin-top: 12px;
}
.invite-date { margin: 18px 0 6px; font-family: $sans-cn; font-size: 22px; letter-spacing: 0.06em; color: $graphite; line-height: 1.3; }
.invite-date .day { font-size: 22px; line-height: 1.3; letter-spacing: 0.06em; }
.invite-date .ym { margin-top: 12px; font-size: 15px; letter-spacing: 0.32em; }
.invite-week { font-size: 12px; letter-spacing: 0.22em; color: $graphite; opacity: 0.75; }
.invite-names {
  margin-top: 14px;
  font-family: $serif-cn;
  font-size: clamp(28px, 8vw, 36px);
  letter-spacing: 0.08em;
  color: $graphite;
}
.invite-names .amp, .tail .names .amp {
  font-family: $serif-en;
  font-style: italic;
  font-weight: 500;
  color: $gold;
  margin: 0 0.42em;
  letter-spacing: 0;
  font-size: 0.86em;
}
.invite-time { margin-top: 12px; font-size: 12.5px; letter-spacing: 0.22em; color: rgba(52, 58, 61, 0.7); }
.invite-venue { margin-top: 26px; font-family: $serif-cn; font-size: 19px; letter-spacing: 0.12em; line-height: 2.15; }
.invite-venue .small { display: block; font-family: $sans-cn; font-size: 12.5px; opacity: 0.7; letter-spacing: 0.2em; }
.invite-line {
  width: 42px; height: 1px;
  background: $gold;
  opacity: 0.62;
  margin: 32px auto;
  position: relative;
}
.diamond {
  position: absolute;
  left: 50%; top: 50%;
  width: 5px; height: 5px;
  margin: -2.5px 0 0 -2.5px;
  transform: rotate(45deg);
  background: $paper;
  border: 1px solid $gold;
}
.btn-map {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 100%;
  min-height: 48px;
  margin-top: 8px;
  padding: 12px 20px;
  border: none;
  background: $wine;
  color: $ivory;
  font-size: 15px;
  letter-spacing: 0.14em;
  line-height: 1.4;
  border-radius: 999px;
  transition: opacity 0.2s, transform 0.2s;
}
.btn-map-on { background: $wine; color: $ivory; transform: scale(0.97); }
.arrow { position: relative; width: 11px; height: 11px; margin-left: 10px; }
.arrow-img { position: absolute; top: 0; left: 0; width: 11px; height: 11px; background-size: 11px 11px; background-repeat: no-repeat; }
.a-wine { opacity: 0; }
.a-ivory { opacity: 1; }
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
  line-height: normal;
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
.btn-share {
  display: block;
  width: auto;
  margin: 18px auto 0;
  padding: 11px 36px;
  background: transparent;
  color: $wine;
  border: 1px solid rgba(119, 55, 71, 0.45);
  border-radius: 999px;
  font-family: $sans-cn;
  font-weight: 400;
  font-size: 12px;
  letter-spacing: 0.24em;
  line-height: 1.4;
  min-height: 44px;
  box-sizing: border-box;
}
.btn-share::after { border: none; }
.btn-share-on { transform: scale(0.97); opacity: 0.85; }
.share-canvas {
  position: fixed;
  left: -9999px;
  top: 0;
  width: 750px;
  height: 600px;
  pointer-events: none;
  opacity: 0;
}

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
  box-sizing: border-box;
  min-width: 84px;
  min-height: 44px;
  padding: 8px 16px;
  margin-left: 12px;
  border: 1px solid $wine;
  border-radius: 999px;
  background: transparent;
  color: $wine;
  font-family: $sans-cn;
  font-size: 13px;
  letter-spacing: 0.2em;
  line-height: 1.4;
}
.sheet-btn.solid { background: $wine; color: $ivory; }
.sheet-btn-on { transform: scale(0.96); }
.sheet-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-height: 44px;
  margin-top: 12px;
  font-size: 13px;
  letter-spacing: 0.28em;
  color: rgba(52, 58, 61, 0.62);
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
  min-height: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center;
  padding: 72px 28px 48px;
  background: $ivory;
  overflow: hidden;
}
.words {
  font-family: $sans-cn;
  font-size: 18px;
  line-height: 2;
  letter-spacing: 0.04em;
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
  margin-top: 28px;
  font-family: $sans-cn;
  color: $wine-ink;
  font-size: 14px;
  letter-spacing: 0.08em;
  line-height: 2.1;
  position: relative;
  z-index: 3;
}
.tail .names { font-family: $serif-cn; font-size: 20px; letter-spacing: 0.18em; color: $graphite; }

.footer {
  text-align: center;
  padding: 28px 22px calc(28px + env(safe-area-inset-bottom));
  font-size: 13px;
  letter-spacing: 0.06em;
  line-height: 1.7;
  color: rgba(52, 58, 61, 0.78);
  background: $ivory;
}
.credit { margin: 8px auto 0; max-width: 320px; font-size: 13px; line-height: 1.7; letter-spacing: 0.04em; color: rgba(52, 58, 61, 0.72); }

/* ---------- 定稿：顶栏、开场、山、数字 ---------- */
.num { font-family: $sans-cn; font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1; }
.act-tag { display: none; }
.topbar {
  position: fixed; left: 0; right: 0; top: 0; z-index: 40;
  background: rgba(245, 240, 232, 0.96);
}
.progress { height: 2px; background: rgba(176, 141, 87, 0.22); }
.progress-bar { height: 2px; background: $gold; }
.topbar-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 16px 6px; }
.chap { font-family: $sans-cn; font-size: 13px; letter-spacing: 0.12em; color: $wine-ink; }
.music-chip {
  min-height: 32px; padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid rgba(119, 55, 71, 0.4);
  color: $wine-ink;
  background: transparent;
  font-family: $sans-cn;
  font-size: 13px;
  letter-spacing: 0.04em;
  line-height: 1.4;
}
.music-chip.on { background: $wine; color: $ivory; border-color: $wine; }
.music-chip-on { opacity: 0.8; }
.music-line {
  padding: 0 16px 6px;
  text-align: right;
  font-family: $sans-cn;
  font-size: 12px;
  letter-spacing: 0.04em;
  color: rgba(52, 58, 61, 0.72);
}
.lead, .lead-after { text-align: center; }
.lead-date { font-size: 34px; line-height: 1.15; color: $wine-ink; letter-spacing: 0.04em; }
.lead-meta, .lead-place { margin-top: 6px; font-family: $sans-cn; font-size: 15px; letter-spacing: 0.06em; color: $graphite; }
.hero-frame { position: relative; height: 52vh; min-height: 300px; margin-top: 16px; overflow: hidden; }
.hero-photo { position: absolute; top: 0; left: 0; right: 0; bottom: 0; }
.cover {
  position: absolute; left: 14px; right: 14px; bottom: 14px;
  padding: 16px 14px 14px;
  text-align: center;
  background: rgba(251, 247, 239, 0.95);
  border: 1px solid rgba(176, 141, 87, 0.4);
}
.cover-names { font-family: $serif-cn; font-size: 26px; color: $wine; letter-spacing: 0.06em; }
.cover-open { margin-top: 8px; font-family: $sans-cn; font-size: 14px; letter-spacing: 0.08em; color: $wine-ink; }
.opening-names, .sub2 { opacity: 1; animation: none; }
.lead-after { padding-top: 20px; }
.sub2 { position: static; margin-top: 10px; font-family: $sans-cn; font-size: 15px; letter-spacing: 0.04em; color: $graphite; }
.to-info {
  display: inline-block;
  margin-top: 14px;
  font-family: $sans-cn;
  font-size: 14px;
  letter-spacing: 0.08em;
  color: $wine;
  border-bottom: 1px solid rgba(119, 55, 71, 0.4);
  padding-bottom: 2px;
}
.quiet { filter: grayscale(1) contrast(1.04); }
.journey-copy .lead {
  font-family: $serif-cn;
  font-size: 30px;
  letter-spacing: 0.12em;
  color: $wine;
  line-height: 1.4;
}
.g-gap { height: 28px; }
.interlude { height: auto; min-height: 0; overflow: visible; padding: 8px 0 12px; background: $ivory; }
.inter-kicker, .inter-note {
  text-align: center;
  font-family: $sans-cn;
  font-size: 13px;
  letter-spacing: 0.08em;
  color: rgba(52, 58, 61, 0.74);
}
.inter-kicker { margin-bottom: 4px; }
.inter-copy {
  position: relative; top: auto; left: auto; right: auto; bottom: auto;
  display: block;
  padding: 4px 24px 12px;
  text-align: center;
}
.inter-copy .p {
  font-family: $serif-cn;
  font-size: 26px;
  line-height: 1.55;
  letter-spacing: 0.1em;
  color: $wine-ink;
  text-shadow: none;
}
.inter-bg {
  position: relative;
  top: auto; left: auto; right: auto; bottom: auto;
  height: 72vh;
  min-height: 420px;
  margin: 0 16px;
  overflow: hidden;
}
.inter-layer { transform: none; height: 100%; }
.inter-fade { height: 28px; }
.inter-note { margin-top: 10px; }
.sheet-role { margin-top: 2px; font-family: $sans-cn; font-size: 12px; letter-spacing: 0.06em; color: rgba(52, 58, 61, 0.62); }
.sheet-sub { padding: 0 4px; }
.toast { top: auto; bottom: calc(24px + env(safe-area-inset-bottom)); font-size: 14px; letter-spacing: 0.04em; padding: 12px 16px; }
.guide-head, .inner, .rsvp-p, .invite-time, .invite-venue, .invite-venue .small, .invite-week {
  font-family: $sans-cn;
}

@media (max-width: 360px) {
  .act-story { padding-left: 20px; padding-right: 20px; }
  .act-invite { padding-left: 16px; padding-right: 16px; }
  .invite-card { padding-left: 18px; padding-right: 18px; }
  .h2 { letter-spacing: 0.12em; }
  .invite-families { font-size: 10px; letter-spacing: 0.12em; }
  .opening-copy { padding-left: 18px; padding-right: 18px; }
}

@media (prefers-reduced-motion: reduce) {
  .reveal, .reveal-line { transition: none; opacity: 1; transform: none; }
  .kb, .bk, .j-wave { animation: none; }
  .music-btn.on .music-ring, .music-btn.on::after, .music-btn.on .bar { animation: none; }
  .opening-names, .h1, .sub, .sub2, .scroll-hint { animation: none; opacity: 1; }
}
</style>
