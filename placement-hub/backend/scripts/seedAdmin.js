require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('Error: MONGODB_URI is not defined in environment variables.');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Seed] Connected to MongoDB');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@placera.edu';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPass123!';
    const adminName = process.env.ADMIN_NAME || 'Placera Admin';

    // Check if admin already exists
    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      console.log(`[Seed] Admin user with email "${adminEmail}" already exists.`);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
    });

    console.log('========================================================');
    console.log(' Placera Admin Account Created Successfully!            ');
    console.log('========================================================');
    console.log(` Name:     ${admin.name}`);
    console.log(` Email:    ${admin.email}`);
    console.log(` Password: ${adminPassword}`);
    console.log(` Role:     ${admin.role}`);
    console.log('========================================================');
    console.log('Note: Please keep these credentials safe and change in prod.');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedAdmin();
