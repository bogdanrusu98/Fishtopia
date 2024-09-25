import { useState, useEffect, useRef } from "react"
import {db} from '../firebase.config'
import { getAuth, onAuthStateChanged, signOut} from "firebase/auth";
import {toast} from 'react-toastify'
import { useNavigate } from "react-router-dom";
import { getDoc, doc, updateDoc} from "firebase/firestore";
import {addDoc, collection, serverTimestamp, query, where, getDocs, orderBy, deleteDoc} from 'firebase/firestore'
import {v4 as uuidv4} from 'uuid'
import FishResults from '../components/fishes/FishResults'
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL
} from 'firebase/storage'
import { updateProfile, updateEmail, updatePassword } from "firebase/auth";
const storage = getStorage(); // Inițializează Firebase Storage


function Profile() {

  const [listings, setListings] = useState(null)
  const [loading, setLoading] = useState(true)
  const auth = getAuth()
  const navigate = useNavigate()
  const isMounted = useRef(true)

  
  const [formData, setFormData] = useState({
    name: auth.currentUser?.displayName || "",
    email: auth.currentUser?.email || "",
    password: "",
    newPassword: "",
    avatar: null,
  });
  const { name, email, password, newPassword, avatar } = formData;

  
  useEffect(() => {
  const fetchUserListings = (async () => {
    console.log('user')

    
      const listingsRef = collection(db, 'listings')

      const q = query(listingsRef, where('userRef', '==', auth.currentUser.uid), orderBy('timestamp', 'desc'))

      const querySnap = await getDocs(q)

      let listings = []

      querySnap.forEach((doc) => {
        return listings.push({
          id: doc.id,
          data: doc.data()
        })
      })
      setListings(listings)
      setLoading(false)
      
   

  })
  
  fetchUserListings()
}, [auth.currentUser.uid])


  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    toast.success('Logged out')
    navigate('/')
  };

  const onDelete = async(listingId) => {
    if(window.confirm('Are you sure u want to delete?')) {
      await deleteDoc(doc(db, 'listings', listingId))
      const updatedListings = listings.filter((listing) => listing.id !== listingId)
      setListings(updatedListings)
      toast.success('Successfully deleted listing')
    }
  }

  // Funcția de schimbare a datelor din formular
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
        (snapshot) => {
          // Progress monitor (optional)
        },
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
      // Actualizarea avatarului
      let avatarURL;
      if (avatar) {
        avatarURL = await uploadAvatar(avatar);
      }

      // Actualizarea numelui și avatarului utilizatorului în Firebase Authentication
      if (name !== auth.currentUser.displayName || avatarURL) {
        await updateProfile(auth.currentUser, {
          displayName: name,
          photoURL: avatarURL || auth.currentUser.photoURL,
        });
      }

      // Actualizarea emailului în Firebase Authentication
      if (email !== auth.currentUser.email) {
        await updateEmail(auth.currentUser, email);
      }

      // Actualizarea parolei dacă este furnizată
      if (newPassword) {
        await updatePassword(auth.currentUser, newPassword);
      }

      // Actualizarea documentului utilizatorului în Firestore, dacă există
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userDocRef, {
        email,
        avatar: avatarURL || auth.currentUser.photoURL,
        timestamp: serverTimestamp(),
      });

      toast.success("Profilul a fost actualizat cu succes!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Eroare la actualizarea profilului!");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div>
      <h2 className="mb-2 text-4xl font-semibold text-gray-900 "> My Profile </h2>
      
      <div className="max-w-sm border-2 p-4">
        <form onSubmit={onSubmit}>
          <label htmlhtmlFor="website-admin" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Username</label>
          <div className="flex">
            <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-e-0 border-gray-300 rounded-s-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z" />
              </svg>
            </span>
            <input
              type="text"
              id="name"
              disabled
              value={name}
              onChange={onChange}
              className="rounded-none rounded-e-lg bg-gray-50 border border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            />
          </div>
          <div className="mb-5">
            <label htmlhtmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={onChange}
              className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
            />
          </div>
          <div className="mb-5">
            <label htmlhtmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">New password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={onChange}
              className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
            />
          </div>
          <div className="mb-5">
            <label htmlhtmlFor="newPassword" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Confirm New password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={onChange}
              className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
            />
          </div>
          <div className="mb-5">
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white" htmlhtmlFor="avatar">Upload new avatar</label>
            <input
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
              id="avatar"
              type="file"
              onChange={onChange}
            />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Updating..." : "Submit"}
          </button>
        </form>
      </div>

      <button onClick={handleLogout} className='mt-2 focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900'>Logout</button>

<hr className="my-4"/>
      
      <div className="flex flex-wrap gap-4 mt-4 ">

      {loading ? (
        <p>Loading...</p>
      ) : (
        listings && listings.length > 0 ? (
          listings.map((listing) => (
            <FishResults listing={listing.data} id={listing.id} key={listing.id} onDelete={() => onDelete(listing.id)} />
          ))
        ) : (
          <p>No listings found</p>
        )
      )}
    </div>
    
</div>
  )
}

export default Profile
