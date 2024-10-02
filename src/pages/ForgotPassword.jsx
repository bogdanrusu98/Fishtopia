import {useState} from 'react'
import {Link} from 'react-router-dom'
import {getAuth, sendPasswordResetEmail} from 'firebase/auth'
import {toast} from 'react-toastify'
import {ReactComponent as ArrowRightIcon} from '../assets/svg/keyboardArrowRightIcon.svg'

function ForgotPassword() {
    const [email, setEmail] = useState('')
  
    const onChange = (e) => {
      setEmail(e.target.value)
    }
  
    const onSubmit = async (e) => {
      e.preventDefault()
      try {
        const auth = getAuth()
        await sendPasswordResetEmail(auth, email)
        toast.success('Email was sent')
        
      } catch (error) {
        toast.error('Could not send reset email')
      }
    }


return (
        <div>
    <header>
        <p className='text-4xl text-center'>Forgot Password</p>
    </header>

<main className='mt-10 sm:mx-auto sm:w-full sm:max-w-sm'>
<form onSubmit={onSubmit} className='space-y-6 '>
  <input 
  type="email" 
  className="mt-4 block w-full rounded-md border-0 py-1.5  shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
  placeholder='Email' 
  id='email' 
  value={email} 
  onChange={onChange} 
  />
  <Link className="font-semibold text-indigo-600 hover:text-indigo-500" to='/login'>
    Sign In  
  </Link>
<div className="signInBar">
  <button className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
  >
    <ArrowRightIcon fill='#ffffff' width='34px' height='34px' />
  </button>
</div>
</form>
</main>
</div>
)}

export default ForgotPassword
