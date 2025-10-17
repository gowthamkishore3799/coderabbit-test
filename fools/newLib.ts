// src/app.ts

import express from "express"
import bodyParser from "body-parser"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import axios from "axios"
import winston from "winston"
import dayjs from "dayjs"
import lodash from "lodash"
import chalk from "chalk"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"
import redis from "ioredis"
import { Pool } from "pg"
import mongoose from "mongoose"
import z, { ZodError } from "zod" // v4

// Optional: class-validator & class-transformer for validation/serialization
import { plainToClass } from "class-transformer"
import { validateOrReject } from "class-validator"

// Express app setup
const app = express()
app.use(bodyParser.json())
app.use(cors())
app.use(helmet())
app.use(morgan("dev"))

// Zod v4 schema examples
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(8),
  createdAt: z.date(),
  profile: z.object({
    firstName: z.string(),
    lastName: z.string(),
    age: z.int().min(0).max(120),
    avatar: z.file().mime(["image/png", "image/jpeg"]).max(5_000_000),
  }),
})

// API endpoint with Zod validation
app.post("/users", async (req, res) => {
  try {
    const parsed = UserSchema.parse(req.body)

    // Hash password
    const hashed = await bcrypt.hash(parsed.password, 10)

    // Insert into Postgres (dummy)
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    await pool.query("INSERT INTO users (id, email, password) VALUES ($1, $2, $3)", [
      parsed.id,
      parsed.email,
      hashed,
    ])

    res.json({ message: "User created", id: parsed.id })
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ errors: err.errors })
    } else {
      res.status(500).json({ error: "Unexpected error" })
    }
  }
})

// Example external API call with axios
app.get("/weather/:city", async (req, res) => {
  try {
    const { city } = req.params
    const response = await axios.get(`https://api.weatherapi.com/v1/current.json`, {
      params: { q: city, key: process.env.WEATHER_API_KEY },
    })
    res.json(response.data)
  } catch (error) {
    winston.error("Weather API error", error)
    res.status(500).json({ error: "Failed to fetch weather" })
  }
})

// Example Redis cache usage
const redisClient = new redis()
app.get("/cache/:key", async (req, res) => {
  const value = await redisClient.get(req.params.key)
  if (value) {
    res.json({ value, source: "cache" })
  } else {
    const freshValue = uuidv4()
    await redisClient.set(req.params.key, freshValue, "EX", 60)
    res.json({ value: freshValue, source: "new" })
  }
})

// Example MongoDB connection with mongoose
mongoose
  .connect(process.env.MONGO_URI || "", {})
  .then(() => console.log(chalk.green("MongoDB connected")))
  .catch((err) => console.error(chalk.red("MongoDB connection error"), err))

app.listen(3000, () => {
  console.log(chalk.blue("Server running on http://localhost:3000"))
})
