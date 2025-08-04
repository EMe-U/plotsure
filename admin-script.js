// Import Firebase services
import { authService, dbService, storageService } from './firebase-config.js';

// Admin Dashboard JavaScript
let currentAdmin = null;
let listings = [];
let inquiries = [];
let users = [];
let currentFilteredListings = [];
let currentFilteredInquiries = [];

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminDashboard();
});

function initializeAdminDashboard() {
    // Hide loader after a short delay
    setTimeout(() => {
        document.getElementById('loader').classList.add('hidden');
    }, 1000);

    // Check admin authentication
    checkAdminAuth();
    
    // Set up event listeners
    setupAdminEventListeners();
    
    // Set up auth state listener
    try {
        authService.onAuthStateChanged(user => {
            if (!user) {
                showAdminLoginScreen();
            } else {
                // Check if user is admin
                checkAdminRole(user.uid);
            }
        });
    } catch (error) {
        console.error('Error setting up auth state listener:', error);
        showAdminLoginScreen();
    }
}

function showAdminLoginScreen() {
    console.log('🔧 Showing admin login screen...');
    document.getElementById('adminLoginScreen').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
}

function showAdminDashboard() {
    console.log('✅ Showing admin dashboard...');
    document.getElementById('adminLoginScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
}

async function checkAdminAuth() {
    try {
        console.log('🔧 Checking admin authentication...');
        const user = authService.getCurrentUser();
        console.log('Current user:', user);
        
        if (!user) {
            console.log('❌ No user found, showing admin login screen');
            showAdminLoginScreen();
            return;
        }
        
        console.log('✅ User found, checking admin role...');
        await checkAdminRole(user.uid);
    } catch (error) {
        console.error('❌ Auth check error:', error);
        showAdminLoginScreen();
    }
}

async function handleAdminLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('adminLoginEmail').value;
    const password = document.getElementById('adminLoginPassword').value;
    
    try {
        console.log('🔧 Attempting admin login...');
        console.log('📧 Email:', email);
        console.log('🎯 These credentials are for ADMIN DASHBOARD ACCESS ONLY');
        
        const user = await authService.signIn(email, password);
        
        if (user) {
            console.log('✅ Admin login successful, checking role...');
            const userData = await dbService.users.get(user.uid);
            
            if (userData && userData.role === 'admin') {
                console.log('✅ Admin user confirmed');
                currentAdmin = { id: user.uid, ...userData };
                updateAdminUI();
                showAdminDashboard();
                await loadAdminData();
                loadDashboardStats();
                showSuccessMessage('Admin login successful!');
            } else {
                console.log('❌ User is not admin');
                showErrorMessage('Access denied. Admin privileges required.');
                await authService.signOut();
            }
        }
    } catch (error) {
        console.error('❌ Admin login failed:', error);
        showErrorMessage('Admin login failed: ' + error.message);
    }
}

async function checkAdminRole(userId) {
    try {
        console.log('🔧 Checking admin role for user:', userId);
        const userData = await dbService.users.get(userId);
        console.log('📧 User data from Firestore:', userData);
        
        if (!userData) {
            console.log('❌ No user data found, access denied');
            alert('Access denied. User data not found.');
            showAdminLoginScreen();
            return;
        }
        
        if (userData.role !== 'admin') {
            console.log('❌ User is not admin, access denied');
            console.log('📧 User email:', userData.email);
            console.log('🎯 User role:', userData.role);
            console.log('⚠️  Only admin users can access the admin dashboard');
            alert('Access denied. Admin privileges required.');
            await authService.signOut();
            showAdminLoginScreen();
            return;
        }
        
        console.log('✅ User is admin, setting up admin dashboard...');
        console.log('📧 Admin email:', userData.email);
        console.log('🎯 Admin role:', userData.role);
        currentAdmin = { id: userId, ...userData };
        updateAdminUI();
        
        // Show admin dashboard
        showAdminDashboard();
        
        // Load data after authentication
        await loadAdminData();
        loadDashboardStats();
    } catch (error) {
        console.error('❌ Error checking admin role:', error);
        showAdminLoginScreen();
    }
}

async function loadAdminData() {
    try {
        // Load listings from Firebase
        listings = await dbService.listings.getAll();
        
        // Load inquiries from Firebase
        inquiries = await dbService.inquiries.getAll();
        
        // Load users from Firebase
        users = await dbService.users.getAll();
        
        console.log('Admin data loaded:', { listings: listings.length, inquiries: inquiries.length, users: users.length });
    } catch (error) {
        console.error('Error loading admin data:', error);
        // Initialize empty arrays if there's an error
        listings = [];
        inquiries = [];
        users = [];
    }
}

