import { useState, useEffect } from 'react';
import { db } from '../firebase.config';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useUser } from '../hooks/userContext'; // Un hook custom pentru a prelua user-ul conectat
import { initFlowbite } from 'flowbite';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

function Inbox() {

  useEffect(() => {
    initFlowbite();
  }, []);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useUser(); // Preia user-ul conectat
  const userRef = user?.uid; // Obține UID-ul utilizatorului conectat
  const navigate = useNavigate();

  // Funcția pentru a prelua notificările din Firestore
  const fetchNotifications = async () => {
    if (!userRef) return;

    const q = query(
      collection(db, 'inboxes'),
      where('userRef', '==', userRef)
    );

    const querySnapshot = await getDocs(q);

    let fetchedNotifications = [];
    querySnapshot.forEach((doc) => {
      fetchedNotifications.push({ id: doc.id, ...doc.data() });
    });

    setNotifications(fetchedNotifications);
    setLoading(false);
  };

  // Funcție pentru a marca o notificare ca citită
  const markAsRead = async (id) => {
    const notificationRef = doc(db, 'inboxes', id);
    await updateDoc(notificationRef, { isRead: true });

    // Actualizăm lista de notificări după ce am marcat notificarea ca citită
    setNotifications((prevNotifications) =>
      prevNotifications.map((notif) =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
    navigate(0);
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
                  className={`bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 ${
                    notif.isRead ? 'text-gray-300' : 'text-gray-400'
                  }`}
                >
                  <td className="px-6 py-4">
                    {notif.message}
                  </td>
                  <td className="px-6 py-4">
                    {notif.author || 'System'} {/* Poți personaliza cum obții numele autorului */}
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
                    {!notif.isRead && (
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
      </div>
    </div>
  );
}

export default Inbox;
