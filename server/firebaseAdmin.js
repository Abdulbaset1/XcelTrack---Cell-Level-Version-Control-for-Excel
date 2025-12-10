const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
// Ideally, we'd use a service account key file.
// Since the user has not provided one yet, we will set up the structure.
// IF they provided environment variables for it, we could use them.
// For now, we will attempt to use Application Default Credentials or just initialize with no args if running in a Google Cloud environment,
// but locally this usually fails without credentials. 
// We will placeholder this to fallback to formatted env vars if present.

/* 
  Expecting service account specific env vars or a path to json
  For this implementation, we will check if the user put the JSON path in an ENV var 
  OR if they just want standard init.
*/

try {
    // Check if SERVICE_ACCOUNT_KEY env var exists (contains the JSON string)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin initialized with SERVICE_ACCOUNT env var.");
    } else {
        // Fallback: try default or generic init (may fail locally without manual setup)
        admin.initializeApp();
        console.log("Firebase Admin initialized with default credentials.");
    }
} catch (error) {
    console.error("Firebase Admin initialization failed:", error);
}

module.exports = admin;
