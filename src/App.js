
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AnnouncementBanner from './components/AnnouncementBanner';
import Footer from './components/Footer';
import Header from './components/Header';
import { CartProvider } from './context/CartContext';
import { StoreProvider } from './context/StoreContext';
import { ToastProvider } from './context/ToastContext';
import Cart from './pages/Cart';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Products from './pages/Products';
import Track from './pages/Track';
import './styles/brand.css';

const App = () => {
  return (
    <StoreProvider>
      <CartProvider>
        <ToastProvider>
          <BrowserRouter>
            <Header />
            <AnnouncementBanner />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/track" element={<Track />} />
              <Route path="/track/:orderNumber" element={<Track />} />
            </Routes>
            <Footer />
          </BrowserRouter>
        </ToastProvider>
      </CartProvider>
    </StoreProvider>
  );
}

export default App;
