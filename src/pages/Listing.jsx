import { Swiper, SwiperSlide } from 'swiper/react';
import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Navigation, Pagination, Scrollbar, A11y} from 'swiper/modules';
import SwiperCore from 'swiper';
import 'swiper/css';
import 'swiper/css/virtual';
import { db } from '../firebase.config';
import { getDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from "react-zoom-pan-pinch";

SwiperCore.use([Navigation, Pagination, Scrollbar, A11y]);

function Listing() {
  const [listing, setListing] = useState(null);
  const [userName, setUserName] = useState(null)

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

    const fetchUserName = async () => {
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserName(userSnap.data().name);
        }
      }
    };

    fetchUserName()
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
  slidesPerView={'auto'}
  pagination={{
    type: 'fraction',
  }}
  navigation={true}
>
  {listing.imgUrls.map((url, index) => (

    
    <SwiperSlide key={index}>

<TransformWrapper
   
    >
      {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
        <>
          <Controls />
          <TransformComponent>

        <div className='flex justify-center items-center object-cover w-96 w-full'>
      <img src={url} className='' alt={`Slide ${index}`} />

      </div>
      </TransformComponent>
        </>
      )}
    </TransformWrapper>
    </SwiperSlide>
  ))}
</Swiper>



          <div className="listingDetails"> <br />
            
<h2 class="mb-2 text-4xl font-semibold text-gray-900 ">{listing.name}</h2>
<ul class="max-w-md space-y-1 text-lg text-gray-500 list-none list-inside dark:text-gray-400">
    <li>
        Risc de disparitie: {listing.risk}
    </li>
    <li>
        Tara: {listing.country}
    </li>
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
              >
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
