const { sequelize } = require('./config/database');
const { User, Listing, Inquiry, Contact, Document, Media, ActivityLog } = require('./models');

async function initDatabase() {
  try {
    console.log('🔄 Initializing database...');
    
    // Sync all models to create tables
    await sequelize.sync({ force: true });
    console.log('✅ Database tables created successfully!');
    
    // Create test user
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const testUser = await User.create({
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
    console.log('👤 User ID:', testUser.id);
    
    // Create a sample listing
    const sampleListing = await Listing.create({
      title: 'Beautiful Residential Plot in Bugesera',
      description: 'Prime residential land with great potential for development. Located in a quiet neighborhood with good access to main roads.',
      land_type: 'residential',
      location: 'Bugesera, Nyamata',
      sector: 'Nyamata',
      cell: 'Nyamata',
      village: 'Nyamata',
      plot_size: 500,
      plot_size_unit: 'sqm',
      price: 25000000,
      price_negotiable: true,
      landowner_name: 'John Doe',
      landowner_phone: '+250 791 123 456',
      landowner_id_number: '1234567890123',
      user_id: testUser.id,
      status: 'available',
      verified: true
    });
    
    console.log('✅ Sample listing created successfully!');
    console.log('🏠 Listing ID:', sampleListing.id);
    
    console.log('\n🎉 Database initialization completed!');
    console.log('🚀 You can now start the server and login with:');
    console.log('   Email: broker@plotsure.com');
    console.log('   Password: password123');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

initDatabase(); 