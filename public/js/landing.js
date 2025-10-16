// Replace this URL with Adria's actual Google Calendar booking link
const CALENDAR_BOOKING_URL = 'https://calendar.google.com/calendar/appointments/schedules/YOUR_BOOKING_PAGE_ID';

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
                    
                    // Hide success message after 5 seconds
                    setTimeout(function() {
                        document.getElementById('successMessage').classList.remove('show');
                    }, 5000);
                }
            } catch (error) {
                console.error('Form submission error:', error);
                alert('There was an error submitting your information. Please try again.');
            }
        });
    }
});

