import { useState, useEffect, useRef } from "react";
import { db } from '../firebase.config';
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { toast } from 'react-toastify';
import { useNavigate, Link } from "react-router-dom";
import { getDoc, doc, updateDoc } from "firebase/firestore";
import { addDoc, collection, serverTimestamp, query, where, getDocs, orderBy, deleteDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from '../hooks/userContext';
import FishResults from '../components/fishes/FishResults';
import { FaEdit } from "react-icons/fa";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL
} from 'firebase/storage';
import { updateProfile, updateEmail, updatePassword } from "firebase/auth";
import { initFlowbite } from 'flowbite';


const storage = getStorage(); // Inițializează Firebase Storage

function Profile() {

  useEffect(() => {
    initFlowbite()
  }, [])

  const user = useUser();
  const [listings, setListings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); // Pentru controlul modalului
  const auth = getAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState(null)
  const isMounted = useRef(true);

  const [formData, setFormData] = useState({
    name: auth.currentUser?.displayName || "",
    email: auth.currentUser?.email || "",
    password: "",
    newPassword: "",
    avatar: null,
  });
  const { name, email, password, newPassword, avatar } = formData;

  useEffect(() => {
    const fetchUserListings = async () => {
      const listingsRef = collection(db, 'listings');
      const q = query(listingsRef, where('userRef', '==', auth.currentUser.uid), orderBy('timestamp', 'desc'));
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
  }, [auth.currentUser.uid]);

   // Fetch comments left by the user
   useEffect(() => {
    const fetchUserComments = async () => {
      const commentsRef = collection(db, 'comments');
      const q = query(commentsRef, where('userId', '==', auth.currentUser.uid), orderBy('timestamp', 'desc'));
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

    if (auth.currentUser.uid) {
      fetchUserComments();
    }
  }, [auth.currentUser.uid, navigate, Link]);

  const handleLogout = async () => {
    await signOut(auth);
    toast.success('Logged out');
    navigate('/');
  };

  const onDelete = async (listingId) => {
    if (window.confirm('Are you sure you want to delete?')) {
      await deleteDoc(doc(db, 'listings', listingId));
      const updatedListings = listings.filter((listing) => listing.id !== listingId);
      setListings(updatedListings);
      toast.success('Successfully deleted listing');
    }
  };

  const onChange = (e) => {
    if (e.target.files) {
      setFormData((prevState) => ({
        ...prevState,
        [e.target.id]: e.target.files[0],
      }));
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [e.target.id]: e.target.value,
      }));
    }
  };

  const uploadAvatar = async (file) => {
    const storageRef = ref(storage, `avatars/${auth.currentUser.uid}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        () => {},
        (error) => {
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      let avatarURL;
      if (avatar) {
        avatarURL = await uploadAvatar(avatar);
      }
  
      // Actualizăm profilul din Firebase Authentication
      if (name !== auth.currentUser.displayName || avatarURL) {
        await updateProfile(auth.currentUser, {
          displayName: name, // Setează displayName din Firebase Authentication cu valoarea name
          photoURL: avatarURL || auth.currentUser.photoURL
        });
      }
  
      // Actualizăm email-ul dacă este diferit
      if (email !== auth.currentUser.email) {
        await updateEmail(auth.currentUser, email);
      }
  
      // Actualizăm parola dacă a fost introdusă o nouă parolă
      if (newPassword) {
        await updatePassword(auth.currentUser, newPassword);
      }
  
      // Actualizăm datele din Firestore în colecția `users`
      const userDocRef = doc(db, "users", auth.currentUser.uid);
  
      // Actualizare document în Firestore
      await updateDoc(userDocRef, {
        email: email,
        avatar: avatarURL || auth.currentUser.photoURL,
        name: name || auth.currentUser.displayName, // Sincronizează name cu displayName
        timestamp: serverTimestamp(),
      });
  
      console.log("Document updated successfully");
  
      toast.success("Profile updated successfully!");
      setIsModalOpen(false); // Închide modalul după actualizare
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error updating profile!");
    } finally {
      setLoading(false);
    }
  };

 
  
  return (
    <div>
     <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
  {/* Secțiunea de profil cu avatar și nume */}
  <div className="flex items-center mb-4 sm:mb-0">
    <img
      src={user?.photoURL  || "https://flowbite.com/docs/images/people/profile-picture-5.jpg"}
      alt={user?.displayName || 'Anonim'}
      className="w-40 h-40 rounded-full mr-3"
    />
<span className="text-gray-700 dark:text-gray-200 text-5xl font-semibold">
  {user?.displayName || 'Anonim'}
</span>
  </div>

  {/* Butonul Edit Profile */}
  <button
    className="mt-4 sm:mt-0 flex items-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md"
    onClick={() => setIsModalOpen(true)} // Deschide modalul
  >
    <FaEdit className="mr-2" />
    Edit Profile
  </button>
</div>


      {/* Modalul pentru editarea profilului */}
      {isModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="max-w-md bg-white dark:bg-gray-800 p-6 rounded-lg relative">
      {/* Butonul de închidere */}
      <button
        className="absolute top-2 right-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
        onClick={() => setIsModalOpen(false)} // Închide modalul
      >
        ✕
      </button> 
      <form onSubmit={onSubmit}>
        <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Username
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={onChange}
          className="w-full p-2 mb-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />

        <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={onChange}
          className="w-full p-2 mb-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />

        <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          New Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={onChange}
          className="w-full p-2 mb-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />

        <label htmlFor="newPassword" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Confirm New Password
        </label>
        <input
          type="password"
          id="newPassword"
          value={newPassword}
          onChange={onChange}
          className="w-full p-2 mb-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />

        <label htmlFor="avatar" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Upload Avatar
        </label>
        <input
          type="file"
          id="avatar"
          onChange={onChange}
          className="block w-full text-sm text-gray-900 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-white dark:bg-gray-700 mb-4"
        />

        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-800 text-white py-2 px-4 rounded-md transition"
          disabled={loading}
        >
          {loading ? "Updating..." : "Submit"}
        </button>
      </form>
    </div>
  </div>
)}



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
            <FishResults listing={listing.data} id={listing.id} key={listing.id} onDelete={() => onDelete(listing.id)} />
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
            ) : comments && comments.length > 0 ? (
              comments.map((comment) => (
                <Link to={`/listing/${comment.data.listingRef}`}>
                <div key={comment.id} className="bg-white dark:bg-gray-900 p-4 pt-0 rounded-lg shadow-lg ">
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

export default Profile;
