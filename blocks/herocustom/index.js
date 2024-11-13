document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('.cta-buttons button');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            alert('CTA clicked');
        });
    });
});