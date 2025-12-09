-- =============================================
-- NEON DATABASE SCHEMA FOR REVERB AI AGENT
-- =============================================

-- Session Management (same as before)
CREATE TABLE IF NOT EXISTS conversation_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID, -- Links to Supabase auth users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS conversation_messages (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL REFERENCES conversation_sessions(session_id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB DEFAULT '{}'
);

-- =============================================
-- AI-GATHERED INSTITUTION DATA (CORE)
-- =============================================

-- Institutions discovered/verified by AI
CREATE TABLE IF NOT EXISTS ai_institutions (
    id SERIAL PRIMARY KEY,
    -- Basic identification
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100), -- 'university', 'college', 'tvet', 'medical', 'technical'
    category VARCHAR(100), -- 'public', 'private', 'national', 'county'
    charter_year INTEGER,
    location VARCHAR(255),
    county VARCHAR(100),
    website_url VARCHAR(500),
    email VARCHAR(255),
    phone VARCHAR(50),
    
    -- Source tracking
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('supabase_reference', 'ai_inference', 'user_confirmation', 'official_source')),
    source_id VARCHAR(255), -- References Supabase ID if applicable
    source_table VARCHAR(100), -- Which Supabase table this came from
    
    -- Confidence tracking
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    confidence_score DECIMAL(3,2) DEFAULT 0.0, -- 0.0 to 1.0
    verification_notes TEXT,
    
    -- Metadata
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    update_count INTEGER DEFAULT 0,
    
    -- AI processing info
    ai_model_used VARCHAR(100),
    processing_session_id VARCHAR(255),
    
    -- Indexes
    UNIQUE(name, type)
);

-- Programmes/Courses discovered by AI
CREATE TABLE IF NOT EXISTS ai_programmes (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER REFERENCES ai_institutions(id) ON DELETE CASCADE,
    
    -- Programme details
    name VARCHAR(255) NOT NULL,
    field VARCHAR(255), -- Main field of study
    level VARCHAR(100), -- 'certificate', 'diploma', 'bachelor', 'masters', 'phd'
    duration_years INTEGER,
    duration_months INTEGER,
    qualification_awarded VARCHAR(255),
    
    -- Requirements
    minimum_grade VARCHAR(50),
    subject_requirements JSONB DEFAULT '[]',
    kcse_cluster_points DECIMAL(4,2),
    
    -- Fees (KES)
    fees_min INTEGER,
    fees_max INTEGER,
    fees_notes TEXT,
    
    -- Source tracking
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('supabase_reference', 'ai_inference', 'user_confirmation', 'official_source')),
    source_id VARCHAR(255),
    source_table VARCHAR(100),
    
    -- Confidence
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    verification_notes TEXT,
    
    -- Additional info
    accreditation_body VARCHAR(255),
    exam_body VARCHAR(255),
    career_paths JSONB DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ai_model_used VARCHAR(100),
    
    -- Indexes
    INDEX idx_ai_programmes_institution (institution_id),
    INDEX idx_ai_programmes_field (field)
);

-- =============================================
-- STATISTICAL DATA GATHERED BY AI
-- =============================================

