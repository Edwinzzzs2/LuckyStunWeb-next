import { getNavigationData } from '@/lib/navigation'
import { NavigationPage } from './navigation-page'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Page() {
  // 在服务端直接获取数据，实现 SSR，解决刷新时的白屏闪烁问题
  const data = await getNavigationData()

  return <NavigationPage initialData={data} />
}
