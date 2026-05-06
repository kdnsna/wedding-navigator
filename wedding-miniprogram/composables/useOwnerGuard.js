import { useUserStore } from '@/stores/user.js'

/**
 * 主人端页面权限守卫
 * 实际权限校验由云函数通过 openid 完成，前端仅做状态标记
 */
export function useOwnerGuard() {
  // 云函数层面已做 openid 鉴权，前端无需重复验证
  return true
}
