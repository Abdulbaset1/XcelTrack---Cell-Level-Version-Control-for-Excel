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
    // 1. Check if SERVICE_ACCOUNT_KEY env var exists (JSON string)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin initialized with SERVICE_ACCOUNT env var.");
    }
    // 2. Check for serviceAccountKey.json file in the same directory
    else {
        const path = require('path');
        const fs = require('fs');
        const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
        console.log("Checking for Service Account at:", serviceAccountPath);

        if (fs.existsSync(serviceAccountPath)) {
            console.log("Found serviceAccountKey.json");
            try {
                const serviceAccount = require(serviceAccountPath);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
                console.log("Firebase Admin initialized with serviceAccountKey.json file.");
            } catch (err) {
                console.error("Error loading serviceAccountKey.json:", err);
                // Fallback catch to not crash entirely, but init will fail
                throw err;
            }
        } else {
            // 3. Last resort: Default credentials (fails locally usually)
            console.warn("WARNING: No 'serviceAccountKey.json' found in server/ directory and no FIREBASE_SERVICE_ACCOUNT env var set.");
            console.warn("Admin SDK functionality (create/update user) will likely FAIL.");
            admin.initializeApp();
            console.log("Firebase Admin initialized with default credentials (ADC).");
        }
    }
} catch (error) {
    console.error("Firebase Admin initialization failed:", error);
}

module.exports = admin;
