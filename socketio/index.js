const amqp = require('amqplib');
const { Server } = require('socket.io');
const http = require('http');

const PORT = 3000;
const RABBITMQ_QUEUE = 'health_queue';

const server = http.createServer();
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
            const connection = await amqp.connect({
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
                (msg) => {
                    if (msg !== null) {
                        const messageContent = JSON.parse(msg.content.toString());
                        console.log(`Received message: ${msg.content.toString()}`);

                        // Forward message to the specific client
                        const { clientid, url } = messageContent;
                        if (clients[clientid]) {
                            const messageToSend = `This will be the output from the AI which will be streamed to the client,<br>similiar to how ChatGPT does it. So no waiting until the AI is done creating the full text. <br>Processed URL: ${url}`;
                            setTimeout(() => {
                                console.log(`Sending message to client: ${messageToSend}`);
                                sendAsStream(clients[clientid], messageToSend);
                            }, 1500); // Delay sending message to simulate processing time
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
            await new Promise((res) => setTimeout(res, 3000)); // Wait 5 seconds before retrying
        }
    }

    throw new Error('Failed to connect to RabbitMQ after multiple attempts');
}

function sendAsStream(socket, message) {
    let index = 0;

    const intervalId = setInterval(() => {
        if (index < message.length) {
            socket.emit('message', { letter: message[index] });
            index++;
        } else {
            clearInterval(intervalId); // Stop sending once all letters are sent
            socket.emit('message', { done: true }); // Notify client that the stream is complete
        }
    }, 50); // Adjust the interval time for desired stream speed
}

server.listen(PORT, () => {
    console.log(`Socket.IO server is now running on http://localhost:${PORT}`);
    connectToRabbitMQ().catch(console.error);
});
