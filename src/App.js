import {BrowserRouter as Router, Route, Routes} from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useEffect } from 'react';
import { initFlowbite } from 'flowbite';
import Navbar from './components/layout/Navbar';
import PropTypes from 'prop-types'
import Home from './pages/Home';
import { useDarkMode } from './hooks/DarkModeToggle';
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
import { UserProvider } from './hooks/userContext';
import User from './pages/User';
import Inbox from './pages/Inbox';

function App() {
  const [darkMode, setDarkMode] = useDarkMode(); // Folosește hook-ul pentru a gestiona tema

  
  return (
    
    <>
    <Router>
      <UserProvider>
      <Navbar />
      
      <div className={`container mx-auto px-3 pb-12 ${darkMode ? 'dark' : ''}`}>
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
            <Route path='/listing/:listingId' element={
              <PrivateRoute>
              <Listing />
              </PrivateRoute>
              } />
          <Route path='/profile' element={
            <PrivateRoute>
            <Profile />
            </PrivateRoute>} />

            <Route path='/user/:uid' element={<User />} />
            <Route path='/inbox' element={<Inbox />} />



        </Routes>
      </div>
      
      <Footer />
      </UserProvider>
    </Router>
    <ToastContainer />
    </>
  );
  
}

export default App;
