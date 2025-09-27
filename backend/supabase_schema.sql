-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    role VARCHAR(100),
    work_style VARCHAR(50),
    skills TEXT[] DEFAULT '{}',
    enable_2fa BOOLEAN DEFAULT false,
    receive_notifications BOOLEAN DEFAULT true,
    accept_terms BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
