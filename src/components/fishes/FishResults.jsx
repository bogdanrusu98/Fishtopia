import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, getDocs, query, where, doc, updateDoc, arrayUnion, arrayRemove, getDoc, deleteDoc } from "firebase/firestore";
import { db } from '../../firebase.config';
import { getAuth } from "firebase/auth";
import { FaThumbsUp, FaComments } from "react-icons/fa";
import { formatDistanceToNow } from 'date-fns';
import { toast } from "react-toastify";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import { Dropdown } from "flowbite-react";
import { useUser } from '../../hooks/userContext';


function FishResults({ listing, id }) {
  const user = useUser();
  const navigate = useNavigate()
  const [listings, setListings] = useState([]);
  const [userName, setUserName] = useState(null);
  const [userAvatar, setUserAvatar] = useState(""); // State pentru avatar
  const [likes, setLikes] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0); // Setează numărul de comentarii
  const [liked, setLiked] = useState(false); // Stare pentru a urmări dacă utilizatorul a dat like
  const auth = getAuth();
  const userId = auth.currentUser?.uid; // ID-ul utilizatorului curent

  // Fetch likes and comments count
  useEffect(() => {
    const fetchListingDetails = async () => {
      const listingRef = doc(db, "listings", id);
      const listingSnap = await getDoc(listingRef);

      if (listingSnap.exists()) {
        setLikes(listingSnap.data().likes || 0); // Setează numărul de like-uri

        // Verifică dacă utilizatorul curent a dat like
        const likedBy = listingSnap.data().likedBy || [];
        if (likedBy.includes(userId)) {
          setLiked(true); // Marchează că utilizatorul a dat like
        }
      }

      // Fetch the number of comments from the "comments" collection
      const commentsRef = collection(db, "comments");
      const commentsQuery = query(
        commentsRef, 
        where("listingRef", "==", id) // Filtrează comentariile care aparțin acestui listing
      );
      
      const commentsSnapshot = await getDocs(commentsQuery);
      if (commentsSnapshot.empty) {
        setCommentsCount(0); // Dacă nu există comentarii, setează 0
      } else {
        setCommentsCount(commentsSnapshot.docs.length); // Setează numărul de comentarii
      }
    };

    fetchListingDetails();
  }, [id, userId]);

  // Funcție pentru a adăuga/elimina like-uri
  const toggleLike = async () => {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
  
    if (!userId) {
      // Utilizatorul nu este autentificat
      toast.error("You need to be logged in to like listings.");
      return; // Oprește execuția dacă nu este autentificat
    }
  
    const listingRef = doc(db, "listings", id);
    
    if (liked) {
      // Dacă a dat like, elimină like-ul
      await updateDoc(listingRef, {
        likes: likes - 1,
        likedBy: arrayRemove(userId) // Scoate utilizatorul din likedBy
      });
      setLikes(likes - 1);
      setLiked(false); // Marcați că utilizatorul a scos like-ul
    } else {
      // Dacă nu a dat like, adaugă like-ul
      await updateDoc(listingRef, {
        likes: likes + 1,
        likedBy: arrayUnion(userId) // Adaugă utilizatorul la likedBy
      });
      setLikes(likes + 1);
      setLiked(true); // Marcați că utilizatorul a dat like
    }
  };

    // Funcția pentru editarea listing-ului
    const handleEdit = (listingId) => {
      navigate(`/edit-listing/${listingId}`); // Redirecționează la pagina de editare
    };
     // onDelete function to remove a listing
     const onDelete = async (listingId) => {
      if (window.confirm('Are you sure you want to delete this listing?')) {
        try {
          // Delete the document from Firestore
          await deleteDoc(doc(db, 'listings', listingId));
  
          // Update the UI to remove the deleted listing
          setListings(listings.filter((listing) => listing.id !== listingId));
  
          // Show success notification
          toast.success('Listing deleted successfully!');
        } catch (error) {
          console.error('Error deleting listing:', error);
          toast.error('Error deleting listing!');
        }
      }
    };
  const truncateText = (text, maxWords) => {
    const words = text.split(' ');
    if (words.length > maxWords) {
      return words.slice(0, maxWords).join(' ') + '...';
    }
    return text;
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!listing || !listing.userRef) {
        return;
      }

      const userDocRef = doc(db, "users", listing.userRef);

      try {
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUserName(userData.name); // Setează numele utilizatorului
          setUserAvatar(userData.avatar); // Setează avatarul utilizatorului
        } else {
          console.log("No matching user found");
        }
      } catch (error) {
        console.error("Error fetching user: ", error);
      }
    };

    if (listing) {
      fetchUserDetails();
    }
  }, [listing]);

  return (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 w-full p-6">
    {/* Flex pentru a poziționa butonul în dreapta */}
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center">
        <img
          src={userAvatar || "https://flowbite.com/docs/images/people/profile-picture-5.jpg"}
          alt={userName || 'Anonim'}
          className="w-10 h-10 rounded-full mr-3"
        />
        <span className="text-gray-700 dark:text-gray-300 font-semibold">{userName || 'Anonim'}</span>
      </div>

      {user && user.uid === listing.userRef ? (
        <>
          {/* Dropdown pentru butonul cu 3 puncte */}
          <Dropdown
            arrowIcon={false}
            inline={true}
            label={
              <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 4 15">
                <path d="M3.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 6.041a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 5.959a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
              </svg>
            }
          >
            <Dropdown.Item onClick={() => handleEdit(id)}>
              <FaEdit className="mr-2" />
              Edit
            </Dropdown.Item>
            <Dropdown.Item onClick={() => onDelete(id)}>
              <FaTrashAlt className="mr-2" />
              Delete
            </Dropdown.Item>
          </Dropdown>
        </>
      ) : null}
    </div>

    <Link to={`/listing/${id}`}>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">{listing.title}</h2>

      {listing.imgUrls && (
        <img src={listing.imgUrls} alt={listing.title} className="w-full h-auto rounded-lg mb-4" />
      )}
    </Link>

    {/* Descrierea cu text trunchiat */}
    <span
      className="text-gray-700 dark:text-gray-300"
      dangerouslySetInnerHTML={{ __html: truncateText(listing.description, 20) }}
    ></span>

    {/* Butoane Like și Comment stilizate */}
    <div className="flex justify-between items-center mt-6 space-x-4">
      {/* Buton Like */}
      <button
        onClick={toggleLike}
        className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-white transition duration-200 ${
          liked ? 'bg-red-600' : 'bg-gray-400 hover:bg-red-500'
        }`}
      >
        <FaThumbsUp className="text-xl" />
        <span className="font-semibold">{likes} Likes</span>
      </button>

      {/* Buton Comments */}
      <Link
        to={`/listing/${id}`}
        className="flex items-center justify-center space-x-2 px-4 py-2 rounded-md bg-gray-400 hover:bg-blue-500 text-white transition duration-200"
      >
        <FaComments className="text-xl" />
        <span className="font-semibold">{commentsCount} Comments</span>
      </Link>
    </div>

    {/* Alte detalii */}
    <div className="text-gray-500 dark:text-gray-400 text-sm mt-4">
      <p>{formatDistanceToNow(listing.timestamp?.toDate())} ago</p>
    </div>
  </div>


  );
}

export default FishResults;
