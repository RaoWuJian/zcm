/**
 * 响应式布局工具
 * 提供断点检测、设备类型判断等功能
 */

import { ref, onMounted, onUnmounted, computed } from 'vue'

// 响应式断点定义
export const BREAKPOINTS = {
  xs: 0,      // 超小屏幕（手机竖屏）
  sm: 576,    // 小屏幕（手机横屏）
  md: 768,    // 中等屏幕（平板竖屏）
  lg: 992,    // 大屏幕（平板横屏/小桌面）
  xl: 1200,   // 超大屏幕（桌面）
  xxl: 1600   // 超超大屏幕（大桌面）
}

// 设备类型
export const DEVICE_TYPE = {
  MOBILE: 'mobile',      // 手机
  TABLET: 'tablet',      // 平板
  DESKTOP: 'desktop'     // 桌面
}

/**
 * 获取当前窗口宽度对应的断点
 * @param {number} width - 窗口宽度
 * @returns {string} 断点名称
 */
export function getBreakpoint(width) {
  if (width < BREAKPOINTS.sm) return 'xs'
  if (width < BREAKPOINTS.md) return 'sm'
  if (width < BREAKPOINTS.lg) return 'md'
  if (width < BREAKPOINTS.xl) return 'lg'
  if (width < BREAKPOINTS.xxl) return 'xl'
  return 'xxl'
}

/**
 * 获取设备类型
 * @param {number} width - 窗口宽度
 * @returns {string} 设备类型
 */
export function getDeviceType(width) {
  if (width < BREAKPOINTS.md) return DEVICE_TYPE.MOBILE
  if (width < BREAKPOINTS.xl) return DEVICE_TYPE.TABLET
  return DEVICE_TYPE.DESKTOP
}

/**
 * 检查是否为移动设备
 * @param {number} width - 窗口宽度
 * @returns {boolean}
 */
export function isMobile(width) {
  return width < BREAKPOINTS.md
}

/**
 * 检查是否为平板设备
 * @param {number} width - 窗口宽度
 * @returns {boolean}
 */
export function isTablet(width) {
  return width >= BREAKPOINTS.md && width < BREAKPOINTS.xl
}

/**
 * 检查是否为桌面设备
 * @param {number} width - 窗口宽度
 * @returns {boolean}
 */
export function isDesktop(width) {
  return width >= BREAKPOINTS.xl
}

/**
 * 响应式布局 Composable
 * 提供响应式断点检测和设备类型判断
 * @returns {Object} 响应式状态和方法
 */
export function useResponsive() {
  // 安全地获取初始窗口尺寸
  const getInitialWidth = () => {
    if (typeof window !== 'undefined') {
      return window.innerWidth
    }
    return 1920 // 默认桌面宽度
  }

  const getInitialHeight = () => {
    if (typeof window !== 'undefined') {
      return window.innerHeight
    }
    return 1080 // 默认桌面高度
  }

  const windowWidth = ref(getInitialWidth())
  const windowHeight = ref(getInitialHeight())

  // 当前断点
  const breakpoint = computed(() => getBreakpoint(windowWidth.value))

  // 设备类型
  const deviceType = computed(() => getDeviceType(windowWidth.value))

  // 设备判断
  const isMobileDevice = computed(() => isMobile(windowWidth.value))
  const isTabletDevice = computed(() => isTablet(windowWidth.value))
  const isDesktopDevice = computed(() => isDesktop(windowWidth.value))

  // 断点判断
  const isXs = computed(() => breakpoint.value === 'xs')
  const isSm = computed(() => breakpoint.value === 'sm')
  const isMd = computed(() => breakpoint.value === 'md')
  const isLg = computed(() => breakpoint.value === 'lg')
  const isXl = computed(() => breakpoint.value === 'xl')
  const isXxl = computed(() => breakpoint.value === 'xxl')

  // 屏幕方向
  const isPortrait = computed(() => windowHeight.value > windowWidth.value)
  const isLandscape = computed(() => windowWidth.value > windowHeight.value)

  // 更新窗口尺寸
  const updateWindowSize = () => {
    if (typeof window !== 'undefined') {
      windowWidth.value = window.innerWidth
      windowHeight.value = window.innerHeight
    }
  }

  // 防抖处理
  let resizeTimer = null
  const handleResize = () => {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(updateWindowSize, 150)
  }

  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
      updateWindowSize()
    }
  })

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', handleResize)
    }
    if (resizeTimer) clearTimeout(resizeTimer)
  })

  return {
    // 窗口尺寸
    windowWidth,
    windowHeight,

    // 断点
    breakpoint,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    isXxl,

    // 设备类型
    deviceType,
    isMobileDevice,
    isTabletDevice,
    isDesktopDevice,

    // 屏幕方向
    isPortrait,
    isLandscape
  }
}

/**
 * 根据断点获取响应式值
 * @param {Object} values - 断点值映射对象
 * @param {string} currentBreakpoint - 当前断点
 * @returns {*} 对应断点的值
 */
export function getResponsiveValue(values, currentBreakpoint) {
  const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint)
  
  // 从当前断点向下查找最近的定义值
  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpointOrder[i]
    if (values[bp] !== undefined) {
      return values[bp]
    }
  }
  
  // 如果没有找到，返回默认值
  return values.default || values[breakpointOrder[0]]
}

/**
 * 触摸设备检测
 * @returns {boolean}
 */
export function isTouchDevice() {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  )
}

/**
 * 获取安全区域内边距（用于处理刘海屏等）
 * @returns {Object} 安全区域内边距
 */
export function getSafeAreaInsets() {
  const style = getComputedStyle(document.documentElement)
  return {
    top: parseInt(style.getPropertyValue('--sat') || '0'),
    right: parseInt(style.getPropertyValue('--sar') || '0'),
    bottom: parseInt(style.getPropertyValue('--sab') || '0'),
    left: parseInt(style.getPropertyValue('--sal') || '0')
  }
}

/**
 * 移动端视口高度修正（解决移动端浏览器地址栏问题）
 */
export function fixMobileViewportHeight() {
  const setVh = () => {
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
  }
  
  setVh()
  window.addEventListener('resize', setVh)
  
  return () => {
    window.removeEventListener('resize', setVh)
  }
}

/**
 * 获取表格列配置（根据设备类型）
 * @param {Array} columns - 完整列配置
 * @param {string} deviceType - 设备类型
 * @returns {Array} 过滤后的列配置
 */
export function getResponsiveTableColumns(columns, deviceType) {
  return columns.filter(column => {
    if (!column.responsive) return true
    
    if (Array.isArray(column.responsive)) {
      return column.responsive.includes(deviceType)
    }
    
    return column.responsive === deviceType
  })
}

/**
 * 获取响应式栅格配置
 * @param {string} deviceType - 设备类型
 * @returns {Object} 栅格配置
 */
export function getResponsiveGridConfig(deviceType) {
  const configs = {
    [DEVICE_TYPE.MOBILE]: {
      gutter: 12,
      span: 24,
      cols: 1
    },
    [DEVICE_TYPE.TABLET]: {
      gutter: 16,
      span: 12,
      cols: 2
    },
    [DEVICE_TYPE.DESKTOP]: {
      gutter: 20,
      span: 8,
      cols: 3
    }
  }
  
  return configs[deviceType] || configs[DEVICE_TYPE.DESKTOP]
}

