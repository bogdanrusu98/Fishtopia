import {Link, useNavigate} from 'react-router-dom'
import PropTypes from 'prop-types'
import { IoFishSharp } from "react-icons/io5";
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { useState, useEffect } from 'react';
import {toast} from 'react-toastify'
import { Avatar, Dropdown } from "flowbite-react";
import { useUser } from '../../hooks/userContext';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useDarkMode } from '../../hooks/DarkModeToggle';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase.config'


function Navbar({title}) {
  const [darkMode, setDarkMode] = useDarkMode(); // Preluăm darkMode și funcția de toggle
  const [loggedIn, setLoggedIn] = useState(false);
  const user = useUser()
  const navigate = useNavigate()
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoggedIn(true);
      } else {
        setLoggedIn(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    toast.success('Logged out')
    navigate('/')
  };

  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
    // Forțează refresh-ul paginii pentru a aplica tema
    window.location.reload();
  };


  // Funcția pentru a prelua numărul de notificări necitite
  const fetchUnreadNotifications = async () => {
    if (!user) return; // Dacă nu există utilizator conectat, ieși din funcție

    const q = query(
      collection(db, 'inboxes'),
      where('userRef', '==', user.uid),
      where('isRead', '==', false) // Preia doar notificările necitite
    );

    const querySnapshot = await getDocs(q);
    setUnreadNotifications(querySnapshot.size); // Setează numărul de notificări necitite
  };

  // Folosește `useEffect` pentru a apela `fetchUnreadNotifications` la montarea componentului
  useEffect(() => {
    if (user) {
      fetchUnreadNotifications();
    }
  }, [user]);
  
  return (
    <nav className='navbar mb-12 shadow-lg bg-neutral text-neutral-content'>
    <div className='container mx-auto'>
      <div className='flex-none px-2 mx-2'>
        <IoFishSharp className='inline pr-2 text-3xl' />
        <Link to='/' className='text-lg font-bold align-middle'>
          {title}
        </Link>
      </div>
  
      <div className='flex-1 px-2 mx-2'>
        <div className="flex justify-end items-center space-x-4">
          {loggedIn ? (
            <>
              {/* Butonul de toggle Dark Mode */}
              <button
              onClick={handleThemeToggle}
              className={`btn btn-sm rounded-btn transition duration-500 ease-in-out shadow-md focus:outline-none ${
                darkMode ? 'bg-gray-800 text-yellow-300' : 'bg-gray-200 text-gray-800'
              }`}
            >
              {darkMode ? <FaSun className="text-lg" /> : <FaMoon className="text-lg" />}
            </button>
            
              <Link to='/create-listing' className='btn btn-primary btn-sm rounded-btn'>+</Link>
  
              {user ? (
        <Dropdown
          arrowIcon={false}
          inline={true}
          label={
            <div className="relative">
              <Avatar
                alt="User settings"
                img={user.photoURL ? user.photoURL : 'https://flowbite.com/docs/images/people/profile-picture-5.jpg'}
                rounded={true}
              />
              {/* Afișează badge-ul doar dacă există notificări necitite */}
              {unreadNotifications > 0 && (
                <div className="absolute inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 border-2 border-white rounded-full -top-1 -right-2 dark:border-gray-900">
                  {unreadNotifications}
                </div>
              )}
            </div>
          }
        >
          <Dropdown.Header>
            <span className="block text-sm">{user.displayName}</span>
            <span className="block truncate text-sm font-medium">{user.email}</span>
          </Dropdown.Header>
          <Dropdown.Item>
            <Link to="/profile">Settings</Link>
          </Dropdown.Item>
          <Dropdown.Item>
            <Link to="/inbox">Inbox</Link>
          </Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item onClick={handleLogout}>Sign out</Dropdown.Item>
        </Dropdown>
      ) : (
        <>
          <Link to="/login" className="btn btn-secondary btn-sm rounded-btn">Login</Link>
          &nbsp;
          <Link to="/register" className="btn btn-primary btn-sm rounded-btn">Sign Up</Link>
        </>
      )}
            </>
          ) : (
            <>
              <Link to='/login' className='btn btn-secondary btn-sm rounded-btn'>Login</Link>
              &nbsp;
              <Link to='/register' className='btn btn-primary btn-sm rounded-btn'>Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </div>
  </nav>
  
  )
}

Navbar.defaultProps = {
  title: 'FishTopia',
  
}

Navbar.propTypes = {
  title: PropTypes.string,
}

export default Navbar
