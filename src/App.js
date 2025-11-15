
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AnnouncementBanner from './components/AnnouncementBanner';
import Footer from './components/Footer';
import Header from './components/Header';
import RequireAuth from './components/RequireAuth';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import Cart from './pages/Cart';
import Home from './pages/Home';
import Login from './pages/Login';
import Products from './pages/Products';
import Profile from './pages/Profile';
import Register from './pages/Register';
import './styles/brand.css';

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <BrowserRouter>
            <Header />
            <AnnouncementBanner />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
              <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
            <Footer />
          </BrowserRouter>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
