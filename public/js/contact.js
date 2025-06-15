document.addEventListener('DOMContentLoaded', function() {
    // Initialize Materialize components
    M.FormSelect.init(document.querySelectorAll('select'));
    M.TextArea.init(document.querySelectorAll('.materialize-textarea'));

    // Handle form submission
    document.getElementById('contact-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };

            // Since we don't have a backend contact endpoint, we'll just show a success message
            // TODO: Implement backend contact endpoint
            M.toast({html: 'Message sent successfully! (Note: This is a placeholder - backend implementation pending)', classes: 'green'});
            document.getElementById('contact-form').reset();
            // Reinitialize select after form reset
            M.FormSelect.init(document.querySelectorAll('select'));
            
        } catch (error) {
            console.error('Error sending message:', error);
            M.toast({html: 'Error sending message. Please try again.', classes: 'red'});
        }
    });
}); 