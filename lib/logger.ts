export const logger = {
  info: (...args: any[]) => {
    const timestamp = new Date().toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' })
    console.log(`[${timestamp}]`, ...args)
  },
  warn: (...args: any[]) => {
    const timestamp = new Date().toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' })
    console.warn(`[${timestamp}]`, ...args)
  },
  error: (...args: any[]) => {
    const timestamp = new Date().toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' })
    console.error(`[${timestamp}]`, ...args)
  },
}
