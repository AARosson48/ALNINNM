# ALNINNM - Anonymous List No Identification Needed No Managed-Moderation
# Anonymous Personals - Node.js Dating Site

A text-based, anonymous dating personals website with dynamic location tags, self-moderating ranking, and transparent user behavior tracking. Built with Node.js, Express, and MySQL for easy deployment on CloudPanel.

## Features

- **Anonymous Posting**: No registration required, IP-based tracking
- **Text-Only Ads**: No images allowed, focus on meaningful connections
- **Auto-Expiration**: Ads automatically expire after 3 days
- **Dynamic Locations**: Location tags created automatically from user input
- **Community Voting**: Up/down voting system with transparent behavior tracking
- **Self-Moderation**: Community-driven ranking instead of admin bans
- **Easy Installation**: WordPress-like installation wizard

## Requirements

- Node.js 16.0.0 or higher
- MySQL 5.7 or higher
- Web server (Apache/Nginx) or CloudPanel

## Installation

### Method 1: CloudPanel Installation

1. Upload the project files to your domain folder in CloudPanel
2. Install Node.js dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Start the application:
   \`\`\`bash
   npm start
   \`\`\`
4. Visit your domain and follow the installation wizard
5. Configure your database settings and complete the setup

### Method 2: Manual Installation

1. Clone or download the project files
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Create a MySQL database for the application
4. Start the server:
   \`\`\`bash
   npm start
   \`\`\`
5. Visit `http://localhost:3000/install` and complete the setup

## Configuration

The installation wizard will create a `.env` file with your settings:

\`\`\`env
# Database Configuration
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=anonymous_personals

# Application Configuration
SESSION_SECRET=randomly_generated_secret
IP_SALT=randomly_generated_salt
PORT=3000

# Site Configuration
SITE_NAME=Anonymous Personals
SITE_URL=https://yoursite.com
\`\`\`

## Email Relay System

The site uses a Craigslist-style anonymous email relay system:

1. **Poster Protection**: Real email addresses are never displayed
2. **Anonymous Communication**: Messages are sent through relay addresses
3. **Direct Replies**: Recipients can reply directly to forwarded emails
4. **Privacy Maintained**: Email addresses stay private until users choose to share

### Email Configuration

Configure SMTP settings in your `.env` file:

\`\`\`env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yoursite.com

# Email Relay Settings
RELAY_DOMAIN=relay.yoursite.com
\`\`\`

### Supported Email Services

- **Gmail**: Use app passwords for authentication
- **SendGrid**: Use API key as password
- **Mailgun**: Use SMTP credentials
- **Amazon SES**: Use SMTP interface
- **Any SMTP Provider**: Standard SMTP configuration

### Email Relay Flow

1. User posts ad with their real email
2. System generates unique relay address (e.g., abc123@relay.yoursite.com)
3. Interested parties use contact form on site
4. Message is forwarded to poster's real email
5. Poster can reply directly - response goes through relay back to inquirer
6. Both parties can continue email conversation through the relay

### Webhook Setup (Optional)

For processing incoming email replies, set up webhooks with your email provider:

- **SendGrid**: Configure inbound parse webhook to `/api/email-webhook`
- **Mailgun**: Set up route to forward to webhook endpoint
- **Custom**: Process incoming emails and POST to webhook endpoint
\`\`\`

## File Structure

\`\`\`
anonymous-personals/
├── config/
│   ├── database.js          # Database connection
│   └── install.js           # Installation functions
├── public/
│   ├── css/style.css        # Custom styles
│   └── js/main.js           # Frontend JavaScript
├── routes/
│   ├── index.js             # Main routes
│   ├── api.js               # API endpoints
│   └── install.js           # Installation routes
├── utils/
│   └── helpers.js           # Utility functions
├── views/
│   ├── layout.ejs           # Main layout template
│   ├── index.ejs            # Home page
│   ├── post.ejs             # Post ad form
│   ├── ad-detail.ejs        # Single ad view
│   ├── edit.ejs             # Edit ad form
│   ├── error.ejs            # Error page
│   └── install/
│       └── index.ejs        # Installation wizard
├── server.js                # Main server file
├── package.json             # Dependencies
└── README.md               # This file
\`\`\`

## Database Schema

The application automatically creates these tables:

- **ads**: Main ad storage with expiration tracking
- **votes**: Individual vote tracking with uniqueness constraints
- **locations**: Dynamic location management
- **user_behavior**: Transparent user activity tracking

## API Endpoints

- `POST /api/ads` - Create new ad
- `PUT /api/ads/:id` - Update existing ad
- `DELETE /api/ads/:id` - Delete ad
- `POST /api/votes` - Vote on ad

## Security Features

- IP address hashing for privacy
- Rate limiting to prevent abuse
- SQL injection protection
- XSS protection with Helmet.js
- Session-based security

## Customization

### Styling
Edit `public/css/style.css` to customize the appearance.

### Templates
Modify EJS templates in the `views/` directory to change the layout.

### Configuration
Update settings in the `.env` file or through the admin interface.

## Deployment

### CloudPanel Deployment

1. Create a new Node.js site in CloudPanel
2. Upload files to the site directory
3. Install dependencies via SSH or CloudPanel terminal
4. Configure the Node.js app settings
5. Start the application

### Traditional Server Deployment

1. Set up Node.js and MySQL on your server
2. Upload files and install dependencies
3. Configure a reverse proxy (Nginx/Apache)
4. Set up process management (PM2)
5. Configure SSL certificates

## Maintenance

### Automatic Cleanup
Expired ads are automatically cleaned up when users browse the site.

### Manual Cleanup
You can manually clean expired ads by running:
\`\`\`sql
UPDATE ads SET is_active = FALSE WHERE expires_at < NOW() AND is_active = TRUE;
\`\`\`

### Backup
Regularly backup your MySQL database and `.env` configuration file.

## Troubleshooting

### Installation Issues
- Ensure MySQL is running and accessible
- Check database credentials
- Verify Node.js version compatibility

### Runtime Issues
- Check server logs for errors
- Verify database connection
- Ensure proper file permissions

### Performance
- Monitor database performance
- Consider adding indexes for large datasets
- Use a process manager like PM2 for production

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review server logs
3. Verify database connectivity
4. Check file permissions

## License

GNU GENERAL PUBLIC LICENSE

## Version History

- v1.0.0 - Initial release with core functionality
- WordPress-like installation system
- MySQL database support
- CloudPanel compatibility
