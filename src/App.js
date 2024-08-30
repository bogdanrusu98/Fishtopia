import {BrowserRouter as Router, Route, Routes} from 'react-router-dom'
import Navbar from './components/layout/Navbar';
import PropTypes from 'prop-types'
import Home from './pages/Home';
import About from './pages/About';
import Fish from './pages/Fish';
import Footer from './components/layout/Footer';
import NotFound from './pages/NotFound';
import FishResults from './components/fishes/FishResults';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import CreateListing from './pages/CreateListing';

function App() {
  return (
    <Router>
      <Navbar />
      
      <main className='container mx-auto px-3 pb-12'>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/fish/:login" element={<Fish />} />
            <Route path="/notfound" element={<NotFound />} />
            <Route path="/*" element={<NotFound />} />
            <Route path='/login' element={<SignIn />} />
            <Route path='/register' element={<SignUp />} />
            <Route path='/create-listing' element={<CreateListing />} />
        </Routes>
      </main>
      
      <Footer />
    </Router>


    
  );
}

export default App;
