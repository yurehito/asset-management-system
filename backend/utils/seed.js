require('dotenv').config({ path: __dirname + '/../.env' });

const mongoose = require('mongoose');

const Asset = require('../models/Asset');
const User = require('../models/User');

const productionAssets = require('./data/production');
const maintenanceAssets = require('./data/maintenance');
const commercialAssets = require('./data/commercial');
const adminAssets = require('./data/admin');
const itAssets = require('./data/it');
const routerAssets = require('./data/router');
const switchAssets = require('./data/switch');
const firewallAssets = require('./data/firewall');
const iotAssets = require('./data/iot');

const assets = [
  ...productionAssets,
  ...maintenanceAssets,
  ...commercialAssets,
  ...adminAssets,
  ...itAssets,
  ...routerAssets,
  ...switchAssets,
  ...firewallAssets,
  ...iotAssets
];

const cleanedAssets = assets.map(asset => {
  const cleaned = { ...asset };

  if (!cleaned.assetCode || cleaned.assetCode.trim() === '') {
    delete cleaned.assetCode;
  }

  if (!cleaned.serialNumber || cleaned.serialNumber.trim() === '') {
    delete cleaned.serialNumber;
  }

  return cleaned;
});

const adminUser = {
  username: 'admin',
  role: 'admin',
  employeeCode: 'ADMIN001',
  password: 'Admin@123',
  displayName: 'System Administrator',
  forcePasswordChange: false
};

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('Clearing existing assets...');
    await Asset.deleteMany({});

    console.log(`Inserting ${cleanedAssets.length} assets...`);

    for (let i = 0; i < cleanedAssets.length; i++) {
      try {
        await Asset.create(cleanedAssets[i]);
      } catch (err) {
        console.error(`\n❌ Failed on asset #${i + 1}`);
        console.error(cleanedAssets[i]);
        console.error(err);
        process.exit(1);
      }
    }

    console.log(`Successfully seeded ${cleanedAssets.length} assets.`);

    console.log('Keeping existing users...');

    let createdEmployees = 0;
    let skippedEmployees = 0;

let admin = await User.findOne({ role: 'admin' });

if (!admin) {
  admin = new User();
  admin.password = adminUser.password;
}

admin.username = adminUser.username.toLowerCase().trim();
admin.role = adminUser.role;
admin.employeeCode = adminUser.employeeCode;
admin.displayName = adminUser.displayName;
admin.forcePasswordChange = adminUser.forcePasswordChange;

await admin.save();

console.log(`Admin ready: ${admin.username}`);

    for (const asset of cleanedAssets) {
      const username = (asset.username || '').trim();
      const employeeCode = (asset.employeeCode || '').trim();

      if (!username || !employeeCode) {
        continue;
      }

      const normalizedUsername = username.toLowerCase();

      const existingUser = await User.findOne({
        $or: [
          { username: normalizedUsername },
          { employeeCode: employeeCode }
        ]
      });

      if (existingUser) {
        console.log(`Skipped existing user: ${existingUser.username}`);
        skippedEmployees++;
        continue;
      }

      const user = new User({
        username: normalizedUsername,
        employeeCode: employeeCode,
        displayName: username,
        role: 'user',
        forcePasswordChange: true
      });
      user.password = employeeCode;
      await user.save();

      console.log(`Created employee user: ${user.username}`);
      createdEmployees++;
    }

    console.log(`Created ${createdEmployees} employee user(s).`);
    console.log(`Skipped ${skippedEmployees} existing user(s).`);

    await mongoose.connection.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