-- Enrollment statistics gathered by AI
CREATE TABLE IF NOT EXISTS ai_enrollment_stats (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER REFERENCES ai_institutions(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    
    -- Student counts
    total_students INTEGER,
    male_students INTEGER,
    female_students INTEGER,
    international_students INTEGER,
    
    -- Level breakdown
    certificate_students INTEGER,
    diploma_students INTEGER,
    bachelor_students INTEGER,
    masters_students INTEGER,
    phd_students INTEGER,
    
    -- Source & confidence
    source_type VARCHAR(50),
    verified BOOLEAN DEFAULT FALSE,
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ai_model_used VARCHAR(100),
    
    UNIQUE(institution_id, year)
);

-- Staffing statistics gathered by AI
CREATE TABLE IF NOT EXISTS ai_staffing_stats (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER REFERENCES ai_institutions(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    
    -- Staff counts
    total_staff INTEGER,
    teaching_staff INTEGER,
    non_teaching_staff INTEGER,
    male_staff INTEGER,
    female_staff INTEGER,
    
    -- Qualifications
    phd_holders INTEGER,
    masters_holders INTEGER,
    bachelor_holders INTEGER,
    
    -- Ratios
    student_teacher_ratio DECIMAL(5,2),
    
    -- Source & confidence
    source_type VARCHAR(50),
    verified BOOLEAN DEFAULT FALSE,
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ai_model_used VARCHAR(100),
    
    UNIQUE(institution_id, year)
);

-- Graduation statistics gathered by AI
CREATE TABLE IF NOT EXISTS ai_graduation_stats (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER REFERENCES ai_institutions(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    
    -- Graduation counts
    total_graduates INTEGER,
    male_graduates INTEGER,
    female_graduates INTEGER,
    
    -- Level breakdown
    certificate_graduates INTEGER,
    diploma_graduates INTEGER,
    bachelor_graduates INTEGER,
    masters_graduates INTEGER,
    phd_graduates INTEGER,
    
    -- Performance metrics
    graduation_rate DECIMAL(5,2),
    dropout_rate DECIMAL(5,2),
    completion_rate DECIMAL(5,2),
    
    -- Source & confidence
    source_type VARCHAR(50),
    verified BOOLEAN DEFAULT FALSE,
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ai_model_used VARCHAR(100),
    
    UNIQUE(institution_id, year)
);

-- =============================================
-- AI DATA COLLECTION LOG
-- =============================================

-- Log every data point the AI collects/references
CREATE TABLE IF NOT EXISTS ai_data_collection_log (
    id SERIAL PRIMARY KEY,
    
    -- Collection context
    session_id VARCHAR(255),
    user_query TEXT,
    ai_response_id INTEGER, -- Links to conversation_messages
    
    -- Data point info
    data_type VARCHAR(100), -- 'institution', 'programme', 'statistic', etc.
    data_subtype VARCHAR(100), -- 'enrollment', 'staffing', 'fees', etc.
    extracted_value TEXT,
    extracted_field VARCHAR(100),
    
    -- Source info
    source_type VARCHAR(50) NOT NULL,
    source_table VARCHAR(100),
    source_id VARCHAR(255),
    
    -- Confidence tracking
    ai_confidence DECIMAL(3,2) DEFAULT 0.0,
    user_feedback_confidence INTEGER CHECK (user_feedback_confidence >= 1 AND user_feedback_confidence <= 5),
    verified_status VARCHAR(50) DEFAULT 'unverified',
    
    -- Processing info
    processing_technique VARCHAR(100), -- 'direct_extraction', 'inference', 'calculation'
    ai_model_used VARCHAR(100),
    processing_time_ms INTEGER,
    
    -- Metadata
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_collection_session (session_id),
    INDEX idx_collection_type (data_type, data_subtype)
);

-- =============================================
-- USER FEEDBACK ON AI DATA
-- =============================================

-- User corrections/confirmation of AI data
CREATE TABLE IF NOT EXISTS ai_data_feedback (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    
    -- What data is being corrected
    target_table VARCHAR(100) NOT NULL,
    target_id INTEGER NOT NULL,
    target_field VARCHAR(100) NOT NULL,
    
    -- Feedback details
    feedback_type VARCHAR(50) CHECK (feedback_type IN ('correction', 'confirmation', 'clarification')),
    original_value TEXT,
    suggested_value TEXT,
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
    feedback_notes TEXT,
    
    -- User credentials (optional)
    user_qualifications TEXT, -- e.g., "current student", "alumni", "staff"
    user_affiliation VARCHAR(255),
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
    reviewed_by VARCHAR(255),
    review_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_feedback_target (target_table, target_id),
    INDEX idx_feedback_user (user_id)
);

-- =============================================
-- AI DATA VERIFICATION QUEUE
-- =============================================

-- Data points that need human verification
CREATE TABLE IF NOT EXISTS ai_verification_queue (
    id SERIAL PRIMARY KEY,
    
    -- What needs verification
    target_table VARCHAR(100) NOT NULL,
    target_id INTEGER NOT NULL,
    target_field VARCHAR(100) NOT NULL,
    current_value TEXT,
    
    -- Why it needs verification
    verification_reason VARCHAR(100) CHECK (verification_reason IN (
        'low_confidence', 
        'conflicting_sources', 
        'user_correction', 
        'potential_hallucination',
        'significant_change'
    )),
    confidence_score DECIMAL(3,2),
    
    -- Source comparison
    conflicting_sources JSONB DEFAULT '[]',
    
    -- Status
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'verified', 'corrected', 'rejected')),
    
    -- Metadata
    queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by VARCHAR(255),
    
    -- Indexes
    INDEX idx_verification_status (status, priority)
);

-- =============================================
-- AI KNOWLEDGE BASE (AGGREGATED/CURATED)
-- =============================================

-- Curated facts after verification
CREATE TABLE IF NOT EXISTS ai_curated_knowledge (
    id SERIAL PRIMARY KEY,
    
    -- Knowledge point
    knowledge_type VARCHAR(100) NOT NULL,
    institution_name VARCHAR(255),
    programme_name VARCHAR(255),
    fact_description TEXT NOT NULL,
    fact_details JSONB DEFAULT '{}',
    
    -- Sources
    primary_source VARCHAR(255),
    supporting_sources JSONB DEFAULT '[]',
    last_official_verification_date DATE,
    
    -- Confidence & verification
    verification_level VARCHAR(50) DEFAULT 'verified' CHECK (verification_level IN (
        'unverified',
        'ai_confident', 
        'user_confirmed',
        'cross_referenced',
        'officially_verified'
    )),
    overall_confidence DECIMAL(3,2) DEFAULT 1.0,
    
    -- Usage tracking
    times_referenced INTEGER DEFAULT 0,
    last_referenced_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_knowledge_type (knowledge_type),
    INDEX idx_institution (institution_name)
);

-- =============================================
-- PERFORMANCE & ANALYTICS
-- =============================================

-- AI performance metrics
CREATE TABLE IF NOT EXISTS ai_performance_metrics (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    
    -- Data collection metrics
    new_institutions_collected INTEGER DEFAULT 0,
    new_programmes_collected INTEGER DEFAULT 0,
    new_statistics_collected INTEGER DEFAULT 0,
    
    -- Accuracy metrics
    user_corrections_received INTEGER DEFAULT 0,
    corrections_accepted INTEGER DEFAULT 0,
    confidence_score_avg DECIMAL(3,2),
    
    -- Usage metrics
    total_queries_processed INTEGER DEFAULT 0,
    institution_queries INTEGER DEFAULT 0,
    programme_queries INTEGER DEFAULT 0,
    statistics_queries INTEGER DEFAULT 0,
    
    -- Metadata
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- HELPER FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to increment update count
CREATE OR REPLACE FUNCTION increment_update_count()
RETURNS TRIGGER AS $$
BEGIN
    NEW.update_count = COALESCE(OLD.update_count, 0) + 1;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to relevant tables
CREATE TRIGGER update_ai_institutions_updated_at 
    BEFORE UPDATE ON ai_institutions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER increment_ai_institutions_update_count
    BEFORE UPDATE ON ai_institutions
    FOR EACH ROW EXECUTE FUNCTION increment_update_count();

CREATE TRIGGER update_ai_programmes_updated_at 
    BEFORE UPDATE ON ai_programmes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Main query indexes
CREATE INDEX IF NOT EXISTS idx_ai_institutions_name ON ai_institutions(name);
CREATE INDEX IF NOT EXISTS idx_ai_institutions_type ON ai_institutions(type);
CREATE INDEX IF NOT EXISTS idx_ai_institutions_county ON ai_institutions(county);
CREATE INDEX IF NOT EXISTS idx_ai_institutions_verified ON ai_institutions(verified) WHERE verified = TRUE;

CREATE INDEX IF NOT EXISTS idx_ai_programmes_name ON ai_programmes(name);
CREATE INDEX IF NOT EXISTS idx_ai_programmes_level ON ai_programmes(level);
CREATE INDEX IF NOT EXISTS idx_ai_programmes_field ON ai_programmes(field);

-- Statistics query indexes
CREATE INDEX IF NOT EXISTS idx_ai_enrollment_institution_year ON ai_enrollment_stats(institution_id, year);
CREATE INDEX IF NOT EXISTS idx_ai_staffing_institution_year ON ai_staffing_stats(institution_id, year);
CREATE INDEX IF NOT EXISTS idx_ai_graduation_institution_year ON ai_graduation_stats(institution_id, year);

-- Collection log indexes
CREATE INDEX IF NOT EXISTS idx_collection_log_timestamp ON ai_data_collection_log(collected_at);
CREATE INDEX IF NOT EXISTS idx_collection_log_source ON ai_data_collection_log(source_type, source_table);

-- =============================================
-- VIEWS FOR EASY QUERYING
-- =============================================

-- View: All institutions with basic info
CREATE OR REPLACE VIEW v_institutions_summary AS
SELECT 
    id,
    name,
    type,
    category,
    charter_year,
    location,
    county,
    verified,
    confidence_score,
    first_seen_at,
    last_updated_at
FROM ai_institutions
ORDER BY verified DESC, confidence_score DESC, name;

-- View: Programmes with institution info
CREATE OR REPLACE VIEW v_programmes_summary AS
SELECT 
    p.id,
    p.name AS programme_name,
    p.level,
    p.field,
    p.duration_years,
    i.name AS institution_name,
    i.type AS institution_type,
    p.verified,
    p.confidence_score
FROM ai_programmes p
JOIN ai_institutions i ON p.institution_id = i.id
ORDER BY p.verified DESC, p.confidence_score DESC;

-- View: Data needing verification
CREATE OR REPLACE VIEW v_data_needing_verification AS
SELECT 
    'ai_institutions' AS table_name,
    id,
    name,
    confidence_score,
    'Low confidence institution' AS reason
FROM ai_institutions 
WHERE confidence_score < 0.7 AND verified = FALSE

UNION ALL

SELECT 
    'ai_programmes' AS table_name,
    id,
    name,
    confidence_score,
    'Low confidence programme' AS reason
FROM ai_programmes 
WHERE confidence_score < 0.7 AND verified = FALSE

UNION ALL

SELECT 
    'ai_data_feedback' AS table_name,
    id,
    target_field,
    0.0 AS confidence_score,
    'User correction pending' AS reason
FROM ai_data_feedback 
WHERE status = 'pending';