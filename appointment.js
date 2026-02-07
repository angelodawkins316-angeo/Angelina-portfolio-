// ============================================
// APPOINTMENT FORM HANDLING
// ============================================

const appointmentForm = document.getElementById('appointmentForm');
const successMessage = document.getElementById('successMessage');

// Form submission handler
appointmentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(appointmentForm);
    const data = Object.fromEntries(formData.entries());
    
    // Add checkboxes separately
    data.maintenance = document.getElementById('maintenance').checked;
    data.hosting = document.getElementById('hosting').checked;
    data.seo = document.getElementById('seo').checked;
    
    // Validate form
    if (!validateForm(data)) {
        return;
    }
    
    // Show loading state
    const submitBtn = appointmentForm.querySelector('.btn-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<ion-icon name="hourglass-outline"></ion-icon><span>Submitting...</span>';
    submitBtn.disabled = true;
    
    try {
        // Simulate API call (in production, this would send to a server)
        await submitAppointment(data);
        
        // Show success message
        successMessage.classList.add('active');
        
        // Reset form
        appointmentForm.reset();
        
        // Send confirmation email notification (in production)
        console.log('Appointment request submitted:', data);
        
    } catch (error) {
        console.error('Error submitting appointment:', error);
        alert('There was an error submitting your request. Please try again or contact us directly.');
    } finally {
        // Reset button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// Form validation
function validateForm(data) {
    // Required fields
    const requiredFields = ['firstName', 'surname', 'email', 'whatsapp', 'phone', 'location', 'work', 'ranking', 'description'];
    
    for (const field of requiredFields) {
        if (!data[field] || data[field].trim() === '') {
            alert(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`);
            document.getElementById(field).focus();
            return false;
        }
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        alert('Please enter a valid email address.');
        document.getElementById('email').focus();
        return false;
    }
    
    // Phone validation (basic)
    const phoneRegex = /^[\d\s\+\-\(\)]+$/;
    if (!phoneRegex.test(data.whatsapp) || !phoneRegex.test(data.phone)) {
        alert('Please enter valid phone numbers.');
        return false;
    }
    
    return true;
}

// Simulate API call
function submitAppointment(data) {
    return new Promise((resolve) => {
        // In production, this would be:
        // fetch('/api/appointments', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(data)
        // })
        
        setTimeout(() => {
            // Store in localStorage for demo purposes
            const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
            appointments.push({
                ...data,
                id: Date.now(),
                timestamp: new Date().toISOString(),
                status: 'pending'
            });
            localStorage.setItem('appointments', JSON.stringify(appointments));
            
            resolve();
        }, 1500);
    });
}

// ============================================
// PHONE NUMBER FORMATTING
// ============================================

const phoneInputs = document.querySelectorAll('input[type="tel"]');

phoneInputs.forEach(input => {
    input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        
        // Auto-format Nigerian phone numbers
        if (value.startsWith('234')) {
            value = '+' + value;
        } else if (value.startsWith('0')) {
            value = '+234' + value.substring(1);
        }
        
        e.target.value = value;
    });
});

// ============================================
// DYNAMIC FORM BEHAVIOR
// ============================================

// Show/hide additional options based on work type
const workSelect = document.getElementById('work');
const rankingSelect = document.getElementById('ranking');

workSelect.addEventListener('change', (e) => {
    const workType = e.target.value;
    
    // Update ranking options based on work type
    if (workType === 'graphics') {
        updateRankingOptions([
            { value: 'basic', text: 'Basic - Logo & simple graphics' },
            { value: 'advance', text: 'Advance - Full branding package' },
            { value: 'premium', text: 'Premium - Complete visual identity' }
        ]);
    } else if (workType === 'ecommerce') {
        updateRankingOptions([
            { value: 'basic', text: 'Basic - Up to 50 products' },
            { value: 'advance', text: 'Advance - Up to 200 products' },
            { value: 'premium', text: 'Premium - Unlimited products' },
            { value: 'enterprise', text: 'Enterprise - Multi-vendor marketplace' }
        ]);
    } else if (workType === 'landing') {
        updateRankingOptions([
            { value: 'basic', text: 'Basic - Single section landing page' },
            { value: 'advance', text: 'Advance - Multi-section with animations' },
            { value: 'premium', text: 'Premium - Advanced interactive features' }
        ]);
    } else {
        // Default ranking options
        updateRankingOptions([
            { value: 'basic', text: 'Basic - Simple design & functionality' },
            { value: 'landing', text: 'Landing Page - Single page showcase' },
            { value: 'advance', text: 'Advance - Enhanced features & design' },
            { value: 'premium', text: 'Premium - Full-featured solution' },
            { value: 'ecommerce', text: 'E-Commerce - Online store setup' },
            { value: 'enterprise', text: 'Enterprise - Large-scale project' }
        ]);
    }
});

function updateRankingOptions(options) {
    const currentValue = rankingSelect.value;
    rankingSelect.innerHTML = '<option value="">Select Package...</option>';
    
    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;
        rankingSelect.appendChild(opt);
    });
    
    // Restore previous value if it exists in new options
    if (options.find(opt => opt.value === currentValue)) {
        rankingSelect.value = currentValue;
    }
}

// ============================================
// AUTO-SAVE DRAFT
// ============================================

let saveTimeout;

appointmentForm.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    
    saveTimeout = setTimeout(() => {
        const formData = new FormData(appointmentForm);
        const data = Object.fromEntries(formData.entries());
        
        localStorage.setItem('appointmentDraft', JSON.stringify(data));
        console.log('Draft saved');
    }, 1000);
});

// Load draft on page load
window.addEventListener('load', () => {
    const draft = localStorage.getItem('appointmentDraft');
    
    if (draft) {
        const data = JSON.parse(draft);
        
        // Ask user if they want to restore the draft
        if (confirm('Would you like to restore your previous draft?')) {
            Object.keys(data).forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    element.value = data[key];
                }
            });
        } else {
            localStorage.removeItem('appointmentDraft');
        }
    }
});

// Clear draft when form is successfully submitted
appointmentForm.addEventListener('submit', () => {
    localStorage.removeItem('appointmentDraft');
});

// ============================================
// CHARACTER COUNTER FOR TEXTAREAS
// ============================================

const textareas = document.querySelectorAll('textarea');

textareas.forEach(textarea => {
    const maxLength = textarea.getAttribute('maxlength');
    
    if (maxLength) {
        const counter = document.createElement('div');
        counter.className = 'char-counter';
        counter.style.cssText = 'text-align: right; font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;';
        
        textarea.parentElement.appendChild(counter);
        
        const updateCounter = () => {
            const remaining = maxLength - textarea.value.length;
            counter.textContent = `${remaining} characters remaining`;
            
            if (remaining < 50) {
                counter.style.color = 'var(--accent-color)';
            } else {
                counter.style.color = 'var(--text-muted)';
            }
        };
        
        textarea.addEventListener('input', updateCounter);
        updateCounter();
    }
});

// ============================================
// FORM ANALYTICS (Optional)
// ============================================

// Track which fields users interact with
const formFields = appointmentForm.querySelectorAll('input, select, textarea');
const fieldInteractions = {};

formFields.forEach(field => {
    field.addEventListener('focus', () => {
        const fieldName = field.name || field.id;
        fieldInteractions[fieldName] = (fieldInteractions[fieldName] || 0) + 1;
    });
});

// Log form abandonment
window.addEventListener('beforeunload', (e) => {
    const formData = new FormData(appointmentForm);
    const hasData = Array.from(formData.values()).some(value => value.trim() !== '');
    
    if (hasData && !appointmentForm.classList.contains('submitted')) {
        // In production, you might want to log this to analytics
        console.log('Form abandoned with data:', Object.fromEntries(formData.entries()));
        console.log('Field interactions:', fieldInteractions);
    }
});

// ============================================
// REAL-TIME VALIDATION FEEDBACK
// ============================================

const emailInput = document.getElementById('email');

emailInput.addEventListener('blur', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(emailInput.value);
    
    if (emailInput.value && !isValid) {
        emailInput.style.borderColor = 'var(--accent-color)';
        showFieldError(emailInput, 'Please enter a valid email address');
    } else {
        emailInput.style.borderColor = '';
        hideFieldError(emailInput);
    }
});

function showFieldError(field, message) {
    let errorElement = field.parentElement.querySelector('.field-error');
    
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.style.cssText = 'color: var(--accent-color); font-size: 0.875rem; margin-top: 4px;';
        field.parentElement.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
}

function hideFieldError(field) {
    const errorElement = field.parentElement.querySelector('.field-error');
    if (errorElement) {
        errorElement.remove();
    }
}

console.log('Appointment form initialized successfully! 📝');
