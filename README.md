TryOnX - Virtual Try-On System

Virtual Try-On System is a modern web application that allows users to digitally preview clothing items before purchasing them. Users can upload their images, explore outfits, and complete purchases through an integrated payment system. The application provides secure authentication, a responsive UI, and a seamless shopping experience.

Project Overview

This project demonstrates how modern web technologies can be combined with cloud services to build an interactive fashion platform. The system enables users to visualize clothing virtually, improving decision-making in online shopping.

Features

• Secure user authentication (Email & Google)
• Upload image for virtual try-on
• Browse and preview outfits
• Integrated payment module
• Responsive modern UI
• Cloud database for user data
• Smooth animations and interactive interface


Tech Stack

Frontend
• React.js
• TypeScript
• Tailwind CSS

Backend / Cloud
• Firebase Authentication
• Cloud Firestore

Libraries
• Framer Motion
• Lucide


Make sure the following are installed:
• Node.js (v18 or higher)
• npm or Yarn
• Git

Check installation:
node -v
npm -v
git --version

Installation Guide
1. Clone the Repository
git clone https://github.com/yourusername/virtual-tryon-system.git

Navigate into the project directory:

cd virtual-tryon-system
2. Install Dependencies
npm install

Th
is will install all required packages including React, Firebase, and other libraries.

3. Environment Configuration

Create a .env file in the root folder.

touch .env

Add your Firebase configuration:

VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxxxx
VITE_FIREBASE_APP_ID=xxxxx

You can get these credentials from Firebase Console.

4. Start Development Server

Run the project locally:
npm run dev
Open in browser:

http://localhost:5173
Build for Production
npm run build

Preview production build:

npm run preview
Authentication

The system supports:
• Email & Password Authentication
• Google Sign-In Authentication
Authentication is handled through Firebase Authentication.
Payment Integration
The application includes a payment module allowing users to complete purchases after selecting outfits. This feature simulates a modern e-commerce checkout process.


Author
Pradnya Bhondivale

License
This project is developed for educational and demonstration purposes.
