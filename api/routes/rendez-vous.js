import express from 'express';
import getDb from '../db.js';

const router = express.Router();

// Helper function to handle SQLite busy errors with retry logic
async function executeWithRetry(dbOperation, maxRetries = 3, delayMs = 100) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await dbOperation();
    } catch (error) {
      if (error.message.includes('database is locked') && attempt < maxRetries) {
        console.log(`⏳ Database locked, retrying (${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      } else {
        throw error;
      }
    }
  }
}

// GET all rendez-vous (ONLY non-archived, archived = 0)
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    
    console.log('📋 Fetching ACTIVE appointments (archived = 0)');
    
    // STRICT: return only non-archived appointments (archived = 0)
    const rendezVous = await db.all(
      'SELECT * FROM rendez_vous WHERE archived = 0 ORDER BY date ASC, heure ASC'
    );
    
    const result = rendezVous.map(rdv => ({
      id: rdv.id,
      patientId: rdv.patient_id,
      patientNom: rdv.patient_nom,
      nom: rdv.nom,
      prenom: rdv.prenom,
      date: rdv.date,
      heure: rdv.heure,
      motif: rdv.motif,
      statut: rdv.statut,
      telephone: rdv.telephone,
      age: rdv.age,
      archived: rdv.archived === 1
    }));
    
    console.log(`✅ Returned ${result.length} active appointments`);
    res.json(result);
  } catch (error) {
    console.error('Error fetching rendez-vous:', error);
    res.status(500).json({ error: 'Failed to fetch rendez-vous' });
  }
});

// GET history - ONLY archived appointments (archived = 1) - MUST be before /:id route
router.get('/history', async (req, res) => {
  try {
    const db = await getDb();
    
    console.log('📚 Fetching ARCHIVED appointments (archived = 1)');
    
    // STRICT: return only archived appointments (archived = 1)
    const rendezVous = await db.all(
      'SELECT * FROM rendez_vous WHERE archived = 1 ORDER BY date DESC, heure DESC'
    );
    
    const result = rendezVous.map(rdv => ({
      id: rdv.id,
      patientId: rdv.patient_id,
      patientNom: rdv.patient_nom,
      nom: rdv.nom,
      prenom: rdv.prenom,
      date: rdv.date,
      heure: rdv.heure,
      motif: rdv.motif,
      statut: rdv.statut,
      telephone: rdv.telephone,
      age: rdv.age,
      archived: rdv.archived === 1
    }));
    
    console.log(`✅ Returned ${result.length} archived appointments`);
    res.json(result);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// PUT unarchive all appointments for a specific date with password verification - MUST BE FIRST
router.put('/unarchive-day', async (req, res) => {
  try {
    console.log('\n🎯🎯🎯 BACKEND RECEIVED /unarchive-day REQUEST 🎯🎯🎯');
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
    const result = await executeWithRetry(async () => {
      return await db.run(
        'UPDATE rendez_vous SET archived = 0, updated_at = CURRENT_TIMESTAMP WHERE date = ? AND archived = 1',
        date
      );
    });
    
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

// PUT archive all completed appointments for a specific date
router.put('/archive-day', async (req, res) => {
  try {
    const db = await getDb();
    const { date } = req.body;
    
    if (!date) {
      return res.status(400).json({ error: 'Missing required field: date' });
    }
    
    console.log('📦 Archiving completed appointments for date:', date);
    
    // Only archive appointments that are confirmed or cancelled (not pending)
    const result = await executeWithRetry(async () => {
      return await db.run(
        `UPDATE rendez_vous 
         SET archived = 1, updated_at = CURRENT_TIMESTAMP 
         WHERE date = ? AND archived = 0 AND statut IN ('confirmé', 'annulé')`,
        date
      );
    });
    
    console.log('✅ Archived', result.changes, 'appointments for', date);
    
    res.json({ 
      message: 'Appointments archived successfully',
      count: result.changes,
      date 
    });
  } catch (error) {
    console.error('Error archiving appointments:', error);
    res.status(500).json({ error: 'Failed to archive appointments' });
  }
});

// PUT unarchive appointment with password verification
router.put('/unarchive/:id', async (req, res) => {
  try {
    const bcrypt = await import('bcrypt').then(m => m.default);
    const db = await getDb();
    const { id } = req.params;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Missing required field: password' });
    }
    
    console.log('🔓 Attempting to unarchive appointment:', id);
    
    // Verify the appointment exists and is archived
    const rdv = await db.get('SELECT * FROM rendez_vous WHERE id = ?', id);
    
    if (!rdv) {
      return res.status(404).json({ error: 'Rendez-vous not found' });
    }
    
    if (rdv.archived === 0) {
      return res.status(400).json({ error: 'Appointment is not archived' });
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
      console.log('❌ Invalid password provided for unarchive');
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // Password is correct, unarchive the appointment
    const result = await executeWithRetry(async () => {
      return await db.run(
        'UPDATE rendez_vous SET archived = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        id
      );
    });
    
    console.log('✅ Unarchived appointment:', id);
    
    // Get the updated appointment
    const updated = await db.get('SELECT * FROM rendez_vous WHERE id = ?', id);
    
    res.json({ 
      message: 'Appointment unarchived successfully',
      appointment: {
        id: updated.id,
        patientId: updated.patient_id,
        patientNom: updated.patient_nom,
        nom: updated.nom,
        prenom: updated.prenom,
        date: updated.date,
        heure: updated.heure,
        motif: updated.motif,
        statut: updated.statut,
        telephone: updated.telephone,
        age: updated.age,
        archived: updated.archived === 1
      }
    });
  } catch (error) {
    console.error('Error unarchiving appointment:', error);
    res.status(500).json({ error: 'Failed to unarchive appointment' });
  }
});

// GET single rendez-vous by ID
router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const rdv = await db.get('SELECT * FROM rendez_vous WHERE id = ?', req.params.id);
    
    if (!rdv) {
      return res.status(404).json({ error: 'Rendez-vous not found' });
    }
    
    res.json({
      id: rdv.id,
      patientId: rdv.patient_id,
      patientNom: rdv.patient_nom,
      nom: rdv.nom,
      prenom: rdv.prenom,
      date: rdv.date,
      heure: rdv.heure,
      motif: rdv.motif,
      statut: rdv.statut,
      telephone: rdv.telephone,
      age: rdv.age,
      archived: rdv.archived === 1
    });
  } catch (error) {
    console.error('Error fetching rendez-vous:', error);
    res.status(500).json({ error: 'Failed to fetch rendez-vous' });
  }
});

// POST create new rendez-vous
router.post('/', async (req, res) => {
  try {
    console.log('🔍 DEBUG BACKEND - RECEIVED DATA:', JSON.stringify(req.body, null, 2));
    
    const db = await getDb();
    const {
      patientId,
      patientNom,
      nom,
      prenom,
      date,
      heure,
      motif,
      statut,
      telephone,
      age
    } = req.body;
    
    console.log('📝 Creating rendez-vous:', { patientNom, date, heure, motif });
    
    if (!date || !heure || !motif) {
      console.error('❌ Missing required fields:', { date, heure, motif });
      return res.status(400).json({ error: 'Missing required fields: date, heure, motif' });
    }
    
    if (!patientNom) {
      console.error('❌ Missing patientNom');
      return res.status(400).json({ error: 'Missing required field: patientNom' });
    }
    
    // STRICT duplicate check: prevent exact same appointment (name, date, time)
    const existingAppointment = await db.get(`
      SELECT id FROM rendez_vous 
      WHERE patient_nom = ? 
        AND date = ? 
        AND heure = ?
        AND archived = 0
    `, [patientNom, date, heure]);
    
    if (existingAppointment) {
      console.log('⚠️ Duplicate detected - same patient, date, and time:', existingAppointment.id);
      const existing = await db.get('SELECT * FROM rendez_vous WHERE id = ?', existingAppointment.id);
      return res.status(409).json({
        error: 'Duplicate appointment',
        message: 'Un rendez-vous existe déjà pour ce patient à cette date et heure',
        existing: {
          id: existing.id,
          patientId: existing.patient_id,
          patientNom: existing.patient_nom,
          nom: existing.nom,
          prenom: existing.prenom,
          date: existing.date,
          heure: existing.heure,
          motif: existing.motif,
          statut: existing.statut,
          telephone: existing.telephone,
          age: existing.age,
          archived: existing.archived === 1
        }
      });
    }
    
    // Handle patient_id: only use if explicitly provided
    let patientIdValue = patientId && patientId.trim() !== '' ? patientId : null;
    
    // DO NOT auto-create patients - they should only be created when appointment is confirmed
    console.log('📝 Patient ID:', patientIdValue || 'None (pending appointment)');
    
    // Generate unique ID using timestamp + random
    const uniqueId = `rdv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await executeWithRetry(async () => {
      return await db.run(`
        INSERT INTO rendez_vous (
          id, patient_id, patient_nom, nom, prenom, date, heure, motif, statut, telephone, age, archived
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `, [
        uniqueId,
        patientIdValue,
        patientNom,
        nom,
        prenom,
        date,
        heure,
        motif,
        statut || 'en attente',
        telephone,
        age
      ]);
    });
    
    const newRdv = await db.get('SELECT * FROM rendez_vous WHERE id = ?', uniqueId);
    
    console.log('✅ Rendez-vous created:', newRdv.id);
    
    res.status(201).json({
      id: newRdv.id,
      patientId: newRdv.patient_id,
      patientNom: newRdv.patient_nom,
      nom: newRdv.nom,
      prenom: newRdv.prenom,
      date: newRdv.date,
      heure: newRdv.heure,
      motif: newRdv.motif,
      statut: newRdv.statut,
      telephone: newRdv.telephone,
      age: newRdv.age,
      archived: newRdv.archived === 1
    });
  } catch (error) {
    console.error('❌ Error creating rendez-vous:', error);
    console.error('❌ SQL Error Details:', error.message);
    console.error('❌ Request body:', JSON.stringify(req.body, null, 2));
    res.status(500).json({ 
      error: 'Failed to create rendez-vous', 
      details: error.message,
      sqlError: error.code 
    });
  }
});

