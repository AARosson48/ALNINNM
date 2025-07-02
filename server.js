const express = require("express")
const path = require("path")
const bodyParser = require("body-parser")
const session = require("express-session")
const flash = require("connect-flash")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const expressLayouts = require("express-ejs-layouts")
require("dotenv").config()

const app = express()
const PORT = process.env.PORT || 3000

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow inline styles for simplicity
  }),
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
})
app.use(limiter)

// Stricter rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 API requests per windowMs
})
app.use("/api", apiLimiter)

// Middleware
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, "public")))

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-this",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
)

app.use(flash())

// View engine setup
app.use(expressLayouts)
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
app.set("layout", "layout")

// Global variables for templates
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg")
  res.locals.error_msg = req.flash("error_msg")
  res.locals.error = req.flash("error")
  res.locals.site_name = process.env.SITE_NAME || "Anonymous Personals"
  res.locals.site_url = process.env.SITE_URL || "http://localhost:3000"
  next()
})

// Check if installation is needed
app.use((req, res, next) => {
  if (!req.path.startsWith("/install") && !req.path.startsWith("/public")) {
    const fs = require("fs")
    if (!fs.existsSync(".env") || !process.env.DB_HOST) {
      return res.redirect("/install")
    }
  }
  next()
})

// Routes
app.use("/", require("./routes/index"))
app.use("/api", require("./routes/api"))
app.use("/install", require("./routes/install"))

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).render("error", {
    title: "Server Error",
    message: "Something went wrong! Please try again later.",
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).render("error", {
    title: "Page Not Found",
    message: "The page you are looking for does not exist.",
  })
})

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully")
  process.exit(0)
})

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully")
  process.exit(0)
})

app.listen(PORT, () => {
  console.log(`Anonymous Personals server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`)
  console.log(`Visit http://localhost:${PORT} to get started`)
})

module.exports = app
