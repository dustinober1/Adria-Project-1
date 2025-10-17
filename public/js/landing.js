// Adria's Google Calendar booking link
const CALENDAR_BOOKING_URL = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ3wUMcfi9PCbrbgE118d-hvfmKZwgdv39eg488EKFZ8jbFP-yJMlaNEaRHs2Lxe_6Fjz7E-WNSK';

function openCalendar() {
    window.open(CALENDAR_BOOKING_URL, '_blank');
}

document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                message: document.getElementById('message').value
            };

            try {
                // Send to backend API to save in database
                const result = await auth.subscribeEmail(
                    formData.email,
                    formData.name,
                    formData.phone,
                    formData.message
                );

                if (result.success) {
                    // Show success message
                    document.getElementById('successMessage').classList.add('show');
                    
                    // Clear form
                    contactForm.reset();
                    
                    // Redirect to more information page after 2 seconds
                    setTimeout(function() {
                        window.location.href = 'more-information.html';
                    }, 2000);
                }
            } catch (error) {
                console.error('Form submission error:', error);
                alert('There was an error submitting your information. Please try again.');
            }
        });
    }
});
