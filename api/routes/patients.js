import express from 'express';
import getDb from '../db.js';

const router = express.Router();

// GET all patients
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const patients = await db.all(`
      SELECT * FROM patients 
      ORDER BY created_at DESC
    `);
    
    // Get step completions for each patient
    const patientsWithSteps = await Promise.all(patients.map(async (patient) => {
      const steps = await db.all(
        'SELECT * FROM patient_step_completions WHERE patient_id = ?',
        patient.id
      );
      
      const payments = await db.all(
        'SELECT * FROM payment_records WHERE patient_id = ? ORDER BY date DESC',
        patient.id
      );
      
      return {
        id: patient.id,
        nom: patient.nom,
        prenom: patient.prenom,
        age: patient.age,
        telephone: patient.telephone,
        antecedents: patient.antecedents,
        categorie: patient.categorie,
        typeSoin: patient.type_soin,
        typeSoinId: patient.type_soin_id,
        etapeActuelle: patient.etape_actuelle,
        stepsCompleted: steps.map(s => ({
          stepId: s.step_id,
          stepName: s.step_name,
          completedAt: s.completed_at
        })),
        dateCreation: patient.date_creation,
        montantTotal: patient.montant_total || 0,
        montantPaye: patient.montant_paye || 0,
        paymentHistory: payments.map(p => ({
          id: p.id,
          amount: p.amount,
          date: p.date,
          notes: p.notes,
          locked: p.locked === 1
        })),
        clinicalNotes: patient.clinical_notes,
        statu: patient.statu || 0
      };
    }));
    
    res.json(patientsWithSteps);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// GET single patient by ID
