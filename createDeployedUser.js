// Script to create a test user on the deployed server
// This script uses built-in fetch (available in Node.js 18+)

async function createDeployedUser() {
  try {
    console.log('🚀 Creating test user on deployed server...');
    console.log('📡 Server: https://plotsure-connect.onrender.com');
    
    const userData = {
      name: 'Test Broker',
      email: 'broker@plotsure.com',
      password: 'password123',
      phone: '+250 791 845 708',
      role: 'broker'
    };
    
    console.log('📧 Email:', userData.email);
    console.log('🔑 Password:', userData.password);
    
    const response = await fetch('https://plotsure-connect.onrender.com/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    const result = await response.json();
    console.log('📊 Response status:', response.status);
    console.log('📋 Response:', result);
    
    if (result.success) {
      console.log('✅ Test user created successfully on deployed server!');
      console.log('🎉 You can now login with:');
      console.log('   📧 Email: broker@plotsure.com');
      console.log('   🔑 Password: password123');
    } else {
      console.log('❌ Failed to create user:', result.message);
      
      if (result.message && result.message.includes('already exists')) {
        console.log('ℹ️ User already exists on deployed server');
        console.log('✅ You can login with:');
        console.log('   📧 Email: broker@plotsure.com');
        console.log('   🔑 Password: password123');
      }
    }
    
  } catch (error) {
    console.error('❌ Error creating user on deployed server:', error.message);
    console.log('💡 Make sure your deployed server is running');
    console.log('💡 Alternative: Use browser console method below');
  }
}

// Check if fetch is available
if (typeof fetch === 'undefined') {
  console.log('❌ Fetch is not available in this Node.js version');
  console.log('💡 Please use one of these alternatives:');
  console.log('');
  console.log('1. Use browser console:');
  console.log('   - Go to: https://plotsure-connect.onrender.com');
  console.log('   - Open browser console (F12)');
  console.log('   - Run this code:');
  console.log(`
fetch('https://plotsure-connect.onrender.com/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test Broker',
    email: 'broker@plotsure.com',
    password: 'password123',
    phone: '+250 791 845 708',
    role: 'broker'
  })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
  `);
  console.log('');
  console.log('2. Install node-fetch:');
  console.log('   npm install node-fetch');
  console.log('');
  console.log('3. Use Postman or similar tool');
  process.exit(1);
}

// Run the function
createDeployedUser().then(() => {
  console.log('✅ Script completed');
  process.exit(0);
}).catch(err => {
  console.error('❌ Script failed:', err);
  process.exit(1);
}); 