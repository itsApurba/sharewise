// Loads the demo community into the database at MONGO_URI (or MONGODB_URI): `npm run seed`.
const mongoose = require("mongoose");
const { mongo } = require("../src/config/vars");
const { seed } = require("../src/seed");

async function main() {
  if (!mongo.uri) {
    console.error("Set MONGO_URI or MONGODB_URI (in backend/.env or the environment) to the database to seed.");
    process.exit(1);
  }
  await mongoose.connect(mongo.uri);
  try {
    const counts = await seed();
    console.log(`Seeded ${counts.users} users, ${counts.lessons} lessons, ${counts.follows} follows, ${counts.reviews} review cards and ${counts.reviewLogs} past reviews.`);
    console.log('Log in as maya@sharewise.dev (or omar, priya, sam, lena @sharewise.dev) with password "sharewise123".');
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error(`Seed failed: ${err.message}`);
  process.exit(1);
});
