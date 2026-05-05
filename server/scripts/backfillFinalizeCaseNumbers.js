import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';

import Finalize from '../models/finalize.js';
import { allocateFinalizeCaseNumber } from '../utils/finalizeCaseNumber.js';

async function backfillFinalizeCaseNumbers() {
  const mongoUrl = process.env.MONGO_URL;

  if (!mongoUrl) {
    throw new Error('MONGO_URL is not set in the server .env file');
  }

  await mongoose.connect(mongoUrl);
  console.log('Connected to MongoDB');

  const query = {
    $or: [
      { caseNumber: { $exists: false } },
      { caseNumber: null },
      { caseNumber: '' },
    ],
  };

  const cursor = Finalize.find(query)
    .sort({ createdAt: 1, _id: 1 })
    .cursor();

  let processed = 0;
  let updated = 0;
  let skipped = 0;

  for await (const finalize of cursor) {
    processed += 1;

    if (finalize.caseNumber) {
      skipped += 1;
      continue;
    }

    const allocation = await allocateFinalizeCaseNumber(finalize);
    finalize.caseNumber = allocation.caseNumber;
    await finalize.save();

    updated += 1;
    console.log(`Assigned ${allocation.caseNumber} to finalize ${finalize._id}`);
  }

  console.log(JSON.stringify({ processed, updated, skipped }, null, 2));

  await mongoose.disconnect();
}

backfillFinalizeCaseNumbers().catch(async (error) => {
  console.error('Backfill finalize case numbers failed:', error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});