import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      // Simulate checking for stored session
      setIsLoading(false);
    };
    checkSession();
  }, []);

  const signIn = async (email, password) => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful login
      const mockUser = {
        id: '1',
        email,
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1985-06-15',
        phone: '+1 (555) 123-4567',
        medicalId: 'MED-2024-001'
      };
      
      setUser(mockUser);
      setIsLoading(false);
      return true;
    } catch (error) {
      setIsLoading(false);
      return false;
    }
  };

  const signInWithFace = async (recognizedUser) => {
    try {
      setIsLoading(true);
      // Simulate API call to verify face recognition result
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock successful face recognition login
      const mockUser = {
        id: '1',
        email: `${recognizedUser.toLowerCase()}@medtracker.com`,
        firstName: recognizedUser.split(' ')[0] || recognizedUser,
        lastName: recognizedUser.split(' ')[1] || '',
        dateOfBirth: '1985-06-15',
        phone: '+1 (555) 123-4567',
        medicalId: 'MED-2024-001'
      };
      
      setUser(mockUser);
      setIsLoading(false);
      return true;
    } catch (error) {
      setIsLoading(false);
      return false;
    }
  };

  const signUp = async (userData) => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful registration
      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        dateOfBirth: userData.dateOfBirth,
        phone: userData.phone,
        medicalId: `MED-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
      };
      
      setUser(newUser);
      setIsLoading(false);
      return true;
    } catch (error) {
      setIsLoading(false);
      return false;
    }
  };

  const signOut = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signInWithFace, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};