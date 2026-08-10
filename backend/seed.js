const mongoose = require('mongoose');
require('dotenv').config();
const Department = require('./models/Department');
const Staff = require('./models/Staff');
const Patient = require('./models/Patient');

const seedDatabase = async () => {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding...');

    // 2. Clear old data (Optional - removes everything so you start fresh)
    await Department.deleteMany();
    await Staff.deleteMany();
    await Patient.deleteMany();
    console.log('🧹 Cleared old collections...');

    // 3. Seed Departments
    const departments = [
      { name: 'General', room: 'Room 12', tokenPrefix: 'G', icon: '🏥', color: '#4CAF50', isOpen: true },
      { name: 'Dental', room: 'Room 21', tokenPrefix: 'D', icon: '🦷', color: '#2196F3', isOpen: true },
      { name: 'Eye', room: 'Room 18', tokenPrefix: 'E', icon: '👁️', color: '#FF9800', isOpen: true },
      { name: 'Bones', room: 'Room 31', tokenPrefix: 'B', icon: '🦴', color: '#9C27B0', isOpen: true },
      { name: 'Child', room: 'Room 26', tokenPrefix: 'C', icon: '👶', color: '#E91E63', isOpen: true },
      { name: 'Women', room: 'Room 15', tokenPrefix: 'W', icon: '👩', color: '#F44336', isOpen: true }
    ];
    await Department.insertMany(departments);
    console.log('✅ 6 Departments added!');

    // 4. Seed Staff
    const staff = [
      { name: 'Admin', email: 'admin@hospital.com', password: Staff.hashPassword('admin123'), role: 'admin' },
      { name: 'Staff', email: 'staff@hospital.com', password: Staff.hashPassword('staff123'), role: 'staff' },
      { name: 'Reception', email: 'reception@hospital.com', password: Staff.hashPassword('reception123'), role: 'reception' }
    ];
    await Staff.insertMany(staff);
    console.log('✅ 3 Staff accounts created!');

    // 5. Seed a Test Patient (So your /phone/ API works immediately)
    await Patient.create({
      phoneNumber: '7894561230',
      name: 'Test Patient',
      age: 30,
      department: 'Bones',
      departmentName: 'Bones',
      token: 'B-01',
      roomNumber: 'Room 31'
    });
    console.log('✅ Test patient created for phone: 7894561230');

    console.log('🎉 Database seeding complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();