function setupAdminEventListeners() {
    // Admin login form
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    }
    
    // Admin nav tabs
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            if (tabName) {
                showAdminTab(tabName, this);
            }
        });
    });
    
    // Add listing from listings tab button
    const addListingFromListingsBtn = document.getElementById('addListingFromListingsBtn');
    if (addListingFromListingsBtn) {
        addListingFromListingsBtn.addEventListener('click', function() {
            showAdminTab('add-listing');
        });
    }
    
    // Back to listings button
    const backToListingsBtn = document.getElementById('backToListingsBtn');
    if (backToListingsBtn) {
        backToListingsBtn.addEventListener('click', function() {
            showAdminTab('listings');
        });
    }
    

    
    // Add listing form
    document.getElementById('addListingForm').addEventListener('submit', handleAddListing);
    
    // Profile form
    document.getElementById('profileForm').addEventListener('submit', handleUpdateProfile);
    
    // Add user form
    document.getElementById('addUserForm').addEventListener('submit', handleAddUser);
    
    // Admin logout button
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', logout);
    }
    
    // Close modal buttons
    const closeAddUserModal = document.getElementById('closeAddUserModal');
    if (closeAddUserModal) {
        closeAddUserModal.addEventListener('click', () => closeModal('addUserModal'));
    }
    
    // Image preview functionality
    const imageInput = document.getElementById('listingImage');
    if (imageInput) {
        imageInput.addEventListener('change', handleImagePreview);
    }
    
    // Document validation
    const documentInput = document.getElementById('listingDocument');
    if (documentInput) {
        documentInput.addEventListener('change', handleDocumentValidation);
    }
    
    // Admin listing action buttons (delegated event listener)
    document.addEventListener('click', function(e) {
        if (e.target.matches('[data-action]')) {
            const action = e.target.getAttribute('data-action');
            const listingId = e.target.getAttribute('data-listing-id');
            const inquiryId = e.target.getAttribute('data-inquiry-id');
            const status = e.target.getAttribute('data-status');
            const userId = e.target.getAttribute('data-user-id');
            
            console.log('🔧 Admin action:', action, 'for listing:', listingId, 'inquiry:', inquiryId, 'status:', status, 'user:', userId);
            
            switch(action) {
                case 'edit':
                    editListing(listingId);
                    break;
                case 'view':
                    viewListingDetails(listingId);
                    break;
                case 'delete':
                    deleteListing(listingId);
                    break;
                case 'update-inquiry':
                    updateInquiryStatus(inquiryId, status);
                    break;
                case 'edit-user':
                    editUser(userId);
                    break;
                case 'toggle-user':
                    toggleUserStatus(userId);
                    break;
                case 'delete-user':
                    deleteUser(userId);
                    break;
                default:
                    console.log('❌ Unknown action:', action);
            }
        }
    });
}

function updateAdminUI() {
    if (currentAdmin) {
        document.getElementById('adminUserName').textContent = currentAdmin.name || 'Admin User';
        document.getElementById('dashboardUserName').textContent = currentAdmin.name || 'Admin';
    }
}

function loadDashboardStats() {
    // Update stats
    document.getElementById('totalListings').textContent = listings.length;
    document.getElementById('totalInquiries').textContent = inquiries.length;
    document.getElementById('totalUsers').textContent = users.length;
    
    // Calculate total views
    const totalViews = listings.reduce((sum, listing) => sum + (listing.views || 0), 0);
    
    // Load recent listings
    loadRecentListings();
    
    // Load recent inquiries
    loadRecentInquiries();
}

function loadRecentListings() {
    const recentListingsList = document.getElementById('recentListingsList');
    if (!recentListingsList) return;
    
    const recentListings = listings
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
    
    recentListingsList.innerHTML = '';
    
    if (recentListings.length === 0) {
        recentListingsList.innerHTML = '<p>No listings yet.</p>';
        return;
    }
    
    recentListings.forEach(listing => {
        const item = document.createElement('div');
        item.className = 'recent-item';
        item.innerHTML = `
            <h4>${listing.title}</h4>
            <p>${listing.location}</p>
            <p><strong>${formatPrice(listing.price)} RWF</strong></p>
            <small>Added: ${new Date(listing.created_at).toLocaleDateString()}</small>
        `;
        recentListingsList.appendChild(item);
    });
}

function loadRecentInquiries() {
    const recentInquiriesList = document.getElementById('recentInquiriesList');
    if (!recentInquiriesList) return;
    
    const recentInquiries = inquiries
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
    
    recentInquiriesList.innerHTML = '';
    
    if (recentInquiries.length === 0) {
        recentInquiriesList.innerHTML = '<p>No inquiries yet.</p>';
        return;
    }
    
    recentInquiries.forEach(inquiry => {
        const item = document.createElement('div');
        item.className = 'recent-item';
        item.innerHTML = `
            <h4>${inquiry.user_name || 'Unknown User'}</h4>
            <p>${inquiry.user_email || inquiry.email}</p>
            <p>${inquiry.message.substring(0, 50)}...</p>
            <small>Received: ${new Date(inquiry.created_at).toLocaleDateString()}</small>
        `;
        recentInquiriesList.appendChild(item);
    });
}

// Admin Tab Functions
function showAdminTab(tabName, clickedElement = null) {
    try {
        console.log('🔧 Switching to admin tab:', tabName);
        
        // Hide all tab contents
        document.querySelectorAll('.admin-tab-content').forEach(tab => {
            tab.style.display = 'none';
        });
        
        // Remove active class from all nav tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab content
        let tabId;
        if (tabName === 'add-listing') {
            tabId = 'addListingTab';
        } else {
            tabId = `${tabName}Tab`;
        }
        
        const tabElement = document.getElementById(tabId);
        if (tabElement) {
            tabElement.style.display = 'block';
            console.log('✅ Tab content shown:', tabId);
        } else {
            console.error(`❌ Tab element with ID '${tabId}' not found`);
            return;
        }
        
        // Add active class to clicked button
        if (clickedElement) {
            clickedElement.classList.add('active');
            console.log('✅ Active class added to clicked element');
        } else {
            // Fallback: find button by data-tab attribute
            const button = document.querySelector(`[data-tab="${tabName}"]`);
            if (button) {
                button.classList.add('active');
                console.log('✅ Active class added to button via fallback');
            } else {
                console.error(`❌ Could not find button for tab: ${tabName}`);
            }
        }
        
        // Load tab-specific content
        switch(tabName) {
            case 'listings':
                loadAdminListings();
                break;
            case 'inquiries':
                loadAdminInquiries();
                break;
            case 'users':
                loadAdminUsers();
                break;
            case 'dashboard':
                loadDashboardStats();
                break;
        }
        
        console.log('✅ Admin tab switch completed successfully');
    } catch (error) {
        console.error('❌ Error in showAdminTab:', error);
    }
}

