# GROW GREEN, LIVE LONG

**AI-Powered Smart Agriculture Platform for Farmers in Tamil Nadu**

Welcome to **Grow Green, Live Long** – a complete, full-stack MERN platform empowering agricultural productivity, sustainability, and market reach in Tamil Nadu through artificial intelligence and localized insights.

---

## 🌟 Key Features

1. **Multilingual Interface (10 Languages)**: Complete localization spanning Tamil, English, Hindi, Telugu, Malayalam, Kannada, Punjabi, Bengali, Marathi, and Gujarati with zero hardcoding and persistent storage.
2. **AI Plant Doctor**: Powered by Google Gemini API on the Node.js backend. Farmers can upload plant photos to receive real-time diagnosis, disease symptoms, severity assessments, organic treatments, and expert alerts without exposing API credentials.
3. **Tamil Nadu District Weather**: Integrated with OpenWeather API via custom secure backend routes to forecast rain, wind, humidity, and temperatures across cities, towns, and villages in Tamil Nadu.
4. **Market Prices Dashboard**: Real-time commodity tracking covering fruits, vegetables, flowers, seeds, and tools across Tamil Nadu markets, complete with filtering, sorting, and explicit demo/live data labeling.
5. **Farmer Marketplace & Direct Sales**: Complete CRUD functionality allowing farmers to list harvest items with village/district locators, organic badges, and direct buyer communication.
6. **Live Agriculture News**: Curated news feeds covering Tamil Nadu crop updates, government subsidies, irrigation innovations, and weather alerts.
7. **Admin Dashboard & Protected Core**: Role-shielded control center to review AI diagnoses, manage market pricing, verify farmer product submissions, and audit cached feeds.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React.js with Vite
- **Routing & State**: React Router DOM, React Context API (`LanguageContext`)
- **API & Networking**: Axios
- **Styling**: Modern, responsive vanilla CSS (Green & White agriculture aesthetic, glassmorphism, soft shadows)

### Backend
- **Runtime**: Node.js & Express.js
- **Database**: MongoDB Atlas with Mongoose (with comprehensive schema validation, string trimming, and indexing)
- **Security & Middlewares**: Helmet, CORS, Express Rate Limit, Centralized Error/404 handling
- **Storage & Envs**: Multer for image file uploads, Dotenv for secure environment isolation

---

## 📂 Project Directory Structure

```
grow-green-live-long/
├── client/                     # Vite React Frontend
│   ├── src/
│   │   ├── assets/             # Logo, iconography, and visual illustrations
│   │   ├── components/         # Reusable structural components (Navbar, Footer)
│   │   ├── context/            # Multi-language Context API & LocalStorage binding
│   │   ├── pages/              # Welcome, HomeDashboard, PlantDoctor, Weather, etc.
│   │   ├── services/           # Axios REST API helper methods
│   │   ├── translations/       # 10-language localized dictionaries
│   │   ├── App.jsx             # Root router configuration
│   │   ├── index.css           # Global custom design design architecture
│   │   └── main.jsx            # DOM integration entry point
│   ├── package.json
│   └── vite.config.js
├── server/                     # Node.js + Express Backend Services
│   ├── config/                 # MongoDB database connector
│   ├── controllers/            # Route business logic handlers
│   ├── middlewares/            # Error handlers & upload validators
│   ├── models/                 # Mongoose database schemas & search indexes
│   ├── routes/                 # Express API endpoints
│   ├── services/               # Gemini & Weather service wrappers
│   ├── uploads/                # Local Multer storage directory
│   ├── utils/                  # Shared helper utilities
│   ├── server.js               # Application bootstrap & port mapping
│   └── package.json
├── .env.example                # Secret template (zero live credentials)
├── .gitignore                  # Git repository exclusion list
├── package.json                # Concurrently powered root coordination script
└── README.md                   # Project architecture and developer guide
```

---

## 🚀 Installation & Setup Guide

### 1. Environment Configurations
Copy `.env.example` inside `server/` (or root) to `.env` and fill out the connection variables:
```bash
cp .env.example server/.env
```
Ensure you provide your valid MongoDB connection string (`MONGODB_URI`), Google Gemini Key (`GEMINI_API_KEY`), and OpenWeather Key (`OPENWEATHER_API_KEY`). Notice that **no API keys are ever placed in the React client code**.

### 2. Quick One-Line Install
From the root folder `grow-green-live-long/`, run the unified install script to download dependencies for root, server, and client simultaneously:
```bash
npm run install:all
```
*(Alternatively, you can manually run `npm install` inside the root, `./server`, and `./client` directories.)*

### 3. Launch Application Locally
Run both the Express API and the Vite Development server concurrently with a single command from root:
```bash
npm run dev
```

- Frontend Dev Server: [http://localhost:5173](http://localhost:5173)
- Backend API Endpoint: [http://localhost:5000/api](http://localhost:5000/api)

---

## 🔒 Security Best Practices Implemented
- **Helmet**: Shields Express HTTP headers against web exploitation.
- **CORS Mitigation**: Restricted domain communication aligned with client requirements.
- **Payload & Rate Protection**: Express Rate Limit prevents brute force or excessive API quota billing.
- **Clean Backend Proxy**: Direct client interactions with Gemini AI and OpenWeather are entirely decoupled, keeping cloud tokens safe.

---

*Grow Green, Live Long — Dedicated to farming resilience and innovation across Tamil Nadu.*
