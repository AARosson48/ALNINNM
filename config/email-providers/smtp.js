const nodemailer = require("nodemailer")

let transporter = null

const createTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: Number.parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    })
  }
  return transporter
}

const sendEmail = async (emailData) => {
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      throw new Error("SMTP configuration not complete")
    }

    const transporter = createTransporter()

    const mailOptions = {
      from: `"${emailData.from.name}" <${emailData.from.email}>`,
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
    }

    if (emailData.replyTo) {
      mailOptions.replyTo = emailData.replyTo
    }

    const info = await transporter.sendMail(mailOptions)

    return {
      success: true,
      messageId: info.messageId || "smtp-" + Date.now(),
      response: info,
    }
  } catch (error) {
    console.error("SMTP error:", error)
    throw new Error(`SMTP: ${error.message}`)
  }
}

const testConnection = async () => {
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      return false
    }

    const transporter = createTransporter()
    await transporter.verify()
    return true
  } catch (error) {
    console.error("SMTP connection test failed:", error)
    return false
  }
}

module.exports = {
  sendEmail,
  testConnection,
}