// Listings Management
function loadAdminListings() {
    currentFilteredListings = [...listings];
    displayAdminListings();
}

function displayAdminListings() {
    const grid = document.getElementById('adminListingsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (currentFilteredListings.length === 0) {
        grid.innerHTML = `
            <div class="no-listings-message">
                <div class="no-listings-icon">🏠</div>
                <h3>No Land Plots Listed</h3>
                <p>You haven't added any land plots yet.</p>
                <p>Click the "➕ Add New Listing" tab to add your first land plot.</p>
                <div class="admin-actions">
                    <button class="btn btn-primary" id="addFirstListingBtn" onclick="showAdminTab('add-listing')">
                        ➕ Add Your First Listing
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    currentFilteredListings.forEach(listing => {
        const card = createAdminListingCard(listing);
        grid.appendChild(card);
    });
}

function createAdminListingCard(listing) {
    const card = document.createElement('div');
    card.className = 'admin-listing-card';
    
    const imageUrl = listing.image_url || listing.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2NDc0OEEiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlIE5vdCBGb3VuZDwvdGV4dD4KPHN2Zz4K';
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${listing.title}" class="admin-listing-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2NDc0OEEiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlIE5vdCBGb3VuZDwvdGV4dD4KPHN2Zz4K'">
        <div class="admin-listing-content">
            <h3 class="admin-listing-title">${listing.title}</h3>
            <div class="admin-listing-location">
                📍 ${listing.location}
            </div>
            <div class="admin-listing-price">${formatPrice(listing.price)} RWF</div>
            <div class="admin-listing-details">
                <span>${listing.size || listing.plot_size} ${listing.size_unit || listing.plot_size_unit || 'sqm'}</span>
                <span>•</span>
                <span>${listing.land_type}</span>
                <span>•</span>
                <span>${listing.status}</span>
            </div>
            <div class="admin-listing-actions">
                <button class="btn btn-primary btn-small" data-action="edit" data-listing-id="${listing.id}">Edit</button>
                <button class="btn btn-secondary btn-small" data-action="view" data-listing-id="${listing.id}">View</button>
                <button class="btn btn-danger btn-small" data-action="delete" data-listing-id="${listing.id}">Delete</button>
            </div>
        </div>
    `;
    
    return card;
}

function filterAdminListings() {
    const searchTerm = document.getElementById('listingsSearch').value.toLowerCase();
    const statusFilter = document.getElementById('listingsStatusFilter').value;
    const typeFilter = document.getElementById('listingsTypeFilter').value;
    
    currentFilteredListings = listings.filter(listing => {
        const matchesSearch = listing.title.toLowerCase().includes(searchTerm) ||
                            listing.location.toLowerCase().includes(searchTerm) ||
                            (listing.description && listing.description.toLowerCase().includes(searchTerm));
        
        const matchesStatus = !statusFilter || listing.status === statusFilter;
        const matchesType = !typeFilter || listing.land_type === typeFilter;
        
        return matchesSearch && matchesStatus && matchesType;
    });
    
    displayAdminListings();
}

// Add Listing
async function handleAddListing(e) {
    e.preventDefault();
    
    console.log('🔧 Add listing form submitted');
    
    const form = e.target;
    const isEditMode = form.dataset.editMode === 'true';
    const editId = form.dataset.editId;
    
    const imagePreview = document.getElementById('imagePreview'); const imageFile = document.getElementById('listingImage').files[0];
    const documentFile = document.getElementById('listingDocument').files[0];
    
    console.log('📷 Image file:', imageFile ? imageFile.name : 'None');
    console.log('📄 Document file:', documentFile ? documentFile.name : 'None');
    
    // In edit mode, files are optional (keep existing if not uploaded)
    if (!isEditMode) {
        if (!imageFile) {
            showErrorMessage('Please select an image for the listing');
            return;
        }
        
        if (!documentFile) {
            showErrorMessage('Please upload the land lease document');
            return;
        }
    }
    
    // Validate required fields
    const title = document.getElementById('listingTitle').value.trim();
    const location = document.getElementById('listingLocation').value.trim();
    const price = document.getElementById('listingPrice').value;
    const plotSize = document.getElementById('listingSize').value;
    const description = document.getElementById('listingDescription').value.trim();
    const landType = document.getElementById('listingType').value;
    const landownerName = document.getElementById('landownerName').value.trim();
    const landownerPhone = document.getElementById('landownerPhone').value.trim();
    
    if (!title || !location || !price || !plotSize || !description || !landType || !landownerName || !landownerPhone) {
        showErrorMessage('Please fill in all required fields');
        return;
    }
    
    // Validate price and plot size
    if (parseInt(price) <= 0) {
        showErrorMessage('Please enter a valid price');
        return;
    }
    
    if (parseInt(plotSize) <= 0) {
        showErrorMessage('Please enter a valid plot size');
        return;
    }
    
    if (isEditMode) {
        // Handle edit mode
        handleEditListing(editId, imageFile, documentFile);
    } else {
        // Handle add mode
        if (!imageFile || !documentFile) {
            showErrorMessage('Please select both image and document files');
            return;
        }
    
    // Convert image to base64
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageData = e.target.result;
        
            // Convert document to base64 if it's a PDF
            if (documentFile.type === 'application/pdf') {
                const docReader = new FileReader();
                docReader.onload = function(docEvent) {
                    const documentData = docEvent.target.result;
                    createNewListing(imageData, documentData, documentFile.name);
                };
                docReader.readAsDataURL(documentFile);
            } else {
                // For non-PDF files, just store the filename
                createNewListing(imageData, null, documentFile.name);
            }
        };
        
        reader.readAsDataURL(imageFile);
    }
}

