import { getThemeTokens, isPremiumTheme, resolveTheme } from '@/utils/legacy-theme-map.js'

export const PLAN_TIERS = {
  free: {
    id: 'free',
    label: '免费版',
    desc: '适合个人婚礼上线，保留 RSVP、路书、流程、祝福等刚需功能'
  },
  pro: {
    id: 'pro',
    label: '高级版',
    desc: '适合模板付费、海报套装、去品牌水印等增值权益'
  },
  business: {
    id: 'business',
    label: '商家版',
    desc: '适合婚礼策划、酒店宴会厅或批量制作工作台'
  }
}

export const DEFAULT_ENTITLEMENTS = {
  premium_templates: false,
  poster_pack: false,
  remove_branding: false,
  workspace_multi: false
}

export const ENTITLEMENT_LABELS = {
  premium_templates: '高级模板',
  poster_pack: '海报套装',
  remove_branding: '去品牌水印',
  workspace_multi: '多婚礼工作区'
}

export function normalizeEntitlements(entitlements = {}) {
  return {
    ...DEFAULT_ENTITLEMENTS,
    ...(entitlements || {})
  }
}

export function getPlanTier(plan = 'free') {
  return PLAN_TIERS[plan] || PLAN_TIERS.free
}

export function getTemplateTier(template = {}) {
  const theme = template?.theme || template?.commercial?.theme_key || template?.themeClass
  if (theme) return isPremiumTheme(theme) ? 'premium' : 'free'
  return template?.commercial?.tier || template?.tier || 'free'
}

export function isTemplatePremium(template = {}) {
  return getTemplateTier(template) !== 'free'
}

export function getTemplateTierLabel(template = {}) {
  return isTemplatePremium(template) ? '高级模板' : '免费模板'
}

export function getTemplateEntitlement(template = {}) {
  if (!isTemplatePremium(template)) return ''
  return template?.commercial?.entitlement || 'premium_templates'
}

export function canUseTemplate(template = {}, entitlements = {}) {
  if (!isTemplatePremium(template)) return true
  const normalized = normalizeEntitlements(entitlements)
  return normalized[getTemplateEntitlement(template)] === true
}

export function canUseTheme(theme = 'wine', entitlements = {}) {
  if (!isPremiumTheme(theme)) return true
  return normalizeEntitlements(entitlements).premium_templates === true
}

export function getCommercialHint(template = {}, entitlements = {}) {
  if (!template?.id) return ''
  if (!isTemplatePremium(template)) {
    return '免费模板会长期保留，可直接发布给宾客使用。'
  }
  if (canUseTemplate(template, entitlements)) {
    return '你已拥有该高级模板权益，可直接发布。'
  }
  return '当前作为体验期高级模板开放预览和发布；接入微信支付后建议作为模板付费或套装权益。'
}

export function buildTemplateCommercialState(template = {}, entitlements = {}) {
  const theme = resolveTheme(template?.theme || template?.commercial?.theme_key || template?.themeClass)
  const themeMeta = getThemeTokens(theme)
  const tier = getTemplateTier(template)
  const entitlement = getTemplateEntitlement(template)
  return {
    template_tier: tier,
    theme_key: theme,
    theme_name: themeMeta.name,
    template_entitlement: entitlement,
    billing_state: isTemplatePremium(template) && !canUseTemplate(template, entitlements) ? 'trial' : 'included'
  }
}

export function buildThemeCommercialState(theme = 'wine', entitlements = {}) {
  const normalizedTheme = resolveTheme(theme)
  const themeMeta = getThemeTokens(normalizedTheme)
  const premium = isPremiumTheme(normalizedTheme)
  return {
    template_tier: premium ? 'premium' : 'free',
    theme_key: normalizedTheme,
    theme_name: themeMeta.name,
    template_entitlement: premium ? 'premium_templates' : '',
    billing_state: premium && !canUseTheme(normalizedTheme, entitlements) ? 'trial' : 'included'
  }
}
