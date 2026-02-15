-- HelpNow Database Schema Migration
-- PostgreSQL with PostGIS extension

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    profile_photo TEXT,
    date_of_birth DATE,
    gender VARCHAR(50),
    is_helper BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    rating NUMERIC(3, 2) DEFAULT 0,
    total_helps INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Emergency contacts table
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    relationship VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Addresses table
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(50),
    street TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100) NOT NULL,
    apartment_number VARCHAR(50),
    building_code VARCHAR(50),
    floor_number VARCHAR(10),
    arrival_instructions TEXT,
    location GEOGRAPHY(POINT, 4326),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Medical info table
CREATE TABLE IF NOT EXISTS medical_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    blood_type VARCHAR(10),
    allergies TEXT[],
    chronic_conditions TEXT[],
    medications TEXT[],
    medical_devices TEXT[],
    accessibility_needs TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Helper profiles table
CREATE TABLE IF NOT EXISTS helper_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    training_level VARCHAR(50) NOT NULL,
    verification_status VARCHAR(50) DEFAULT 'pending',
    languages_spoken VARCHAR(10)[],
    situations_willing_to_help TEXT[],
    response_radius INTEGER DEFAULT 5000, -- in meters
    is_available BOOLEAN DEFAULT FALSE,
    average_response_time INTEGER, -- in seconds
    successful_helps INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Certifications table
CREATE TABLE IF NOT EXISTS certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    issuer VARCHAR(200),
    issue_date DATE,
    expiry_date DATE,
    document_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Availability schedule table
CREATE TABLE IF NOT EXISTS availability_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Emergency requests table
CREATE TABLE IF NOT EXISTS emergency_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seeker_id UUID REFERENCES users(id),
    seeker_info JSONB NOT NULL,
    accepted_helper_id UUID REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    address TEXT,
    description TEXT,
    voice_note_url TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    helpers_notified UUID[],
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    accepted_at TIMESTAMP,
    resolved_at TIMESTAMP,
    
    CHECK (status IN ('pending', 'accepted', 'helper_en_route', 'helper_arrived', 'resolved', 'cancelled', 'expired'))
);

-- Helper locations table (for real-time tracking)
CREATE TABLE IF NOT EXISTS helper_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    emergency_request_id UUID REFERENCES emergency_requests(id) ON DELETE CASCADE,
    last_location GEOGRAPHY(POINT, 4326),
    eta INTEGER, -- in minutes
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'active',
    start_date TIMESTAMP DEFAULT NOW(),
    end_date TIMESTAMP,
    auto_renew BOOLEAN DEFAULT TRUE,
    platform VARCHAR(20), -- 'ios' or 'android'
    product_id VARCHAR(100),
    receipt TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CHECK (status IN ('active', 'cancelled', 'expired', 'grace_period'))
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_is_helper ON users(is_helper);

CREATE INDEX idx_addresses_location ON addresses USING GIST(location);
CREATE INDEX idx_addresses_user_id ON addresses(user_id);

CREATE INDEX idx_helper_profiles_available ON helper_profiles(is_available) WHERE is_available = TRUE;
CREATE INDEX idx_helper_profiles_user_id ON helper_profiles(user_id);

CREATE INDEX idx_emergency_requests_status ON emergency_requests(status);
CREATE INDEX idx_emergency_requests_location ON emergency_requests USING GIST(location);
CREATE INDEX idx_emergency_requests_seeker_id ON emergency_requests(seeker_id);
CREATE INDEX idx_emergency_requests_helper_id ON emergency_requests(accepted_helper_id);
CREATE INDEX idx_emergency_requests_created_at ON emergency_requests(created_at DESC);

CREATE INDEX idx_helper_locations_user_id ON helper_locations(user_id);
CREATE INDEX idx_helper_locations_location ON helper_locations USING GIST(last_location);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_info_updated_at BEFORE UPDATE ON medical_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_helper_profiles_updated_at BEFORE UPDATE ON helper_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for active helpers with location
CREATE OR REPLACE VIEW active_helpers AS
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.phone,
    u.profile_photo,
    u.rating,
    hp.training_level,
    hp.response_radius,
    hp.verification_status,
    hl.last_location,
    hl.updated_at as location_updated_at
FROM users u
INNER JOIN helper_profiles hp ON u.id = hp.user_id
LEFT JOIN LATERAL (
    SELECT last_location, updated_at
    FROM helper_locations
    WHERE user_id = u.id
    ORDER BY updated_at DESC
    LIMIT 1
) hl ON true
WHERE hp.is_available = TRUE 
  AND hp.verification_status = 'verified'
  AND u.is_active = TRUE;

-- Insert sample data for testing (optional)
-- Uncomment for development/testing

/*
INSERT INTO users (email, phone, first_name, last_name, is_helper, verified)
VALUES 
    ('helper1@test.com', '+33123456789', 'John', 'Helper', TRUE, TRUE),
    ('helper2@test.com', '+33123456790', 'Jane', 'Medic', TRUE, TRUE),
    ('seeker1@test.com', '+33123456791', 'Bob', 'Seeker', FALSE, TRUE);

INSERT INTO helper_profiles (user_id, training_level, verification_status, response_radius, is_available)
SELECT id, 'cpr_aed', 'verified', 5000, TRUE
FROM users
WHERE is_helper = TRUE;
*/

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO helpnow_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO helpnow_user;
