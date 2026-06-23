CREATE OR REPLACE FUNCTION get_nearby_walks(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 3,
  walk_status TEXT DEFAULT 'open'
)
RETURNS TABLE (
  id UUID,
  creator_id UUID,
  title TEXT,
  description TEXT,
  format TEXT,
  district TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  max_people INTEGER,
  current_count INTEGER,
  status TEXT,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  distance_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.creator_id,
    w.title,
    w.description,
    w.format,
    w.district,
    w.address,
    ST_Y(w.location::geometry) AS lat,
    ST_X(w.location::geometry) AS lng,
    w.max_people,
    w.current_count,
    w.status,
    w.scheduled_at,
    w.created_at,
    ST_Distance(w.location, ST_MakePoint(user_lng, user_lat)::geography) / 1000 AS distance_km
  FROM walks w
  WHERE w.status = walk_status
    AND ST_DWithin(w.location, ST_MakePoint(user_lng, user_lat)::geography, radius_km * 1000)
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;
