import { useState, useEffect, useRef } from "react"
import {db} from '../firebase.config'
import { getAuth, onAuthStateChanged, signOut} from "firebase/auth";
import {toast} from 'react-toastify'
import { useNavigate } from "react-router-dom";
import { getDoc, doc } from "firebase/firestore";
import {addDoc, collection, serverTimestamp, query, where, getDocs, orderBy, deleteDoc} from 'firebase/firestore'
import {v4 as uuidv4} from 'uuid'
import FishResults from '../components/fishes/FishResults'



function Profile() {

  const [listings, setListings] = useState(null)
  const [loading, setLoading] = useState(true)
  const auth = getAuth()
  const navigate = useNavigate()
  const isMounted = useRef(true)

  useEffect(() => {
    if (isMounted) {
      onAuthStateChanged(auth, (user) => {
        if (!user) {
          navigate("/login");
        }
      });
    }

    return () => {
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);
  
  
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

  return (
    <div>
      <h2 className="mb-2 text-4xl font-semibold text-gray-900 "> My Profile </h2>
      <button onClick={handleLogout} className='mt-2 focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900'>Logout</button>
      
      
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
