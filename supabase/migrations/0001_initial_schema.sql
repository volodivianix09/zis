-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  liveness_passed_at TIMESTAMPTZ,
  rating DECIMAL(3,2) DEFAULT 5.00,
  walk_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Walks table
CREATE TABLE IF NOT EXISTS walks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  format TEXT NOT NULL CHECK (format IN ('walk', 'coffee', 'sport', 'food', 'culture', 'other')),
  district TEXT,
  address TEXT,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  max_people INTEGER DEFAULT 5 CHECK (max_people BETWEEN 2 AND 10),
  current_count INTEGER DEFAULT 1,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'matching', 'active', 'completed', 'cancelled')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Walk participants table
CREATE TABLE IF NOT EXISTS walk_participants (
  walk_id UUID REFERENCES walks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'participant' CHECK (role IN ('creator', 'participant')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  liveness_verified BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (walk_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  walk_id UUID REFERENCES walks(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_system BOOLEAN DEFAULT FALSE
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  walk_id UUID REFERENCES walks(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  target_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS profiles_telegram_id_idx ON profiles(telegram_id);
CREATE INDEX IF NOT EXISTS walks_location_idx ON walks USING GIST (location);
CREATE INDEX IF NOT EXISTS walks_status_idx ON walks(status);
CREATE INDEX IF NOT EXISTS walks_creator_id_idx ON walks(creator_id);
CREATE INDEX IF NOT EXISTS walks_scheduled_at_idx ON walks(scheduled_at);
CREATE INDEX IF NOT EXISTS walk_participants_user_id_idx ON walk_participants(user_id);
CREATE INDEX IF NOT EXISTS messages_walk_id_idx ON messages(walk_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE walks;

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE walks ENABLE ROW LEVEL SECURITY;
ALTER TABLE walk_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Walks policies
CREATE POLICY "Walks are viewable by everyone" ON walks
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create walks" ON walks
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own walks" ON walks
  FOR UPDATE USING (auth.uid() = creator_id);

-- Walk participants policies
CREATE POLICY "Participants are viewable by walk members" ON walk_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM walk_participants wp
      WHERE wp.walk_id = walk_participants.walk_id
      AND wp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join walks" ON walk_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation" ON walk_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Messages are viewable by walk participants" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM walk_participants wp
      WHERE wp.walk_id = messages.walk_id
      AND wp.user_id = auth.uid()
    )
  );

CREATE POLICY "Walk participants can send messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM walk_participants wp
      WHERE wp.walk_id = messages.walk_id
      AND wp.user_id = auth.uid()
    )
  );

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Function to update walk count
CREATE OR REPLACE FUNCTION update_walk_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE walks
  SET current_count = (
    SELECT COUNT(*) FROM walk_participants
    WHERE walk_id = NEW.walk_id AND status = 'accepted'
  )
  WHERE id = NEW.walk_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for walk count updates
CREATE TRIGGER update_walk_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON walk_participants
FOR EACH ROW EXECUTE FUNCTION update_walk_count();

-- Function to auto-complete walks
CREATE OR REPLACE FUNCTION auto_complete_walks()
RETURNS void AS $$
BEGIN
  UPDATE walks
  SET status = 'completed'
  WHERE status = 'active'
  AND scheduled_at + INTERVAL '2 hours' < NOW();

  UPDATE walks
  SET status = 'cancelled'
  WHERE status = 'open'
  AND scheduled_at < NOW();
END;
$$ LANGUAGE plpgsql;
