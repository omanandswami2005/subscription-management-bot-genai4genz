# 🚀 Getting Started Guide

Welcome to the Subscription Management Chatbot! This guide will help you get up and running in minutes.

## Prerequisites Checklist

Before you begin, make sure you have:

- ✅ Node.js v18 or higher installed
- ✅ A Groq API key ([Sign up here](https://console.groq.com))
- ✅ A text editor (VS Code, Sublime, etc.)
- ✅ A terminal/command prompt

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including Express, SQLite, OpenAI SDK, and more.

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Open `.env` in your text editor and add your Groq API key:

```env
GROQ_API_KEY=gsk_your_actual_api_key_here
PORT=3000
DB_PATH=./data/subscriptions.db
```

**Important**: Never commit your `.env` file to version control!

### 3. Seed the Database

Create sample data for testing:

```bash
npm run seed
```

This creates:
- 3 demo customers
- 4 subscription plans (Basic, Pro, Enterprise, Yearly Pro)
- 3 active subscriptions
- 9 billing transactions

### 4. Verify Setup (Optional)

Run the verification script to ensure everything is configured correctly:

```bash
node verify-setup.js
```

You should see all tests pass with green checkmarks.

### 5. Start the Server

```bash
npm start
```

You should see:
```
Database initialized successfully
All services initialized successfully
Server running on http://localhost:3000
```

### 6. Open in Browser

Navigate to:
```
http://localhost:3000
```

You should see the chat interface with a welcome message!

## First Steps in the App

### Try These Commands

1. **View subscriptions**:
   - Type: "Show me my subscriptions"
   - Or click the "📋 View Subscriptions" button

2. **Check billing**:
   - Type: "Show my billing history"
   - Or click the "💳 Billing History" button

3. **Get recommendations**:
   - Type: "What plans do you recommend?"
   - Or click the "✨ Get Recommendations" button

4. **Natural conversation**:
   - "How much am I spending?"
   - "What's the difference between Basic and Pro?"
   - "I want to upgrade my plan"

### Switch Between Demo Customers

Use the dropdown at the top to switch between:
- Demo Customer 1 (has Basic plan)
- Demo Customer 2 (has Pro and Basic plans)
- Demo Customer 3 (no subscriptions)

## Development Mode

For development with auto-reload:

```bash
npm run dev
```

The server will automatically restart when you make changes to files.

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Common Issues

### "GROQ_API_KEY not set"
- Make sure you created the `.env` file
- Verify your API key is correct
- Restart the server after adding the key

### "Port 3000 already in use"
- Change the PORT in `.env` to a different number (e.g., 3001)
- Or stop the process using port 3000

### Database errors
- Delete the `data/` folder
- Run `npm run seed` again

### "Cannot find module"
- Run `npm install` again
- Make sure you're in the project root directory

## Project Structure Quick Reference

```
subscription-management-chatbot/
├── client/           # Frontend (HTML, CSS, JS)
├── server/           # Backend (Node.js, Express)
├── docs/             # Documentation
├── data/             # SQLite database (auto-created)
├── .env              # Your environment variables
└── README.md         # Full documentation
```

## Next Steps

1. **Explore the code**: Start with `server/server.js` and `client/app.js`
2. **Read the docs**: Check out `docs/ARCHITECTURE.md` for system design
3. **Customize**: Modify plans, add features, change styling
4. **Deploy**: See `docs/DEPLOYMENT.md` for production setup

## Need Help?

- 📖 Read the full [README.md](README.md)
- 🏗️ Check [ARCHITECTURE.md](docs/ARCHITECTURE.md) for system design
- 🔧 Review [API.md](docs/API.md) for endpoint details
- 🚀 See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for production tips

## Quick Commands Reference

```bash
# Install dependencies
npm install

# Seed database
npm run seed

# Start server
npm start

# Development mode (auto-reload)
npm run dev

# Run tests
npm test

# Verify setup
node verify-setup.js
```

---

Happy coding! 🎉
