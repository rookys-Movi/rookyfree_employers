// --- Security Utilities ---
function generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    const phoneRegex = /^[\d\-\+\(\)\s]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

function validateFormData(formData) {
    const errors = [];
    
    if (!formData.companyName || formData.companyName.trim().length < 2) {
        errors.push('会社名は2文字以上で入力してください');
    }
    
    if (!formData.fullName || formData.fullName.trim().length < 2) {
        errors.push('ご担当者名は2文字以上で入力してください');
    }
    
    if (!validateEmail(formData.email)) {
        errors.push('有効なメールアドレスを入力してください');
    }
    
    if (!validatePhone(formData.phoneNumber)) {
        errors.push('有効な電話番号を入力してください');
    }
    
    if (formData.message && formData.message.length > 1000) {
        errors.push('お問い合わせ内容は1000文字以内で入力してください');
    }
    
    return errors;
}

function checkRateLimit() {
    const lastSubmission = localStorage.getItem('lastFormSubmission');
    const now = Date.now();
    const RATE_LIMIT_MS = 60000; // 1 minute
    
    if (lastSubmission && (now - parseInt(lastSubmission)) < RATE_LIMIT_MS) {
        const remainingTime = Math.ceil((RATE_LIMIT_MS - (now - parseInt(lastSubmission))) / 1000);
        throw new Error(`送信制限中です。${remainingTime}秒後に再度お試しください。`);
    }
    
    localStorage.setItem('lastFormSubmission', now.toString());
}

// --- Initialize Animate On Scroll (AOS) ---
AOS.init({
    duration: 800,
    once: true,
    offset: 50,
});

// --- Smooth Scroll Helper ---
function scrollToId(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', function () {
    // --- Initialize CSRF Token ---
    const csrfTokenInput = document.getElementById('csrf_token');
    if (csrfTokenInput) {
        csrfTokenInput.value = generateCSRFToken();
    }

    // --- FAQ Accordion Logic ---
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            // Deactivate all items before activating the current one
            faqItems.forEach(i => i.classList.remove('active'));
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // --- Smooth Scroll for internal anchors ---
    document.addEventListener('click', function (event) {
        const anchor = event.target.closest('a[href^="#"]');
        if (anchor) {
            event.preventDefault();
            const id = anchor.getAttribute('href').slice(1);
            if (id) scrollToId(id);
        }
    });

    // --- Form Submission Logic ---
    const form = document.getElementById('inquiryForm');
    const submitButton = document.getElementById('submitButton');
    
    if (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            
            try {
                // Check rate limiting
                checkRateLimit();
                
                // Disable submit button
                submitButton.disabled = true;
                submitButton.textContent = '送信中...';

                const formData = new FormData(form);
                const dataObject = {};
                formData.forEach((value, key) => { 
                    dataObject[key] = value.trim(); // Trim whitespace
                });

                // Validate form data
                const validationErrors = validateFormData(dataObject);
                if (validationErrors.length > 0) {
                    throw new Error(validationErrors.join('\n'));
                }

                // Verify CSRF token
                const submittedToken = dataObject.csrf_token;
                const expectedToken = csrfTokenInput.value;
                if (submittedToken !== expectedToken) {
                    throw new Error('セキュリティエラーが発生しました。ページを再読み込みして再度お試しください。');
                }

                const payload = {
                    landingPageID: dataObject.landingPageID, // "RookyFree_企業"
                    inquiryType: "企業問い合わせ",
                    fullName: dataObject.fullName,
                    companyName: dataObject.companyName,
                    departmentName: dataObject.departmentName || "",
                    email: dataObject.email,
                    phoneNumber: dataObject.phoneNumber,
                    message: dataObject.message || "",
                    // Add blank fields required by the sheet structure but not in this form
                    furigana: "",
                    detailType: "",
                    secret: '8qZ$p#vT2@nK*wG7hB5!sF8aU',
                    csrf_token: submittedToken,
                    // Add timestamp for tracking
                    timestamp: new Date().toISOString()
                };

                const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwWtuE_YtANg2jZ91jHIPL3LDFFGjiQrtrvWYKb7lygXnefnr6rsFJuuKbru2N7iz-O6Q/exec";
           
                fetch(SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: JSON.stringify(payload),
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })
                .then(() => {
                    // Clear rate limit on successful submission
                    localStorage.removeItem('lastFormSubmission');
                    window.top.location.href = 'thankyou.html';
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('送信に失敗しました。時間をおいて再度お試しください。');
                    submitButton.disabled = false;
                    submitButton.textContent = '【完全無料】で求人掲載を申し込む';
                });
                
            } catch (error) {
                console.error('Validation Error:', error);
                alert(error.message);
                submitButton.disabled = false;
                submitButton.textContent = '【完全無料】で求人掲載を申し込む';
            }
        });
    }
});

