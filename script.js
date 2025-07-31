// Global variables
let currentUser = null;
let listings = [];
let inquiries = [];
let currentFilteredListings = [];
let currentPage = 1;
const listingsPerPage = 6;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Hide loader after a short delay
    setTimeout(() => {
        document.getElementById('loader').classList.add('hidden');
    }, 1000);

    // Initialize data from localStorage
    loadDataFromStorage();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check if user is logged in
    checkAuthStatus();
}

// Data Management Functions
function loadDataFromStorage() {
    // Load listings from localStorage only
    const storedListings = localStorage.getItem('plotsure_listings');
    if (storedListings) {
        listings = JSON.parse(storedListings);
    } else {
        // No hardcoded data - start with empty listings
        listings = [];
        saveListingsToStorage();
    }

    // Load users
    const storedUsers = localStorage.getItem('plotsure_users');
    if (!storedUsers) {
        // Create default admin user
        const defaultUsers = [
            {
                id: 1,
                name: "Admin User",
                email: "admin@plotsure.com",
                password: "admin123", // In a real app, this would be hashed
                phone: "+250 791 845 708",
                role: "admin",
                is_active: true,
                verified: true,
                created_at: "2024-01-01T00:00:00Z"
            }
        ];
        localStorage.setItem('plotsure_users', JSON.stringify(defaultUsers));
    }

    // Load inquiries
    const storedInquiries = localStorage.getItem('plotsure_inquiries');
    if (storedInquiries) {
        inquiries = JSON.parse(storedInquiries);
    }
}

function saveListingsToStorage() {
    localStorage.setItem('plotsure_listings', JSON.stringify(listings));
}

function saveInquiriesToStorage() {
    localStorage.setItem('plotsure_inquiries', JSON.stringify(inquiries));
}

// Event Listeners Setup
function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Signup form
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
    
    // Contact form
    document.getElementById('contactForm').addEventListener('submit', handleContact);
    

    
    // Login button in main app
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', showLoginModal);
    }
    
    // Mobile menu button
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                searchListings();
            }
        });
    }
}

// Mobile Menu Functions
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    
    if (navLinks && mobileMenuBtn) {
        navLinks.classList.toggle('mobile-active');
        mobileMenuBtn.classList.toggle('active');
    }
}

// Authentication Functions
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const users = JSON.parse(localStorage.getItem('plotsure_users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('plotsure_current_user', JSON.stringify(user));
        
        showSuccessMessage('Login successful!');
        
        // Redirect admin to admin dashboard
        if (user.role === 'admin') {
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1000);
        } else {
            // Show main application for regular users
            showMainApp();
        }
    } else {
        showErrorMessage('Invalid email or password');
    }
}

function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const phone = document.getElementById('signupPhone').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    if (password !== confirmPassword) {
        showErrorMessage('Passwords do not match');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('plotsure_users') || '[]');
    
    // Check if email already exists
    if (users.find(u => u.email === email)) {
        showErrorMessage('Email already registered');
        return;
    }
    
    // Create new user
    const newUser = {
        id: users.length + 1,
        name: name,
        email: email,
        password: password,
        phone: phone,
        role: 'user',
        is_active: true,
        verified: false,
        created_at: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('plotsure_users', JSON.stringify(users));
    
    showSuccessMessage('Account created successfully! Please login.');
    
    // Switch to login tab
    showAuthTab('login');
    
    // Clear signup form
    e.target.reset();
}

function checkAuthStatus() {
    const storedUser = localStorage.getItem('plotsure_current_user');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        showMainApp();
        updateUIForLoggedInUser();
    } else {
        // Show authentication screen by default
        showAuthScreen();
    }
}

function showAuthScreen() {
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
}

function showMainApp() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    
    // Load initial data
    loadListings();
    setupNavigation();
}

