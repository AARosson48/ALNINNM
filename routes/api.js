const express = require("express")
const router = express.Router()
const db = require("../config/database")
const { hashIP, getClientIP, cleanupExpiredAds } = require("../utils/helpers")

// Create ad
router.post("/ads", async (req, res) => {
  try {
    const { title, body, location, contact_email } = req.body
    const clientIP = getClientIP(req)
    const ipHash = hashIP(clientIP)

    // Validate required fields
    if (!title || !body || !location) {
      return res.status(400).json({ error: "Title, body, and location are required" })
    }

    // Validate email if provided
    if (contact_email && !isValidEmail(contact_email)) {
      return res.status(400).json({ error: "Please provide a valid email address" })
    }

    // Check if user already has an active ad
    const existingAds = await db.query(
      "SELECT id FROM ads WHERE ip_hash = ? AND is_active = TRUE AND expires_at > NOW()",
      [ipHash],
    )

    if (existingAds.length > 0) {
      return res.status(400).json({
        error: "You already have an active ad. Please wait for it to expire or delete it first.",
      })
    }

    // Check for recent reposts
    const recentSimilar = await db.query(
      "SELECT COUNT(*) as count FROM ads WHERE ip_hash = ? AND title = ? AND body = ?",
      [ipHash, title, body],
    )

    const repostCount = recentSimilar[0].count || 0

    // Create the ad
    const result = await db.query(
      "INSERT INTO ads (title, body, location, contact_email, ip_hash, repost_count) VALUES (?, ?, ?, ?, ?, ?)",
      [title, body, location, contact_email || null, ipHash, repostCount],
    )

    // Generate relay email if contact email provided
    if (contact_email) {
      const { createAdRelay } = require("../utils/email-relay")
      await createAdRelay(result.insertId, contact_email)
    }

    // Update location count
    await db.query(
      "INSERT INTO locations (name, ad_count) VALUES (?, 1) ON DUPLICATE KEY UPDATE ad_count = ad_count + 1",
      [location],
    )

    // Update user behavior
    await db.query(
      `INSERT INTO user_behavior (ip_hash, ads_posted, last_activity) 
       VALUES (?, 1, NOW()) 
       ON DUPLICATE KEY UPDATE 
       ads_posted = ads_posted + 1, 
       last_activity = NOW()`,
      [ipHash],
    )

    res.json({ success: true, id: result.insertId })
  } catch (error) {
    console.error("Error creating ad:", error)
    res.status(500).json({ error: "Failed to create ad" })
  }
})

// Update ad
router.put("/ads/:id", async (req, res) => {
  try {
    const adId = Number.parseInt(req.params.id)
    const { title, body, location, contact_method } = req.body
    const clientIP = getClientIP(req)
    const ipHash = hashIP(clientIP)

    // Verify ownership
    const existingAds = await db.query("SELECT * FROM ads WHERE id = ? AND ip_hash = ? AND is_active = TRUE", [
      adId,
      ipHash,
    ])

    if (existingAds.length === 0) {
      return res.status(404).json({ error: "Ad not found or you do not have permission to edit it" })
    }

    // Update the ad
    await db.query("UPDATE ads SET title = ?, body = ?, location = ?, contact_method = ? WHERE id = ?", [
      title,
      body,
      location,
      contact_method || null,
      adId,
    ])

    res.json({ success: true })
  } catch (error) {
    console.error("Error updating ad:", error)
    res.status(500).json({ error: "Failed to update ad" })
  }
})

// Delete ad
router.delete("/ads/:id", async (req, res) => {
  try {
    const adId = Number.parseInt(req.params.id)
    const clientIP = getClientIP(req)
    const ipHash = hashIP(clientIP)

    // Verify ownership
    const existingAds = await db.query("SELECT * FROM ads WHERE id = ? AND ip_hash = ? AND is_active = TRUE", [
      adId,
      ipHash,
    ])

    if (existingAds.length === 0) {
      return res.status(404).json({ error: "Ad not found or you do not have permission to delete it" })
    }

    // Soft delete the ad
    await db.query("UPDATE ads SET is_active = FALSE WHERE id = ?", [adId])

    // Update location count
    const ad = existingAds[0]
    await db.query("UPDATE locations SET ad_count = ad_count - 1 WHERE name = ?", [ad.location])

    // Remove locations with 0 ads
    await db.query("DELETE FROM locations WHERE ad_count <= 0")

    res.json({ success: true })
  } catch (error) {
    console.error("Error deleting ad:", error)
    res.status(500).json({ error: "Failed to delete ad" })
  }
})

