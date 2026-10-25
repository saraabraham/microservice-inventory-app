import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, Package } from 'lucide-react';

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

const TransactionHistory: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTransactions();
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
                <button
                    onClick={loadTransactions}
                    className="bg-ikea-blue text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Refresh
                </button>
            </div>

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