function updateUIForLoggedInUser() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (currentUser) {
        if (loginBtn) {
            loginBtn.textContent = 'My Account';
            loginBtn.onclick = () => {
                showUserDashboard();
            };
        }
        
        if (logoutBtn) {
            logoutBtn.style.display = 'inline-block';
        }
    } else {
        if (loginBtn) {
            loginBtn.textContent = 'Login';
            loginBtn.onclick = showLoginModal;
        }
        
        if (logoutBtn) {
            logoutBtn.style.display = 'none';
        }
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('plotsure_current_user');
    showAuthScreen();
    showSuccessMessage('Logged out successfully');
}

// Authentication Tab Functions
function showAuthTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.auth-tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.auth-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(`${tabName}Tab`).style.display = 'block';

    // Add active class to clicked button
    event.target.classList.add('active');
}

// Modal Functions
function showLoginModal() {
    document.getElementById('loginModal').classList.add('show');
}

function showSignupModal() {
    closeModal('loginModal');
    document.getElementById('signupModal').classList.add('show');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        // For dynamically created modals (like inquiryModal), remove the entire element
        if (modalId === 'inquiryModal') {
            modal.remove();
        } else {
            // For existing modals, just remove the show class
            modal.classList.remove('show');
        }
    }
}



function showUserDashboard() {
    // For regular users, show their inquiries
    showSuccessMessage('User dashboard coming soon!');
}

// Listing Functions
function loadListings() {
    currentFilteredListings = [...listings];
    displayListings();
}

function displayListings() {
    const grid = document.getElementById('listingsGrid');
    if (!grid) return;
    
    const startIndex = (currentPage - 1) * listingsPerPage;
    const endIndex = startIndex + listingsPerPage;
    const listingsToShow = currentFilteredListings.slice(startIndex, endIndex);
    
    grid.innerHTML = '';
    
    if (currentFilteredListings.length === 0) {
        // Show message when no listings are available
        grid.innerHTML = `
            <div class="no-listings-message">
                <div class="no-listings-icon">🏠</div>
                <h3>No Land Plots Available</h3>
                <p>Currently, there are no land plots listed on our platform.</p>
                <p>Please check back later or contact our admin team to add new listings.</p>
                <div class="contact-info">
                    <p><strong>Contact Admin:</strong></p>
                    <p>📧 plotsureconnect@gmail.com</p>
                    <p>📞 +250 791 845 708</p>
                </div>
            </div>
        `;
        return;
    }
    
    listingsToShow.forEach(listing => {
        const card = createListingCard(listing);
        grid.appendChild(card);
    });
    
    // Show/hide load more button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        if (endIndex < currentFilteredListings.length) {
            loadMoreBtn.style.display = 'inline-block';
        } else {
            loadMoreBtn.style.display = 'none';
        }
    }
}

function createListingCard(listing) {
    const card = document.createElement('div');
    card.className = 'listing-card fade-in';
    card.onclick = () => showListingDetail(listing);
    
    card.innerHTML = `
        <img src="${listing.image}" alt="${listing.title}" class="listing-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2NDc0OEEiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlIE5vdCBGb3VuZDwvdGV4dD4KPHN2Zz4K'">
        <div class="listing-content">
            <h3 class="listing-title">${listing.title}</h3>
            <div class="listing-location">
                📍 ${listing.location}
            </div>
            <div class="listing-price">${formatPrice(listing.price)} RWF</div>
            <div class="listing-details">
                <span>${listing.plot_size} ${listing.plot_size_unit}</span>
                <span>•</span>
                <span>${listing.land_type}</span>
            </div>
            <p class="listing-description">${listing.description.substring(0, 100)}...</p>
            <div class="listing-actions">
                <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); showListingDetail(${JSON.stringify(listing).replace(/"/g, '&quot;')})">
                    View Details
                </button>
                <button class="btn btn-secondary btn-small" onclick="event.stopPropagation(); submitInquiry(${listing.id})">
                    Contact Land Broker
                </button>
            </div>
        </div>
    `;
    
    return card;
}

