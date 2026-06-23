import { createClient } from '@/lib/supabase/client'

const E2E_KEY_STORAGE_KEY = 'zis_e2e_keypair'

export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey']
  )
}

export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key)
  return btoa(String.fromCharCode(...new Uint8Array(exported)))
}

export async function importPublicKey(pemBase64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(pemBase64), c => c.charCodeAt(0))
  return await crypto.subtle.importKey(
    'raw', raw,
    { name: 'ECDH', namedCurve: 'P-256' },
    true, []
  )
}

export async function deriveSharedKey(
  privateKey: CryptoKey,
  peerPublicKey: string
): Promise<CryptoKey> {
  const peerKey = await importPublicKey(peerPublicKey)
  return await crypto.subtle.deriveKey(
    { name: 'ECDH', public: peerKey },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

export async function encryptMessage(
  sharedKey: CryptoKey,
  plaintext: string
): Promise<{ encryptedContent: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    sharedKey,
    encoded
  )
  return {
    encryptedContent: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  }
}

export async function decryptMessage(
  sharedKey: CryptoKey,
  encryptedContent: string,
  iv: string
): Promise<string> {
  const encrypted = Uint8Array.from(atob(encryptedContent), c => c.charCodeAt(0))
  const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0))
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes },
    sharedKey,
    encrypted
  )
  return new TextDecoder().decode(decrypted)
}

export async function saveKeyPair(keyPair: CryptoKeyPair): Promise<void> {
  const exportedPrivate = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
  const exportedPublic = await crypto.subtle.exportKey('raw', keyPair.publicKey)
  localStorage.setItem(E2E_KEY_STORAGE_KEY, JSON.stringify({
    privateKey: btoa(String.fromCharCode(...new Uint8Array(exportedPrivate))),
    publicKey: btoa(String.fromCharCode(...new Uint8Array(exportedPublic))),
  }))
}

export async function loadKeyPair(): Promise<CryptoKeyPair | null> {
  const stored = localStorage.getItem(E2E_KEY_STORAGE_KEY)
  if (!stored) return null
  try {
    const { privateKey, publicKey } = JSON.parse(stored)
    const privateKeyBytes = Uint8Array.from(atob(privateKey), c => c.charCodeAt(0))
    const publicKeyBytes = Uint8Array.from(atob(publicKey), c => c.charCodeAt(0))
    const privateKeyObj = await crypto.subtle.importKey(
      'pkcs8', privateKeyBytes,
      { name: 'ECDH', namedCurve: 'P-256' },
      true, ['deriveKey']
    )
    const publicKeyObj = await crypto.subtle.importKey(
      'raw', publicKeyBytes,
      { name: 'ECDH', namedCurve: 'P-256' },
      true, []
    )
    return { privateKey: privateKeyObj, publicKey: publicKeyObj }
  } catch {
    return null
  }
}

export async function ensureKeyPair(): Promise<CryptoKeyPair> {
  const existing = await loadKeyPair()
  if (existing) return existing
  const keyPair = await generateKeyPair()
  await saveKeyPair(keyPair)
  const pubKey = await exportPublicKey(keyPair.publicKey)
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('profiles').update({ public_key: pubKey }).eq('id', user.id)
  }
  return keyPair
}

interface ParticipantWithProfile {
  user_id: string
  profile: { public_key: string | null } | null
}

export async function getSharedKeyForWalk(
  walkId: string,
  myKeyPair: CryptoKeyPair
): Promise<CryptoKey> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data } = await supabase
    .from('walk_participants')
    .select('user_id, profile:profiles(public_key)')
    .eq('walk_id', walkId)
    .eq('status', 'accepted')
    .neq('user_id', user.id)

  const participants = (data || []) as ParticipantWithProfile[]
  if (participants.length === 0) {
    throw new Error('No participants found for walk')
  }

  const otherParticipant = participants.find(p => p.profile?.public_key)
  if (!otherParticipant?.profile?.public_key) {
    throw new Error('Other participant has not set up E2E encryption yet')
  }

  return await deriveSharedKey(myKeyPair.privateKey, otherParticipant.profile.public_key)
}

export async function waitForPeerPublicKey(
  walkId: string,
  myKeyPair: CryptoKeyPair,
  timeoutMs = 15000
): Promise<CryptoKey> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      return await getSharedKeyForWalk(walkId, myKeyPair)
    } catch {
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  throw new Error('Timeout waiting for peer public key')
}
