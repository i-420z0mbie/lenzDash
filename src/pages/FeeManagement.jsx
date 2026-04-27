// src/pages/FeeManagement.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import api from '../api';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis
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
// Toast System (animated)
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
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`animate-slideInRight px-4 py-2 rounded-xl shadow-lg text-white text-xxs font-medium flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-emerald-600'
                : toast.type === 'error'
                  ? 'bg-rose-600'
                  : 'bg-blue-600'
            }`}
          >
            {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✗' : 'ℹ'} {toast.message}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all duration-200 animate-scaleUp`}>
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-full p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">{children}</div>
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

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899'];

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="mt-2 text-xxs text-slate-400 animate-pulse">Loading fee dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 md:p-5 max-w-[1600px] mx-auto animate-fadeInUp">
      <div className="relative overflow-hidden rounded-xl bg-white/70 backdrop-blur-sm border border-white/30 shadow-lg p-4">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-indigo-100/40 to-transparent rounded-full blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              💰 Fee Management
            </h1>
            <p className="text-xxs text-slate-500 mt-0.5">
              Manage all fee structures, inspect full item lists, and edit existing fee items
            </p>
          </div>
          <button
            onClick={fetchAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xxs font-medium bg-indigo-600 text-white rounded-lg shadow hover:shadow-md transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total Structures" value={structures.length} icon="📋" />
        <MetricCard label="Active Structures" value={activeCount} icon="✅" color="text-emerald-600" />
        <MetricCard label="Total Value" value={formatMoney(totalValue)} icon="💰" />
        <MetricCard label="Total Items" value={totalItems} icon="📦" />
      </div>

      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-slate-100 overflow-hidden">
        <div className="border-b border-slate-100 px-3">
          <div className="flex gap-1 flex-wrap items-center">
            {[
              { id: 'structures', name: '📋 Structures' },
              { id: 'analytics', name: '📈 Analytics' },
              { id: 'charts', name: '📊 Charts' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xxs font-medium transition-all rounded-t-md ${
                  activeTab === tab.id
                    ? 'bg-white text-indigo-700 border-b-2 border-indigo-500'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {activeTab === 'structures' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by class, term, year..."
                    className="w-full sm:w-72 px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full sm:w-44 px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="all">All structures</option>
                    <option value="active">Active only</option>
                    <option value="inactive">Inactive only</option>
                  </select>
                </div>
                <div className="text-xxs text-slate-500">
                  Showing {filteredStructures.length} of {structures.length}
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredStructures.map((struct, idx) => (
                  <div
                    key={struct.id}
                    className="group relative bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 animate-fadeIn"
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-semibold text-slate-800 truncate">
                              {struct.school_class?.name || 'Unknown'}
                            </h4>
                            <span
                              className={`inline-flex px-1.5 py-0.5 rounded-full text-xxs font-medium ${
                                struct.is_active
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {struct.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-3 mt-1 text-xxs text-slate-500">
                            <span>📅 {struct.academic_year}</span>
                            <span>📚 {struct.term}</span>
                            <span>💰 {formatMoney(struct.total_amount)}</span>
                          </div>

                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xxs font-semibold text-slate-500 uppercase tracking-wide">
                                Fee items
                              </p>
                              <button
                                onClick={() => handleOpenStructure(struct)}
                                className="text-xxs text-indigo-600 hover:text-indigo-700 font-medium"
                              >
                                View all
                              </button>
                            </div>

                            {struct.items?.length ? (
                              <div className="space-y-1.5">
                                {struct.items.slice(0, 4).map((item) => (
                                  <div
                                    key={item.id || `${item.name}-${item.amount}`}
                                    className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-2"
                                  >
                                    <div className="min-w-0 pr-2">
                                      <p className="text-xs font-medium text-slate-800 truncate">
                                        {item.name}
                                      </p>
                                      <p className="text-xxs text-slate-500">
                                        {formatMoney(item.amount)}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => openEditItemModal(item, struct)}
                                      className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                                      title="Edit fee item"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M11 5h2m-1 14h.01M4 19h16a1 1 0 001-1V7a1 1 0 00-1-1H4a1 1 0 00-1 1v11a1 1 0 001 1z"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                ))}

                                {struct.items.length > 4 && (
                                  <button
                                    onClick={() => handleOpenStructure(struct)}
                                    className="text-xxs text-indigo-600 hover:text-indigo-700 font-medium"
                                  >
                                    +{struct.items.length - 4} more items
                                  </button>
                                )}
                              </div>
                            ) : (
                              <p className="text-xxs text-slate-400">No fee items attached yet.</p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => openAddItemsModal(struct)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="Add items"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleOpenStructure(struct)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="View structure"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0A9 9 0 11.001 12a9 9 0 0117.999 0z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredStructures.length === 0 && (
                  <div className="col-span-full text-center py-12 glass-card rounded-xl">
                    <p className="text-sm text-slate-500">No fee structures match your filters.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-card rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">📊</div>
                <p className="text-xxs text-slate-500">Active Ratio</p>
                <p className="text-lg font-bold">
                  {structures.length ? Math.round((activeCount / structures.length) * 100) : 0}%
                </p>
              </div>
              <div className="glass-card rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">💰</div>
                <p className="text-xxs text-slate-500">Avg per Structure</p>
                <p className="text-lg font-bold">{formatMoney(totalValue / (structures.length || 1))}</p>
              </div>
              <div className="glass-card rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">📦</div>
                <p className="text-xxs text-slate-500">Items per Structure</p>
                <p className="text-lg font-bold">
                  {(totalItems / (structures.length || 1)).toFixed(1)}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'charts' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="glass-card rounded-xl p-3">
                <h3 className="text-xxs font-semibold text-slate-500 mb-2">🥧 Fee Distribution by Class</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {pieData.map((_, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => formatMoney(val)} contentStyle={{ fontSize: '9px', borderRadius: '8px' }} />
                    <Legend iconSize={6} wrapperStyle={{ fontSize: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card rounded-xl p-3">
                <h3 className="text-xxs font-semibold text-slate-500 mb-2">📈 Revenue by Term</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={barData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.7} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="term" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 8 }} />
                    <Tooltip formatter={(val) => formatMoney(val)} contentStyle={{ fontSize: '9px' }} />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#6366f1"
                      fill="url(#revenueGrad)"
                      strokeWidth={1.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedStructure && (
        <Modal
          title={`📋 ${selectedStructure.school_class?.name || 'Unknown'} - ${selectedStructure.academic_year || ''} ${selectedStructure.term || ''}`}
          onClose={() => setSelectedStructure(null)}
          maxWidth="max-w-2xl"
        >
          {selectedStructureLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xxs text-slate-500">Status</p>
                  <p className="text-sm font-semibold">{selectedStructure.is_active ? 'Active' : 'Inactive'}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xxs text-slate-500">Total Amount</p>
                  <p className="text-sm font-semibold">{formatMoney(selectedStructure.total_amount)}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-slate-800">All Fee Items</h4>
                  <button
                    onClick={() => {
                      setSelectedStructure(null);
                      openAddItemsModal(selectedStructure);
                    }}
                    className="text-xxs text-indigo-600 font-medium hover:text-indigo-700"
                  >
                    + Add items
                  </button>
                </div>

                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {selectedStructure.items?.length ? (
                    selectedStructure.items.map((item) => (
                      <div
                        key={item.id || `${item.name}-${item.amount}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                          <p className="text-xxs text-slate-500">{formatMoney(item.amount)}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => openEditItemModal(item, selectedStructure)}
                            className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                            title="Edit fee item"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5h2m-1 14h.01M4 19h16a1 1 0 001-1V7a1 1 0 00-1-1H4a1 1 0 00-1 1v11a1 1 0 001 1z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl bg-slate-50 p-4 text-center text-xxs text-slate-500">
                      No fee items attached to this structure yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}

      {addItemsOpen && addingItemsTo && (
        <Modal
          title={`➕ Add Fee Items to ${addingItemsTo.school_class?.name || 'Structure'}`}
          onClose={() => {
            setAddItemsOpen(false);
            setAddingItemsTo(null);
            resetAddForm();
          }}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleAddItems} className="space-y-4">
            {formError && (
              <div className="bg-rose-50 p-2 rounded-lg text-xxs text-rose-700">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xxs text-slate-500">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="font-medium text-slate-700">Academic Year</p>
                <p>{addingItemsTo.academic_year}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="font-medium text-slate-700">Term</p>
                <p>{addingItemsTo.term}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xxs font-medium text-slate-700">
                  New Fee Items
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setFormData(prev => ({
                      ...prev,
                      items: [...prev.items, { name: '', amount: '' }],
                    }))
                  }
                  className="text-indigo-600 text-xxs font-medium"
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
                      className="flex-1 px-3 py-2 text-xs border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      value={item.amount}
                      onChange={e => updateAddItemField(idx, 'amount', e.target.value)}
                      className="w-28 px-3 py-2 text-xs border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeAddItem(idx)}
                      className="text-rose-500 p-2 rounded-lg hover:bg-rose-50 transition"
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

            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-xxs font-medium">Total to add:</span>
              <span className="text-sm font-bold">
                {formatMoney(
                  formData.items.reduce((sum, i) => sum + toNumber(i.amount), 0)
                )}
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAddItemsOpen(false);
                  setAddingItemsTo(null);
                  resetAddForm();
                }}
                className="flex-1 py-1.5 text-xxs bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="flex-1 py-1.5 text-xxs bg-indigo-600 text-white rounded-lg disabled:opacity-50"
              >
                {formLoading ? 'Adding...' : 'Add Items'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {editItemOpen && editingItem && (
        <Modal
          title="✏️ Edit Fee Item"
          onClose={() => {
            setEditItemOpen(false);
            resetEditForm();
          }}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleUpdateItem} className="space-y-4">
            {editError && (
              <div className="bg-rose-50 p-2 rounded-lg text-xxs text-rose-700">
                {editError}
              </div>
            )}

            <div className="rounded-xl bg-slate-50 p-3 text-xxs text-slate-500">
              <p className="font-medium text-slate-700 mb-1">Editing in</p>
              <p>
                {selectedStructure?.school_class?.name || 'Structure'} · {selectedStructure?.academic_year || ''} {selectedStructure?.term || ''}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xxs font-medium text-slate-700 mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label className="block text-xxs font-medium text-slate-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.amount}
                  onChange={e => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditItemOpen(false);
                  resetEditForm();
                }}
                className="flex-1 py-1.5 text-xxs bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="flex-1 py-1.5 text-xxs bg-indigo-600 text-white rounded-lg disabled:opacity-50"
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ------------------------------
// Metric Card Component
// ------------------------------
const MetricCard = ({ label, value, icon, color = 'text-slate-800' }) => (
  <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-white/30 p-3 shadow-sm transition-all hover:shadow">
    <div className="flex items-center justify-between">
      <span className="text-base">{icon}</span>
      <span className="text-xxs text-slate-400">⏺</span>
    </div>
    <p className="text-xxs text-slate-500 mt-1">{label}</p>
    <p className={`text-sm font-bold leading-tight ${color}`}>{value}</p>
  </div>
);

// Wrap with ToastProvider and export
const FeeManagementWithToast = () => (
  <ToastProvider>
    <FeeManagement />
  </ToastProvider>
);

// Inject global animation styles once
if (typeof document !== 'undefined' && !document.head.querySelector('#fee-mgmt-styles')) {
  const style = document.createElement('style');
  style.id = 'fee-mgmt-styles';
  style.textContent = `
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes scaleUp { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
    .animate-fadeInUp { animation: fadeInUp 0.3s ease-out forwards; }
    .animate-scaleUp { animation: scaleUp 0.2s ease-out forwards; }
    .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
    .animate-slideInRight { animation: slideInRight 0.3s ease-out forwards; }
    .glass-card { background: rgba(255,255,255,0.6); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.5); }
    .text-xxs { font-size: 0.65rem; line-height: 1rem; }
  `;
  document.head.appendChild(style);
}

export default FeeManagementWithToast;