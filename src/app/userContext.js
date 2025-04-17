"use client"

import React, { createContext, useState, useContext } from 'react';

// Create the context
export const UserContext = createContext();

// User context provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    // name: '', 
    // email: '', 
    loggedIn: false,
  });

  const updateUser = (newUserData) => {
    setUser(prevState => ({ ...prevState, ...newUserData }));
  };

  return (
    <UserContext.Provider value={{ user, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};