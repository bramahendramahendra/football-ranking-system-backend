# Football Ranking System - Backend API

Backend API untuk sistem ranking sepak bola internasional dengan fitur lengkap manajemen kompetisi, perhitungan poin FIFA, dan tracking ranking.

## 🚀 Tech Stack

- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Database**: MySQL 8.0+
- **Validation**: Express Validator
- **Security**: Helmet, CORS

## 📋 Prerequisites

Pastikan sudah terinstall:
- Node.js v18 atau lebih baru
- MySQL v8.0 atau lebih baru
- npm atau yarn

## 🛠️ Installation

### 1. Clone & Install Dependencies

```bash
cd backend
npm install
```

#### Buat struktur backend

```bash
mkdir backend
cd backend
mkdir src
cd src
mkdir controllers models routes services middlewares utils
cd ..
mkdir config
```


#### Di folder backend, jalankan:

```bash
npm init -y
```

#### Install semua dependencies:

```bash
npm install express mysql2 dotenv cors body-parser helmet express-validator
npm install nodemon --save-dev
```

### 2. Database Setup

Buka MySQL dan jalankan:
```sql
CREATE DATABASE football_ranking_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE football_ranking_db;
```

Kemudian jalankan schema SQL:
```bash
mysql -u root -p football_ranking_db < config/schema.sql
```

### 3. Environment Configuration
Copy file `.env.example` ke `.env`:
```bash
cp .env.example .env
```

Edit `.env` dan sesuaikan dengan konfigurasi Anda:
```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=football_ranking_db
DB_PORT=3306

CORS_ORIGIN=http://localhost:3000
```

### 4. Run Server

Development mode (dengan auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server akan berjalan di `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Endpoints Overview

#### Countries
- `GET /countries` - Get all countries
- `GET /countries/:id` - Get country by ID
- `GET /countries/rankings/world` - Get world rankings
- `GET /countries/rankings/confederation/:confederation` - Get confederation rankings
- `GET /countries/compare/:id1/:id2` - Compare two countries
- `POST /countries` - Create new country
- `PUT /countries/:id` - Update country
- `DELETE /countries/:id` - Delete country

#### Competitions
- `GET /competitions` - Get all competitions
- `GET /competitions/:id` - Get competition details
- `GET /competitions/:id/standings` - Get standings
- `GET /competitions/:id/statistics` - Get statistics
- `POST /competitions` - Create competition
- `POST /competitions/:id/participants` - Add participants
- `PUT /competitions/:id` - Update competition
- `DELETE /competitions/:id` - Delete competition

#### Matches
- `GET /matches` - Get all matches
- `GET /matches/:id` - Get match details
- `GET /matches/upcoming` - Get upcoming matches
- `GET /matches/recent` - Get recent matches
- `GET /matches/head-to-head/:id1/:id2` - Get H2H
- `POST /matches` - Create match
- `POST /matches/:id/simulate` - Simulate match
- `PUT /matches/:id/result` - Update result
- `DELETE /matches/:id` - Delete match

### Example Requests

#### Create Country
```bash
curl -X POST http://localhost:5000/api/countries \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Indonesia",
    "code": "IDN",
    "confederation": "AFC",
    "flag_url": "https://flagcdn.com/w320/id.png",
    "fifa_points": 1500
  }'
```

#### Create Competition
```bash
curl -X POST http://localhost:5000/api/competitions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "World Cup 2026",
    "year": 2026,
    "type": "world",
    "confederation": "FIFA",
    "format": "group_knockout",
    "match_importance_factor": 4.0
  }'
```

#### Simulate Match
```bash
curl -X POST http://localhost:5000/api/matches/1/simulate
```

## 🗂️ Project Structure
```
backend/
├── config/
│   ├── database.js          # Database configuration
│   └── schema.sql           # Database schema
├── src/
│   ├── controllers/         # Request handlers
│   │   ├── countryController.js
│   │   ├── competitionController.js
│   │   └── matchController.js
│   ├── models/              # Database models
│   │   ├── Country.js
│   │   ├── Competition.js
│   │   ├── Match.js
│   │   ├── RecentForm.js
│   │   └── RankingHistory.js
│   ├── services/            # Business logic
│   │   ├── countryService.js
│   │   ├── competitionService.js
│   │   └── matchService.js
│   ├── routes/              # API routes
│   │   ├── countryRoutes.js
│   │   ├── competitionRoutes.js
│   │   ├── matchRoutes.js
│   │   └── index.js
│   ├── middlewares/         # Middlewares
│   │   ├── errorHandler.js
│   │   ├── validateRequest.js
│   │   └── notFound.js
│   └── utils/               # Utilities
│       ├── fifaCalculator.js
│       ├── responseHandler.js
│       └── validators.js
├── .env                     # Environment variables
├── .env.example             # Environment template
├── server.js                # Entry point
├── package.json
└── README.md
```

## 🧮 FIFA Points Calculation

Sistem menggunakan rumus resmi FIFA:
```
Points = Result × Importance × Opponent × Confederation

Where:
- Result: Win=3, Draw=1, Loss=0
- Importance: Friendly=1.0, Qualification=2.5, Continental=3.0, World Cup=4.0
- Opponent: (200 - ranking_diff) / 100 (min 0.5, max 2.0)
- Confederation: Same=1.0, Different=1.05
```

## 🎯 Features

### ✅ Implemented
- ✅ Full CRUD operations for Countries, Competitions, Matches
- ✅ FIFA points calculation system
- ✅ Auto-update rankings (world & confederation)
- ✅ Recent form tracking (10 matches)
- ✅ Match simulation with probability
- ✅ Head-to-head statistics
- ✅ Competition standings & statistics
- ✅ Ranking history tracking
- ✅ Input validation
- ✅ Error handling
- ✅ API documentation

### 🚧 Future Enhancements
- Authentication & Authorization
- Real-time updates (WebSocket)
- Advanced statistics & analytics
- Export data (PDF, Excel)
- Caching layer (Redis)
- Rate limiting
- API versioning

## 🧪 Testing

Test API dengan curl atau Postman:
```bash
# Health check
curl http://localhost:5000/api/health

# Get all countries
curl http://localhost:5000/api/countries

# Get world rankings
curl http://localhost:5000/api/countries/rankings/world

# Get competitions
curl http://localhost:5000/api/competitions
```

## 🐛 Troubleshooting

### Database Connection Error
- Pastikan MySQL service running
- Cek credentials di `.env`
- Cek port MySQL (default: 3306)

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID  /F

# Linux/Mac
lsof -i :5000
kill -9 
```

### Module Not Found
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📝 License

MIT License

## 👥 Contributors

- Backend Developer: [Your Name]

## 📞 Support

Untuk bantuan, silakan buka issue di repository atau hubungi tim development.
```

### 3.2 Buat File `backend/.gitignore`
```
# Dependencies
node_modules/
package-lock.json
yarn.lock

# Environment variables
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Testing
coverage/
.nyc_output/

# Production
dist/
build/

# Temporary files
tmp/
temp/
*.tmp