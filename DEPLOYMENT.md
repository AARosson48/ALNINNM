# Deployment Guide for Anonymous Personals

## CloudPanel Deployment

### Prerequisites
- CloudPanel installed on your server
- Node.js 16+ available
- MySQL 5.7+ database

### Steps
1. **Create Site in CloudPanel**
   - Go to Sites → Add Site
   - Choose "Node.js" as site type
   - Enter your domain name

2. **Upload Files**
   - Upload all project files to your domain directory
   - Ensure proper file permissions (755 for directories, 644 for files)

3. **Configure Node.js App**
   - App Root: `/`
   - Startup File: `server.js`
   - App Port: `3000`
   - Environment: `production`

4. **Install Dependencies**
   \`\`\`bash
   cd /home/youruser/htdocs/yourdomain.com
   npm install
   \`\`\`

5. **Start Application**
   \`\`\`bash
   npm start
   \`\`\`

6. **Complete Installation**
   - Visit your domain
   - Follow the installation wizard
   - Configure database and email settings

## Traditional Server Deployment

### Using PM2 (Recommended)
\`\`\`bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
\`\`\`

### Using Docker
\`\`\`bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t anonymous-personals .
docker run -d -p 3000:3000 --env-file .env anonymous-personals
\`\`\`

### Manual Deployment
\`\`\`bash
# Clone repository
git clone https://github.com/yourusername/anonymous-personals.git
cd anonymous-personals

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit configuration
nano .env

# Start application
npm start
\`\`\`

## Web Server Configuration

### Nginx (Recommended)
- Copy `nginx.conf` to your Nginx sites directory
- Update server_name and SSL certificate paths
- Reload Nginx: `sudo nginx -s reload`

### Apache
- Copy `.htaccess` to your document root
- Enable required modules: `mod_rewrite`, `mod_headers`, `mod_expires`
- Configure reverse proxy if needed

## SSL Certificate Setup

### Let's Encrypt (Free)
\`\`\`bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
\`\`\`

### CloudFlare (Recommended)
- Add your domain to CloudFlare
- Enable SSL/TLS encryption
- Use "Full (strict)" SSL mode
- Enable security features

## Database Setup

### MySQL Configuration
\`\`\`sql
-- Create database
CREATE DATABASE anonymous_personals CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'personals_user'@'localhost' IDENTIFIED BY 'strong_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON anonymous_personals.* TO 'personals_user'@'localhost';
FLUSH PRIVILEGES;
\`\`\`

### Backup Strategy
\`\`\`bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u username -p password anonymous_personals > backup_$DATE.sql
find /path/to/backups -name "backup_*.sql" -mtime +7 -delete
\`\`\`

## Email Configuration

### Gmail Setup
1. Enable 2-factor authentication
2. Generate app password
3. Use app password in SMTP_PASS

### SendGrid Setup
1. Create SendGrid account
2. Generate API key
3. Use API key as SMTP_PASS
4. Set SMTP_HOST to smtp.sendgrid.net

### Mailgun Setup
1. Create Mailgun account
2. Add and verify domain
3. Use SMTP credentials from Mailgun dashboard

## Monitoring & Maintenance

### Log Management
\`\`\`bash
# View application logs
pm2 logs anonymous-personals

# Rotate logs
pm2 install pm2-logrotate
\`\`\`

### Performance Monitoring
\`\`\`bash
# Monitor with PM2
pm2 monit

# System monitoring
htop
iotop
\`\`\`

### Security Updates
\`\`\`bash
# Update dependencies
npm audit
npm update

# Update system packages
sudo apt update && sudo apt upgrade
\`\`\`

## Troubleshooting

### Common Issues
1. **Port already in use**: Change PORT in .env file
2. **Database connection failed**: Check DB credentials
3. **Email not sending**: Verify SMTP settings
4. **Permission denied**: Check file permissions

### Debug Mode
\`\`\`bash
# Enable debug logging
NODE_ENV=development npm start

# Check logs
tail -f logs/error.log
\`\`\`

### Health Checks
\`\`\`bash
# Test application health
curl http://localhost:3000/

# Test database connection
node -e "require('./config/database').testConnection()"

# Test email configuration
node -e "require('./config/email').testConnection()"
