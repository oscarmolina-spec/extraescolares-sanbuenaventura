import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAyb6sWG3_xKhBeMp2KRTJCn94ovrNU5q8',
  authDomain: 'extraescolarescsb.firebaseapp.com',
  projectId: 'extraescolarescsb',
  storageBucket: 'extraescolarescsb.firebasestorage.app',
  messagingSenderId: '747627055621',
  appId: '1:747627055621:web:7c5a8011e30df664b02a6c',
  measurementId: 'G-P4F5NBXLZS',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); // ¡Esta es la base de datos!
