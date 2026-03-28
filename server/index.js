const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Lead = require("./Lead");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./User");
require("dotenv").config();



const SECRET = process.env.JWT_SECRET;

const app = express();

app.use(cors());
app.use(express.json());

const auth = (req, res, next) => {
  let token = req.headers.authorization;

  if (!token) return res.status(401).send("No token");

  try {
    // If the token starts with "Bearer ", remove it
    if (token.startsWith("Bearer ")) {
      token = token.split(" ")[1];
    }

    const decoded = jwt.verify(token, SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    // If verification fails, send 401 instead of crashing the server (500)
    return res.status(401).send("Invalid Token");
  }
};


const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});


io.on("connection", (socket) => {
  console.log("User connected");
});

// connect DB
mongoose.connect(process.env.MONGO_URL);


// test route
app.get("/", (req, res) => {
  res.send("Server running");

});

app.post("/signup", async (req, res) => {
  const hashed = await bcrypt.hash(req.body.password, 10);

  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: hashed,
  });

  res.json(user);
});

app.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) return res.status(400).send("User not found");

  const valid = await bcrypt.compare(
    req.body.password,
    user.password
  );

  if (!valid) return res.status(400).send("Wrong password");

  const token = jwt.sign({ id: user._id }, SECRET);

  res.json({ token });
});

// CREATE LEAD
app.post("/leads", auth, async (req, res) => {
  const lead = await Lead.create({
    ...req.body,
    assignedTo: req.userId,
  });

  io.emit("newLead", lead);

  res.json(lead);
});

// GET ALL LEADS
app.get("/leads", auth, async (req, res) => {
  const leads = await Lead.find({
    assignedTo: req.userId,
  });

  res.json(leads);
});

// UPDATE LEAD STATUS
app.put("/leads/:id", auth,async (req, res) => {
  const updated = await Lead.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updated);
});

// ADD NOTE TO LEAD
app.post("/leads/:id/notes",auth, async (req, res) => {
  const lead = await Lead.findById(req.params.id);

  lead.notes.push({
    text: req.body.text,
  });

  await lead.save();

  res.json(lead);
});

// WEBHOOK (simulate Facebook lead)
app.post("/webhook/facebook", async (req, res) => {
  const data = req.body;

  const lead = await Lead.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    source: "facebook",
    assignedTo: "Sales A",
  });

  io.emit("newLead", lead );  // , "from",lead.source

  res.json({ success: true, lead });
});



server.listen(5000, () => console.log("Server started on 5000"));