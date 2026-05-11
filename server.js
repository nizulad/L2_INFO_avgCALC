const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI   = process.env.MONGO_URI;       // set in Render environment variables
const DB_NAME     = 'L2info_calc';
const COLLECTION  = 'L2info_calc';
const COUNTER_COL = 'counters';

let db;

async function connectDB() {
    const client = await MongoClient.connect(MONGO_URI);
    db = client.db(DB_NAME);
    console.log('Connected to MongoDB');
}

// Atomically increment and return the next id
async function getNextId() {
    const result = await db.collection(COUNTER_COL).findOneAndUpdate(
        { _id: 'submissions' },
        { $inc: { value: 1 } },
        { upsert: true, returnDocument: 'after' }
    );
    return result.value;
}

app.post('/save', async (req, res) => {
    try {
        const grades = req.body; // { ModuleName: avg, ... }
        const id     = await getNextId();
        await db.collection(COLLECTION).insertOne({ id, ...grades });
        res.json({ ok: true, id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false });
    }
});

const PORT = process.env.PORT || 3000;
connectDB().then(() => app.listen(PORT, () => console.log(`Listening on ${PORT}`)));
