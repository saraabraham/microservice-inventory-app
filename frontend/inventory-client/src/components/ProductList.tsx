import React, { useEffect, useState } from 'react';
import { Product, productService } from '../services/api';
import { Plus, Edit, Trash2, Search, Upload, Download, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BulkImport from './BulkImport';

const ProductImage: React.FC<{ src?: string; alt: string }> = ({ src, alt }) => {
    const [imageSrc, setImageSrc] = useState(src || 'https://via.placeholder.com/40/0051BA/FFFFFF?text=No+Img');
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (src && !hasError) {
            setImageSrc(src);
        }
    }, [src, hasError]);

    const handleError = () => {
        if (!hasError) {
            setHasError(true);
            setImageSrc('https://via.placeholder.com/40/0051BA/FFFFFF?text=No+Img');
        }
    };

    return (
        <img
            src={imageSrc}
            alt={alt}
            className="w-10 h-10 rounded object-cover mr-3 bg-gray-100"
            loading="lazy"
            onError={handleError}
        />
    );
};

const ProductList: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [filters, setFilters] = useState({
        category: '',
        priceMin: '',
        priceMax: '',
        stockStatus: 'all'
    });
    const [showImport, setShowImport] = useState(false);

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        let filtered = products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Apply category filter
        if (filters.category) {
            filtered = filtered.filter(p => p.category === filters.category);
        }

        // Apply price filters
        if (filters.priceMin) {
            filtered = filtered.filter(p => p.price >= parseFloat(filters.priceMin));
        }
        if (filters.priceMax) {
            filtered = filtered.filter(p => p.price <= parseFloat(filters.priceMax));
        }

        // Apply stock status filter
        if (filters.stockStatus !== 'all') {
            filtered = filtered.filter(p => {
                switch (filters.stockStatus) {
                    case 'low':
                        return p.isLowStock;
                    case 'in-stock':
                        return p.stockQuantity > p.minimumStock;
                    case 'out-of-stock':
                        return p.stockQuantity === 0;
                    default:
                        return true;
                }
            });
        }

        setFilteredProducts(filtered);
    }, [searchTerm, products, filters]);

    const loadProducts = async () => {
        try {
            const response = await productService.getAll();
            setProducts(response.data);
            setFilteredProducts(response.data);
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await productService.delete(id);
                loadProducts();
            } catch (error) {
                console.error('Error deleting product:', error);
            }
        }
    };

    const handleStockAdjustment = async (id: number, change: number) => {
        try {
            await productService.updateStock(id, change);
            loadProducts();
        } catch (error) {
            console.error('Error updating stock:', error);
        }
    };

    const handleExport = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/products/export`,{
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `inventory-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting:', error);
            alert('Failed to export data');
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    return (
        <div className="p-4 sm:p-6">
            {/* Header with Buttons - Mobile Responsive */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-ikea-blue">Products</h1>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                        onClick={() => setShowImport(!showImport)}
                        className="bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center text-sm sm:text-base"
                    >
                        <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Import CSV
                    </button>
                    <button
                        onClick={handleExport}
                        className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center text-sm sm:text-base"
                    >
                        <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Export CSV
                    </button>
                    <button
                        onClick={() => navigate('/products/new')}
                        className="bg-ikea-blue text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center text-sm sm:text-base"
                    >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Add Product
                    </button>
                </div>
            </div>

            {/* Bulk Import Component */}
            {showImport && (
                <div className="mb-6">
                    <BulkImport onComplete={() => {
                        loadProducts();
                        setShowImport(false);
                    }} />
                </div>
            )}

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ikea-blue focus:border-transparent text-sm sm:text-base"
                    />
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ikea-blue text-sm sm:text-base"
                        >
                            <option value="">All Categories</option>
                            <option value="Furniture">Furniture</option>
                            <option value="Storage">Storage</option>
                            <option value="Tables">Tables</option>
                            <option value="Bedroom">Bedroom</option>
                            <option value="Kitchen">Kitchen</option>
                            <option value="Lighting">Lighting</option>
                            <option value="Decor">Decor</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
                        <input
                            type="number"
                            value={filters.priceMin}
                            onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
                            placeholder="$0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ikea-blue text-sm sm:text-base"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                        <input
                            type="number"
                            value={filters.priceMax}
                            onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
                            placeholder="$10000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ikea-blue text-sm sm:text-base"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
                        <select
                            value={filters.stockStatus}
                            onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ikea-blue text-sm sm:text-base"
                        >
                            <option value="all">All</option>
                            <option value="low">Low Stock</option>
                            <option value="in-stock">In Stock</option>
                            <option value="out-of-stock">Out of Stock</option>
                        </select>
                    </div>
                </div>

                <button
                    onClick={() => setFilters({ category: '', priceMin: '', priceMax: '', stockStatus: 'all' })}
                    className="mt-3 text-sm text-ikea-blue hover:underline"
                >
                    Clear Filters
                </button>
            </div>

            {/* Products Table - Desktop View */}
            <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    SKU
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Price
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Stock
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Location
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-3 sm:px-6 py-8 text-center text-gray-500">
                                        No products found. Try adjusting your filters or search term.
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr key={product.id} className={product.isLowStock ? 'bg-red-50' : ''}>
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                                            {product.sku}
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded bg-ikea-blue text-white flex items-center justify-center text-xs font-bold mr-3">
                                                    {product.sku.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <div className="text-xs sm:text-sm font-medium text-gray-900">{product.name}</div>
                                                    <div className="text-xs sm:text-sm text-gray-500">{product.supplierName}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {product.category}
                                            </span>
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                            ${product.price.toFixed(2)}
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                                            <div className="flex items-center space-x-2">
                                                <span className={product.isLowStock ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                                                    {product.stockQuantity}
                                                </span>
                                                <div className="flex space-x-1">
                                                    <button
                                                        onClick={() => handleStockAdjustment(product.id, 1)}
                                                        className="text-green-600 hover:text-green-800 text-xs font-semibold px-2 py-1 border border-green-600 rounded hover:bg-green-50"
                                                        title="Increase stock"
                                                    >
                                                        +
                                                    </button>
                                                    <button
                                                        onClick={() => handleStockAdjustment(product.id, -1)}
                                                        className="text-red-600 hover:text-red-800 text-xs font-semibold px-2 py-1 border border-red-600 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        disabled={product.stockQuantity <= 0}
                                                        title="Decrease stock"
                                                    >
                                                        -
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                            {product.location}
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => navigate(`/products/edit/${product.id}`)}
                                                    className="text-ikea-blue hover:text-blue-700"
                                                    title="Edit product"
                                                >
                                                    <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                    title="Delete product"
                                                >
                                                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/products/${product.id}/details`)}
                                                    className="text-ikea-blue hover:text-blue-700"
                                                    title="View details"
                                                >
                                                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Products Cards - Mobile View */}
            <div className="md:hidden space-y-4">
                {filteredProducts.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                        No products found. Try adjusting your filters or search term.
                    </div>
                ) : (
                    filteredProducts.map((product) => (
                        <div 
                            key={product.id} 
                            className={`bg-white rounded-lg shadow p-4 ${product.isLowStock ? 'border-l-4 border-red-500' : ''}`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center flex-1">
                                    <div className="w-10 h-10 rounded bg-ikea-blue text-white flex items-center justify-center text-xs font-bold mr-3">
                                        {product.sku.substring(0, 2)}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-gray-900">{product.name}</h3>
                                        <p className="text-xs text-gray-500">{product.supplierName}</p>
                                    </div>
                                </div>
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                    {product.category}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                                <div>
                                    <span className="text-gray-500">SKU:</span>
                                    <span className="ml-2 font-medium">{product.sku}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Price:</span>
                                    <span className="ml-2 font-medium">${product.price.toFixed(2)}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Stock:</span>
                                    <span className={`ml-2 font-medium ${product.isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                                        {product.stockQuantity}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Location:</span>
                                    <span className="ml-2 font-medium">{product.location}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                                <div className="flex space-x-1">
                                    <button
                                        onClick={() => handleStockAdjustment(product.id, 1)}
                                        className="text-green-600 hover:text-green-800 text-xs font-semibold px-3 py-1 border border-green-600 rounded hover:bg-green-50"
                                    >
                                        + Stock
                                    </button>
                                    <button
                                        onClick={() => handleStockAdjustment(product.id, -1)}
                                        className="text-red-600 hover:text-red-800 text-xs font-semibold px-3 py-1 border border-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                                        disabled={product.stockQuantity <= 0}
                                    >
                                        - Stock
                                    </button>
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => navigate(`/products/${product.id}/details`)}
                                        className="text-ikea-blue hover:text-blue-700"
                                    >
                                        <Eye className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => navigate(`/products/edit/${product.id}`)}
                                        className="text-ikea-blue hover:text-blue-700"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Results Summary */}
            <div className="mt-4 text-sm text-gray-600">
                Showing {filteredProducts.length} of {products.length} products
            </div>
        </div>
    );
};

export default ProductList;
