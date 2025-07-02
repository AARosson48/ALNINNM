const postmark = require("postmark")

let client = null

const getPostmarkClient = () => {
  if (!client && process.env.POSTMARK_API_KEY) {
    client = new postmark.ServerClient(process.env.POSTMARK_API_KEY)
  }
  return client
}

const sendEmail = async (emailData) => {
  try {
    if (!process.env.POSTMARK_API_KEY) {
      throw new Error("Postmark API key not configured")
    }

    const postmarkClient = getPostmarkClient()

    const emailPayload = {
      From: `${emailData.from.name} <${emailData.from.email}>`,
      To: emailData.to,
      Subject: emailData.subject,
      TextBody: emailData.text,
      HtmlBody: emailData.html,
    }

    if (emailData.replyTo) {
      emailPayload.ReplyTo = emailData.replyTo
    }

    const response = await postmarkClient.sendEmail(emailPayload)

    return {
      success: true,
      messageId: response.MessageID || "postmark-" + Date.now(),
      response: response,
    }
  } catch (error) {
    console.error("Postmark error:", error)
    throw new Error(`Postmark: ${error.message}`)
  }
}

const testConnection = async () => {
  try {
    if (!process.env.POSTMARK_API_KEY) {
      return false
    }

    const postmarkClient = getPostmarkClient()

    // Test by getting server info
    const response = await postmarkClient.getServer()
    return response && response.ID
  } catch (error) {
    console.error("Postmark connection test failed:", error)
    return false
  }
}

module.exports = {
  sendEmail,
  testConnection,
}
