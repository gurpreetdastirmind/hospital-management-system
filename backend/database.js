// backend/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database', 'patients.db');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('✅ Connected to SQLite3 database');
  }
});

// Initialize database tables
const initDatabase = () => {
  db.serialize(() => {
    // Create patients table
    db.run(`
      CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone_number TEXT NOT NULL,
        name TEXT NOT NULL,
        age INTEGER,
        department TEXT,
        department_name TEXT,
        token TEXT,
        room_number INTEGER,
        language TEXT DEFAULT 'EN',
        registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating patients table:', err.message);
      } else {
        console.log('✅ Patients table created/verified');
      }
    });

    // Create index for faster queries
    db.run(`
      CREATE INDEX IF NOT EXISTS idx_patients_phone_number ON patients(phone_number)
    `, (err) => {
      if (err) {
        console.error('Error creating index:', err.message);
      }
    });

    db.run(`
      CREATE INDEX IF NOT EXISTS idx_patients_registration_date ON patients(registration_date)
    `, (err) => {
      if (err) {
        console.error('Error creating index:', err.message);
      }
    });

    // Create departments table
    db.run(`
      CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        room TEXT NOT NULL,
        token_prefix TEXT,
        icon TEXT DEFAULT '🏥',
        color TEXT DEFAULT '#4CAF50',
        is_open INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating departments table:', err.message);
      } else {
        console.log('✅ Departments table created/verified');
        
        // Insert default departments if none exist
        db.get(`SELECT COUNT(*) as count FROM departments`, (err, row) => {
          if (row && row.count === 0) {
            const defaultDepts = [
              ['General Medicine', 'Room 12', 'G', '🏥', '#4CAF50'],
              ['Dental', 'Room 21', 'D', '🦷', '#2196F3'],
              ['Eye', 'Room 18', 'E', '👁️', '#FF9800'],
              ['Bones', 'Room 31', 'B', '🦴', '#9C27B0'],
              ['Child', 'Room 26', 'C', '👶', '#E91E63'],
              ['Women', 'Room 15', 'W', '👩', '#F44336']
            ];
            
            defaultDepts.forEach(dept => {
              db.run(`
                INSERT INTO departments (name, room, token_prefix, icon, color)
                VALUES (?, ?, ?, ?, ?)
              `, dept);
            });
            console.log('✅ Default departments inserted');
          }
        });
      }
    });

    // Create tokens table with doctor column
    db.run(`
      CREATE TABLE IF NOT EXISTS tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token_number TEXT NOT NULL,
        patient_name TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        age INTEGER,
        department TEXT NOT NULL,
        room_number TEXT,
        doctor TEXT,
        source TEXT DEFAULT 'App',
        status TEXT DEFAULT 'waiting',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        called_at DATETIME,
        completed_at DATETIME,
        FOREIGN KEY (department) REFERENCES departments(name)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating tokens table:', err.message);
      } else {
        console.log('✅ Tokens table created/verified');
        
        // Create indexes
        db.run(`CREATE INDEX IF NOT EXISTS idx_tokens_department ON tokens(department)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_tokens_status ON tokens(status)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_tokens_created_at ON tokens(created_at)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_tokens_doctor ON tokens(doctor)`);
      }
    });

    // Add doctor column to tokens table if it doesn't exist (migration)
    db.run(`ALTER TABLE tokens ADD COLUMN doctor TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding doctor column:', err.message);
      } else if (err) {
        console.log('✅ Doctor column already exists in tokens table');
      } else {
        console.log('✅ Doctor column added to tokens table');
      }
    });

    // Create staff table
    db.run(`
      CREATE TABLE IF NOT EXISTS staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'staff',
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `, (err) => {
      if (err) {
        console.error('Error creating staff table:', err.message);
      } else {
        console.log('✅ Staff table created/verified');
        
        // Insert default admin if none exist
        db.get(`SELECT COUNT(*) as count FROM staff`, (err, row) => {
          if (row && row.count === 0) {
            const crypto = require('crypto');
            const hashPassword = (password) => {
              return crypto.createHash('sha256').update(password).digest('hex');
            };
            
            const defaultStaff = [
              ['Admin', 'admin@hospital.com', hashPassword('admin123'), 'admin'],
              ['Staff', 'staff@hospital.com', hashPassword('staff123'), 'staff'],
              ['Reception', 'reception@hospital.com', hashPassword('reception123'), 'reception']
            ];
            
            defaultStaff.forEach(staff => {
              db.run(`
                INSERT INTO staff (name, email, password, role)
                VALUES (?, ?, ?, ?)
              `, staff);
            });
            console.log('✅ Default staff accounts created');
            console.log('   - admin@hospital.com / admin123');
            console.log('   - staff@hospital.com / staff123');
            console.log('   - reception@hospital.com / reception123');
          }
        });
      }
    });

    // Create doctors table
    db.run(`
      CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        specialization TEXT NOT NULL,
        department TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        qualification TEXT,
        experience TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department) REFERENCES departments(name)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating doctors table:', err.message);
      } else {
        console.log('✅ Doctors table created/verified');
        
        // Create indexes for doctors table
        db.run(`CREATE INDEX IF NOT EXISTS idx_doctors_department ON doctors(department)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_doctors_status ON doctors(status)`);
        
        // Insert default doctors if none exist
        db.get(`SELECT COUNT(*) as count FROM doctors`, (err, row) => {
          if (row && row.count === 0) {
            const defaultDoctors = [
              ['Dr. Rajesh Kumar', 'Orthopedics', 'Bones', '9876543210', 'rajesh@hospital.com', 'MBBS, MS Ortho', '15'],
              ['Dr. Priya Sharma', 'Pediatrics', 'Child', '9876543211', 'priya@hospital.com', 'MBBS, MD Pediatrics', '12'],
              ['Dr. Amit Patel', 'Dentistry', 'Dental', '9876543212', 'amit@hospital.com', 'BDS, MDS', '8'],
              ['Dr. Sneha Reddy', 'Ophthalmology', 'Eye', '9876543213', 'sneha@hospital.com', 'MBBS, MS Ophthalmology', '10'],
              ['Dr. Vikram Singh', 'General Medicine', 'General Medicine', '9876543214', 'vikram@hospital.com', 'MBBS, MD Medicine', '20'],
              ['Dr. Ananya Gupta', 'Gynecology', 'Women', '9876543215', 'ananya@hospital.com', 'MBBS, MS Gynecology', '11']
            ];
            
            defaultDoctors.forEach(doctor => {
              db.run(`
                INSERT INTO doctors (name, specialization, department, phone, email, qualification, experience, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
              `, doctor);
            });
            console.log('✅ Default doctors inserted');
          }
        });
      }
    });

    // Create visits table for tracking
    db.run(`
      CREATE TABLE IF NOT EXISTS visits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER,
        visit_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        token TEXT,
        room_number INTEGER,
        department TEXT,
        status TEXT DEFAULT 'waiting',
        FOREIGN KEY (patient_id) REFERENCES patients(id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating visits table:', err.message);
      } else {
        console.log('✅ Visits table created/verified');
      }
    });
  });
};

// Utility functions
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
};

const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

const allQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

module.exports = {
  db,
  initDatabase,
  runQuery,
  getQuery,
  allQuery
};