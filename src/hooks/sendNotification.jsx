import { db } from '../firebase.config';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

// Funcția pentru a trimite o notificare
const sendNotification = async ({userRef, message}) => {
  try {
    // Adăugăm o notificare nouă în colecția 'inboxes'
    await addDoc(collection(db, 'inboxes'), {
      userRef, // Utilizatorul care primește notificarea
      message, // Mesajul notificării
      isRead: false, // Inițial, notificarea este necitită
      timestamp: serverTimestamp(), // Timestamp-ul când a fost trimisă notificarea
    });
    console.log('Notification sent successfully');
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export default sendNotification;
