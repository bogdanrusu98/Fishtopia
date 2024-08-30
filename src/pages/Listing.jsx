import { Swiper, SwiperSlide } from 'swiper/react';
import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Navigation, Pagination, Scrollbar, A11y, Zoom } from 'swiper/modules';
import SwiperCore from 'swiper';
import 'swiper/css';
import 'swiper/css/virtual';
import { db } from '../firebase.config';
import { getDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from "react-zoom-pan-pinch";

SwiperCore.use([Navigation, Pagination, Scrollbar, A11y]);

function Listing() {
  const [listing, setListing] = useState(null);

  const navigate = useNavigate();
  const auth = getAuth();
  const params = useParams();

  useEffect(() => {
    const fetchListing = async () => {
      const docRef = doc(db, 'listings', params.listingId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setListing(docSnap.data());
      }
    };

    fetchListing();
  }, [navigate, params.listingId]);

  const Controls = () => {
    const { zoomIn, zoomOut, resetTransform } = useControls();

  };
  

  return (
    <main>
      {listing ? (
        <>
          <Swiper
  slidesPerView={'auto'}
  pagination={{ clickable: true }}
  navigation
  scrollbar={{ draggable: true }}
>
  {listing.imgUrls.map((url, index) => (

    
    <SwiperSlide key={index}>

<TransformWrapper
   
    >
      {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
        <>
          <Controls />
          <TransformComponent>

        <div className='flex justify-center items-center'>
      <img src={url} className='object-cover h-96 w-full' alt={`Slide ${index}`} />

      </div>
      </TransformComponent>
        </>
      )}
    </TransformWrapper>
    </SwiperSlide>
  ))}
</Swiper>



          <div className="listingDetails"> <br />
            
<h2 class="mb-2 text-lg font-semibold text-gray-900 ">{listing.name}</h2>
<ul class="max-w-md space-y-1 text-gray-500 list-none list-inside dark:text-gray-400">
    <li>
        Risc de disparitie: {listing.risk}
    </li>
    <li>
        Tara: {listing.country}
    </li>
    <li>
        Intaltime si greutate: {listing.length}, {listing.weight}
    </li>
    <li>
      Created by: {listing.userRef}
    </li>
</ul>


            {auth.currentUser?.uid !== listing.userRef && (
              <Link
                to={`/contact/${listing.userRef}?listingName=${listing.name}`}
                className="primaryButton"
              >
                Contact Landlord
              </Link>
            )}
          </div>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </main>
  );
}

export default Listing;