// PUT update rendez-vous
router.put('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const rdv = await db.get('SELECT * FROM rendez_vous WHERE id = ?', req.params.id);
    
    if (!rdv) {
      return res.status(404).json({ error: 'Rendez-vous not found' });
    }
    
    const {
      patientId,
      patientNom,
      nom,
      prenom,
      date,
      heure,
      motif,
      statut,
      telephone,
      age,
      archived
    } = req.body;
    
    await db.run(`
      UPDATE rendez_vous SET
        patient_id = ?,
        patient_nom = ?,
        nom = ?,
        prenom = ?,
        date = ?,
        heure = ?,
        motif = ?,
        statut = ?,
        telephone = ?,
        age = ?,
        archived = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      patientId !== undefined ? patientId : rdv.patient_id,
      patientNom || rdv.patient_nom,
      nom || rdv.nom,
      prenom || rdv.prenom,
      date || rdv.date,
      heure || rdv.heure,
      motif || rdv.motif,
      statut || rdv.statut,
      telephone || rdv.telephone,
      age !== undefined ? age : rdv.age,
      archived !== undefined ? (archived ? 1 : 0) : rdv.archived,
      req.params.id
    ]);
    
    const updated = await db.get('SELECT * FROM rendez_vous WHERE id = ?', req.params.id);
    
    res.json({
      id: updated.id,
      patientId: updated.patient_id,
      patientNom: updated.patient_nom,
      nom: updated.nom,
      prenom: updated.prenom,
      date: updated.date,
      heure: updated.heure,
      motif: updated.motif,
      statut: updated.statut,
      telephone: updated.telephone,
      age: updated.age,
      archived: updated.archived === 1
    });
  } catch (error) {
    console.error('Error updating rendez-vous:', error);
    res.status(500).json({ error: 'Failed to update rendez-vous' });
  }
});

// DELETE rendez-vous
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const rdv = await db.get('SELECT * FROM rendez_vous WHERE id = ?', req.params.id);
    
    if (!rdv) {
      return res.status(404).json({ error: 'Rendez-vous not found' });
    }
    
    await db.run('DELETE FROM rendez_vous WHERE id = ?', req.params.id);
    
    res.json({ message: 'Rendez-vous deleted successfully' });
  } catch (error) {
    console.error('Error deleting rendez-vous:', error);
    res.status(500).json({ error: 'Failed to delete rendez-vous' });
  }
});

// GET dashboard stats
router.get('/stats/dashboard', async (req, res) => {
  try {
    const db = await getDb();
    const today = new Date().toISOString().split('T')[0];
    
    const totalPatients = await db.get('SELECT COUNT(*) as count FROM patients');
    const todayAppointments = await db.get(
      'SELECT COUNT(*) as count FROM rendez_vous WHERE date = ? AND archived = 0',
      today
    );
    const pendingAppointments = await db.get(
      "SELECT COUNT(*) as count FROM rendez_vous WHERE statut = 'en attente' AND archived = 0"
    );
    const confirmedAppointments = await db.get(
      "SELECT COUNT(*) as count FROM rendez_vous WHERE statut = 'confirmé' AND archived = 0"
    );
    
    res.json({
      totalPatients: totalPatients.count,
      todayAppointments: todayAppointments.count,
      pendingAppointments: pendingAppointments.count,
      confirmedAppointments: confirmedAppointments.count
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// GET calendar data - appointments filtered by month
// Usage: GET /calendar?year=2026&month=5
router.get('/calendar/month', async (req, res) => {
  try {
    const db = await getDb();
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ error: 'Missing year or month parameters' });
    }
    
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
    const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : year;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    
    console.log(`📅 Fetching calendar data for ${startDate} to ${endDate}`);
    
    const appointments = await db.all(
      `SELECT * FROM rendez_vous 
       WHERE date >= ? AND date < ? AND archived = 0 
       ORDER BY date ASC, heure ASC`,
      [startDate, endDate]
    );
    
    const result = appointments.map(rdv => ({
      id: rdv.id,
      patientId: rdv.patient_id,
      patientNom: rdv.patient_nom,
      nom: rdv.nom,
      prenom: rdv.prenom,
      date: rdv.date,
      heure: rdv.heure,
      motif: rdv.motif,
      statut: rdv.statut,
      telephone: rdv.telephone,
      age: rdv.age,
      archived: rdv.archived === 1
    }));
    
    console.log(`✅ Returned ${result.length} appointments for month`);
    res.json(result);
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    res.status(500).json({ error: 'Failed to fetch calendar data' });
  }
});

// GET calendar data - appointments for a specific day
// Usage: GET /calendar/day?date=2026-05-25
router.get('/calendar/day', async (req, res) => {
  try {
    const db = await getDb();
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Missing date parameter' });
    }
    
    console.log(`📅 Fetching appointments for ${date}`);
    
    const appointments = await db.all(
      `SELECT * FROM rendez_vous 
       WHERE date = ? AND archived = 0 
       ORDER BY heure ASC`,
      date
    );
    
    const result = appointments.map(rdv => ({
      id: rdv.id,
      patientId: rdv.patient_id,
      patientNom: rdv.patient_nom,
      nom: rdv.nom,
      prenom: rdv.prenom,
      date: rdv.date,
      heure: rdv.heure,
      motif: rdv.motif,
      statut: rdv.statut,
      telephone: rdv.telephone,
      age: rdv.age,
      archived: rdv.archived === 1
    }));
    
    console.log(`✅ Returned ${result.length} appointments for ${date}`);
    res.json(result);
  } catch (error) {
    console.error('Error fetching calendar day data:', error);
    res.status(500).json({ error: 'Failed to fetch calendar day data' });
  }
});

export default router;