function createNewListing(imageData, documentData, documentFileName) {
    // Create a new listing object
    const newListing = {
        id: Date.now(), // unique ID using timestamp
        title: document.getElementById('listingTitle').value.trim(),
        description: document.getElementById('listingDescription').value.trim(),
        location: document.getElementById('listingLocation').value.trim(),
        price: parseInt(document.getElementById('listingPrice').value),
        plot_size: parseInt(document.getElementById('listingSize').value),
        plot_size_unit: "sqm",
        land_type: document.getElementById('listingType').value,
        landowner_name: document.getElementById('landownerName').value.trim(),
        landowner_phone: document.getElementById('landownerPhone').value.trim(),
        plot_number: document.getElementById('plotNumber').value.trim(),
        sector: document.getElementById('sector').value.trim(),
        cell: document.getElementById('cell').value.trim(),
        amenities: document.getElementById('amenities').value.trim(),
        infrastructure: document.getElementById('infrastructure').value.trim(),
        price_negotiable: document.getElementById('priceNegotiable').checked,
        land_title_available: document.getElementById('landTitleAvailable').checked,
        image: imageData, // base64 or file path
        document: documentFileName,
        document_data: documentData, // base64 PDF
        status: "available",
        verified: true,
        views: 0,
        created_at: new Date().toISOString(),
        user_id: currentAdmin.id
    };

    // Save to localStorage
    listings.push(newListing);
    localStorage.setItem('plotsure_listings', JSON.stringify(listings));

    // Reset form and hide edit mode if any
    resetFormAndExitEditMode();

    // Notify user
    showSuccessMessage('✅ Listing added successfully! The new plot will appear on the dashboard.');

    // Refresh stats
    loadDashboardStats();

    // Go to listings tab to show new listing
    showAdminTab('listings');
}

function handleEditListing(editId, imageFile, documentFile) {
    const existingListing = listings.find(l => l.id === editId);
    if (!existingListing) {
        showErrorMessage('Listing not found');
        return;
    }
    
    // Prepare updated listing data
    const updatedListing = {
        ...existingListing,
        title: document.getElementById('listingTitle').value.trim(),
        description: document.getElementById('listingDescription').value.trim(),
        location: document.getElementById('listingLocation').value.trim(),
        price: parseInt(document.getElementById('listingPrice').value),
        plot_size: parseInt(document.getElementById('listingSize').value),
        land_type: document.getElementById('listingType').value,
        landowner_name: document.getElementById('landownerName').value.trim(),
        landowner_phone: document.getElementById('landownerPhone').value.trim(),
        plot_number: document.getElementById('plotNumber').value.trim(),
        sector: document.getElementById('sector').value.trim(),
        cell: document.getElementById('cell').value.trim(),
        amenities: document.getElementById('amenities').value.trim(),
        infrastructure: document.getElementById('infrastructure').value.trim(),
        price_negotiable: document.getElementById('priceNegotiable').checked,
        land_title_available: document.getElementById('landTitleAvailable').checked,
        updated_at: new Date().toISOString()
    };
    
    // Handle image update
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            updatedListing.image = e.target.result;
            
            // Handle document update
            if (documentFile) {
                if (documentFile.type === 'application/pdf') {
                    const docReader = new FileReader();
                    docReader.onload = function(docEvent) {
                        updatedListing.document = documentFile.name;
                        updatedListing.document_data = docEvent.target.result;
                        saveUpdatedListing(updatedListing);
                    };
                    docReader.readAsDataURL(documentFile);
                } else {
                    console.log('📷 No new image uploaded, keeping existing');
                }
                if (documentFile) {
                    console.log('📄 Uploading new document...');
                    updateData.document_url = await storageService.uploadDocument(documentFile, editId);
                    console.log('✅ New document uploaded:', updateData.document_url);
                } else {
                    console.log('📄 No new document uploaded, keeping existing');
                }
          try {
               // ...     
            } catch (error) {
                console.error('❌ Error uploading files:', error);
                showErrorMessage('Warning: File upload failed.');
            }
        } else {
            console.log('⚠️ Storage is not enabled, skipping file uploads');
            showErrorMessage('Warning: Storage is not enabled. File uploads skipped.');
        }
        
        // Update listing in Firebase
        console.log('🔥 Updating listing in Firebase...');
        await dbService.listings.update(editId, updateData);
        console.log('✅ Listing updated in Firebase successfully');
        
        // Reset form and exit edit mode
        console.log('🔄 Resetting form and exiting edit mode...');
        resetFormAndExitEditMode();
        
        // Show success message
        console.log('✅ Showing success message...');
        showSuccessMessage('Listing updated successfully!');
        
    try {    
        // Reload data and dashboard stats
        console.log('📊 Reloading admin data...');
        await loadAdminData();
        loadDashboardStats();
        
        // Switch to listings tab to show the updated listing
        console.log('🔄 Switching to listings tab...');
        showAdminTab('listings');
        
        console.log('🎉 Listing update completed successfully!');
        
    } catch (error) {
        console.error('❌ Error updating listing:', error);
        showErrorMessage('Error updating listing: ' + error.message);
    }
}
}
function resetFormAndExitEditMode() {
    const form = document.getElementById('addListingForm');
    form.reset();
    
    // Clear edit mode
    delete form.dataset.editMode;
    delete form.dataset.editId;
    
    // Reset submit button text
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.textContent = 'Add Listing';
    }
    
    // Reset form header
    const header = document.querySelector('#addListingTab .tab-header h2');
    if (header) {
        header.textContent = 'Add New Land Listing';
    }
    
    // Clear previews
    const imagePreview = document.getElementById('imagePreview');
    if (imagePreview) {
        imagePreview.style.display = 'none';
    }
    
    const documentInfo = document.getElementById('documentInfo');
    if (documentInfo) {
        documentInfo.style.display = 'none';
    }
}

