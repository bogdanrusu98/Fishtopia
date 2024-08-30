import {Link} from 'react-router-dom'
import PropTypes from 'prop-types'
import { IoFishSharp } from "react-icons/io5";
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { useState, useEffect } from 'react';
import {toast} from 'react-toastify'


function Navbar({title}) {
  const [loggedIn, setLoggedIn] = useState(false);

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
  };

  return (
    <nav className='navbar mb-12 shadow-lg bg-neutral text-neutral-content'>
        <div className='container mx-auto'>
            <div className='flex-none px-2 mx-2'>
                <IoFishSharp className='inline pr-2 text-3xl' />
                <Link  to='/' className='text-lg font-bold align-middle'>
                {title}
                </Link>
            </div>

            <div className='flex-1 px-2 mx-2'>
                <div className="flex justify-end">
                    <Link to='/' className='btn btn-ghost btn-sm rounded-btn'>Home</Link>
                    <Link to='/about' className='btn btn-ghost btn-sm rounded-btn'>About</Link>

                    {loggedIn ? (
        <>
          <Link to='/create-listing' className='btn btn-primary btn-sm rounded-btn'>Create Listing</Link>
          
          <button onClick={handleLogout} className='btn btn-secondary btn-sm rounded-btn'>Logout</button>
        </>
      ) : (
        <>
          <Link to='/login' className='btn btn-secondary btn-sm rounded-btn'>Login</Link>
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
