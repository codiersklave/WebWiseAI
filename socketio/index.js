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
    const maxRetries = 5;
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
                            setTimeout(function() {
                                clients[clientid].emit('message', {
                                    clientid,
                                    message: `Processed URL: ${url}`,
                                });
                            }, 3000)
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
            await new Promise((res) => setTimeout(res, 5000)); // Wait 5 seconds before retrying
        }
    }

    throw new Error('Failed to connect to RabbitMQ after multiple attempts');
}

server.listen(PORT, () => {
    console.log(`Socket.IO server is now running on http://localhost:${PORT}`);
    connectToRabbitMQ().catch(console.error);
});