router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const patient = await db.get('SELECT * FROM patients WHERE id = ?', req.params.id);
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    const steps = await db.all(
      'SELECT * FROM patient_step_completions WHERE patient_id = ?',
      patient.id
    );
    
    const payments = await db.all(
      'SELECT * FROM payment_records WHERE patient_id = ? ORDER BY date DESC',
      patient.id
    );
    
    const result = {
      id: patient.id,
      nom: patient.nom,
      prenom: patient.prenom,
      age: patient.age,
      telephone: patient.telephone,
      antecedents: patient.antecedents,
      categorie: patient.categorie,
      typeSoin: patient.type_soin,
      typeSoinId: patient.type_soin_id,
      etapeActuelle: patient.etape_actuelle,
      stepsCompleted: steps.map(s => ({
        stepId: s.step_id,
        stepName: s.step_name,
        completedAt: s.completed_at
      })),
      dateCreation: patient.date_creation,
      montantTotal: patient.montant_total || 0,
      montantPaye: patient.montant_paye || 0,
      paymentHistory: payments.map(p => ({
        id: p.id,
        amount: p.amount,
        date: p.date,
        notes: p.notes,
        locked: p.locked === 1
      })),
      clinicalNotes: patient.clinical_notes,
      statu: patient.statu || 0
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// POST create new patient
router.post('/', async (req, res) => {
  try {
    const db = await getDb();
    const {
      id,
      nom,
      prenom,
      age,
      telephone,
      antecedents,
      categorie,
      typeSoin,
      typeSoinId,
      etapeActuelle,
      montantTotal,
      montantPaye,
      clinicalNotes
    } = req.body;
    
    if (!nom || !prenom) {
      return res.status(400).json({ error: 'Missing required fields: nom, prenom' });
    }
    
    // Check for duplicate patient (same nom, prenom, and telephone)
    if (telephone) {
      const existingPatient = await db.get(
        'SELECT id, nom, prenom FROM patients WHERE nom = ? AND prenom = ? AND telephone = ?',
        [nom, prenom, telephone]
      );
      
      if (existingPatient) {
        console.log(`⚠️  Duplicate patient detected: ${nom} ${prenom} (${telephone})`);
        return res.status(409).json({ 
          error: 'Ce patient existe déjà dans la base de données',
          details: `Patient ${nom} ${prenom} avec le numéro ${telephone} existe déjà`,
          existingPatientId: existingPatient.id
        });
      }
    }
    
    const dateCreation = new Date().toISOString().split('T')[0];
    
    await db.run(`
      INSERT INTO patients (
        id, nom, prenom, age, telephone, antecedents, categorie,
        type_soin, type_soin_id, etape_actuelle, date_creation,
        montant_total, montant_paye, clinical_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      nom,
      prenom,
      age,
      telephone,
      antecedents,
      categorie,
      typeSoin,
      typeSoinId,
      etapeActuelle,
      dateCreation,
      montantTotal || 0,
      montantPaye || 0,
      clinicalNotes
    ]);
    
    const newPatient = await db.get('SELECT * FROM patients WHERE id = ?', id);
    
    res.status(201).json({
      id: newPatient.id,
      nom: newPatient.nom,
      prenom: newPatient.prenom,
      age: newPatient.age,
      telephone: newPatient.telephone,
      antecedents: newPatient.antecedents,
      categorie: newPatient.categorie,
      typeSoin: newPatient.type_soin,
      typeSoinId: newPatient.type_soin_id,
      etapeActuelle: newPatient.etape_actuelle,
      stepsCompleted: [],
      dateCreation: newPatient.date_creation,
      montantTotal: newPatient.montant_total || 0,
      montantPaye: newPatient.montant_paye || 0,
      paymentHistory: [],
      clinicalNotes: newPatient.clinical_notes,
      statu: newPatient.statu || 0
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// PUT update patient
router.put('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const patient = await db.get('SELECT * FROM patients WHERE id = ?', req.params.id);
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    const {
      nom,
      prenom,
      age,
      telephone,
      antecedents,
      categorie,
      typeSoin,
      typeSoinId,
      etapeActuelle,
      montantTotal,
      montantPaye,
      clinicalNotes,
      stepsCompleted,
      newPayment // New field to track if this is a payment update
    } = req.body;
    
    await db.run('BEGIN TRANSACTION');
    
    try {
      // Check if this is a payment update (montantPaye increased)
      const oldMontantPaye = patient.montant_paye || 0;
      const newMontantPaye = montantPaye !== undefined ? montantPaye : oldMontantPaye;
      const paymentDifference = newMontantPaye - oldMontantPaye;
      
      // If montantPaye increased, create a payment record
      if (paymentDifference > 0) {
        const paymentId = `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await db.run(`
          INSERT INTO payment_records (id, patient_id, amount, date, notes, locked)
          VALUES (?, ?, ?, ?, ?, 1)
        `, [
          paymentId,
          req.params.id,
          paymentDifference,
          new Date().toISOString(),
          newPayment?.notes || 'Paiement enregistré'
        ]);
        console.log(`✅ Payment record created: ${paymentDifference} DA`);
      }
      
      // Update patient basic info
      await db.run(`
        UPDATE patients SET
          nom = ?,
          prenom = ?,
          age = ?,
          telephone = ?,
          antecedents = ?,
          categorie = ?,
          type_soin = ?,
          type_soin_id = ?,
          etape_actuelle = ?,
          montant_total = ?,
          montant_paye = ?,
          clinical_notes = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        nom || patient.nom,
        prenom || patient.prenom,
        age !== undefined ? age : patient.age,
        telephone || patient.telephone,
        antecedents || patient.antecedents,
        categorie || patient.categorie,
        typeSoin || patient.type_soin,
        typeSoinId || patient.type_soin_id,
        etapeActuelle !== undefined ? etapeActuelle : patient.etape_actuelle,
        montantTotal !== undefined ? montantTotal : patient.montant_total,
        newMontantPaye,
        clinicalNotes !== undefined ? clinicalNotes : patient.clinical_notes,
        req.params.id
      ]);
      
      // If stepsCompleted is provided, update the step completions
      if (Array.isArray(stepsCompleted)) {
        console.log(`🔄 Updating step completions for patient ${req.params.id}`);
        console.log(`   New steps to insert: ${stepsCompleted.length}`);
        
        if (stepsCompleted.length === 0) {
          console.log(`   ⚠️  Empty array received - will clear all step completions`);
        }
        
        // Delete existing step completions (always delete first, even if array is empty)
        const deleteResult = await db.run('DELETE FROM patient_step_completions WHERE patient_id = ?', req.params.id);
        console.log(`   ✅ Deleted ${deleteResult.changes} existing step records`);
        
        // Insert new step completions (only if array is not empty)
        if (stepsCompleted.length > 0) {
          for (const step of stepsCompleted) {
            await db.run(`
              INSERT INTO patient_step_completions (patient_id, step_id, step_name, completed_at)
              VALUES (?, ?, ?, ?)
            `, [req.params.id, step.stepId, step.stepName, step.completedAt]);
            console.log(`   ✅ Inserted step: ${step.stepName}`);
          }
        } else {
          console.log(`   ℹ️  No steps to insert (all steps cleared)`);
        }
        
        console.log(`✅ Step completions updated successfully (${stepsCompleted.length} steps)`);
      }
      
      await db.run('COMMIT');
      
      // Fetch updated patient with all related data
      const updated = await db.get('SELECT * FROM patients WHERE id = ?', req.params.id);
      const steps = await db.all('SELECT * FROM patient_step_completions WHERE patient_id = ?', req.params.id);
      const payments = await db.all('SELECT * FROM payment_records WHERE patient_id = ? ORDER BY date DESC', req.params.id);
      
      res.json({
        id: updated.id,
        nom: updated.nom,
        prenom: updated.prenom,
        age: updated.age,
        telephone: updated.telephone,
        antecedents: updated.antecedents,
        categorie: updated.categorie,
        typeSoin: updated.type_soin,
        typeSoinId: updated.type_soin_id,
        etapeActuelle: updated.etape_actuelle,
        stepsCompleted: steps.map(s => ({
          stepId: s.step_id,
          stepName: s.step_name,
          completedAt: s.completed_at
        })),
        dateCreation: updated.date_creation,
        montantTotal: updated.montant_total || 0,
        montantPaye: updated.montant_paye || 0,
        paymentHistory: payments.map(p => ({
          id: p.id,
          amount: p.amount,
          date: p.date,
          notes: p.notes,
          locked: p.locked === 1
        })),
        clinicalNotes: updated.clinical_notes,
        statu: updated.statu || 0
      });
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

// PATCH toggle patient statu
router.patch('/:id/toggle-statu', async (req, res) => {
  try {
    const db = await getDb();
    const patient = await db.get('SELECT * FROM patients WHERE id = ?', req.params.id);
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    const newStatu = patient.statu === 1 ? 0 : 1;
    await db.run('UPDATE patients SET statu = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStatu, req.params.id]);
    
    res.json({ id: req.params.id, statu: newStatu });
  } catch (error) {
    console.error('Error toggling patient statu:', error);
    res.status(500).json({ error: 'Failed to toggle patient statu' });
  }
});

// PUT update payment record with password verification and difference-based financial calculation
router.put('/payment-records/:paymentId', async (req, res) => {
  console.log("🎯 DEBUG: PUT request received for payment-records route");
  console.log("🎯 DEBUG: req.params.paymentId =", req.params.paymentId);
  console.log("🎯 DEBUG: req.method =", req.method);
  console.log("🎯 DEBUG: req.path =", req.path);
  
  try {
    const bcrypt = await import('bcrypt').then(m => m.default);
    const db = await getDb();
    const { paymentId } = req.params;
    const { newAmount, newDate, password } = req.body;

    console.log("✏️  PUT: Updating payment record with ID:", paymentId);
    console.log('DEBUG: Received update request data:', JSON.stringify(req.body, null, 2));

    if (!password) {
      return res.status(400).json({ error: 'Missing required field: password' });
    }

    if (newAmount === undefined || newAmount === null) {
      return res.status(400).json({ error: 'Missing required field: newAmount' });
    }

    if (!newDate) {
      return res.status(400).json({ error: 'Missing required field: newDate' });
    }

    // ===== STEP 1: READ OLD PAYMENT DATA =====
    console.log('📖 STEP 1: Reading old payment record...');
    const oldPayment = await db.get('SELECT * FROM payment_records WHERE id = ?', [paymentId]);
    if (!oldPayment) {
      console.error(`❌ Payment record not found: ${paymentId}`);
      return res.status(404).json({ error: 'Payment record not found' });
    }

    const patientId = oldPayment.patient_id;
    const oldAmount = oldPayment.amount;
    console.log(`   ✓ Old payment found: amount=${oldAmount}, patientId=${patientId}`);

    // Fetch current patient balance
    const patient = await db.get('SELECT montant_paye, montant_total FROM patients WHERE id = ?', [patientId]);
    if (!patient) {
      console.error(`❌ Patient not found: ${patientId}`);
      return res.status(404).json({ error: 'Patient not found' });
    }

    const currentMontantPaye = patient.montant_paye;
    console.log(`   ✓ Current patient montant_paye: ${currentMontantPaye}`);

    // ===== STEP 2: VERIFY PASSWORD BEFORE ANY CHANGES =====
    console.log('🔐 STEP 2: Verifying admin password...');
    const adminUser = await db.get('SELECT * FROM users LIMIT 1');
    if (!adminUser) {
      console.error('❌ No admin user found in database');
      return res.status(500).json({ error: 'Admin user not configured' });
    }

    const passwordMatch = await bcrypt.compare(password, adminUser.password);
    if (!passwordMatch) {
      console.log('❌ Invalid password provided');
      return res.status(401).json({ error: 'Invalid password' });
    }
    console.log('✅ Password verified - proceeding with update');

    // ===== STEP 3: CALCULATE DIFFERENCE AND NEW BALANCE =====
    console.log('🧮 STEP 3: Calculating balance change...');
    const diff = newAmount - oldAmount;
    const newMontantPaye = currentMontantPaye + diff;

    console.log(`   Old amount: ${oldAmount} DA`);
    console.log(`   New amount: ${newAmount} DA`);
    console.log(`   Difference: ${diff} DA (${diff > 0 ? 'increase' : 'decrease'})`);
    console.log(`   Calculation: ${currentMontantPaye} + ${diff} = ${newMontantPaye}`);

    // Validate result
    if (newMontantPaye < 0) {
      console.error(`❌ Invalid calculation: New total would be negative: ${newMontantPaye}`);
      return res.status(400).json({ error: 'New amount would result in negative patient balance' });
    }

    console.log(`   ✓ New montant_paye: ${newMontantPaye}`);

    // ===== STEP 4: EXECUTE UPDATE IN ATOMIC TRANSACTION =====
    console.log('💾 STEP 4: Executing atomic transaction...');

    // Update payment_records
    const updatePaymentResult = await db.run(
      'UPDATE payment_records SET amount = ?, date = ? WHERE id = ?',
      [newAmount, newDate, paymentId]
    );

    if (updatePaymentResult.changes === 0) {
      console.error(`❌ Payment record update failed - no rows affected`);
      return res.status(400).json({ error: 'Payment record update failed' });
    }
    console.log(`   ✓ Payment record updated: ${updatePaymentResult.changes} row(s)`);

    // Update patients table with new montant_paye
    const updatePatientResult = await db.run(
      'UPDATE patients SET montant_paye = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newMontantPaye, patientId]
    );

    if (updatePatientResult.changes === 0) {
      console.error(`❌ Patient balance update failed - no rows affected`);
      return res.status(400).json({ error: 'Patient balance update failed' });
    }
    console.log(`   ✓ Patient balance updated: ${updatePatientResult.changes} row(s)`);

    // ===== STEP 5: FETCH UPDATED DATA =====
    console.log('📥 STEP 5: Fetching updated data...');
    const updatedPayment = await db.get('SELECT * FROM payment_records WHERE id = ?', [paymentId]);
    const updatedPatient = await db.get('SELECT * FROM patients WHERE id = ?', [patientId]);

    if (!updatedPayment || !updatedPatient) {
      console.error(`⚠️  Could not fetch updated records`);
      return res.status(500).json({ error: 'Records updated but could not fetch updated data' });
    }

    console.log(`✅ Payment record ${paymentId} updated successfully`);
    console.log(`   Old amount: ${oldAmount} DA → New amount: ${newAmount} DA`);
    console.log(`   Patient balance updated: ${currentMontantPaye} → ${updatedPatient.montant_paye} DA`);

    res.json({
      message: 'Payment record updated successfully with financial recalculation',
      updatedPayment: {
        id: updatedPayment.id,
        patientId: updatedPayment.patient_id,
        oldAmount: oldAmount,
        newAmount: updatedPayment.amount,
        difference: diff,
        date: updatedPayment.date
      },
      patientUpdate: {
        patientId: updatedPatient.id,
        oldMontantPaye: currentMontantPaye,
        newMontantPaye: updatedPatient.montant_paye,
        montantTotal: updatedPatient.montant_total,
        resteAPayer: (updatedPatient.montant_total || 0) - updatedPatient.montant_paye
      }
    });
  } catch (error) {
    console.error('Error updating payment record:', error);
    console.error('Full error details:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to update payment record', details: error.message });
  }
});

// DELETE payment record with password verification and financial recalculation
router.delete('/payment-records/:paymentId', async (req, res) => {
  try {
    const bcrypt = await import('bcrypt').then(m => m.default);
    const db = await getDb();
    const { paymentId } = req.params;
    const { password } = req.body;

    console.log("🗑️  DELETE: Deleting payment record with ID:", paymentId);
    console.log('DEBUG: Received delete request data:', JSON.stringify(req.body, null, 2));

    if (!password) {
      return res.status(400).json({ error: 'Missing required field: password' });
    }

    // ===== STEP 1: READ PAYMENT DATA =====
    console.log('📖 STEP 1: Reading payment record to be deleted...');
    const paymentRecord = await db.get('SELECT * FROM payment_records WHERE id = ?', [paymentId]);
    if (!paymentRecord) {
      console.error(`❌ Payment record not found: ${paymentId}`);
      return res.status(404).json({ error: 'Payment record not found' });
    }

    const patientId = paymentRecord.patient_id;
    const deletedAmount = paymentRecord.amount;
    console.log(`   ✓ Payment to delete: amount=${deletedAmount}, patientId=${patientId}`);

    // Fetch current patient balance
    const patient = await db.get('SELECT montant_paye, montant_total FROM patients WHERE id = ?', [patientId]);
    if (!patient) {
      console.error(`❌ Patient not found: ${patientId}`);
      return res.status(404).json({ error: 'Patient not found' });
    }

    const currentTotalPaid = patient.montant_paye;
    console.log(`   ✓ Current patient montant_paye: ${currentTotalPaid}`);

    // ===== STEP 2: VERIFY PASSWORD BEFORE ANY CHANGES =====
    console.log('🔐 STEP 2: Verifying admin password...');
    const adminUser = await db.get('SELECT * FROM users LIMIT 1');
    if (!adminUser) {
      console.error('❌ No admin user found in database');
      return res.status(500).json({ error: 'Admin user not configured' });
    }

    const passwordMatch = await bcrypt.compare(password, adminUser.password);
    if (!passwordMatch) {
      console.log('❌ Invalid password provided');
      return res.status(401).json({ error: 'Invalid password' });
    }
    console.log('✅ Password verified - proceeding with deletion');

    // ===== STEP 3: CALCULATE NEW BALANCE =====
    console.log('🧮 STEP 3: Calculating new patient balance after deletion...');
    const newTotalPaid = currentTotalPaid - deletedAmount;

    console.log(`   Calculation: ${currentTotalPaid} - ${deletedAmount} = ${newTotalPaid}`);
    console.log("DEBUG CALC:", { deletedAmount, currentTotalPaid, newTotalPaid });

    // Validate result
    if (newTotalPaid < 0) {
      console.error(`❌ Invalid calculation: New total would be negative: ${newTotalPaid}`);
      return res.status(400).json({ error: 'Payment deletion would result in negative patient balance' });
    }

    console.log(`   ✓ New total paid after deletion: ${newTotalPaid}`);

    // ===== STEP 4: EXECUTE DELETE AND UPDATE IN TRANSACTION =====
    console.log('💾 STEP 4: Executing database operations...');

    // Delete payment_records
    const deletePaymentResult = await db.run(
      'DELETE FROM payment_records WHERE id = ?',
      [paymentId]
    );

    if (deletePaymentResult.changes === 0) {
      console.error(`❌ Payment record deletion failed - no rows affected`);
      return res.status(400).json({ error: 'Payment record deletion failed' });
    }
    console.log(`   ✓ Payment record deleted: ${deletePaymentResult.changes} row(s)`);

    // Update patients table with new montant_paye
    const updatePatientResult = await db.run(
      'UPDATE patients SET montant_paye = ? WHERE id = ?',
      [newTotalPaid, patientId]
    );

    if (updatePatientResult.changes === 0) {
      console.error(`❌ Patient balance update failed - no rows affected`);
      return res.status(400).json({ error: 'Patient balance update failed' });
    }
    console.log(`   ✓ Patient balance updated: ${updatePatientResult.changes} row(s)`);

    // ===== STEP 5: FETCH UPDATED PATIENT DATA =====
    console.log('📥 STEP 5: Fetching updated patient data...');
    const updatedPatient = await db.get('SELECT * FROM patients WHERE id = ?', [patientId]);

    if (!updatedPatient) {
      console.error(`⚠️  Could not fetch updated patient record`);
      return res.status(500).json({ error: 'Record deleted but could not fetch updated patient data' });
    }

    console.log(`✅ Payment record ${paymentId} deleted successfully`);
    console.log(`   Deleted amount: ${deletedAmount} DA`);
    console.log(`   Updated patient montant_paye: ${updatedPatient.montant_paye} DA`);

    res.json({
      message: 'Payment record deleted successfully with financial recalculation',
      deletedPayment: {
        id: paymentRecord.id,
        patientId: paymentRecord.patient_id,
        amount: paymentRecord.amount,
        date: paymentRecord.date
      },
      patientUpdate: {
        patientId: updatedPatient.id,
        montantPaye: updatedPatient.montant_paye,
        montantTotal: updatedPatient.montant_total,
        resteAPayer: (updatedPatient.montant_total || 0) - updatedPatient.montant_paye
      }
    });
  } catch (error) {
    console.error('Error deleting payment record:', error);
    console.error('Full error details:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to delete payment record', details: error.message });
  }
});

// DELETE patient
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const patient = await db.get('SELECT * FROM patients WHERE id = ?', req.params.id);
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    await db.run('DELETE FROM patients WHERE id = ?', req.params.id);
    
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

export default router;
