const bcrypt = require('bcryptjs');
const { User } = require('./models');

async function testLogin() {
  try {
    console.log('🔍 Checking for existing users...\n');
    
    // Check for admin user
    const admin = await User.findOne({ where: { email: 'admin@plotsure.com' } });
    if (admin) {
      console.log('✅ Admin user exists:');
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Active: ${admin.is_active}`);
      console.log(`   Verified: ${admin.verified}`);
    } else {
      console.log('❌ Admin user does not exist');
    }
    
    // Check for broker user
    const broker = await User.findOne({ where: { email: 'broker@plotsure.com' } });
    if (broker) {
      console.log('\n✅ Broker user exists:');
      console.log(`   Email: ${broker.email}`);
      console.log(`   Role: ${broker.role}`);
      console.log(`   Active: ${broker.is_active}`);
      console.log(`   Verified: ${broker.verified}`);
    } else {
      console.log('\n❌ Broker user does not exist');
    }
    
    // Test password verification
    if (admin) {
      const adminPasswordValid = await bcrypt.compare('admin123', admin.password);
      console.log(`\n🔑 Admin password test: ${adminPasswordValid ? '✅ Valid' : '❌ Invalid'}`);
    }
    
    if (broker) {
      const brokerPasswordValid = await bcrypt.compare('password123', broker.password);
      console.log(`🔑 Broker password test: ${brokerPasswordValid ? '✅ Valid' : '❌ Invalid'}`);
    }
    
    console.log('\n📊 Summary:');
    if (admin && broker) {
      console.log('✅ Both users exist and should be able to login');
    } else {
      console.log('❌ Users missing - need to create them');
    }
    
  } catch (error) {
    console.error('❌ Error testing login:', error);
  }
}

testLogin().then(() => {
  console.log('\n🎉 Test completed');
  process.exit(0);
}).catch(err => {
  console.error('💥 Test failed:', err);
  process.exit(1);
}); 