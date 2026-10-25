import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productService, CreateProductDto } from '../services/api';

const ProductForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [formData, setFormData] = useState<CreateProductDto & { imageUrl?: string }>({
        sku: '',
        name: '',
        description: '',
        category: '',
        price: 0,
        stockQuantity: 0,
        minimumStock: 0,
        supplierId: 1,
        location: '',
        imageUrl: '',
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEditMode) {
            loadProduct();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const loadProduct = async () => {
        try {
            const response = await productService.getById(parseInt(id!));
            const product = response.data;
            setFormData({
                sku: product.sku,
                name: product.name,
                description: product.description,
                category: product.category,
                price: product.price,
                stockQuantity: product.stockQuantity,
                minimumStock: product.minimumStock,
                supplierId: product.supplierId,
                location: product.location,
                imageUrl: product.imageUrl || '',
            });
        } catch (error) {
            console.error('Error loading product:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEditMode) {
                await productService.update(parseInt(id!), formData);
            } else {
                await productService.create(formData);
            }
            navigate('/products');
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Error saving product. Please check all fields.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: ['price', 'stockQuantity', 'minimumStock', 'supplierId'].includes(name)
                ? parseFloat(value) || 0
                : value,
        }));
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-ikea-blue mb-6">
                {isEditMode ? 'Edit Product' : 'Add New Product'}
            </h1>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                        <input
                            type="text"
                            name="sku"
                            value={formData.sku}
                            onChange={handleChange}
                            disabled={isEditMode}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ikea-blue focus:border-transparent disabled:bg-gray-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ikea-blue focus:border-transparent"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ikea-blue focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ikea-blue focus:border-transparent"
                        >
                            <option value="">Select Category</option>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            step="0.01"
                            min="0"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ikea-blue focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                        <input
                            type="number"
                            name="stockQuantity"
                            value={formData.stockQuantity}
                            onChange={handleChange}
                            min="0"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ikea-blue focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock</label>
                        <input
                            type="number"
                            name="minimumStock"
                            value={formData.minimumStock}
                            onChange={handleChange}
                            min="0"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ikea-blue focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse Location</label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="e.g., Warehouse A-1"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ikea-blue focus:border-transparent"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Product Image URL
                        </label>
                        <input
                            type="url"
                            name="imageUrl"
                            value={formData.imageUrl || ''}
                            onChange={handleChange}
                            placeholder="https://example.com/image.jpg"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ikea-blue focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Enter a URL to an image, or leave blank for default
                        </p>
                        {formData.imageUrl && (
                            <img
                                src={formData.imageUrl}
                                alt="Preview"
                                className="mt-3 w-32 h-32 object-cover rounded-lg border"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Invalid+URL';
                                }}
                            />
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Supplier ID</label>
                        <select
                            name="supplierId"
                            value={formData.supplierId}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ikea-blue focus:border-transparent"
                        >
                            <option value="1">Scandinavian Furniture Co.</option>
                            <option value="2">Baltic Wood Supplies</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        type="button"
                        onClick={() => navigate('/products')}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-ikea-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : isEditMode ? 'Update Product' : 'Create Product'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;