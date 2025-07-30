const bcrypt = require('bcryptjs');
const { User, Listing, Inquiry, Contact, Document, Media, ActivityLog } = require('./models');
const { sequelize } = require('./config/database');

async function initializeSystem() {
  try {
    console.log('🚀 Initializing PlotSure Connect System...\n');

    // 1. Sync database
    console.log('📊 Syncing database...');
    await sequelize.sync({ force: false }); // Don't force, just sync
    console.log('✅ Database synced successfully!\n');

    // 2. Create admin user
    console.log('👤 Creating admin user...');
    const adminExists = await User.findOne({
      where: { email: 'admin@plotsure.com' }
    });

    if (!adminExists) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      const admin = await User.create({
        name: 'System Administrator',
        email: 'admin@plotsure.com',
        password: adminPassword,
        phone: '+250 791 000 000',
        role: 'admin',
        is_active: true,
        verified: true
      });
      console.log('✅ Admin user created!');
      console.log('📧 Email: admin@plotsure.com');
      console.log('🔑 Password: admin123');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // 3. Create broker user
    console.log('\n👤 Creating broker user...');
    const brokerExists = await User.findOne({
      where: { email: 'broker@plotsure.com' }
    });

    if (!brokerExists) {
      const brokerPassword = await bcrypt.hash('password123', 10);
      const broker = await User.create({
        name: 'Test Broker',
        email: 'broker@plotsure.com',
        password: brokerPassword,
        phone: '+250 791 845 708',
        role: 'broker',
        is_active: true,
        verified: true
      });
      console.log('✅ Broker user created!');
      console.log('📧 Email: broker@plotsure.com');
      console.log('🔑 Password: password123');
    } else {
      console.log('ℹ️ Broker user already exists');
    }

    // 4. Create sample listing
    console.log('\n🏠 Creating sample listing...');
    const listingExists = await Listing.findOne({
      where: { title: 'Sample Land Plot' }
    });

    if (!listingExists) {
      const sampleListing = await Listing.create({
        title: 'Sample Land Plot',
        description: 'This is a sample land listing for testing purposes.',
        price: 50000000,
        size: 500,
        location: 'Bugesera, Rwanda',
        status: 'available',
        featured: true,
        is_verified: true,
        broker_id: brokerExists ? brokerExists.id : 2
      });
      console.log('✅ Sample listing created!');
    } else {
      console.log('ℹ️ Sample listing already exists');
    }

    // 5. Display login credentials
    console.log('\n🎯 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👑 ADMIN:');
    console.log('   Email: admin@plotsure.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('👤 BROKER:');
    console.log('   Email: broker@plotsure.com');
    console.log('   Password: password123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n✅ System initialization completed successfully!');
    console.log('🚀 You can now login to the application.');

  } catch (error) {
    console.error('❌ Error initializing system:', error);
    throw error;
  }
}

// Run the initialization
initializeSystem().then(() => {
  console.log('\n🎉 All done! System is ready to use.');
  process.exit(0);
}).catch(err => {
  console.error('💥 Initialization failed:', err);
  process.exit(1);
}); 