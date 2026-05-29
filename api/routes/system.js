import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET /api/system/db-size - Get database file size
router.get('/db-size', async (req, res) => {
  try {
    // Path to the dental-clinic.db file in the root directory
    // __dirname is: api/routes/
    // We need to go up two levels: api/routes/ -> api/ -> root/
    const dbPath = path.join(__dirname, '..', '..', 'dental-clinic.db');
    
    // Log the path being accessed for debugging
    console.log('=== Database Size Check ===');
    console.log('Current __dirname:', __dirname);
    console.log('Attempting to access database at:', dbPath);
    console.log('Resolved absolute path:', path.resolve(dbPath));
    
    // Check if file exists
    if (!fs.existsSync(dbPath)) {
      console.error('❌ Database file not found at:', dbPath);
      return res.status(404).json({ 
        error: 'Database file not found',
        size: '0 KB',
        bytes: 0,
        attemptedPath: dbPath
      });
    }
    
    console.log('✓ Database file found');
    
    // Get file stats
    const stats = fs.statSync(dbPath);
    const fileSizeInBytes = stats.size;
    
    console.log('✓ File size in bytes:', fileSizeInBytes);
    
    // Convert to KB or MB based on size
    let formattedSize;
    if (fileSizeInBytes < 1024 * 1024) {
      // Less than 1 MB, show in KB
      const sizeInKB = (fileSizeInBytes / 1024).toFixed(2);
      formattedSize = `${sizeInKB} KB`;
    } else {
      // 1 MB or more, show in MB
      const sizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
      formattedSize = `${sizeInMB} MB`;
    }
    
    console.log('✓ Formatted size:', formattedSize);
    console.log('===========================');
    
    res.json({
      size: formattedSize,
      bytes: fileSizeInBytes,
      path: 'dental-clinic.db'
    });
  } catch (error) {
    console.error('❌ Error getting database size:', error.message);
    console.error('Error details:', error);
    res.status(500).json({ 
      error: 'Failed to get database size',
      message: error.message,
      size: 'N/A',
      bytes: 0
    });
  }
});

// PUT /api/system/working-hours - Save working hours with password verification
router.put('/working-hours', async (req, res) => {
  try {
    console.log('💾 Saving working hours with password verification');
    
    const bcrypt = await import('bcrypt').then(m => m.default);
    const getDb = await import('../db.js').then(m => m.default);
    const db = await getDb();
    
    const { startTime, endTime, password } = req.body;
    
    if (!startTime || !endTime || !password) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ error: 'Missing required fields: startTime, endTime, password' });
    }
    
    // Get the admin user from the users table
    const adminUser = await db.get('SELECT * FROM users LIMIT 1');
    
    if (!adminUser) {
      console.error('❌ No admin user found in database');
      return res.status(500).json({ error: 'Admin user not configured' });
    }
    
    // Verify the provided password against the stored hash
    const passwordMatch = await bcrypt.compare(password, adminUser.password);
    
    if (!passwordMatch) {
      console.log('❌ Invalid password provided for working hours update');
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // Password is correct, prepare working hours data
    const workingHours = {
      startTime,
      endTime,
      updatedAt: new Date().toISOString()
    };
    
    console.log('✅ Password verified. Working hours:', workingHours);
    
    res.json({
      message: 'Working hours saved successfully',
      workingHours
    });
  } catch (error) {
    console.error('❌ Error saving working hours:', error.message);
    console.error('Error details:', error);
    res.status(500).json({
      error: 'Failed to save working hours',
      message: error.message
    });
  }
});

export default router;
