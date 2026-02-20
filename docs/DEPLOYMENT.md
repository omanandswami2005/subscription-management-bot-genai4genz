# Deployment Guide

## Overview

This guide covers deploying the Subscription Management Chatbot to production environments.

---

## Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] Environment variables configured
- [ ] Database schema finalized
- [ ] API rate limits configured appropriately
- [ ] Security review completed
- [ ] Documentation updated
- [ ] Groq API key obtained for production

---

## Environment Variables

### Required Variables

```bash
# Groq API Configuration
GROQ_API_KEY=your_production_groq_api_key

# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
DB_PATH=./data/subscriptions.db

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=10
RATE_LIMIT_WINDOW_MS=60000

# CORS (add your production domain)
ALLOWED_ORIGINS=https://yourdomain.com
```

---

## Deployment Options

### Option 1: Traditional VPS (DigitalOcean, Linode, AWS EC2)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2
```

#### 2. Deploy Application

```bash
# Clone repository
git clone <your-repo-url>
cd subscription-management-chatbot

# Install dependencies
npm install --production

# Set environment variables
cp .env.example .env
nano .env  # Edit with production values

# Seed database
npm run seed

# Start with PM2
pm2 start server/server.js --name subscription-bot
pm2 save
pm2 startup
```

#### 3. Configure Nginx (Reverse Proxy)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### 4. SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

### Option 2: Heroku

#### 1. Prepare Application

Create `Procfile`:
```
web: node server/server.js
```

#### 2. Deploy

```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set GROQ_API_KEY=your_key
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Seed database
heroku run npm run seed
```

---

### Option 3: Docker

#### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server/server.js"]
```

#### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - GROQ_API_KEY=${GROQ_API_KEY}
      - NODE_ENV=production
      - DB_PATH=/app/data/subscriptions.db
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

#### 3. Deploy

```bash
# Build and run
docker-compose up -d

# Seed database
docker-compose exec app npm run seed

# View logs
docker-compose logs -f
```

---

### Option 4: Vercel (Serverless)

**Note**: SQLite doesn't work well with serverless. Consider migrating to PostgreSQL or MongoDB for Vercel deployment.

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Create vercel.json

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/server.js",
      "use": "@vercel/node"
    },
    {
      "src": "client/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "client/$1"
    }
  ],
  "env": {
    "GROQ_API_KEY": "@groq-api-key"
  }
}
```

#### 3. Deploy

```bash
vercel --prod
```

---

## Database Migration (SQLite to PostgreSQL)

For production, consider migrating to PostgreSQL:

### 1. Install PostgreSQL Driver

```bash
npm install pg
```

### 2. Update DatabaseManager.js

```javascript
import pg from 'pg';
const { Pool } = pg;

class DatabaseManager {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }

  async query(sql, params = []) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  }
}
```

### 3. Update Schema

Convert SQLite schema to PostgreSQL syntax in `server/schema.js`.

---

## Monitoring

### PM2 Monitoring

```bash
# View logs
pm2 logs subscription-bot

# Monitor resources
pm2 monit

# View status
pm2 status
```

### Application Monitoring

Consider integrating:
- **Sentry**: Error tracking
- **New Relic**: Performance monitoring
- **LogRocket**: Session replay
- **DataDog**: Infrastructure monitoring

---

## Backup Strategy

### Database Backup

```bash
# Backup SQLite database
cp data/subscriptions.db data/backups/subscriptions-$(date +%Y%m%d).db

# Automated daily backup (cron)
0 2 * * * cp /path/to/data/subscriptions.db /path/to/backups/subscriptions-$(date +\%Y\%m\%d).db
```

### PostgreSQL Backup

```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

---

## Security Hardening

### 1. Environment Variables

Never commit `.env` to version control:
```bash
echo ".env" >> .gitignore
```

### 2. Rate Limiting

Adjust for production traffic:
```bash
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

### 3. CORS Configuration

Update `server/server.js`:
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true
}));
```

### 4. Helmet.js (Security Headers)

```bash
npm install helmet
```

```javascript
import helmet from 'helmet';
app.use(helmet());
```

### 5. Input Validation

Already implemented via parameterized queries and input validation.

---

## Performance Optimization

### 1. Enable Compression

```bash
npm install compression
```

```javascript
import compression from 'compression';
app.use(compression());
```

### 2. Caching

Implement Redis for caching recommendations:
```bash
npm install redis
```

### 3. Database Indexing

Add indexes for frequently queried fields:
```sql
CREATE INDEX idx_subscriptions_customer ON subscriptions(customerId);
CREATE INDEX idx_billing_customer ON billing_history(customerId);
```

---

## Scaling Strategies

### Horizontal Scaling

1. **Load Balancer**: Use Nginx or AWS ELB
2. **Multiple Instances**: Run multiple PM2 instances
3. **Database**: Migrate to managed PostgreSQL (AWS RDS, Heroku Postgres)
4. **Caching**: Add Redis for session and data caching

### Vertical Scaling

1. Increase server resources (CPU, RAM)
2. Optimize database queries
3. Implement connection pooling

---

## Health Checks

Add health check endpoint in `server/server.js`:

```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

---

## Rollback Strategy

### PM2 Rollback

```bash
# Save current version
pm2 save

# If issues occur, rollback
git checkout previous-stable-tag
npm install
pm2 restart subscription-bot
```

### Docker Rollback

```bash
# Tag images with versions
docker tag app:latest app:v1.0.0

# Rollback
docker-compose down
docker-compose up -d app:v1.0.0
```

---

## Post-Deployment Verification

1. **Health Check**: `curl https://yourdomain.com/health`
2. **API Test**: Test all endpoints with curl
3. **Function Calling**: Verify in server logs
4. **Rate Limiting**: Test with multiple requests
5. **Error Handling**: Test invalid inputs
6. **Performance**: Check response times
7. **Monitoring**: Verify logs are being collected

---

## Maintenance

### Regular Tasks

- **Daily**: Check logs for errors
- **Weekly**: Review performance metrics
- **Monthly**: Update dependencies (`npm update`)
- **Quarterly**: Security audit (`npm audit`)

### Dependency Updates

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Test after updates
npm test
```

---

## Troubleshooting Production Issues

### High Memory Usage

```bash
# Check PM2 memory
pm2 monit

# Restart if needed
pm2 restart subscription-bot
```

### Database Locked (SQLite)

Migrate to PostgreSQL for production to avoid locking issues.

### Rate Limit Too Restrictive

Adjust in `.env`:
```bash
RATE_LIMIT_MAX_REQUESTS=100
```

### LLM API Errors

1. Check Groq API status
2. Verify API key is valid
3. Check rate limits on Groq account
4. Review server logs for detailed errors

---

## Support

For deployment issues:
- Check server logs
- Review this deployment guide
- Consult cloud provider documentation
- Open an issue on GitHub
