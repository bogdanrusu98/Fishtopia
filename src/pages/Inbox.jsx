import { useState, useEffect } from 'react';
import { db } from '../firebase.config';
import { collection, query, where, getDocs, updateDoc, doc, orderBy, addDoc, limit, startAfter, getCountFromServer } from 'firebase/firestore';
import { useUser } from '../hooks/userContext'; // Hook custom pentru utilizatorul conectat
import { initFlowbite } from 'flowbite';
import { useNavigate, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import {sendNotification} from '../hooks/sendNotification'
function Inbox() {
  useEffect(() => {
    initFlowbite();
  }, []);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useUser(); // Preia utilizatorul conectat
  const userRef = user?.uid; // Obține UID-ul utilizatorului conectat
  const navigate = useNavigate();
  const [lastVisible, setLastVisible] = useState(null); // Ultimul document vizibil (pentru paginație)
  const [hasMore, setHasMore] = useState(true); // Indicator pentru a vedea dacă există mai multe documente
  const [pageSize] = useState(10); // Numărul de notificări pe pagină
  const [totalPages, setTotalPages] = useState(0); // Totalul paginilor
  const [currentPage, setCurrentPage] = useState(1); // Pagina curentă
  // Funcția pentru a prelua notificările din Firestore
  const fetchTotalPages = async () => {
    const notificationsRef = collection(db, 'inboxes');
    const q = query(notificationsRef, where('userRef', '==', user?.uid));
    const snapshot = await getCountFromServer(q);

    const totalDocuments = snapshot.data().count;
    setTotalPages(Math.ceil(totalDocuments / pageSize)); // Calculăm numărul total de pagini
  };

  const fetchNotifications = async (page = 1) => {
    setLoading(true);
    const notificationsRef = collection(db, 'inboxes');
    let q = query(
      notificationsRef,
      where('userRef', '==', user?.uid),
      orderBy('timestamp', 'desc'),
      limit(pageSize)
    );

    // Dacă pagina este mai mare decât 1, folosim `startAfter` pentru a începe de la ultimul document al paginii anterioare
    if (page > 1 && lastVisible) {
      q = query(
        notificationsRef,
        where('userRef', '==', user?.uid),
        orderBy('timestamp', 'desc'),
        startAfter(lastVisible),
        limit(pageSize)
      );
    }

    const querySnapshot = await getDocs(q);
    const newNotifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Setăm ultimul document vizibil pentru a-l folosi la paginile următoare
    const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    setLastVisible(lastDoc);

    setNotifications(newNotifications); // Actualizăm lista de notificări
    setLoading(false);
  };

  // Fetch initial notifications and total pages on mount
  useEffect(() => {
    if (user?.uid) {
      fetchTotalPages();
      fetchNotifications();
    }
  }, [user?.uid]);

  // Funcția pentru schimbarea paginii
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    fetchNotifications(pageNumber); // Încarcă notificările pentru pagina selectată
  };

  // Funcție pentru a accepta cererea de prietenie
  // Funcție pentru a accepta cererea de prietenie
// Funcție pentru a accepta cererea de prietenie
const acceptFriendRequest = async (notif) => {
  try {
    // Verificăm valorile
    console.log('userRef:', userRef);
    console.log('notif:', notif); // Afișează notificarea completă pentru a verifica ce date conține
    console.log('senderId:', notif.senderId);

    // Asigură-te că userRef și senderId sunt definite
    if (!userRef || !notif.senderId) {
      throw new Error('User ID or Sender ID is undefined');
    }

    const friendRequestRef = doc(db, 'friendRequests', notif.requestId);
    await updateDoc(friendRequestRef, { status: 'accepted' });

    // Adăugăm fiecare utilizator în lista de prieteni a celuilalt
    await addDoc(collection(db, 'friends'), {
      user1: userRef,
      user2: notif.senderId,
      timestamp: new Date()
    });

    await addDoc(collection(db, 'friends'), {
      user1: notif.senderId,
      user2: userRef,
      timestamp: new Date()
    });

    // Marcare notificare ca citită
    markAsRead(notif.id);
    toast.success('Friend request accepted!');
    await sendNotification({
      userRef: notif.senderId,
      message: `Your friend request has been accepted.`,
    });
    navigate(0)

  } catch (error) {
    console.error('Error accepting friend request:', error);
    toast.error('Error accepting friend request.');
  }
};


  // Funcție pentru a refuza cererea de prietenie
  const rejectFriendRequest = async (notif) => {
    try {
      const friendRequestRef = doc(db, 'friendRequests', notif.requestId);
      await updateDoc(friendRequestRef, { status: 'rejected' });

      // Marcare notificare ca citită
      markAsRead(notif.id);
      toast.success('Friend request rejected.');
      navigate(0)
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      toast.error('Error rejecting friend request.');
    }
  };

  // Funcție pentru a marca o notificare ca citită
  const markAsRead = async (id) => {
    const notificationRef = doc(db, 'inboxes', id);
    try {
      await updateDoc(notificationRef, { isRead: true });

      // Actualizăm lista de notificări local
      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) =>
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Error updating notification status:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [userRef]);

  if (loading) {
    return <p>Loading notifications...</p>;
  }

  return (
    <div>
      {/* Tabelul pentru notificări */}
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">
                Message
              </th>
              <th scope="col" className="px-6 py-3">
                Author
              </th>
              <th scope="col" className="px-6 py-3">
                Status
              </th>
              <th scope="col" className="px-6 py-3">
                Date
              </th>
              <th scope="col" className="px-6 py-3">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
          {notifications.length > 0 ? (
  notifications.map((notif) => (
    <tr
      key={notif.id}
      className={`bg-white border-b dark:bg-gray-800  dark:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 ${
        notif.isRead ? 'dark:text-gray-300 text-gray-500' : 'dark:text-gray-400 text-gray-600'
      }`}
    >
      <td className="px-6 py-4 text-gray-300">
        {/* Verificăm dacă există un href pentru a face notificarea un link */}
        {notif.href ? (
          <Link
            to={notif.href}
            className="font-medium  hover:underline text-gray-600 dark:text-gray-300"
            rel="noopener noreferrer"
          >
            {notif.message}
          </Link>
        ) : (
          <span className='dark:text-gray-300 text-gray-600'>{notif.message}</span>
        )}
      </td>
      <td className="px-6 py-4">
        {notif.author || 'System'}
      </td>
      <td className="px-6 py-4">
        {notif.isRead ? 'Read' : 'Unread'}
      </td>
      <td className="px-6 py-4">
        {notif.timestamp
          ? formatDistanceToNow(new Date(notif.timestamp.seconds * 1000), { addSuffix: true })
          : 'No timestamp'}
      </td>
      <td className="px-6 py-4">
        {/* Butoanele Accept și Reject doar pentru cereri de prietenie */}
        {notif.type === 'friend_request' && !notif.isRead && (
          <>
            <button
              className="font-medium text-green-600 dark:text-green-500 hover:underline mr-4"
              onClick={() => acceptFriendRequest(notif)}
            >
              Accept
            </button>
            <button
              className="font-medium text-red-600 dark:text-red-500 hover:underline"
              onClick={() => rejectFriendRequest(notif)}
            >
              Reject
            </button>
          </>
        )}
        {!notif.isRead && notif.type !== 'friend_request' && (
          <button
            className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
            onClick={() => markAsRead(notif.id)}
          >
            Mark as read
          </button>
        )}
      </td>
    </tr>
  ))
) : (
  <tr>
    <td colSpan="5" className="px-6 py-4 text-center">
      No notifications found
    </td>
  </tr>
)}

          </tbody>
        </table>
         {/* Buton pentru pagina următoare */}
            {/* Navigarea între pagini */}
            {!loading && totalPages > 1 && (
        <div className="flex justify-center mt-4">
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => handlePageChange(index + 1)}
              className={`mx-1 px-3 py-1 border rounded ${
                index + 1 === currentPage
                  ? 'bg-gray 800 text-white cursor-not-allowed' // Stil pentru pagina curentă
                  : 'bg-gray-700 hover:bg-gray-300'
              }`}
              disabled={index + 1 === currentPage} // Dezactivează butonul pentru pagina curentă
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

export default Inbox;
