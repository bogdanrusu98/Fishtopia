import { useState, useEffect } from "react";
import FishResults from '../components/fishes/FishResults'
import { db } from '../firebase.config';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getDoc, doc, query, where, getDocs, orderBy, collection, deleteDoc, onSnapshot } from "firebase/firestore";
import { sendFriendRequest } from "../hooks/sendFriendRequest";
import { toast } from 'react-toastify';
import { IoMdPersonAdd } from "react-icons/io";
import { initFlowbite } from "flowbite";
import { IoPersonRemove } from "react-icons/io5";

const fetchUser = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data();
    } else {
      console.error('No such user found!');
      return null;
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

function User() {
  useEffect(() => {
    initFlowbite()
  }, [])
  const { uid } = useParams(); // Extrage `uid` din URL
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [comments, setComments] = useState([]);
  const [isPendingRequest, setIsPendingRequest] = useState(false);
  const [isFriend, setIsFriend] = useState(false); // Pentru a verifica dacă deja sunt prieteni
  const auth = getAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const getUserData = async () => {
      if (uid) {
        try {
          const user = await fetchUser(uid);
          setUserData(user);
        } catch (error) {
          console.error('Failed to fetch user data:', error);
        }
      }
    };
  
    const checkFriendStatus = async () => {
      if (!auth.currentUser?.uid) return;
  
      const friendsRef = collection(db, 'friends');
      const q1 = query(friendsRef, where('user1', '==', auth.currentUser.uid), where('user2', '==', uid));
      const q2 = query(friendsRef, where('user1', '==', uid), where('user2', '==', auth.currentUser.uid));
  
      const querySnap1 = await getDocs(q1);
      const querySnap2 = await getDocs(q2);
  
      // Verificăm dacă există prietenie în ambele direcții
      if (!querySnap1.empty || !querySnap2.empty) {
        setIsFriend(true); // Sunt deja prieteni
      } else {
        setIsFriend(false); // Nu sunt prieteni
      }
    };
  
    // Navigăm către profilul propriu dacă utilizatorul încearcă să-l vadă
    if (auth.currentUser && auth.currentUser.uid === uid) {
      navigate('/profile');
    } else {
      getUserData();
      checkFriendStatus();
    }
  }, [uid, auth.currentUser, navigate]);
  
  useEffect(() => {
    const checkPendingRequest = async () => {
      if (!auth.currentUser?.uid || !uid) return;
  
      const q = query(
        collection(db, 'friendRequests'),
        where('senderId', '==', auth.currentUser.uid),
        where('receiverId', '==', uid),
        where('status', '==', 'pending')
      );
  
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          setIsPendingRequest(true); // Există o cerere pending
        } else {
          setIsPendingRequest(false); // Nu există cereri pending
        }
      });
  
      return () => unsubscribe(); // Dezabonare de la evenimentul în timp real
    };
  
    checkPendingRequest();
  }, [auth.currentUser?.uid, uid]);
  
  useEffect(() => {
    const fetchUserListings = async () => {
      const listingsRef = collection(db, 'listings');
      const q = query(listingsRef, where('userRef', '==', uid), orderBy('timestamp', 'desc'));
      const querySnap = await getDocs(q);

      let listings = [];
      querySnap.forEach((doc) => {
        listings.push({
          id: doc.id,
          data: doc.data(),
        });
      });
      setListings(listings);
      setLoading(false);
    };

    fetchUserListings();
  }, [uid]);

  useEffect(() => {
    const fetchUserComments = async () => {
      const commentsRef = collection(db, 'comments');
      const q = query(commentsRef, where('userId', '==', uid), orderBy('timestamp', 'desc'));
      const querySnap = await getDocs(q);

      let userComments = [];
      querySnap.forEach((doc) => {
        userComments.push({
          id: doc.id,
          data: doc.data(),
        });
      });

      setComments(userComments);
      setLoading(false);
    };

    if (uid) {
      fetchUserComments();
    }
  }, [uid]);

  // Funcția pentru trimiterea unei cereri de prietenie
  const handleAddFriend = async () => {
    try {
      if (!auth.currentUser) {
        toast.error('Trebuie să fii conectat pentru a trimite cereri de prietenie');
        return;
      }

      await sendFriendRequest(auth.currentUser.uid, uid, auth.currentUser.displayName);
      toast.success('Cerere de prietenie trimisă');
    } catch (error) {
      toast.error('Eroare la trimiterea cererii de prietenie');
      console.error('Eroare la trimiterea cererii de prietenie:', error);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    try {
      // Referința la colecția 'friends'
      const friendsRef = collection(db, 'friends');
  
      // Căutăm documentele care reprezintă relația de prietenie dintre utilizatorul curent și prieten
      const q1 = query(friendsRef, where('user1', '==', auth.currentUser.uid), where('user2', '==', friendId));
      const q2 = query(friendsRef, where('user1', '==', friendId), where('user2', '==', auth.currentUser.uid));
  
      // Obținem documentele pentru ambele direcții ale prieteniei
      const querySnap1 = await getDocs(q1);
      const querySnap2 = await getDocs(q2);
  
      // Ștergem documentele care reprezintă relația de prietenie
      const batchDelete = async (querySnap) => {
        querySnap.forEach(async (docSnap) => {
          await deleteDoc(doc(db, 'friends', docSnap.id));
        });
      };
  
      await batchDelete(querySnap1);
      await batchDelete(querySnap2);
  
      toast.success('Friend removed successfully.');
    } catch (error) {
      console.error('Error removing friend:', error);
      toast.error('Error removing friend.');
    }
  };

  return (
    <div>

     <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
  {/* Secțiunea de profil cu avatar și nume */}
  <div className="flex items-center mb-4 sm:mb-0">
    <img
      src={userData?.avatar  || "https://flowbite.com/docs/images/people/profile-picture-5.jpg"}
      alt={userData?.name || 'Anonim'}
      className="w-40 h-40 rounded-full mr-3 object-cover"
    />
<span className="text-gray-700 dark:text-gray-200 text-5xl font-semibold">
  {userData?.name || 'Anonim'}
</span>
  </div>
  {!isFriend && auth.currentUser?.uid !== uid ? (
        isPendingRequest ? (
          <button
            className="mt-4 sm:mt-0 flex items-center bg-gray-400 text-white font-semibold py-2 px-4 rounded-md cursor-not-allowed"
            disabled
          >
            <IoMdPersonAdd className="mr-2" />
            Request Pending
          </button>
        ) : (
          <button
            className="mt-4 sm:mt-0 flex items-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md"
            onClick={handleAddFriend}
          >
            <IoMdPersonAdd className="mr-2" />
            Add Friend
          </button>
        )
      ) : (
        <button
          className="mt-4 sm:mt-0 flex items-center bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md"
          onClick={() => handleRemoveFriend(uid)}  
        >
          <IoPersonRemove className="mr-2" />
          Remove Friend
        </button>
      )}



</div>

<div className="mb-4 border-b border-gray-200 dark:border-gray-700">
    <ul className="flex flex-wrap -mb-px text-sm font-medium text-center" id="default-tab" data-tabs-toggle="#default-tab-content" role="tablist">
        <li className="me-2" role="presentation">
            <button className="inline-block p-4 border-b-2 rounded-t-lg" id="profile-tab" data-tabs-target="#profile" type="button" role="tab" aria-controls="profile" aria-selected="false">Posts</button>
        </li>
        <li className="me-2" role="presentation">
            <button className="inline-block p-4 border-b-2 rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300" id="dashboard-tab" data-tabs-target="#dashboard" type="button" role="tab" aria-controls="dashboard" aria-selected="false">Comments</button>
        </li>

    </ul>
</div>
<div id="default-tab-content">
    <div className="hidden p-4 pt-1 rounded-lg bg-gray-50 dark:bg-gray-800" id="profile" role="tabpanel" aria-labelledby="profile-tab">
    <div className="flex flex-wrap gap-4 mt-4">
        
        {loading ? (
          <div className="text-center">
            <div role="status">
              <svg
                aria-hidden="true"
                className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
              </svg>
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : listings && listings.length > 0 ? (
          listings.map((listing) => (
            <FishResults listing={listing.data} id={listing.id} key={listing.id}  />
          ))
        ) : (
          <p>No listings found</p>
        )}
      </div>

    </div>
    <div className="hidden p-4 pt-1 rounded-lg bg-gray-50 dark:bg-gray-800" id="dashboard" role="tabpanel" aria-labelledby="dashboard-tab">
          <div className="flex flex-wrap gap-4 mt-4">
            {loading ? (
              <div className="text-center">
                <div role="status">
                  <svg
                    aria-hidden="true"
                    className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                    viewBox="0 0 100 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                  </svg>
                  <span className="sr-only">Loading...</span>
                </div>
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <Link to={`/listing/${comment.data.listingRef}`}>
                <div key={comment.id} className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-lg ">
                  <p>{comment.data.text}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Posted on {new Date(comment.data.timestamp.seconds * 1000).toLocaleDateString()}
                  </p>
                </div>
                </Link>
              ))
            ) : (
              <p>No comments found</p>
            )}
          </div>
        </div>
      
    
</div>


      <hr className="my-4" />

    </div>
  );
}

export default User;
