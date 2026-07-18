import express from "express";
import pool from "./db.js";
import redisClient from "./redis.js";
import dotenv from "dotenv";

dotenv.config();

export const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/cal", (req, res) => {
  const op = req.body.op;
  const a = req.body.a;
  const b = req.body.b;
  if(op == '+') {
    res.json({
      add: a+b
    })
  } else if (op == '-') {
    res.json({
      sub: a-b
    })
  } else if (op == '*') {
    res.json({
      mult: a*b
    })
  } else {
    if(b!=0)
      res.json({ div: a/b});
    else if(a!=0) 
      res.json({div: b/a});
    else {
      res.json({err:"error"})
    }
  }
})

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
    // Error handling for database errors
    console.error("Database error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/todos/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await redisClient.del("todos");

    const response = await pool.query(
      `DELETE FROM todos WHERE id = $1 RETURNING *`,
      [id],
    );

    if (response.rowCount === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }

    return res.json({
      message: "Todo deleted successfully",
      deletedTodo: response.rows[0],
    });
  } catch (err) {
    console.error("Error deleting todo:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
