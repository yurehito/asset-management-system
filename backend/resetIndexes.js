require('dotenv').config();

const mongoose = require('mongoose');
const Asset = require('./models/Asset');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Current indexes:');
    console.log(await Asset.collection.indexes());

    try {
      await Asset.collection.dropIndex('assetCode_1');
      console.log('Dropped assetCode_1');
    } catch (e) {
      console.log('assetCode_1 not found');
    }

    try {
      await Asset.collection.dropIndex('serialNumber_1');
      console.log('Dropped serialNumber_1');
    } catch (e) {
      console.log('serialNumber_1 not found');
    }

    await Asset.syncIndexes();

    console.log('\nIndexes after sync:');
    console.log(await Asset.collection.indexes());

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
})();