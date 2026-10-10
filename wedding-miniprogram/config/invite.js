/* ============================================================
   高嘉琪 × 张靖 · 婚礼请柬（小程序版）唯一配置
   ------------------------------------------------------------
   内容与 H5（kdnsna/our-wedding，index.html 里的 CONFIG 与正文）逐字一致。
   改文案、电话、时间、图片地址，只改这里。
   本文件不能 import 任何东西：scripts/build-invite-fonts.mjs 会直接读取它来做字体子集。
   ============================================================ */

// 图片根地址（一处切换）：
//   现在：H5 的 GitHub Pages，图片已经是 H5 压缩好的 WebP / JPEG（文件名带 Vite 指纹，内容不变地址就不变）。
//   以后换云存储：运行 `node scripts/sync-invite-assets.mjs --download`，把 invite-assets/ 里的
//   assets/ 整个上传到云存储根目录 our-wedding/ 下，然后把这里改成
//   'cloud://<环境ID>.<存储桶ID>/our-wedding/'（云开发控制台 → 存储 → 任意文件的 File ID 前缀）。
//   App.vue 会在 assetBase 以 cloud:// 开头时自动 wx.cloud.init。
const assetBase = 'https://kdnsna.github.io/our-wedding/'

// 照片：w/h 是原图像素；variants 按宽度从小到大；fallback 是 WebP 失败时的 JPEG。
// pos 等同 H5 的 object-position（0–1），保证人物头部不被裁。
const images = {
  hero: { w: 1535, h: 2302, pos: [0.5, 0.5], alt: '主视觉双人婚纱照',
    variants: [[750, 'assets/hero-750-PB7KbFCh.webp'], [1535, 'assets/hero-1535-DetY04Ct.webp']],
    fallback: 'assets/hero-BI7fSnRm.jpg' },
  story1: { w: 1200, h: 1500, pos: [0.5, 0.5], alt: '欧式暖光室内的双人合影，新娘手捧花束',
    variants: [[750, 'assets/story-1-750-DlnnpTTH.webp'], [1200, 'assets/story-1-1200-xbU3rN94.webp']],
    fallback: 'assets/story-1-Czp_OGxZ.jpg' },
  story2: { w: 1080, h: 1080, pos: [0.5, 0.5], alt: '新娘坐在沙发前，裙摆与花瓣铺满地面',
    variants: [[540, 'assets/story-2-540-BZBlwNyY.webp'], [1080, 'assets/story-2-1080-Bp3i8q0F.webp']],
    fallback: 'assets/story-2-Co59vzR2.jpg' },
  journey1: { w: 1440, h: 1080, pos: [0.42, 0.5], alt: '荣成海边：石拱桥下停着两只小船',
    variants: [[960, 'assets/journey-1-960-C6a94aZa.webp'], [1440, 'assets/journey-1-1440-ehtZbAfY.webp']],
    fallback: 'assets/journey-1-Dai5S5pp.jpg' },
  journey2: { w: 1080, h: 763, pos: [0.62, 0.5], alt: '荣成海湾与白色栏杆',
    variants: [[540, 'assets/journey-2-540-DTsW3Xfn.webp'], [1080, 'assets/journey-2-1080-DvJIfOY9.webp']],
    fallback: 'assets/journey-2-DZGYweoO.jpg' },
  gallery1: { w: 1200, h: 1800, pos: [0.5, 0.38], alt: '哥特拱窗前的逆光相拥',
    variants: [[600, 'assets/gallery-1-600-CjJZsZue.webp'], [1200, 'assets/gallery-1-1200-DHLhD5Mw.webp']],
    fallback: 'assets/gallery-1-D-wsdgzM.jpg' },
  gallery2: { w: 1200, h: 1800, pos: [0.5, 0.5], alt: '粉色花拱下的欧式教堂合影',
    variants: [[600, 'assets/gallery-2-600-BMQCGJVp.webp'], [1200, 'assets/gallery-2-1200-DST0U-9h.webp']],
    fallback: 'assets/gallery-2-CjdfZWQE.jpg' },
  gallery3: { w: 1200, h: 800, pos: [0.5, 0.5], alt: '蓝调时分，山前牵手',
    variants: [[750, 'assets/gallery-3-750-DD1oc2bI.webp'], [1200, 'assets/gallery-3-1200-CUUvg1ID.webp']],
    fallback: 'assets/gallery-3-BymlIWN3.jpg' },
  gallery4: { w: 1080, h: 1620, pos: [0.5, 0.66], alt: '中式格扇门前牵手',
    variants: [[540, 'assets/gallery-4-540-02iO2EO6.webp'], [1080, 'assets/gallery-4-1080-Cr1Ov-L2.webp']],
    fallback: 'assets/gallery-4-CVb0jVd_.jpg' },
  gallery5: { w: 1080, h: 1620, pos: [0.5, 0.32], alt: '中式窗格·执扇',
    variants: [[600, 'assets/gallery-5-600-KCCuJmdH.webp'], [1080, 'assets/gallery-5-1080-D9HRmzFn.webp']],
    fallback: 'assets/gallery-5-7pPmkHcE.jpg' },
  gallery6: { w: 1200, h: 800, pos: [0.5, 0], alt: '草地上一起亮出婚戒',
    variants: [[750, 'assets/gallery-6-750-CIgpNxfU.webp'], [1200, 'assets/gallery-6-1200-BKKACda3.webp']],
    fallback: 'assets/gallery-6-CXScKaLw.jpg' },
  gallery7: { w: 1200, h: 1800, pos: [0.5, 0.5], alt: '草地山前，头纱随风扬起',
    variants: [[600, 'assets/gallery-7-600-DE-9Knev.webp'], [1200, 'assets/gallery-7-1200-CnB9iDuZ.webp']],
    fallback: 'assets/gallery-7-D6p0uZ1O.jpg' },
  gallery8: { w: 1200, h: 1800, pos: [0.5, 0.5], alt: '日落时分的吻，头纱铺开',
    variants: [[600, 'assets/gallery-8-600-cfR0sBCG.webp'], [1200, 'assets/gallery-8-1200-BYJjGNVq.webp']],
    fallback: 'assets/gallery-8-Ct44r6qK.jpg' },
  interlude: { w: 1920, h: 1280, pos: [0.4, 0.5], alt: '夕阳下牵手起舞的剪影',
    variants: [[1200, 'assets/interlude-1200-C3OSpo0o.webp'], [1920, 'assets/interlude-1920-BJzQLs_P.webp']],
    fallback: 'assets/interlude-D4TK7R_L.jpg' }
}

