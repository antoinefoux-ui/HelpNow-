# HelpNow Backend API

Emergency assistance platform backend built with Node.js, Express, PostgreSQL, and Socket.IO.

## Features

- 🔐 JWT authentication with refresh tokens
- 🗺️ PostGIS spatial queries for helper matching
- ⚡ Real-time Socket.IO for emergency tracking
- 💾 Redis caching for performance
- 🔒 Security best practices (Helmet, CORS, rate limiting)
- 📝 TypeScript for type safety
- 🎯 RESTful API design

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL 14+ with PostGIS
- **Cache:** Redis 7+
- **Real-time:** Socket.IO
- **Authentication:** JWT
- **Validation:** Joi
- **Security:** Helmet, CORS, bcrypt

## Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14.0 with PostGIS extension
- Redis >= 7.0
- npm or yarn

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd HelpNow-Backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Generate secure secrets
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For JWT_REFRESH_SECRET
```

### 4. Set up PostgreSQL database

```bash
# Create database
createdb helpnow

# Enable PostGIS extension
psql helpnow -c "CREATE EXTENSION postgis;"

# Run migrations
npm run migrate
```

### 5. Start Redis

```bash
# macOS (Homebrew)
brew services start redis

# Linux (systemd)
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:7-alpine
```

## Development

### Start development server

```bash
npm run dev
```

Server will start on `http://localhost:3000`

### Build for production

```bash
npm run build
```

### Start production server

```bash
npm start
```

## API Endpoints

### Authentication

```
POST   /api/v1/auth/register        - Register new user
POST   /api/v1/auth/login           - Login user
POST   /api/v1/auth/refresh         - Refresh access token
POST   /api/v1/auth/forgot-password - Send password reset email
POST   /api/v1/auth/reset-password  - Reset password
POST   /api/v1/auth/verify-email    - Verify email address
POST   /api/v1/auth/logout          - Logout user
```

### Users

```
GET    /api/v1/users/:id                        - Get user by ID
PUT    /api/v1/users/:id                        - Update user
DELETE /api/v1/users/:id                        - Delete user
POST   /api/v1/users/:id/photo                  - Upload profile photo
POST   /api/v1/users/:id/addresses              - Add address
PUT    /api/v1/users/:id/addresses/:addressId   - Update address
DELETE /api/v1/users/:id/addresses/:addressId   - Delete address
POST   /api/v1/users/:id/emergency-contacts     - Add emergency contact
DELETE /api/v1/users/:id/emergency-contacts/:id - Delete emergency contact
```

### Emergencies

```
POST   /api/v1/emergencies                    - Create emergency
GET    /api/v1/emergencies/:id                - Get emergency details
GET    /api/v1/emergencies/active/:userId     - Get active emergency
GET    /api/v1/emergencies/nearby             - Get nearby emergencies
GET    /api/v1/emergencies/history/:userId    - Get emergency history
POST   /api/v1/emergencies/:id/accept         - Accept emergency
POST   /api/v1/emergencies/:id/cancel         - Cancel emergency
POST   /api/v1/emergencies/:id/helper-location - Update helper location
POST   /api/v1/emergencies/:id/arrived        - Mark helper arrived
POST   /api/v1/emergencies/:id/resolve        - Resolve emergency
```

### Helpers

```
POST   /api/v1/helpers/:userId/setup                    - Setup helper profile
PUT    /api/v1/helpers/:userId/availability             - Update availability
POST   /api/v1/helpers/:userId/certifications           - Add certification
PUT    /api/v1/helpers/:userId/certifications/:certId   - Update certification
DELETE /api/v1/helpers/:userId/certifications/:certId   - Delete certification
GET    /api/v1/helpers/:userId/statistics               - Get statistics
POST   /api/v1/helpers/:userId/location                 - Update location
```

## Socket.IO Events

### Client to Server