function resetForm() {
    resetFormAndExitEditMode();
}

function handleImagePreview(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Create or update image preview
            let imagePreview = document.getElementById('imagePreview');
            if (!imagePreview) {
                imagePreview = document.createElement('div');
                imagePreview.id = 'imagePreview';
                imagePreview.style.cssText = `
                    margin-top: 10px;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    background: #f9f9f9;
                `;
                const imageInput = document.getElementById('listingImage');
                imageInput.parentNode.appendChild(imagePreview);
            }
            
            imagePreview.innerHTML = `
                <h4>Image Preview:</h4>
                <img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 150px; border-radius: 4px;">
                <p><small>File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)</small></p>
            `;
            imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function handleDocumentValidation(e) {
    const file = e.target.files[0];
    if (file) {
        const maxSize = 10 * 1024 * 1024; // 10MB limit
        if (file.size > maxSize) {
            showErrorMessage('Document file is too large. Please select a file smaller than 10MB.');
            e.target.value = '';
            return;
        }
        
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
            showErrorMessage('Please select a valid document file (PDF, DOC, or DOCX).');
            e.target.value = '';
            return;
        }
        
        // Show document info
        let docInfo = document.getElementById('documentInfo');
        if (!docInfo) {
            docInfo = document.createElement('div');
            docInfo.id = 'documentInfo';
            docInfo.style.cssText = `
                margin-top: 10px;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 8px;
                background: #f9f9f9;
            `;
            const docInput = document.getElementById('listingDocument');
            docInput.parentNode.appendChild(docInfo);
        }
        
        docInfo.innerHTML = `
            <h4>Document Info:</h4>
            <p><strong>File:</strong> ${file.name}</p>
            <p><strong>Size:</strong> ${(file.size / 1024).toFixed(1)} KB</p>
            <p><strong>Type:</strong> ${file.type}</p>
        `;
        docInfo.style.display = 'block';
    }
}

function editListing(listingId) {
    console.log('🔧 Edit listing called for ID:', listingId);
    
    const listing = listings.find(l => l.id === listingId);
    if (!listing) {
        console.log('❌ Listing not found for ID:', listingId);
        showErrorMessage('Listing not found');
        return;
    }
    
    console.log('✅ Found listing:', listing.title);
    
    // Switch to add listing tab and populate form with existing data
    showAdminTab('add-listing');
    
    // Populate form fields with existing listing data
    document.getElementById('listingTitle').value = listing.title;
    document.getElementById('listingLocation').value = listing.location;
    document.getElementById('listingSize').value = listing.size || listing.plot_size;
    document.getElementById('listingPrice').value = listing.price;
    document.getElementById('listingDescription').value = listing.description;
    document.getElementById('listingType').value = listing.land_type;
    document.getElementById('landownerName').value = listing.owner_name;
    document.getElementById('landownerPhone').value = listing.owner_phone;
    document.getElementById('plotNumber').value = listing.plot_number || '';
    document.getElementById('sector').value = listing.sector || '';
    document.getElementById('cell').value = listing.cell || '';
    document.getElementById('amenities').value = listing.amenities || '';
    document.getElementById('infrastructure').value = listing.infrastructure || '';
    document.getElementById('priceNegotiable').checked = listing.price_negotiable || false;
    document.getElementById('landTitleAvailable').checked = listing.land_title_available || false;
    
    // Show existing image if available
    if (listing.image_url || listing.image) {
        let imagePreview = document.getElementById('imagePreview');
        if (!imagePreview) {
            imagePreview = document.createElement('div');
            imagePreview.id = 'imagePreview';
            imagePreview.style.cssText = `
                margin-top: 10px;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 8px;
                background: #f9f9f9;
            `;
            const imageInput = document.getElementById('listingImage');
            imageInput.parentNode.appendChild(imagePreview);
        }
        
        imagePreview.innerHTML = `
            <h4>Current Image:</h4>
            <img src="${listing.image_url || listing.image}" alt="Current" style="max-width: 200px; max-height: 150px; border-radius: 4px;">
            <p><small>Upload a new image to replace the current one</small></p>
        `;
        imagePreview.style.display = 'block';
    }
    
    // Show existing document info if available
    if (listing.document_url || listing.document) {
        let docInfo = document.getElementById('documentInfo');
        if (!docInfo) {
            docInfo = document.createElement('div');
            docInfo.id = 'documentInfo';
            docInfo.style.cssText = `
                margin-top: 10px;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 8px;
                background: #f9f9f9;
            `;
            const docInput = document.getElementById('listingDocument');
            docInput.parentNode.appendChild(docInfo);
        }
        
        docInfo.innerHTML = `
            <h4>Current Document:</h4>
            <p><strong>File:</strong> ${listing.document || 'Document uploaded'}</p>
            <p><small>Upload a new document to replace the current one</small></p>
        `;
        docInfo.style.display = 'block';
    }
    
    // Update form submission to handle edit mode
    const form = document.getElementById('addListingForm');
    form.dataset.editMode = 'true';
    form.dataset.editId = listingId;
    
    // Update submit button text
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.textContent = 'Update Listing';
    }
    
    // Update form header
    const header = document.querySelector('#addListingTab .tab-header h2');
    if (header) {
        header.textContent = 'Edit Land Listing';
    }
    
    showSuccessMessage(`Editing listing: ${listing.title}`);
}