// Vote on ad
router.post("/votes", async (req, res) => {
  try {
    const { ad_id, vote_type } = req.body
    const clientIP = getClientIP(req)
    const ipHash = hashIP(clientIP)

    if (!ad_id || !vote_type || !["up", "down"].includes(vote_type)) {
      return res.status(400).json({ error: "Invalid vote data" })
    }

    // Check if user already voted
    const existingVotes = await db.query("SELECT * FROM votes WHERE ad_id = ? AND ip_hash = ?", [ad_id, ipHash])

    if (existingVotes.length > 0) {
      const existingVote = existingVotes[0]

      if (existingVote.vote_type !== vote_type) {
        // Update existing vote
        await db.query("UPDATE votes SET vote_type = ? WHERE ad_id = ? AND ip_hash = ?", [vote_type, ad_id, ipHash])

        // Update ad vote counts
        if (vote_type === "up") {
          await db.query("UPDATE ads SET up_votes = up_votes + 1, down_votes = down_votes - 1 WHERE id = ?", [ad_id])

          // Update user behavior
          await db.query(
            `UPDATE user_behavior 
             SET total_up_votes_given = total_up_votes_given + 1,
                 total_down_votes_given = total_down_votes_given - 1,
                 last_activity = NOW()
             WHERE ip_hash = ?`,
            [ipHash],
          )
        } else {
          await db.query("UPDATE ads SET down_votes = down_votes + 1, up_votes = up_votes - 1 WHERE id = ?", [ad_id])

          // Update user behavior
          await db.query(
            `UPDATE user_behavior 
             SET total_down_votes_given = total_down_votes_given + 1,
                 total_up_votes_given = total_up_votes_given - 1,
                 last_activity = NOW()
             WHERE ip_hash = ?`,
            [ipHash],
          )
        }
      }

      return res.json({ success: true, message: "Vote updated" })
    }

    // Create new vote
    await db.query("INSERT INTO votes (ad_id, ip_hash, vote_type) VALUES (?, ?, ?)", [ad_id, ipHash, vote_type])

    // Update ad vote counts
    if (vote_type === "up") {
      await db.query("UPDATE ads SET up_votes = up_votes + 1 WHERE id = ?", [ad_id])
    } else {
      await db.query("UPDATE ads SET down_votes = down_votes + 1 WHERE id = ?", [ad_id])
    }

    // Update user behavior
    const voteColumn = vote_type === "up" ? "total_up_votes_given" : "total_down_votes_given"
    await db.query(
      `INSERT INTO user_behavior (ip_hash, ${voteColumn}, last_activity) 
       VALUES (?, 1, NOW()) 
       ON DUPLICATE KEY UPDATE 
       ${voteColumn} = ${voteColumn} + 1, 
       last_activity = NOW()`,
      [ipHash],
    )

    res.json({ success: true, message: "Vote recorded" })
  } catch (error) {
    console.error("Error recording vote:", error)
    res.status(500).json({ error: "Failed to record vote" })
  }
})

// Send message through email relay
router.post("/contact", async (req, res) => {
  try {
    const { ad_id, sender_email, sender_name, subject, message } = req.body

    // Validate required fields
    if (!ad_id || !sender_email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required" })
    }

    if (!isValidEmail(sender_email)) {
      return res.status(400).json({ error: "Please provide a valid email address" })
    }

    // Rate limiting per IP
    const clientIP = getClientIP(req)
    const ipHash = hashIP(clientIP)

    // Check recent messages from this IP
    const recentMessages = await db.query(
      "SELECT COUNT(*) as count FROM email_relays WHERE sender_email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)",
      [sender_email],
    )

    if (recentMessages[0].count >= 5) {
      return res.status(429).json({ error: "Too many messages sent. Please wait before sending another." })
    }

    const { sendRelayMessage } = require("../utils/email-relay")
    const result = await sendRelayMessage(ad_id, sender_email, sender_name, subject, message)

    if (result.success) {
      res.json({ success: true, message: "Message sent successfully!" })
    } else {
      res.status(500).json({ error: "Failed to send message" })
    }
  } catch (error) {
    console.error("Error sending contact message:", error)
    res.status(500).json({ error: error.message || "Failed to send message" })
  }
})

// Webhook endpoint for processing incoming email replies
router.post("/email-webhook", async (req, res) => {
  try {
    // This endpoint would be called by your email service (SendGrid, Mailgun, etc.)
    const { to, from, subject, text, html } = req.body

    const { processIncomingReply } = require("../utils/email-relay")
    const processed = await processIncomingReply(to, from, subject, text, html)

    if (processed) {
      res.json({ success: true })
    } else {
      res.status(400).json({ error: "Could not process email" })
    }
  } catch (error) {
    console.error("Error processing email webhook:", error)
    res.status(500).json({ error: "Failed to process email" })
  }
})

// Helper function to validate email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

module.exports = router
