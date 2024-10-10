import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { sendNotification } from '../hooks/sendNotification'; // Funcția ta de trimitere notificări
import { db } from '../firebase.config';

export const sendFriendRequest = async (senderId, receiverId, senderName) => {
  try {
    const friendRequestRef = await addDoc(collection(db, 'friendRequests'), {
      senderId: senderId,
      receiverId: receiverId,
      status: 'pending',
      timestamp: serverTimestamp(),
    });

    // Trimiterea notificării cu requestId-ul setat corect
    await sendNotification({
      userRef: receiverId,
      message: `${senderName} has sent you a friend request.`,
      type: 'friend_request',
      requestId: friendRequestRef.id, 
      senderId: senderId
    });

    console.log('Friend request sent and notification added.');
  } catch (error) {
    console.error('Error sending friend request:', error);
  }
};
