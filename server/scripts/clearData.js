/**
 * Clear all collection data EXCEPT users and attorneys.
 *
 * Usage:
 *   cd server
 *   node scripts/clearData.js
 *
 * Add --yes to skip the confirmation prompt:
 *   node scripts/clearData.js --yes
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import readline from 'readline';

// Import all models so Mongoose registers their collections
import '../models/activityLog.js';
import '../models/case.js';
import '../models/caseAssignment.js';
import '../models/caserecord.js';
import '../models/chatbot.js';
import '../models/clientsinfo.js';
import '../models/counter.js';
import '../models/events.js';
import '../models/finalize.js';
import '../models/message.js';
import '../models/notification.js';
import '../models/review.js';

// Collections to KEEP (will NOT be cleared)
const KEEP_COLLECTIONS = ['users', 'attorneys'];

async function clearData() {
  const skipPrompt = process.argv.includes('--yes');

  console.log('\n========================================');
  console.log('  DATABASE DATA CLEAR SCRIPT');
  console.log('========================================\n');

  // Connect
  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) {
    console.error('ERROR: MONGO_URL not set in .env');
    process.exit(1);
  }

  await mongoose.connect(mongoUrl);
  console.log('Connected to MongoDB\n');

  // List registered models and what will be cleared
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);

  const toClear = collectionNames.filter(
    name => !KEEP_COLLECTIONS.includes(name)
  );
  const kept = collectionNames.filter(name =>
    KEEP_COLLECTIONS.includes(name)
  );

  console.log('Collections to CLEAR:');
  toClear.forEach(name => console.log(`  - ${name}`));
  console.log('\nCollections KEPT (not touched):');
  kept.forEach(name => console.log(`  - ${name}`));
  console.log('');

  // Confirmation
  if (!skipPrompt) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise(resolve => {
      rl.question(
        'Are you sure you want to delete ALL data from the above collections? (yes/no): ',
        resolve
      );
    });
    rl.close();

    if (answer.toLowerCase() !== 'yes') {
      console.log('\nAborted. No data was deleted.');
      await mongoose.disconnect();
      process.exit(0);
    }
  }

  // Delete
  console.log('\nClearing data...\n');
  for (const name of toClear) {
    try {
      const result = await db.collection(name).deleteMany({});
      console.log(`  ✓ ${name}: ${result.deletedCount} documents deleted`);
    } catch (err) {
      console.error(`  ✗ ${name}: ${err.message}`);
    }
  }

  console.log('\nDone! User and attorney data was preserved.');
  await mongoose.disconnect();
  process.exit(0);
}

clearData().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
