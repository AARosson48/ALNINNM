const crypto = require("crypto")
const moment = require("moment")

const hashIP = (ip) => {
  const salt = process.env.IP_SALT || "default-salt"
  return crypto
    .createHash("sha256")
    .update(ip + salt)
    .digest("hex")
}

const getClientIP = (req) => {
  return (
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
    "127.0.0.1"
  )
}

const formatTimeAgo = (date) => {
  return moment(date).fromNow()
}

const formatExpiresIn = (date) => {
  const now = moment()
  const expiry = moment(date)

  if (expiry.isBefore(now)) {
    return "expired"
  }

  return expiry.fromNow()
}

const cleanupExpiredAds = async (db) => {
  try {
    const result = await db.query("UPDATE ads SET is_active = FALSE WHERE expires_at < NOW() AND is_active = TRUE")
    return result.affectedRows || 0
  } catch (error) {
    console.error("Error cleaning up expired ads:", error)
    return 0
  }
}

module.exports = {
  hashIP,
  getClientIP,
  formatTimeAgo,
  formatExpiresIn,
  cleanupExpiredAds,
}