function viewListingDetails(listingId) {
    const listing = listings.find(l => l.id === listingId);
    if (!listing) {
        showErrorMessage('Listing not found');
        return;
    }
    
    // Create modal for viewing details
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'viewListingModal';
    
    const imageUrl = listing.image_url || listing.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2NDc0OEEiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlIE5vdCBGb3VuZDwvdGV4dD4KPHN2Zz4K';
    
    modal.innerHTML = `
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h3>${listing.title}</h3>
                <button class="modal-close" onclick="closeModal('viewListingModal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="listing-detail-content">
                    <img src="${imageUrl}" alt="${listing.title}" style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2NDc0OEEiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlIE5vdCBGb3VuZDwvdGV4dD4KPHN2Zz4K'">
                    
                    <div class="listing-info-grid">
                        <div class="info-item">
                            <strong>Location:</strong> ${listing.location}
                        </div>
                        <div class="info-item">
                            <strong>Price:</strong> ${formatPrice(listing.price)} RWF
                        </div>
                        <div class="info-item">
                            <strong>Size:</strong> ${listing.size || listing.plot_size} ${listing.size_unit || listing.plot_size_unit || 'sqm'}
                        </div>
                        <div class="info-item">
                            <strong>Type:</strong> ${listing.land_type}
                        </div>
                        <div class="info-item">
                            <strong>Landowner:</strong> ${listing.owner_name}
                        </div>
                        <div class="info-item">
                            <strong>Contact:</strong> ${listing.owner_phone}
                        </div>
                        ${listing.plot_number ? `<div class="info-item"><strong>Plot Number:</strong> ${listing.plot_number}</div>` : ''}
                        ${listing.sector ? `<div class="info-item"><strong>Sector:</strong> ${listing.sector}</div>` : ''}
                        ${listing.cell ? `<div class="info-item"><strong>Cell:</strong> ${listing.cell}</div>` : ''}
                        <div class="info-item">
                            <strong>Status:</strong> ${listing.status}
                        </div>
                        <div class="info-item">
                            <strong>Views:</strong> ${listing.views || 0}
                        </div>
                        <div class="info-item">
                            <strong>Created:</strong> ${new Date(listing.created_at).toLocaleDateString()}
                        </div>
                    </div>
                    
                    <div class="listing-description-full">
                        <h4>Description</h4>
                        <p>${listing.description}</p>
                    </div>
                    
                    ${listing.amenities ? `
                    <div class="listing-amenities">
                        <h4>Amenities</h4>
                        <p>${listing.amenities}</p>
                    </div>
                    ` : ''}
                    
                    ${listing.infrastructure ? `
                    <div class="listing-infrastructure">
                        <h4>Infrastructure</h4>
                        <p>${listing.infrastructure}</p>
                    </div>
                    ` : ''}
                    
                    <div class="listing-documents">
                        <h4>Documents</h4>
                        <p><strong>Land Title:</strong> ${listing.document}</p>
                    </div>
                    
                    <div class="listing-actions-full">
                        <button class="btn btn-primary" onclick="editListing('${listing.id}'); closeModal('viewListingModal');">
                            Edit Listing
                        </button>
                        <button class="btn btn-secondary" onclick="closeModal('viewListingModal')">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

async function deleteListing(listingId) {
    console.log('🔧 Delete listing called for ID:', listingId);
    
    const listing = listings.find(l => l.id === listingId);
    if (!listing) {
        console.log('❌ Listing not found for ID:', listingId);
        showErrorMessage('Listing not found');
        return;
    }
    
    console.log('✅ Found listing to delete:', listing.title);
    
    if (confirm(`Are you sure you want to delete "${listing.title}"?`)) {
        try {
            console.log('🔥 Deleting listing from Firebase...');
            await dbService.listings.delete(listingId);
            console.log('✅ Listing deleted from Firebase');
            
            // Reload data and dashboard stats
            console.log('📊 Reloading admin data...');
            await loadAdminData();
            loadDashboardStats();
            
            // Reload listings
            console.log('🔄 Reloading listings...');
            loadAdminListings();
            
            showSuccessMessage('Listing deleted successfully!');
            console.log('🎉 Delete operation completed successfully');
        } catch (error) {
            console.error('❌ Error deleting listing:', error);
            showErrorMessage('Error deleting listing: ' + error.message);
        }
    } else {
        console.log('❌ Delete operation cancelled by user');
    }
}

// Inquiries Management
function loadAdminInquiries() {
    currentFilteredInquiries = [...inquiries];
    displayAdminInquiries();
}

function displayAdminInquiries() {
    const inquiriesList = document.getElementById('inquiriesList');
    if (!inquiriesList) return;
    
    inquiriesList.innerHTML = '';
    
    if (currentFilteredInquiries.length === 0) {
        inquiriesList.innerHTML = '<p>No inquiries found.</p>';
         return;
       }
    
    currentFilteredInquiries.forEach(inquiry => {
        const item = createInquiryItem(inquiry);
        inquiriesList.appendChild(item);
    });
}

function createInquiryItem(inquiry) {
    const item = document.createElement('div');
    item.className = 'inquiry-item';
    
    const status = inquiry.status || 'new';
    const createdDate = new Date(inquiry.created_at).toLocaleDateString();
    const listingTitle = getListingTitle(inquiry.listing_id);
    
    item.innerHTML = `
        <div class="inquiry-header">
            <div class="inquiry-info">
                <h4>${inquiry.user_name || inquiry.name || 'Unknown User'}</h4>
                <p>📧 ${inquiry.user_email || inquiry.email} • 📞 ${inquiry.user_phone || inquiry.phone || 'No phone'}</p>
                <p><strong>Type:</strong> ${listingTitle}</p>
                <p><strong>Received:</strong> ${createdDate}</p>
            </div>
            <span class="inquiry-status ${status}">${status}</span>
        </div>
        <div class="inquiry-message">
            <p>${inquiry.message}</p>
        </div>
        <div class="inquiry-actions">
            <button class="btn btn-primary btn-small" data-action="update-inquiry" data-inquiry-id="${inquiry.id}" data-status="contacted">Mark Contacted</button>
            <button class="btn btn-secondary btn-small" data-action="update-inquiry" data-inquiry-id="${inquiry.id}" data-status="responded">Mark Responded</button>
            <button class="btn btn-danger btn-small" data-action="update-inquiry" data-inquiry-id="${inquiry.id}" data-status="closed">Close</button>
        </div>
    `;
    
    return item;
}

function getListingTitle(listingId) {
    if (!listingId) {
        return 'General Contact Form';
    }
    const listing = listings.find(l => l.id === listingId);
    return listing ? listing.title : 'Unknown Listing';
}

function filterInquiries() {
    const searchTerm = document.getElementById('inquiriesSearch').value.toLowerCase();
    const statusFilter = document.getElementById('inquiriesStatusFilter').value;
    
    currentFilteredInquiries = inquiries.filter(inquiry => {
        const matchesSearch = (inquiry.user_name || inquiry.name || '').toLowerCase().includes(searchTerm) ||
                            (inquiry.user_email || inquiry.email || '').toLowerCase().includes(searchTerm) ||
                            inquiry.message.toLowerCase().includes(searchTerm);
        
        const matchesStatus = !statusFilter || inquiry.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
    
    displayAdminInquiries();
}

async function updateInquiryStatus(inquiryId, status) {
    console.log('🔧 Update inquiry status called for ID:', inquiryId, 'status:', status);
    
    try {
        console.log('🔥 Updating inquiry in Firebase...');
        await dbService.inquiries.update(inquiryId, { status });
        console.log('✅ Inquiry updated in Firebase');
        
        // Reload data and inquiries
        console.log('📊 Reloading admin data...');
        await loadAdminData();
        console.log('🔄 Reloading inquiries...');
        loadAdminInquiries();
        
        showSuccessMessage(`Inquiry status updated to: ${status}`);
        console.log('🎉 Inquiry status update completed successfully');
    } catch (error) {
        console.error('❌ Error updating inquiry status:', error);
        showErrorMessage('Error updating inquiry status: ' + error.message);
    }
}

// Users Management
function loadAdminUsers() {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;
    
    usersList.innerHTML = '';
    
    if (users.length === 0) {
        usersList.innerHTML = '<p>No users found.</p>';
         return;
       }
    
    users.forEach(user => {
        const card = createUserCard(user);
        usersList.appendChild(card);
    });
}

function createUserCard(user) {
    const card = document.createElement('div');
    card.className = 'user-card';
    
    const initials = (user.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase();
    
    card.innerHTML = `
        <div class="user-header">
            <div class="user-avatar">${initials}</div>
            <div class="user-info">
                <h4>${user.name || 'Unknown User'}</h4>
                <p>${user.email}</p>
                <p>${user.phone || 'No phone'}</p>
                <span class="user-role ${user.role}">${user.role}</span>
            </div>
        </div>
        <div class="user-actions">
            <button class="btn btn-primary btn-small" data-action="edit-user" data-user-id="${user.id}">Edit</button>
            <button class="btn btn-secondary btn-small" data-action="toggle-user" data-user-id="${user.id}">
                ${user.is_active ? 'Deactivate' : 'Activate'}
            </button>
            ${user.id !== currentAdmin.id ? `<button class="btn btn-danger btn-small" data-action="delete-user" data-user-id="${user.id}">Delete</button>` : ''}
        </div>
    `;
    
    return card;
}

function editUser(userId) {
    showSuccessMessage('Edit user functionality coming soon!');
}

async function toggleUserStatus(userId) {
    try {
        const user = users.find(u => u.id === userId);
     if (user) {
            const newStatus = !user.is_active;
            await dbService.users.update(userId, { is_active: newStatus });
            
            // Reload data and users
            await loadAdminData();
            loadAdminUsers();
            
            showSuccessMessage(`User ${newStatus ? 'activated' : 'deactivated'} successfully!`);
        }
    } catch (error) {
        console.error('Error toggling user status:', error);
        showErrorMessage('Error updating user status: ' + error.message);
    }
}

async function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        try {
            await dbService.users.delete(userId);
            
            // Reload data and dashboard stats
            await loadAdminData();
            loadDashboardStats();
            loadAdminUsers();
            
            showSuccessMessage('User deleted successfully!');
        } catch (error) {
            console.error('Error deleting user:', error);
            showErrorMessage('Error deleting user: ' + error.message);
        }
    }
}

// Add User Modal
function showAddUserModal() {
    document.getElementById('addUserModal').classList.add('show');
}

async function handleAddUser(e) {
    e.preventDefault();
    
    try {
        const userData = {
            name: document.getElementById('newUserName').value,
            email: document.getElementById('newUserEmail').value,
            phone: document.getElementById('newUserPhone').value,
            role: document.getElementById('newUserRole').value,
            is_active: true,
            verified: false
        };
        
        // Check if email already exists
        const existingUser = users.find(u => u.email === userData.email);
        if (existingUser) {
            showErrorMessage('Email already registered');
            return;
        }
        
        // Create user in Firebase
        const userRef = await dbService.users.create(userData);
        
        // Reset form and close modal
        e.target.reset();
        closeModal('addUserModal');
        
        // Reload data and dashboard stats
        await loadAdminData();
        loadDashboardStats();
        loadAdminUsers();
        
        showSuccessMessage('User added successfully!');
    } catch (error) {
        console.error('Error adding user:', error);
        showErrorMessage('Error adding user: ' + error.message);
    }
}

// Profile Management
async function handleUpdateProfile(e) {
    e.preventDefault();
    
    try {
        const updatedProfile = {
            name: document.getElementById('adminName').value,
            email: document.getElementById('adminEmail').value,
            phone: document.getElementById('adminPhone').value
        };
        
        const newPassword = document.getElementById('adminPassword').value;
        if (newPassword) {
            // Note: Password update would require Firebase Auth update
            showErrorMessage('Password update not implemented yet');
            return;
        }
        
        // Update admin profile in Firebase
        await dbService.users.update(currentAdmin.id, updatedProfile);
        
        // Update current admin
        currentAdmin = { ...currentAdmin, ...updatedProfile };
        
        // Update UI
        updateAdminUI();
        
        // Clear password field
        document.getElementById('adminPassword').value = '';
        
        showSuccessMessage('Profile updated successfully!');
    } catch (error) {
        console.error('Error updating profile:', error);
        showErrorMessage('Error updating profile: ' + error.message);
    }
}

// Utility Functions
function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function showSuccessMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--primary);
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

function showErrorMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// Document Viewer Function
function viewDocument(documentName, documentData) {
    try {
        // Create a new window to display the document
        const documentWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
        
        if (documentWindow) {
            // Write the document content to the new window
            documentWindow.document.write(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${documentName} - PlotSure Connect</title>
                    <style>
                        body {
                            font-family: 'Inter', sans-serif;
                            margin: 0;
                            padding: 20px;
                            background: #f8f9fa;
                        }
                        .document-header {
                            background: white;
                            padding: 20px;
                            border-radius: 8px;
                            margin-bottom: 20px;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        }
                        .document-title {
                            font-size: 24px;
                            font-weight: 600;
                            color: #1f2937;
                            margin-bottom: 10px;
                        }
                        .document-info {
                            color: #6b7280;
                            font-size: 14px;
                        }
                        .document-content {
                            background: white;
                            border-radius: 8px;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                            overflow: hidden;
                        }
                        .document-iframe {
                            width: 100%;
                            height: 70vh;
                            border: none;
                        }
                        .close-btn {
                            position: fixed;
                            top: 20px;
                            right: 20px;
                            background: #ef4444;
                            color: white;
                            border: none;
                            padding: 10px 15px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                            z-index: 1000;
                        }
                        .close-btn:hover {
                            background: #dc2626;
                        }
                    </style>
                </head>
                <body>
                    <button class="close-btn" onclick="window.close()">✕ Close</button>
                    <div class="document-header">
                        <div class="document-title">${documentName}</div>
                        <div class="document-info">PlotSure Connect - Land Title Document</div>
                    </div>
                    <div class="document-content">
                        <iframe class="document-iframe" src="${documentData}"></iframe>
                    </div>
                </body>
                </html>
            `);
            documentWindow.document.close();
        } else {
            // Fallback if popup is blocked
            showErrorMessage('Please allow popups to view documents, or click the link below to open manually.');
            
            // Create a temporary link to download/view the document
            const link = document.createElement('a');
            link.href = documentData;
            link.target = '_blank';
            link.download = documentName;
            link.textContent = 'Click here to view document';
            link.style.cssText = `
                display: block;
                margin-top: 10px;
                padding: 10px;
                background: var(--primary);
                color: white;
                text-decoration: none;
                border-radius: 6px;
                text-align: center;
            `;
            
            // Find the document viewer div and append the link
            const documentViewer = document.querySelector('.document-viewer');
            if (documentViewer) {
                documentViewer.appendChild(link);
            }
        }
    } catch (error) {
        console.error('Error opening document:', error);
        showErrorMessage('Unable to open document. Please try again.');
    }
}
}



