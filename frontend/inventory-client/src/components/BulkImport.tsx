import React, { useState } from 'react';
import { Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

interface ImportResult {
    success: number;
    failed: number;
    errors: string[];
}

const BulkImport: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/products/import`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' }
                }
            );

            setResult(response.data.results);
            if (response.data.results.success > 0) {
                onComplete();
            }
        } catch (error: any) {
            alert('Error importing: ' + (error.response?.data?.message || error.message));
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = () => {
        const template = 'SKU,Name,Description,Category,Price,Stock,MinimumStock,Location\n' +
            'SAMPLE-001,Sample Product,Sample description,Furniture,99.99,100,20,Warehouse A-1\n' +
            'SAMPLE-002,Another Product,Another description,Storage,49.99,50,10,Warehouse B-2';

        const blob = new Blob([template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'import-template.csv';
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-ikea-blue mb-4">Bulk Import Products</h2>

            {/* Template Download */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 mb-1">First time importing?</h3>
                        <p className="text-sm text-blue-800 mb-3">
                            Download our CSV template to see the required format. The file should include:
                            SKU, Name, Description, Category, Price, Stock, MinimumStock, and Location.
                        </p>
                        <button
                            onClick={downloadTemplate}
                            className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download Template
                        </button>
                    </div>
                </div>
            </div>

            {/* File Upload */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select CSV File
                </label>
                <div className="flex items-center space-x-4">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-ikea-blue file:text-white hover:file:bg-blue-700"
                    />
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="bg-ikea-blue text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center whitespace-nowrap"
                    >
                        <Upload className="w-5 h-5 mr-2" />
                        {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                </div>
                {file && (
                    <p className="mt-2 text-sm text-gray-600">
                        Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </p>
                )}
            </div>

            {/* Results */}
            {result && (
                <div className={`p-4 rounded-lg ${result.failed > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
                    <div className="flex items-start">
                        {result.failed > 0 ? (
                            <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                        ) : (
                            <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                        )}
                        <div className="flex-1">
                            <h3 className={`font-semibold mb-2 ${result.failed > 0 ? 'text-yellow-900' : 'text-green-900'}`}>
                                Import Completed
                            </h3>
                            <p className="text-sm mb-2">
                                <strong>Success:</strong> {result.success} products imported/updated<br />
                                <strong>Failed:</strong> {result.failed} rows
                            </p>

                            {result.errors.length > 0 && (
                                <div className="mt-3">
                                    <p className="text-sm font-semibold text-red-800 mb-1">Errors:</p>
                                    <ul className="text-sm text-red-700 space-y-1 max-h-40 overflow-y-auto">
                                        {result.errors.map((error, index) => (
                                            <li key={index}>• {error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BulkImport;
