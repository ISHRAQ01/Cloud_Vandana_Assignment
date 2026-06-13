# Salesforce Switch - Enterprise Validation Rule Manager

![Salesforce Switch Banner](https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=1974&auto=format)

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-000?style=for-the-badge&logo=vercel)](https://vandana-assignment.vercel.app)
[![Backend API](https://img.shields.io/badge/Backend_API-Render-46E3B7?style=for-the-badge&logo=render)](https://cloud-vandana-assignment.onrender.com/api/health)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

## 📋 Overview

Salesforce Switch is an enterprise-grade web application that allows Salesforce administrators to manage validation rules on the Account object in real-time. Built with React and Node.js, it leverages Salesforce OAuth 2.0, Tooling API, and Metadata API for seamless integration.

### 🎯 Key Features

- ✅ **Secure OAuth 2.0 Authentication** - Login with any Salesforce Developer Org
- ✅ **Fetch Validation Rules** - Retrieve all validation rules from Account object
- ✅ **Real-time Status Display** - View Active/Inactive status with visual indicators
- ✅ **Toggle Individual Rules** - Enable/Disable single validation rules
- ✅ **Bulk Operations** - Enable All / Disable All with one click
- ✅ **Live Sync** - Changes reflect instantly in Salesforce
- ✅ **Premium UI** - Glass morphism design with smooth animations
- ✅ **Responsive** - Works on desktop, tablet, and mobile

## 🚀 Live Demo

| Environment | URL |
|-------------|-----|
| **Frontend (Vercel)** | [https://vandana-assignment.vercel.app](https://vandana-assignment.vercel.app) |
| **Backend API (Render)** | [https://cloud-vandana-assignment.onrender.com](https://cloud-vandana-assignment.onrender.com) |
| **Health Check** | [https://cloud-vandana-assignment.onrender.com/api/health](https://cloud-vandana-assignment.onrender.com/api/health) |

## 📸 Screenshots

### Login Page
![Login Page](https://via.placeholder.com/800x500?text=Premium+Login+Page)

### Dashboard
![Dashboard](https://via.placeholder.com/800x500?text=Validation+Rules+Dashboard)

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI Framework |
| **Tailwind CSS** | Styling |
| **Framer Motion** | Animations |
| **Lucide React** | Icons |
| **Axios** | API Calls |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime |
| **Express** | Web Framework |
| **Salesforce APIs** | Tooling & Metadata API |
| **Express Session** | Session Management |
| **CORS** | Cross-origin requests |

### Deployment
| Platform | Purpose |
|----------|---------|
| **Render** | Backend Hosting |
| **Vercel** | Frontend Hosting |
| **GitHub** | Version Control |

## 🔧 Installation & Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Salesforce Developer Account
### 📌 How to Test:
- Click "Login with OAuth"
- Login with ANY Salesforce Developer Org
- Click "Allow" to authorize
- Create validation rules on Account object if none exist
- Click "Get Me Metadata" to fetch rules
- Toggle rules on/off - changes save to your org
### Step 1: Clone the Repository

```bash
git clone https://github.com/ISHRAQ01/Cloud_Vandana_Assignment.git
cd Cloud_Vandana_Assignment
```
### Step 2: backend setup
update .env
CLIENT_ID=your_consumer_key
CLIENT_SECRET=your_consumer_secret
SESSION_SECRET=your_random_secret
PORT=3001
BACKEND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000

### Step 3: frontend setup
upadate .env
REACT_APP_API_URL=http://localhost:3001

🤝 Contributing
Fork the repository

Create feature branch (git checkout -b feature/amazing)

Commit changes (git commit -m 'Add amazing feature')

Push to branch (git push origin feature/amazing)

Open Pull Request

👨‍💻 Author
Ishraq Saifi

GitHub: @ISHRAQ01

Email: ishraq0641@gmail.com

🙏 Acknowledgments
Salesforce for providing Developer Edition

CloudVandana for the assignment opportunity

Open source community for amazing tools

📧 Contact
For questions or support, reach out to:

Email: ishraq0641@gmail.com

GitHub Issues: Create an issue




