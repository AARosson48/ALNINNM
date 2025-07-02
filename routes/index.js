const express = require("express")
const router = express.Router()
const db = require("../config/database")
const { formatTimeAgo, formatExpiresIn, cleanupExpiredAds } = require("../utils/helpers")

// Home page
router.get("/", async (req, res) => {
  try {
    // Clean up expired ads
    await cleanupExpiredAds(db)

    const { search, location, sort = "recent", page = 1 } = req.query
    const limit = 20
    const offset = (page - 1) * limit

    let query = `
      SELECT a.*, 
             COALESCE(ub.total_up_votes_given, 0) as poster_up_votes_given,
             COALESCE(ub.total_down_votes_given, 0) as poster_down_votes_given
      FROM ads a
      LEFT JOIN user_behavior ub ON a.ip_hash = ub.ip_hash
      WHERE a.is_active = TRUE AND a.expires_at > NOW()
    `

    const params = []

    if (location) {
      query += " AND a.location LIKE ?"
      params.push(`%${location}%`)
    }

    if (search) {
      query += " AND (a.title LIKE ? OR a.body LIKE ?)"
      params.push(`%${search}%`, `%${search}%`)
    }

    // Add sorting
    switch (sort) {
      case "popular":
        query += " ORDER BY (a.up_votes - a.down_votes) DESC, a.created_at DESC"
        break
      case "controversial":
        query += " ORDER BY (a.up_votes + a.down_votes) DESC, a.created_at DESC"
        break
      default:
        query += " ORDER BY a.created_at DESC"
    }

    query += " LIMIT ? OFFSET ?"
    params.push(limit, offset)

    const ads = await db.query(query, params)

    // Get locations for filter
    const locations = await db.query(
      "SELECT name, ad_count FROM locations WHERE ad_count > 0 ORDER BY ad_count DESC, name ASC LIMIT 50",
    )

    // Format dates
    ads.forEach((ad) => {
      ad.timeAgo = formatTimeAgo(ad.created_at)
      ad.expiresIn = formatExpiresIn(ad.expires_at)
    })

    res.render("index", {
      title: "Anonymous Personals",
      ads,
      locations,
      search: search || "",
      location: location || "",
      sort,
      currentPage: Number.parseInt(page),
      hasMore: ads.length === limit,
      formatTimeAgo,
      formatExpiresIn,
    })
  } catch (error) {
    console.error("Error loading home page:", error)
    req.flash("error_msg", "Error loading ads")
    res.render("index", {
      title: "Anonymous Personals",
      ads: [],
      locations: [],
      search: "",
      location: "",
      sort: "recent",
      currentPage: 1,
      hasMore: false,
    })
  }
})

// Post ad page
router.get("/post", (req, res) => {
  res.render("post", { title: "Post Your Ad" })
})

// View single ad
router.get("/ad/:id", async (req, res) => {
  try {
    const adId = Number.parseInt(req.params.id)

    const ads = await db.query(
      `
      SELECT a.*, 
             COALESCE(ub.total_up_votes_given, 0) as poster_up_votes_given,
             COALESCE(ub.total_down_votes_given, 0) as poster_down_votes_given
      FROM ads a
      LEFT JOIN user_behavior ub ON a.ip_hash = ub.ip_hash
      WHERE a.id = ? AND a.is_active = TRUE
    `,
      [adId],
    )

    if (ads.length === 0) {
      req.flash("error_msg", "Ad not found or has expired")
      return res.redirect("/")
    }

    const ad = ads[0]
    ad.timeAgo = formatTimeAgo(ad.created_at)
    ad.expiresIn = formatExpiresIn(ad.expires_at)

    res.render("ad-detail", {
      title: ad.title,
      ad,
    })
  } catch (error) {
    console.error("Error loading ad:", error)
    req.flash("error_msg", "Error loading ad")
    res.redirect("/")
  }
})

// Edit ad page
router.get("/edit/:id", async (req, res) => {
  try {
    const adId = Number.parseInt(req.params.id)

    const ads = await db.query("SELECT * FROM ads WHERE id = ? AND is_active = TRUE", [adId])

    if (ads.length === 0) {
      req.flash("error_msg", "Ad not found")
      return res.redirect("/")
    }

    res.render("edit", {
      title: "Edit Your Ad",
      ad: ads[0],
    })
  } catch (error) {
    console.error("Error loading edit page:", error)
    req.flash("error_msg", "Error loading ad")
    res.redirect("/")
  }
})

module.exports = router
