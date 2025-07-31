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
    
    // Load data
    loadAdminData();
    
    // Set up event listeners
    setupAdminEventListeners();
    
    // Load dashboard stats
    loadDashboardStats();
}

function checkAdminAuth() {
    const storedUser = localStorage.getItem('plotsure_current_user');
    if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.role === 'admin') {
            currentAdmin = user;
            updateAdminUI();
        } else {
            // Redirect to main site if not admin
            window.location.href = 'index.html';
        }
    } else {
        // Redirect to login if not authenticated
        window.location.href = 'index.html';
    }
}

function loadAdminData() {
    // Load listings from localStorage only
    const storedListings = localStorage.getItem('plotsure_listings');
    if (storedListings) {
        listings = JSON.parse(storedListings);
    } else {
        // Start with empty listings - no hardcoded data
        listings = [];
        localStorage.setItem('plotsure_listings', JSON.stringify(listings));
    }
    
    // Load inquiries
    const storedInquiries = localStorage.getItem('plotsure_inquiries');
    if (storedInquiries) {
        inquiries = JSON.parse(storedInquiries);
    }
    
    // Load users
    const storedUsers = localStorage.getItem('plotsure_users');
    if (storedUsers) {
        users = JSON.parse(storedUsers);
    }
}

function setupAdminEventListeners() {
    // Add listing form
    document.getElementById('addListingForm').addEventListener('submit', handleAddListing);
    
    // Profile form
    document.getElementById('profileForm').addEventListener('submit', handleUpdateProfile);
    
    // Add user form
    document.getElementById('addUserForm').addEventListener('submit', handleAddUser);
    
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
}

function updateAdminUI() {
    if (currentAdmin) {
        document.getElementById('adminUserName').textContent = currentAdmin.name;
        document.getElementById('dashboardUserName').textContent = currentAdmin.name;
    }
}

function loadDashboardStats() {
    // Update stats
    document.getElementById('totalListings').textContent = listings.length;
    document.getElementById('totalInquiries').textContent = inquiries.length;
    document.getElementById('totalUsers').textContent = users.length;
    
    // Calculate total views
    const totalViews = listings.reduce((sum, listing) => sum + (listing.views || 0), 0);
    document.getElementById('totalViews').textContent = totalViews;
    
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
            <h4>${inquiry.name}</h4>
            <p>${inquiry.email}</p>
            <p>${inquiry.message.substring(0, 50)}...</p>
            <small>Received: ${new Date(inquiry.created_at).toLocaleDateString()}</small>
        `;
        recentInquiriesList.appendChild(item);
    });
}

// Admin Tab Functions
function showAdminTab(tabName) {
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
    } else {
        console.error(`Tab element with ID '${tabId}' not found`);
        return;
    }
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
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
                    <button class="btn btn-primary" onclick="showAdminTab('add-listing')">
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
    
    card.innerHTML = `
        <img src="${listing.image}" alt="${listing.title}" class="admin-listing-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2NDc0OEEiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlIE5vdCBGb3VuZDwvdGV4dD4KPHN2Zz4K'">
        <div class="admin-listing-content">
            <h3 class="admin-listing-title">${listing.title}</h3>
            <div class="admin-listing-location">
                📍 ${listing.location}
            </div>
            <div class="admin-listing-price">${formatPrice(listing.price)} RWF</div>
            <div class="admin-listing-details">
                <span>${listing.plot_size} ${listing.plot_size_unit}</span>
                <span>•</span>
                <span>${listing.land_type}</span>
                <span>•</span>
                <span>${listing.status}</span>
            </div>
            <div class="admin-listing-actions">
                <button class="btn btn-primary btn-small" onclick="editListing(${listing.id})">Edit</button>
                <button class="btn btn-secondary btn-small" onclick="viewListingDetails(${listing.id})">View</button>
                <button class="btn btn-danger btn-small" onclick="deleteListing(${listing.id})">Delete</button>
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
                            listing.description.toLowerCase().includes(searchTerm);
        
        const matchesStatus = !statusFilter || listing.status === statusFilter;
        const matchesType = !typeFilter || listing.land_type === typeFilter;
        
        return matchesSearch && matchesStatus && matchesType;
    });
    
    displayAdminListings();
}

// Add Listing
function handleAddListing(e) {
    e.preventDefault();
    
    const form = e.target;
    const isEditMode = form.dataset.editMode === 'true';
    const editId = parseInt(form.dataset.editId);
    
    const imageFile = document.getElementById('listingImage').files[0];
    const documentFile = document.getElementById('listingDocument').files[0];
    
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
        const newListing = {
        id: Date.now(), // Use timestamp for unique ID
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
            image: imageData,
        document: documentFileName,
        document_data: documentData, // Store PDF data if available
            status: "available",
            verified: true,
            views: 0,
            created_at: new Date().toISOString(),
            user_id: currentAdmin.id
        };
        
        listings.push(newListing);
        localStorage.setItem('plotsure_listings', JSON.stringify(listings));
        
    // Reset form and exit edit mode
    resetFormAndExitEditMode();
        
        // Show success message
    showSuccessMessage('Listing added successfully! The new plot will appear on the user dashboard.');
        
        // Reload dashboard stats
        loadDashboardStats();
        
    // Switch to listings tab to show the new listing
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
                    updatedListing.document = documentFile.name;
                    saveUpdatedListing(updatedListing);
                }
            } else {
                saveUpdatedListing(updatedListing);
            }
        };
    reader.readAsDataURL(imageFile);
    } else {
        // Handle document update without image change
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
                updatedListing.document = documentFile.name;
                saveUpdatedListing(updatedListing);
            }
        } else {
            saveUpdatedListing(updatedListing);
        }
    }
}

