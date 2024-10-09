import { useState, useEffect, useRef } from "react";
import { db } from '../firebase.config';
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { toast } from 'react-toastify';
import { useNavigate, useParams, Link } from "react-router-dom";
import { getDoc, doc, updateDoc } from "firebase/firestore";
import { addDoc, collection, serverTimestamp, query, where, getDocs, orderBy, deleteDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import FishResults from '../components/fishes/FishResults';
import { initFlowbite } from 'flowbite';
import { FaRegMessage } from "react-icons/fa6";
import { IoMdPersonAdd } from "react-icons/io";



const fetchUser = async (uid) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        console.log("User data exists:", userSnap.data()); // Adaugă acest log
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

    const checkUser = () => {
        if(auth.currentUser.uid == uid) {
            navigate('/profile')
        }
    }
  
    getUserData();
    checkUser()
  }, [uid]);
  
  const [comments, setComments] = useState(null)
  const [listings, setListings] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (uid) {
        try {
          const user = await fetchUser(uid); // Preia datele utilizatorului pe baza `uid`-ului
          setUserData(user);
        } catch (error) {
          console.error('Failed to fetch user data:', error);
        }
      }
    };

    fetchUserData();
  }, [uid]);

  useEffect(() => {
    const fetchUserListings = async () => {
      const listingsRef = collection(db, 'listings');
      const q = query(listingsRef, where('userRef', '==', uid), orderBy('timestamp', 'desc'));
      const querySnap = await getDocs(q);

      let listings = [];
      querySnap.forEach((doc) => {
        return listings.push({
          id: doc.id,
          data: doc.data(),
        });
      });
      setListings(listings);
      setLoading(false);
    };

    fetchUserListings();
  }, [uid]);

  // Fetch comments left by the user
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

  return (
    <div>

     <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
  {/* Secțiunea de profil cu avatar și nume */}
  <div className="flex items-center mb-4 sm:mb-0">
    <img
      src={userData?.avatar  || "https://flowbite.com/docs/images/people/profile-picture-5.jpg"}
      alt={userData?.name || 'Anonim'}
      className="w-40 h-40 rounded-full mr-3"
    />
<span className="text-gray-700 dark:text-gray-200 text-5xl font-semibold">
  {userData?.name || 'Anonim'}
</span>
  </div>

<button
className="mt-4 sm:mt-0 flex items-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md"
onClick={() => alert('In Progress')} // Deschide modalul
>
<IoMdPersonAdd className="mr-2" />
Add Friend
</button>



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
    <div className="hidden p-4 rounded-lg bg-gray-50 dark:bg-gray-800" id="profile" role="tabpanel" aria-labelledby="profile-tab">
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
