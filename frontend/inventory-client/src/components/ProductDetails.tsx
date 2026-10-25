import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product, productService } from '../services/api';
import BarcodeGenerator from './BarcodeGenerator';
import { ArrowLeft, Edit } from 'lucide-react';

const ProductDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProduct();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const loadProduct = async () => {
        try {
            const response = await productService.getById(parseInt(id!));
            setProduct(response.data);
        } catch (error) {
            console.error('Error loading product:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    if (!product) {
        return <div className="p-6">Product not found</div>;
    }

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <button
                    onClick={() => navigate('/products')}
                    className="flex items-center text-ikea-blue hover:text-blue-700"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Products
                </button>
                <button
                    onClick={() => navigate(`/products/edit/${product.id}`)}
                    className="bg-ikea-blue text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                >
                    <Edit className="w-5 h-5 mr-2" />
                    Edit Product
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Product Info */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h1 className="text-3xl font-bold text-ikea-blue mb-4">{product.name}</h1>

                    {product.imageUrl && (
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-64 object-cover rounded-lg mb-4"
                        />
                    )}

                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="font-semibold">SKU:</span>
                            <span>{product.sku}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Category:</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                                {product.category}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Price:</span>
                            <span className="text-xl font-bold text-ikea-blue">
                                ${product.price.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Stock:</span>
                            <span className={product.isLowStock ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                                {product.stockQuantity} units
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Minimum Stock:</span>
                            <span>{product.minimumStock} units</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Supplier:</span>
                            <span>{product.supplierName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Location:</span>
                            <span>{product.location}</span>
                        </div>
                        <div className="pt-3 border-t">
                            <span className="font-semibold">Description:</span>
                            <p className="mt-2 text-gray-600">{product.description}</p>
                        </div>
                    </div>
                </div>

                {/* Barcode */}
                <div>
                    <BarcodeGenerator sku={product.sku} name={product.name} />
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;