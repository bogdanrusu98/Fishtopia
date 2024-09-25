import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../hooks/userContext';
import { toast } from 'react-toastify';

const PrivateRoute = ({ children }) => {
  const user = useUser();

  if (!user) {
    toast.error('You have to be logged in to access this page')
    return (
    <Navigate to="/login" />
    )
  }
 

  return children;
};

export default PrivateRoute;
