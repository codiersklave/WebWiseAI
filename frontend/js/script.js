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
                $('#messages').append(`Response from server:<br> <pre>${JSON.stringify(response)}</pre>`);
            },
            error: (xhr, status, error) => {
                errorMessage.text(`Error: ${xhr.responseText || status}`);
            },
        });
    });

    let currentStream = ''; // Buffer to hold the streamed content
    let tempBuffer = '';    // Temporary buffer for incomplete tags

    socket.on('message', (data) => {
        console.log("Message received: ", data);
        if(data.content) {
            $('body').html(data.content);
        }
        if (data.letter) {
            tempBuffer += data.letter; // Add the letter to the temporary buffer

            // Check if a complete tag exists in the temporary buffer
            const tagPattern = /<[^>]*>/; // Matches complete tags like <br>, <p>, etc.
            if (tagPattern.test(tempBuffer)) {
                // Extract the complete tag and add it to the main stream
                currentStream += tempBuffer;
                tempBuffer = ''; // Clear the temporary buffer
            } else {
                // Check if the tempBuffer is NOT inside a tag
                if (!tempBuffer.startsWith('<')) {
                    currentStream += tempBuffer;
                    tempBuffer = ''; // Clear the buffer as there's no tag
                }
            }

            // Update the DOM with the completed content
            $('#chat').html(currentStream);
        } else {
            // Clear the buffer and show the completion message
            currentStream = "";
            tempBuffer = "";
        }
    });

});
