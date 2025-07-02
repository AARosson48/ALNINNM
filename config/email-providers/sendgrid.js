const sgMail = require("@sendgrid/mail")

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

const sendEmail = async (emailData) => {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error("SendGrid API key not configured")
    }

    const msg = {
      to: emailData.to,
      from: {
        email: emailData.from.email,
        name: emailData.from.name,
      },
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
    }

    if (emailData.replyTo) {
      msg.replyTo = emailData.replyTo
    }

    const response = await sgMail.send(msg)

    return {
      success: true,
      messageId: response[0].headers["x-message-id"] || "sendgrid-" + Date.now(),
      response: response[0],
    }
  } catch (error) {
    console.error("SendGrid error:", error)
    throw new Error(`SendGrid: ${error.message}`)
  }
}

const testConnection = async () => {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.log("SendGrid API key not provided")
      return false
    }

    // Test by attempting to send a test email to a sandbox address
    // This is the most reliable way to test SendGrid API key validity
    const testMsg = {
      to: "test@example.com", // This won't actually send due to sandbox mode
      from: {
        email: process.env.FROM_EMAIL || "test@example.com",
        name: process.env.SITE_NAME || "Test",
      },
      subject: "SendGrid API Test",
      text: "This is a test message to verify SendGrid API key.",
      html: "<p>This is a test message to verify SendGrid API key.</p>",
      mailSettings: {
        sandboxMode: {
          enable: true, // Enable sandbox mode so no actual email is sent
        },
      },
    }

    try {
      const response = await sgMail.send(testMsg)
      console.log("SendGrid API test successful (sandbox mode)")
      return true
    } catch (sendError) {
      console.error("SendGrid send test failed:", sendError.message)

      // If sandbox test fails, try a simpler API validation
      // Use the Web API v3 to check API key validity
      const axios = require("axios")

      try {
        // Try the API key validation endpoint
        const response = await axios.get("https://api.sendgrid.com/v3/api_keys", {
          headers: {
            Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        })

        if (response.status === 200) {
          console.log("SendGrid API key validation successful")
          return true
        }
      } catch (apiError) {
        console.error("SendGrid API key validation failed:", apiError.response?.status, apiError.response?.data)

        // Final fallback - try to get user profile (requires fewer permissions)
        try {
          const profileResponse = await axios.get("https://api.sendgrid.com/v3/user/username", {
            headers: {
              Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          })

          if (profileResponse.status === 200) {
            console.log("SendGrid username API test successful")
            return true
          }
        } catch (profileError) {
          console.error("SendGrid username API also failed:", profileError.response?.status)
        }
      }

      return false
    }
  } catch (error) {
    console.error("SendGrid connection test failed:", error.message)
    return false
  }
}

module.exports = {
  sendEmail,
  testConnection,
}
