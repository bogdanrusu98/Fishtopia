import { useNavigate } from "react-router-dom";
import FishResults from "../components/fishes/FishResults"
import {db} from '../firebase.config'
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {collection, getDocs, query, where, orderBy, limit, startAfter} from 'firebase/firestore'



function Home() {
  const [listings, setListings] = useState(null)
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    const fetchListings = async () => {
      try {
        const listingsRef = collection(db, 'listings')

        // Create a query

        const q = query(listingsRef, limit(5), orderBy('timestamp', 'desc'))

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

      } catch(error) {
        toast.error('Error')
      }
    }

    fetchListings()
  }, [])

  return (
  <>
    <div>
      <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">Welcome</h1>
      <br />


      <div className="flex flex-wrap  gap-4">
      {loading ? (
        <p>Loading...</p>
      ) : (
        listings && listings.length > 0 ? (
          listings.map((listing) => (
            <FishResults listing={listing.data} id={listing.id} key={listing.id} />
          ))
        ) : (
          <p>No listings found</p>
        )
      )}

    </div>
    </div>
  </>
)

}

export default Home
