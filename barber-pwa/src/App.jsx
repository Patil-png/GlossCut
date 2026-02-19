import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import HomeScreen from './screens/HomeScreen';
import { AppointmentsScreen, ServicesScreen, ProfileScreen, LoginScreen } from './screens/Screens';
import './styles/global.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />

        <Route element={<Layout />}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/appointments" element={<AppointmentsScreen />} />
          <Route path="/services" element={<ServicesScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
