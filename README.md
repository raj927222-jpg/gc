# GYUTARO COLLECTION — Luxury Men's Fashion Atelier

Full-stack luxury e-commerce web application with React 19, Vite, Tailwind CSS, Express backend, and MongoDB Atlas database integration.

---

## 🚀 How to Run on Localhost (Apne Computer Par Kaise Chalayein)

Follow these simple steps to run this project on your local machine:

### 1. Prerequisites (Zaroori Cheezein)
Ensure you have installed:
- **Node.js** (v18 or v20+ recommended) — [Download Node.js](https://nodejs.org/)
- **npm** (comes bundled with Node.js)
- **Git** (optional, if cloning from GitHub)

---

### 2. Download or Clone the Project
Agar aap GitHub se clone kar rahe hain:
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd gyutaro-collection
```
Ya agar ZIP file download ki hai, to use extract karke terminal / command prompt me us folder me jayein:
```bash
cd /path/to/extracted-folder
```

---

### 3. Install Dependencies (Packages Install Karein)
Terminal me ye command run karein:
```bash
npm install
```

---

### 4. Create Environment Configuration (`.env` File)
Project ke root folder me ek `.env` naam ki file banayein:

```env
PORT=3000
NODE_ENV=development
APP_URL="http://localhost:3000"

# Admin Authentication
JWT_SECRET=gyutaro_super_secret_jwt_key_2026
ADMIN_EMAIL=admin@gyutarocollection.com
ADMIN_PASSWORD=Admin@Luxury2026!

# MongoDB Atlas Database Connection
MONGODB_URI=mongodb+srv://gyutaro_collection:raj%40123@cluster0.x70hmm8.mongodb.net/gyutaro_atelier?retryWrites=true&w=majority
```

> **Important Note for MongoDB Atlas:**
> Password me agar `@` symbol ho (jaise `raj@123`), use URL encode karke `raj%40123` likhna zaroori hota hai taaki connection me koi error na aaye.

---

### 5. Start Local Development Server (Server Start Karein)
Ab terminal me ye command chalayein:
```bash
npm run dev
```

Terminal me ye message aayega:
```
Server running on http://0.0.0.0:3000
[MongoDB] Initial connection established: connected
```

---

### 6. Open in Browser (Browser me Kholein)
Apna browser (Chrome/Edge/Brave) kholein aur visit karein:
👉 **http://localhost:3000**

- **Customer Storefront:** `http://localhost:3000/`
- **Admin Panel:** Top navigation bar me "Admin Portal" par click karein ya direct URL kholein.
  - **Admin Email:** `admin@gyutarocollection.com`
  - **Admin Password:** `Admin@Luxury2026!`

---

## 🛠️ Available Scripts (Commands)

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts full-stack development server with hot-reload on port 3000 |
| `npm run build` | Builds both frontend and backend for production |
| `npm start` | Runs the compiled production build from `dist/server.cjs` |
| `npm run lint` | Checks TypeScript types across the codebase |
