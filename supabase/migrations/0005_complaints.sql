CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  walk_id UUID REFERENCES walks(id) ON DELETE CASCADE NOT NULL,
  complainant_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  accused_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','reviewed','dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS complaints_accused_idx ON complaints(accused_id, status);
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create complaints" ON complaints
  FOR INSERT WITH CHECK (auth.uid() = complainant_id);
