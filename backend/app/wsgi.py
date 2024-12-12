from flask import Flask, jsonify, request
from flask_cors import CORS
import pika
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/health', methods=['POST'])
def health_check():
    payload = request.get_json()
    try:
        # Connect to RabbitMQ
        credentials = pika.PlainCredentials('admin', 'admin')
        connection = pika.BlockingConnection(pika.ConnectionParameters('rabbitmq',  credentials=credentials))
        channel = connection.channel()

        # Declare a queue
        channel.queue_declare(queue='health_queue', durable=True)

        # Publish a message
        channel.basic_publish(exchange='',
                              routing_key='health_queue',
                              body=json.dumps(payload))

        # Close the connection
        connection.close()

        return jsonify({"status": "healthy", "message": "Message sent to RabbitMQ"}), 200
    except Exception as e:
        return jsonify({"status": "unhealthy", "error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
