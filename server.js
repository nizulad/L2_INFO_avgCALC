const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
// Increased limit slightly just in case your grades object grows
app.use(express.json({ limit: '1mb' })); 
app.use(express.static(path.join(__dirname, 'public')));

// Database Configuration
const DB_NAME     = 'L2info_calc';
const COLLECTION  = 'L2info_calc';
const COUNTER_COL = 'counters';

// Use MONGODB_URI (uppercase) - Ensure this is set in Render Environment Variables
const MONGO_URI = process.env.MONGODB_URI;

let db;

/**
 * Initializes connection to MongoDB Atlas
 */
async function connectDB() {
    if (!MONGO_URI) {
        console.error("FATAL ERROR: MONGODB_URI is not defined in environment variables.");
        process.exit(1); 
    }
    try {
        const client = await MongoClient.connect(MONGO_URI);
        db = client.db(DB_NAME);
        console.log('Successfully connected to MongoDB');
    } catch (err) {
        console.error("Failed to connect to MongoDB:", err);
        process.exit(1);
    }
}

/**
 * Atomically increment and return the next submission ID
 */
async function getNextId() {
    const result = await db.collection(COUNTER_COL).findOneAndUpdate(
        { _id: 'submissions' },
        { $inc: { value: 1 } },
        { upsert: true, returnDocument: 'after' }
    );
    // In newer MongoDB drivers, the value is in result.value; 
    // if using the very latest, it might be in result directly.
    return result.value || result.value === 0 ? result.value : result.value;
}

/**
 * Endpoint to save grades
 * Triggered by frontend 'visibilitychange' or 'beforeunload'
 */
app.post('/save', async (req, res) => {
    try {
        const payload = req.body;

        // Validation: Don't save if the payload is empty
        if (!payload || Object.keys(payload).length === 0) {
            return res.status(400).json({ ok: false, message: "Empty payload" });
        }

        const id = await getNextId();
        
        // Add server-side timestamp to ensure data integrity
        const documentToSave = {
            submission_id: id,
            received_at: new Date(),
            ...payload
        };

        await db.collection(COLLECTION).insertOne(documentToSave);
        
        console.log(`Saved submission #${id} for stream: ${payload.stream || 'unknown'}`);
        res.json({ ok: true, id });
    } catch (err) {
        console.error("Error saving to database:", err);
        res.status(500).json({ ok: false });
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running and listening on port ${PORT}`);
    });
});

