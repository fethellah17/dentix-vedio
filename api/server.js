import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { getDb } from './db.js';
import authRouter from './routes/auth.js';
import categoriesRouter from './routes/categories.js';
import patientsRouter from './routes/patients.js';
import rendezVousRouter from './routes/rendez-vous.js';
import passagesDirectsRouter from './routes/passages-directs.js';
import systemRouter from './routes/system.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Auto-initialize users table on startup
async function ensureUsersTable() {
  const db = await getDb();
  
  // Create users table if it doesn't exist
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  await db.exec(createTableSQL);
  console.log('✓ Users table ready');
  
  // Check if default user exists
  const user = await db.get('SELECT * FROM users WHERE email = ?', ['softix@dental.dz']);
  
  if (!user) {
    // Create default user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.run(
      'INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)',
      ['user-1', 'softix@dental.dz', hashedPassword, 'Softix Admin']
    );
    console.log('✓ Default user created: softix@dental.dz / admin123');
  } else {
    console.log('✓ Default user already exists');
  }

  // Auto-migrate: add statu column to patients table if missing
  console.log('🔍 Migration check triggered...');
  try {
    await db.run('ALTER TABLE patients ADD COLUMN statu INTEGER DEFAULT 0');
    console.log('✅ Migration executed: statu column added successfully');
  } catch (err) {
    if (err.message && err.message.includes('duplicate column')) {
      console.log('✓ statu column already exists, skipping migration');
    } else {
      console.error('❌ Migration error:', err.message);
    }
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/patients', patientsRouter);

// Unarchive-day route for rendez-vous - MUST be before mounting the router
app.put('/api/unarchive-day', async (req, res) => {
  try {
    console.log('\n🎯🎯🎯 BACKEND RECEIVED /api/unarchive-day REQUEST 🎯🎯🎯');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request method:', req.method);
    console.log('Request path:', req.path);
    
    const bcrypt = await import('bcrypt').then(m => m.default);
    const db = await getDb();
    const { date, password } = req.body;
    
    if (!date || !password) {
      console.log('❌ Missing required fields. Date:', date, 'Password:', password ? '***' : 'MISSING');
      return res.status(400).json({ error: 'Missing required fields: date, password' });
    }
    
    console.log('🔓 Attempting to unarchive all appointments for date:', date);
    
    // Get the admin user from the users table
    const adminUser = await db.get('SELECT * FROM users LIMIT 1');
    
    if (!adminUser) {
      console.error('❌ No admin user found in database');
      return res.status(500).json({ error: 'Admin user not configured' });
    }
    
    // Verify the provided password against the stored hash
    const passwordMatch = await bcrypt.compare(password, adminUser.password);
    
    if (!passwordMatch) {
      console.log('❌ Invalid password provided for unarchive-day');
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // Password is correct, unarchive all appointments for this date
    const result = await db.run(
      'UPDATE rendez_vous SET archived = 0, updated_at = CURRENT_TIMESTAMP WHERE date = ? AND archived = 1',
      [date]
    );
    
    console.log('✅ Unarchived', result.changes, 'appointments for', date);
    
    res.json({ 
      message: 'Appointments unarchived successfully',
      count: result.changes,
      date 
    });
  } catch (error) {
    console.error('Error unarchiving appointments:', error);
    res.status(500).json({ error: 'Failed to unarchive appointments' });
  }
});

app.use('/api/rendez-vous', rendezVousRouter);

// Archive-day route for passages directs - MUST be before generic passages-directs router
app.put('/api/passages-directs/archive-day', async (req, res) => {
  try {
    const db = await getDb();
    const { date } = req.body;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    console.log('📦 Archiving passages directs for date:', date);
    
    const result = await db.run(
      'UPDATE passages_directs SET archived = 1, updated_at = CURRENT_TIMESTAMP WHERE date = ? AND archived = 0',
      [date]
    );
    
    console.log(`✅ Archived ${result.changes} passages directs for ${date}`);
    
    res.json({ 
      success: true,
      message: 'Passages directs archived successfully', 
      count: result.changes,
      date: date
    });
  } catch (error) {
    console.error('Error archiving passages directs:', error);
    res.status(500).json({ error: 'Failed to archive passages directs', details: error.message });
  }
});

app.use('/api/passages-directs', passagesDirectsRouter);
app.use('/api/system', systemRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize users table before starting server
ensureUsersTable()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 API endpoints:`);
      console.log(`   Auth:`);
      console.log(`     POST   /api/auth/login`);
      console.log(`     PUT    /api/auth/update-password`);
      console.log(`     POST   /api/auth/reset-password`);
      console.log(`   Categories:`);
      console.log(`     GET    /api/categories`);
      console.log(`     POST   /api/categories`);
      console.log(`     PUT    /api/categories/:id`);
      console.log(`     DELETE /api/categories/:id`);
      console.log(`   Patients:`);
      console.log(`     GET    /api/patients`);
      console.log(`     POST   /api/patients`);
      console.log(`     PUT    /api/patients/:id`);
      console.log(`     DELETE /api/patients/:id`);
      console.log(`   Rendez-vous:`);
      console.log(`     GET    /api/rendez-vous`);
      console.log(`     POST   /api/rendez-vous`);
      console.log(`     PUT    /api/rendez-vous/:id`);
      console.log(`     DELETE /api/rendez-vous/:id`);
      console.log(`     GET    /api/rendez-vous/stats/dashboard`);
      console.log(`   Passages Directs:`);
      console.log(`     GET    /api/passages-directs`);
      console.log(`     POST   /api/passages-directs`);
      console.log(`     PUT    /api/passages-directs/:id`);
      console.log(`     DELETE /api/passages-directs/:id`);
      console.log(`   System:`);
      console.log(`     GET    /api/system/db-size`);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to initialize server:', error);
    process.exit(1);
  });
