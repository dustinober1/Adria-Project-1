// Replace this URL with Adria's actual Google Calendar booking link
const CALENDAR_BOOKING_URL = 'https://calendar.google.com/calendar/appointments/schedules/YOUR_BOOKING_PAGE_ID';

function openCalendar() {
    window.open(CALENDAR_BOOKING_URL, '_blank');
}

document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                message: document.getElementById('message').value
            };

            // Here you would typically send this data to your backend/email service
            // For now, we'll just show a success message
            console.log('Form submitted:', formData);
            
            // Show success message
            document.getElementById('successMessage').classList.add('show');
            
            // Clear form
            contactForm.reset();
            
            // Hide success message after 5 seconds
            setTimeout(function() {
                document.getElementById('successMessage').classList.remove('show');
            }, 5000);

            // In production, you might want to:
            // 1. Send to a backend API
            // 2. Use a service like Formspree, EmailJS, or Netlify Forms
            // 3. Store in a database
        });
    }
});
