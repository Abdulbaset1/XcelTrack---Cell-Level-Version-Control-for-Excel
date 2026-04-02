CREATE TABLE IF NOT EXISTS otp_verifications (
    email VARCHAR(255) PRIMARY KEY,
    otp_code VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    attempts INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
    firebase_uid VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workbooks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS worksheets (
    id SERIAL PRIMARY KEY,
    workbook_id INT REFERENCES workbooks(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sheet_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workbook_collaborators (
    id SERIAL PRIMARY KEY,
    workbook_id INT REFERENCES workbooks(id) ON DELETE CASCADE,
    user_id VARCHAR(255) REFERENCES users(firebase_uid) ON DELETE CASCADE,
    added_by VARCHAR(255),
    added_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(workbook_id, user_id)
);

CREATE TABLE IF NOT EXISTS conflicts (
    id SERIAL PRIMARY KEY,
    workbook_id INT REFERENCES workbooks(id) ON DELETE CASCADE,
    worksheet_id INT REFERENCES worksheets(id) ON DELETE CASCADE,
    row_idx INT NOT NULL,
    col_idx INT NOT NULL,
    user1_id VARCHAR(255) NOT NULL,
    user1_value TEXT,
    user2_id VARCHAR(255) NOT NULL,
    user2_value TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    resolved_by VARCHAR(255),
    resolution TEXT,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    base_cell_version INT
);

CREATE TABLE IF NOT EXISTS cells (
    id SERIAL PRIMARY KEY,
    worksheet_id INT REFERENCES worksheets(id) ON DELETE CASCADE,
    row_idx INT NOT NULL,
    col_idx INT NOT NULL,
    address VARCHAR(10) NOT NULL,
    value TEXT,
    formula TEXT,
    style JSONB,
    cell_version INT DEFAULT 1,
    last_edited_by VARCHAR(255),
    UNIQUE(worksheet_id, row_idx, col_idx)
);

CREATE TABLE IF NOT EXISTS commits (
    id SERIAL PRIMARY KEY,
    workbook_id INT REFERENCES workbooks(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    message TEXT,
    timestamp TIMESTAMP DEFAULT NOW(),
    hash VARCHAR(64) UNIQUE
);

CREATE TABLE IF NOT EXISTS cell_versions (
    id SERIAL PRIMARY KEY,
    commit_id INT REFERENCES commits(id) ON DELETE CASCADE,
    cell_id INT REFERENCES cells(id) ON DELETE CASCADE,
    value TEXT,
    formula TEXT,
    style JSONB
);

CREATE TABLE IF NOT EXISTS commit_changes (
    id SERIAL PRIMARY KEY,
    commit_id INT REFERENCES commits(id) ON DELETE CASCADE,
    cell_id INT REFERENCES cells(id) ON DELETE CASCADE,
    change_type VARCHAR(20),
    old_value TEXT,
    new_value TEXT,
    old_formula TEXT,
    new_formula TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(firebase_uid) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'info',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
