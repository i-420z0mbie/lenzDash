// src/pages/FeeManagement.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import api from '../api';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';

// ------------------------------
// Helpers
// ------------------------------
const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatMoney = (amount) =>
  `GH₵${toNumber(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const safeArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const isPaginated = (data) =>
  data && typeof data === 'object' && !Array.isArray(data) && 'results' in data;

// ------------------------------
// Toast System
// ------------------------------
const ToastContext = React.createContext(null);
const useToast = () => React.useContext(ToastContext);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 space-y-2 ledger-root">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`animate-slideInRight px-4 py-2.5 border text-xs flex items-center gap-2 bg-white shadow-sm ${
              toast.type === 'success'
                ? 'border-emerald-800 text-emerald-900'
                : toast.type === 'error'
                  ? 'border-red-800 text-red-900'
                  : 'border-stone-400 text-stone-700'
            }`}
          >
            <span className="ledger-mono">{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✗' : 'i'}</span>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// ------------------------------
// Modal Component (portal)
// ------------------------------
const Modal = ({ title, children, onClose, maxWidth = 'max-w-md' }) => {
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn ledger-root">
      <div className="absolute inset-0 bg-stone-900/40" onClick={onClose} />
      <div className={`relative bg-white border border-stone-300 w-full ${maxWidth} max-h-[90vh] overflow-y-auto animate-scaleUp`}>
        <div className="sticky top-0 bg-white border-b border-stone-200 px-5 py-3 flex items-center justify-between">
          <h3 className="ledger-display text-base text-stone-900">{title}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-800 transition-colors p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
};

// ------------------------------
// Main FeeManagement Component
// ------------------------------
const FeeManagement = () => {
  const addToast = useToast();

  const [structures, setStructures] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('structures');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedStructure, setSelectedStructure] = useState(null);
  const [selectedStructureLoading, setSelectedStructureLoading] = useState(false);

  const [addItemsOpen, setAddItemsOpen] = useState(false);
  const [addingItemsTo, setAddingItemsTo] = useState(null);
  const [formData, setFormData] = useState({ items: [{ name: '', amount: '' }] });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const [editItemOpen, setEditItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', amount: '' });
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    type: null,
    id: null,
    name: '',
    structureId: null,
  });

  const fetchAllPages = useCallback(async (endpoint) => {
    const firstRes = await api.get(endpoint);
    const firstData = firstRes.data;

    if (!isPaginated(firstData)) {
      return safeArray(firstData);
    }

    const allResults = [...safeArray(firstData)];
    let nextUrl = firstData.next;

    while (nextUrl) {
      const nextRes = await api.get(nextUrl);
      const nextData = nextRes.data;

      if (!isPaginated(nextData)) {
        allResults.push(...safeArray(nextData));
        break;
      }

      allResults.push(...safeArray(nextData));
      nextUrl = nextData.next;
    }

    return allResults;
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [strucData, classData] = await Promise.all([
        fetchAllPages('/main/fee_structure/'),
        fetchAllPages('/main/school_class/'),
      ]);
      setStructures(strucData);
      setClasses(classData);
    } catch (err) {
      addToast('Failed to load fee data', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [addToast, fetchAllPages]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const totalValue = useMemo(
    () => structures.reduce((sum, s) => sum + toNumber(s.total_amount), 0),
    [structures]
  );

  const activeCount = useMemo(
    () => structures.filter(s => s.is_active).length,
    [structures]
  );

  const totalItems = useMemo(
    () => structures.reduce((sum, s) => sum + (s.items?.length || 0), 0),
    [structures]
  );

  const pieData = useMemo(() => {
    const map = new Map();
    structures.forEach(s => {
      const className = s.school_class?.name || 'Unknown';
      const amount = toNumber(s.total_amount);
      map.set(className, (map.get(className) || 0) + amount);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [structures]);

  const barData = useMemo(() => {
    const map = new Map();
    structures.forEach(s => {
      const key = `${s.term || 'Unknown'} ${s.academic_year || ''}`.trim();
      const amount = toNumber(s.total_amount);
      map.set(key, (map.get(key) || 0) + amount);
    });
    return Array.from(map.entries()).map(([term, total]) => ({ term, total }));
  }, [structures]);

  const filteredStructures = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return structures.filter(struct => {
      const className = struct.school_class?.name || 'Unknown';
      const matchesSearch =
        !term ||
        className.toLowerCase().includes(term) ||
        String(struct.term || '').toLowerCase().includes(term) ||
        String(struct.academic_year || '').toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && struct.is_active) ||
        (statusFilter === 'inactive' && !struct.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [structures, searchTerm, statusFilter]);

  const COLORS = ['#047857', '#b45309', '#78716c', '#1e3a8a', '#7c3aed', '#9f1239'];

  const resetAddForm = useCallback(() => {
    setFormData({ items: [{ name: '', amount: '' }] });
    setFormError('');
  }, []);

  const resetEditForm = useCallback(() => {
    setEditingItem(null);
    setEditForm({ name: '', amount: '' });
    setEditError('');
  }, []);

  const openStructureDetails = async (struct) => {
    try {
      setSelectedStructureLoading(true);
      const res = await api.get(`/main/fee_structure/${struct.id}/`);
      setSelectedStructure(res.data);
    } catch (err) {
      addToast('Failed to load structure details', 'error');
      setSelectedStructure(struct);
    } finally {
      setSelectedStructureLoading(false);
    }
  };

  const handleOpenStructure = async (struct) => {
    await openStructureDetails(struct);
  };

  const openAddItemsModal = async (struct) => {
    await openStructureDetails(struct);
    setAddingItemsTo(struct);
    resetAddForm();
    setAddItemsOpen(true);
  };

  const handleAddItems = async (e) => {
    e.preventDefault();

    const newItems = formData.items
      .filter(i => i.name && i.amount)
      .map(i => ({
        name: i.name.trim(),
        amount: toNumber(i.amount),
      }))
      .filter(i => i.name && i.amount > 0);

    if (newItems.length === 0) {
      setFormError('Add at least one valid fee item');
      return;
    }

    if (!addingItemsTo?.id) {
      setFormError('No fee structure selected');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      for (const item of newItems) {
        await api.post('/main/fee_item/', {
          fee_structure: addingItemsTo.id,
          name: item.name,
          amount: item.amount,
        });
      }

      addToast('Items added successfully');
      await fetchAll();
      setAddItemsOpen(false);
      setAddingItemsTo(null);
      resetAddForm();
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to add items';
      setFormError(message);
      addToast(message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const updateAddItemField = (idx, field, val) => {
    setFormData(prev => {
      const nextItems = [...prev.items];
      nextItems[idx] = { ...nextItems[idx], [field]: val };
      return { ...prev, items: nextItems };
    });
  };

  const removeAddItem = (idx) => {
    setFormData(prev => {
      if (prev.items.length <= 1) {
        setFormError('At least one fee item required');
        return prev;
      }
      return { ...prev, items: prev.items.filter((_, i) => i !== idx) };
    });
  };

  const openEditItemModal = async (item, struct) => {
    if (!item?.id) {
      addToast('This fee item cannot be edited because it has no ID.', 'error');
      return;
    }

    if (!selectedStructure || selectedStructure.id !== struct.id) {
      await openStructureDetails(struct);
    }

    setEditingItem({
      id: item.id,
      fee_structure: struct.id,
    });
    setEditForm({
      name: item.name || '',
      amount: String(item.amount ?? ''),
    });
    setEditError('');
    setEditItemOpen(true);
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();

    if (!editingItem?.id) {
      setEditError('No fee item selected');
      return;
    }

    const name = editForm.name.trim();
    const amount = toNumber(editForm.amount);

    if (!name) {
      setEditError('Item name is required');
      return;
    }

    if (amount <= 0) {
      setEditError('Enter a valid amount');
      return;
    }

    setEditLoading(true);
    setEditError('');

    try {
      await api.put(`/main/fee_item/${editingItem.id}/`, {
        fee_structure: editingItem.fee_structure,
        name,
        amount,
      });

      addToast('Fee item updated');
      await fetchAll();
      setEditItemOpen(false);
      resetEditForm();
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to update fee item';
      setEditError(message);
      addToast(message, 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteStructure = async () => {
    const id = deleteConfirm.id;
    if (!id) return;

    try {
      await api.delete(`/main/fee_structure/${id}/`);
      addToast('Fee structure deleted successfully');
      setDeleteConfirm({ open: false, type: null, id: null, name: '', structureId: null });
      await fetchAll();
      if (selectedStructure && selectedStructure.id === id) {
        setSelectedStructure(null);
      }
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to delete fee structure';
      addToast(message, 'error');
    }
  };

  const handleDeleteItem = async () => {
    const id = deleteConfirm.id;
    const structureId = deleteConfirm.structureId;
    if (!id) return;

    try {
      await api.delete(`/main/fee_item/${id}/`);
      addToast('Fee item deleted successfully');
      setDeleteConfirm({ open: false, type: null, id: null, name: '', structureId: null });
      await fetchAll();
      if (selectedStructure && selectedStructure.id === structureId) {
        await openStructureDetails(selectedStructure);
      }
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to delete fee item';
      addToast(message, 'error');
    }
  };

  const confirmDeleteStructure = (struct) => {
    setDeleteConfirm({
      open: true,
      type: 'structure',
      id: struct.id,
      name: struct.school_class?.name || 'Unknown Structure',
      structureId: null,
    });
  };

  const confirmDeleteItem = (item, struct) => {
    setDeleteConfirm({
      open: true,
      type: 'item',
      id: item.id,
      name: item.name || 'Unnamed item',
      structureId: struct.id,
    });
  };

  const renderDeleteItemButton = (item, struct) => (
    <button
      onClick={() => confirmDeleteItem(item, struct)}
      className="p-1.5 text-stone-400 hover:text-red-800 transition-colors"
      title="Delete this fee item"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-stone-50 ledger-root">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-stone-300 border-t-emerald-800 rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-xs text-stone-400 ledger-mono">Opening the fee book…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 ledger-root">
      <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-8 space-y-6">

        {/* ---------- Statement header ---------- */}
        <div className="border-b border-stone-300 pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="ledger-display text-3xl text-stone-900 tracking-tight">Fee structures</h1>
              <p className="text-sm text-stone-500 mt-1">Every fee structure by class and term, with the items behind each total.</p>
            </div>
            <button
              onClick={fetchAll}
              className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Refresh
            </button>
          </div>

          {/* Big total + inline stat strip */}
          <div className="mt-6 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
            <div>
              <p className="text-xs text-stone-500">Total structure value</p>
              <p className="ledger-display ledger-mono text-4xl md:text-5xl text-emerald-900 mt-1 tabular-nums">
                {formatMoney(totalValue)}
              </p>
            </div>
            <div className="flex flex-wrap items-center divide-x divide-stone-300">
              <div className="px-4 first:pl-0">
                <p className="ledger-mono text-lg text-stone-800 tabular-nums">{structures.length}</p>
                <p className="text-xs text-stone-500">Structures</p>
              </div>
              <div className="px-4">
                <p className="ledger-mono text-lg text-emerald-800 tabular-nums">{activeCount}</p>
                <p className="text-xs text-stone-500">Active</p>
              </div>
              <div className="px-4">
                <p className="ledger-mono text-lg text-stone-800 tabular-nums">{totalItems}</p>
                <p className="text-xs text-stone-500">Fee items</p>
              </div>
            </div>
          </div>
        </div>

        {/* ---------- Tabs ---------- */}
        <div className="flex items-center gap-6 border-b border-stone-300">
          {[
            { id: 'structures', name: 'Structures' },
            { id: 'analytics', name: 'Analytics' },
            { id: 'charts', name: 'Charts' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 -mb-px text-sm transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-emerald-800 text-stone-900 font-medium'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* ---------- Structures Tab ---------- */}
        {activeTab === 'structures' && (
          <div className="space-y-5">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by class, term, or year"
                  className="w-full sm:w-72 px-3 py-2 text-sm border border-stone-300 bg-white outline-none focus:border-emerald-800 transition-colors placeholder:text-stone-400"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-44 px-3 py-2 text-sm border border-stone-300 bg-white outline-none focus:border-emerald-800 transition-colors"
                >
                  <option value="all">All structures</option>
                  <option value="active">Active only</option>
                  <option value="inactive">Inactive only</option>
                </select>
              </div>
              <div className="text-xs text-stone-500">
                Showing {filteredStructures.length} of {structures.length}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {filteredStructures.map((struct) => (
                <div
                  key={struct.id}
                  className="border border-stone-200 bg-white"
                >
                  <div className="flex justify-between items-start gap-3 px-4 pt-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="ledger-display text-lg text-stone-900 truncate">
                          {struct.school_class?.name || 'Unknown'}
                        </h4>
                        <span className={`text-xs ${struct.is_active ? 'text-emerald-800' : 'text-stone-400'}`}>
                          {struct.is_active ? '● Active' : '○ Inactive'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-stone-500">
                        <span>{struct.academic_year}</span>
                        <span>· {struct.term}</span>
                        <span className="ledger-mono text-stone-700">· {formatMoney(struct.total_amount)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openAddItemsModal(struct)}
                        className="p-1.5 text-stone-400 hover:text-emerald-800 transition-colors"
                        title="Add items"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleOpenStructure(struct)}
                        className="p-1.5 text-stone-400 hover:text-stone-800 transition-colors"
                        title="View structure"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0A9 9 0 11.001 12a9 9 0 0117.999 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => confirmDeleteStructure(struct)}
                        className="p-1.5 text-stone-400 hover:text-red-800 transition-colors"
                        title="Delete structure"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 border-t border-stone-100">
                    {struct.items?.length ? (
                      <>
                        {struct.items.slice(0, 4).map((item, i) => (
                          <div
                            key={item.id || `${item.name}-${item.amount}`}
                            className={`flex items-center justify-between px-4 py-2 text-sm ${i !== 0 ? 'border-t border-stone-100' : ''}`}
                          >
                            <span className="text-stone-700 truncate pr-2">{item.name}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="ledger-mono text-stone-600 tabular-nums text-xs mr-1">{formatMoney(item.amount)}</span>
                              <button
                                onClick={() => openEditItemModal(item, struct)}
                                className="p-1.5 text-stone-400 hover:text-emerald-800 transition-colors"
                                title="Edit fee item"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5h2m-1 14h.01M4 19h16a1 1 0 001-1V7a1 1 0 00-1-1H4a1 1 0 00-1 1v11a1 1 0 001 1z" />
                                </svg>
                              </button>
                              {renderDeleteItemButton(item, struct)}
                            </div>
                          </div>
                        ))}
                        {struct.items.length > 4 && (
                          <button
                            onClick={() => handleOpenStructure(struct)}
                            className="w-full text-left px-4 py-2 text-xs text-emerald-800 hover:text-emerald-900 border-t border-stone-100"
                          >
                            +{struct.items.length - 4} more items
                          </button>
                        )}
                      </>
                    ) : (
                      <p className="px-4 py-3 text-xs text-stone-400">No fee items attached yet.</p>
                    )}
                  </div>

                  <div className="px-4 py-2 border-t border-stone-100 flex justify-end">
                    <button
                      onClick={() => handleOpenStructure(struct)}
                      className="text-xs text-stone-500 hover:text-stone-900 transition-colors"
                    >
                      View all →
                    </button>
                  </div>
                </div>
              ))}

              {filteredStructures.length === 0 && (
                <div className="col-span-full text-center py-16 border border-stone-200">
                  <p className="ledger-display text-lg text-stone-700">No structures match your filters</p>
                  <p className="text-sm text-stone-500 mt-1">Try a different search term or status.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------- Analytics Tab ---------- */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="border border-stone-200 bg-white p-5 text-center">
              <p className="text-xs text-stone-500">Active ratio</p>
              <p className="ledger-display ledger-mono text-3xl text-stone-900 mt-1">
                {structures.length ? Math.round((activeCount / structures.length) * 100) : 0}%
              </p>
            </div>
            <div className="border border-stone-200 bg-white p-5 text-center">
              <p className="text-xs text-stone-500">Average per structure</p>
              <p className="ledger-display ledger-mono text-3xl text-emerald-900 mt-1">
                {formatMoney(totalValue / (structures.length || 1))}
              </p>
            </div>
            <div className="border border-stone-200 bg-white p-5 text-center">
              <p className="text-xs text-stone-500">Items per structure</p>
              <p className="ledger-display ledger-mono text-3xl text-stone-900 mt-1">
                {(totalItems / (structures.length || 1)).toFixed(1)}
              </p>
            </div>
          </div>
        )}

        {/* ---------- Charts Tab ---------- */}
        {activeTab === 'charts' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="text-sm font-medium text-stone-700">Fee value by class</h3>
                <span className="text-xs text-stone-400">GH₵</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={54}
                    outerRadius={86}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {pieData.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => formatMoney(val)} contentStyle={{ fontSize: '11px', border: '1px solid #e7e5e4', borderRadius: 0, boxShadow: 'none' }} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="text-sm font-medium text-stone-700">Value by term</h3>
                <span className="text-xs text-stone-400">GH₵</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={barData} margin={{ top: 6, right: 6, left: -6, bottom: 0 }}>
                  <defs>
                    <linearGradient id="feeRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#047857" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#047857" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#e7e5e4" />
                  <XAxis dataKey="term" tick={{ fontSize: 10, fill: '#78716c' }} axisLine={{ stroke: '#d6d3d1' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#78716c' }} tickFormatter={v => `GH₵${v.toLocaleString()}`} axisLine={false} tickLine={false} width={56} />
                  <Tooltip formatter={(val) => formatMoney(val)} contentStyle={{ fontSize: '11px', border: '1px solid #e7e5e4', borderRadius: 0, boxShadow: 'none' }} />
                  <Area type="monotone" dataKey="total" stroke="#047857" fill="url(#feeRevenueGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* ---------- MODALS ---------- */}

      {/* Structure Detail Modal */}
      {selectedStructure && (
        <Modal
          title={`${selectedStructure.school_class?.name || 'Unknown'} — ${selectedStructure.academic_year || ''} ${selectedStructure.term || ''}`}
          onClose={() => setSelectedStructure(null)}
          maxWidth="max-w-2xl"
        >
          {selectedStructureLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-stone-300 border-t-emerald-800 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 divide-x divide-stone-200 border border-stone-200">
                <div className="p-3">
                  <p className="text-xs text-stone-500">Status</p>
                  <p className={`text-sm font-medium mt-0.5 ${selectedStructure.is_active ? 'text-emerald-800' : 'text-stone-500'}`}>
                    {selectedStructure.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div className="p-3">
                  <p className="text-xs text-stone-500">Total amount</p>
                  <p className="ledger-mono text-sm font-medium text-stone-900 mt-0.5">{formatMoney(selectedStructure.total_amount)}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-stone-800">All fee items</h4>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        setSelectedStructure(null);
                        openAddItemsModal(selectedStructure);
                      }}
                      className="text-xs text-emerald-800 hover:text-emerald-900 font-medium"
                    >
                      + Add items
                    </button>
                    <button
                      onClick={() => {
                        confirmDeleteStructure(selectedStructure);
                        setSelectedStructure(null);
                      }}
                      className="text-xs text-red-800 hover:text-red-900 font-medium"
                    >
                      Delete structure
                    </button>
                  </div>
                </div>

                <div className="border border-stone-200 max-h-[50vh] overflow-y-auto">
                  {selectedStructure.items?.length ? (
                    selectedStructure.items.map((item, i) => (
                      <div
                        key={item.id || `${item.name}-${item.amount}`}
                        className={`flex items-center justify-between gap-3 px-3 py-2.5 ${i !== 0 ? 'border-t border-stone-100' : ''}`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-stone-800 truncate">{item.name}</p>
                          <p className="ledger-mono text-xs text-stone-500 mt-0.5">{formatMoney(item.amount)}</p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openEditItemModal(item, selectedStructure)}
                            className="p-1.5 text-stone-400 hover:text-emerald-800 transition-colors"
                            title="Edit fee item"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5h2m-1 14h.01M4 19h16a1 1 0 001-1V7a1 1 0 00-1-1H4a1 1 0 00-1 1v11a1 1 0 001 1z" />
                            </svg>
                          </button>
                          {renderDeleteItemButton(item, selectedStructure)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-stone-400">
                      No fee items attached to this structure yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Add Items Modal */}
      {addItemsOpen && addingItemsTo && (
        <Modal
          title={`Add fee items — ${addingItemsTo.school_class?.name || 'Structure'}`}
          onClose={() => {
            setAddItemsOpen(false);
            setAddingItemsTo(null);
            resetAddForm();
          }}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleAddItems} className="space-y-4">
            {formError && (
              <div className="border border-red-800 px-3 py-2 text-xs text-red-800">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-2 divide-x divide-stone-200 border border-stone-200 text-xs text-stone-500">
              <div className="p-3">
                <p className="font-medium text-stone-700">Academic year</p>
                <p className="mt-0.5">{addingItemsTo.academic_year}</p>
              </div>
              <div className="p-3">
                <p className="font-medium text-stone-700">Term</p>
                <p className="mt-0.5">{addingItemsTo.term}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium text-stone-700">
                  New fee items
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setFormData(prev => ({
                      ...prev,
                      items: [...prev.items, { name: '', amount: '' }],
                    }))
                  }
                  className="text-emerald-800 hover:text-emerald-900 text-xs font-medium"
                >
                  + Add another item
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-auto pr-1">
                {formData.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Item name"
                      value={item.name}
                      onChange={e => updateAddItemField(idx, 'name', e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-stone-300 outline-none focus:border-emerald-800 transition-colors"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      value={item.amount}
                      onChange={e => updateAddItemField(idx, 'amount', e.target.value)}
                      className="w-28 px-3 py-2 text-sm border border-stone-300 outline-none focus:border-emerald-800 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => removeAddItem(idx)}
                      className="text-stone-400 hover:text-red-800 p-2 transition-colors"
                      title="Remove item"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-stone-200">
              <span className="text-xs font-medium text-stone-600">Total to add</span>
              <span className="ledger-mono text-sm font-medium text-stone-900">
                {formatMoney(
                  formData.items.reduce((sum, i) => sum + toNumber(i.amount), 0)
                )}
              </span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setAddItemsOpen(false);
                  setAddingItemsTo(null);
                  resetAddForm();
                }}
                className="flex-1 py-2 text-sm border border-stone-300 text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="flex-1 py-2 text-sm bg-stone-900 text-stone-50 hover:bg-emerald-900 transition-colors disabled:opacity-50"
              >
                {formLoading ? 'Adding…' : 'Add items'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Item Modal */}
      {editItemOpen && editingItem && (
        <Modal
          title="Edit fee item"
          onClose={() => {
            setEditItemOpen(false);
            resetEditForm();
          }}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleUpdateItem} className="space-y-4">
            {editError && (
              <div className="border border-red-800 px-3 py-2 text-xs text-red-800">
                {editError}
              </div>
            )}

            <div className="border border-stone-200 p-3 text-xs text-stone-500">
              <p className="font-medium text-stone-700 mb-1">Editing in</p>
              <p>
                {selectedStructure?.school_class?.name || 'Structure'} · {selectedStructure?.academic_year || ''} {selectedStructure?.term || ''}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Item name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-stone-300 outline-none focus:border-emerald-800 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.amount}
                  onChange={e => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-stone-300 outline-none focus:border-emerald-800 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setEditItemOpen(false);
                  resetEditForm();
                }}
                className="flex-1 py-2 text-sm border border-stone-300 text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="flex-1 py-2 text-sm bg-stone-900 text-stone-50 hover:bg-emerald-900 transition-colors disabled:opacity-50"
              >
                {editLoading ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.open && (
        <Modal
          title={deleteConfirm.type === 'structure' ? 'Delete fee structure' : 'Delete fee item'}
          onClose={() => setDeleteConfirm({ open: false, type: null, id: null, name: '', structureId: null })}
          maxWidth="max-w-sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-stone-700">
              {deleteConfirm.type === 'structure' ? (
                <>Delete the fee structure for <strong>{deleteConfirm.name}</strong>?</>
              ) : (
                <>Delete the fee item <strong>{deleteConfirm.name}</strong>?</>
              )}
            </p>
            <p className="text-xs text-stone-500">
              {deleteConfirm.type === 'structure'
                ? 'This cannot be undone. All fee items under this structure will also be deleted.'
                : 'This cannot be undone.'}
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ open: false, type: null, id: null, name: '', structureId: null })}
                className="flex-1 py-2 text-sm border border-stone-300 text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteConfirm.type === 'structure' ? handleDeleteStructure : handleDeleteItem}
                className="flex-1 py-2 text-sm bg-red-800 text-stone-50 hover:bg-red-900 transition-colors"
              >
                Yes, delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Wrap with ToastProvider and export
const FeeManagementWithToast = () => (
  <ToastProvider>
    <FeeManagement />
  </ToastProvider>
);

// Inject fonts + base ledger styling (shared with other ledger pages; only injected once)
if (typeof document !== 'undefined' && !document.getElementById('dashboard-ledger-styles')) {
  const style = document.createElement('style');
  style.id = 'dashboard-ledger-styles';
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
    .ledger-root { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; animation: ledgerFadeIn 0.35s ease-out; }
    .ledger-display { font-family: 'Fraunces', serif; font-weight: 500; }
    .ledger-mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
    @keyframes ledgerFadeIn { from { opacity: 0; } to { opacity: 1; } }
  `;
  document.head.appendChild(style);
}

// Modal + toast animation styles for this page
if (typeof document !== 'undefined' && !document.getElementById('fee-mgmt-ledger-styles')) {
  const style = document.createElement('style');
  style.id = 'fee-mgmt-ledger-styles';
  style.textContent = `
    @keyframes scaleUp { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideInRight { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
    .animate-scaleUp { animation: scaleUp 0.15s ease-out forwards; }
    .animate-fadeIn { animation: fadeIn 0.15s ease-out forwards; }
    .animate-slideInRight { animation: slideInRight 0.25s ease-out forwards; }
  `;
  document.head.appendChild(style);
}

export default FeeManagementWithToast;