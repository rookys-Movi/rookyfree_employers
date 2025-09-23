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
            submitButton.disabled = true;
            submitButton.textContent = '送信中...';

            const formData = new FormData(form);
            const dataObject = {};
            formData.forEach((value, key) => { dataObject[key] = value; });

            const payload = {
                landingPageID: dataObject.landingPageID, // "RookyFree_企業"
                inquiryType: "企業問い合わせ",
                fullName: dataObject.fullName,
                companyName: dataObject.companyName,
                departmentName: dataObject.departmentName,
                email: dataObject.email,
                phoneNumber: dataObject.phoneNumber,
                message: dataObject.message || "",
                // Add blank fields required by the sheet structure but not in this form
                furigana: "",
                detailType: "",
                // Add the secret key for validation
                secret: '8qZ$p#vT2@nK*wG7hB5!sF8aU'
            };

            const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwWtuE_YtANg2jZ91jHIPL3LDFFGjiQrtrvWYKb7lygXnefnr6rsFJuuKbru2N7iz-O6Q/exec";
       
            fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify(payload)
            })
            .then(() => {
                window.top.location.href = 'thankyou.html';
            })
            .catch(error => {
                console.error('Error:', error);
                alert('送信に失敗しました。時間をおいて再度お試しください。');
                submitButton.disabled = false;
                submitButton.textContent = '【完全無料】で求人掲載を申し込む';
            });
        });
    }
});

