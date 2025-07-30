const { Listing } = require('./models');

async function fixListingStatuses() {
    try {
        console.log('🔧 Fixing listing statuses...');
        
        // Get all listings
        const listings = await Listing.findAll();
        console.log(`📊 Found ${listings.length} listings`);
        
        if (listings.length === 0) {
            console.log('⚠️ No listings found in database');
            return;
        }
        
        // Update all listings to "available" status
        for (const listing of listings) {
            await Listing.update(
                { status: 'available' },
                { where: { id: listing.id } }
            );
            console.log(`✅ Updated listing ${listing.id}: "${listing.title}" to available`);
        }
        
        console.log('✅ All listings updated to "available" status');
        
        // Verify the changes
        const updatedListings = await Listing.findAll({ 
            attributes: ['id', 'title', 'status', 'price_amount', 'land_size_value'] 
        });
        
        console.log('📋 Updated listings:');
        updatedListings.forEach(listing => {
            console.log(`  - ID: ${listing.id}, Title: "${listing.title}", Status: ${listing.status}`);
        });
        
        const availableCount = updatedListings.filter(l => l.status === 'available').length;
        console.log(`🟢 Available listings: ${availableCount}/${updatedListings.length}`);
        
        console.log('🎉 All listings should now appear in the dashboard!');
        
    } catch (error) {
        console.error('❌ Error fixing listing statuses:', error);
    }
}

fixListingStatuses().then(() => {
    console.log('✅ Status fix complete');
    process.exit(0);
}).catch(err => {
    console.error('❌ Script failed:', err);
    process.exit(1);
}); 