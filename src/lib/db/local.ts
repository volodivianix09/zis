import Database from 'better-sqlite3'
import path from 'path'
import crypto from 'crypto'

const DB_PATH = path.join(process.cwd(), '.local.db')

let db: Database.Database | null = null

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initSchema(db)
    const count = (db.prepare('SELECT COUNT(*) as c FROM profiles').get() as any).c
    if (count === 0) {
      seedTestData()
    }
  }
  return db
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      telegram_id INTEGER UNIQUE NOT NULL,
      username TEXT,
      display_name TEXT NOT NULL,
      avatar_url TEXT,
      bio TEXT,
      is_verified INTEGER DEFAULT 0,
      liveness_passed_at TEXT,
      rating REAL DEFAULT 5.0,
      walk_count INTEGER DEFAULT 0,
      public_key TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS walks (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      creator_id TEXT NOT NULL REFERENCES profiles(id),
      title TEXT NOT NULL,
      description TEXT,
      format TEXT NOT NULL CHECK(format IN ('walk','coffee','sport','food','culture','other')),
      district TEXT,
      address TEXT,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      max_people INTEGER DEFAULT 5,
      current_count INTEGER DEFAULT 1,
      status TEXT DEFAULT 'open' CHECK(status IN ('open','matching','active','completed','cancelled')),
      scheduled_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT
    );

    CREATE TABLE IF NOT EXISTS walk_participants (
      walk_id TEXT NOT NULL REFERENCES walks(id),
      user_id TEXT NOT NULL REFERENCES profiles(id),
      role TEXT DEFAULT 'participant' CHECK(role IN ('creator','participant')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','accepted','declined')),
      liveness_verified INTEGER DEFAULT 0,
      joined_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (walk_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      walk_id TEXT NOT NULL REFERENCES walks(id),
      sender_id TEXT NOT NULL REFERENCES profiles(id),
      content TEXT NOT NULL,
      encrypted_content TEXT,
      iv TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      is_system INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_walks_status ON walks(status);
    CREATE INDEX IF NOT EXISTS idx_walks_creator ON walks(creator_id);
    CREATE INDEX IF NOT EXISTS idx_walks_geo ON walks(lat, lng);
    CREATE INDEX IF NOT EXISTS idx_messages_walk ON messages(walk_id);
    CREATE INDEX IF NOT EXISTS idx_participants_user ON walk_participants(user_id);
    CREATE INDEX IF NOT EXISTS idx_participants_walk ON walk_participants(walk_id);
  `)
}

function uuid(): string {
  return crypto.randomUUID()
}

// --- Query Functions ---

export function createProfile(id: string, telegramId: number, displayName: string, username?: string) {
  const d = getDb()
  const stmt = d.prepare(`
    INSERT OR IGNORE INTO profiles (id, telegram_id, display_name, username, rating)
    VALUES (?, ?, ?, ?, 5.0)
  `)
  stmt.run(id, telegramId, displayName, username || null)
  return getProfile(id)
}

export function getProfile(id: string) {
  const d = getDb()
  return d.prepare('SELECT * FROM profiles WHERE id = ?').get(id) as any || null
}

export function getProfileByTelegramId(tgId: number) {
  const d = getDb()
  return d.prepare('SELECT * FROM profiles WHERE telegram_id = ?').get(tgId) as any || null
}

export function createWalk(data: {
  creator_id: string
  title: string
  description?: string
  format: string
  district?: string
  address?: string
  lat: number
  lng: number
  max_people: number
  scheduled_at: string
}) {
  const d = getDb()
  const id = uuid()
  d.prepare(`
    INSERT INTO walks (id, creator_id, title, description, format, district, address, lat, lng, max_people, scheduled_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.creator_id, data.title, data.description || null, data.format,
         data.district || null, data.address || null, data.lat, data.lng, data.max_people, data.scheduled_at)
  
  d.prepare(`INSERT INTO walk_participants (walk_id, user_id, role, status, liveness_verified) VALUES (?, ?, 'creator', 'accepted', 1)`)
    .run(id, data.creator_id)
  
  return d.prepare('SELECT * FROM walks WHERE id = ?').get(id) as any
}

export function getNearbyWalks(lat: number, lng: number, radiusKm: number = 3, status: string = 'open') {
  const d = getDb()
  const rows = d.prepare(`
    SELECT w.*,
           ROUND(2 * 6371 * ASIN(SQRT(
             POWER(SIN(RADIANS((w.lat - ?)) / 2), 2) +
             COS(RADIANS(?)) * COS(RADIANS(w.lat)) *
             POWER(SIN(RADIANS((w.lng - ?)) / 2), 2)
           )), 2) AS distance_km,
           p.display_name AS creator_name,
           p.avatar_url AS creator_avatar
    FROM walks w
    LEFT JOIN profiles p ON p.id = w.creator_id
    WHERE w.status = ?
    AND (2 * 6371 * ASIN(SQRT(
      POWER(SIN(RADIANS((w.lat - ?)) / 2), 2) +
      COS(RADIANS(?)) * COS(RADIANS(w.lat)) *
      POWER(SIN(RADIANS((w.lng - ?)) / 2), 2)
    ))) <= ?
    ORDER BY distance_km ASC
  `).all(lat, lat, lng, status, lat, lat, lng, radiusKm) as any[]
  
  return rows
}

export function getWalk(id: string) {
  const d = getDb()
  return d.prepare(`
    SELECT w.*, p.display_name AS creator_name, p.avatar_url AS creator_avatar
    FROM walks w
    LEFT JOIN profiles p ON p.id = w.creator_id
    WHERE w.id = ?
  `).get(id) as any
}

export function joinWalk(walkId: string, userId: string) {
  const d = getDb()
  const walk = d.prepare('SELECT * FROM walks WHERE id = ?').get(walkId) as any
  if (!walk) return { error: 'Walk not found' }
  if (walk.current_count >= walk.max_people) return { error: 'Walk is full' }

  const existing = d.prepare('SELECT * FROM walk_participants WHERE walk_id = ? AND user_id = ?').get(walkId, userId) as any
  if (existing) return { error: 'Already joined' }

  d.prepare(`INSERT INTO walk_participants (walk_id, user_id, role, status, liveness_verified) VALUES (?, ?, 'participant', 'pending', 0)`)
    .run(walkId, userId)

  return { success: true }
}

export function respondToWalk(walkId: string, creatorId: string, action: 'accepted' | 'declined') {
  const d = getDb()
  const walk = d.prepare('SELECT * FROM walks WHERE id = ?').get(walkId) as any
  if (!walk || walk.creator_id !== creatorId) return { error: 'Not your walk' }

  const participant = d.prepare("SELECT * FROM walk_participants WHERE walk_id = ? AND status = 'pending' LIMIT 1")
    .get(walkId) as any
  if (!participant) return { error: 'No pending requests' }

  d.prepare('UPDATE walk_participants SET status = ? WHERE walk_id = ? AND user_id = ?')
    .run(action, walkId, participant.user_id)

  if (action === 'accepted') {
    d.prepare('UPDATE walks SET current_count = current_count + 1, status = ? WHERE id = ?')
      .run('active', walkId)
    
    d.prepare(`INSERT INTO messages (id, walk_id, sender_id, content, is_system) VALUES (?, ?, ?, 'Участник присоединился к прогулке', 1)`)
      .run(uuid(), walkId, creatorId)
  }

  return { success: true, status: action }
}

export function getMessages(walkId: string) {
  const d = getDb()
  return d.prepare(`
    SELECT m.*, p.display_name AS sender_name
    FROM messages m
    LEFT JOIN profiles p ON p.id = m.sender_id
    WHERE m.walk_id = ?
    ORDER BY m.created_at ASC
  `).all(walkId) as any[]
}

export function sendMessage(walkId: string, senderId: string, content: string) {
  const d = getDb()
  const id = uuid()
  d.prepare('INSERT INTO messages (id, walk_id, sender_id, content) VALUES (?, ?, ?, ?)')
    .run(id, walkId, senderId, content)
  return d.prepare(`
    SELECT m.*, p.display_name AS sender_name
    FROM messages m
    LEFT JOIN profiles p ON p.id = m.sender_id
    WHERE m.id = ?
  `).get(id) as any
}

export function getUserWalks(userId: string) {
  const d = getDb()
  return d.prepare(`
    SELECT w.*, p.display_name AS creator_name, p.avatar_url AS creator_avatar
    FROM walks w
    LEFT JOIN profiles p ON p.id = w.creator_id
    WHERE w.creator_id = ?
    ORDER BY w.created_at DESC
  `).all(userId) as any[]
}

export function getUserActiveWalks(userId: string) {
  const d = getDb()
  return d.prepare(`
    SELECT DISTINCT w.*, p.display_name AS creator_name
    FROM walks w
    JOIN walk_participants wp ON wp.walk_id = w.id
    LEFT JOIN profiles p ON p.id = w.creator_id
    WHERE wp.user_id = ? AND wp.status IN ('accepted') AND w.status IN ('active', 'matching')
    ORDER BY w.created_at DESC
  `).all(userId) as any[]
}

export function getIncomingRequests(userId: string) {
  const d = getDb()
  return d.prepare(`
    SELECT w.*, wp.user_id AS requester_id, wp.status AS request_status,
           p.display_name AS requester_name, p.avatar_url AS requester_avatar
    FROM walks w
    JOIN walk_participants wp ON wp.walk_id = w.id
    LEFT JOIN profiles p ON p.id = wp.user_id
    WHERE w.creator_id = ? AND wp.status = 'pending'
  `).all(userId) as any[]
}

export function checkDb() {
  try {
    const d = getDb()
    const profiles = d.prepare('SELECT COUNT(*) as count FROM profiles').get() as any
    const walks = d.prepare('SELECT COUNT(*) as count FROM walks').get() as any
    return {
      connected: true,
      profiles: profiles.count,
      walks: walks.count,
    }
  } catch {
    return { connected: false, profiles: 0, walks: 0 }
  }
}

export function getLatestMessages(walkIds: string[]) {
  if (walkIds.length === 0) return []
  const d = getDb()
  const placeholders = walkIds.map(() => '?').join(',')
  return d.prepare(`
    SELECT m.*, walk_id FROM messages m
    WHERE m.id IN (
      SELECT MAX(m2.id) FROM messages m2
      WHERE m2.walk_id IN (${placeholders})
      GROUP BY m2.walk_id
    )
  `).all(...walkIds) as any[]
}

export function getStats() {
  const d = getDb()
  return {
    profiles: (d.prepare('SELECT COUNT(*) as c FROM profiles').get() as any).c,
    walks: (d.prepare('SELECT COUNT(*) as c FROM walks').get() as any).c,
    messages: (d.prepare('SELECT COUNT(*) as c FROM messages').get() as any).c,
    active_walks: (d.prepare("SELECT COUNT(*) as c FROM walks WHERE status = 'active'").get() as any).c,
    pending_requests: (d.prepare("SELECT COUNT(*) as c FROM walk_participants WHERE status = 'pending'").get() as any).c,
  }
}

export function cleanup() {
  const d = getDb()
  d.prepare("DELETE FROM walk_participants WHERE status = 'pending'").run()
  d.prepare("UPDATE walks SET status = 'completed' WHERE status = 'active'").run()
}

export function seedTestData() {
  const d = getDb()
  
  const existing = d.prepare('SELECT COUNT(*) as c FROM profiles').get() as any
  if (existing.c > 0) return
  
  const user1Id = uuid()
  d.prepare('INSERT INTO profiles (id, telegram_id, display_name, username) VALUES (?, 12345, ?, ?)')
    .run(user1Id, 'Алексей', 'alex_guide')
  
  const user2Id = uuid()
  d.prepare('INSERT INTO profiles (id, telegram_id, display_name, username) VALUES (?, 12346, ?, ?)')
    .run(user2Id, 'Мария', 'maria_walk')
  
  const now = new Date()
  const formats = ['walk', 'coffee', 'sport', 'food', 'culture']
  const districts = ['Центр', 'Арбат', 'Парк Горького', 'Патрики', 'ВДНХ']
  
  for (let i = 0; i < 5; i++) {
    const walkId = uuid()
    d.prepare(`
      INSERT INTO walks (id, creator_id, title, description, format, district, lat, lng, max_people, scheduled_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      walkId,
      i % 2 === 0 ? user1Id : user2Id,
      `Прогулка по ${districts[i]}`,
      `Ищу компанию для прогулки, формат ${formats[i]}`,
      formats[i],
      districts[i],
      55.75 + (Math.random() - 0.5) * 0.04,
      37.6 + (Math.random() - 0.5) * 0.04,
      Math.floor(Math.random() * 3) + 2,
      new Date(now.getTime() + Math.random() * 7200000).toISOString()
    )
    
    d.prepare(`INSERT INTO walk_participants (walk_id, user_id, role, status, liveness_verified) VALUES (?, ?, 'creator', 'accepted', 1)`)
      .run(walkId, i % 2 === 0 ? user1Id : user2Id)
  }
}
