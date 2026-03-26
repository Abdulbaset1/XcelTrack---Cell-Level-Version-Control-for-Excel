# XcelTrack Backend - Deployment & Setup Guide

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Redis (v6 or higher)
- Firebase Admin SDK credentials

## Installation

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Database Setup

Create PostgreSQL database:

```sql
CREATE DATABASE xceltrack;
```

The application will automatically create tables and indexes on first run.

### 3. Redis Setup

**Windows**:
- Download Redis from https://github.com/microsoftarchive/redis/releases
- Install and start Redis service
- Default port: 6379

**Linux/Mac**:
```bash
# Install Redis
sudo apt-get install redis-server  # Ubuntu/Debian
brew install redis                  # macOS

# Start Redis
redis-server
```

### 4. Environment Configuration

Create `.env` file in the `server` directory:

```env
# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=xceltrack
DB_PASSWORD=your_password
DB_PORT=5432
PORT=5000

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Logging
LOG_LEVEL=info
NODE_ENV=development

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=XcelTrack <your_email@gmail.com>

# Client URL for CORS
CLIENT_URL=http://localhost:3000
```

### 5. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Generate a service account key
3. Save as `serviceAccountKey.json` in the `server` directory
4. Update `firebaseAdmin.js` with your credentials

## Running the Server

### Development Mode

```bash
npm start
```

The server will start on `http://localhost:5000`

### Production Mode

```bash
NODE_ENV=production npm start
```

## Verification

### Check Server Status

```bash
curl http://localhost:5000/api/users
```

### Check Redis Connection

```bash
redis-cli ping
# Should return: PONG
```

### Check Database Connection

Server logs should show:
```
Connected to PostgreSQL Database
Database indexes created successfully
```

## Performance Optimizations Implemented

### 1. Database Optimization
- ✅ Indexed all frequently queried columns
- ✅ Connection pooling (5-20 connections)
- ✅ Query performance monitoring via logs

### 2. Caching Layer
- ✅ Redis caching for user data (5 min TTL)
- ✅ Workbook listings cached (2 min TTL)
- ✅ Automatic cache invalidation on updates

### 3. File Processing
- ✅ Streaming Excel file parser
- ✅ Batch cell processing (500 cells per batch)
- ✅ Progress tracking via events
- ✅ File size limit: 50MB

### 4. Rate Limiting
- ✅ General API: 100 req/15min
- ✅ Authentication: 5 req/15min
- ✅ OTP: 3 req/15min
- ✅ Uploads: 10 req/hour
- ✅ Admin: 50 req/15min
- ✅ Commits: 30 req/15min

### 5. Logging & Monitoring
- ✅ Winston structured logging
- ✅ Daily log rotation
- ✅ Separate error logs
- ✅ HTTP request logging
- ✅ Request ID tracking

### 6. Security
- ✅ Helmet security headers
- ✅ CORS configuration
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ Rate limiting

## Monitoring

### Log Files

Logs are stored in `server/logs/`:
- `combined-YYYY-MM-DD.log` - All logs
- `error-YYYY-MM-DD.log` - Error logs only
- `exceptions.log` - Unhandled exceptions
- `rejections.log` - Unhandled promise rejections

### Redis Monitoring

```bash
# Connect to Redis CLI
redis-cli

# Monitor cache operations
MONITOR

# Check cache keys
KEYS *

# Get cache statistics
INFO stats
```

### Database Monitoring

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check slow queries
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

## Troubleshooting

### Redis Connection Failed

```
Error: Redis connection failed
```

**Solution**:
1. Ensure Redis is running: `redis-cli ping`
2. Check REDIS_HOST and REDIS_PORT in `.env`
3. Check firewall settings

### Database Connection Failed

```
Error: Error acquiring client
```

**Solution**:
1. Verify PostgreSQL is running
2. Check database credentials in `.env`
3. Ensure database exists: `psql -l`
4. Check PostgreSQL logs

### File Upload Fails

```
Error: File size exceeds maximum allowed size
```

**Solution**:
1. File must be under 50MB
2. Only .xlsx and .xls files supported
3. Check multer configuration

### Rate Limit Exceeded

```
Error: Too many requests
```

**Solution**:
1. Wait for the rate limit window to reset
2. Adjust rate limits in `rateLimiter.js` if needed
3. Consider implementing user-based rate limiting

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancer**: Use nginx or AWS ALB
2. **Session Sharing**: Redis for shared sessions
3. **Database**: PostgreSQL read replicas
4. **File Storage**: Move to S3 or cloud storage

### Vertical Scaling

1. Increase PostgreSQL pool size
2. Add more Redis memory
3. Increase Node.js memory limit:
   ```bash
   node --max-old-space-size=4096 index.js
   ```

## Backup Strategy

### Database Backup

```bash
# Daily backup
pg_dump xceltrack > backup_$(date +%Y%m%d).sql

# Restore
psql xceltrack < backup_20240101.sql
```

### Redis Backup

```bash
# Save snapshot
redis-cli SAVE

# Backup RDB file
cp /var/lib/redis/dump.rdb /backup/
```

## Health Checks

Create a health check endpoint:

```javascript
app.get('/health', async (req, res) => {
  const health = {
    database: 'unknown',
    redis: 'unknown',
    uptime: process.uptime()
  };

  try {
    await pool.query('SELECT 1');
    health.database = 'healthy';
  } catch (err) {
    health.database = 'unhealthy';
  }

  try {
    await redis.ping();
    health.redis = 'healthy';
  } catch (err) {
    health.redis = 'unhealthy';
  }

  const status = health.database === 'healthy' && health.redis === 'healthy' ? 200 : 503;
  res.status(status).json(health);
});
```

## Production Checklist

- [ ] Set NODE_ENV=production
- [ ] Use strong database passwords
- [ ] Enable Redis password authentication
- [ ] Configure firewall rules
- [ ] Set up SSL/TLS certificates
- [ ] Configure backup automation
- [ ] Set up monitoring and alerting
- [ ] Review and adjust rate limits
- [ ] Enable log rotation
- [ ] Configure error tracking (Sentry, etc.)
- [ ] Set up CI/CD pipeline
- [ ] Document API endpoints
- [ ] Create runbook for common issues

## Support

For issues or questions:
- Check logs in `server/logs/`
- Review API documentation in `API_DOCUMENTATION.md`
- Check Redis and PostgreSQL status
- Verify environment variables
