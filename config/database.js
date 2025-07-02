const mysql = require("mysql2/promise")
require("dotenv").config()

let pool = null

const createPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: "utf8mb4",
      timezone: "+00:00",
    })
  }
  return pool
}

const getConnection = async () => {
  try {
    const pool = createPool()
    return await pool.getConnection()
  } catch (error) {
    console.error("Database connection error:", error)
    throw error
  }
}

const query = async (sql, params = []) => {
  let connection
  try {
    connection = await getConnection()
    const [results] = await connection.execute(sql, params)
    return results
  } catch (error) {
    console.error("Database query error:", error)
    console.error("SQL:", sql)
    console.error("Params:", params)
    throw error
  } finally {
    if (connection) connection.release()
  }
}

const testConnection = async () => {
  try {
    const connection = await getConnection()
    await connection.ping()
    connection.release()
    console.log("Database connection successful")
    return true
  } catch (error) {
    console.error("Database connection failed:", error)
    return false
  }
}

// Cleanup function for graceful shutdown
const closePool = async () => {
  if (pool) {
    await pool.end()
    console.log("Database pool closed")
  }
}

module.exports = {
  query,
  getConnection,
  testConnection,
  createPool,
  closePool,
}
