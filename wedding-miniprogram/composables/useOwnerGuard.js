import { useUserStore } from '@/stores/user.js'

export function useOwnerGuard() {
  const userStore = useUserStore()
  if (!userStore.isOwner || !userStore.ownerVerified) {
    uni.showModal({
      title: '无权限',
      content: '仅婚礼主人可访问此页面',
      showCancel: false,
      success: () => {
        uni.reLaunch({ url: '/pages/index/index' })
      }
    })
    return false
  }
  return true
}
