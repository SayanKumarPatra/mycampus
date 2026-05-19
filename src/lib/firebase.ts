import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Using your provided configuration directly for maximum reliability
const firebaseConfig = {
  apiKey: "AIzaSyAtsrglY37vRNbZN7BfZj8bwiH68DoelZs",
  authDomain: "database-529ec.firebaseapp.com",
  databaseURL: "https://database-529ec-default-rtdb.firebaseio.com/",
  projectId: "database-529ec",
  storageBucket: "database-529ec.firebasestorage.app",
  messagingSenderId: "59037304674",
  appId: "1:59037304674:web:b75bd1bfa92d9de8a84e3b"
};

const app = initializeApp(firebaseConfig);

// Explicitly passing the database URL to ensure connection to the correct instance
export const db = getDatabase(app, firebaseConfig.databaseURL);
