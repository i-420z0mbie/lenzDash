import React, { useState, useRef, useEffect, useCallback } from 'react';
import api from '../../api';

const ReceiptActions = ({ payment }) => {
  const [loading, setLoading] = useState(false);
  const [receipts, setReceipts] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  // Fetch receipts when the button is clicked
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
    } finally {
      setLoading(false);
    }
  };

  // Dynamically position the dropdown so it never goes off‑screen
  const positionDropdown = useCallback(() => {
    if (!buttonRef.current || !showMenu) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = dropdownRef.current?.offsetHeight || 0;
    const viewportHeight = window.innerHeight;
    const spacing = 8; // gap between button and dropdown

    let top;
    // If there is more space below, show below; otherwise show above
    if (buttonRect.bottom + dropdownHeight + spacing < viewportHeight) {
      top = buttonRect.bottom + spacing;
    } else {
      top = buttonRect.top - dropdownHeight - spacing;
    }

    // Keep the dropdown inside the viewport horizontally
    let left = buttonRect.left;
    const dropdownWidth = dropdownRef.current?.offsetWidth || 0;
    if (left + dropdownWidth > window.innerWidth) {
      left = window.innerWidth - dropdownWidth - spacing;
    }
    if (left < spacing) left = spacing;

    setDropdownPosition({ top, left });
  }, [showMenu]);

  // Reposition when the menu opens, on scroll, or on window resize
  useEffect(() => {
    if (showMenu) {
      positionDropdown();
      window.addEventListener('scroll', positionDropdown, true);
      window.addEventListener('resize', positionDropdown);
      return () => {
        window.removeEventListener('scroll', positionDropdown, true);
        window.removeEventListener('resize', positionDropdown);
      };
    }
  }, [showMenu, positionDropdown]);

  // Close the dropdown when clicking outside (but not on the button or the dropdown itself)
  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (event) => {
      const isButtonClick = buttonRef.current?.contains(event.target);
      const isDropdownClick = dropdownRef.current?.contains(event.target);
      if (!isButtonClick && !isDropdownClick) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const downloadReceipt = (receipt) => {
    if (receipt.pdf_url) {
      window.open(receipt.pdf_url, '_blank');
    } else {
      window.open(`/api/receipt/${receipt.id}/download/`, '_blank');
    }
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
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
        <div
          ref={dropdownRef}
          className="fixed bg-white rounded-md shadow-lg border border-gray-200 z-20"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            minWidth: '160px',
          }}
        >
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
      )}
    </div>
  );
};

export default ReceiptActions;