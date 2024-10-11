import { Link, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { IoFishSharp } from "react-icons/io5";
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Avatar, Dropdown } from "flowbite-react";
import { useUser } from '../../hooks/userContext';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useDarkMode } from '../../hooks/DarkModeToggle';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase.config';

function Navbar({ title }) {

  const [darkMode, setDarkMode] = useDarkMode();
  const [loggedIn, setLoggedIn] = useState(false);
  const user = useUser();
  const navigate = useNavigate();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false); // Toggle for dropdown on mobile

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoggedIn(true);
      } else {
        setLoggedIn(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    navigate('/');
  };

  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
    window.location.reload();
  };

  const fetchUnreadNotifications = async () => {
    if (!user) return;

    const q = query(
      collection(db, 'inboxes'),
      where('userRef', '==', user.uid),
      where('isRead', '==', false)
    );

    const querySnapshot = await getDocs(q);
    setUnreadNotifications(querySnapshot.size);
  };

  useEffect(() => {
    if (user) {
      fetchUnreadNotifications();
    }
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      // Navighează la pagina de rezultate cu query-ul de căutare
      navigate(`/search?query=${searchQuery}`);
    }
  };

    // Trigger search on Enter key press
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        handleSearch(e);
      }
    };

  return (
    <nav className='navbar mb-12 shadow-lg bg-neutral text-neutral-content'>
      <div className='container mx-auto'>
        <div className='flex-none px-2 mx-2 flex items-center'>
          <IoFishSharp className='inline pr-2 text-3xl' />
          <Link to='/' className='text-lg font-bold align-middle'>
            {title}
          </Link>

            {/* Search Bar */}
            <div className="relative hidden md:block ml-4">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                </svg>
              </div>
              <input
                type="text"
                className="block w-full p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown} // Adaugă evenimentul pentru Enter
              />
            </div>
          
        </div>

        <div className='flex-1 px-2 mx-2'>
          <div className="flex justify-end items-center space-x-4">

            {/* Mobile Search Button */}
            <button
              type="button"
              className="md:hidden text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-2.5"
              onClick={() => setSearchDropdownOpen(!searchDropdownOpen)}
            >
              <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
              </svg>
              <span className="sr-only">Search</span>
            </button>

            {searchDropdownOpen && (
  <div className="absolute top-14 right-4 w-full max-w-sm md:hidden bg-gray-800 dark:bg-gray-900 rounded-lg p-4 shadow-lg">
    <form onSubmit={handleSearch}>
      <input
        type="text"
        className="block w-full p-2 ps-10 text-sm text-white border border-gray-300 rounded-lg bg-gray-700 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <button
        type="submit"
        className="mt-2 bg-blue-600 text-white py-2 px-4 rounded-lg w-full dark:bg-blue-700 dark:hover:bg-blue-800"
      >
        Search
      </button>
    </form>
  </div>
)}


            {loggedIn ? (
              <>
                {/* Dark Mode Toggle */}
                <button
                  onClick={handleThemeToggle}
                  className={`btn btn-sm rounded-btn transition duration-500 ease-in-out shadow-md focus:outline-none ${darkMode ? 'bg-gray-800 text-yellow-300' : 'bg-gray-200 text-gray-800'}`}
                >
                  {darkMode ? <FaSun className="text-lg" /> : <FaMoon className="text-lg" />}
                </button>

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
                ) : null}
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
  );
}

Navbar.defaultProps = {
  title: 'FishTopia',
};

Navbar.propTypes = {
  title: PropTypes.string,
};

export default Navbar;
