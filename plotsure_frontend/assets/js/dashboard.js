// Simple message display function for dashboard
function showMessage(message, type = 'info') {
    if (type === 'error') {
        alert(message);
    } else {
        // For success/info messages, you could implement a toast notification
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

// Simple APP_CONFIG for dashboard
const APP_CONFIG = {
    SUCCESS_MESSAGES: {
        LISTING_CREATED: 'Listing created successfully!',
        LISTING_DELETED: 'Listing deleted successfully!',
        PROFILE_UPDATED: 'Profile updated successfully!'
    },
    STORAGE_KEYS: {
        USER_DATA: 'userData'
    },
    CURRENCY: {
        SYMBOLS: {
            'RWF': 'RWF',
            'USD': '$'
        }
    }
};

// Simple authAPI for dashboard
const authAPI = {
    isAuthenticated() {
        return !!localStorage.getItem('token');
    },
    getCurrentUser() {
        const userData = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
        return userData ? JSON.parse(userData) : null;
    },
    async updateProfile(formData) {
        // Simple implementation - in real app this would make API call
        return { success: true, data: formData };
    },
    async changePassword(currentPassword, newPassword) {
        // Simple implementation - in real app this would make API call
        return { success: true };
    }
};

// Simple listingsAPI for dashboard
const listingsAPI = {
    async create(formData, files = null) {
        const form = new FormData();
        
        // Add form data
        Object.keys(formData).forEach(key => {
            form.append(key, formData[key]);
        });
        
        // Add files if present
        if (files) {
            if (files.documents) {
                Array.from(files.documents).forEach(file => {
                    form.append('documents', file);
                });
            }
            if (files.images) {
                Array.from(files.images).forEach(file => {
                    form.append('images', file);
                });
            }
            if (files.videos) {
                Array.from(files.videos).forEach(file => {
                    form.append('videos', file);
                });
            }
        }
        
        try {
            const response = await authFetch('/api/listings', {
                method: 'POST',
                body: form
            });
            return await response.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    async getBrokerListings(params = {}) {
        try {
            const response = await authFetch('/api/listings/broker?' + new URLSearchParams(params));
            return await response.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    async delete(id) {
        try {
            const response = await authFetch(`/api/listings/${id}`, {
                method: 'DELETE'
            });
            return await response.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    async update(id, formData, files = null) {
        const form = new FormData();
        
        // Add form data
        Object.keys(formData).forEach(key => {
            form.append(key, formData[key]);
        });
        
        // Add files if present
        if (files) {
            if (files.documents) {
                Array.from(files.documents).forEach(file => {
                    form.append('documents', file);
                });
            }
            if (files.images) {
                Array.from(files.images).forEach(file => {
                    form.append('images', file);
                });
            }
            if (files.videos) {
                Array.from(files.videos).forEach(file => {
                    form.append('videos', file);
                });
            }
        }
        
        try {
            const response = await authFetch(`/api/listings/${id}`, {
                method: 'PUT',
                body: form
            });
            return await response.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    async getStats() {
        try {
            const response = await authFetch('/api/listings/stats');
            return await response.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// Simple loading functions
function hideLoading() {
    // Hide any loading indicators if they exist
    const loader = document.querySelector('.loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

function showLoading() {
    // Show loading indicator if it exists
    const loader = document.querySelector('.loader');
    if (loader) {
        loader.style.display = 'flex';
    }
}

// Simple modal functions
function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Token check at the very top to ensure user is logged in
if (!localStorage.getItem('token')) {
    alert('You are not logged in. Please login again.');
    window.location.href = '/plotsure_frontend/admin/login.html';
}

// Logout function (can be called from a button)
window.logout = function() {
  localStorage.removeItem('token');
  window.location.href = '/admin/login.html';
};

// Helper for authenticated fetch requests
function authFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('You are not logged in. Please login again.');
        window.location.href = '/plotsure_frontend/admin/login.html';
        return Promise.reject(new Error('No token found'));
    }
    if (!options.headers) options.headers = {};
    options.headers['Authorization'] = 'Bearer ' + token;
    return fetch(url, options).then(response => {
        if (response.status === 401) {
            // Token is invalid, logout user
            localStorage.removeItem('token');
            alert('Your session has expired. Please login again.');
            window.location.href = '/plotsure_frontend/admin/login.html';
            return Promise.reject(new Error('Invalid token'));
        }
        return response;
    });
}

// Dashboard Management
class DashboardManager {
    constructor() {
        this.currentPage = 'overview';
        this.listings = [];
        this.inquiries = [];
        this.contacts = [];
        this.stats = {};
        this.init();
    }

    async init() {
        // Check authentication
        if (!authAPI.isAuthenticated()) {
            window.location.href = '../index.html';
            return;
        }

        // Setup UI
        this.setupSidebar();
        this.setupEventListeners();
        this.loadUserInfo();
        
        // Load initial data
        await this.loadDashboardData();
        
        // Hide loading spinner
        hideLoading();
    }

    setupSidebar() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const sidebar = document.querySelector('.sidebar');

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
        }

        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
        }

        // Navigation items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.navigateToPage(page);
            });
        });
    }

    setupEventListeners() {
        // Profile form
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', this.handleProfileUpdate.bind(this));
        }

        // Password form
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', this.handlePasswordChange.bind(this));
        }

        // Create listing form
        const createListingForm = document.getElementById('createListingForm');
        if (createListingForm) {
            createListingForm.addEventListener('submit', this.handleCreateListing.bind(this));
        }

        // Filter handlers
        document.getElementById('statusFilter')?.addEventListener('change', () => this.filterListings());
        document.getElementById('searchListings')?.addEventListener('input', debounce(() => this.filterListings(), 500));
        document.getElementById('inquiryStatusFilter')?.addEventListener('change', () => this.filterInquiries());
        document.getElementById('inquiryPriorityFilter')?.addEventListener('change', () => this.filterInquiries());
        document.getElementById('contactStatusFilter')?.addEventListener('change', () => this.filterContacts());
        document.getElementById('contactPriorityFilter')?.addEventListener('change', () => this.filterContacts());
    }

    async loadUserInfo() {
        const user = authAPI.getCurrentUser();
        if (!user) return;

        // Update user info in sidebar
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userRole').textContent = user.role;

        // Update profile page
        document.getElementById('profileName').textContent = user.name;
        document.getElementById('profileEmail').textContent = user.email;
        document.getElementById('profileRole').textContent = user.role;

        // Pre-fill profile form
        document.getElementById('updateName').value = user.name;
        document.getElementById('updateEmail').value = user.email;
        document.getElementById('updatePhone').value = user.phone || '';
    }

    navigateToPage(page) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

        // Hide all pages
        document.querySelectorAll('.page-content').forEach(content => {
            content.classList.remove('active');
        });

        // Show selected page
        document.getElementById(`${page}Page`)?.classList.add('active');

        // Update page title
        const titles = {
            overview: 'Dashboard Overview',
            listings: 'My Listings',
            inquiries: 'Customer Inquiries',
            contacts: 'Contact Messages',
            profile: 'Profile Settings'
        };
        document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';

        // Load page-specific data
        this.currentPage = page;
        this.loadPageData(page);

        // Close mobile sidebar
        document.querySelector('.sidebar').classList.remove('open');
    }

    async loadPageData(page) {
        showLoading();
        
        try {
            switch (page) {
                case 'overview':
                    await this.loadDashboardData();
                    break;
                case 'listings':
                    await this.loadListings();
                    break;
                case 'inquiries':
                    await this.loadInquiries();
                    break;
                case 'contacts':
                    await this.loadContacts();
                    break;
                case 'profile':
                    // Profile data already loaded
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${page} data:`, error);
            showMessage(`Failed to load ${page} data`, 'error');
        } finally {
            hideLoading();
        }
    }

    async loadDashboardData() {
        try {
            // Load statistics
            const [listingStats, inquiryStats, contactStats] = await Promise.all([
                listingsAPI.getStats(),
                inquiriesAPI.getStats(),
                contactAPI.getStats()
            ]);

            // Update stat cards
            if (listingStats.success) {
                document.getElementById('totalListings').textContent = listingStats.data.active_listings + listingStats.data.sold_listings;
                document.getElementById('activeListings').textContent = listingStats.data.active_listings;
                document.getElementById('totalViews').textContent = this.formatNumber(listingStats.data.total_views);
            }

            if (inquiryStats.success) {
                document.getElementById('totalInquiries').textContent = 
                    inquiryStats.data.new_inquiries + inquiryStats.data.in_progress + 
                    inquiryStats.data.responded + inquiryStats.data.converted;
                
                // Update inquiry badge
                document.getElementById('inquiryBadge').textContent = inquiryStats.data.new_inquiries;
            }

            if (contactStats.success) {
                // Update contact badge
                document.getElementById('contactBadge').textContent = contactStats.data.new_contacts;
            }

            // Load recent items
            await Promise.all([
                this.loadRecentInquiries(),
                this.loadRecentListings()
            ]);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            showMessage('Failed to load dashboard data', 'error');
        }
    }

    async loadRecentInquiries() {
        const result = await inquiriesAPI.getAll({ limit: 5 });
        
        if (result.success) {
            const container = document.getElementById('recentInquiries');
            
            if (result.data.inquiries.length === 0) {
                container.innerHTML = '<p class="empty-state">No recent inquiries</p>';
                return;
            }

            container.innerHTML = result.data.inquiries.map(inquiry => `
                <div class="inquiry-item-small">
                    <div>
                        <div class="inquirer-name">${this.escapeHtml(inquiry.inquirer_name)}</div>
                        <div class="inquiry-type">${this.formatInquiryType(inquiry.inquiry_type)}</div>
                    </div>
                    <div>
                        <span class="status-${inquiry.status}">${inquiry.status}</span>
                    </div>
                </div>
            `).join('');
        }
    }

    async loadRecentListings() {
        const result = await listingsAPI.getBrokerListings({ limit: 5 });
        
        if (result.success) {
            const container = document.getElementById('recentListings');
            
            if (result.data.listings.length === 0) {
                container.innerHTML = '<p class="empty-state">No recent listings</p>';
                return;
            }

            container.innerHTML = result.data.listings.map(listing => `
                <div class="listing-item-small">
                    <div>
                        <div class="listing-title">${this.escapeHtml(listing.title)}</div>
                        <div class="listing-location">${this.escapeHtml(listing.sector)}, ${this.escapeHtml(listing.district)}</div>
                    </div>
                    <div>
                        <span class="status-${listing.status}">${listing.status}</span>
                    </div>
                </div>
            `).join('');
        }
    }

    async loadListings() {
        const result = await listingsAPI.getBrokerListings();
        
        if (result.success) {
            this.listings = result.data.listings;
            this.renderListings();
        } else {
            showMessage('Failed to load listings', 'error');
        }
    }

    renderListings() {
        const container = document.getElementById('listingsContainer');
        
        if (this.listings.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No listings yet</h3>
                    <p>Create your first listing to get started</p>
                    <button class="btn btn-primary" onclick="showCreateListingModal()">Create Listing</button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.listings.map(listing => `
            <div class="listing-item">
                <div class="listing-image">
                    ${listing.media?.length > 0 ? 
                        `<img src="${API_CONFIG.BASE_URL.replace('/api', '')}/${listing.media[0].file_path}" alt="${listing.title}">` : 
                        '🏞️'
                    }
                </div>
                <div class="listing-info">
                    <div class="listing-title">${this.escapeHtml(listing.title)}</div>
                    <div class="listing-location">${this.getFullLocation(listing)}</div>
                    <div class="listing-meta">
                        <span class="listing-price">${this.formatPrice(listing.price_amount, listing.price_currency)}</span>
                        <span class="listing-size">${listing.land_size_value} ${listing.land_size_unit}</span>
                        <span class="listing-views">👁️ ${listing.views_count || 0} views</span>
                        <span class="listing-inquiries">💬 ${listing.inquiries_count || 0} inquiries</span>
                    </div>
                </div>
                <div class="listing-status status-${listing.status}">
                    ${listing.status}
                </div>
                <div class="listing-actions">
                    <button class="btn btn-small btn-outline" onclick="editListing(${listing.id})">Edit</button>
                    <button class="btn btn-small btn-outline" onclick="viewListingStats(${listing.id})">Stats</button>
                    <button class="btn btn-small btn-danger" onclick="deleteListing(${listing.id})">Delete</button>
                </div>
            </div>
        `).join('');
    }

    async loadInquiries() {
        const result = await inquiriesAPI.getAll();
        
        if (result.success) {
            this.inquiries = result.data.inquiries;
            this.renderInquiries();
        } else {
            showMessage('Failed to load inquiries', 'error');
        }
    }

    renderInquiries() {
        const container = document.getElementById('inquiriesContainer');
        
        if (this.inquiries.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No inquiries yet</h3>
                    <p>Inquiries from customers will appear here</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.inquiries.map(inquiry => `
            <div class="inquiry-item ${inquiry.priority ? `priority-${inquiry.priority}` : ''}">
                <div class="inquiry-header">
                    <div class="inquirer-info">
                        <div class="inquirer-name">${this.escapeHtml(inquiry.inquirer_name)}</div>
                        <div class="inquiry-type">${this.formatInquiryType(inquiry.inquiry_type)}</div>
                        ${inquiry.listing ? `<div class="inquiry-listing">Re: ${this.escapeHtml(inquiry.listing.title)}</div>` : ''}
                    </div>
                    <div class="inquiry-meta">
                        <div class="inquiry-date">${this.formatDate(inquiry.created_at)}</div>
                        <div class="inquiry-status status-${inquiry.status}">${inquiry.status}</div>
                    </div>
                </div>
                <div class="inquiry-message">${this.escapeHtml(inquiry.message)}</div>
                <div class="inquiry-actions">
                    <button class="btn btn-small btn-primary" onclick="viewInquiry(${inquiry.id})">View Details</button>
                    <button class="btn btn-small btn-outline" onclick="updateInquiryStatus(${inquiry.id}, 'responded')">Mark Responded</button>
                    <button class="btn btn-small btn-success" onclick="markAsConverted(${inquiry.id})">Mark Converted</button>
                </div>
            </div>
        `).join('');
    }

    async loadContacts() {
        const result = await contactAPI.getAll();
        
        if (result.success) {
            this.contacts = result.data.contacts;
            this.renderContacts();
        } else {
            showMessage('Failed to load contacts', 'error');
        }
    }

    renderContacts() {
        const container = document.getElementById('contactsContainer');
        
        if (this.contacts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No contact messages</h3>
                    <p>Contact form submissions will appear here</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.contacts.map(contact => `
            <div class="contact-item ${contact.priority ? `priority-${contact.priority}` : ''}">
                <div class="contact-header">
                    <div class="contact-info">
                        <div class="contact-name">${this.escapeHtml(contact.name)}</div>
                        <div class="contact-email">${this.escapeHtml(contact.email)}</div>
                        <div class="contact-subject">${this.formatContactSubject(contact.subject)}</div>
                    </div>
                    <div class="contact-meta">
                        <div class="contact-date">${this.formatDate(contact.created_at)}</div>
                        <div class="contact-status status-${contact.status}">${contact.status}</div>
                    </div>
                </div>
                <div class="contact-message">${this.escapeHtml(contact.message)}</div>
                <div class="contact-actions">
                    <button class="btn btn-small btn-primary" onclick="respondToContact(${contact.id})">Respond</button>
                    <button class="btn btn-small btn-outline" onclick="updateContactStatus(${contact.id}, 'closed')">Mark Closed</button>
                </div>
            </div>
        `).join('');
    }

    async handleProfileUpdate(event) {
        event.preventDefault();
        
        const formData = {
            name: document.getElementById('updateName').value.trim(),
            email: document.getElementById('updateEmail').value.trim(),
            phone: document.getElementById('updatePhone').value.trim()
        };

        try {
            const result = await authAPI.updateProfile(formData);
            
            if (result.success) {
                showMessage(APP_CONFIG.SUCCESS_MESSAGES.PROFILE_UPDATED, 'success');
                
                // Update stored user data
                const currentUser = authAPI.getCurrentUser();
                const updatedUser = { ...currentUser, ...formData };
                localStorage.setItem(APP_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
                
                // Reload user info
                this.loadUserInfo();
            } else {
                showMessage(result.error || 'Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            showMessage('Failed to update profile', 'error');
        }
    }

    async handlePasswordChange(event) {
        event.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            showMessage('New passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showMessage('Password must be at least 6 characters long', 'error');
            return;
        }

        try {
            const result = await authAPI.changePassword(currentPassword, newPassword);
            
            if (result.success) {
                showMessage('Password changed successfully', 'success');
                document.getElementById('passwordForm').reset();
            } else {
                showMessage(result.error || 'Failed to change password', 'error');
            }
        } catch (error) {
            console.error('Password change error:', error);
            showMessage('Failed to change password', 'error');
        }
    }

    async handleCreateListing(event) {
        event.preventDefault();
        
        const formData = {
            title: document.getElementById('listingTitle').value.trim(),
            description: document.getElementById('listingDescription').value.trim(),
            land_type: document.getElementById('landType').value,
            district: document.getElementById('district').value,
            sector: document.getElementById('sector').value.trim(),
            cell: document.getElementById('cell').value.trim(),
            village: document.getElementById('village').value.trim(),
            land_size_value: parseFloat(document.getElementById('landSizeValue').value),
            land_size_unit: document.getElementById('landSizeUnit').value,
            price_amount: parseFloat(document.getElementById('priceAmount').value),
            price_currency: document.getElementById('priceCurrency').value,
            price_negotiable: document.getElementById('priceNegotiable').checked,
            landowner_name: document.getElementById('landownerName').value.trim(),
            landowner_phone: document.getElementById('landownerPhone').value.trim(),
            landowner_id_number: document.getElementById('landownerIdNumber').value.trim()
        };

        // Debug: Log the form data
        console.log('Form data being sent:', formData);

        // Frontend validation
        const errors = [];
        if (!formData.title || formData.title.length < 5) {
            errors.push('Title must be at least 5 characters long');
        }
        if (!formData.description || formData.description.length < 20) {
            errors.push('Description must be at least 20 characters long');
        }
        if (!formData.land_type) {
            errors.push('Land type is required');
        }
        if (!formData.sector) {
            errors.push('Sector is required');
        }
        if (!formData.cell) {
            errors.push('Cell is required');
        }
        if (!formData.village) {
            errors.push('Village is required');
        }
        if (!formData.land_size_value || formData.land_size_value <= 0) {
            errors.push('Land size must be a positive number');
        }
        if (!formData.price_amount || formData.price_amount <= 0) {
            errors.push('Price must be a positive number');
        }
        if (!formData.landowner_name) {
            errors.push('Landowner name is required');
        }
        if (!formData.landowner_phone) {
            errors.push('Landowner phone is required');
        }
        if (!formData.landowner_id_number) {
            errors.push('Landowner ID number is required');
        }

        if (errors.length > 0) {
            showMessage(`Please fix the following errors:\n${errors.join('\n')}`, 'error');
            return;
        }

        // Prepare files
        const files = {
            documents: document.getElementById('documents').files,
            images: document.getElementById('images').files,
            videos: document.getElementById('videos').files
        };

        try {
            const result = await listingsAPI.create(formData, files);
            
            console.log('Response status:', result.status);
            console.log('Response result:', result);
            
            if (result.success) {
                showMessage(APP_CONFIG.SUCCESS_MESSAGES.LISTING_CREATED, 'success');
                document.getElementById('createListingForm').reset();
                hideModal('createListingModal');
                this.loadListings();
            } else {
                // Show specific validation errors if available
                if (result.errors && result.errors.length > 0) {
                    const errorMessages = result.errors.map(err => `${err.path}: ${err.msg}`).join('\n');
                    showMessage(`Validation failed:\n${errorMessages}`, 'error');
            } else {
                showMessage(result.error || 'Failed to create listing', 'error');
                }
            }
        } catch (error) {
            console.error('Create listing error:', error);
            showMessage('Failed to create listing', 'error');
        }
    }

    filterListings() {
        const statusFilter = document.getElementById('statusFilter').value;
        const searchTerm = document.getElementById('searchListings').value.toLowerCase();

        const filtered = this.listings.filter(listing => {
            const matchesStatus = !statusFilter || listing.status === statusFilter;
            const matchesSearch = !searchTerm || 
                listing.title.toLowerCase().includes(searchTerm) ||
                listing.description.toLowerCase().includes(searchTerm) ||
                this.getFullLocation(listing).toLowerCase().includes(searchTerm);
            
            return matchesStatus && matchesSearch;
        });

        this.listings = filtered;
        this.renderListings();
    }

    filterInquiries() {
        // Similar implementation for inquiries
    }

    filterContacts() {
        // Similar implementation for contacts
    }

    // Utility methods
    formatInquiryType(type) {
        const types = {
            'general_interest': 'General Interest',
            'site_visit': 'Site Visit Request',
            'price_negotiation': 'Price Negotiation',
            'document_verification': 'Document Verification',
            'purchase_intent': 'Purchase Intent',
            'reservation': 'Reservation Request'
        };
        return types[type] || type;
    }

    formatContactSubject(subject) {
        const subjects = {
            'general-inquiry': 'General Inquiry',
            'plot-interest': 'Plot Interest',
            'broker-services': 'Broker Services',
            'technical-support': 'Technical Support',
            'partnership': 'Partnership'
        };
        return subjects[subject] || subject;
    }

    getFullLocation(listing) {
        return `${listing.village}, ${listing.cell}, ${listing.sector}, ${listing.district}`;
    }

    formatPrice(amount, currency = 'RWF') {
        const symbol = APP_CONFIG.CURRENCY.SYMBOLS[currency] || currency;
        return `${this.formatNumber(amount)} ${symbol}`;
    }

    formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        
        return date.toLocaleDateString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global functions
window.showCreateListingModal = () => {
    showModal('createListingModal');
};

window.editListing = async (id) => {
    // Implementation for editing listing
    showMessage('Edit functionality coming soon', 'info');
};

window.viewListingStats = async (id) => {
    // Implementation for viewing listing statistics
    showMessage('Statistics view coming soon', 'info');
};

window.deleteListing = async (id) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    
    try {
        const result = await listingsAPI.delete(id);
        
        if (result.success) {
            showMessage(APP_CONFIG.SUCCESS_MESSAGES.LISTING_DELETED, 'success');
            dashboardManager.loadListings();
        } else {
            showMessage(result.error || 'Failed to delete listing', 'error');
        }
    } catch (error) {
        console.error('Delete listing error:', error);
        showMessage('Failed to delete listing', 'error');
    }
};

window.viewInquiry = async (id) => {
    try {
        const result = await inquiriesAPI.getById(id);
        
        if (result.success) {
            showInquiryModal(result.data.inquiry);
        } else {
            showMessage(result.error || 'Failed to load inquiry', 'error');
        }
    } catch (error) {
        console.error('View inquiry error:', error);
        showMessage('Failed to load inquiry', 'error');
    }
};

window.updateInquiryStatus = async (id, status) => {
    try {
        const result = await inquiriesAPI.updateStatus(id, { status });
        
        if (result.success) {
            showMessage('Inquiry status updated', 'success');
            dashboardManager.loadInquiries();
        } else {
            showMessage(result.error || 'Failed to update status', 'error');
        }
    } catch (error) {
        console.error('Update inquiry status error:', error);
        showMessage('Failed to update status', 'error');
    }
};

window.markAsConverted = async (id) => {
    const value = prompt('Enter conversion value (optional):');
    
    try {
        const result = await inquiriesAPI.markConverted(id, value ? parseFloat(value) : null);
        
        if (result.success) {
            showMessage('Inquiry marked as converted!', 'success');
            dashboardManager.loadInquiries();
        } else {
            showMessage(result.error || 'Failed to mark as converted', 'error');
        }
    } catch (error) {
        console.error('Mark converted error:', error);
        showMessage('Failed to mark as converted', 'error');
    }
};

window.respondToContact = async (id) => {
    // Implementation for responding to contact
    showMessage('Response functionality coming soon', 'info');
};

window.updateContactStatus = async (id, status) => {
    try {
        const result = await contactAPI.updateStatus(id, { status });
        
        if (result.success) {
            showMessage('Contact status updated', 'success');
            dashboardManager.loadContacts();
        } else {
            showMessage(result.error || 'Failed to update status', 'error');
        }
    } catch (error) {
        console.error('Update contact status error:', error);
        showMessage('Failed to update status', 'error');
    }
};

function showInquiryModal(inquiry) {
    const modal = document.getElementById('inquiryDetailModal');
    const content = document.getElementById('inquiryDetailContent');
    
    if (!modal || !content) return;
    
    content.innerHTML = `
        <div class="inquiry-detail">
            <div class="inquiry-detail-header">
                <h3>${dashboardManager.escapeHtml(inquiry.inquirer_name)}</h3>
                <span class="inquiry-status-badge status-${inquiry.status}">${inquiry.status}</span>
            </div>
            
            <div class="detail-section">
                <h4>Contact Information</h4>
                <p><strong>Email:</strong> ${dashboardManager.escapeHtml(inquiry.inquirer_email)}</p>
                <p><strong>Phone:</strong> ${dashboardManager.escapeHtml(inquiry.inquirer_phone)}</p>
                <p><strong>Location:</strong> ${dashboardManager.escapeHtml(inquiry.inquirer_location || 'Not specified')}</p>
                <p><strong>Diaspora:</strong> ${inquiry.is_diaspora ? 'Yes' : 'No'}</p>
            </div>
            
            <div class="detail-section">
                <h4>Inquiry Details</h4>
                <p><strong>Type:</strong> ${dashboardManager.formatInquiryType(inquiry.inquiry_type)}</p>
                <p><strong>Budget:</strong> ${dashboardManager.formatPrice(inquiry.budget_min)} - ${dashboardManager.formatPrice(inquiry.budget_max)}</p>
                <p><strong>Timeframe:</strong> ${inquiry.timeframe}</p>
                ${inquiry.listing ? `<p><strong>Property:</strong> ${dashboardManager.escapeHtml(inquiry.listing.title)}</p>` : ''}
            </div>
            
            <div class="detail-section">
                <h4>Message</h4>
                <div class="inquiry-message-full">${dashboardManager.escapeHtml(inquiry.message)}</div>
            </div>
            
            <div class="inquiry-detail-actions">
                <button class="btn btn-primary" onclick="updateInquiryStatus(${inquiry.id}, 'responded')">Mark as Responded</button>
                <button class="btn btn-success" onclick="markAsConverted(${inquiry.id})">Mark as Converted</button>
                <button class="btn btn-outline" onclick="hideModal('inquiryDetailModal')">Close</button>
            </div>
        </div>
    `;
    
    showModal('inquiryDetailModal');
}

// Initialize dashboard
let dashboardManager;

document.addEventListener('DOMContentLoaded', function() {
    // Modal open/close logic
    const addListingBtn = document.getElementById('addListingBtn');
    const addListingModal = document.getElementById('addListingModal');
    const closeAddListingModal = document.getElementById('closeAddListingModal');
    const cancelAddListing = document.getElementById('cancelAddListing');
    const addListingForm = document.getElementById('addListingForm');

    function openModal() {
        console.log('Opening Add Listing modal...');
        if (addListingModal) {
            addListingModal.style.display = 'flex';
            // Reset form when opening
            if (addListingForm) {
                addListingForm.reset();
            }
        } else {
            console.error('Add Listing modal not found!');
        }
    }
    
    function closeModal() {
        console.log('Closing Add Listing modal...');
        if (addListingModal) {
            addListingModal.style.display = 'none';
        }
        if (addListingForm) {
            addListingForm.reset();
            // Clear file previews
            ['documentsPreview', 'imagesPreview', 'videosPreview'].forEach(previewId => {
                const preview = document.getElementById(previewId);
                if (preview) preview.innerHTML = '';
            });
        }
    }
    
    if (addListingBtn) {
        addListingBtn.addEventListener('click', openModal);
        console.log('Add Listing button event listener attached');
    } else {
        console.error('Add Listing button not found!');
    }
    
    if (closeAddListingModal) {
        closeAddListingModal.addEventListener('click', closeModal);
    }
    
    if (cancelAddListing) {
        cancelAddListing.addEventListener('click', closeModal);
    }
    
    window.addEventListener('click', function(e) {
        if (e.target === addListingModal) {
            closeModal();
        }
    });

    // Handle Add Listing form submission
    if (addListingForm) {
        addListingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Add Listing form submitted');
            
            // Show loading state
            const submitBtn = addListingForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';

            const formData = new FormData(addListingForm);
            
            // Log form data for debugging
            console.log('Form data entries:');
            for (let [key, value] of formData.entries()) {
                console.log(key, value);
            }
            
            try {
                const response = await authFetch('/api/listings', {
                    method: 'POST',
                    body: formData,
                });
                
                console.log('Response status:', response.status);
                const result = await response.json();
                console.log('Response result:', result);
                
                if (result.success) {
                    alert('Listing created successfully!');
                    closeModal();
                    // Refresh listings
                    if (typeof fetchAndRenderDashboardListings === 'function') {
                        fetchAndRenderDashboardListings(1);
                    }
                } else {
                    alert(result.message || 'Failed to create listing.');
                }
            } catch (err) {
                console.error('Error submitting listing:', err);
                alert('Error submitting listing. Please try again.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
        console.log('Add Listing form event listener attached');
    } else {
        console.error('Add Listing form not found!');
    }

    // Sidebar navigation
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            // Map sidebar link text to section id
            const sectionMap = {
                'Dashboard': 'listings',
                'Listings': 'listings',
                'Inquiries': 'inquiries',
                'Contacts': 'contacts',
                'Profile': 'profile'
            };
            // Get the visible text (second span)
            const sectionText = this.querySelector('span:last-child').textContent.trim();
            const sectionKey = sectionMap[sectionText] || 'listings';
            showSection(sectionKey);
            // Update top bar title
            const sectionTitle = document.getElementById('sectionTitle');
            if (sectionTitle) sectionTitle.textContent = sectionText;
        });
    });

    // Section tab navigation
    document.querySelectorAll('.tabs').forEach(tabGroup => {
        tabGroup.addEventListener('click', function(e) {
            if (e.target.classList.contains('tab-btn')) {
                const tabBtns = this.querySelectorAll('.tab-btn');
                tabBtns.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                // Optionally: filter cards here
            }
        });
    });

    // Initial render
    showSection('listings');
    renderListings();
    // renderInquiries(); // Removed - function is inside DashboardManager class
    // renderContacts(); // Removed - function is inside DashboardManager class
    // renderProfile(); // Removed - function is inside DashboardManager class

    // Add event listener for edit form submission
    const editForm = document.getElementById('editListingForm');
    if (editForm) {
        editForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const formData = new FormData(editForm);
            const listingId = formData.get('id');
            
            // Convert FormData to object
            const updateData = {};
            for (let [key, value] of formData.entries()) {
                if (key !== 'id') {
                    updateData[key] = value;
                }
            }
            
            try {
                const result = await listingsAPI.update(listingId, updateData);
                
                            if (result.success) {
                showMessage('Listing updated successfully!', 'success');
                hideModal('editListingModal');
                // Refresh listings
                if (typeof fetchAndRenderDashboardListings === 'function') {
                    fetchAndRenderDashboardListings(1);
                }
            } else {
                    if (result.errors && result.errors.length > 0) {
                        const errorMessages = result.errors.map(err => `${err.path}: ${err.msg}`).join('\n');
                        showMessage(`Validation failed:\n${errorMessages}`, 'error');
                    } else {
                        showMessage(result.error || 'Failed to update listing', 'error');
                    }
                }
            } catch (error) {
                console.error('Update listing error:', error);
                showMessage('Failed to update listing', 'error');
            }
        });
    }
});

function showSection(section) {
    document.querySelectorAll('.dashboard-section').forEach(sec => sec.style.display = 'none');
    const id = `section-${section}`;
    const el = document.getElementById(id);
    if (el) el.style.display = 'block';
    // Optionally: update section title
}

function renderListings() {
    const grid = document.getElementById('listingsGrid');
    if (!grid) return;
    authFetch('/api/listings')
        .then(res => res.json())
        .then(data => {
            if (!data.success || !data.data || !data.data.listings) {
                grid.innerHTML = '<div style="text-align:center; padding:3rem; color:#64748b; font-size:1.1rem;">No listings found.</div>';
                return;
            }
            const listings = data.data.listings;
            grid.innerHTML = listings.map((listing, idx) => {
                // Primary image
                let primaryImg = '';
                if (listing.media && listing.media.length > 0) {
                    const primary = listing.media.find(m => m.media_type === 'image' && m.is_primary) || listing.media.find(m => m.media_type === 'image');
                    if (primary) {
                        primaryImg = `<img src="/uploads/images/${primary.file_name}" alt="${listing.title}" style="width:100%; height:200px; object-fit:cover; border-radius:12px 12px 0 0;">`;
                    }
                }
                if (!primaryImg) {
                    primaryImg = `<div style="width:100%; height:200px; background:linear-gradient(135deg, #e6f9e6 0%, #d1f2d1 100%); display:flex; align-items:center; justify-content:center; font-size:3rem; color:#27ae60; border-radius:12px 12px 0 0; border:2px dashed #27ae60;">🏞️</div>`;
                }
                
                // Status badge
                const statusColors = {
                    'available': '#27ae60',
                    'reserved': '#f39c12',
                    'sold': '#e74c3c',
                    'pending': '#9b59b6'
                };
                const statusColor = statusColors[listing.status] || '#27ae60';
                const statusBadge = `<span style="position:absolute; top:12px; right:12px; background:${statusColor}; color:#fff; padding:4px 12px; border-radius:20px; font-size:0.75rem; font-weight:600; text-transform:uppercase;">${listing.status || 'Available'}</span>`;
                
                // Price and size info
                const price = listing.price ? `RWF ${listing.price.toLocaleString()}` : 'Price on request';
                const size = listing.plot_size ? `${listing.plot_size} ${listing.plot_size_unit || 'sqm'}` : 'Size not specified';
                
                // Media indicators
                let mediaIndicators = '';
                if (listing.media && listing.media.length > 0) {
                    const imageCount = listing.media.filter(m => m.media_type === 'image').length;
                    const videoCount = listing.media.filter(m => m.media_type === 'video').length;
                    const docCount = listing.documents ? listing.documents.length : 0;
                    
                    mediaIndicators = '<div style="display:flex; gap:8px; margin-top:12px; font-size:0.8rem; color:#64748b;">';
                    if (imageCount > 0) mediaIndicators += `<span>📷 ${imageCount} photos</span>`;
                    if (videoCount > 0) mediaIndicators += `<span>🎬 ${videoCount} videos</span>`;
                    if (docCount > 0) mediaIndicators += `<span>📄 ${docCount} docs</span>`;
                    mediaIndicators += '</div>';
                }
                
                return `
                <div class="dashboard-card listing-card" data-idx="${idx}" style="cursor:pointer; position:relative; background:#fff; border-radius:12px; box-shadow:0 4px 20px rgba(39,174,96,0.08); transition:all 0.3s ease; overflow:hidden; border:1px solid #e5e7eb;">
                    ${statusBadge}
                    ${primaryImg}
                    <div style="padding:1.5rem;">
                        <div style="margin-bottom:0.5rem;">
                            <h3 style="font-size:1.25rem; font-weight:700; color:#1f2937; margin:0 0 0.5rem 0; line-height:1.3;">${listing.title}</h3>
                            <p style="color:#64748b; font-size:0.9rem; margin:0; display:flex; align-items:center; gap:4px;">
                                📍 ${listing.sector}, ${listing.district}
                            </p>
                        </div>
                        
                        <div style="display:flex; justify-content:space-between; align-items:center; margin:1rem 0;">
                            <div>
                                <div style="font-size:1.1rem; font-weight:700; color:#27ae60;">${price}</div>
                                <div style="font-size:0.85rem; color:#64748b;">${size}</div>
                            </div>
                            <div style="text-align:right;">
                                <div style="font-size:0.8rem; color:#64748b;">Land Type</div>
                                <div style="font-size:0.9rem; font-weight:600; color:#374151; text-transform:capitalize;">${listing.land_type || 'Not specified'}</div>
                            </div>
                        </div>
                        
                        ${mediaIndicators}
                        
                        <div style="margin-top:1rem; padding-top:1rem; border-top:1px solid #f1f5f9;">
                            <div style="display:flex; gap:8px; justify-content:space-between;">
                                <button class="btn btn-outline btn-edit-listing" data-idx="${idx}" style="flex:1; padding:0.6rem 1rem; border-radius:8px; font-size:0.85rem; font-weight:600;">
                                    ✏️ Edit
                                </button>
                                <button class="btn btn-outline btn-danger btn-delete-listing" data-id="${listing.id}" style="flex:1; padding:0.6rem 1rem; border-radius:8px; font-size:0.85rem; font-weight:600;">
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                `;
            }).join('');
            
            // Add hover effects
            document.querySelectorAll('.listing-card').forEach(card => {
                card.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-4px)';
                    this.style.boxShadow = '0 8px 30px rgba(39,174,96,0.15)';
                });
                
                card.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = '0 4px 20px rgba(39,174,96,0.08)';
                });
                
                // Card click handler
                card.addEventListener('click', function(e) {
                    // Prevent click if Edit or Delete button was clicked
                    if (e.target.classList.contains('btn-delete-listing') || e.target.classList.contains('btn-edit-listing')) return;
                    const idx = this.getAttribute('data-idx');
                    showListingDetails(listings[idx]);
                });
            });
            
            // Add delete listeners
            document.querySelectorAll('.btn-delete-listing').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const id = this.getAttribute('data-id');
                    deleteListing(id);
                });
            });
            
            // Add edit listeners
            document.querySelectorAll('.btn-edit-listing').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const idx = this.getAttribute('data-idx');
                    openEditListingModal(listings[idx]);
                });
            });
        })
        .catch(() => {
            grid.innerHTML = '<div style="text-align:center; padding:3rem; color:#ef4444; font-size:1.1rem;">Error loading listings.</div>';
        });
}

// Edit button in details modal
function showListingDetails(listing) {
    const modal = document.getElementById('viewListingModal');
    const content = document.getElementById('viewListingContent');
    if (!modal || !content) return;
    // Build details HTML
    let images = '';
    if (listing.media && listing.media.some(m => m.media_type === 'image')) {
        images = '<div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:1rem;">' +
            listing.media.filter(m => m.media_type === 'image').map(m =>
                `<img src="/uploads/images/${m.file_name}" alt="img" style="width:120px; height:90px; object-fit:cover; border-radius:8px;">`
            ).join('') + '</div>';
    }
    let videos = '';
    if (listing.media && listing.media.some(m => m.media_type === 'video')) {
        videos = '<div style="margin-bottom:1rem;">' +
            listing.media.filter(m => m.media_type === 'video').map(m =>
                `<video src="/uploads/videos/${m.file_name}" controls style="width:180px; height:120px; border-radius:8px; margin-right:8px; margin-bottom:8px;"></video>`
            ).join('') + '</div>';
    }
    let docs = '';
    if (listing.documents && listing.documents.length > 0) {
        docs = '<div style="margin-bottom:1rem;">' +
            listing.documents.map(doc =>
                `<a href="/uploads/documents/${doc.file_name}" target="_blank" style="margin-right:12px; color:#219150; text-decoration:underline;">📄 ${doc.name}</a>`
            ).join('') + '</div>';
    }
    // Edit and Delete buttons in modal
    let editBtn = `<button class="btn btn-outline btn-edit-listing-modal" data-id="${listing.id}" style="border-color:#27ae60; color:#27ae60; float:right; margin-bottom:1rem; margin-right:8px;">Edit</button>`;
    let deleteBtn = `<button class="btn btn-outline btn-delete-listing-modal" data-id="${listing.id}" style="border-color:#ef4444; color:#ef4444; float:right; margin-bottom:1rem;">Delete</button>`;
    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <h2 style="color:#27ae60; font-weight:800; margin-bottom:0.5rem;">${listing.title}</h2>
            <div>${editBtn}${deleteBtn}</div>
        </div>
        <div style="color:#475569; margin-bottom:1rem;">${listing.sector}, ${listing.cell}, ${listing.village}, ${listing.district}</div>
        <div style="margin-bottom:1rem;">${listing.description}</div>
        <div style="margin-bottom:1rem;"><b>Land Size:</b> ${listing.land_size_value} ${listing.land_size_unit} &nbsp; <b>Price:</b> ${listing.price_amount} ${listing.price_currency} ${listing.price_negotiable ? '(Negotiable)' : ''}</div>
        <div style="margin-bottom:1rem;"><b>Landowner:</b> ${listing.landowner_name} &nbsp; <b>Phone:</b> ${listing.landowner_phone} &nbsp; <b>ID:</b> ${listing.landowner_id_number}</div>
        <div style="margin-bottom:1rem;"><b>Status:</b> ${listing.status || 'Available'} &nbsp; <b>Created:</b> ${new Date(listing.created_at).toLocaleDateString()}</div>
        ${images}
        ${videos}
        ${docs}
    `;
    modal.style.display = 'flex';
    // Add delete listener in modal
    const deleteBtnModal = document.querySelector('.btn-delete-listing-modal');
    if (deleteBtnModal) {
        deleteBtnModal.addEventListener('click', function() {
            deleteListing(listing.id);
        });
    }
    // Add edit listener in modal
    const editBtnModal = document.querySelector('.btn-edit-listing-modal');
    if (editBtnModal) {
        editBtnModal.addEventListener('click', function() {
            openEditListingModal(listing);
        });
    }
}

// Open Edit Listing modal and populate form
// Working Edit Modal Function - Replace the current one in dashboard.js
function openEditListingModal(listing) {
    const modal = document.getElementById('editListingModal');
    const form = document.getElementById('editListingForm');
    if (!modal || !form) {
        console.error('Modal or form not found');
        return;
    }
    
    console.log('Opening edit modal for listing:', listing);
    
    // Build form fields (pre-filled)
    form.innerHTML = `
        <input type="hidden" name="id" value="${listing.id}">
        
        <!-- Listing Details -->
        <div style="background:#f8fafc; padding:1.5rem; border-radius:12px; border-left:4px solid #27ae60; margin-bottom:1.5rem;">
            <div style="font-weight:700; color:#27ae60; margin-bottom:1rem; font-size:1.1rem;">📋 Listing Details</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                <div>
                    <label style="font-weight:600; color:#374151; margin-bottom:0.5rem; display:block;">Title*</label>
                    <input type="text" name="title" required value="${listing.title || ''}" style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #e5e7eb; font-size:1rem;">
                </div>
                <div>
                    <label style="font-weight:600; color:#374151; margin-bottom:0.5rem; display:block;">Land Type*</label>
                    <select name="land_type" required style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #e5e7eb; font-size:1rem;">
                        <option value="">Select type</option>
                        <option value="residential" ${listing.land_type === 'residential' ? 'selected' : ''}>Residential</option>
                        <option value="commercial" ${listing.land_type === 'commercial' ? 'selected' : ''}>Commercial</option>
                        <option value="agricultural" ${listing.land_type === 'agricultural' ? 'selected' : ''}>Agricultural</option>
                        <option value="industrial" ${listing.land_type === 'industrial' ? 'selected' : ''}>Industrial</option>
                        <option value="mixed" ${listing.land_type === 'mixed' ? 'selected' : ''}>Mixed Use</option>
                    </select>
                </div>
            </div>
            <div style="margin-top:1rem;">
                <label style="font-weight:600; color:#374151; margin-bottom:0.5rem; display:block;">Description*</label>
                <textarea name="description" required rows="4" style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #e5e7eb; font-size:1rem; resize:vertical;">${listing.description || ''}</textarea>
            </div>
        </div>

        <!-- Location -->
        <div style="background:#f8fafc; padding:1.5rem; border-radius:12px; border-left:4px solid #27ae60; margin-bottom:1.5rem;">
            <div style="font-weight:700; color:#27ae60; margin-bottom:1rem; font-size:1.1rem;">📍 Location</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                <div>
                    <label style="font-weight:600; color:#374151; margin-bottom:0.5rem; display:block;">District*</label>
                    <input type="text" name="district" value="${listing.district || 'Bugesera'}" required style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #e5e7eb; font-size:1rem;">
                </div>
                <div>
                    <label style="font-weight:600; color:#374151; margin-bottom:0.5rem; display:block;">Sector*</label>
                    <input type="text" name="sector" value="${listing.sector || ''}" required style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #e5e7eb; font-size:1rem;">
                </div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-top:1rem;">
                <div>
                    <label style="font-weight:600; color:#374151; margin-bottom:0.5rem; display:block;">Cell*</label>
                    <input type="text" name="cell" value="${listing.cell || ''}" required style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #e5e7eb; font-size:1rem;">
                </div>
                <div>
                    <label style="font-weight:600; color:#374151; margin-bottom:0.5rem; display:block;">Village*</label>
                    <input type="text" name="village" value="${listing.village || ''}" required style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #e5e7eb; font-size:1rem;">
                </div>
            </div>
        </div>

        <!-- Size & Price -->
        <div style="background:#f8fafc; padding:1.5rem; border-radius:12px; border-left:4px solid #27ae60; margin-bottom:1.5rem;">
            <div style="font-weight:700; color:#27ae60; margin-bottom:1rem; font-size:1.1rem;">💰 Size & Price</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                <div>
                    <label style="font-weight:600; color:#374151; margin-bottom:0.5rem; display:block;">Land Size*</label>
                    <input type="number" name="plot_size" min="1" step="0.01" value="${listing.plot_size || ''}" required style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #e5e7eb; font-size:1rem;">
                </div>
                <div>
                    <label style="font-weight:600; color:#374151; margin-bottom:0.5rem; display:block;">Unit*</label>
                    <select name="plot_size_unit" required style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #e5e7eb; font-size:1rem;">
                        <option value="sqm" ${listing.plot_size_unit === 'sqm' ? 'selected' : ''}>Square Meters</option>
                        <option value="hectares" ${listing.plot_size_unit === 'hectares' ? 'selected' : ''}>Hectares</option>
                        <option value="acres" ${listing.plot_size_unit === 'acres' ? 'selected' : ''}>Acres</option>
                    </select>
                </div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-top:1rem;">
                <div>
                    <label style="font-weight:600; color:#374151; margin-bottom:0.5rem; display:block;">Price*</label>
                    <input type="number" name="price" min="0" value="${listing.price || ''}" required style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #e5e7eb; font-size:1rem;">
                </div>
                <div>
                    <label style="font-weight:600; color:#374151; margin-bottom:0.5rem; display:block;">Currency*</label>
                    <select name="price_currency" required style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #e5e7eb; font-size:1rem;">
                        <option value="RWF" ${listing.price_currency === 'RWF' ? 'selected' : ''}>RWF</option>
                        <option value="USD" ${listing.price_currency === 'USD' ? 'selected' : ''}>USD</option>
                    </select>
                </div>
            </div>
            <div style="margin-top:1rem;">
                <label style="display:flex; align-items:center; gap:0.5rem; font-weight:600; color:#374151;">
                    <input type="checkbox" name="price_negotiable" ${listing.price_negotiable ? 'checked' : ''} style="margin:0;">
                    Price is negotiable
                </label>
            </div>
        </div>

        <!-- Landowner Info -->
        <div style="background:#f8fafc; padding:1.5rem; border-radius:12px; border-left:4px solid #27ae60; margin-bottom:1.5rem;">
            <div style="font-weight:700; color:#27ae60; margin-bottom:1rem; font-size:1.1rem;">👤 Landowner Info</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                <div>
                    <label style="font-weight:600; color:#374151; margin-bottom:0.5rem; display:block;">Landowner Name*</label>
                    <input type="text" name="landowner_name" value="${listing.landowner_name || ''}" required style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #e5e7eb; font-size:1rem;">
                </div>
                <div>
                    <label style="font-weight:600; color:#374151; margin-bottom:0.5rem; display:block;">Landowner Phone*</label>
                    <input type="tel" name="landowner_phone" value="${listing.landowner_phone || ''}" required style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #e5e7eb; font-size:1rem;">
                </div>
            </div>
            <div style="margin-top:1rem;">
                <label style="font-weight:600; color:#374151; margin-bottom:0.5rem; display:block;">Landowner ID Number*</label>
                <input type="text" name="landowner_id_number" value="${listing.landowner_id_number || ''}" required style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #e5e7eb; font-size:1rem;">
            </div>
        </div>

        <!-- File Upload -->
        <div style="background:#f8fafc; padding:1.5rem; border-radius:12px; border-left:4px solid #27ae60; margin-bottom:1.5rem;">
            <div style="font-weight:700; color:#27ae60; margin-bottom:1rem; font-size:1.1rem;">📁 Upload New Files</div>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:1rem;">
                <div>
                    <label style="font-weight:600; color:#374151; margin-bottom:0.5rem; display:block;">Documents</label>
                    <input type="file" name="documents" multiple accept=".pdf,.doc,.docx,image/*" style="width:100%; padding:0.5rem; border-radius:8px; border:1px solid #e5e7eb;">
                </div>
                <div>
                    <label style="font-weight:600; color:#374151; margin-bottom:0.5rem; display:block;">Images</label>
                    <input type="file" name="images" multiple accept="image/*" style="width:100%; padding:0.5rem; border-radius:8px; border:1px solid #e5e7eb;">
                </div>
                <div>
                    <label style="font-weight:600; color:#374151; margin-bottom:0.5rem; display:block;">Videos</label>
                    <input type="file" name="videos" multiple accept="video/*" style="width:100%; padding:0.5rem; border-radius:8px; border:1px solid #e5e7eb;">
                </div>
            </div>
        </div>

        <!-- Submit Buttons -->
        <div style="display:flex; gap:1rem; justify-content:center; margin-top:2rem; padding-top:2rem; border-top:1px solid #e5e7eb;">
            <button type="button" id="cancelEditListing" class="btn btn-outline" style="border-color:#64748b; color:#64748b; padding:1rem 2rem; font-weight:600; border-radius:10px; min-width:120px;">Cancel</button>
            <button type="submit" class="btn btn-primary" style="background:#27ae60; color:#fff; padding:1rem 2rem; font-weight:600; border-radius:10px; min-width:120px; border:none; font-size:1.1rem;">✅ Update Listing</button>
        </div>
    `;
    
    // Show the modal
    showModal('editListingModal');
    console.log('Modal should be visible now');
    
    // Add event listeners for cancel button
    const cancelBtn = document.getElementById('cancelEditListing');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            console.log('Cancel button clicked');
            hideModal('editListingModal');
        });
    }
    
    // Form submit logic
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Form submitted');
        
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Updating...';
        
        try {
            const formData = new FormData(form);
            const listingId = formData.get('id');
            
            console.log('Submitting update for listing ID:', listingId);
            console.log('Form data entries:');
            for (let [key, value] of formData.entries()) {
                console.log(key, value);
            }
            
            const response = await authFetch(`/api/listings/${listingId}`, {
                method: 'PUT',
                body: formData,
            });
            const result = await response.json();
            
            console.log('Update response:', result);
            
            if (result.success) {
                showMessage('Listing updated successfully!', 'success');
                hideModal('editListingModal');
                // Refresh listings
                if (typeof fetchAndRenderDashboardListings === 'function') {
                    fetchAndRenderDashboardListings(1);
                }
            } else {
                if (result.errors && result.errors.length > 0) {
                    const errorMessages = result.errors.map(err => `${err.path}: ${err.msg}`).join('\n');
                    showMessage(`Validation failed:\n${errorMessages}`, 'error');
                } else {
                    showMessage(result.error || 'Failed to update listing', 'error');
                }
            }
        } catch (error) {
            console.error('Update listing error:', error);
            showMessage('Failed to update listing', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '✅ Update Listing';
        }
    });
}

// Simple function to refresh dashboard listings
function fetchAndRenderDashboardListings(page = 1) {
    console.log('Refreshing dashboard listings...');
    location.reload(); // Simple page refresh for now
}