function showListingDetail(listing) {
    const modal = document.getElementById('listingDetailModal');
    const title = document.getElementById('listingDetailTitle');
    const content = document.getElementById('listingDetailContent');
    
    title.textContent = listing.title;
    
    content.innerHTML = `
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
                    <strong>Land Broker:</strong> ${listing.landowner_name}
                </div>
                <div class="info-item">
                    <strong>Contact:</strong> ${listing.landowner_phone}
                </div>
            </div>
            
            <div class="listing-description-full">
                <h4>Description</h4>
                <p>${listing.description}</p>
            </div>
            
            <div class="listing-documents">
                <h4>Documents</h4>
                <p><strong>Land Title:</strong> 
                    ${listing.document_data ? 
                        `<button onclick="openDocument('${listing.document}', '${listing.document_data}')" class="document-link">${listing.document} 📄</button>` : 
                        listing.document
                    }
                </p>
            </div>
            
            <div class="listing-actions-full">
                <button class="btn btn-primary" onclick="submitInquiry(${listing.id})">
                    Contact Land Broker
                </button>
                <button class="btn btn-secondary" onclick="closeModal('listingDetailModal')">
                    Close
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('show');
}

// Document Viewer Function
function openDocument(documentName, documentData) {
    // Convert base64 to blob URL
    const byteCharacters = atob(documentData.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    
    // Create document viewer modal
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'documentViewerModal';
    
    modal.innerHTML = `
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h3>${documentName}</h3>
                <button class="modal-close" onclick="closeDocumentViewer()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="document-viewer">
                    <iframe src="${blobUrl}" width="100%" height="600px" frameborder="0"></iframe>
                </div>
                <div class="document-actions">
                    <button class="btn btn-primary" onclick="downloadDocument('${documentName}', '${blobUrl}')">
                        📥 Download Document
                    </button>
                    <button class="btn btn-secondary" onclick="closeDocumentViewer()">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeDocumentViewer() {
    const modal = document.getElementById('documentViewerModal');
    if (modal) {
        // Clean up blob URL
        const iframe = modal.querySelector('iframe');
        if (iframe && iframe.src.startsWith('blob:')) {
            URL.revokeObjectURL(iframe.src);
        }
        modal.remove();
    }
}

function downloadDocument(documentName, blobUrl) {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = documentName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Search and Filter Functions
function searchListings() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const priceFilter = document.getElementById('priceFilter')?.value || '';
    const landTypeFilter = document.getElementById('landTypeFilter')?.value || '';
    
    currentFilteredListings = listings.filter(listing => {
        const matchesSearch = listing.title.toLowerCase().includes(searchTerm) ||
                            listing.location.toLowerCase().includes(searchTerm) ||
                            listing.description.toLowerCase().includes(searchTerm);
        
        const matchesPrice = filterByPrice(listing.price, priceFilter);
        const matchesType = !landTypeFilter || listing.land_type === landTypeFilter;
        
        return matchesSearch && matchesPrice && matchesType;
    });
    
    currentPage = 1;
    displayListings();
}

function filterListings() {
    searchListings();
}

function filterByPrice(price, filter) {
    if (!filter) return true;
    
    const [min, max] = filter.split('-').map(p => p === '+' ? Infinity : parseInt(p));
    return price >= min && (max === Infinity || price <= max);
}

function loadMoreListings() {
    currentPage++;
    displayListings();
}



// Inquiry Functions
function submitInquiry(listingId) {
    const listing = listings.find(l => l.id === listingId);
    if (!listing) {
        showErrorMessage('Listing not found');
        return;
    }
    
    // Create inquiry modal
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'inquiryModal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Contact Land Broker</h3>
                <button class="modal-close" onclick="closeModal('inquiryModal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="inquiry-listing-info">
                    <h4>${listing.title}</h4>
                    <p>📍 ${listing.location}</p>
                    <p><strong>${formatPrice(listing.price)} RWF</strong></p>
                </div>
                <form id="inquiryForm" class="inquiry-form">
                    <div class="form-group">
                        <label for="inquiryName">Your Name *</label>
                        <input type="text" id="inquiryName" required>
                    </div>
                    <div class="form-group">
                        <label for="inquiryEmail">Your Email *</label>
                        <input type="email" id="inquiryEmail" required>
                    </div>
                    <div class="form-group">
                        <label for="inquiryPhone">Your Phone</label>
                        <input type="tel" id="inquiryPhone" placeholder="+250 791 234 567">
                    </div>
                    <div class="form-group">
                        <label for="inquiryMessage">Your Message *</label>
                        <textarea id="inquiryMessage" rows="4" required placeholder="Tell the land broker about your interest in this property..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeModal('inquiryModal')">Cancel</button>
                        <button type="submit" class="btn btn-primary">Send Inquiry</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    document.getElementById('inquiryForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('inquiryName').value.trim(),
            email: document.getElementById('inquiryEmail').value.trim(),
            phone: document.getElementById('inquiryPhone').value.trim(),
            message: document.getElementById('inquiryMessage').value.trim()
        };
        
        // Validate required fields
        if (!formData.name || !formData.email || !formData.message) {
            showErrorMessage('Please fill in all required fields');
            return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            showErrorMessage('Please enter a valid email address');
            return;
        }
        
        // Create new inquiry
        const newInquiry = {
            id: Date.now(), // Use timestamp for unique ID
            listing_id: listingId,
            listing_user_id: listing.user_id,
            name: formData.name,
            email: formData.email,
            phone: formData.phone || 'Not provided',
            message: formData.message,
            status: 'new',
            created_at: new Date().toISOString()
        };
        
        // Add to inquiries array
        inquiries.push(newInquiry);
        saveInquiriesToStorage();
        
        // Close modal and show success message
        closeModal('inquiryModal');
        showSuccessMessage('Inquiry submitted successfully! The landowner will contact you soon.');
    });
}

