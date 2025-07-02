-- Create the main ads table
CREATE TABLE IF NOT EXISTS ads (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    location VARCHAR(100) NOT NULL,
    contact_method VARCHAR(500),
    ip_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '3 days'),
    up_votes INTEGER DEFAULT 0,
    down_votes INTEGER DEFAULT 0,
    repost_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- Create votes table to track individual votes
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    ad_id INTEGER REFERENCES ads(id) ON DELETE CASCADE,
    ip_hash VARCHAR(64) NOT NULL,
    vote_type VARCHAR(10) CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ad_id, ip_hash)
);

-- Create locations table for dynamic location management
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    ad_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user behavior tracking table
CREATE TABLE IF NOT EXISTS user_behavior (
    ip_hash VARCHAR(64) PRIMARY KEY,
    total_up_votes_given INTEGER DEFAULT 0,
    total_down_votes_given INTEGER DEFAULT 0,
    ads_posted INTEGER DEFAULT 0,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ads_location ON ads(location);
CREATE INDEX IF NOT EXISTS idx_ads_expires_at ON ads(expires_at);
CREATE INDEX IF NOT EXISTS idx_ads_ip_hash ON ads(ip_hash);
CREATE INDEX IF NOT EXISTS idx_votes_ad_id ON votes(ad_id);
CREATE INDEX IF NOT EXISTS idx_votes_ip_hash ON votes(ip_hash);
