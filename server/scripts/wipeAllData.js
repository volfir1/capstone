/**
 * Drop the entire MongoDB database.
 *
 * Usage:
 *   cd server
 *   node scripts/wipeAllData.js
 *
 * Add --yes to skip the confirmation prompt:
 *   node scripts/wipeAllData.js --yes
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import readline from 'readline';

async function wipeAllData() {
  const skipPrompt = process.argv.includes('--yes');

  console.log('\n========================================');
  console.log('  DATABASE FULL WIPE SCRIPT');
  console.log('========================================\n');

  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) {
    console.error('ERROR: MONGO_URL not set in .env');
    process.exit(1);
  }

  await mongoose.connect(mongoUrl);
  const db = mongoose.connection.db;
  const dbName = db.databaseName;

  console.log(`Connected to MongoDB database: ${dbName}\n`);

  const collections = await db.listCollections().toArray();
  if (collections.length > 0) {
    console.log('Collections that will be removed:');
    collections.forEach(({ name }) => console.log(`  - ${name}`));
  } else {
    console.log('No collections found in the database.');
  }

  if (!skipPrompt) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise(resolve => {
      rl.question(
        'Type DELETE ALL to permanently drop this database and erase every collection: ',
        resolve
      );
    });
    rl.close();

    if (answer.trim() !== 'DELETE ALL') {
      console.log('\nAborted. No data was deleted.');
      await mongoose.disconnect();
      process.exit(0);
    }
  }

  console.log('\nDropping database...\n');
  await db.dropDatabase();

  console.log(`Database "${dbName}" dropped successfully.`);
  await mongoose.disconnect();
  process.exit(0);
}

wipeAllData().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});