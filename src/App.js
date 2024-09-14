import {BrowserRouter as Router, Route, Routes} from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/layout/Navbar';
import PropTypes from 'prop-types'
import Home from './pages/Home';
import About from './pages/About';
import Footer from './components/layout/Footer';
import NotFound from './pages/NotFound';
import FishResults from './components/fishes/FishResults';
import SignIn from './pages/SignIn';
import Listing from './pages/Listing';
import SignUp from './pages/SignUp';
import EditListing from './pages/EditListing';
import CreateListing from './pages/CreateListing';
import Profile from './pages/Profile';
import PrivateRoute from './components/PrivateRoute';
import ForgotPassword from './pages/ForgotPassword';
import { Editor } from '@tinymce/tinymce-react';


function App() {
  return (
    
    <>
    <Router>
      <Navbar />
      
      <main className='container mx-auto px-3 pb-12'>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/notfound" element={<NotFound />} />
            <Route path="/*" element={<NotFound />} />
            <Route path='/login' element={<SignIn />} />
          <Route path='/forgot-password' element={<ForgotPassword />} />
            <Route path='/register' element={<SignUp />} />
            <Route path='/create-listing' element={<CreateListing />} />
            <Route path='/edit-listing/:listingId' element={<EditListing />} />
            <Route path='/listing/:listingId' element={<Listing />} />
            <Route path='/profile' element={<PrivateRoute />}>
          <Route path='/profile' element={<Profile />} />

        </Route>
        </Routes>
      </main>
      
      <Footer />
    </Router>
    <ToastContainer />

    </>
  );
  
}

export default App;