const CONFIG = {
  groomName: '高嘉琪',
  brideName: '张靖',
  ceremonyTime: '上午 10:58',
  date: { y: 2026, m: 11, d: 14 },

  // 联系人：电话 = 一键拨号；wechat 非空才显示「复制」（与 H5 一致：只有高嘉琪留了微信）
  contacts: [
    { name: '高嘉琪', tel: '15550070122', wechat: 'Kdnsna7' },
    { name: '张靖', tel: '13061243813', wechat: '' }
  ],

  // 婚礼地点导航：uni.openLocation 需要 GCJ-02 经纬度。
  // ⚠️ 待新人确认：37.167282, 122.521789 取自 Tripadvisor 猫途鹰 / 中国假日旅游网「荣成华星宾馆」酒店页的地图中心点
  // （tripadvisor.cn 地图为高德，按 GCJ-02 处理）。请在腾讯地图坐标拾取器 https://lbs.qq.com/getPoint/ 搜「荣成华星宾馆」核对，
  // 有偏差直接改这两个数。打不开地图时会自动复制地址。
  venue: {
    name: '荣成华星宾馆',
    address: '荣成市成山大道东段1号',
    latitude: 37.167282,
    longitude: 122.521789,
    scale: 16
  },

  // 背景音乐：小程序里放不了网易云外链播放器。默认关闭，不打包任何音频。
  // 以后有授权音频（https 直链）再把 enabled 设为 true、填 src 与 credit。
  music: {
    enabled: false,
    src: '',
    title: '',
    credit: ''
  },

  // 分享卡片：标题沿用 H5 #share-config；封面复用 H5 的分享封面（1080×1080）
  share: {
    title: '高嘉琪 & 张靖 · 婚礼邀请 · 2026.11.14 威海荣成',
    desc: '山海很远，相见值得。2026.11.14，我们在荣成等你赴约。',
    imageUrl: 'https://kdnsna.github.io/our-wedding/share-cover.jpg',
    path: '/pages/invite/index'
  },

  assetBase,
  images,

  // 字体：优先用包内 WOFF（config/invite-fonts.js，由 scripts/build-invite-fonts.mjs 生成，Data URL，免域名配置），
  // 基础库 < 3.7.9 不支持 Data URL 时回退到下面的 https WOFF2（H5 线上同一份字体）。
  fonts: [
    { family: 'Cormorant Garamond', key: 'cormorant', https: 'https://kdnsna.github.io/our-wedding/assets/CormorantGaramond-500-latin-DWqiK5H6.woff2' },
    { family: 'Pinyon Script', key: 'pinyon', https: 'https://kdnsna.github.io/our-wedding/assets/PinyonScript-latin-CdG5SjLt.woff2' },
    { family: 'MaShanZheng', key: 'mashanzheng', https: 'https://kdnsna.github.io/our-wedding/assets/MaShanZheng-subset-1xoUNzcr.woff2' }
  ],

  /* ---------------- 正文（逐字取自 H5） ---------------- */
  opening: {
    title: ['A LOVE STORY', 'BY THE SEA'],
    date: '2026.11.14',
    place: 'WEIHAI · RONGCHENG',
    sub2: '一封写给山海，也写给你的邀请函'
  },
  story: {
    tag: '02 · Our Story',
    // 每行由片段组成：em = 酒红强调
    lines: [
      [{ t: '一个从' }, { t: '黄河边', em: true }, { t: '来，' }],
      [{ t: '一个在' }, { t: '泰山脚下', em: true }, { t: '长大。' }],
      [{ t: '隔着半座山东的人海，' }],
      [{ t: '我们在同一座城市，停下脚步。' }],
      [{ t: '后来才懂——' }],
      [{ t: '所有的出发，都是为了相遇。' }]
    ],
    origins: ['滨州博兴', '泰安新泰 · 相伴于济南']
  },
  journey: {
    tag: '03 · The Journey',
    lead: '山海之间，天地为证',
    lines: ['这一次，', '我们想邀请你，', '一起奔赴山海。'],
    place: 'RONGCHENG · BY THE SEA',
    postcard: 'See you by the sea'
  },
  gallery: {
    tag: '04 · The Gallery',
    captions: { gallery1: 'The Glance', gallery2: 'In Bloom', gallery4: 'Side by Side', gallery5: 'Grace', gallery7: '', gallery8: 'At Dusk' },
    phrases: ['Every Moment, With You.', 'From This Day Forward.']
  },
  interlude: {
    lines: ['所爱隔山海，', '山海皆可平。'],
    en: 'Love Will Find A Way.'
  },
  invitation: {
    families: 'TOGETHER WITH OUR FAMILIES',
    title: 'The Wedding',
    zh: '诚挚邀请您，见证我们的婚礼',
    month: 'NOVEMBER · 2026',
    venueLines: ['山东 · 威海荣成', '荣成华星宾馆 · 户外草坪'],
    mapLabel: '婚礼地点导航',
    note: 'We Would Love To See You There.'
  },
  // 赴约指南 7 张卡。正文按行；片段 b = 加粗；行内 {ceremonyTime} 会被替换；contacts: true 的行渲染成联系人电话（可点拨号）
  guide: {
    title: '赴 约 指 南',
    items: [
      { icon: 'calendar', title: '11月13日 · 亲友抵达', lines: [
        [{ t: '若你提前一天抵达，荣成的海与落日，值得一个傍晚。' }],
        [{ t: '大家都住在' }, { t: '荣成华星宾馆', b: true }, { t: '，房间已为你预留好，到了安心入住就好。' }]
      ] },
      { icon: 'pin', title: '11月14日 · 婚礼当天', lines: [
        [{ t: '地点：荣成华星宾馆 · 户外草坪' }],
        [{ t: '仪式时间：{ceremonyTime}' }],
        [{ t: '联系人（点号码可直接拨打）：' }],
        { contacts: true },
        [{ t: '点击上方「婚礼地点导航」，即可一键前往。' }]
      ] },
      { icon: 'train', title: '交通指引', lines: [
        [{ t: '高铁', b: true }, { t: '：乘至「荣成站」，出站后打车前往酒店。' }],
        [{ t: '自驾', b: true }, { t: '：导航搜索「荣成华星宾馆」。' }],
        [{ t: '飞机', b: true }, { t: '：可飞抵威海大水泊机场，再乘车前往荣成。' }]
      ] },
      { icon: 'bed', title: '住宿安排', lines: [
        [{ t: '我们已在' }, { t: '荣成华星宾馆', b: true }, { t: '为大家预留了房间，不用另外预订。' }],
        [{ t: '婚礼也在这里举行，住下便不必再奔波。行程有变化，随时告诉我们一声。' }]
      ] },
      { icon: 'weather', title: '天气与着装', lines: [
        [{ t: '十一月中旬的荣成已是深秋，海边风大，白天约 10℃ 上下，早晚更凉（临近请再看天气预报）。' }],
        [{ t: '仪式在' }, { t: '户外草坪', b: true }, { t: '举行，建议备一件挡风外套，女士可加一条披肩，美丽与温度都要。' }]
      ] },
      { icon: 'camera', title: '周边游玩', lines: [
        [{ t: '若你多留一两日，荣成值得慢慢逛：' }],
        [{ t: '成山头', b: true }, { t: '——中国大陆伸向海洋的最东端，看海上日出；' }],
        [{ t: '那香海·钻石沙滩', b: true }, { t: '——细沙、风车与海岸；' }],
        [{ t: '烟墩角天鹅湖', b: true }, { t: '——十一月，正是大天鹅从西伯利亚归来的季节；' }],
        [{ t: '神雕山野生动物世界', b: true }, { t: '——适合带娃同行。' }]
      ] },
      { icon: 'phone', title: '联系我们', lines: [
        [{ t: '婚礼前后的任何问题——路线、住宿、座位安排，都欢迎随时联系我们（点号码可直接拨打）：' }],
        { contacts: true }
      ] }
    ]
  },
  rsvp: {
    prompt: '愿与你相见。若方便，请告诉我们，能否赴约：',
    button: '回复赴约',
    sheetTitle: '期待与你相见',
    sheetSub: ['能否赴约、哪天抵达，', '打个电话或发条微信告诉我们就好。'],
    close: '关闭',
    copied: '微信号已复制，打开微信添加即可',
    copyFailed: '微信号：{wechat}（请长按复制）'
  },
  ending: {
    lines: ['山海很远，相见值得。', '谢谢你远道而来，', '见证我们，成为彼此的归处。'],
    date: '2026 . 11 . 14',
    place: 'WEIHAI · RONGCHENG'
  },
  footer: 'A LOVE STORY, BY THE SEA · 2026',
  infoFab: '婚礼信息'
}

export default CONFIG
