const cloud = require('wx-server-sdk')
const tcb = require('@cloudbase/node-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const DEFAULT_ENV = 'cloud1-d5gqyur7g5a4d3c8d'
const PROVIDER = process.env.AI_PROVIDER || 'hunyuan-exp'
const MODEL = process.env.AI_MODEL || 'hunyuan-2.0-instruct-20251111'
const MAX_CONTEXT_CHARS = 3600
const TASKS = new Set(['invitation_copy', 'share_card', 'timeline_pack', 'guide_tips', 'diagnostics_advice'])
const TONES = new Set(['elder_friendly', 'friends_warm', 'luxury_refined'])
const TONE_LABELS = {
  elder_friendly: '长辈正式',
  friends_warm: '朋友温柔',
  luxury_refined: '高级礼宴'
}

let aiModel = null

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const weddingId = safeText(event.weddingId, 80)
  const task = safeText(event.task, 40)
  const tone = TONES.has(event.tone) ? event.tone : 'luxury_refined'

  if (!weddingId) return fail('MISSING_WEDDING_ID', '缺少婚礼 ID')
  if (!TASKS.has(task)) return fail('INVALID_TASK', 'AI 任务类型不支持')
  if (!OPENID) return fail('NO_OPENID', '无法识别微信身份，请重新打开小程序')

  const wedding = await db.collection('weddings').doc(weddingId).get().catch(() => ({ data: null }))
  if (!wedding.data || wedding.data.owner_openid !== OPENID) {
    return fail('FORBIDDEN', '仅婚礼主人可使用 AI 发布助手')
  }

  const contextData = compactContext(event.context || {})
  const prompt = buildPrompt({ task, tone, contextData })

  try {
    const model = getAiModel()
    const result = await model.generateText({
      model: MODEL,
      temperature: 0.62,
      messages: [
        {
          role: 'system',
          content: [
            '你是“甜囍手册”的婚礼发布助手，只为婚礼主人生成候选文案或结构化草稿。',
            '风格：克制、体面、高级礼宴，长辈可读，宾客可行动。',
            '禁止编造真实坐标、电话、酒店价格、天气和已确认宾客数据。',
            '只输出 JSON，不要 Markdown，不要解释。'
          ].join('')
        },
        { role: 'user', content: prompt }
      ]
    })

    const parsed = normalizeAiResponse(task, parseJsonObject(result.text))
    return {
      success: true,
      task,
      suggestions: parsed.suggestions,
      warnings: parsed.warnings,
      usage: result.usage || {}
    }
  } catch (err) {
    console.error('[aiPublishAssistant] failed:', err)
    return fail('AI_UNAVAILABLE', 'AI 暂不可用，原有手动编辑不受影响', {
      warnings: ['请确认 CloudBase AI 服务已启用，且 aiPublishAssistant 云函数已安装 @cloudbase/node-sdk 依赖。']
    })
  }
}

function getAiModel() {
  if (aiModel) return aiModel
  const app = tcb.init({
    env: process.env.TCB_ENV || process.env.SCF_NAMESPACE || DEFAULT_ENV
  })
  aiModel = app.ai().createModel(PROVIDER)
  return aiModel
}

function buildPrompt({ task, tone, contextData }) {
  const base = {
    task,
    tone: TONE_LABELS[tone],
    context: contextData,
    responseShape: {
      suggestions: [{ id: 'string', title: 'string', content: 'string_or_object_or_array', reason: 'string' }],
      warnings: ['string']
    }
  }

  const taskRules = {
    invitation_copy: [
      '生成 3 个邀请文案候选。',
      '每个 content 为中文正文字符串，80-180 字。',
      '不使用夸张营销语，不出现未知酒店、未知地址、未知嘉宾。'
    ],
    share_card: [
      '生成 3 个分享卡片候选。',
      '每个 content 为对象：{ "title": "28字以内", "description": "48字以内", "posterLine": "18字以内" }。',
      '标题适合微信好友转发，描述必须包含婚期或到场邀请。'
    ],
    timeline_pack: [
      '生成 1 个当天流程候选。',
      'content 为数组，每项对象包含 time、title、notes、assignee_ids、is_important。',
      'time 用 HH:mm；title 12 字以内；notes 40 字以内；assignee_ids 只能从 guest、parents、party、vendor 中选择。'
    ],
    guide_tips: [
      '生成 3 个路书提示候选。',
      '每个 content 为对象：{ "transport": "80字以内", "parking": "80字以内", "route_tips": ["每条30字以内"] }。',
      '不得生成坐标，不得虚构停车费用或酒店协议价格。'
    ],
    diagnostics_advice: [
      '生成 1 个发布建议候选。',
      'content 为数组，正好 3 条下一步行动，每条 36 字以内。',
      '优先处理阻断项，其次建议项，最后人工确认。'
    ]
  }

  return JSON.stringify({ ...base, rules: taskRules[task] }, null, 2)
}

