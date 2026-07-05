import express from "express";
import pool from "./db.js";
import redisClient from "./redis.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/todos", async (req, res) => {
  try {
    // 1. Check if the todos are cached in Redis
    const todos = await redisClient.get("todos");
    if (todos) {
      console.log("Todos retrieved from Redis");
      return res.json({
        todos: JSON.parse(todos),
      });
    }

    // 2. If not found, query the db
    const response = await pool.query(`SELECT * FROM todos`);
    const todosFromDB = response.rows;

    await redisClient.set("todos", JSON.stringify(todosFromDB), {
      EX: 3600,
    });

    return res.json({
      todosFromDB,
    });
  } catch (err) {
    console.error("Error fetching todos:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/todos", async (req, res) => {
  const { title, description } = req.body;

  try {
    await redisClient.del("todos");

    const response = await pool.query(
      `INSERT INTO todos (title, description) VALUES ($1, $2) RETURNING *`,
      [title, description],
    );

    return res.status(201).json({
      todo: response.rows[0],
    });
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
