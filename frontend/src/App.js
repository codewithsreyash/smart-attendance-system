import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import FaceAuth from "./components/FaceAuth";
import React from 'react';

const App = () => (
  <Routes>
    <Route path="/" element={<Login />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/face-auth" element={<FaceAuth />} />
  </Routes>
);

export default App; 