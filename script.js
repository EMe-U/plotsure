// Import Firebase services
import { authService, dbService, storageService } from './firebase-config.js';

// ========================================
// ADMIN DASHBOARD ACCESS CREDENTIALS
// ========================================
// 📧 Email: admin@plotsure.com
// 🔑 Password: admin123
// 🎯 These credentials are specifically for accessing the admin dashboard
// ========================================

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
    // Create default admin user
    createDefaultAdmin();
    
    // Add debug functions to window for testing
    window.testAdminLogin = testAdminLogin;
    window.checkAdminUser = checkAdminUser;
});

// Debug function to test admin login
// ADMIN CREDENTIALS: admin@plotsure.com / admin123
async function testAdminLogin() {
    try {
        console.log('=== Testing Admin Dashboard Access ===');
        console.log('📧 Admin Email: admin@plotsure.com');
        console.log('🔑 Admin Password: admin123');
        console.log('🎯 These credentials are for ADMIN DASHBOARD ACCESS ONLY');
        
        // Test Firebase connection first
        try {
            const currentUser = authService.getCurrentUser();
            console.log('Firebase connection test:', currentUser ? 'OK' : 'No user');
        } catch (error) {
            console.log('Firebase connection issue:', error.message);
        }
        
        const user = await authService.signIn('admin@plotsure.com', 'admin123');
        console.log('✅ Admin login successful:', user);
        
        const userData = await dbService.users.get(user.uid);
        console.log('Admin user data:', userData);
        
        if (userData && userData.role === 'admin') {
            console.log('✅ Admin user confirmed, redirecting to admin dashboard...');
            window.location.href = 'admin.html';
        } else {
            console.log('❌ User is not admin or missing data');
        }
    } catch (error) {
        console.error('❌ Admin login failed:', error);
        
        // If it's an ad blocker issue, provide alternative
        if (error.message.includes('network') || error.message.includes('blocked')) {
            console.log('🔧 Possible ad blocker issue. Try:');
            console.log('1. Disable ad blocker for localhost');
            console.log('2. Use incognito mode');
            console.log('3. Add Firebase domains to whitelist');
        }
    }
}

// Debug function to check if admin user exists
// ADMIN CREDENTIALS: admin@plotsure.com / admin123
async function checkAdminUser() {
    try {
        console.log('=== Checking Admin Dashboard Access ===');
        console.log('📧 Admin Email: admin@plotsure.com');
        console.log('🔑 Admin Password: admin123');
        console.log('🎯 These credentials are for ADMIN DASHBOARD ACCESS ONLY');
        
        const allUsers = await dbService.users.getAll();
        console.log('All users:', allUsers);
        
        const adminUser = allUsers.find(user => user.email === 'admin@plotsure.com');
        if (adminUser) {
            console.log('✅ Admin user found:', adminUser);
            console.log('🎯 Admin dashboard access is ready');
            console.log('📧 Use admin@plotsure.com / admin123 to login');
        } else {
            console.log('❌ Admin user not found in database');
            console.log('🔧 Run createDefaultAdmin() to create admin user');
        }
        
        // Check current user
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
            console.log('👤 Current authenticated user:', currentUser.email);
            const userData = await dbService.users.get(currentUser.uid);
            if (userData) {
                console.log('📧 Current user data:', userData);
                console.log('🎯 Current user role:', userData.role);
            }
        } else {
            console.log('👤 No user currently authenticated');
        }
    } catch (error) {
        console.error('❌ Error checking admin user:', error);
    }
}

function initializeApp() {
    // Hide loader after a short delay
    setTimeout(() => {
        document.getElementById('loader').classList.add('hidden');
    }, 1000);

    // Set up event listeners
    setupEventListeners();
    
    // Check if user is logged in
    checkAuthStatus();
    
    // Set up auth state listener
    try {
        authService.onAuthStateChanged(user => {
            if (user) {
                // User is signed in
                loadUserData(user.uid);
            } else {
                // User is signed out
                currentUser = null;
                showAuthScreen();
            }
        });
    } catch (error) {
        console.error('Error setting up auth state listener:', error);
    }
}

