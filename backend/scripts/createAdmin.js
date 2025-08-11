const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import User model
const User = require('../models/User');

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farm_management');

    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@farmmanagement.com',
      password: 'admin123', // This will be hashed by the pre-save hook
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      isActive: true
    });

    await adminUser.save();

    console.log('Admin user created successfully!');
    console.log('Email:', adminUser.email);
    console.log('Username:', adminUser.username);
    console.log('Password: admin123');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

// Run the script
createAdminUser();