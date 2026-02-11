# football-ranking-system-backend

# Buat struktur backend
mkdir backend
cd backend
mkdir src
cd src
mkdir controllers models routes services middlewares utils
cd ..
mkdir config

# Di folder backend, jalankan:
npm init -y

# Install semua dependencies:
npm install express mysql2 dotenv cors body-parser helmet express-validator
npm install nodemon --save-dev

# Buat Database di MySQL
CREATE DATABASE football_ranking_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE football_ranking_db;
