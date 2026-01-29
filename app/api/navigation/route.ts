import { NextResponse } from 'next/server'
import { getNavigationTree } from '@/lib/navigation'

export async function GET() {
  try {
    const tree = await getNavigationTree()
    return NextResponse.json(tree)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
