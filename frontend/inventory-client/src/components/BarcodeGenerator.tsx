import React, { useRef } from 'react';
import Barcode from 'react-barcode';
import { Printer, Download } from 'lucide-react';

interface BarcodeGeneratorProps {
    sku: string;
    name: string;
}

const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({ sku, name }) => {
    const barcodeRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow && barcodeRef.current) {
            printWindow.document.write(`
        <html>
          <head>
            <title>Print Barcode - ${sku}</title>
            <style>
              body { 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                margin: 0;
                font-family: Arial, sans-serif;
              }
              .barcode-container {
                text-align: center;
                padding: 20px;
                border: 2px dashed #ccc;
              }
              .product-name {
                margin-top: 10px;
                font-size: 14px;
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <div class="barcode-container">
              ${barcodeRef.current.innerHTML}
              <div class="product-name">${name}</div>
            </div>
          </body>
        </html>
      `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    const handleDownload = () => {
        if (barcodeRef.current) {
            const svg = barcodeRef.current.querySelector('svg');
            if (svg) {
                const svgData = new XMLSerializer().serializeToString(svg);
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();

                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx?.drawImage(img, 0, 0);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.download = `barcode-${sku}.png`;
                            link.href = url;
                            link.click();
                        }
                    });
                };

                img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
            }
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-ikea-blue mb-4">Barcode</h3>

            <div ref={barcodeRef} className="flex justify-center mb-4">
                <Barcode
                    value={sku}
                    format="CODE128"
                    width={2}
                    height={50}
                    displayValue={true}
                />
            </div>

            <div className="flex justify-center space-x-3">
                <button
                    onClick={handlePrint}
                    className="bg-ikea-blue text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                >
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                </button>
                <button
                    onClick={handleDownload}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                </button>
            </div>
        </div>
    );
};

export default BarcodeGenerator;