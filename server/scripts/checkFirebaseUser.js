import 'dotenv/config';
import admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('Missing Firebase Admin env vars. Need FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey,
  }),
});

const input = String(process.argv[2] || '').trim();
if (!input) {
  console.error('Usage: node scripts/checkFirebaseUser.js <email-or-uid>');
  process.exit(1);
}

let userRecord;
try {
  userRecord = input.includes('@')
    ? await admin.auth().getUserByEmail(input)
    : await admin.auth().getUser(input);
} catch (error) {
  console.error(JSON.stringify({
    projectId,
    input,
    error: String(error?.code || error?.message || error),
  }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  projectId,
  uid: userRecord.uid,
  email: userRecord.email,
  emailVerified: userRecord.emailVerified,
  providers: (userRecord.providerData || []).map((p) => p.providerId),
  createdAt: userRecord.metadata?.creationTime || null,
  lastSignInAt: userRecord.metadata?.lastSignInTime || null,
}, null, 2));
