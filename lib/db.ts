import { Pool, PoolClient } from 'pg'
import bcrypt from 'bcryptjs'

type QueryValues = any[] | undefined

let pool: Pool | null = null
let initPromise: Promise<void> | null = null

function getPool() {
  if (pool) return pool
  const host = process.env.DB_HOST
  const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432
  const user = process.env.DB_USER
  const password = process.env.DB_PASSWORD
  const database = process.env.DB_NAME
  if (!host || !user || !database) {
    throw new Error('DB config missing')
  }
  pool = new Pool({ host, port, user, password, database, max: 10 })
  return pool
}

/**
 * 确保数据库表和初始数据已就绪
 * 包含：用户表、分类表、网站表及其索引
 */
async function ensureInitialized() {
  if (initPromise) return initPromise
  initPromise = (async () => {
    const p = getPool()
    await p.query(
      'CREATE TABLE IF NOT EXISTS users (\n' +
        '  id BIGSERIAL PRIMARY KEY,\n' +
        '  username VARCHAR(64) UNIQUE NOT NULL,\n' +
        '  password_hash TEXT NOT NULL,\n' +
        '  is_admin BOOLEAN NOT NULL DEFAULT FALSE,\n' +
        '  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n' +
        ')'
    )
    await p.query(
      'CREATE TABLE IF NOT EXISTS categories (\n' +
        '  id BIGSERIAL PRIMARY KEY,\n' +
        '  name VARCHAR(128) NOT NULL,\n' +
        '  en_name VARCHAR(128),\n' +
        '  icon VARCHAR(256),\n' +
        '  parent_id BIGINT,\n' +
        '  sort_order INT NOT NULL DEFAULT 0,\n' +
        '  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n' +
        ')'
    )
    await p.query(
      'CREATE TABLE IF NOT EXISTS sites (\n' +
        '  id BIGSERIAL PRIMARY KEY,\n' +
        '  category_id BIGINT NOT NULL,\n' +
        '  url TEXT NOT NULL,\n' +
        '  backup_url TEXT,\n' +
        '  internal_url TEXT,\n' +
        '  logo TEXT,\n' +
        '  title TEXT NOT NULL,\n' +
        '  "desc" TEXT,\n' +
        '  sort_order INT NOT NULL DEFAULT 0,\n' +
        '  is_visible BOOLEAN NOT NULL DEFAULT TRUE,\n' +
        '  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n' +
        '  update_port_enabled BOOLEAN NOT NULL DEFAULT TRUE\n' +
        ')'
    )
    await p.query(
      'CREATE TABLE IF NOT EXISTS webhook_logs (\n' +
        '  id BIGSERIAL PRIMARY KEY,\n' +
        '  source VARCHAR(64) NOT NULL,\n' +
        '  level VARCHAR(16) NOT NULL,\n' +
        '  message TEXT NOT NULL,\n' +
        '  meta JSONB,\n' +
        '  status INT,\n' +
        '  ip TEXT,\n' +
        '  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n' +
        ')'
    )
    await p.query(
      'CREATE TABLE IF NOT EXISTS settings (\n' +
        '  key VARCHAR(128) PRIMARY KEY,\n' +
        '  value TEXT NOT NULL,\n' +
        '  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()\n' +
        ')'
    )
    await p.query('ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id BIGINT')
    await p.query('ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0')
    await p.query('ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now()')
    await p.query('ALTER TABLE sites ADD COLUMN IF NOT EXISTS internal_url TEXT')
    await p.query('ALTER TABLE sites ADD COLUMN IF NOT EXISTS "desc" TEXT')
    await p.query('ALTER TABLE sites ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0')
    await p.query('ALTER TABLE sites ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE')
    await p.query('ALTER TABLE sites ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now()')
    await p.query('ALTER TABLE sites ADD COLUMN IF NOT EXISTS update_port_enabled BOOLEAN NOT NULL DEFAULT TRUE')
    await p.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE')
    await p.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now()')
    await p.query('CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id)')
    await p.query('CREATE INDEX IF NOT EXISTS idx_sites_category_id ON sites(category_id)')
    await p.query('CREATE INDEX IF NOT EXISTS idx_webhook_logs_source ON webhook_logs(source)')
    await p.query('CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC)')

    const adminUsername = (process.env.ADMIN_USERNAME || 'admin').trim()
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456'
    const adminResults = await p.query('SELECT id FROM users WHERE username = $1 LIMIT 1', [adminUsername])
    
    if (adminResults.rows.length === 0) {
      // 仅在 admin 账号不存在时初始化一次，后续支持在界面修改密码并持久化
      const passwordHash = await bcrypt.hash(adminPassword, 10)
      await p.query(
        'INSERT INTO users (username, password_hash, is_admin) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING',
        [adminUsername, passwordHash, true]
      )
    }

    // 修复主键序列不同步问题，确保新建时 ID 不冲突
    const tables = ['users', 'categories', 'sites', 'webhook_logs']
    for (const table of tables) {
      await p.query(
        `SELECT setval(
          pg_get_serial_sequence($1, 'id'),
          COALESCE((SELECT MAX(id) FROM ${table}), 1),
          (SELECT MAX(id) FROM ${table}) IS NOT NULL
        )`,
        [table]
      )
    }
  })().catch((e) => {
    initPromise = null
    throw e
  })
  return initPromise
}

export async function query(sql: string, values?: QueryValues) {
  await ensureInitialized()
  const p = getPool()
  const result = await p.query(sql, values)
  return result.rows as any[]
}

export async function execute(sql: string, values?: QueryValues) {
  await ensureInitialized()
  const p = getPool()
  return p.query(sql, values)
}

export async function transaction<T>(fn: (conn: PoolClient) => Promise<T>) {
  await ensureInitialized()
  const p = getPool()
  const conn = await p.connect()
  try {
    await conn.query('BEGIN')
    const result = await fn(conn)
    await conn.query('COMMIT')
    return result
  } catch (e) {
    await conn.query('ROLLBACK')
    throw e
  } finally {
    conn.release()
  }
}

export async function connQuery(conn: PoolClient, sql: string, values?: QueryValues) {
  const result = await conn.query(sql, values)
  return result.rows as any[]
}

export async function connExecute(conn: PoolClient, sql: string, values?: QueryValues) {
  return conn.query(sql, values)
}
