import { db } from '../firebase.config';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

// Funcția pentru a trimite o notificare
export const sendNotification = async ({ userRef, message, type, requestId, senderId }) => {
  try {
    // Creăm un obiect pentru notificare
    const notification = {
      userRef, // Utilizatorul care primește notificarea
      message, // Mesajul notificării
      isRead: false, // Inițial, notificarea este necitită
      timestamp: serverTimestamp(), // Timestamp-ul când a fost trimisă notificarea
    };

    // Adăugăm 'type', 'requestId' și 'senderId' doar dacă sunt definite
    if (type) {
      notification.type = type;
    }

    if (requestId) {
      notification.requestId = requestId;
    }

    if (senderId) {
      notification.senderId = senderId; // Asigură-te că senderId este adăugat
    }

    // Adăugăm notificarea în colecția 'inboxes'
    await addDoc(collection(db, 'inboxes'), notification);
    console.log('Notification sent successfully');
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export default sendNotification;
