import { useState, useEffect, useRef } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL
} from 'firebase/storage'
import {db} from '../firebase.config'
import {toast} from 'react-toastify'
import {v4 as uuidv4} from 'uuid'
import {addDoc, collection, serverTimestamp} from 'firebase/firestore'
import { Editor } from '@tinymce/tinymce-react';
import axios from 'axios';
import Map from '../components/Map';

function CreateListing() {
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [position, setPosition] = useState([45.9432, 24.9668]);
  const [markerPosition, setMarkerPosition] = useState('')

  // eslint-disable-next-line
  const [geolocationEnabled, setGeolocationEnabled] = useState(true);
  const editorRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    country: '',
    images: {},
    length: '',
    risk: '',
    description: '',
    weight: '',
    latitude: '',
    longitude: ''
  });

  const {
    name,
    country,
    images,
    length,
    risk,
    weight,
    description,
    latitude, 
    longitude
  } = formData;

  const [loading, setLoading] = useState(false);

  const auth = getAuth();
  const navigate = useNavigate();
  const isMounted = useRef(true);

  useEffect(() => {
    if (isMounted) {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          setFormData({ ...formData, userRef: user.uid });
        } else {
          navigate("/login");
        }
      });
    }

    return () => {
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);


  const handleAddressChange = async (e) => {
    setAddress(e.target.value);
    if (e.target.value.length > 2) {
      try {
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/search?format=json&q=${e.target.value}`
        );
        setSuggestions(response.data);
      } catch (error) {
        console.error("Eroare la obținerea sugestiilor: ", error);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (lat, lon, displayName) => {
    setPosition([parseFloat(lat), parseFloat(lon)]); // Actualizează poziția pe hartă
    setAddress(displayName); // Setează adresa selectată în input
    setFormData((prevState) => ({
      ...prevState,
      latitude: lat,
      longitude: lon
    }));
    setSuggestions([]); // Golește sugestiile
  };
  
  const handleDragEnd = (e) => {
    const newLatLng = e.target.getLatLng();
    setMarkerPosition([newLatLng.lat, newLatLng.lng]);
    setPosition([newLatLng.lat, newLatLng.lng]);
    setFormData((prevState) => ({
      ...prevState,
      latitude: newLatLng.lat,
      longitude: newLatLng.lng,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();


    if(images.length > 6) {
      setLoading(false)
      toast.error('Max 6 images')
      return
    }

    // Store images in firebase
    const storeImage = async (image) => {
      return new Promise((resolve, reject) => {
        const storage = getStorage()
        const fileName = `${auth.currentUser.uid}-${image.name}-${uuidv4()}`

        const storageRef = ref(storage, 'images/' + fileName)

        const uploadTask = uploadBytesResumable(storageRef, image)

        uploadTask.on('state_changed',
          (snapshot) => {
            // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
            switch (snapshot.state) {
              case 'paused':
                console.log('Upload is paused');
                break;
              case 'running':
                console.log('Upload is running');
                break;
                default: 
                break
            }
          }, 
          (error) => {
            reject(error)
            // A full list of error codes is available at
            // https://firebase.google.com/docs/storage/web/handle-errors
            switch (error.code) {
              case 'storage/unauthorized':
                // User doesn't have permission to access the object
                break;
              case 'storage/canceled':
                // User canceled the upload
                break;
        
              // ...
        
              case 'storage/unknown':
                // Unknown error occurred, inspect error.serverResponse
                break;
                default:
                  break
            }
          }, 
          () => {
            // Upload completed successfully, now we can get the download URL
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              resolve(downloadURL);
            });
          }
        );
      })
    }

    const imgUrls = await Promise.all(
      [...images].map((image) => storeImage(image))
    ).catch(() => {
      setLoading(false)
      toast.error('Images not uploaded')
      return
    })

    const formDataCopy = {
      ...formData,
      imgUrls,
      timestamp: serverTimestamp(),
    }

    delete formDataCopy.images
    const docRef = await addDoc(collection(db, 'listings'), formDataCopy)

    setLoading(false)
    toast.success('Listing saved')
    console.log(formDataCopy.type, docRef.id);
    navigate(`/`);
  };

  const onMutate = (e) => {
    let boolean = null

    if(e.target.value === 'true') {
      boolean = true
    }

    if(e.target.value === 'false') {
      boolean = false
    }

    // Files
    if(e.target.files) {
      setFormData((prevState) => ({
        ...prevState,
        images: e.target.files
      }))
    }

    // Text/Booleans/Number
    if(!e.target.files) {
      setFormData((prevState) => ({
        ...prevState,
        [e.target.id]: boolean ?? e.target.value
      }))
    }
  };

  if (loading) {
    return 'Loading...';
  }
  
  

  return (
    <div className="profile">
      <header>
        <p className="text-2xl font-bold">Create a Listing</p>
      </header>

      <main>
      <form className="max-w-lg mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg" onSubmit={onSubmit}>
  <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center">Create a Fish Listing</h2>

  <div className="mb-4">
    <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">Fish Name</label>
    <input
      type="text"
      id="name"
      value={name}
      onChange={onMutate}
      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
      required
    />
  </div>

  <div className="mb-4">
    <label htmlFor="country" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">Country</label>
    <input
      type="text"
      id="country"
      value={country}
      onChange={onMutate}
      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
      required
    />
  </div>

  <div className="mb-4">
    <label htmlFor="risk" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">Risk Level</label>
    <input
      type="text"
      id="risk"
      value={risk}
      onChange={onMutate}
      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
      required
    />
  </div>

  <div className="mb-4">
    <label htmlFor="length" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">Length (cm)</label>
    <input
      type="text"
      id="length"
      value={length}
      onChange={onMutate}
      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
      required
    />
  </div>

  <div className="mb-4">
    <label htmlFor="weight" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">Weight (kg)</label>
    <input
      type="text"
      id="weight"
      value={weight}
      onChange={onMutate}
      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
      required
    />
  </div>

  <div className="mb-4">
  <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">Description</label>
  <Editor
    apiKey="dphia909nnnrxny7iltrwnyxx7u62ht0wdo9hmviei90lkt7"
    onInit={(_evt, editor) => editorRef.current = editor}
    initialValue="<p>This is the initial content of the editor.</p>"
    init={{
      height: 500,
      menubar: false,
      plugins: [
        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
        'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
      ],
      toolbar: 'undo redo | blocks | ' +
        'bold italic forecolor | alignleft aligncenter ' +
        'alignright alignjustify | bullist numlist outdent indent | ' +
        'removeformat | help',
      content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
    }}
    value={description}
    onEditorChange={(content) => setFormData((prevState) => ({
      ...prevState,
      description: content
    }))}
  />
        </div>

        <div className="mb-4">
  <label htmlFor="address" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">
    Address
  </label>
  <input
    type="text"
    value={address}
    onChange={handleAddressChange}
    placeholder="Introduceți adresa"
    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
  />
  <ul style={{ listStyle: 'none', padding: 0 }}>
    {suggestions.map((suggestion, index) => (
      <li
        key={index}
        onClick={() => handleSuggestionClick(suggestion.lat, suggestion.lon, suggestion.display_name)}
        style={{ cursor: 'pointer', padding: '5px', borderBottom: '1px solid #ccc' }}
      >
        {suggestion.display_name}
      </li>
    ))}
  </ul>

  <Map position={position} setPosition={setPosition} />
</div>

  <div className="mb-6">
    <label htmlFor="images" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">Upload Image</label>
    <input
      type="file"
      id="images"
      onChange={onMutate}
      max='6'
      accept=".jpg, .png, .jpeg, .JPG, .PNG"
      multiple
      className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
      required
    />
    <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">The first image will be the cover (max 6).</p>
  </div>

  <button
    type="submit"
    className="w-full text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900 transition ease-in-out duration-150"
  >
    Create Listing
  </button>

</form>

      </main>
    </div>
  );
}

export default CreateListing;
