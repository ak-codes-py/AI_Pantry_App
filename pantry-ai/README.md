# Pantry AI App (updates coming soon)

This is a Pantry Inventory application built with Next.js, Firebase, and Tailwind CSS. The application allows users to add, read, and delete items from their pantry, and it updates the inventory in real-time using Firebase Firestore.

## Features

- Add items to the pantry with their name, quantity, and MSRP (Manufacturer's Suggested Retail Price).
- Display a list of items in the pantry with their current quantities and total MSRP.
- Update the quantity of items in real-time.
- Delete items from the pantry.
- Real-time synchronization with Firebase Firestore.
- Responsive design using Tailwind CSS.

## Technologies Used

- **Next.js**: A React framework for building server-side rendered and static web applications.
- **Firebase Firestore**: A NoSQL database from Firebase for storing and syncing data in real-time.
- **Tailwind CSS**: A utility-first CSS framework for styling the application.

## Setup and Installation

Follow these steps to set up and run the application locally.

### Prerequisites

- Node.js and npm installed on your machine.
- Firebase project set up.

### Installation

1. **Clone the repository**:

   ```sh
   git clone https://github.com/yourusername/pantry-inventory-app.git
   cd AI_Pantry_App


2. **Install dependencies:**
npm install

3. **Set up Firebase: Go to the Firebase Console.**
Create a new project or use an existing project.
Add a new web app to your Firebase project.
Copy the Firebase config object.

4. **Configure Firebase in the project:**

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

5. **Run the App!**

npm run dev

