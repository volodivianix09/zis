-- E2E Encryption for messages
-- Add public_key to profiles for ECDH key exchange
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_key TEXT;

-- Change messages table for E2EE
-- Keep content for backward compat, add encrypted_content + iv
ALTER TABLE messages ADD COLUMN IF NOT EXISTS encrypted_content TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS iv TEXT;

-- System messages don't need encryption
-- For existing messages, mark them as system or leave as-is (they're plaintext)
-- New messages MUST have encrypted_content + iv

-- Update RLS: encrypted_content is only readable by walk participants
-- (already covered by existing policies)

-- Index for encrypted_content lookups (not really needed, but for consistency)
CREATE INDEX IF NOT EXISTS messages_encrypted_content_idx ON messages(walk_id, created_at) WHERE encrypted_content IS NOT NULL;
