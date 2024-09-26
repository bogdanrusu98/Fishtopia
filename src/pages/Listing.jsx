import { Swiper, SwiperSlide } from "swiper/react";
import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Navigation, Pagination, Scrollbar, A11y, Zoom } from "swiper/modules";
import SwiperCore from "swiper";
import "swiper/css";
import "swiper/css/virtual";
import { db } from "../firebase.config";
import { getDoc, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { RiErrorWarningFill } from "react-icons/ri";
import Comments from "../components/Comments";
import { useUser } from '../hooks/userContext';
import Map from "../components/Map";
import axios from 'axios';

SwiperCore.use([Navigation, Pagination, Zoom]);

function Listing() {
  const [listing, setListing] = useState(null);
  const [userName, setUserName] = useState(null);
  const user = useUser()
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
  
    fetchListing(); // Obține listing-ul
  }, [params.listingId]); // Se declanșează când listingId se schimbă
  
  useEffect(() => {
    const fetchUserName = async () => {
      if (!listing || !listing.userRef) {
        console.log("Listing or userRef is null/undefined");
        return; // Oprește execuția dacă listing sau userRef nu sunt definite
      }
  
      // Creăm referința directă la documentul utilizatorului
      const userDocRef = doc(db, "users", listing.userRef);
  
      try {
        const userDocSnap = await getDoc(userDocRef); // Obținem documentul specific
  
        if (userDocSnap.exists()) {
          setUserName(userDocSnap.data().name); // Setăm numele dacă documentul există
        } else {
          console.log("No matching user found");
        }
      } catch (error) {
        console.error("Error fetching user: ", error);
      }
    };
  
    if (listing) {
      fetchUserName(); // Apelăm fetchUserName doar când listing a fost setat
    }
  }, [listing]); // Efectul se declanșează când `listing` se schimbă
  
  return (
    <main>
      {listing ? (
        <>
                    <Swiper
            slidesPerView={1}
            pagination={{ type: "progressbar" }}
            touch={false}
            simulateTouch={false}
            navigation={true}
            zoom
            zoommaxratio={3}
            zoomminratio={1}
            className="w-auto"
          >
            {listing.imgUrls.map((url, index) => (

              <SwiperSlide key={index} className="w-auto h-auto">
                <div className="swiper-zoom-container flex justify-center items-center">
                  <img src={url} className="object-contain h-49 w-96 swiper-zoom-target" alt={`Slide ${index}`} />
                </div>
              </SwiperSlide>
            ))}

          </Swiper>

          <div className="listingDetails bg-gray-100	p-4 mt-4">
            {" "}
            <br />
            <h2 className="mb-2 text-4xl font-semibold text-gray-900 ">
              {listing.title}
            </h2>
            <ul className="max-w-md space-y-1 text-lg text-zinc-500 list-none list-inside dark:text-zinc-400">
              <li>Peste: {listing.name}</li>
              <li>
                Inaltime si greutate: {listing.length}, {listing.weight}
              </li>
              <li>
                Created by:
                <span className="text-black"> {userName}</span>
              </li>
            </ul>
            {auth.currentUser?.uid !== listing.userRef && (
              <Link
                to={`/contact/${listing.userRef}?listingName=${listing.name}`}
                className="primaryButton"
              ></Link>
            )}
          </div>

          {listing.description ? (
            <div className="border border-black bg-gray-200 rounded mt-4 p-4">
              <p dangerouslySetInnerHTML={{__html: listing.description}}/>
            </div>
          ) : (
            <>
              <h2 className="mb-2 text-2xl font-semibold text-gray-900 mt-4">
                Description
              </h2>
              <div className="border border-black bg-gray-200 rounded mt-4 p-4">
                <div className="flex items-center space-x-2 text-red-600">
                  <RiErrorWarningFill />
                  <span>No description found</span>
                </div>
              </div>
              
            </>
          )}
          {listing.latitude && listing.longitude ? (
            <>
            <br />
            <Map  position={[listing.latitude, listing.longitude]} draggable={false}/>
</>
          ) : ''}
        </>
      ) : (
        <p>Loading...</p>
      )}
  <br />
  <Comments />
    </main>
  );
}

export default Listing;
