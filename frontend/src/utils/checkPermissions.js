import { useUserStore } from '@/stores/user';

const hasPermission = (permissionCode) => {
    // 动态获取最新的用户信息
    const userStore = useUserStore()
    const user = userStore.userInfo;
    
    if (!user) return false
    // 如果是管理员，自动拥有所有权限
    if (user.isAdmin) return true
    
    if (!user.rolePermission || !user.rolePermission.permissions) return false
    
    // 直接检查用户角色的权限数组
    return user.rolePermission.permissions.some((p) => p === permissionCode)
  }

export default (permissionCodes) => {
    return permissionCodes.some((p) => hasPermission(p))
}