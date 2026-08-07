const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');

// Routes
router.post('/save', patientController.savePatient);
router.get('/:id', patientController.getPatient);
router.get('/phone/:phone', patientController.getPatientByPhone);
router.get('/', patientController.getAllPatients);
router.put('/:id', patientController.updatePatient);
router.delete('/:id', patientController.deletePatient);
router.get('/stats', patientController.getStats);

module.exports = router;