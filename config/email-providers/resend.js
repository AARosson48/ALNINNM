const { Resend } = require("resend")

let resend = null

const getResendClient = () => {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

const sendEmail = async (emailData) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("Resend API key not configured")
    }

    const client = getResendClient()

    const emailPayload = {
      from: `${emailData.from.name} <${emailData.from.email}>`,
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
    }

    if (emailData.replyTo) {
      emailPayload.reply_to = emailData.replyTo
    }

    const response = await client.emails.send(emailPayload)

    return {
      success: true,
      messageId: response.data?.id || "resend-" + Date.now(),
      response: response,
    }
  } catch (error) {
    console.error("Resend error:", error)
    throw new Error(`Resend: ${error.message}`)
  }
}

const testConnection = async () => {
  try {
    if (!process.env.RESEND_API_KEY) {
      return false
    }

    const client = getResendClient()

    // Test by getting API key info
    const response = await client.apiKeys.list()
    return response && !response.error
  } catch (error) {
    console.error("Resend connection test failed:", error)
    return false
  }
}

module.exports = {
  sendEmail,
  testConnection,
}
