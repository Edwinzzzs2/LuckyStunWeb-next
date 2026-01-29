export const logger = {
  info: (...args: any[]) => {
    const timestamp = new Date().toLocaleString('zh-CN', { hour12: false })
    console.log(`[${timestamp}]`, ...args)
  },
  warn: (...args: any[]) => {
    const timestamp = new Date().toLocaleString('zh-CN', { hour12: false })
    console.warn(`[${timestamp}]`, ...args)
  },
  error: (...args: any[]) => {
    const timestamp = new Date().toLocaleString('zh-CN', { hour12: false })
    console.error(`[${timestamp}]`, ...args)
  },
}
