import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;
const STATS_URL = process.env.REACT_APP_STATS_URL ?? '/api/stats';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface Product {
    id: number;
    sku: string;
    name: string;
    description: string;
    category: string;
    price: number;
    stockQuantity: number;
    minimumStock: number;
    supplierId: number;
    supplierName?: string;
    location: string;
    isLowStock: boolean;
    isActive: boolean;
    imageUrl?: string;
}

export interface CreateProductDto {
    sku: string;
    name: string;
    description: string;
    category: string;
    price: number;
    stockQuantity: number;
    minimumStock: number;
    supplierId: number;
    location: string;
    imageUrl?: string;
}

export const productService = {
    getAll: () => api.get<Product[]>('/products'),
    getById: (id: number) => api.get<Product>(`/products/${id}`),
    getLowStock: () => api.get<Product[]>('/products/low-stock'),
    create: (product: CreateProductDto) => api.post<Product>('/products', product),
    update: (id: number, product: Partial<Product>) => api.put(`/products/${id}`, product),
    updateStock: (id: number, quantityChange: number) =>
        api.patch(`/products/${id}/stock`, quantityChange, {
            headers: { 'Content-Type': 'application/json' }
        }),
    delete: (id: number) => api.delete(`/products/${id}`),
};

// Types for the Stats microservice response
export interface CategoryStat {
    category: string;
    count: number;
    totalStock: number;
}

export interface InventoryStats {
    totalProducts: number;
    totalStockUnits: number;
    totalStockValue: number;
    lowStockCount: number;
    categories: CategoryStat[];
}

// Calls the dedicated StatsService microservice
export const statsService = {
    getStats: () => axios.get<InventoryStats>(STATS_URL),
};