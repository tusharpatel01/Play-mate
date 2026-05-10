/**
 * Seed script — run with:  node src/utils/seed.js
 * Drops existing data and inserts demo users, matches, chats.
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Match = require("../models/Match");
const { Chat, Message } = require("../models/index");

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error("MONGO_URI missing in .env"); process.exit(1); }

// ─── Sample data ──────────────────────────────────────────
const USERS = [
  { name: "Arjun Kapoor",   email: "arjun@demo.com",   password: "demo1234", role: "organizer", skillLevel: "advanced",      preferredSports: ["cricket", "football"], bio: "Cricket enthusiast | Delhi | 8 years experience",       age: 26, gender: "male"   },
  { name: "Priya Mehta",    email: "priya@demo.com",   password: "demo1234", role: "player",    skillLevel: "intermediate",  preferredSports: ["cricket", "badminton"],bio: "All-rounder | Loves weekend matches",                   age: 24, gender: "female" },
  { name: "Rahul Sharma",   email: "rahul@demo.com",   password: "demo1234", role: "player",    skillLevel: "beginner",      preferredSports: ["cricket"],             bio: "New to cricket | Learning fast",                       age: 22, gender: "male"   },
  { name: "Sneha Patel",    email: "sneha@demo.com",   password: "demo1234", role: "player",    skillLevel: "intermediate",  preferredSports: ["badminton", "volleyball"], bio: "Badminton state finalist",                          age: 27, gender: "female" },
  { name: "Dev Singh",      email: "dev@demo.com",     password: "demo1234", role: "organizer", skillLevel: "advanced",      preferredSports: ["football", "cricket"], bio: "Football coach | Organises weekly 5-a-side",           age: 30, gender: "male"   },
  { name: "Admin User",     email: "admin@demo.com",   password: "admin1234",role: "admin",     skillLevel: "advanced",      preferredSports: ["cricket"],             bio: "PlayMate platform admin",                              age: 28, gender: "male"   },
];

const buildMatches = (organizers) => [
  {
    title: "Evening Cricket — Siri Fort Sports Complex",
    sport: "cricket",
    description: "Friendly T20 match. All skill levels welcome. Bring your own bat if possible.",
    location: { type: "Point", coordinates: [77.2167, 28.5494], address: "Siri Fort Sports Complex, Khel Gaon Marg", city: "New Delhi", groundName: "Siri Fort Ground A" },
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    startTime: "6:00 PM",
    duration: 120,
    totalSlots: 11,
    skillRequired: "any",
    entryFee: 0,
    isFree: true,
    visibility: "public",
    status: "open",
    organizer: organizers[0]._id,
    participants: [{ user: organizers[0]._id }],
  },
  {
    title: "Weekend T20 — Green Park",
    sport: "cricket",
    description: "Competitive T20. Looking for intermediate+ players. Fielding team ready.",
    location: { type: "Point", coordinates: [77.2090, 28.6354], address: "Green Park Sports Ground, Green Park Ext", city: "New Delhi", groundName: "Green Park Ground" },
    date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    startTime: "8:00 AM",
    duration: 180,
    totalSlots: 22,
    skillRequired: "intermediate",
    entryFee: 50,
    isFree: false,
    visibility: "public",
    status: "open",
    organizer: organizers[0]._id,
    participants: [{ user: organizers[0]._id }],
  },
  {
    title: "5-a-Side Football — Jawaharlal Nehru Stadium",
    sport: "football",
    description: "Quick 5-a-side on astroturf. Boots required. 1 hour match.",
    location: { type: "Point", coordinates: [77.2373, 28.5829], address: "Jawaharlal Nehru Stadium, Bhishm Pitamah Marg", city: "New Delhi", groundName: "JN Stadium Court 3" },
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    startTime: "5:00 PM",
    duration: 60,
    totalSlots: 10,
    skillRequired: "any",
    entryFee: 0,
    isFree: true,
    visibility: "public",
    status: "open",
    organizer: organizers[1]._id,
    participants: [{ user: organizers[1]._id }],
  },
  {
    title: "Morning Badminton Doubles",
    sport: "badminton",
    description: "Mixed doubles. 4 courts reserved at Talkatora. Shuttles provided.",
    location: { type: "Point", coordinates: [77.2065, 28.6263], address: "Talkatora Indoor Stadium, Ashoka Road", city: "New Delhi", groundName: "Talkatora Court 2" },
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    startTime: "7:00 AM",
    duration: 90,
    totalSlots: 8,
    skillRequired: "intermediate",
    entryFee: 30,
    isFree: false,
    visibility: "public",
    status: "open",
    organizer: organizers[1]._id,
    participants: [{ user: organizers[1]._id }],
  },
];

// ─── Seed function ────────────────────────────────────────
const seed = async () => {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB");

  // Clear
  await Promise.all([
    User.deleteMany({}),
    Match.deleteMany({}),
    Chat.deleteMany({}),
    Message.deleteMany({}),
  ]);
  console.log("🧹 Cleared existing data");

  // Create users (passwords auto-hashed by pre-save hook)
  const users = await User.create(
    USERS.map((u) => ({
      ...u,
      isEmailVerified: true,
      location: {
        type: "Point",
        coordinates: [77.2090 + (Math.random() - 0.5) * 0.1, 28.6139 + (Math.random() - 0.5) * 0.1],
        city: "New Delhi",
        address: "New Delhi, India",
      },
      matchesPlayed: Math.floor(Math.random() * 20),
      matchesOrganised: Math.floor(Math.random() * 5),
      averageRating: +(3.5 + Math.random() * 1.5).toFixed(1),
    }))
  );
  console.log(`👥 Created ${users.length} users`);

  const organizers = users.filter((u) => u.role === "organizer" || u.role === "admin");
  const nonAdmins = users.filter((u) => u.role !== "admin");

  // Create matches
  const matchData = buildMatches(organizers);
  const matches = await Match.create(matchData);
  console.log(`🏏 Created ${matches.length} matches`);

  // Create group chats for each match
  for (const match of matches) {
    const chat = await Chat.create({
      type: "group",
      name: match.title,
      participants: [match.organizer],
      match: match._id,
      admin: match.organizer,
    });
    match.groupChat = chat._id;
    await match.save();

    // Seed a welcome message
    await Message.create({
      chat: chat._id,
      sender: match.organizer,
      content: `Welcome to ${match.title}! 🎉 Can't wait to play.`,
      messageType: "system",
    });
  }
  console.log(`💬 Created group chats`);

  // Summary
  console.log("\n═══════════════════════════════════════");
  console.log("✅  SEED COMPLETE");
  console.log("═══════════════════════════════════════");
  console.log("Demo accounts (password: demo1234):");
  nonAdmins.forEach((u) => console.log(`  ${u.role.padEnd(10)} ${u.email}`));
  console.log("  admin      admin@demo.com  (password: admin1234)");
  console.log("═══════════════════════════════════════\n");

  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
