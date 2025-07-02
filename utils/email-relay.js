const { v4: uuidv4 } = require("uuid")
const crypto = require("crypto")
const db = require("../config/database")
const { sendEmail } = require("../config/email")

// Generate a unique relay email address
const generateRelayEmail = () => {
  const code = crypto.randomBytes(8).toString("hex")
  return `${code}@${process.env.RELAY_DOMAIN || "relay.yoursite.com"}`
}

// Generate a unique relay code for conversations
const generateRelayCode = () => {
  return crypto.randomBytes(16).toString("hex")
}

// Create email relay for an ad
const createAdRelay = async (adId, posterEmail) => {
  try {
    const relayEmail = generateRelayEmail()

    await db.query("UPDATE ads SET contact_email = ?, relay_email = ? WHERE id = ?", [posterEmail, relayEmail, adId])

    return relayEmail
  } catch (error) {
    console.error("Error creating ad relay:", error)
    throw error
  }
}

// Send message through relay system
const sendRelayMessage = async (adId, senderEmail, senderName, subject, message) => {
  try {
    // Get ad details
    const ads = await db.query("SELECT * FROM ads WHERE id = ? AND is_active = TRUE", [adId])

    if (ads.length === 0) {
      throw new Error("Ad not found or expired")
    }

    const ad = ads[0]

    if (!ad.contact_email) {
      throw new Error("No contact email available for this ad")
    }

    // Create or get existing relay conversation
    let relayCode = generateRelayCode()

    // Check if there's already a conversation between these parties
    const existingRelay = await db.query(
      "SELECT * FROM email_relays WHERE ad_id = ? AND sender_email = ? AND is_active = TRUE",
      [adId, senderEmail],
    )

    if (existingRelay.length > 0) {
      relayCode = existingRelay[0].relay_code
      // Update last used timestamp
      await db.query("UPDATE email_relays SET last_used = NOW() WHERE id = ?", [existingRelay[0].id])
    } else {
      // Create new relay conversation
      await db.query(
        "INSERT INTO email_relays (ad_id, relay_code, sender_email, recipient_email) VALUES (?, ?, ?, ?)",
        [adId, relayCode, senderEmail, ad.contact_email],
      )
    }

    // Prepare email content
    const emailSubject = `[Anonymous Personals] Re: ${ad.title}`
    const emailText = `You received a message about your personal ad: "${ad.title}"

From: ${senderName || "Anonymous"}
Subject: ${subject}

Message:
${message}

---
To reply to this message, simply reply to this email. Your response will be forwarded anonymously.

Ad Link: ${process.env.SITE_URL}/ad/${adId}
Relay Code: ${relayCode}

This message was sent through Anonymous Personals email relay system to protect your privacy.`

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0;">Message about your personal ad</h2>
          <p style="color: #666; margin: 5px 0 0 0;">Ad: "${ad.title}"</p>
        </div>
        
        <div style="background: white; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <p><strong>From:</strong> ${senderName || "Anonymous"}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          
          <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-left: 4px solid #007bff;">
            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">
              <strong>To reply:</strong> Simply reply to this email. Your response will be forwarded anonymously.<br>
              <strong>Ad Link:</strong> <a href="${process.env.SITE_URL}/ad/${adId}">View Original Ad</a><br>
              <strong>Relay Code:</strong> ${relayCode}
            </p>
          </div>
        </div>
        
        <div style="margin-top: 20px; text-align: center; color: #666; font-size: 12px;">
          This message was sent through Anonymous Personals email relay system to protect your privacy.
        </div>
      </div>
    `

    // Set reply-to as the relay email for this conversation
    const replyToEmail = `${relayCode}@${process.env.RELAY_DOMAIN || "relay.yoursite.com"}`

    const result = await sendEmail(ad.contact_email, emailSubject, emailText, emailHtml, replyToEmail)

    if (result.success) {
      return { success: true, relayCode }
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error("Error sending relay message:", error)
    throw error
  }
}

// Handle incoming email replies (for webhook/SMTP processing)
const processIncomingReply = async (to, from, subject, text, html) => {
  try {
    // Extract relay code from the 'to' email address
    const relayCode = to.split("@")[0]

    // Find the relay conversation
    const relays = await db.query("SELECT * FROM email_relays WHERE relay_code = ? AND is_active = TRUE", [relayCode])

    if (relays.length === 0) {
      console.log("No active relay found for code:", relayCode)
      return false
    }

    const relay = relays[0]

    // Determine who is replying and who should receive the message
    let recipientEmail, senderType

    if (from.toLowerCase() === relay.recipient_email.toLowerCase()) {
      // Original ad poster is replying
      recipientEmail = relay.sender_email
      senderType = "poster"
    } else if (from.toLowerCase() === relay.sender_email.toLowerCase()) {
      // Original message sender is replying
      recipientEmail = relay.recipient_email
      senderType = "inquirer"
    } else {
      console.log("Reply from unauthorized email:", from)
      return false
    }

    // Get ad details for context
    const ads = await db.query("SELECT title FROM ads WHERE id = ?", [relay.ad_id])
    const adTitle = ads.length > 0 ? ads[0].title : "Personal Ad"

    // Prepare forwarded email
    const forwardedSubject = `[Anonymous Personals] ${subject.replace(/^(Re:\s*)+/i, "Re: ")}`
    const forwardedText = `You received a reply through Anonymous Personals:

${text}

---
To reply to this message, simply reply to this email.

Original Ad: "${adTitle}"
Relay Code: ${relayCode}

This message was forwarded through Anonymous Personals email relay system.`

    const forwardedHtml = html
      ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #333; margin: 0;">Reply via Anonymous Personals</h3>
          <p style="color: #666; margin: 5px 0 0 0;">Re: "${adTitle}"</p>
        </div>
        
        <div style="background: white; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          ${html}
        </div>
        
        <div style="margin-top: 15px; text-align: center; color: #666; font-size: 12px;">
          To reply, simply reply to this email. Relay Code: ${relayCode}
        </div>
      </div>
    `
      : null

    // Send the forwarded message
    const replyToEmail = `${relayCode}@${process.env.RELAY_DOMAIN || "relay.yoursite.com"}`
    const result = await sendEmail(recipientEmail, forwardedSubject, forwardedText, forwardedHtml, replyToEmail)

    if (result.success) {
      // Update last used timestamp
      await db.query("UPDATE email_relays SET last_used = NOW() WHERE id = ?", [relay.id])
      return true
    }

    return false
  } catch (error) {
    console.error("Error processing incoming reply:", error)
    return false
  }
}

module.exports = {
  generateRelayEmail,
  createAdRelay,
  sendRelayMessage,
  processIncomingReply,
}
