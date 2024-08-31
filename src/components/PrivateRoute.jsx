import {Navigate, Outlet} from 'react-router-dom'
import { useAuthStatus } from '../hooks/useAuthStatus'



function PrivateRoute() {
    const {loggedIn, checkingStatus} = useAuthStatus()

    if(checkingStatus) {
        return 'Loading'
    }

 }
 
 export default PrivateRoute
 