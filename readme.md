# Asset Management System
> **A full-stack web application for managing and tracking IT assets within an organization. The system provides role-based access, allowing administrators to manage assets while general users can search, view, and export asset information.**

> [!IMPORTANT]
> **When logging in for the first time, use the administrator credentials **Username:** `admin` and **Password:** `Admin@123`. For all other user accounts, the default password is their **Employee Code**. Users will be prompted to change their password after their first login and can update it again later from within the application.**

### Features

- Secure authentication with role-based access for Administrator and General User accounts
- Password management with first-time password change prompt and password update functionality
- Dashboard providing quick access to asset categories, status filters, asset counts, and management tools
- Support for managing Desktop, Laptop, Printer, Scanner, Router, Switch, Firewall, and IoT Devices
- Department-wise organization for Desktop, Laptop, Printer, and Scanner assets
- Global search across assets using Asset Code, Serial Number, Employee Code, Username, Hostname, and Location
- Asset management functions including Add, Update, Remove, Submit, and Reissue
- Status tracking with Functional, Not Functional, and Need Replacement categories
- Asset count for departments and device categories
- Export asset records by department, device category, or as a complete inventory
- Light and Dark theme support
- Contact information section

### Asset Information

The system stores different information depending on the asset type.

| Asset Type | Stored Information |
|------------|--------------------|
| Desktop / Laptop | Username, Employee Code, Asset Code, Hostname, Storage, RAM, Processor, Serial Number, Location, Status |
| Printer | Asset Code, Serial Number, IP Address, Location, Status |
| Scanner | Asset Code, Serial Number, Model, Location, Status |
| Router / Switch / Firewall / IoT Devices | Asset Code, Serial Number, Location, Status |

### User Roles

| Administrator | General User |
|--------------|--------------|
| Add assets | View assets |
| Update assets | Search assets |
| Remove assets | Export assets |
| Submit assets | Download complete inventory |
| Reissue assets | - |
| Search assets | - |
| Export assets | - |

### Technologies Used

1️⃣ Frontend: HTML, CSS, JavaScript (ES6), Vite<br>
2️⃣ Backend: Node.js, Express.js<br>
3️⃣ Database: MongoDB, Mongoose

### Installation

1️⃣ Clone the repository:

```bash
git clone https://github.com/yurehito/asset-management-system.git
cd asset-management-system
```

2️⃣ Install backend dependencies:

```bash
cd backend
npm install
```

3️⃣ Install frontend dependencies:

```bash
cd ../frontend
npm install
```

4️⃣ Environment Variables:

Create a `.env` file inside the `backend` directory.

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/asset_management?retryWrites=true&w=majority&appName=Cluster0
NODE_ENV=development
PORT=5000
```

5️⃣ Seed Demo Data:

```bash
cd backend
npm run seed
```

### Run the Application

From the project root directory, run:

```bash
npm install
npm run dev
```

### Customization

1️⃣ Backend:

- `backend/utils/data/` – Demo asset data
- `backend/utils/seed.js` – Administrator account & database seeding
- `backend/models/Asset.js` – Asset schema
- `backend/services/assetService.js` – Asset logic and services

2️⃣ Frontend:

- `frontend/assets/` – Logo and images
- `frontend/index.html` – Favicon, logo, application title, and other frontend elements<br>

### Screenshots
