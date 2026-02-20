# 💬 Subscription Management Chatbot

An AI-powered subscription management system that enables customers to manage their subscriptions through natural language conversations. Built with Node.js, Express, SQLite, and Groq's LLM API.

## ✨ Features

- **Natural Language Interface**: Chat with an AI assistant to manage subscriptions
- **Function Calling**: Uses OpenAI-style function calling for reliable intent detection
- **Subscription Management**: Create, update, and cancel subscriptions conversationally
- **Billing History**: View and track all billing transactions
- **AI-Powered Recommendations**: Get personalized plan suggestions based on usage patterns
- **Compressed Data Storage**: Efficient plan details storage using gzip compression
- **Rate Limiting**: Built-in API protection (10 requests/minute per IP)
- **Modern UI**: Clean, responsive chat interface with typing animations
- **Groq LLM**: Powered by `llama-3.3-70b-versatile` with function calling support

## 🚀 Quick Start

### Prerequisites

- Node.js v18 or higher
- Groq API key ([Get one here](https://console.groq.com))

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd subscription-management-chatbot
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your Groq API key:
```
GROQ_API_KEY=your_groq_api_key_here
PORT=3000
DB_PATH=./data/subscriptions.db
```

4. Seed the database with sample data:
```bash
npm run seed
```

5. Start the server:
```bash
npm start
```

6. Open your browser and navigate to:
```
http://localhost:3000
```

## 📖 Usage

### Chat Commands

The chatbot understands natural language. Try these examples:

- "Show me my subscriptions"
- "I want to subscribe to the Pro plan"
- "Cancel my subscription"
- "Show my billing history"
- "What plans do you recommend for me?"
- "How much am I spending on subscriptions?"

### Quick Actions

Use the sidebar buttons for instant access to:
- 📋 View Subscriptions
- 💳 Billing History
- ✨ Get Recommendations

### Demo Customers

The seeded database includes three demo customers:
- Demo Customer 1 (customer-1): Has Basic plan
- Demo Customer 2 (customer-2): Has Pro and Basic plans
- Demo Customer 3 (customer-3): No subscriptions

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         Client (HTML/CSS/JS)            │
│  - Chat Interface                       │
│  - API Client                           │
└─────────────────────────────────────────┘
                  │
                  │ HTTP/JSON
                  ▼
┌─────────────────────────────────────────┐
│         Server (Node.js/Express)        │
│  - Rate Limiter                         │
│  - LLM Service (Groq)                   │
│  - Subscription Manager                 │
│  - Billing Manager                      │
│  - Recommendation Engine                │
└─────────────────────────────────────────┘
                  │
                  │ SQL
                  ▼
┌─────────────────────────────────────────┐
│         Database (SQLite)               │
│  - Customers                            │
│  - Plans (compressed features)          │
│  - Subscriptions                        │
│  - Billing History                      │
└─────────────────────────────────────────┘
```

## 📁 Project Structure

```
subscription-management-chatbot/
├── client/                 # Frontend files
│   ├── index.html         # Main HTML page
│   ├── styles.css         # Styles
│   ├── apiClient.js       # API communication
│   ├── chatInterface.js   # Chat UI logic
│   └── app.js             # Main app logic
├── server/                # Backend files
│   ├── server.js          # Express server
│   ├── DatabaseManager.js # Database operations
│   ├── schema.js          # Database schema
│   ├── compression.js     # Data compression utilities
│   ├── RateLimiter.js     # Rate limiting
│   ├── LLMService.js      # Groq API integration
│   ├── SubscriptionManager.js
│   ├── BillingManager.js
│   ├── RecommendationEngine.js
│   └── seedData.js        # Database seeding
├── docs/                  # Documentation
├── data/                  # SQLite database (created on first run)
├── .env                   # Environment variables
├── package.json
└── README.md
```

## 🔧 API Endpoints

### POST /api/chat
Process chat messages and execute subscription operations.

**Request:**
```json
{
  "customerId": "customer-1",
  "message": "Show my subscriptions",
  "conversationHistory": []
}
```

**Response:**
```json
{
  "response": "You have 1 subscription...",
  "action": "none",
  "data": {}
}
```

### GET /api/subscriptions/:customerId
Get all subscriptions for a customer.

### GET /api/billing/:customerId
Get billing history for a customer.

### GET /api/recommendations/:customerId
Get AI-powered plan recommendations.

## 🧪 Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 🛡️ Rate Limiting

The API is protected with rate limiting:
- **Limit**: 10 requests per minute per IP address
- **Response**: HTTP 429 with retry-after information
- **Applies to**: All /api/* endpoints

## 🔐 Security Considerations

- API keys stored in environment variables
- Rate limiting prevents abuse
- Input validation on all endpoints
- SQL injection protection via parameterized queries
- CORS configured for client-server communication

## 🐛 Troubleshooting

### Server won't start
- Check that port 3000 is available
- Verify GROQ_API_KEY is set in .env
- Ensure Node.js version is 18+

### Database errors
- Delete `data/subscriptions.db` and run `npm run seed` again
- Check file permissions on the data directory

### LLM not responding
- Verify your Groq API key is valid
- Check your internet connection
- Review server logs for API errors

### Rate limit errors
- Wait 60 seconds between request bursts
- Adjust RATE_LIMIT_MAX_REQUESTS in .env if needed

## 📝 Development

### Development mode with auto-reload:
```bash
npm run dev
```

### Environment Variables:
```
GROQ_API_KEY=your_api_key
PORT=3000
NODE_ENV=development
DB_PATH=./data/subscriptions.db
RATE_LIMIT_MAX_REQUESTS=10
RATE_LIMIT_WINDOW_MS=60000
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [Groq](https://groq.com) for fast LLM inference
- Uses [OpenAI SDK](https://github.com/openai/openai-node) for API integration
- Powered by [Express.js](https://expressjs.com)
- Data storage with [SQLite](https://www.sqlite.org)

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check the troubleshooting section
- Review the API documentation in `/docs`

---

Made with ❤️ using AI-powered development
