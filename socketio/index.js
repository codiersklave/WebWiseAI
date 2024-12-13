import { connect } from 'amqplib';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { exec } from 'child_process';

const PORT = 3000;
const RABBITMQ_QUEUE = 'health_queue';

const server = createServer();
const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

// Store connected clients
const clients = {};

io.on('connection', (socket) => {
    const clientId = socket.handshake.query.clientId;
    if (clientId) {
        clients[clientId] = socket;
        console.log(`Client connected: ${clientId}`);

        socket.on('disconnect', () => {
            delete clients[clientId];
            console.log(`Client disconnected: ${clientId}`);
        });
    }
});

async function connectToRabbitMQ() {
    const maxRetries = 15;
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            const connection = await connect({
                hostname: process.env.RABBITMQ_HOST || 'rabbitmq',
                username: process.env.RABBITMQ_USER || 'admin',
                password: process.env.RABBITMQ_PASS || 'admin',
            });
            const channel = await connection.createChannel();
            await channel.assertQueue(RABBITMQ_QUEUE, { durable: true });
            console.log('Connected to RabbitMQ');

            // Start consuming messages
            channel.consume(
                RABBITMQ_QUEUE,
                async (msg) => {
                    if (msg !== null) {
                        const messageContent = JSON.parse(msg.content.toString());
                        console.log(`Received message: ${msg.content.toString()}`);

                        const { clientid, url, task_id } = messageContent;

                        try {
                            // Call Lighthouse CLI
                            const lighthouseResult = await runLighthouse(url);
                            console.log(`Lighthouse result for ${url}: ${lighthouseResult}`);

                            // Forward message to the specific client
                            if (clients[clientid]) {
                                const messageToSend2 = `${lighthouseResult}`;
                                sendAsStream(clients[clientid], messageToSend2, false);

                                const messageToSend1 = `Processed URL: <br><span style="color:#31f5d8;">${url}</span><br><br>Task ID:<br><span style="color:#fff200;">${task_id}</span>`;
                                setTimeout(() => sendAsStream(clients[clientid], messageToSend1, true), 3000);
                            }
                        } catch (err) {
                            console.error(`Error running Lighthouse: ${err.message}`);
                            if (clients[clientid]) {
                                sendAsStream(clients[clientid], `Error processing URL: ${url}.`, false);
                            }
                        }

                        channel.ack(msg);
                    }
                },
                { noAck: false }
            );

            return channel;
        } catch (err) {
            console.error(`RabbitMQ connection failed (attempt ${attempt + 1}): ${err.message}`);
            attempt++;
            await new Promise((res) => setTimeout(res, 3000)); // Wait 3 seconds before retrying
        }
    }

    throw new Error('Failed to connect to RabbitMQ after multiple attempts');
}

// Function to call Lighthouse CLI
async function runLighthouse(url) {
    return new Promise((resolve, reject) => {
        exec(`lighthouse ${url} --quiet --output=html --output-path=stdout --chrome-flags="--headless --no-sandbox --disable-gpu --disable-dev-shm-usage"`,{ maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (error) {
                return reject(new Error(stderr || error.message));
            }
            resolve(stdout);
        });
    });
}

// Function to stream messages letter by letter to the client
function sendAsStream(socket, message, splitIntoChunks = true) {
    if (splitIntoChunks) {
        let index = 0;

        const intervalId = setInterval(() => {
            if (index < message.length) {
                socket.emit('message', { letter: message[index] });
                index++;
            } else {
                clearInterval(intervalId); // Stop sending once all letters are sent
                socket.emit('message', { done: true }); // Notify client that the stream is complete
            }
        }, 10); // Adjust the interval time for desired stream speed
    } else {
        // Send the entire message at once
        socket.emit('message', { content: message, done: true });
    }
}


server.listen(PORT, () => {
    console.log(`Socket.IO server is now running on http://localhost:${PORT}`);
    connectToRabbitMQ().catch(console.error);
});
