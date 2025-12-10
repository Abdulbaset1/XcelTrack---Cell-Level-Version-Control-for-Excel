const admin = require('./firebaseAdmin');
console.log("Admin apps structure:", admin.apps);
if (admin.apps.length > 0) {
    console.log("Admin IS initialized.");
} else {
    console.error("Admin is NOT initialized.");
}
