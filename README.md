

https://github.com/user-attachments/assets/e06a3711-0105-4420-b403-8d4ec448e8f0

# 🚗 CarPal — AI-Powered Car Image Analyzer

CarPal is a full-stack web application that allows users to upload images of cars, receive AI-generated vehicle information using Google Gemini, and manage their car gallery securely through user authentication. It features a modern React + Tailwind frontend and a robust Express + MySQL backend.

---

## 🧠 Features

### ✅ User Authentication
- JWT-based login/signup system
- Passwords hashed with bcrypt
- Secure user-specific access to uploaded images

### ✅ AI-Powered Car Info Extraction
- Upload a car image and receive structured JSON data using **Google Gemini AI**
- Extracted information includes:
  - Make
  - Model
  - Year
  - Body Type
  - Horsepower
  - Top Speed (kph)
  - Fuel Efficiency (km/l)
  - Approximate Price (USD)

### ✅ Image Upload & Preview
- Drag-and-drop or button-based image upload
- Preview image before submission
- Images stored in user-specific directories on the server

### ✅ Gallery Management
- View previously uploaded car images
- Click to view AI-analyzed metadata
- Delete any uploaded image

### ✅ Featured Car on Home Page
- Displays a randomly selected car from the database for public viewing

---

## 🛠️ Tech Stack

### 🔵 Frontend
- **React.js** (Vite)
- **Tailwind CSS**
- **Framer Motion** (for animated background)
- **React Icons**

### 🔴 Backend
- **Express.js** server
- **MySQL** (via `mysql2` driver)
- **Multer** for image uploads
- **JWT** for authentication
- **Bcrypt** for password security
- **CORS** middleware for frontend-backend communication

### 🤖 AI Integration
- **Google Gemini API** via `@google/generative-ai`  
  Used for analyzing car images and returning structured JSON.

---

## 🔐 .env Example

Make sure your `.env` file includes the following environment variables:

```env
PORT=3000
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=your_db_name

GEMINI_API_KEY=your_google_gemini_api_key
JWT_SECRET=your_jwt_secret

FRONTEND_ORIGIN=http://localhost:5173


```
## 📁 Project Structure
```bash
CarPal/
├── backend/
│   ├── cars/                   # Uploaded images (auto-created per user)
│   ├── db.js                   # MySQL DB connection
│   ├── app.js                  # Main Express server
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── public/                 # Static files like favicon
│   ├── src/
│   │   ├── assets/             # Images/icons used in UI
│   │   ├── MainPage.jsx              
│   │   ├── PageRouter.jsx        
│   │   ├── Dashboard.jsx            
│   │   ├── main.jsx            
│   │   └── index.css
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── README.md
└── .gitignore

```


## 🚀 Getting Started
### 1. Clone the repo
```bash

git clone https://github.com/yourusername/carpal.git
cd carpal
```
### 2. Install Backend Dependencies
```bash
cd backend
npm install
```
### 3. Setup MySQL Database
Run the following SQL to create the required tables:

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cars (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255),
  url VARCHAR(255),
  user_id INT,
  car_info JSON,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```
### 4. Start Backend Server
```bash
node app.js
```
### 5. Install Frontend Dependencies
``` bash

cd ../frontend
npm install
```
### 6. Start Frontend Dev Server
``` bash
npm run dev
```
