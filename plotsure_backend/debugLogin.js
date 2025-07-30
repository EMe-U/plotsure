const bcrypt = require('bcryptjs');
const { User } = require('./models');

async function debugLogin() {
  try {
    console.log('🔍 Debugging login issue...\n');
    
    // Find the broker user
    const user = await User.findOne({ 
      where: { email: 'broker@plotsure.com' },
      attributes: { include: ['password'] }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.is_active}`);
    console.log(`   Verified: ${user.verified}`);
    console.log(`   Password hash: ${user.password.substring(0, 20)}...`);
    
    // Test password comparison
    const testPassword = 'password123';
    console.log(`\n🔑 Testing password: "${testPassword}"`);
    
    // Method 1: Using the model's comparePassword method
    const isValid1 = await user.comparePassword(testPassword);
    console.log(`   Model comparePassword: ${isValid1 ? '✅ Valid' : '❌ Invalid'}`);
    
    // Method 2: Direct bcrypt comparison
    const isValid2 = await bcrypt.compare(testPassword, user.password);
    console.log(`   Direct bcrypt.compare: ${isValid2 ? '✅ Valid' : '❌ Invalid'}`);
    
    // Method 3: Hash the test password and compare hashes
    const testHash = await bcrypt.hash(testPassword, 10);
    console.log(`   Test password hash: ${testHash.substring(0, 20)}...`);
    console.log(`   Hash comparison: ${testHash === user.password ? '✅ Match' : '❌ No match'}`);
    
    // Test with admin user too
    console.log('\n👑 Testing admin user...');
    const admin = await User.findOne({ 
      where: { email: 'admin@plotsure.com' },
      attributes: { include: ['password'] }
    });
    
    if (admin) {
      const adminPassword = 'admin123';
      const adminValid = await admin.comparePassword(adminPassword);
      console.log(`   Admin password test: ${adminValid ? '✅ Valid' : '❌ Invalid'}`);
    }
    
    console.log('\n📊 Summary:');
    if (isValid1 && isValid2) {
      console.log('✅ Password comparison should work');
    } else {
      console.log('❌ Password comparison failing');
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugLogin().then(() => {
  console.log('\n🎉 Debug completed');
  process.exit(0);
}).catch(err => {
  console.error('💥 Debug failed:', err);
  process.exit(1);
}); 