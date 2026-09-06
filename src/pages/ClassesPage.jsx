// src/pages/ClassesPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';

// --- Helper Functions ---
const getStudentPaymentStatus = (student) => {
  if (student.total_balance <= 0) return 'paid';
  if (student.total_paid > 0) return 'partial';
  return 'unpaid';
};

const STATUS_META = {
  paid: { label: 'Fully paid', dot: 'bg-emerald-700', text: 'text-emerald-800' },
  partial: { label: 'Partial', dot: 'bg-amber-600', text: 'text-amber-800' },
  unpaid: { label: 'Unpaid', dot: 'bg-red-800', text: 'text-red-800' },
};

const formatMoney = (amount) => `GH₵${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState('');
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [viewMode, setViewMode] = useState('summary');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [addingClass, setAddingClass] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [deletingClass, setDeletingClass] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [globalPaymentSummary, setGlobalPaymentSummary] = useState({ paid: 0, partial: 0, unpaid: 0 });
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (students.length > 0) {
      const filtered = students.filter(student =>
        searchStudents(student, searchTerm)
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents([]);
    }
  }, [searchTerm, students]);

  const searchStudents = (student, term) => {
    if (!term.trim()) return true;
    const searchLower = term.toLowerCase();
    return (
      student.first_name?.toLowerCase().includes(searchLower) ||
      student.last_name?.toLowerCase().includes(searchLower) ||
      student.other_names?.toLowerCase().includes(searchLower) ||
      student.student_id?.toLowerCase().includes(searchLower) ||
      student.parent_name?.toLowerCase().includes(searchLower) ||
      student.parent_contact?.toLowerCase().includes(searchLower)
    );
  };

  const aggregateGlobalPaymentSummary = async (classesList) => {
    if (!classesList.length) {
      setGlobalPaymentSummary({ paid: 0, partial: 0, unpaid: 0 });
      return;
    }
    setLoadingSummary(true);
    let paidCount = 0, partialCount = 0, unpaidCount = 0;
    try {
      const classPromises = classesList.map(cls =>
        api.get(`/main/students-by-class/${cls.id}/`).then(res => res.data.students).catch(() => [])
      );
      const allStudentsArrays = await Promise.all(classPromises);
      allStudentsArrays.forEach(studentsArray => {
        studentsArray.forEach(student => {
          const status = getStudentPaymentStatus(student);
          if (status === 'paid') paidCount++;
          else if (status === 'partial') partialCount++;
          else unpaidCount++;
        });
      });
      setGlobalPaymentSummary({ paid: paidCount, partial: partialCount, unpaid: unpaidCount });
    } catch (error) {
      console.error('Error aggregating payment summary:', error);
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/main/class-overview/');
      setClasses(response.data);
      await aggregateGlobalPaymentSummary(response.data);
      setError('');
    } catch (error) {
      setError('Failed to load classes.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsByClass = async (classId) => {
    try {
      setLoadingStudents(true);
      const response = await api.get(`/main/students-by-class/${classId}/`);
      setStudents(response.data.students);
      setFilteredStudents(response.data.students);
      setClassInfo(response.data.class_info);
      setExpandedStudent(null);
      setSearchTerm('');
    } catch (error) {
      setError('Failed to load students.');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleClassSelect = (classItem) => {
    setSelectedClass(classItem);
    fetchStudentsByClass(classItem.id);
  };

  const handleBackToClasses = () => {
    setSelectedClass(null);
    setStudents([]);
    setFilteredStudents([]);
    setClassInfo(null);
    setExpandedStudent(null);
    setSearchTerm('');
  };

  const toggleStudentExpansion = (studentId) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setAddingClass(true);
    try {
      await api.post('/main/school_class/', { name: newClassName });
      setShowAddClassModal(false);
      setNewClassName('');
      await fetchClasses();
    } catch (error) {
      alert(`Error: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`);
    } finally {
      setAddingClass(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!classToDelete) return;
    setDeletingClass(true);
    try {
      await api.delete(`/main/school_class/${classToDelete.id}/`);
      if (selectedClass && selectedClass.id === classToDelete.id) handleBackToClasses();
      await fetchClasses();
    } catch (error) {
      alert(`Error: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`);
    } finally {
      setDeletingClass(false);
      setShowDeleteModal(false);
      setShowDeleteConfirmModal(false);
      setClassToDelete(null);
    }
  };

  const openDeleteModal = (classItem) => {
    setClassToDelete(classItem);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setShowDeleteModal(false);
    setShowDeleteConfirmModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-stone-50">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-stone-300 border-t-emerald-800 rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-xs text-stone-400 ledger-mono">Opening the register…</p>
        </div>
      </div>
    );
  }

  if (error && !selectedClass) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-stone-50">
        <div className="text-center border border-stone-200 px-8 py-8">
          <p className="text-sm text-red-800 mb-4">{error}</p>
          <button onClick={fetchClasses} className="px-4 py-2 bg-stone-900 text-stone-50 text-sm hover:bg-emerald-900 transition-colors">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-stone-50 ledger-root">
      <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-8 space-y-6">

        {/* ---------- Statement header ---------- */}
        <div className="border-b border-stone-300 pb-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="ledger-display text-3xl text-stone-900 tracking-tight">
                {selectedClass ? classInfo?.name : 'Classes'}
              </h1>
              <p className="text-sm text-stone-500 mt-1">
                {selectedClass ? 'Fee balances and payment history for this class.' : 'Every class in your school, its enrollment and how fees are tracking.'}
              </p>
            </div>
            <div className="flex items-center gap-5">
              {!selectedClass && (
                <button
                  onClick={() => setShowAddClassModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-stone-900 text-stone-50 hover:bg-emerald-900 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  Add class
                </button>
              )}
              {selectedClass && (
                <>
                  <div className="flex items-center gap-4 text-sm">
                    <button onClick={() => setViewMode('summary')} className={`pb-0.5 border-b-2 transition-colors ${viewMode === 'summary' ? 'border-emerald-800 text-stone-900' : 'border-transparent text-stone-400 hover:text-stone-600'}`}>Summary</button>
                    <button onClick={() => setViewMode('detailed')} className={`pb-0.5 border-b-2 transition-colors ${viewMode === 'detailed' ? 'border-emerald-800 text-stone-900' : 'border-transparent text-stone-400 hover:text-stone-600'}`}>Detailed</button>
                  </div>
                  <button onClick={handleBackToClasses} className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    All classes
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Add class modal */}
        {showAddClassModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-stone-900/40" onClick={() => setShowAddClassModal(false)} />
            <div className="relative bg-stone-50 border border-stone-200 w-full max-w-sm p-6">
              <p className="ledger-display text-xl text-stone-900 mb-4">Create a new class</p>
              <form onSubmit={handleAddClass} className="space-y-4">
                <div>
                  <label className="block text-xs text-stone-500 mb-1">Class name</label>
                  <input
                    type="text" required autoFocus value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="e.g. Primary 1, Grade 2"
                    className="w-full bg-transparent border-b border-stone-300 focus:border-emerald-800 outline-none px-0.5 py-2 text-sm text-stone-800 placeholder-stone-400 transition-colors"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddClassModal(false)} className="flex-1 py-2 text-sm border border-stone-300 text-stone-700 hover:bg-stone-100 transition-colors">Cancel</button>
                  <button type="submit" disabled={addingClass} className="flex-1 py-2 text-sm bg-stone-900 text-stone-50 hover:bg-emerald-900 disabled:opacity-50 transition-colors">{addingClass ? 'Creating…' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete class modals */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-stone-900/40" onClick={() => setShowDeleteModal(false)} />
            <div className="relative bg-stone-50 border border-stone-200 w-full max-w-md p-6">
              <p className="ledger-display text-xl text-stone-900">Delete class</p>
              <p className="text-sm text-stone-500 mt-2">Delete <span className="font-medium text-stone-800">{classToDelete?.name}</span>? This action is irreversible.</p>
              {classToDelete?.total_students > 0 && (
                <div className="border-l-2 border-amber-700 bg-amber-50 pl-3 pr-3 py-2 mt-4">
                  <p className="text-xs text-amber-900">{classToDelete.total_students} student{classToDelete.total_students === 1 ? '' : 's'} will be affected.</p>
                </div>
              )}
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2 text-sm border border-stone-300 text-stone-700 hover:bg-stone-100 transition-colors">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 py-2 text-sm bg-red-800 text-stone-50 hover:bg-red-900 transition-colors">Delete</button>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-stone-900/50" />
            <div className="relative bg-stone-50 border border-stone-200 w-full max-w-md p-6">
              <p className="ledger-display text-xl text-red-800">Final warning</p>
              <p className="text-sm text-stone-600 mt-2">You are about to permanently delete <span className="font-medium text-stone-800">{classToDelete?.name}</span> and all its students, fees, and payment history.</p>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowDeleteConfirmModal(false)} className="flex-1 py-2 text-sm border border-stone-300 text-stone-700 hover:bg-stone-100 transition-colors">Keep class</button>
                <button onClick={handleDeleteClass} disabled={deletingClass} className="flex-1 py-2 text-sm bg-red-800 text-stone-50 hover:bg-red-900 disabled:opacity-50 transition-colors">{deletingClass ? 'Deleting…' : 'Delete permanently'}</button>
              </div>
            </div>
          </div>
        )}

        {!selectedClass ? (
          <ClassOverviewDashboard
            classes={classes}
            onClassSelect={handleClassSelect}
            onAddClass={() => setShowAddClassModal(true)}
            onDeleteClass={openDeleteModal}
            globalPaymentSummary={globalPaymentSummary}
            loadingSummary={loadingSummary}
          />
        ) : (
          <StudentDetailsView
            students={filteredStudents}
            allStudents={students}
            loading={loadingStudents}
            expandedStudent={expandedStudent}
            onToggleExpansion={toggleStudentExpansion}
            onRefresh={() => fetchStudentsByClass(selectedClass.id)}
            searchTerm={searchTerm}
            onSearchChange={(e) => setSearchTerm(e.target.value)}
            onClearSearch={() => setSearchTerm('')}
            getPaymentStatus={getStudentPaymentStatus}
          />
        )}
      </div>
    </div>
  );
};

// --- Class Overview: KPI strip, both charts (restyled), class grid ---
const ClassOverviewDashboard = ({ classes, onClassSelect, onAddClass, onDeleteClass, globalPaymentSummary, loadingSummary }) => {
  const totalStats = {
    classes: classes.length,
    students: classes.reduce((sum, c) => sum + c.total_students, 0),
    due: classes.reduce((sum, c) => sum + c.total_due, 0),
    paid: classes.reduce((sum, c) => sum + c.total_paid, 0),
    balance: classes.reduce((sum, c) => sum + c.total_balance, 0),
  };

  const pieData = [
    { name: 'Fully paid', value: globalPaymentSummary.paid, color: '#047857' },
    { name: 'Partial', value: globalPaymentSummary.partial, color: '#d97706' },
    { name: 'Unpaid', value: globalPaymentSummary.unpaid, color: '#991b1b' },
  ].filter(d => d.value > 0);

  const collectionData = classes.map(c => ({
    name: c.name.length > 10 ? c.name.slice(0, 8) + '…' : c.name,
    rate: c.collection_rate
  }));

  return (
    <div className="space-y-6">
      {/* Big number + inline KPI strip */}
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 border-b border-stone-200 pb-6">
        <div>
          <p className="text-xs text-stone-500">Total collected across all classes</p>
          <p className="ledger-display ledger-mono text-4xl md:text-5xl text-emerald-900 mt-1 tabular-nums">
            {formatMoney(totalStats.paid)}
          </p>
        </div>
        <div className="flex flex-wrap items-center divide-x divide-stone-300">
          <div className="px-4 first:pl-0">
            <p className="ledger-mono text-lg text-stone-800 tabular-nums">{totalStats.classes}</p>
            <p className="text-xs text-stone-500">Classes</p>
          </div>
          <div className="px-4">
            <p className="ledger-mono text-lg text-stone-800 tabular-nums">{totalStats.students}</p>
            <p className="text-xs text-stone-500">Students</p>
          </div>
          <div className="px-4">
            <p className="ledger-mono text-lg text-amber-800 tabular-nums">{formatMoney(totalStats.balance)}</p>
            <p className="text-xs text-stone-500">Outstanding</p>
          </div>
        </div>
      </div>

      {/* Charts: Payment distribution + Collection rate by class */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-sm font-medium text-stone-700">Payment distribution, all classes</h3>
            {loadingSummary && <span className="text-xs text-stone-400 ledger-mono">updating…</span>}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={2} stroke="none">
                {pieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(val) => `${val} students`} contentStyle={{ fontSize: '11px', border: '1px solid #e7e5e4', borderRadius: 0, boxShadow: 'none' }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-sm font-medium text-stone-700 mb-3">Collection rate by class</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={collectionData} margin={{ top: 6, right: 6, left: -6, bottom: 0 }}>
              <defs>
                <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#047857" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#047857" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#e7e5e4" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#78716c' }} axisLine={{ stroke: '#d6d3d1' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#78716c' }} unit="%" axisLine={false} tickLine={false} width={34} />
              <Tooltip formatter={(val) => `${val.toFixed(1)}%`} contentStyle={{ fontSize: '11px', border: '1px solid #e7e5e4', borderRadius: 0, boxShadow: 'none' }} />
              <Area type="monotone" dataKey="rate" stroke="#047857" fill="url(#rateGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Class grid */}
      <div>
        <h3 className="text-sm font-medium text-stone-700 mb-3">All classes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={onAddClass}
            className="flex flex-col items-center justify-center gap-2 border border-dashed border-stone-300 hover:border-emerald-800 p-4 min-h-[190px] transition-colors text-stone-500 hover:text-emerald-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            <p className="text-sm font-medium">Add new class</p>
            <p className="text-xs text-center text-stone-400">Create a class to manage students and fees</p>
          </button>

          {classes.map((cls) => (
            <div key={cls.id} className="group relative border border-stone-200 hover:border-stone-400 bg-white p-4 transition-colors">
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteClass(cls); }}
                className="absolute top-3 right-3 text-xs text-stone-300 hover:text-red-800 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Delete
              </button>
              <div onClick={() => onClassSelect(cls)} className="cursor-pointer">
                <div className="flex justify-between items-baseline pr-10">
                  <h4 className="font-medium text-sm text-stone-800">{cls.name}</h4>
                  <span className="text-xs text-stone-400">{cls.total_students} students</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-xs ledger-mono tabular-nums">
                  <div><p className="text-stone-400 font-sans">Due</p><p className="text-stone-800">{formatMoney(cls.total_due)}</p></div>
                  <div><p className="text-stone-400 font-sans">Paid</p><p className="text-emerald-800">{formatMoney(cls.total_paid)}</p></div>
                  <div><p className="text-stone-400 font-sans">Balance</p><p className={cls.total_balance > 0 ? 'text-amber-800' : 'text-emerald-800'}>{formatMoney(cls.total_balance)}</p></div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1 text-stone-500"><span>Collection</span><span className="ledger-mono text-stone-700">{cls.collection_rate.toFixed(0)}%</span></div>
                  <div className="h-[3px] w-full bg-stone-200 overflow-hidden">
                    <div className="h-full bg-emerald-800" style={{ width: `${Math.min(cls.collection_rate, 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {classes.length === 0 && (
            <div className="col-span-full text-center py-14 border border-stone-200">
              <p className="text-sm text-stone-500">No classes yet — add one to begin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Student Details View ---
const StudentDetailsView = ({ students, allStudents, loading, expandedStudent, onToggleExpansion, onRefresh, searchTerm, onSearchChange, onClearSearch, getPaymentStatus }) => {
  if (loading) return (<div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-stone-300 border-t-emerald-800 rounded-full animate-spin"></div></div>);

  const classSummary = allStudents.reduce((acc, s) => {
    acc.totalDue += s.total_due || 0;
    acc.totalPaid += s.total_paid || 0;
    acc.totalBalance += s.total_balance || 0;
    const status = getPaymentStatus(s);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, { totalDue: 0, totalPaid: 0, totalBalance: 0, paid: 0, partial: 0, unpaid: 0 });

  return (
    <div className="space-y-6">
      {/* Inline KPI strip incl. status breakdown */}
      <div className="flex flex-wrap items-center divide-x divide-stone-300 border-b border-stone-200 pb-5">
        {[
          { label: 'Students', value: allStudents.length },
          { label: 'Total due', value: formatMoney(classSummary.totalDue) },
          { label: 'Collected', value: formatMoney(classSummary.totalPaid), color: 'text-emerald-800' },
          { label: 'Outstanding', value: formatMoney(classSummary.totalBalance), color: 'text-amber-800' },
        ].map((item, idx) => (
          <div key={idx} className="px-4 first:pl-0 py-1">
            <p className={`ledger-mono text-lg tabular-nums ${item.color || 'text-stone-800'}`}>{item.value}</p>
            <p className="text-xs text-stone-500">{item.label}</p>
          </div>
        ))}
        <div className="px-4 py-1 flex items-center gap-3">
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <span key={key} className="inline-flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`}></span>
              <span className="text-xs text-stone-600 ledger-mono">{classSummary[key] || 0}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Search & Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full max-w-sm">
          <svg className="absolute left-0 top-2 h-3.5 w-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" value={searchTerm} onChange={onSearchChange} placeholder="Search students…" className="w-full pl-6 pr-6 py-1.5 text-sm bg-transparent border-b border-stone-300 focus:border-emerald-800 outline-none transition-colors" />
          {searchTerm && <button onClick={onClearSearch} className="absolute right-0 top-1.5 text-stone-400 hover:text-stone-700 text-xs">Clear</button>}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-stone-400">{students.length} / {allStudents.length} shown</span>
          <button onClick={onRefresh} className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Student table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-t border-stone-300">
          <thead>
            <tr className="text-xs text-stone-500 border-b border-stone-300">
              <th className="text-left font-normal py-2 pr-3">Student</th>
              <th className="text-left font-normal py-2 pr-3">ID</th>
              <th className="text-left font-normal py-2 pr-3">Parent</th>
              <th className="text-right font-normal py-2 pr-3">Due</th>
              <th className="text-right font-normal py-2 pr-3">Paid</th>
              <th className="text-right font-normal py-2 pr-3">Balance</th>
              <th className="text-left font-normal py-2 pr-3">Status</th>
              <th className="text-right font-normal py-2">Fees</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const meta = STATUS_META[getPaymentStatus(student)];
              return (
                <React.Fragment key={student.id}>
                  <tr className="border-b border-stone-100 hover:bg-stone-100/60 transition-colors">
                    <td className="py-2.5 pr-3">
                      <div className="font-medium text-stone-800">{student.first_name} {student.last_name}</div>
                      {student.other_names && <div className="text-xs text-stone-400">{student.other_names}</div>}
                    </td>
                    <td className="py-2.5 pr-3 ledger-mono text-xs text-stone-500">{student.student_id} · PIN {student.pin}</td>
                    <td className="py-2.5 pr-3">
                      <div className="text-xs text-stone-700">{student.parent_name}</div>
                      <div className="text-xs text-stone-400">{student.parent_contact}</div>
                    </td>
                    <td className="py-2.5 pr-3 text-right ledger-mono tabular-nums text-stone-700">{formatMoney(student.total_due)}</td>
                    <td className="py-2.5 pr-3 text-right ledger-mono tabular-nums text-emerald-800">{formatMoney(student.total_paid)}</td>
                    <td className="py-2.5 pr-3 text-right ledger-mono tabular-nums">
                      <span className={student.total_balance > 0 ? 'text-amber-800' : 'text-emerald-800'}>{formatMoney(Math.abs(student.total_balance))}</span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`}></span>
                        <span className={`text-xs ${meta.text}`}>{meta.label}</span>
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <button onClick={() => onToggleExpansion(student.id)} className="text-xs text-emerald-900 hover:text-emerald-700 transition-colors">
                        {expandedStudent === student.id ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>
                  {expandedStudent === student.id && (
                    <tr><td colSpan="8" className="pb-4 bg-stone-100/50 px-3"><StudentFeeExpanded student={student} /></td></tr>
                  )}
                </React.Fragment>
              );
            })}
            {students.length === 0 && (
              <tr><td colSpan="8" className="text-center py-14 text-stone-400 text-sm">No students match your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StudentFeeExpanded = ({ student }) => {
  const groupedFees = student.student_fees?.reduce((groups, fee) => {
    const key = `${fee.academic_year}-${fee.term}`;
    if (!groups[key]) groups[key] = { academic_year: fee.academic_year, term: fee.term, fees: [], total_due: 0, total_paid: 0, total_balance: 0 };
    groups[key].fees.push(fee);
    groups[key].total_due += parseFloat(fee.amount_due || 0);
    groups[key].total_paid += parseFloat(fee.amount_paid || 0);
    groups[key].total_balance += parseFloat(fee.balance || 0);
    return groups;
  }, {}) || {};

  return (
    <div className="pt-2 space-y-3">
      <p className="text-xs font-medium text-stone-500">Fee breakdown</p>
      {Object.values(groupedFees).map((group, idx) => (
        <div key={idx} className="border border-stone-200 bg-white p-3">
          <div className="flex justify-between text-xs font-medium text-stone-700">
            <span>{group.academic_year} · {group.term}</span>
            <span className="ledger-mono">Due {formatMoney(group.total_due)} — Paid {formatMoney(group.total_paid)}</span>
          </div>
          <div className="mt-2 space-y-1.5">
            {group.fees.map(fee => (
              <div key={fee.id} className="flex justify-between text-xs border-t border-stone-100 pt-1.5">
                <span className="text-stone-600">{fee.fee_item?.name}</span>
                <span className={`ledger-mono ${fee.balance > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>{formatMoney(Math.abs(fee.balance))}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Inject fonts + base ledger styling (only once, shared with other ledger pages)
if (!document.getElementById('classes-ledger-styles')) {
  const style = document.createElement('style');
  style.id = 'classes-ledger-styles';
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
    .ledger-root { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; animation: ledgerFadeIn 0.35s ease-out; }
    .ledger-display { font-family: 'Fraunces', serif; font-weight: 500; }
    .ledger-mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
    @keyframes ledgerFadeIn { from { opacity: 0; } to { opacity: 1; } }
  `;
  document.head.appendChild(style);
}

export default ClassesPage;