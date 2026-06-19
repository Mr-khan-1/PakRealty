import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function fixIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    const db = mongoose.connection.db;
    const collection = db.collection('properties');

    // List current indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} unique=${!!idx.unique} sparse=${!!idx.sparse}`);
    });

    // Drop the problematic sourceUrl unique index
    const sourceUrlIndex = indexes.find(idx => idx.key?.sourceUrl && idx.unique);
    if (sourceUrlIndex) {
      console.log(`\nDropping problematic index: ${sourceUrlIndex.name}`);
      await collection.dropIndex(sourceUrlIndex.name);
      console.log('Dropped successfully!');
    } else {
      console.log('\nNo problematic sourceUrl unique index found.');
    }

    // Also clean up any properties with sourceUrl = null or empty string
    const result = await collection.updateMany(
      { $or: [{ sourceUrl: null }, { sourceUrl: '' }] },
      { $unset: { sourceUrl: '' } }
    );
    console.log(`Cleaned ${result.modifiedCount} documents with null/empty sourceUrl.`);

    // Re-create the index as sparse (non-unique) so it doesn't block nulls
    await collection.createIndex({ sourceUrl: 1 }, { sparse: true });
    console.log('Re-created sourceUrl index as sparse (non-unique).');

    // Verify
    const newIndexes = await collection.indexes();
    console.log('\nFinal indexes:');
    newIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} unique=${!!idx.unique} sparse=${!!idx.sparse}`);
    });

    console.log('\n✅ All done! No more duplicate key errors.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

fixIndexes();
