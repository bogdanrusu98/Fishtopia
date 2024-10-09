import { useState, useEffect, useRef } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL
} from 'firebase/storage';
import { db } from '../firebase.config';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Editor } from '@tinymce/tinymce-react';
import axios from 'axios';
import Map from '../components/Map';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import {useUser} from '../hooks/userContext'

function CreateListing() {
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [position, setPosition] = useState([45.9432, 24.9668]);
  const [markerPosition, setMarkerPosition] = useState('');
  const editorRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const auth = getAuth();
  const navigate = useNavigate();
  const isMounted = useRef(true);
  const user = useUser()

  // Schema de validare cu Yup
  const listingValidationSchema = Yup.object({
    title: Yup.string().required('Title is required'),
    name: Yup.string().required('Fish name is required'),
    length: Yup.number().positive('Length must be a positive number').required('Length is required'),
    weight: Yup.number().positive('Weight must be a positive number').required('Weight is required'),
    description: Yup.string().required('Description is required'),
    images: Yup.array()
      .min(1, 'You must upload at least one image') // Checks that at least one image is uploaded
      .max(6, 'Max 6 images')
      .required('Images are required'),
  });
  
  

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
  }, [auth, navigate]);

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
    setPosition([parseFloat(lat), parseFloat(lon)]);
    setAddress(displayName);
  };

  const handleDragEnd = (e) => {
    const newLatLng = e.target.getLatLng();
    setMarkerPosition([newLatLng.lat, newLatLng.lng]);
    setPosition([newLatLng.lat, newLatLng.lng]);
  };

  const storeImage = async (image) => {
    return new Promise((resolve, reject) => {
      const storage = getStorage();
      const fileName = `${auth.currentUser.uid}-${image.name}-${uuidv4()}`;

      const storageRef = ref(storage, 'images/' + fileName);

      const uploadTask = uploadBytesResumable(storageRef, image);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
        },
        (error) => {
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve(downloadURL);
          });
        }
      );
    });
  };

  const onSubmit = async (values) => {
    setLoading(true);
    const { name, title, length, weight, description, address, images } = values;
  
    const formDataCopy = {
      ...values,
      timestamp: serverTimestamp(),
      latitude: position[0],
      longitude: position[1],
      userRef: user.uid
    };
  
    try {
      // Încărcăm imaginile în Firebase Storage și obținem URL-urile lor
      const imgUrls = await Promise.all(
        images.map((image) => storeImage(image)) // Încărcăm fiecare imagine și obținem URL-ul ei
      );
  
      formDataCopy.imgUrls = imgUrls; // Adaugă URL-urile imaginilor la datele care vor fi salvate
  
      // Înlăturăm obiectul `images` înainte de a salva în Firestore
      delete formDataCopy.images;
  
      // Salvăm datele în Firestore
      const docRef = await addDoc(collection(db, 'listings'), formDataCopy);
      console.log('Listing ID: ', docRef.id);
      toast.success('Listing saved');
      navigate(`/`);
    } catch (error) {
      setLoading(false);
      console.error('Eroare la salvarea listing-ului: ', error);
      toast.error('Eroare la salvarea listing-ului');
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="profile">
      <main>
        <Formik
          initialValues={{
            title: '',
            name: '',
            length: '',
            weight: '',
            description: '',
            address: '',
            images: []
          }}
          validationSchema={listingValidationSchema}
          onSubmit={onSubmit}
        >
          {({ setFieldValue }) => (
            <Form className="max-w-lg mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center">Create a Fish Listing</h2>

              <div className="mb-4">
                <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">Title</label>
                <Field name="title" type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
                <ErrorMessage name="title" component="div" className="text-red-500 text-sm" />
              </div>

              <div className="mb-4">
                <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">Fish Name</label>
                <Field name="name" type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
                <ErrorMessage name="name" component="div" className="text-red-500 text-sm" />
              </div>

              <div className="mb-4">
                <label htmlFor="length" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">Length (cm)</label>
                <Field name="length" type="number" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
                <ErrorMessage name="length" component="div" className="text-red-500 text-sm" />
              </div>

              <div className="mb-4">
                <label htmlFor="weight" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">Weight (kg)</label>
                <Field name="weight" type="number" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
                <ErrorMessage name="weight" component="div" className="text-red-500 text-sm" />
              </div>

              <div className="mb-4">
                <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">Description</label>
                <Editor
                  apiKey={process.env.REACT_APP_TINY_PUBLIC_API}
                  onInit={(evt, editor) => editorRef.current = editor}
                  initialValue=""
                  init={{
                    height: 250,
                    menubar: false,
                    plugins: [
                      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                      'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                    ],
                    toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                  }}
                  onEditorChange={(content) => setFieldValue('description', content)}
                />
                <ErrorMessage name="description" component="div" className="text-red-500 text-sm" />
              </div>

              <div className="mb-4">
                <label htmlFor="address" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">Address</label>
                <Field name="address" type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
                <ErrorMessage name="address" component="div" className="text-red-500 text-sm" />
              </div>

              <div className="mb-4">
                <Map position={position} setPosition={setPosition} handleDragEnd={handleDragEnd} />
              </div>

              <div className="mb-6">
                <label htmlFor="images" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">Upload Image</label>
                <input
                  type="file"
                  id="images"
                  name="images"
                  accept=".jpg, .png, .jpeg, .JPG, .PNG"
                  multiple
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                  onChange={(event) => {
                    const files = Array.from(event.currentTarget.files); // Convertim FileList în array
                    setFieldValue('images', files); // Setăm fișierele ca un array
                  }}
                />
                <ErrorMessage name="images" component="div" className="text-red-500 text-sm" />
              </div>

              <button
                type="submit"
                className="w-full text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900 transition ease-in-out duration-150"
              >
                Create Listing
              </button>
            </Form>
          )}
        </Formik>
      </main>
    </div>
  );
}

export default CreateListing;
