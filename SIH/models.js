const mongoose = require('mongoose');

// User Schema (Patients and Caregivers)
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['patient', 'caregiver'], default: 'patient' },
    watchDeviceId: { type: String, default: null } // Smartwatch Hardware ID
});

// Smartwatch Health Vitals Schema
const healthMetricsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    heartRate: { type: Number, required: true },
    bloodPressure: { type: String, required: true }, // e.g. "120/80"
    steps: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now }
});

// Activity Timers & Reminders Schema
const reminderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['food', 'walk', 'sleep', 'medication'], required: true },
    time: { type: String, required: true }, // HH:MM format
    label: { type: String, required: true },
    isCompleted: { type: Boolean, default: false }
});

// Brain Games Performance Schema
const gameScoreSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    gameType: { type: String, enum: ['color_memory', 'pattern_rec'], required: true },
    score: { type: Number, required: true },
    datePlayed: { type: Date, default: Date.now }
});

module.exports = {
    User: mongoose.model('User', userSchema),
    HealthMetrics: mongoose.model('HealthMetrics', healthMetricsSchema),
    Reminder: mongoose.model('Reminder', reminderSchema),
    GameScore: mongoose.model('GameScore', gameScoreSchema)
};