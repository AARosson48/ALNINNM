# Email Service Setup Guide

## Supported Email Providers

### 1. SendGrid (Recommended)
**Why choose SendGrid:**
- Free tier: 100 emails/day
- Excellent deliverability
- Easy setup
- Great documentation

**Setup Steps:**
1. Sign up at [SendGrid](https://sendgrid.com)
2. Verify your email address
3. Go to Settings → API Keys
4. Create a new API key with "Mail Send" permissions
5. Copy the API key (starts with `SG.`)

**Configuration:**
\`\`\`env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your_api_key_here
\`\`\`

### 2. Mailgun
**Why choose Mailgun:**
- Free tier: 5,000 emails/month for 3 months
- Powerful API
- Good for developers

**Setup Steps:**
1. Sign up at [Mailgun](https://mailgun.com)
2. Add and verify your domain
3. Get your API key from the dashboard
4. Note your domain name

**Configuration:**
\`\`\`env
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=your_api_key_here
MAILGUN_DOMAIN=mg.yoursite.com
MAILGUN_URL=https://api.mailgun.net
\`\`\`

### 3. Resend
**Why choose Resend:**
- Modern, developer-friendly
- Free tier: 3,000 emails/month
- Great React integration

**Setup Steps:**
1. Sign up at [Resend](https://resend.com)
2. Verify your domain
3. Create an API key
4. Copy the API key (starts with `re_`)

**Configuration:**
\`\`\`env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_api_key_here
\`\`\`

### 4. Postmark
**Why choose Postmark:**
- Excellent deliverability
- Free tier: 100 emails/month
- Focus on transactional emails

**Setup Steps:**
1. Sign up at [Postmark](https://postmarkapp.com)
2. Create a server
3. Add and verify your domain
4. Get your Server API Token

**Configuration:**
\`\`\`env
EMAIL_PROVIDER=postmark
POSTMARK_API_KEY=your_server_api_token_here
\`\`\`

### 5. SMTP (Fallback)
**When to use SMTP:**
- You have existing SMTP credentials
- Using Gmail, Yahoo, or other providers
- Need maximum compatibility

**Gmail Setup:**
1. Enable 2-factor authentication
2. Generate an app password
3. Use app password instead of regular password

**Configuration:**
\`\`\`env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
\`\`\`

## Domain Configuration

### DNS Records
For proper email delivery, configure these DNS records:

**SPF Record:**
\`\`\`
TXT @ "v=spf1 include:sendgrid.net ~all"
\`\`\`

**DKIM Record:**
\`\`\`
TXT s1._domainkey "k=rsa; t=s; p=YOUR_DKIM_KEY"
\`\`\`

**DMARC Record:**
\`\`\`
TXT _dmarc "v=DMARC1; p=quarantine; rua=mailto:dmarc@yoursite.com"
\`\`\`

### Relay Domain Setup
The relay domain (e.g., `relay.yoursite.com`) should:
1. Point to your server's IP address
2. Have proper MX records if processing incoming emails
3. Be configured in your email provider

## Testing Email Configuration

### Manual Testing
\`\`\`bash
# Test email configuration
curl -X POST http://localhost:3000/install/test-email \
  -H "Content-Type: application/json" \
  -d '{"emailProvider":"sendgrid","sendgridApiKey":"SG.your_key"}'
\`\`\`

### Common Issues

**SendGrid Issues:**
- API key permissions: Ensure "Mail Send" is enabled
- Domain verification: Verify sender domain
- Rate limits: Check your plan limits

**Mailgun Issues:**
- Domain verification: Complete domain setup
- Region: Use correct API URL (US vs EU)
- Sandbox mode: Verify domain to send to any email

**SMTP Issues:**
- Authentication: Use app passwords for Gmail
- Port blocking: Some hosts block port 25
- TLS/SSL: Ensure correct security settings

## Production Recommendations

### Security
- Store API keys in environment variables
- Use different keys for development/production
- Rotate API keys regularly
- Monitor email usage and logs

### Deliverability
- Set up proper DNS records (SPF, DKIM, DMARC)
- Use a dedicated sending domain
- Monitor bounce rates and spam complaints
- Implement email validation

### Monitoring
- Set up webhook endpoints for delivery tracking
- Monitor email quotas and usage
- Log email sending attempts
- Set up alerts for failures

## Cost Comparison

| Provider | Free Tier | Paid Plans Start |
|----------|-----------|------------------|
| SendGrid | 100/day | $14.95/month |
| Mailgun | 5,000/month (3 months) | $35/month |
| Resend | 3,000/month | $20/month |
| Postmark | 100/month | $10/month |
| SMTP | Varies | Varies |

## Webhook Configuration (Advanced)

For processing incoming email replies:

### SendGrid Inbound Parse
\`\`\`javascript
// Webhook endpoint: /api/email-webhook
app.post('/api/email-webhook', (req, res) => {
  const { to, from, subject, text, html } = req.body;
  // Process incoming email
});
\`\`\`

### Mailgun Routes
\`\`\`bash
# Create route for incoming emails
curl -s --user 'api:YOUR_API_KEY' \
  https://api.mailgun.net/v3/routes \
  -F priority=1 \
  -F description='Relay emails' \
  -F expression='match_recipient(".*@relay.yoursite.com")' \
  -F action='forward("https://yoursite.com/api/email-webhook")'
