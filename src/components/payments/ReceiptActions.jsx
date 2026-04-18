// src/components/payments/ReceiptActions.jsx
import React, { useState } from 'react';
import api from '../../api';

const ReceiptActions = ({ payment }) => {
  const [loading, setLoading] = useState(false);
  const [receipts, setReceipts] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  const fetchReceipts = async () => {
    if (receipts) {
      setShowMenu(!showMenu);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/main/receipt/by-payment/${payment.payment_reference}/`);
      setReceipts(res.data);
      setShowMenu(true);
    } catch (err) {
      console.error('Failed to fetch receipts', err);
      // Optionally show a toast notification
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = (receipt) => {
    // Use pdf_url if available, else call download endpoint
    if (receipt.pdf_url) {
      window.open(receipt.pdf_url, '_blank');
    } else {
      window.open(`/api/receipt/${receipt.id}/download/`, '_blank');
    }
    setShowMenu(false); // close menu after click
  };

  return (
    <div className="relative">
      <button
        onClick={fetchReceipts}
        className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 focus:outline-none"
        disabled={loading}
        title="View receipts"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
        </svg>
        {loading && <div className="animate-spin h-3 w-3 border-b-2 border-blue-600 rounded-full ml-1"></div>}
      </button>

      {showMenu && receipts && (
        <>
          {/* Click outside to close */}
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
            <div className="py-1">
              {receipts.length === 0 && (
                <div className="px-4 py-2 text-sm text-gray-500">No receipts yet</div>
              )}
              {receipts.map(rec => (
                <button
                  key={rec.id}
                  onClick={() => downloadReceipt(rec)}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {rec.receipt_type === 'student' ? '📄 Student Copy' : '🏫 School Copy'}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReceiptActions;