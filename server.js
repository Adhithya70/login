const express = require("express");
const mysql = require("mysql");
const session = require("express-session");
const bcrypt = require("bcrypt");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

// ✅ Enable CORS
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve static frontend files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// ✅ Session setup
app.use(
  session({
    secret: "my_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true }, // For development, set secure: true in production
  })
);

// ✅ MySQL Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root123",
  database: "role_based_auth",
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL Connection Failed:", err);
    process.exit(1);
  }
  console.log("✅ MySQL Connected...");
});

// ✅ Route: Serve Homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ User Registration
app.post("/register", async (req, res) => {
  try {
    const { user_id, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (user_id, password, role) VALUES (?, ?, ?)",
      [user_id, hashedPassword, role],
      (err, result) => {
        if (err) return res.status(500).json({ message: "User ID already exists" });
        res.status(201).json({ message: "User registered successfully" });
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ User Login
app.post("/login", (req, res) => {
  const { user_id, password } = req.body;

  db.query("SELECT * FROM users WHERE user_id = ?", [user_id], async (err, results) => {
    if (err || results.length === 0) return res.status(401).json({ message: "User not found" });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    req.session.user = { id: user.id, user_id: user.user_id, role: user.role };
    res.json({ message: "Login successful", role: user.role });
  });
});

// ✅ User Logout
app.post("/logout", (req, res) => {
  req.session.destroy();
  res.json({ message: "Logout successful" });
});

// ✅ Role-Based Access Middleware
const authMiddleware = (role) => (req, res, next) => {
  if (!req.session.user || req.session.user.role !== role) {
    return res.status(403).json({ message: "Access Denied" });
  }
  next();
};
app.get("/session", (req, res) => {
    if (req.session.user) {
      res.json({ loggedIn: true, role: req.session.user.role });
    } else {
      res.json({ loggedIn: false });
    }
  });
  
// ✅ Role-Specific Routes
app.get("/admin", authMiddleware("admin"), (req, res) => {
  res.json({ message: "Welcome, Admin!" });
});

app.get("/doctor", authMiddleware("doctor"), (req, res) => {
  res.json({ message: "Welcome, Doctor!" });
});

app.get("/patient", authMiddleware("patient"), (req, res) => {
  res.json({ message: "Welcome, Patient!" });
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
