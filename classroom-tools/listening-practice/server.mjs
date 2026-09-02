import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(root, "dist");
const dataDir = path.join(root, "data");
const attemptsFile = path.join(dataDir, "attempts.json");
const questionBankFile = path.join(dataDir, "question-bank.json");
const classroomConfigFile = path.join(dataDir, "classroom-config.json");
const port = Number(process.env.PORT || 4173);

fs.mkdirSync(dataDir, { recursive: true });

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; }
}

function writeJson(file, value) {
  const tempFile = `${file}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(value, null, 2));
  fs.renameSync(tempFile, file);
}

function body(request) {
  return new Promise((resolve, reject) => {
    let raw = "";
    request.on("data", (chunk) => { raw += chunk; if (raw.length > 2_000_000) reject(new Error("Request too large")); });
    request.on("end", () => { try { resolve(raw ? JSON.parse(raw) : null); } catch { reject(new Error("Invalid JSON")); } });
    request.on("error", reject);
  });
}

function send(response, status, value, contentType = "application/json; charset=utf-8") {
  response.writeHead(status, { "Content-Type": contentType, "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" });
  response.end(contentType.startsWith("application/json") ? JSON.stringify(value) : value);
}

function validateAttempt(value) {
  return value && typeof value.id === "string" && typeof value.classId === "string" && typeof value.studentCode === "string" && typeof value.setId === "string" && Array.isArray(value.responses);
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  try {
    if (request.method === "GET" && requestUrl.pathname === "/api/health") return send(response, 200, { ok: true, service: "vinh-listening-practice" });
    if (request.method === "GET" && requestUrl.pathname === "/api/attempts") return send(response, 200, readJson(attemptsFile, []));
    if (request.method === "GET" && requestUrl.pathname === "/api/classroom-config") {
      if (!fs.existsSync(classroomConfigFile)) return send(response, 404, { error: "Classroom config not imported" });
      return send(response, 200, readJson(classroomConfigFile, { courses: [], classes: [] }));
    }
    if (request.method === "POST" && requestUrl.pathname === "/api/classroom-config") {
      const config = await body(request);
      if (!config || !Array.isArray(config.courses) || !Array.isArray(config.classes)) return send(response, 400, { error: "Classroom config must contain courses and classes arrays" });
      writeJson(classroomConfigFile, config);
      return send(response, 201, { ok: true });
    }
    if (request.method === "POST" && requestUrl.pathname === "/api/attempts") {
      const attempt = await body(request);
      if (!validateAttempt(attempt)) return send(response, 400, { error: "Invalid attempt" });
      const attempts = readJson(attemptsFile, []);
      const duplicate = attempts.find((item) => item.submissionKey && item.submissionKey === attempt.submissionKey);
      if (duplicate) return send(response, 200, { ok: true, duplicate: true, attempt: duplicate });
      const savedAttempt = {
        ...attempt,
        attemptNumber: attempts.filter((item) => item.courseId === attempt.courseId && item.classId === attempt.classId && item.studentCode === attempt.studentCode && item.setId === attempt.setId).length + 1
      };
      attempts.unshift(savedAttempt);
      writeJson(attemptsFile, attempts);
      return send(response, 201, { ok: true, attempt: savedAttempt });
    }
    if (request.method === "GET" && requestUrl.pathname === "/api/question-bank") {
      if (!fs.existsSync(questionBankFile)) return send(response, 404, { error: "Question bank not imported" });
      return send(response, 200, readJson(questionBankFile, []));
    }
    if (request.method === "POST" && requestUrl.pathname === "/api/question-bank") {
      const questionSets = await body(request);
      if (!Array.isArray(questionSets)) return send(response, 400, { error: "Question bank must be an array" });
      writeJson(questionBankFile, questionSets);
      return send(response, 201, { ok: true, count: questionSets.length });
    }

    if (request.method !== "GET" && request.method !== "HEAD") return send(response, 405, { error: "Method not allowed" });
    const requested = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
    const safePath = path.resolve(distDir, `.${requested}`);
    if (!safePath.startsWith(`${path.resolve(distDir)}${path.sep}`)) return send(response, 403, { error: "Forbidden" });
    const file = fs.existsSync(safePath) && fs.statSync(safePath).isFile() ? safePath : path.join(distDir, "index.html");
    const extension = path.extname(file);
    const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml" };
    response.writeHead(200, { "Content-Type": types[extension] || "application/octet-stream" });
    if (request.method === "HEAD") return response.end();
    return response.end(fs.readFileSync(file));
  } catch (error) {
    return send(response, 500, { error: error.message || "Server error" });
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`荣市大学听力练习已启动：http://localhost:${port}`);
  console.log(`手机请使用本机局域网 IP：http://<你的IP>:${port}`);
});
