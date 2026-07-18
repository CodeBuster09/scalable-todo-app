import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";

// ------------------------
// Mock PostgreSQL
// ------------------------
const mockQuery = jest.fn();

jest.unstable_mockModule("./db.js", () => ({
  default: {
    query: mockQuery,
  },
}));

// ------------------------
// Mock Redis
// ------------------------
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockDel = jest.fn();

jest.unstable_mockModule("./redis.js", () => ({
  default: {
    get: mockGet,
    set: mockSet,
    del: mockDel,
  },
}));

// Import app AFTER mocks
const { app } = await import("./index.js");

describe("Scalable Todo App - Comprehensive Test Suite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // 1. BASE ROUTE TESTS
  // ==========================================

  describe("GET /", () => {
    it("should return Hello World!", async () => {
      const res = await request(app).get("/");

      expect(res.status).toBe(200);
      expect(res.text).toBe("Hello World!");
    });
  });

  // ==========================================
  // 2. CALCULATOR TESTS
  // ==========================================

  describe("POST /cal", () => {
    it("should add two positive numbers", async () => {
      const res = await request(app)
        .post("/cal")
        .send({ op: "+", a: 5, b: 10 });

      expect(res.status).toBe(200);
      expect(res.body.add).toBe(15);
    });

    it("should subtract two numbers", async () => {
      const res = await request(app)
        .post("/cal")
        .send({ op: "-", a: 20, b: 8 });

      expect(res.status).toBe(200);
      expect(res.body.sub).toBe(12);
    });

    it("should multiply two numbers", async () => {
      const res = await request(app)
        .post("/cal")
        .send({ op: "*", a: 4, b: 3 });

      expect(res.status).toBe(200);
      expect(res.body.mult).toBe(12);
    });

    it("should divide normally", async () => {
      const res = await request(app)
        .post("/cal")
        .send({ op: "/", a: 20, b: 5 });

      expect(res.status).toBe(200);
      expect(res.body.div).toBe(4);
    });

    it("should flip division if b is 0", async () => {
      const res = await request(app)
        .post("/cal")
        .send({ op: "/", a: 4, b: 0 });

      expect(res.status).toBe(200);
      expect(res.body.div).toBe(0);
    });

    it("should return error if both numbers are 0", async () => {
      const res = await request(app)
        .post("/cal")
        .send({ op: "/", a: 0, b: 0 });

      expect(res.status).toBe(200);
      expect(res.body.err).toBe("error");
    });
  });

  // ==========================================
  // TODO TESTS
  // ==========================================

  describe("GET /todos", () => {
    it("should return todos from Redis if cache exists", async () => {
      mockGet.mockResolvedValue(
        JSON.stringify([
          {
            id: 1,
            title: "Cached Todo",
            description: "Cached Description",
          },
        ])
      );

      const res = await request(app).get("/todos");

      expect(res.status).toBe(200);

      expect(res.body.todos).toHaveLength(1);
      expect(res.body.todos[0].title).toBe("Cached Todo");

      expect(mockGet).toHaveBeenCalledWith("todos");
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("should fetch todos from DB if Redis cache misses", async () => {
      mockGet.mockResolvedValue(null);

      mockQuery.mockResolvedValue({
        rows: [
          {
            id: 1,
            title: "DB Todo",
            description: "Stored in DB",
          },
        ],
      });

      const res = await request(app).get("/todos");

      expect(res.status).toBe(200);

      expect(res.body.todosFromDB).toHaveLength(1);
      expect(res.body.todosFromDB[0].title).toBe("DB Todo");

      expect(mockGet).toHaveBeenCalledWith("todos");

      expect(mockQuery).toHaveBeenCalledWith(
        "SELECT * FROM todos"
      );

      expect(mockSet).toHaveBeenCalled();
    });
  });

  describe("POST /todos", () => {
    it("should create a todo", async () => {
      mockDel.mockResolvedValue(1);

      mockQuery.mockResolvedValue({
        rows: [
          {
            id: 101,
            title: "Test Todo",
            description: "Testing",
          },
        ],
      });

      const res = await request(app)
        .post("/todos")
        .send({
          title: "Test Todo",
          description: "Testing",
        });

      expect(res.status).toBe(201);

      expect(res.body.todo.id).toBe(101);
      expect(res.body.todo.title).toBe("Test Todo");

      expect(mockDel).toHaveBeenCalledWith("todos");
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe("DELETE /todos/:id", () => {
    it("should delete an existing todo", async () => {
      mockDel.mockResolvedValue(1);

      mockQuery.mockResolvedValue({
        rowCount: 1,
        rows: [
          {
            id: 101,
            title: "Test Todo",
          },
        ],
      });

      const res = await request(app).delete("/todos/101");

      expect(res.status).toBe(200);

      expect(res.body.message).toBe(
        "Todo deleted successfully"
      );

      expect(res.body.deletedTodo.id).toBe(101);

      expect(mockDel).toHaveBeenCalledWith("todos");
    });

    it("should return 404 if todo doesn't exist", async () => {
      mockDel.mockResolvedValue(1);

      mockQuery.mockResolvedValue({
        rowCount: 0,
        rows: [],
      });

      const res = await request(app).delete("/todos/999999");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Todo not found");
    });
  });
});