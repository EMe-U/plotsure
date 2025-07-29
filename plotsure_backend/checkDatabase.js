const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function checkDatabase() {
  try {
    console.log('🔍 Checking database connection...');
    
    // Test database connection
    await User.sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Check if any users exist
    const userCount = await User.count();
    console.log(`📊 Total users in database: ${userCount}`);
    
    if (userCount === 0) {
      console.log('⚠️ No users found in database');
      console.log('🛠️ Creating test user...');
      
      // Create test user
      const hashedPassword = await bcrypt.hash('password123', 10);
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
    } else {
      console.log('✅ Users found in database');
      
      // List all users
      const users = await User.findAll({
        attributes: ['id', 'name', 'email', 'role', 'is_active']
      });
      
      console.log('📋 Users in database:');
      users.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - ${user.role} - Active: ${user.is_active}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

// Run the check
checkDatabase().then(() => {
  console.log('✅ Database check completed');
  process.exit(0);
}).catch(err => {
  console.error('❌ Database check failed:', err);
  process.exit(1);
}); 