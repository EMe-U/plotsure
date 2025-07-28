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