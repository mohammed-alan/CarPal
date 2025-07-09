// src/App.jsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

import MainPage from './MainPage';
import Dashboard from './Dashboard';

export default function PageRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<MainPage/>} />
      </Routes>
    </BrowserRouter>
  );
}
