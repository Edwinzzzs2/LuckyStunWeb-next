import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  const rows = await query(
    'SELECT id, name, parent_id FROM categories ORDER BY parent_id ASC, sort_order ASC, id ASC'
  )
  const flat = rows.map((item) => ({ id: item.id, name: item.name }))
  return NextResponse.json(flat)
}
