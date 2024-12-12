# WebWiseAI  
_A Smart and Simple Website Audit Tool Powered by AI_

## Description  
WebWiseAI is an advanced website auditing tool designed to analyze Core Web Vitals, GDPR compliance, and storage practices (cookies, local storage, etc.). Powered by AI, it simplifies complex results into actionable insights and recommendations, making it accessible for developers, marketers, and non-technical users alike.

## Key Features  
- **Core Web Vitals Audit**: Assess and optimize your website’s speed, interactivity, and visual stability.  
- **GDPR Compliance Check**: Ensure your cookie and data storage practices meet legal standards.  
- **AI-Powered Insights**: Get easy-to-understand recommendations tailored to your website's needs.  
- **Comprehensive Reporting**: Export detailed reports for stakeholders or team collaboration.  
- **User-Friendly Interface**: No technical expertise required to understand and act on results.  

## Use Cases  
- Website performance optimization.  
- Ensuring data privacy compliance.  
- Enhancing user experience for better conversions.  

## License  
[Custom Non-Commercial License](./LICENSE) – Non-commercial use is free; contact for commercial licensing options.

---

**Why Choose WebWiseAI?**  
Because a compliant, optimized website is a successful website! 🚀


## Architecrure
After starting the project with `docker-compose up`, the following components are available:

### **Frontend (Nginx)**
- **URL**: `http://localhost:8080`
- **Features**:
    - Input a valid URL string in the text field.
    - Input validation (only URLs starting with `http://` or `https://` are accepted).
    - Submit the URL along with a randomly generated `clientid` to the Flask backend endpoint.
    - Real-time display of messages received via RabbitMQ in the frontend.

### **Flask Backend**
- **URL**: `http://localhost:5000/health`
- **Features**:
    - Accepts POST requests with `clientid` and `url`.
    - Forwards the data to RabbitMQ.

### **RabbitMQ**
- **Management GUI**: `http://localhost:15672` (Username: `admin`, Password: `admin` (for now, will be outsourced to ENV variables in the future))
- **Queue**: `health_queue`
- **Function**: Stores and forwards messages to the Socket.IO server.

### **Socket.IO Server**
- **URL**: `http://localhost:3000`
- **Function**:
    - Receives messages from RabbitMQ.
    - NYI: Calls Lighthouse CLI to audit the URL.
    - NYI: Calls AI model to generate insights.
    - NYI: Sends insights back to client
    - Routes messages based on `clientid` to the appropriate client only.

---

## **Usage**
1. Open the frontend at `http://localhost:8080`.
2. Input a valid URL and click "Submit."
3. Check the feedback in the message area (from both the backend and RabbitMQ).
4. Observe the message flow in RabbitMQ via the Management GUI.