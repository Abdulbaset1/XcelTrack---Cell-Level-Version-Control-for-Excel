-- Script to manually set a user as admin
-- Replace 'your-firebase-uid-here' with the actual Firebase UID of the user you want to make admin

-- Option 1: Update by email
UPDATE users 
SET role = 'admin' 
WHERE email = 'abdulbaset1878@gmail.com';

-- Option 2: Update by Firebase UID (if you know it)
-- UPDATE users 
-- SET role = 'admin' 
-- WHERE firebase_uid = 'your-firebase-uid-here';

-- Verify the update
SELECT firebase_uid, email, name, role, created_at 
FROM users 
WHERE email = 'abdulbaset1878@gmail.com';