function saveUpdatedListing(updatedListing) {
    // Find and update the listing
    const index = listings.findIndex(l => l.id === updatedListing.id);
    if (index !== -1) {
        listings[index] = updatedListing;
        localStorage.setItem('plotsure_listings', JSON.stringify(listings));
        
        // Reset form and exit edit mode
        resetFormAndExitEditMode();
        
        // Show success message
        showSuccessMessage('Listing updated successfully!');
        
        // Reload dashboard stats
        loadDashboardStats();
        
        // Switch to listings tab to show the updated listing
        showAdminTab('listings');
    } else {
        showErrorMessage('Listing not found for update');
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
    const listing = listings.find(l => l.id === listingId);
    if (!listing) {
        showErrorMessage('Listing not found');
        return;
    }
    
    // Switch to add listing tab and populate form with existing data
    showAdminTab('add-listing');
    
    // Populate form fields with existing listing data
    document.getElementById('listingTitle').value = listing.title;
    document.getElementById('listingLocation').value = listing.location;
    document.getElementById('listingSize').value = listing.plot_size;
    document.getElementById('listingPrice').value = listing.price;
    document.getElementById('listingDescription').value = listing.description;
    document.getElementById('listingType').value = listing.land_type;
    document.getElementById('landownerName').value = listing.landowner_name;
    document.getElementById('landownerPhone').value = listing.landowner_phone;
    document.getElementById('plotNumber').value = listing.plot_number || '';
    document.getElementById('sector').value = listing.sector || '';
    document.getElementById('cell').value = listing.cell || '';
    document.getElementById('amenities').value = listing.amenities || '';
    document.getElementById('infrastructure').value = listing.infrastructure || '';
    document.getElementById('priceNegotiable').checked = listing.price_negotiable || false;
    document.getElementById('landTitleAvailable').checked = listing.land_title_available || false;
    
    // Show existing image if available
    if (listing.image) {
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
            <img src="${listing.image}" alt="Current" style="max-width: 200px; max-height: 150px; border-radius: 4px;">
            <p><small>Upload a new image to replace the current one</small></p>
        `;
        imagePreview.style.display = 'block';
    }
    
    // Show existing document info if available
    if (listing.document) {
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
            <p><strong>File:</strong> ${listing.document}</p>
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
    
    modal.innerHTML = `
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h3>${listing.title}</h3>
                <button class="modal-close" onclick="closeModal('viewListingModal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="listing-detail-content">
                    <img src="${listing.image}" alt="${listing.title}" style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2NDc0OEEiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlIE5vdCBGb3VuZDwvdGV4dD4KPHN2Zz4K'">
                    
                    <div class="listing-info-grid">
                        <div class="info-item">
                            <strong>Location:</strong> ${listing.location}
                        </div>
                        <div class="info-item">
                            <strong>Price:</strong> ${formatPrice(listing.price)} RWF
                        </div>
                        <div class="info-item">
                            <strong>Size:</strong> ${listing.plot_size} ${listing.plot_size_unit}
                        </div>
                        <div class="info-item">
                            <strong>Type:</strong> ${listing.land_type}
                        </div>
                        <div class="info-item">
                            <strong>Landowner:</strong> ${listing.landowner_name}
                        </div>
                        <div class="info-item">
                            <strong>Contact:</strong> ${listing.landowner_phone}
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
                        <button class="btn btn-primary" onclick="editListing(${listing.id}); closeModal('viewListingModal');">
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

function deleteListing(listingId) {
    if (confirm('Are you sure you want to delete this listing?')) {
        listings = listings.filter(listing => listing.id !== listingId);
        localStorage.setItem('plotsure_listings', JSON.stringify(listings));
        
        // Reload listings
        loadAdminListings();
        
        // Reload dashboard stats
        loadDashboardStats();
        
        showSuccessMessage('Listing deleted successfully!');
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
                <h4>${inquiry.name}</h4>
                <p>📧 ${inquiry.email} • 📞 ${inquiry.phone}</p>
                <p><strong>Type:</strong> ${listingTitle}</p>
                <p><strong>Received:</strong> ${createdDate}</p>
            </div>
            <span class="inquiry-status ${status}">${status}</span>
        </div>
        <div class="inquiry-message">
            <p>${inquiry.message}</p>
        </div>
        <div class="inquiry-actions">
            <button class="btn btn-primary btn-small" onclick="updateInquiryStatus(${inquiry.id}, 'contacted')">Mark Contacted</button>
            <button class="btn btn-secondary btn-small" onclick="updateInquiryStatus(${inquiry.id}, 'responded')">Mark Responded</button>
            <button class="btn btn-danger btn-small" onclick="updateInquiryStatus(${inquiry.id}, 'closed')">Close</button>
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
        const matchesSearch = inquiry.name.toLowerCase().includes(searchTerm) ||
                            inquiry.email.toLowerCase().includes(searchTerm) ||
                            inquiry.message.toLowerCase().includes(searchTerm);
        
        const matchesStatus = !statusFilter || inquiry.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
    
    displayAdminInquiries();
}

function updateInquiryStatus(inquiryId, status) {
    const inquiry = inquiries.find(i => i.id === inquiryId);
    if (inquiry) {
        inquiry.status = status;
        localStorage.setItem('plotsure_inquiries', JSON.stringify(inquiries));
        
        // Reload inquiries
        loadAdminInquiries();
        
        showSuccessMessage(`Inquiry status updated to: ${status}`);
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
    
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    
    card.innerHTML = `
        <div class="user-header">
            <div class="user-avatar">${initials}</div>
            <div class="user-info">
                <h4>${user.name}</h4>
                <p>${user.email}</p>
                <p>${user.phone}</p>
                <span class="user-role ${user.role}">${user.role}</span>
            </div>
        </div>
        <div class="user-actions">
            <button class="btn btn-primary btn-small" onclick="editUser(${user.id})">Edit</button>
            <button class="btn btn-secondary btn-small" onclick="toggleUserStatus(${user.id})">
                ${user.is_active ? 'Deactivate' : 'Activate'}
            </button>
            ${user.id !== currentAdmin.id ? `<button class="btn btn-danger btn-small" onclick="deleteUser(${user.id})">Delete</button>` : ''}
        </div>
    `;
    
    return card;
}

function editUser(userId) {
    showSuccessMessage('Edit user functionality coming soon!');
}

function toggleUserStatus(userId) {
    const user = users.find(u => u.id === userId);
    if (user) {
        user.is_active = !user.is_active;
        localStorage.setItem('plotsure_users', JSON.stringify(users));
        
        // Reload users
        loadAdminUsers();
        
        showSuccessMessage(`User ${user.is_active ? 'activated' : 'deactivated'} successfully!`);
    }
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        users = users.filter(user => user.id !== userId);
        localStorage.setItem('plotsure_users', JSON.stringify(users));
        
        // Reload users
        loadAdminUsers();
        
        // Reload dashboard stats
        loadDashboardStats();
        
        showSuccessMessage('User deleted successfully!');
    }
}

// Add User Modal
function showAddUserModal() {
    document.getElementById('addUserModal').classList.add('show');
}

function handleAddUser(e) {
    e.preventDefault();
    
    const newUser = {
        id: users.length + 1,
        name: document.getElementById('newUserName').value,
        email: document.getElementById('newUserEmail').value,
        phone: document.getElementById('newUserPhone').value,
        password: document.getElementById('newUserPassword').value,
        role: document.getElementById('newUserRole').value,
        is_active: true,
        verified: false,
        created_at: new Date().toISOString()
    };
    
    // Check if email already exists
    if (users.find(u => u.email === newUser.email)) {
        showErrorMessage('Email already registered');
        return;
    }
    
    users.push(newUser);
    localStorage.setItem('plotsure_users', JSON.stringify(users));
    
    // Reset form and close modal
    e.target.reset();
    closeModal('addUserModal');
    
    // Reload users
    loadAdminUsers();
    
    // Reload dashboard stats
    loadDashboardStats();
    
    showSuccessMessage('User added successfully!');
}

// Profile Management
function handleUpdateProfile(e) {
    e.preventDefault();
    
    const updatedProfile = {
        ...currentAdmin,
        name: document.getElementById('adminName').value,
        email: document.getElementById('adminEmail').value,
        phone: document.getElementById('adminPhone').value
    };
    
    const newPassword = document.getElementById('adminPassword').value;
    if (newPassword) {
        updatedProfile.password = newPassword;
    }
    
    // Update current admin
    currentAdmin = updatedProfile;
    localStorage.setItem('plotsure_current_user', JSON.stringify(updatedProfile));
    
    // Update in users array
    const userIndex = users.findIndex(u => u.id === currentAdmin.id);
    if (userIndex !== -1) {
        users[userIndex] = updatedProfile;
        localStorage.setItem('plotsure_users', JSON.stringify(users));
    }
    
    // Update UI
    updateAdminUI();
    
    // Clear password field
    document.getElementById('adminPassword').value = '';
    
    showSuccessMessage('Profile updated successfully!');
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

function logout() {
    localStorage.removeItem('plotsure_current_user');
    window.location.href = 'index.html';
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