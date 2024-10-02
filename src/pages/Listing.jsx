import { Swiper, SwiperSlide } from "swiper/react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Navigation, Pagination, Zoom } from "swiper/modules";
import SwiperCore from "swiper";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { RiErrorWarningFill } from "react-icons/ri";
import Comments from "../components/Comments";
import { useUser } from '../hooks/userContext';
import Map from "../components/Map";
import { db } from "../firebase.config";
import { getDoc, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

SwiperCore.use([Navigation, Pagination, Zoom]);

function Listing() {
  const [listing, setListing] = useState(null);
  const [userName, setUserName] = useState(null);
  const [userAvatar, setUserAvatar] = useState(""); // State pentru avatar
  const user = useUser();
  const navigate = useNavigate();
  const auth = getAuth();
  const params = useParams();

  useEffect(() => {
    const fetchListing = async () => {
      const docRef = doc(db, "listings", params.listingId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setListing(docSnap.data()); // Setăm listing după ce îl obținem din Firestore
      } else {
        console.log("Listing not found");
      }
    };

    fetchListing();
  }, [params.listingId]);

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
    <main>
      <button
        onClick={() => navigate(-1)}
        className="mt-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-2 px-4 rounded flex items-center w-full md:w-auto"
      >
        ← Back
      </button>
      <div className="w-full md:container mx-auto p-4 bg-gray-50 dark:bg-gray-900">
        {listing ? (
          <>
            {/* Secțiunea de utilizator */}
            <div className="flex items-center mb-4">
              <img
                src={userAvatar || "https://flowbite.com/docs/images/people/profile-picture-5.jpg"}
                alt="User Avatar"
                className="w-10 h-10 rounded-full mr-3"
              />
              <div className="text-gray-700 dark:text-gray-300">
                <p className="font-semibold">{userName || 'Anonim'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Posted by {userName || 'Anonim'}</p>
              </div>
            </div>

            {/* Titlul postării */}
            <h2 className="mb-4 text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-200">
              {listing.title}
            </h2>

            {/* Conținut media (Imagini) */}
            {listing.imgUrls?.length > 0 && (
              <Swiper
                slidesPerView={1}
                pagination={{ type: "progressbar" }}
                navigation={true}
                zoom
                className="max-w-3xl"
              >
                {listing.imgUrls.map((url, index) => (
                  <SwiperSlide key={index}>
                    <div className="swiper-zoom-container flex justify-center items-center">
                      <img
                        src={url}
                        className="object-contain max-h-full w-full swiper-zoom-target rounded-lg"
                        alt={`Slide ${index}`}
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
<br />
            {/* Detalii suplimentare */}
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
              <ul className="max-w-md space-y-1 text-base md:text-lg text-zinc-500 dark:text-gray-300">
                <li>Peste: {listing.name}</li>
                <li>Inaltime si greutate: {listing.length}, {listing.weight}</li>
              </ul>
            </div>

            {/* Descriere */}
            {listing.description ? (
              <div className="bg-white dark:bg-gray-800 p-4 mt-4 rounded-md">
                <p className="text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: listing.description }} />
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 p-4 mt-4 rounded-md flex items-center space-x-2 text-red-600 dark:text-red-400">
                <RiErrorWarningFill />
                <span>No description found</span>
              </div>
            )}

            {/* Harta */}
            {listing.latitude && listing.longitude && (
              <div className="mt-6">
                <Map position={[listing.latitude, listing.longitude]} draggable={false} />
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
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
          </div>
        )}
      </div>
      <div id='comments'>
        <Comments />
      </div>
    </main>
  );
}

export default Listing;