function compactContext(value) {
  const compacted = JSON.parse(JSON.stringify(value || {}, (key, val) => {
    if (typeof val === 'string') return safeText(val, 500)
    if (Array.isArray(val)) return val.slice(0, 12)
    return val
  }))
  const source = JSON.stringify(compacted)
  if (source.length <= MAX_CONTEXT_CHARS) return compacted
  return { truncated: true, summary: source.slice(0, MAX_CONTEXT_CHARS) }
}

function parseJsonObject(text) {
  const source = String(text || '').trim()
  const fenced = source.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonText = fenced ? fenced[1].trim() : source
  const start = jsonText.indexOf('{')
  const end = jsonText.lastIndexOf('}')
  if (start < 0 || end < start) throw new Error('AI 返回格式不是 JSON')
  return JSON.parse(jsonText.slice(start, end + 1))
}

function normalizeAiResponse(task, payload) {
  const warnings = Array.isArray(payload.warnings)
    ? payload.warnings.map(item => safeText(item, 80)).filter(Boolean).slice(0, 3)
    : []
  const source = Array.isArray(payload.suggestions) ? payload.suggestions : []
  const suggestions = source.map((item, index) => normalizeSuggestion(task, item, index)).filter(Boolean)
  if (!suggestions.length) throw new Error('AI 没有返回可用候选')
  return { suggestions: suggestions.slice(0, task === 'timeline_pack' || task === 'diagnostics_advice' ? 1 : 3), warnings }
}

function normalizeSuggestion(task, item, index) {
  const id = safeText(item.id, 40) || `${task}-${index + 1}`
  const title = safeText(item.title, 28) || `候选 ${index + 1}`
  const reason = safeText(item.reason, 80)
  let content = item.content

  if (task === 'invitation_copy') {
    content = safeText(content, 220)
    if (!content) return null
  } else if (task === 'share_card') {
    content = {
      title: safeText(content?.title, 28),
      description: safeText(content?.description, 48),
      posterLine: safeText(content?.posterLine, 18)
    }
    if (!content.title || !content.description) return null
  } else if (task === 'timeline_pack') {
    content = normalizeTimeline(content)
    if (!content.length) return null
  } else if (task === 'guide_tips') {
    content = {
      transport: safeText(content?.transport, 100),
      parking: safeText(content?.parking, 100),
      route_tips: Array.isArray(content?.route_tips)
        ? content.route_tips.map(item => safeText(item, 36)).filter(Boolean).slice(0, 5)
        : []
    }
    if (!content.transport && !content.parking && !content.route_tips.length) return null
  } else if (task === 'diagnostics_advice') {
    content = Array.isArray(content) ? content.map(item => safeText(item, 42)).filter(Boolean).slice(0, 3) : []
    if (!content.length) return null
  }

  return { id, title, content, reason }
}

function normalizeTimeline(content) {
  if (!Array.isArray(content)) return []
  return content.slice(0, 8).map((event, index) => {
    const time = safeText(event.time, 5)
    const title = safeText(event.title, 20)
    if (!/^\d{2}:\d{2}$/.test(time) || !title) return null
    const roles = Array.isArray(event.assignee_ids) ? event.assignee_ids : ['guest']
    return {
      id: `ai-${Date.now()}-${index}`,
      time,
      title,
      notes: safeText(event.notes, 50),
      assignee_ids: roles.filter(role => ['guest', 'parents', 'party', 'vendor'].includes(role)).slice(0, 4),
      is_important: event.is_important === true,
      venue_id: '',
      sort_order: index
    }
  }).filter(Boolean)
}

function safeText(value, maxLength) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

function fail(code, message, extra = {}) {
  return {
    success: false,
    code,
    message,
    task: '',
    suggestions: [],
    warnings: extra.warnings || [],
    usage: {}
  }
}
