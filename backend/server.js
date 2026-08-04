require('dotenv').config();
const express = require('express');
const connectDB = require('./config/database');
const assetRoutes = require('./routes/assetRoutes');
const cors = require('./middleware/cors');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    message: 'Asset Management System API',
    version: '1.0.0',
    endpoints: {
      login: 'POST /api/auth/login',
      me: 'GET /api/auth/me',
      changePassword: 'POST /api/auth/change-password',
      assets: '/api/assets',
      createAsset: 'POST /api/assets',
      search: '/api/assets/search?q=',
      byType: '/api/assets/type/:assetType',
      byDepartment: '/api/assets/department/:department',
      byCode: '/api/assets/code/:assetCode',
      download: '/api/assets/download/csv',
      submit: 'POST /api/submits',
      reissue: 'POST /api/submits/reissue'
    }
  });
});

app.use('/api', assetRoutes);
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });
