import { Swiper, SwiperSlide } from "swiper/react";
import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Navigation, Pagination, Scrollbar, A11y } from "swiper/modules";
import SwiperCore from "swiper";
import "swiper/css";
import "swiper/css/virtual";
import { db } from "../firebase.config";
import { getDoc, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { RiErrorWarningFill } from "react-icons/ri";

import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from "react-zoom-pan-pinch";

SwiperCore.use([Navigation, Pagination, Scrollbar, A11y]);

function Listing() {
  const [listing, setListing] = useState(null);
  const [userName, setUserName] = useState(null);

  const navigate = useNavigate();
  const auth = getAuth();
  const params = useParams();

  useEffect(() => {
    const fetchListing = async () => {
      const docRef = doc(db, "listings", params.listingId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setListing(docSnap.data());
      }
    };

    const fetchUserName = async () => {
      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserName(userSnap.data().name);
        }
      }
    };

    fetchUserName();
    fetchListing();
  }, [navigate, params.listingId, auth.currentUser]);

  const Controls = () => {
    const { zoomIn, zoomOut, resetTransform } = useControls();
  };

  return (
    <main>
      {listing ? (
        <>
          <Swiper
            slidesPerView={"auto"}
            pagination={{
              type: "fraction",
            }}
            navigation={true}
          >
            {listing.imgUrls.map((url, index) => (
              <SwiperSlide key={index}>
                <TransformWrapper>
                  {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
                    <>
                      <Controls />
                      <TransformComponent>
                        <div className="flex justify-center items-center object-cover w-96 w-full ">
                          <img src={url} className="" alt={`Slide ${index}`} />
                        </div>
                      </TransformComponent>
                    </>
                  )}
                </TransformWrapper>
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="listingDetails bg-gray-100	p-4 mt-4">
            {" "}
            <br />
            <h2 class="mb-2 text-4xl font-semibold text-gray-900 ">
              {listing.name}
            </h2>
            <ul class="max-w-md space-y-1 text-lg text-zinc-500 list-none list-inside dark:text-zinc-400">
              <li>Risc de disparitie: {listing.risk}</li>
              <li>Tara: {listing.country}</li>
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
              {listing.description}
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
        </>
      ) : (
        <p>Loading...</p>
      )}
    </main>
  );
}

export default Listing;
