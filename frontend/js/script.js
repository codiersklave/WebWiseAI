$(document).ready(() => {
    const clientId = `client-${Math.random().toString(36).substr(2, 9)}`; // Generate unique client ID
    const socket = io('http://localhost:3000', { query: { clientId } }); // Connect to Socket.IO with clientId

    $('#submitBtn').click(() => {
        const url = $('#urlInput').val();
        const errorMessage = $('#error');
        const messages = $('#messages');

        // Clear previous messages
        errorMessage.text('');
        messages.text('');

        // Validate URL
        const urlPattern = /^(https?:\/\/)([a-zA-Z0-9.-]+)(:[0-9]+)?(\/[^\s]*)?$/;
        if (!urlPattern.test(url)) {
            errorMessage.text('Invalid URL. Please enter a valid URL that starts with http:// or https://.');
            return;
        }

        // POST request payload
        const payload = {
            clientid: clientId,
            url: url,
        };

        // Perform POST request to Flask endpoint
        $.ajax({
            url: 'http://localhost:5000/health',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: (response) => {
                $('#messages').append(`Response from server: ${JSON.stringify(response)}`);
            },
            error: (xhr, status, error) => {
                errorMessage.text(`Error: ${xhr.responseText || status}`);
            },
        });
    });

    // Listen for messages from the server
    socket.on('message', (data) => {
        $('#messages').append(`<p>Message for ${data.clientid}: ${data.message}</p>`);
    });
});
