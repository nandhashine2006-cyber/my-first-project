const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'grow-green' });
    console.log('[DB] Connected successfully.');

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`[DB] Found ${collections.length} collections.`);
    
    for (const c of collections) {
      const count = await mongoose.connection.db.collection(c.name).countDocuments();
      console.log(`[DB] Collection '${c.name}': ${count} records.`);
    }
  } catch (err) {
    console.error('[DB ERROR]', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkDatabase();
