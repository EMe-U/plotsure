const bcrypt = require('bcryptjs');
const { User } = require('./models');

async function createTestUser() {
  try {
    // Check if test user already exists
    const existingUser = await User.findOne({
      where: { email: 'broker@plotsure.com' }
    });

    if (existingUser) {
      console.log('Test user already exists!');
      console.log('Email: broker@plotsure.com');
      console.log('Password: password123');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create test user
    const user = await User.create({
      name: 'Test Broker',
      email: 'broker@plotsure.com',
      password: hashedPassword,
      phone: '+250 791 845 708',
      role: 'broker',
      is_active: true
    });

    console.log('✅ Test user created successfully!');
    console.log('📧 Email: broker@plotsure.com');
    console.log('🔑 Password: password123');
    console.log('👤 User ID:', user.id);

  } catch (error) {
    console.error('❌ Error creating test user:', error);
  }
}

// Run the function
createTestUser().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});