async function loadUserData(userId) {
    try {
        const userData = await dbService.users.get(userId);
        if (userData) {
            currentUser = { id: userId, ...userData };
            showMainApp();
            updateUIForLoggedInUser();
             } else {
            showAuthScreen();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showAuthScreen();
    }
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
    
    // Auth tab buttons
    document.querySelectorAll('.auth-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            showAuthTab(tabName, this);
        });
    });
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Listing action buttons (delegated event listener)
    document.addEventListener('click', function(e) {
        if (e.target.matches('[data-action]')) {
            const action = e.target.getAttribute('data-action');
            const listingId = e.target.getAttribute('data-listing-id');
            const modalId = e.target.getAttribute('data-modal-id');
            const documentName = e.target.getAttribute('data-document-name');
            const documentUrl = e.target.getAttribute('data-document-url');
            
            console.log('🔧 Listing action:', action, 'for listing:', listingId, 'modal:', modalId, 'document:', documentName);
            
            // Prevent event bubbling for button clicks
            e.stopPropagation();
            
            switch(action) {
                case 'view-details':
                    const listing = listings.find(l => l.id === listingId);
                    if (listing) {
                        showListingDetail(listing);
                    } else {
                        console.log('❌ Listing not found for ID:', listingId);
                        showErrorMessage('Listing not found');
                    }
                    break;
                case 'contact-broker':
                    submitInquiry(listingId);
                    break;
                case 'close-modal':
                    closeModal(modalId);
                    break;
                case 'view-document':
                    viewDocument(documentName, documentUrl);
                    break;
                default:
                    console.log('❌ Unknown action:', action);
            }
        }
    });
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
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        console.log('Attempting login with:', email);
        
        // Check if admin credentials are being used
        if (email === 'admin@plotsure.com') {
            console.log('🔧 Admin credentials detected');
            console.log('🎯 These credentials are for ADMIN DASHBOARD ACCESS ONLY');
        }
        
        const user = await authService.signIn(email, password);
        
        if (user) {
            console.log('Login successful, getting user data...');
            // Get user data from Firestore
            const userData = await dbService.users.get(user.uid);
            console.log('User data:', userData);
            
            if (userData) {
                currentUser = { id: user.uid, ...userData };
                
                showSuccessMessage('Login successful!');
                
                // Redirect admin to admin dashboard
                if (userData.role === 'admin') {
                    console.log('User is admin, redirecting to admin dashboard...');
                    console.log('User data for admin:', userData);
                    console.log('User ID:', user.uid);
                    
                    // Store admin user in localStorage for admin dashboard
                    localStorage.setItem('plotsure_current_user', JSON.stringify({ id: user.uid, ...userData }));
                    
                    // Immediate redirect for admin
                    console.log('Redirecting to admin.html immediately...');
                    window.location.href = 'admin.html';
                } else {
                    console.log('User is regular user, showing main app...');
                    console.log('User data for regular user:', userData);
                    // Show main application for regular users
                    showMainApp();
                }
            } else {
                // User exists in Auth but not in Firestore - create user document
                console.log('User exists in Auth but not in Firestore, creating user document...');
                const newUserData = {
                    name: user.email.split('@')[0], // Use email prefix as name
                    email: user.email,
                    phone: '',
                    role: 'user',
                    is_active: true,
                    verified: false,
                    created_at: new Date().toISOString()
                };
                
                await dbService.users.create(user.uid, newUserData);
                currentUser = { id: user.uid, ...newUserData };
                
                showSuccessMessage('Login successful! Welcome to PlotSure Connect!');
                showMainApp();
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        
        // Handle specific Firebase auth errors
        if (error.message.includes('auth/user-not-found')) {
            showErrorMessage('User not found. Please check your email or sign up.');
        } else if (error.message.includes('auth/wrong-password')) {
            showErrorMessage('Incorrect password. Please try again.');
        } else if (error.message.includes('auth/invalid-email')) {
            showErrorMessage('Invalid email format. Please check your email.');
        } else if (error.message.includes('auth/too-many-requests')) {
            showErrorMessage('Too many failed attempts. Please try again later.');
        } else {
            showErrorMessage('Login failed: ' + error.message);
        }
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const phone = document.getElementById('signupPhone').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    // Validation
    if (!name || !email || !phone || !password || !confirmPassword) {
        showErrorMessage('Please fill in all fields');
        return;
    }
    
    if (password !== confirmPassword) {
        showErrorMessage('Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        showErrorMessage('Password must be at least 6 characters long');
        return;
    }
    
    try {
        console.log('Creating new user account...');
        // Create user in Firebase Auth
        const user = await authService.signUp(email, password);
        
        if (user) {
            console.log('User created in Auth, creating Firestore document...');
            // Create user document in Firestore
            const userData = {
                name: name,
                email: email,
                phone: phone,
                role: 'user',
                is_active: true,
                verified: false,
                created_at: new Date().toISOString()
            };
            
            await dbService.users.create(user.uid, userData);
            console.log('User document created successfully');
            
            showSuccessMessage('Account created successfully! Please login.');
            
            // Switch to login tab
            showAuthTab('login');
            
            // Clear signup form
            e.target.reset();
        }
    } catch (error) {
        console.error('Signup error:', error);
        
        // Handle specific Firebase auth errors
        if (error.message.includes('auth/email-already-in-use')) {
            showErrorMessage('Email already registered. Please login instead.');
        } else if (error.message.includes('auth/invalid-email')) {
            showErrorMessage('Invalid email format. Please check your email.');
        } else if (error.message.includes('auth/weak-password')) {
            showErrorMessage('Password is too weak. Please choose a stronger password.');
        } else if (error.message.includes('auth/operation-not-allowed')) {
            showErrorMessage('Email/password accounts are not enabled. Please contact support.');
        } else {
            showErrorMessage('Signup failed: ' + error.message);
        }
    }
}

// Create default admin user if none exists
// ADMIN CREDENTIALS: admin@plotsure.com / admin123
// These credentials are specifically for accessing the admin dashboard
async function createDefaultAdmin() {
    try {
        const adminEmail = 'admin@plotsure.com';
        const adminPassword = 'admin123';
        
        console.log('🔧 Setting up admin dashboard access...');
        console.log('📧 Admin Email: admin@plotsure.com');
        console.log('🔑 Admin Password: admin123');
        console.log('⚠️  These credentials are for ADMIN DASHBOARD ACCESS ONLY');
        
        // First, check if admin user exists in Firestore
        try {
            const allUsers = await dbService.users.getAll();
            const adminUser = allUsers.find(user => user.email === adminEmail && user.role === 'admin');
            
            if (adminUser) {
                console.log('✅ Admin user already exists in database');
                console.log('🎯 Use admin@plotsure.com / admin123 to access admin dashboard');
                return;
            }
        } catch (error) {
            console.log('Could not check existing users:', error.message);
        }
        
        // Try to sign in with admin credentials to check if Auth user exists
        try {
            const user = await authService.signIn(adminEmail, adminPassword);
            console.log('🔧 Admin user exists in Auth but not in database, creating document...');
            
            // Create admin document in Firestore
            const adminData = {
                name: 'Admin User',
                email: adminEmail,
                phone: '+250 791 845 708',
                role: 'admin',
                is_active: true,
                verified: true,
                created_at: new Date().toISOString()
            };
            
            await dbService.users.create(user.uid, adminData);
            console.log('✅ Admin user document created successfully');
            console.log('🎯 Admin dashboard ready: admin@plotsure.com / admin123');
            
            // Sign out after creating document
            await authService.signOut();
            return;
            
        } catch (error) {
            console.log('🔧 Creating new admin user in Auth and Firestore...');
            
            // Admin user doesn't exist in Auth, create both Auth and Firestore
            try {
                const user = await authService.signUp(adminEmail, adminPassword);
                
                if (user) {
                    const adminData = {
                        name: 'Admin User',
                        email: adminEmail,
                        phone: '+250 791 845 708',
                        role: 'admin',
                        is_active: true,
                        verified: true,
                        created_at: new Date().toISOString()
                    };
                    
                    await dbService.users.create(user.uid, adminData);
                    console.log('✅ Default admin user created successfully in both Auth and Firestore');
                    console.log('🎯 ADMIN DASHBOARD ACCESS READY:');
                    console.log('   📧 Email: admin@plotsure.com');
                    console.log('   🔑 Password: admin123');
                    console.log('   🚀 Use these credentials to access admin dashboard');
                    
                    // Sign out after creating admin
                    await authService.signOut();
                }
            } catch (signUpError) {
                if (signUpError.message.includes('auth/email-already-in-use')) {
                    console.log('🔧 Admin user already exists in Auth, trying to sign in...');
                    // Try to sign in again and create document
                    try {
                        const existingUser = await authService.signIn(adminEmail, adminPassword);
                        const adminData = {
                            name: 'Admin User',
                            email: adminEmail,
                            phone: '+250 791 845 708',
                            role: 'admin',
                            is_active: true,
                            verified: true,
                            created_at: new Date().toISOString()
                        };
                        
                        await dbService.users.create(existingUser.uid, adminData);
                        console.log('✅ Admin user document created for existing Auth user');
                        console.log('🎯 Admin dashboard ready: admin@plotsure.com / admin123');
                        await authService.signOut();
                    } catch (signInError) {
                        console.error('❌ Error signing in existing admin user:', signInError);
                    }
                } else {
                    console.error('❌ Error creating admin user:', signUpError);
                }
            }
        }
    } catch (error) {
        console.error('❌ Error creating default admin:', error);
    }
}



async function checkAuthStatus() {
    try {
        // Check if user is authenticated with Firebase
        const user = authService.getCurrentUser();
        
        if (user) {
            console.log('User is authenticated, getting user data...');
            // Get user data from Firestore
            const userData = await dbService.users.get(user.uid);
            
            if (userData) {
                currentUser = { id: user.uid, ...userData };
                
                // Store user in localStorage for persistence
                localStorage.setItem('plotsure_current_user', JSON.stringify(currentUser));
                
                // Show main app or admin dashboard based on role
                if (userData.role === 'admin') {
                    console.log('🔧 Admin user detected, redirecting to admin dashboard...');
                    console.log('📧 Admin email:', userData.email);
                    console.log('🎯 Role:', userData.role);
                    window.location.href = 'admin.html';
                } else {
                    console.log('👤 Regular user detected, showing main app...');
                    console.log('📧 User email:', userData.email);
                    console.log('🎯 Role:', userData.role);
                    showMainApp();
                    updateUIForLoggedInUser();
                }
            } else {
                console.log('⚠️ User authenticated but no Firestore data, creating user document...');
                // Create user document for existing Auth user
                const newUserData = {
                    name: user.email.split('@')[0], // Use email prefix as name
                    email: user.email,
                    phone: '',
                    role: 'user', // Default to regular user
                    is_active: true,
                    verified: false,
                    created_at: new Date().toISOString()
                };
                
                await dbService.users.create(user.uid, newUserData);
                currentUser = { id: user.uid, ...newUserData };
                
                console.log('✅ User document created with role: user');
                showMainApp();
                updateUIForLoggedInUser();
            }
        } else {
            console.log('No authenticated user, showing auth screen...');
            // Check localStorage for fallback
            const storedUser = localStorage.getItem('plotsure_current_user');
            if (storedUser) {
                // Clear stale localStorage data
                localStorage.removeItem('plotsure_current_user');
            }
            showAuthScreen();
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
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

async function logout() {
    try {
        await authService.signOut();
        currentUser = null;
        
        // Clear localStorage
        localStorage.removeItem('plotsure_current_user');
        
        showAuthScreen();
        showSuccessMessage('Logged out successfully');
    } catch (error) {
        console.error('Logout error:', error);
        showErrorMessage('Logout failed: ' + error.message);
    }
}

// Authentication Tab Functions
function showAuthTab(tabName, clickedElement = null) {
    try {
        // Hide all tab contents
        document.querySelectorAll('.auth-tab-content').forEach(tab => {
            tab.style.display = 'none';
        });
        
        // Remove active class from all tab buttons
        document.querySelectorAll('.auth-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab content
        const tabContent = document.getElementById(`${tabName}Tab`);
        if (tabContent) {
            tabContent.style.display = 'block';
        } else {
            console.error(`Tab content not found: ${tabName}Tab`);
        }
        
        // Add active class to clicked button if provided
        if (clickedElement) {
            clickedElement.classList.add('active');
        } else {
            // Find the button with matching data-tab attribute
            const button = document.querySelector(`[data-tab="${tabName}"]`);
            if (button) {
                button.classList.add('active');
            } else {
                console.error(`Tab button not found for: ${tabName}`);
            }
        }
    } catch (error) {
        console.error('Error in showAuthTab:', error);
    }
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
async function loadListings() {
    try {
        // Load listings from Firebase
        listings = await dbService.listings.getAll();
        currentFilteredListings = [...listings];
        displayListings();
    } catch (error) {
        console.error('Error loading listings:', error);
        listings = [];
        currentFilteredListings = [];
        displayListings();
    }
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
    
    const imageUrl = listing.image_url || listing.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2NDc0OEEiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlIE5vdCBGb3VuZDwvdGV4dD4KPHN2Zz4K';
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${listing.title}" class="listing-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2NDc0OEEiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlIE5vdCBGb3VuZDwvdGV4dD4KPHN2Zz4K'">
        <div class="listing-content">
            <h3 class="listing-title">${listing.title}</h3>
            <div class="listing-location">
                📍 ${listing.location}
            </div>
            <div class="listing-price">${formatPrice(listing.price)} RWF</div>
            <div class="listing-details">
                <span>${listing.size || listing.plot_size} ${listing.size_unit || listing.plot_size_unit || 'sqm'}</span>
                <span>•</span>
                <span>${listing.land_type}</span>
            </div>
            <p class="listing-description">${listing.description.substring(0, 100)}...</p>
            <div class="listing-actions">
                <button class="btn btn-primary btn-small" data-action="view-details" data-listing-id="${listing.id}">
                    View Details
                </button>
                <button class="btn btn-secondary btn-small" data-action="contact-broker" data-listing-id="${listing.id}">
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
    
    const imageUrl = listing.image_url || listing.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2NDc0OEEiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlIE5vdCBGb3VuZDwvdGV4dD4KPHN2Zz4K';
    
    content.innerHTML = `
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
                    <strong>Land Broker:</strong> ${listing.owner_name}
                </div>
                <div class="info-item">
                    <strong>Contact:</strong> ${listing.owner_phone}
                </div>
            </div>
            
            <div class="listing-description-full">
                <h4>Description</h4>
                <p>${listing.description}</p>
            </div>
            
            <div class="listing-documents">
                <h4>Documents</h4>
                <p><strong>Land Title:</strong> ${listing.document || listing.document_url ? 'Document uploaded' : 'No document uploaded'}</p>
                ${listing.document_url ? `
                <div class="document-viewer">
                    <button class="btn btn-primary btn-small" data-action="view-document" data-document-name="${listing.document || 'Document'}" data-document-url="${listing.document_url}">
                        📄 View Document
                    </button>
                </div>
                ` : `
                <p><em>Document not available for viewing</em></p>
                `}
            </div>
            
            <div class="listing-actions-full">
                <button class="btn btn-primary" data-action="contact-broker" data-listing-id="${listing.id}">
                    Contact Land Broker
                </button>
                <button class="btn btn-secondary" data-action="close-modal" data-modal-id="listingDetailModal">
                    Close
                </button>
            </div>
         </div>
    `;
    
    modal.classList.add('show');
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
    console.log('🔧 Submit inquiry called for listing ID:', listingId);
    
    const listing = listings.find(l => l.id === listingId);
    if (!listing) {
        console.log('❌ Listing not found for ID:', listingId);
        showErrorMessage('Listing not found');
        return;
    }
    
    console.log('✅ Found listing:', listing.title);
    
    // Create inquiry modal
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'inquiryModal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Contact Land Broker</h3>
                <button class="modal-close" data-action="close-modal" data-modal-id="inquiryModal">&times;</button>
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
                        <button type="button" class="btn btn-secondary" data-action="close-modal" data-modal-id="inquiryModal">Cancel</button>
                        <button type="submit" class="btn btn-primary">Send Inquiry</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    document.getElementById('inquiryForm').addEventListener('submit', async function(e) {
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
        
        try {
            // Create new inquiry in Firebase
            const inquiryData = {
                listing_id: listingId,
                listing_user_id: listing.owner_id,
                user_name: formData.name,
                user_email: formData.email,
                user_phone: formData.phone || 'Not provided',
                message: formData.message,
                status: 'new',
                created_at: new Date().toISOString()
            };
            
            await dbService.inquiries.create(inquiryData);
            
            // Close modal and show success message
            closeModal('inquiryModal');
            showSuccessMessage('Inquiry submitted successfully! The landowner will contact you soon.');
        } catch (error) {
            console.error('Error submitting inquiry:', error);
            showErrorMessage('Error submitting inquiry: ' + error.message);
        }
    });
}

// Contact Form
async function handleContact(e) {
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
    
    try {
        // Create new inquiry in Firebase
        const inquiryData = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone || 'Not provided',
            message: formData.message,
            listing_id: null, // General contact form, not tied to specific listing
            listing_user_id: null,
            status: 'new',
            created_at: new Date().toISOString()
        };
        
        await dbService.inquiries.create(inquiryData);
        
        // Reset form
        e.target.reset();
        
        showSuccessMessage('Thank you for your message! We will get back to you soon.');
    } catch (error) {
        console.error('Error submitting contact form:', error);
        showErrorMessage('Error submitting message: ' + error.message);
    }
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

// Document Viewer Function
function viewDocument(documentName, documentUrl) {
    try {
        // Open document in new window
        window.open(documentUrl, '_blank');
    } catch (error) {
        console.error('Error opening document:', error);
        showErrorMessage('Unable to open document. Please try again.');
    }
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