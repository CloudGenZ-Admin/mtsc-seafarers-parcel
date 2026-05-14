require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, Admin } = require('./src/models');

async function seedAdmin() {
  try {
    await sequelize.sync();
    
    const username = 'admin';
    const password = 'adminPassword123'; // The user can change this later
    const passwordHash = await bcrypt.hash(password, 10);
    
    const [admin, created] = await Admin.findOrCreate({
      where: { username },
      defaults: { passwordHash }
    });
    
    if (created) {
      console.log('Super Admin created successfully');
      console.log('Username:', username);
      console.log('Password:', password);
    } else {
      console.log('Admin already exists');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seedAdmin();
