import { useUserStore } from '@/stores/user.js'

export function useOwnerGuard() {
  const userStore = useUserStore()
  if (userStore.isOwner && userStore.ownerVerified) {
    return true
  }

  // 未验证 → 弹出手机号验证
  uni.showModal({
    title: '身份验证',
    editable: true,
    placeholderText: '请输入创建婚礼时填写的手机号后4位',
    content: '',
    success: (res) => {
      if (res.confirm && res.content) {
        userStore.verifyOwner(res.content.trim()).then((ok) => {
          if (!ok) {
            uni.showToast({ title: '验证失败，请重试', icon: 'none' })
          }
        })
      } else if (res.cancel) {
        uni.reLaunch({ url: '/pages-owner/manage/index' })
      }
    }
  })
}
