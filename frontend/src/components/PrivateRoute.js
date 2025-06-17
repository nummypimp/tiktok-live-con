// src/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const user = sessionStorage.getItem("user");
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default PrivateRoute;
