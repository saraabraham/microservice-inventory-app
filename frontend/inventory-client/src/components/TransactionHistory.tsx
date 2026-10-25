import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, Package, Plus, X } from 'lucide-react';

interface Transaction {
    id: number;
    productId: number;
    product: {
        sku: string;
        name: string;
    };
    type: string;
    quantity: number;
    reference?: string;
    notes?: string;
    transactionDate: string;
    performedBy: string;
}

interface Product {
    id: number;
    name: string;
    sku: string;
}

const TransactionHistory: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        productId: '',
        transactionType: 'Sale',
        quantity: '',
        notes: '',
    });

    useEffect(() => {
        loadTransactions();
        loadProducts();
    }, []);

    const loadTransactions = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/transactions`);
            setTransactions(response.data);
        } catch (error) {
            console.error('Error loading transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadProducts = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/products`);
            setProducts(response.data);
        } catch (error) {
            console.error('Error loading products:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/transactions`, {
                productId: parseInt(form.productId),
                transactionType: form.transactionType,
                quantity: parseInt(form.quantity),
                notes: form.notes,
            });
            setShowModal(false);
            setForm({ productId: '', transactionType: 'Sale', quantity: '', notes: '' });
            await loadTransactions();
        } catch (error) {
            console.error('Error creating transaction:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'Purchase':
            case 'Return':
                return <ArrowUpCircle className="w-5 h-5 text-green-600" />;
            case 'Sale':
                return <ArrowDownCircle className="w-5 h-5 text-red-600" />;
            case 'Adjustment':
                return <RefreshCw className="w-5 h-5 text-blue-600" />;
            default:
                return <Package className="w-5 h-5 text-gray-600" />;
        }
    };

    const getTransactionColor = (type: string) => {
        switch (type) {
            case 'Purchase':
            case 'Return':
                return 'bg-green-100 text-green-800';
            case 'Sale':
                return 'bg-red-100 text-red-800';
            case 'Adjustment':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-ikea-blue">Transaction History</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-ikea-yellow text-ikea-blue px-4 py-2 rounded-lg hover:bg-yellow-400 flex items-center font-semibold"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        New Transaction
                    </button>
                    <button
                        onClick={loadTransactions}
                        className="bg-ikea-blue text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                    >
                        <RefreshCw className="w-5 h-5 mr-2" />
                        Refresh
                    </button>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-ikea-blue">New Transaction</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                                <select
                                    required
                                    value={form.productId}
                                    onChange={e => setForm({ ...form, productId: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ikea-blue"
                                >
                                    <option value="">Select a product...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    value={form.transactionType}
                                    onChange={e => setForm({ ...form, transactionType: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ikea-blue"
                                >
                                    <option value="Sale">Sale</option>
                                    <option value="Purchase">Purchase</option>
                                    <option value="Adjustment">Adjustment</option>
                                    <option value="Return">Return</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={form.quantity}
                                    onChange={e => setForm({ ...form, quantity: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ikea-blue"
                                    placeholder="e.g. 5"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <input
                                    type="text"
                                    value={form.notes}
                                    onChange={e => setForm({ ...form, notes: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ikea-blue"
                                    placeholder="Optional notes..."
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-ikea-blue text-white py-2 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : 'Create Transaction'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Product
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quantity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Reference
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Performed By
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.map((transaction) => (
                            <tr key={transaction.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {new Date(transaction.transactionDate).toLocaleDateString()}
                                    <div className="text-xs text-gray-500">
                                        {new Date(transaction.transactionDate).toLocaleTimeString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {transaction.product.name}
                                    </div>
                                    <div className="text-sm text-gray-500">{transaction.product.sku}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full items-center gap-1 ${getTransactionColor(
                                            transaction.type
                                        )}`}
                                    >
                                        {getTransactionIcon(transaction.type)}
                                        {transaction.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {transaction.quantity}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {transaction.reference || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {transaction.performedBy}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TransactionHistory;