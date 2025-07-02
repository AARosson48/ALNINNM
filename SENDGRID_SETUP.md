# SendGrid Setup Guide

## Quick Setup Steps

### 1. Create SendGrid Account
1. Go to [SendGrid.com](https://sendgrid.com)
2. Click "Start for Free"
3. Sign up with your email
4. Verify your email address

### 2. Create API Key
1. Log into SendGrid dashboard
2. Go to **Settings** → **API Keys**
3. Click **"Create API Key"**
4. Choose **"Restricted Access"**
5. Under **Mail Send**, select **"Full Access"**
6. Click **"Create & View"**
7. **Copy the API key** (starts with `SG.`)
8. **Save it securely** - you won't see it again!

### 3. Verify Sender Identity
1. Go to **Settings** → **Sender Authentication**
2. Click **"Verify a Single Sender"**
3. Enter your email details:
   - From Name: Your Site Name
   - From Email: noreply@yoursite.com
   - Reply To: your-email@domain.com
4. Click **"Create"**
5. Check your email and click verification link

### 4. Test Configuration
Use these settings in the installation:
- **Email Provider**: SendGrid
- **SendGrid API Key**: `SG.your_api_key_here`
- **From Email**: The email you verified in step 3

## Common Issues & Solutions

### 403 Forbidden Error
**Problem**: API key doesn't have correct permissions
**Solution**: 
1. Go to Settings → API Keys
2. Edit your API key
3. Ensure "Mail Send" has "Full Access"
4. Save changes

### Invalid API Key Format
**Problem**: API key doesn't start with "SG."
**Solution**: 
1. Create a new API key in SendGrid dashboard
2. Make sure you copy the full key including "SG." prefix

### Sender Not Verified
**Problem**: "From" email not verified
**Solution**:
1. Go to Settings → Sender Authentication
2. Verify your sender email address
3. Use the exact verified email in "From Email" field

### Domain Authentication (Advanced)
For better deliverability:
1. Go to Settings → Sender Authentication
2. Click "Authenticate Your Domain"
3. Follow DNS setup instructions
4. This improves email delivery rates

## Free Tier Limits
- **100 emails per day** forever free
- No credit card required
- Perfect for small to medium sites

## Upgrade Options
- **Essentials**: $14.95/month (40,000 emails)
- **Pro**: $89.95/month (100,000 emails)
- **Premier**: Custom pricing

## Testing Your Setup
The installation wizard will test your configuration by:
1. Validating API key format
2. Testing API permissions
3. Sending a test email in sandbox mode
4. Verifying sender authentication

If tests pass, your SendGrid is ready to use! 🎉