```javascript
// Helper availability
socket.emit('helper:set_availability', { isAvailable: true });

// Emergency lifecycle
socket.emit('emergency:create', { requestId, location, type });
socket.emit('emergency:accept', { requestId });
socket.emit('emergency:update_location', { requestId, location, eta });
socket.emit('emergency:helper_arrived', { requestId });
socket.emit('emergency:resolve', { requestId });
socket.emit('emergency:cancel', { requestId });

// Join/leave rooms
socket.emit('emergency:join', { requestId });
socket.emit('emergency:leave', { requestId });
```

### Server to Client

```javascript
// Emergency notifications
socket.on('emergency:new_request', (data) => {});
socket.on('emergency:helper_accepted', (data) => {});
socket.on('helper:location_update', (data) => {});
socket.on('helper:arrived', (data) => {});
socket.on('emergency:resolved', (data) => {});
socket.on('emergency:cancelled', (data) => {});
```

## Database Schema

### Main Tables

- `users` - User accounts
- `helper_profiles` - Helper information
- `certifications` - Helper certifications
- `emergency_requests` - Emergency requests
- `helper_locations` - Real-time helper locations
- `addresses` - User addresses with geolocation
- `emergency_contacts` - Emergency contact persons
- `medical_info` - User medical information
- `subscriptions` - User subscriptions

### Indexes

PostGIS spatial indexes for fast geolocation queries:
- `emergency_requests.location`
- `helper_locations.last_location`
- `addresses.location`

## Security

### Authentication

- JWT tokens with 24h expiration
- Refresh tokens with 7d expiration
- Secure password hashing with bcrypt (10 rounds)
- Token storage in Redis

### API Security

- Helmet.js for HTTP headers
- CORS with configurable origins
- Rate limiting (100 requests per 15 minutes)
- Input validation with Joi
- SQL injection prevention with parameterized queries

### Data Security

- Passwords never stored in plain text
- Sensitive data encrypted at rest
- HTTPS enforced in production
- Environment variables for secrets

## Performance

### Caching Strategy

- User profiles: 5 minutes
- Emergency requests: 5 minutes
- Helper locations: 5 minutes
- Refresh tokens: 7 days

### Database Optimization

- Indexes on frequently queried columns
- Connection pooling (max 20 connections)
- PostGIS spatial indexes for geoqueries

## Deployment

### OVH Cloud Deployment

1. **Provision server**
```bash
# B2-15 instance (4 vCPU, 15GB RAM)
# Ubuntu 22.04 LTS
```

2. **Install dependencies**
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL 14
sudo apt-get install -y postgresql-14 postgresql-contrib-14 postgis

# Install Redis
sudo apt-get install -y redis-server

# Install Nginx
sudo apt-get install -y nginx
```

3. **Deploy application**
```bash
# Clone repository
git clone <repository-url>
cd HelpNow-Backend

# Install dependencies
npm install

# Build
npm run build

# Start with PM2
npm install -g pm2
pm2 start dist/server.js --name helpnow-api
pm2 startup
pm2 save
```

4. **Configure Nginx**
```nginx
server {
    listen 80;
    server_name api.helpnow.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

5. **Setup SSL**
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.helpnow.com
```

## Environment Variables

See `.env.example` for all required variables.

Critical variables:
- `JWT_SECRET` - Must be 32+ characters
- `JWT_REFRESH_SECRET` - Must be 32+ characters
- `DB_PASSWORD` - Strong database password
- `REDIS_URL` - Redis connection string

## Monitoring

### Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-14T20:00:00.000Z",
  "uptime": 12345
}
```

### Logs

```bash
# PM2 logs
pm2 logs helpnow-api

# Application logs
tail -f logs/app.log
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- user.test.ts
```

## Troubleshooting

### PostgreSQL connection issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check PostGIS extension
psql helpnow -c "SELECT PostGIS_version();"
```

### Redis connection issues

```bash
# Check Redis status
redis-cli ping

# Should respond with PONG
```

### Port already in use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

Proprietary - All rights reserved

## Support

For issues and questions:
- Email: support@helpnow.com
- Documentation: https://docs.helpnow.com

## Authors

HelpNow Development Team

---

Built with ❤️ to save lives
