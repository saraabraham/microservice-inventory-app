import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, History, Menu, X } from 'lucide-react';

// Lazy load all route components to reduce initial bundle size
const Dashboard = lazy(() => import('./components/Dashboard'));
const ProductList = lazy(() => import('./components/ProductList'));
const ProductForm = lazy(() => import('./components/ProductForm'));
const TransactionHistory = lazy(() => import('./components/TransactionHistory'));
const ProductDetails = lazy(() => import('./components/ProductDetails'));
const ReorderSuggestions = lazy(() => import('./components/ReorderSuggestions'));

// Loading component for better UX
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ikea-blue"></div>
  </div>
);

// Mobile-responsive navigation component
const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path);

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/products', icon: Package, label: 'Products' },
    { path: '/transactions', icon: History, label: 'Transactions' },
    { path: '/reorder', icon: Package, label: 'Reorder' },
  ];

  return (
    <nav className="bg-ikea-blue text-white shadow-lg">
      <div className="container mx-auto px-4">
        {/* Desktop & Mobile Header */}
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <Package className="w-6 h-6 sm:w-8 sm:h-8" />
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">IKEA Inventory</h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-2 lg:space-x-4">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center px-3 py-2 rounded transition ${
                  isActive(path)
                    ? 'bg-white text-ikea-blue font-semibold'
                    : 'hover:bg-blue-700'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                <span className="hidden lg:inline">{label}</span>
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-blue-600"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  isActive(path)
                    ? 'bg-white text-ikea-blue font-semibold'
                    : 'hover:bg-blue-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {/* Mobile-Responsive Navigation */}
        <Navigation />

        {/* Main Content with Suspense boundary */}
        <main className="container mx-auto px-0 sm:px-4">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/products/new" element={<ProductForm />} />
              <Route path="/products/edit/:id" element={<ProductForm />} />
              <Route path="/transactions" element={<TransactionHistory />} />
              <Route path="/products/:id/details" element={<ProductDetails />} />
              <Route path="/reorder" element={<ReorderSuggestions />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </Router>
  );
}

export default App;
