require("dotenv").config()

// Email service providers
const emailProviders = {
  sendgrid: require("./email-providers/sendgrid"),
  mailgun: require("./email-providers/mailgun"),
  resend: require("./email-providers/resend"),
  postmark: require("./email-providers/postmark"),
  smtp: require("./email-providers/smtp"), // Fallback SMTP option
}

const getEmailProvider = () => {
  const provider = process.env.EMAIL_PROVIDER || "sendgrid"

  if (!emailProviders[provider]) {
    console.error(`Email provider '${provider}' not supported. Using SendGrid as fallback.`)
    return emailProviders.sendgrid
  }

  return emailProviders[provider]
}

const sendEmail = async (to, subject, text, html, replyTo = null) => {
  try {
    const provider = getEmailProvider()

    const emailData = {
      to,
      subject,
      text,
      html,
      replyTo,
      from: {
        email: process.env.FROM_EMAIL || "noreply@yoursite.com",
        name: process.env.SITE_NAME || "Anonymous Personals",
      },
    }

    const result = await provider.sendEmail(emailData)
    console.log(`Email sent via ${process.env.EMAIL_PROVIDER || "sendgrid"}:`, result.messageId)
    return { success: true, messageId: result.messageId, provider: process.env.EMAIL_PROVIDER || "sendgrid" }
  } catch (error) {
    console.error("Email sending error:", error)
    return { success: false, error: error.message }
  }
}

const testConnection = async () => {
  try {
    const provider = getEmailProvider()

    if (provider.testConnection) {
      const result = await provider.testConnection()
      console.log(
        `Email provider ${process.env.EMAIL_PROVIDER || "sendgrid"} connection test:`,
        result ? "SUCCESS" : "FAILED",
      )
      return result
    }

    // If no test method, try sending a test email to a dummy address
    const testResult = await sendEmail(
      "test@example.com",
      "Test Email",
      "This is a test email to verify configuration.",
      "<p>This is a test email to verify configuration.</p>",
    )

    return testResult.success
  } catch (error) {
    console.error("Email connection test failed:", error)
    return false
  }
}

module.exports = {
  sendEmail,
  testConnection,
}
