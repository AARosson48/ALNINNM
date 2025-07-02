const formData = require("form-data")
const Mailgun = require("mailgun.js")

const sendEmail = async (emailData) => {
  try {
    if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
      throw new Error("Mailgun API key or domain not configured")
    }

    const mailgun = new Mailgun(formData)
    const mg = mailgun.client({
      username: "api",
      key: process.env.MAILGUN_API_KEY,
      url: process.env.MAILGUN_URL || "https://api.mailgun.net", // EU: https://api.eu.mailgun.net
    })

    const messageData = {
      from: `${emailData.from.name} <${emailData.from.email}>`,
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
    }

    if (emailData.replyTo) {
      messageData["h:Reply-To"] = emailData.replyTo
    }

    const response = await mg.messages.create(process.env.MAILGUN_DOMAIN, messageData)

    return {
      success: true,
      messageId: response.id || "mailgun-" + Date.now(),
      response: response,
    }
  } catch (error) {
    console.error("Mailgun error:", error)
    throw new Error(`Mailgun: ${error.message}`)
  }
}

const testConnection = async () => {
  try {
    if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
      return false
    }

    const mailgun = new Mailgun(require("form-data"))
    const mg = mailgun.client({
      username: "api",
      key: process.env.MAILGUN_API_KEY,
      url: process.env.MAILGUN_URL || "https://api.mailgun.net",
    })

    // Test by getting domain info
    const response = await mg.domains.get(process.env.MAILGUN_DOMAIN)
    return response && response.name === process.env.MAILGUN_DOMAIN
  } catch (error) {
    console.error("Mailgun connection test failed:", error)
    return false
  }
}

module.exports = {
  sendEmail,
  testConnection,
}