// Contact Form
function handleContact(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('contactName').value.trim(),
        email: document.getElementById('contactEmail').value.trim(),
        phone: document.getElementById('contactPhone').value.trim(),
        message: document.getElementById('contactMessage').value.trim()
    };
    
    // Validate required fields
    if (!formData.name || !formData.email || !formData.message) {
        showErrorMessage('Please fill in all required fields (Name, Email, and Message)');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        showErrorMessage('Please enter a valid email address');
        return;
    }
    
    // Create new inquiry
    const newInquiry = {
        id: Date.now(), // Use timestamp for unique ID
        name: formData.name,
        email: formData.email,
        phone: formData.phone || 'Not provided',
        message: formData.message,
        listing_id: null, // General contact form, not tied to specific listing
        listing_user_id: null,
        status: 'new',
        created_at: new Date().toISOString()
    };
    
    // Add to inquiries array
    inquiries.push(newInquiry);
    saveInquiriesToStorage();
    
    // Reset form
    e.target.reset();
    
    showSuccessMessage('Thank you for your message! We will get back to you soon.');
}



// Utility Functions
function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function showSuccessMessage(message) {
    // Create a simple success message
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
    // Create a simple error message
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

function scrollToSection(sectionId) {
    document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
}

function setupNavigation() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Active navigation highlighting
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
    
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (navbar && window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else if (navbar) {
            navbar.classList.remove('scrolled');
        }
    });
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
    
    .listing-info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }
    
    .info-item {
        padding: 0.5rem;
        background: var(--light);
        border-radius: 4px;
    }
    
    .listing-description-full {
        margin-bottom: 1.5rem;
    }
    
    .listing-documents {
        margin-bottom: 1.5rem;
    }
    
    .listing-actions-full {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
    }
`;
document.head.appendChild(style); 