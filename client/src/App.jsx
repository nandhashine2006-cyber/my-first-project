import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';

import Welcome from './pages/Welcome';
import LanguageSelect from './pages/LanguageSelect';
import HomeDashboard from './pages/HomeDashboard';
import PlantDoctor from './pages/PlantDoctor';
import Weather from './pages/Weather';
import MarketPrices from './pages/MarketPrices';
import SellProduct from './pages/SellProduct';
import Marketplace from './pages/Marketplace';
import ProductDetails from './pages/ProductDetails';
import AgricultureNews from './pages/AgricultureNews';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import SetupStatus from './pages/SetupStatus';

const App = () => {
  const location = useLocation();
  const isIntroPage = location.pathname === '/' || location.pathname === '/language-select';

  return (
    <div className="app-container">
      {!isIntroPage && <Navbar />}
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/language-select" element={<LanguageSelect />} />
        <Route path="/dashboard" element={<HomeDashboard />} />
        <Route path="/plant-doctor" element={<PlantDoctor />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/market-prices" element={<MarketPrices />} />
        <Route path="/sell-product" element={<SellProduct />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/marketplace/:id" element={<ProductDetails />} />
        <Route path="/news" element={<AgricultureNews />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/setup-status" element={<SetupStatus />} />
        <Route path="*" element={<HomeDashboard />} />
      </Routes>

    </div>
  );
};

export default App;
