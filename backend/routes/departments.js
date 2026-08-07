const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');

// Routes
router.get('/', departmentController.getDepartments);
router.get('/:id', departmentController.getDepartmentById);
router.post('/', departmentController.createDepartment);
router.put('/:id', departmentController.updateDepartment);
router.delete('/:id', departmentController.deleteDepartment);
router.patch('/:id/toggle', departmentController.toggleDepartment);

module.exports = router;