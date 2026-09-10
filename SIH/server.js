const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { User, HealthMetrics, Reminder, GameScore } = require('./models');

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

// Serve index.html directly on root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/main', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// MongoDB Connection string (Use environment variable or replace YOUR_USERNAME with your real MongoDB Atlas username)
const dbURI = process.env.MONGODB_URI || "mongodb+srv://jk0471080_db_user:bII4HArhwyPCd8yM@cluster0.fnklfis.mongodb.net/dementia_care_db?retryWrites=true&w=majority";

mongoose.connect(dbURI)
  .then(() => console.log('MongoDB Atlas Connected Successfully!'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// --- API ENDPOINTS ---

// 1. User Registration / Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({ name: 'John Doe', email, password, watchDeviceId: 'WATCH-9982' });
        }
        res.json({ success: true, user });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Smartwatch Data Ingestion
app.post('/api/watch/sync', async (req, res) => {
    const { userId, heartRate, bloodPressure, steps } = req.body;
    try {
        const metrics = await HealthMetrics.create({ userId, heartRate, bloodPressure, steps });
        res.status(201).json({ success: true, message: 'Smartwatch data synced', metrics });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. Get Latest Health Metrics
app.get('/api/health/:userId', async (req, res) => {
    try {
        const latestMetrics = await HealthMetrics.findOne({ userId: req.params.userId }).sort({ timestamp: -1 });
        res.json(latestMetrics || { heartRate: 72, bloodPressure: "120/80", steps: 1420 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Activity Timers / Reminders
app.get('/api/reminders/:userId', async (req, res) => {
    try {
        const reminders = await Reminder.find({ userId: req.params.userId });
        res.json(reminders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/reminders', async (req, res) => {
    try {
        const newReminder = await Reminder.create(req.body);
        res.status(201).json(newReminder);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Save Brain Game Score
app.post('/api/game/score', async (req, res) => {
    try {
        const { userId, gameType, score } = req.body;
        const log = await GameScore.create({ userId, gameType, score });
        res.json({ success: true, log });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Dementia Care Server running on port ${PORT}`);
});
