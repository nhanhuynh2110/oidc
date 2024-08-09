import React, { useEffect } from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import { handleCallback, login } from './authService';

const Home = () => {
  const handleLogin = () => {
    login();
  };

  return (
    <div>
      <h1>Home Page</h1>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

const Callback = () => {
  useEffect(() => {
    handleCallback();
  }, []);

  return <div>Loading...</div>;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
