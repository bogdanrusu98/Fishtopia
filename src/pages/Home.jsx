import { useNavigate, Link } from "react-router-dom";
import { collection, getDocs, query, orderBy, limit, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase.config';
import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import { formatDistanceToNow } from 'date-fns';
import FishResults from "../components/fishes/FishResults";

// Funcție pentru a trunca textul
const truncateText = (text, maxWords) => {
  const words = text.split(' ');
  return words.length > maxWords ? words.slice(0, maxWords).join(' ') + '...' : text;
};

function Home() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = useCallback(async () => {
    try {
      const listingsRef = collection(db, 'listings');
      const q = query(listingsRef, limit(15), orderBy('timestamp', 'desc'));
      const querySnap = await getDocs(q);

      const fetchedListings = await Promise.all(querySnap.docs.map(async (docSnap) => {
        const listingData = docSnap.data();
        const userId = listingData.userRef;

        if (userId) {
          const userDocRef = doc(db, 'users', userId);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            listingData.user = userSnap.data(); // Attach user data (e.g., avatar, name)
          }
        }

        return { id: docSnap.id, data: listingData };
      }));

      setListings(fetchedListings);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching listings:", error);
      toast.error('Error fetching listings');
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const listingsMemo = useMemo(() => {
    return listings.map((listing) => (
      <FishResults listing={listing.data} id={listing.id} key={listing.id} />
    ));
  }, [listings]);

  return (
    <div>
      

<div class="w-full p-4 text-center bg-white border border-gray-200 rounded-lg shadow sm:p-8 dark:bg-gray-800 dark:border-gray-700 mb-4">
    <h5 class="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Do you want to create a listing?</h5>
    <div class="items-center justify-center space-y-4 sm:flex sm:space-y-0 sm:space-x-4 rtl:space-x-reverse">
        <Link to='/create-listing' className="btn btn-primary w-full sm:w-auto  hover:bg-gray-700 focus:ring-4 focus:outline-none focus:ring-gray-300 text-white rounded-lg inline-flex items-center justify-center px-4 py-2.5 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700">
            <div class="text-left rtl:text-right">
                Create here
            </div>
        </Link>
    </div>
</div>


      <div className="flex flex-col items-center w-full">
        {loading ? (
          <div className="text-center">
            <LoadingSpinner />
          </div>
        ) : (
          listings.length > 0 ? (
            <div className="w-full max-w-4xl space-y-4">
              {listingsMemo}
            </div>
          ) : (
            <p>No listings found</p>
          )
        )}
      </div>
    </div>
  );
}

// Componenta pentru spinner
const LoadingSpinner = () => (
  <div role="status">
    <svg
      aria-hidden="true"
      className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
      viewBox="0 0 100 101"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
        fill="currentColor"
      />
      <path
        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
        fill="currentFill"
      />
    </svg>
    <span className="sr-only">Loading...</span>
  </div>
);

export default Home;
