document.addEventListener('DOMContentLoaded', () => {

    // Form input elements
    const inputs = {
        name: document.getElementById('name'),
        designation: document.getElementById('designation'),
        phone: document.getElementById('phone'),
        email: document.getElementById('email'),
        location: document.getElementById('location')
    };

    // Preview elements on the card
    const preview = {
        name: document.getElementById('preview-name'),
        designation: document.getElementById('preview-designation'),
        phone: document.getElementById('preview-phone'),
        email: document.getElementById('preview-email'),
        location: document.getElementById('preview-location')
    };

    const jsonOutput = document.getElementById('json-output');
    const qrContainer = document.getElementById('qr-code');

    // Initialize QR code instance
    let qrCode = new QRCode(qrContainer, {
        text: ' ',
        width: 180,
        height: 180,
        colorDark: '#0d7068',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
    });

    /**
     * Escapes HTML special characters and converts newlines to <br> tags
     */
    function formatMultiline(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');
    }

    /**
     * Generates a vCard string from the current form data
     */
    function generateVCard(data) {
        // Clean phone number (remove spaces and dashes for tel: format)
        const cleanPhone = data.phone.replace(/[\s\-]/g, '');

        // Split name for vCard N field (last;first)
        const nameParts = data.name.split(' ');
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
        const firstName = nameParts.slice(0, -1).join(' ') || data.name;

        return [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `FN:${data.name}`,
            `N:${lastName};${firstName};;;`,
            `TITLE:${data.designation}`,
            `ORG:Navachetana Livelihoods Private Limited`,
            `TEL;TYPE=CELL:${cleanPhone}`,
            `EMAIL:${data.email}`,
            `URL:https://navachetanalivelihoods.com`,
            `ADR;TYPE=WORK:;;${data.location.replace(/\n/g, ', ')};;;;`,
            'END:VCARD'
        ].join('\n');
    }

    // Debounce timer for QR code updates
    let qrTimer = null;

    /**
     * Core update function: reads form → builds JSON → updates card preview + QR
     */
    function updateCard() {
        // 1. Gather all values into a JSON-ready object
        const cardData = {
            name: inputs.name.value.trim(),
            designation: inputs.designation.value.trim(),
            phone: inputs.phone.value.trim(),
            email: inputs.email.value.trim(),
            location: inputs.location.value.trim(),
            company: 'Navachetana Livelihoods Private Limited',
            website: 'https://navachetanalivelihoods.com'
        };

        // 2. Output the JSON to the code block
        jsonOutput.textContent = JSON.stringify(cardData, null, 2);

        // 3. Update the live card preview
        preview.name.textContent = cardData.name || 'Your Name';
        preview.designation.textContent = cardData.designation || 'Designation';
        preview.phone.textContent = cardData.phone || '+00 - 0000000000';
        preview.email.textContent = cardData.email || 'email@example.com';
        preview.location.innerHTML = formatMultiline(cardData.location) || 'Office Address';

        // 4. Regenerate QR code (debounced so it doesn't flash on every keystroke)
        clearTimeout(qrTimer);
        qrTimer = setTimeout(() => {
            const vCardString = generateVCard(cardData);
            qrCode.clear();
            qrCode.makeCode(vCardString);
        }, 300);
    }

    // Attach live event listeners on every form input
    Object.values(inputs).forEach(el => {
        el.addEventListener('input', updateCard);
        el.addEventListener('change', updateCard);
    });

    // Initial render
    updateCard();

    // Share button functionality
    const shareButton = document.getElementById('share-button');
    if (shareButton) {
        shareButton.addEventListener('click', () => {
            // Get current card data
            const cardData = {
                name: inputs.name.value.trim(),
                designation: inputs.designation.value.trim(),
                phone: inputs.phone.value.trim(),
                email: inputs.email.value.trim(),
                location: inputs.location.value.trim()
            };

            // Create shareable URL with encoded data
            const shareData = btoa(JSON.stringify(cardData));
            const shareUrl = `${window.location.origin}${window.location.pathname}?data=${encodeURIComponent(shareData)}`;

            // Generate QR code for sharing
            const qrCodeData = generateVCard(cardData);

            // Use Web Share API if available
            if (navigator.share) {
                navigator.share({
                    title: `${cardData.name}'s Business Card`,
                    text: `Check out ${cardData.name}'s digital business card`,
                    url: shareUrl
                })
                .then(() => console.log('Share successful'))
                .catch((error) => {
                    if (error.name !== 'AbortError') {
                        console.error('Error sharing:', error);
                        // Fallback to clipboard
                        fallbackShare(shareUrl, qrCodeData);
                    }
                });
            } else {
                // Fallback for browsers without Web Share API
                fallbackShare(shareUrl, qrCodeData);
            }
        });
    }

    // Check URL for shared data on page load
    function loadSharedData() {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedData = urlParams.get('data');

        if (sharedData) {
            try {
                const decodedData = JSON.parse(atob(decodeURIComponent(sharedData)));
                
                // Populate form fields
                if (decodedData.name) inputs.name.value = decodedData.name;
                if (decodedData.designation) inputs.designation.value = decodedData.designation;
                if (decodedData.phone) inputs.phone.value = decodedData.phone;
                if (decodedData.email) inputs.email.value = decodedData.email;
                if (decodedData.location) inputs.location.value = decodedData.location;

                // Update card preview
                updateCard();
                
                console.log('Loaded shared card data');
            } catch (error) {
                console.error('Error loading shared data:', error);
            }
        }
    }

    // Fallback share method (clipboard + alert)
    function fallbackShare(shareUrl, qrCodeData) {
        // Copy URL to clipboard
        navigator.clipboard.writeText(shareUrl)
            .then(() => {
                alert(`Link copied to clipboard!\n\nYou can share this URL: ${shareUrl}`);
            })
            .catch((error) => {
                console.error('Error copying to clipboard:', error);
                // Show URL in a prompt if clipboard fails
                prompt('Copy this URL to share:', shareUrl);
            });
    }

    // Load shared data when page loads
    loadSharedData();
});
