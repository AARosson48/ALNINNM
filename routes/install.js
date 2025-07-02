const express = require("express")
const router = express.Router()
const mysql = require("mysql2/promise")
const { createDatabase, createTables, createEnvFile } = require("../config/install")

// Installation page
router.get("/", (req, res) => {
  res.render("install/index", {
    title: "Install Anonymous Personals",
    step: 1,
  })
})

// Test database connection
router.post("/test-connection", async (req, res) => {
  const { host, user, password, database } = req.body

  try {
    const connection = await mysql.createConnection({
      host,
      user,
      password,
    })

    await connection.ping()
    await connection.end()

    res.json({ success: true, message: "Database connection successful!" })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
})

// Test email configuration
router.post("/test-email", async (req, res) => {
  const {
    emailProvider,
    sendgridApiKey,
    mailgunApiKey,
    mailgunDomain,
    mailgunUrl,
    resendApiKey,
    postmarkApiKey,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass,
    fromEmail,
  } = req.body

  try {
    // Temporarily set environment variables for testing
    const originalProvider = process.env.EMAIL_PROVIDER
    const originalFromEmail = process.env.FROM_EMAIL

    process.env.EMAIL_PROVIDER = emailProvider
    process.env.FROM_EMAIL = fromEmail || "test@example.com"

    switch (emailProvider) {
      case "sendgrid":
        if (!sendgridApiKey) {
          return res.json({ success: false, message: "SendGrid API key is required" })
        }
        if (!sendgridApiKey.startsWith("SG.")) {
          return res.json({ success: false, message: "Invalid SendGrid API key format. Should start with 'SG.'" })
        }
        process.env.SENDGRID_API_KEY = sendgridApiKey
        break

      case "mailgun":
        if (!mailgunApiKey || !mailgunDomain) {
          return res.json({ success: false, message: "Mailgun API key and domain are required" })
        }
        process.env.MAILGUN_API_KEY = mailgunApiKey
        process.env.MAILGUN_DOMAIN = mailgunDomain
        process.env.MAILGUN_URL = mailgunUrl || "https://api.mailgun.net"
        break

      case "resend":
        if (!resendApiKey) {
          return res.json({ success: false, message: "Resend API key is required" })
        }
        if (!resendApiKey.startsWith("re_")) {
          return res.json({ success: false, message: "Invalid Resend API key format. Should start with 're_'" })
        }
        process.env.RESEND_API_KEY = resendApiKey
        break

      case "postmark":
        if (!postmarkApiKey) {
          return res.json({ success: false, message: "Postmark API key is required" })
        }
        process.env.POSTMARK_API_KEY = postmarkApiKey
        break

      case "smtp":
        if (!smtpHost || !smtpUser) {
          return res.json({ success: false, message: "SMTP host and user are required" })
        }
        process.env.SMTP_HOST = smtpHost
        process.env.SMTP_PORT = smtpPort || "587"
        process.env.SMTP_USER = smtpUser
        process.env.SMTP_PASS = smtpPass
        break

      default:
        return res.json({ success: false, message: "Please select an email provider" })
    }

    // Clear require cache to reload email config
    delete require.cache[require.resolve("../config/email")]
    const { testConnection } = require("../config/email")

    const isConnected = await testConnection()

    // Restore original environment variables
    if (originalProvider) {
      process.env.EMAIL_PROVIDER = originalProvider
    } else {
      delete process.env.EMAIL_PROVIDER
    }

    if (originalFromEmail) {
      process.env.FROM_EMAIL = originalFromEmail
    } else {
      delete process.env.FROM_EMAIL
    }

    if (isConnected) {
      let successMessage = `${emailProvider.charAt(0).toUpperCase() + emailProvider.slice(1)} email configuration is working!`

      // Add provider-specific success tips
      switch (emailProvider) {
        case "sendgrid":
          successMessage += " Make sure your API key has 'Mail Send' permissions."
          break
        case "mailgun":
          successMessage += " Verify your domain is properly configured in Mailgun."
          break
        case "resend":
          successMessage += " Your domain should be verified in Resend dashboard."
          break
        case "postmark":
          successMessage += " Ensure your sender signature is verified in Postmark."
          break
      }

      res.json({ success: true, message: successMessage })
    } else {
      let errorMessage = `Could not connect to ${emailProvider}. `

      // Add provider-specific error tips
      switch (emailProvider) {
        case "sendgrid":
          errorMessage +=
            "Check that your API key is valid and has 'Mail Send' permissions. You can create a new API key at https://app.sendgrid.com/settings/api_keys"
          break
        case "mailgun":
          errorMessage +=
            "Verify your API key and domain are correct. Check your Mailgun dashboard for the correct credentials."
          break
        case "resend":
          errorMessage += "Ensure your API key is valid and your domain is verified in Resend."
          break
        case "postmark":
          errorMessage += "Check your Server API Token and ensure your sender signature is verified."
          break
        case "smtp":
          errorMessage += "Verify your SMTP credentials and server settings."
          break
      }

      res.json({ success: false, message: errorMessage })
    }
  } catch (error) {
    console.error("Email test error:", error)
    res.json({ success: false, message: `Email test failed: ${error.message}` })
  }
})

// Complete installation
router.post("/complete", async (req, res) => {
  try {
    // Create database
    await createDatabase(req.body)

    // Create tables
    await createTables(req.body)

    // Create .env file
    createEnvFile(req.body)

    req.flash("success_msg", "Installation completed successfully! You can now use your Anonymous Personals site.")
    res.redirect("/")
  } catch (error) {
    console.error("Installation error:", error)
    req.flash("error_msg", "Installation failed: " + error.message)
    res.redirect("/install")
  }
})

module.exports = router
