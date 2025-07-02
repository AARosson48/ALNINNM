const mysql = require("mysql2/promise")
const fs = require("fs")
const path = require("path")

const createDatabase = async (config) => {
  const connection = await mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
  })

  try {
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``)
    console.log(`Database ${config.database} created or already exists`)
  } finally {
    await connection.end()
  }
}

const createTables = async (config) => {
  const connection = await mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database,
  })

  try {
    // Create ads table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        body TEXT NOT NULL,
        location VARCHAR(100) NOT NULL,
        contact_email VARCHAR(255),
        relay_email VARCHAR(100) UNIQUE,
        ip_hash VARCHAR(64) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP DEFAULT (DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 3 DAY)),
        up_votes INT DEFAULT 0,
        down_votes INT DEFAULT 0,
        repost_count INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        INDEX idx_location (location),
        INDEX idx_expires_at (expires_at),
        INDEX idx_ip_hash (ip_hash),
        INDEX idx_relay_email (relay_email)
      )
    `)

    // Create votes table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS votes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ad_id INT NOT NULL,
        ip_hash VARCHAR(64) NOT NULL,
        vote_type ENUM('up', 'down') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_vote (ad_id, ip_hash),
        FOREIGN KEY (ad_id) REFERENCES ads(id) ON DELETE CASCADE,
        INDEX idx_ad_id (ad_id),
        INDEX idx_ip_hash (ip_hash)
      )
    `)

    // Create locations table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS locations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        ad_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create user_behavior table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_behavior (
        ip_hash VARCHAR(64) PRIMARY KEY,
        total_up_votes_given INT DEFAULT 0,
        total_down_votes_given INT DEFAULT 0,
        ads_posted INT DEFAULT 0,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create email_relays table for tracking email conversations
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS email_relays (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ad_id INT NOT NULL,
        relay_code VARCHAR(50) UNIQUE NOT NULL,
        sender_email VARCHAR(255) NOT NULL,
        recipient_email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (ad_id) REFERENCES ads(id) ON DELETE CASCADE,
        INDEX idx_relay_code (relay_code),
        INDEX idx_ad_id (ad_id)
      )
    `)

    console.log("All tables created successfully")
  } finally {
    await connection.end()
  }
}

const createEnvFile = (config) => {
  const envContent = `# Database Configuration
DB_HOST=${config.host}
DB_USER=${config.user}
DB_PASSWORD=${config.password}
DB_NAME=${config.database}

# Application Configuration
SESSION_SECRET=${generateRandomString(32)}
IP_SALT=${generateRandomString(16)}
PORT=3000
NODE_ENV=production

# Site Configuration
SITE_NAME=${config.siteName || "Anonymous Personals"}
SITE_URL=${config.siteUrl || "http://localhost:3000"}
FROM_EMAIL=${config.fromEmail || "noreply@yoursite.com"}

# Email Provider Configuration
EMAIL_PROVIDER=${config.emailProvider || "sendgrid"}

# SendGrid Configuration
${config.emailProvider === "sendgrid" ? `SENDGRID_API_KEY=${config.sendgridApiKey || ""}` : "# SENDGRID_API_KEY=your_sendgrid_api_key_here"}

# Mailgun Configuration
${
  config.emailProvider === "mailgun"
    ? `MAILGUN_API_KEY=${config.mailgunApiKey || ""}
MAILGUN_DOMAIN=${config.mailgunDomain || ""}
MAILGUN_URL=${config.mailgunUrl || "https://api.mailgun.net"}`
    : "# MAILGUN_API_KEY=your_mailgun_api_key_here\n# MAILGUN_DOMAIN=your_mailgun_domain.com\n# MAILGUN_URL=https://api.mailgun.net"
}

# Resend Configuration
${config.emailProvider === "resend" ? `RESEND_API_KEY=${config.resendApiKey || ""}` : "# RESEND_API_KEY=your_resend_api_key_here"}

# Postmark Configuration
${config.emailProvider === "postmark" ? `POSTMARK_API_KEY=${config.postmarkApiKey || ""}` : "# POSTMARK_API_KEY=your_postmark_api_key_here"}

# SMTP Configuration (fallback)
${
  config.emailProvider === "smtp"
    ? `SMTP_HOST=${config.smtpHost || ""}
SMTP_PORT=${config.smtpPort || "587"}
SMTP_SECURE=${config.smtpSecure || "false"}
SMTP_USER=${config.smtpUser || ""}
SMTP_PASS=${config.smtpPass || ""}`
    : "# SMTP_HOST=smtp.gmail.com\n# SMTP_PORT=587\n# SMTP_SECURE=false\n# SMTP_USER=your-email@gmail.com\n# SMTP_PASS=your-app-password"
}

# Email Relay Settings
RELAY_DOMAIN=${config.relayDomain || "relay.yoursite.com"}
`

  fs.writeFileSync(".env", envContent)
  console.log(".env file created successfully")
}

const generateRandomString = (length) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

module.exports = {
  createDatabase,
  createTables,
  createEnvFile,
}