async function logout() {
    try {
        await authService.signOut();
       window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        showErrorMessage('Logout failed: ' + error.message);
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Debug functions for testing
window.testAddListing = function() {
    console.log('🧪 Testing add listing form...');
    const form = document.getElementById('addListingForm');
    if (form) {
        console.log('✅ Form found');
        console.log('📧 Form action:', form.action);
        console.log('📧 Form method:', form.method);
        console.log('📧 Form elements:', form.elements.length);
    } else {
        console.log('❌ Form not found');
    }
};

window.testSuccessMessage = function() {
    console.log('🧪 Testing success message...');
    showSuccessMessage('Test success message!');
};

window.testErrorMessage = function() {
    console.log('🧪 Testing error message...');
    showErrorMessage('Test error message!');
};

window.testEditListing = function() {
    console.log('🧪 Testing edit listing...');
    if (listings.length > 0) {
        const firstListing = listings[0];
        console.log('📧 Testing edit for listing:', firstListing.title);
        editListing(firstListing.id);
    } else {
        console.log('❌ No listings available to test edit');
    }
};

window.testUpdateListing = function() {
    console.log('🧪 Testing update listing...');
    const form = document.getElementById('addListingForm');
    if (form && form.dataset.editMode === 'true') {
        console.log('✅ Form is in edit mode');
        console.log('🎯 Edit ID:', form.dataset.editId);
        form.dispatchEvent(new Event('submit'));
    } else {
        console.log('❌ Form is not in edit mode');
    }
};