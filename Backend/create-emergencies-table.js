// create-emergencies-table.js
// Run this script to create the emergencies table

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createEmergenciesTable() {
  try {
    console.log('🔄 Connecting to database...');
    
    // Create emergencies table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS emergencies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        helper_id UUID,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        category VARCHAR(50),
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        voice_note_url TEXT,
        helper_latitude DECIMAL(10, 8),
        helper_longitude DECIMAL(11, 8),
        eta_minutes INTEGER,
        resolution_notes TEXT,
        cancellation_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        accepted_at TIMESTAMP,
        arrived_at TIMESTAMP,
        resolved_at TIMESTAMP,
        cancelled_at TIMESTAMP,
        last_location_update TIMESTAMP,
        CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    
    console.log('✅ Successfully created emergencies table!');
    
    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_emergencies_user_id ON emergencies(user_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_emergencies_helper_id ON emergencies(helper_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_emergencies_status ON emergencies(status);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_emergencies_location ON emergencies(latitude, longitude);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_emergencies_created_at ON emergencies(created_at DESC);`);
    
    console.log('✅ Successfully created indexes!');
    
    // Verify the table was created
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'emergencies' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Emergencies table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    console.log('\n✨ Migration complete!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

createEmergenciesTable();
