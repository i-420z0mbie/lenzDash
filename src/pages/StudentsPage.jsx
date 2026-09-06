// src/pages/StudentsPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

// --- Helper Functions ---
const getPaymentStatus = (student) => {
  if (student.total_balance <= 0) return 'paid';
  if (student.total_paid > 0) return 'partial';
  return 'unpaid';
};

const STATUS_META = {
  paid: { label: 'Fully paid', dot: 'bg-emerald-700', text: 'text-emerald-800' },
  partial: { label: 'Partial', dot: 'bg-amber-600', text: 'text-amber-800' },
  unpaid: { label: 'Unpaid', dot: 'bg-red-800', text: 'text-red-800' },
};

const StudentsPage = () => {
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(false);

  useEffect(() => { fetchClasses(); }, []);

  useEffect(() => {
    if (students.length > 0) {
      const filtered = students.filter(student => searchStudents(student, searchTerm));
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

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/main/class-overview/');
      setClasses(response.data);
      setError('');
    } catch (err) {
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
    } catch (err) {
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

  const openDeleteModal = (student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setShowDeleteModal(false);
    setShowDeleteConfirmModal(true);
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    setDeletingStudent(true);
    try {
      await api.delete(`/main/students/${studentToDelete.id}/`);
      if (selectedClass) await fetchStudentsByClass(selectedClass.id);
    } catch (err) {
      alert(`Error: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
    } finally {
      setDeletingStudent(false);
      setShowDeleteModal(false);
      setShowDeleteConfirmModal(false);
      setStudentToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-stone-50">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-stone-300 border-t-emerald-800 rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-xs text-stone-400 ledger-mono">Opening the register…</p>
        </div>
      </div>
    );
  }

  if (error && !selectedClass) {
    return (
      <div className="flex items-center justify-center h-96 bg-stone-50">
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
                {selectedClass ? classInfo?.name : 'Students'}
              </h1>
              <p className="text-sm text-stone-500 mt-1">
                {selectedClass ? 'Fee balances and payment history for this class.' : 'Every class, its enrollment and how fee collection is tracking.'}
              </p>
            </div>
            {selectedClass && (
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-4 text-sm">
                  <button onClick={() => setViewMode('summary')} className={`pb-0.5 border-b-2 transition-colors ${viewMode === 'summary' ? 'border-emerald-800 text-stone-900' : 'border-transparent text-stone-400 hover:text-stone-600'}`}>Summary</button>
                  <button onClick={() => setViewMode('detailed')} className={`pb-0.5 border-b-2 transition-colors ${viewMode === 'detailed' ? 'border-emerald-800 text-stone-900' : 'border-transparent text-stone-400 hover:text-stone-600'}`}>Detailed</button>
                </div>
                <button onClick={handleBackToClasses} className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  All classes
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Delete Modals */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-stone-900/40" onClick={() => setShowDeleteModal(false)} />
            <div className="relative bg-stone-50 border border-stone-200 w-full max-w-md p-6">
              <p className="ledger-display text-xl text-stone-900">Delete student</p>
              <p className="text-sm text-stone-500 mt-2">Remove <span className="font-medium text-stone-800">{studentToDelete?.first_name} {studentToDelete?.last_name}</span> from the register permanently.</p>
              {studentToDelete?.student_fees?.length > 0 && (
                <div className="border-l-2 border-amber-700 bg-amber-50 pl-3 pr-3 py-2 mt-4">
                  <p className="text-xs text-amber-900">{studentToDelete.student_fees.length} fee record{studentToDelete.student_fees.length === 1 ? '' : 's'} will be lost with this student.</p>
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
              <p className="ledger-display text-xl text-red-800">Final confirmation</p>
              <p className="text-sm text-stone-600 mt-2">Deleting <span className="font-medium text-stone-800">{studentToDelete?.first_name} {studentToDelete?.last_name}</span> erases all associated fee and payment data. This cannot be undone.</p>
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setShowDeleteConfirmModal(false); setStudentToDelete(null); }} className="flex-1 py-2 text-sm border border-stone-300 text-stone-700 hover:bg-stone-100 transition-colors">Cancel</button>
                <button onClick={handleDeleteStudent} disabled={deletingStudent} className="flex-1 py-2 text-sm bg-red-800 text-stone-50 hover:bg-red-900 disabled:opacity-50 transition-colors">{deletingStudent ? 'Deleting…' : 'Permanently delete'}</button>
              </div>
            </div>
          </div>
        )}

        {!selectedClass ? (
          <ClassOverviewDashboard classes={classes} onClassSelect={handleClassSelect} error={error} />
        ) : (
          <StudentDetailsEnhanced
            students={filteredStudents}
            allStudents={students}
            loading={loadingStudents}
            viewMode={viewMode}
            expandedStudent={expandedStudent}
            onToggleExpansion={toggleStudentExpansion}
            onDeleteStudent={openDeleteModal}
            onRefresh={() => fetchStudentsByClass(selectedClass.id)}
            searchTerm={searchTerm}
            onSearchChange={(e) => setSearchTerm(e.target.value)}
            onClearSearch={() => setSearchTerm('')}
            getPaymentStatus={getPaymentStatus}
          />
        )}
      </div>
    </div>
  );
};

// --- Class Overview: KPI strip, financial chart, standings, class list ---
const ClassOverviewDashboard = ({ classes, onClassSelect, error }) => {
  const totalAggregate = classes.reduce((acc, cls) => ({
    totalDue: acc.totalDue + cls.total_due,
    totalPaid: acc.totalPaid + cls.total_paid,
    totalBalance: acc.totalBalance + cls.total_balance,
    totalStudents: acc.totalStudents + cls.total_students,
  }), { totalDue: 0, totalPaid: 0, totalBalance: 0, totalStudents: 0 });

  const chartData = classes.map(cls => ({
    name: cls.name.length > 12 ? cls.name.slice(0, 10) + '…' : cls.name,
    Due: cls.total_due, Paid: cls.total_paid, Balance: cls.total_balance
  }));

  if (error) return <div className="text-center text-red-800 p-8 border border-stone-200">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Big number + inline KPI strip, statement-style */}
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 border-b border-stone-200 pb-6">
        <div>
          <p className="text-xs text-stone-500">Total collected across all classes</p>
          <p className="ledger-display ledger-mono text-4xl md:text-5xl text-emerald-900 mt-1 tabular-nums">
            GH₵{totalAggregate.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="flex flex-wrap items-center divide-x divide-stone-300">
          <div className="px-4 first:pl-0">
            <p className="ledger-mono text-lg text-stone-800 tabular-nums">{classes.length}</p>
            <p className="text-xs text-stone-500">Classes</p>
          </div>
          <div className="px-4">
            <p className="ledger-mono text-lg text-stone-800 tabular-nums">{totalAggregate.totalStudents}</p>
            <p className="text-xs text-stone-500">Students</p>
          </div>
          <div className="px-4">
            <p className="ledger-mono text-lg text-amber-800 tabular-nums">GH₵{totalAggregate.totalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            <p className="text-xs text-stone-500">Outstanding</p>
          </div>
        </div>
      </div>

      {/* Financial chart + Collection standings (replaces trend chart) */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-medium text-stone-700 mb-3">Fees by class</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 6, right: 6, left: -6, bottom: 0 }} barGap={4}>
              <CartesianGrid vertical={false} stroke="#e7e5e4" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#78716c' }} axisLine={{ stroke: '#d6d3d1' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} width={42} />
              <Tooltip
                cursor={{ fill: '#f5f5f4' }}
                formatter={(value) => `GH₵${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                contentStyle={{ fontSize: '11px', border: '1px solid #e7e5e4', borderRadius: 0, boxShadow: 'none' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="Due" fill="#a8a29e" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Paid" fill="#047857" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Balance" fill="#b45309" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <CollectionStandings classes={classes} />
      </div>

      {/* Class list */}
      <div>
        <h3 className="text-sm font-medium text-stone-700 mb-3">All classes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => onClassSelect(cls)}
              className="text-left border border-stone-200 hover:border-stone-400 p-4 transition-colors bg-white"
            >
              <div className="flex justify-between items-baseline">
                <h4 className="font-medium text-sm text-stone-800">{cls.name}</h4>
                <span className="text-xs text-stone-400">{cls.total_students} students</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-xs ledger-mono tabular-nums">
                <div><p className="text-stone-400 font-sans">Due</p><p className="text-stone-800">GH₵{cls.total_due.toFixed(0)}</p></div>
                <div><p className="text-stone-400 font-sans">Paid</p><p className="text-emerald-800">GH₵{cls.total_paid.toFixed(0)}</p></div>
                <div><p className="text-stone-400 font-sans">Balance</p><p className="text-amber-800">GH₵{cls.total_balance.toFixed(0)}</p></div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1 text-stone-500"><span>Collection</span><span className="ledger-mono text-stone-700">{cls.collection_rate.toFixed(0)}%</span></div>
                <div className="h-[3px] w-full bg-stone-150 bg-stone-200 overflow-hidden">
                  <div className="h-full bg-emerald-800" style={{ width: `${Math.min(cls.collection_rate, 100)}%` }}></div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Collection standings: a ranked leaderboard (scrollable) ---
const CollectionStandings = ({ classes }) => {
  const ranked = [...classes].sort((a, b) => b.collection_rate - a.collection_rate);
  const avg = classes.length ? classes.reduce((s, c) => s + c.collection_rate, 0) / classes.length : 0;

  const tierOf = (rate) => {
    if (rate >= 85) return { label: 'Leading', dot: 'bg-emerald-700', text: 'text-emerald-800' };
    if (rate >= 60) return { label: 'Steady', dot: 'bg-amber-600', text: 'text-amber-800' };
    return { label: 'Behind', dot: 'bg-red-800', text: 'text-red-800' };
  };

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-medium text-stone-700">Collection standings</h3>
        <span className="text-xs text-stone-400">School average <span className="ledger-mono text-stone-600">{avg.toFixed(0)}%</span></span>
      </div>
      {/* Fixed height + scroll to prevent the list from stretching the page */}
      <div className="h-[260px] overflow-y-auto border-t border-stone-300 pr-1">
        {ranked.map((cls, idx) => {
          const tier = tierOf(cls.collection_rate);
          return (
            <div key={cls.id} className="flex items-center gap-4 py-2.5 border-b border-stone-150 border-b-stone-200">
              <span className="ledger-display text-lg text-stone-300 w-7 shrink-0">{String(idx + 1).padStart(2, '0')}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-stone-800 truncate">{cls.name}</p>
                <p className="text-xs text-stone-400">{cls.total_students} students</p>
              </div>
              <span className="inline-flex items-center gap-1.5 shrink-0">
                <span className={`w-1.5 h-1.5 rounded-full ${tier.dot}`}></span>
                <span className={`text-xs ${tier.text} hidden sm:inline`}>{tier.label}</span>
              </span>
              <span className="ledger-mono text-sm text-stone-800 tabular-nums w-12 text-right shrink-0">{cls.collection_rate.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Enhanced Student Details ---
const StudentDetailsEnhanced = ({
  students, allStudents, loading, viewMode, expandedStudent, onToggleExpansion,
  onDeleteStudent, onRefresh, searchTerm, onSearchChange, onClearSearch, getPaymentStatus
}) => {
  if (loading) return (<div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-stone-300 border-t-emerald-800 rounded-full animate-spin"></div></div>);

  const classSummary = allStudents.reduce((acc, s) => {
    acc.totalDue += s.total_due || 0;
    acc.totalPaid += s.total_paid || 0;
    acc.totalBalance += s.total_balance || 0;
    const status = getPaymentStatus(s);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, { totalDue: 0, totalPaid: 0, totalBalance: 0, paid: 0, partial: 0, unpaid: 0 });

  const statusChartData = [
    { name: 'Fully paid', value: classSummary.paid, color: '#047857' },
    { name: 'Partial', value: classSummary.partial, color: '#d97706' },
    { name: 'Unpaid', value: classSummary.unpaid, color: '#991b1b' },
  ].filter(d => d.value > 0);

  const topDebtors = [...allStudents].sort((a, b) => b.total_balance - a.total_balance).slice(0, 6)
    .map(s => ({ name: `${s.first_name} ${s.last_name?.charAt(0)}.`, balance: s.total_balance }));

  return (
    <div className="space-y-6">
      {/* Inline KPI strip */}
      <div className="flex flex-wrap items-center divide-x divide-stone-300 border-b border-stone-200 pb-5">
        {[
          { label: 'Students', value: allStudents.length },
          { label: 'Total due', value: `GH₵${classSummary.totalDue.toFixed(0)}` },
          { label: 'Collected', value: `GH₵${classSummary.totalPaid.toFixed(0)}`, color: 'text-emerald-800' },
          { label: 'Outstanding', value: `GH₵${classSummary.totalBalance.toFixed(0)}`, color: 'text-amber-800' },
          { label: 'Fully paid', value: classSummary.paid },
          { label: 'Has balance', value: classSummary.partial + classSummary.unpaid },
        ].map((item, idx) => (
          <div key={idx} className="px-4 first:pl-0 py-1">
            <p className={`ledger-mono text-lg tabular-nums ${item.color || 'text-stone-800'}`}>{item.value}</p>
            <p className="text-xs text-stone-500">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row: Donut + Top debtors */}
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-medium text-stone-700 mb-3">Payment status distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusChartData} dataKey="value" cx="50%" cy="50%" innerRadius={44} outerRadius={72} paddingAngle={2} stroke="none">
                {statusChartData.map((entry, idx) => <Cell key={`cell-${idx}`} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(val) => `${val} students`} contentStyle={{ fontSize: '11px', border: '1px solid #e7e5e4', borderRadius: 0 }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-sm font-medium text-stone-700 mb-3">Largest outstanding balances</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topDebtors} layout="vertical" margin={{ left: 30, right: 10 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#78716c' }} width={56} axisLine={false} tickLine={false} />
              <Tooltip formatter={(val) => `GH₵${val.toFixed(0)}`} contentStyle={{ fontSize: '11px', border: '1px solid #e7e5e4', borderRadius: 0 }} />
              <Bar dataKey="balance" fill="#b45309" radius={[0, 2, 2, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Search & Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-stone-200 pb-4">
        <div className="relative w-full max-w-sm">
          <svg className="absolute left-0 top-2 h-3.5 w-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" value={searchTerm} onChange={onSearchChange} placeholder="Search by name, ID, parent…" className="w-full pl-6 pr-6 py-1.5 text-sm bg-transparent border-b border-stone-300 focus:border-emerald-800 outline-none transition-colors" />
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
              <th className="text-right font-normal py-2">Actions</th>
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
                    <td className="py-2.5 pr-3 text-right ledger-mono tabular-nums text-stone-700">GH₵{student.total_due?.toFixed(0)}</td>
                    <td className="py-2.5 pr-3 text-right ledger-mono tabular-nums text-emerald-800">GH₵{student.total_paid?.toFixed(0)}</td>
                    <td className="py-2.5 pr-3 text-right ledger-mono tabular-nums">
                      <span className={student.total_balance > 0 ? 'text-amber-800' : 'text-emerald-800'}>GH₵{Math.abs(student.total_balance).toFixed(0)}</span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`}></span>
                        <span className={`text-xs ${meta.text}`}>{meta.label}</span>
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => onToggleExpansion(student.id)} className="text-xs text-emerald-900 hover:text-emerald-700 transition-colors">
                          {expandedStudent === student.id ? 'Hide fees' : 'View fees'}
                        </button>
                        <button onClick={() => onDeleteStudent(student)} className="text-xs text-red-800 hover:text-red-600 transition-colors">Delete</button>
                      </div>
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
            <span className="ledger-mono">Due GH₵{group.total_due.toFixed(0)} — Paid GH₵{group.total_paid.toFixed(0)}</span>
          </div>
          <div className="mt-2 space-y-1.5">
            {group.fees.map(fee => (
              <div key={fee.id} className="flex justify-between text-xs border-t border-stone-100 pt-1.5">
                <span className="text-stone-600">{fee.fee_item?.name}</span>
                <span className={`ledger-mono ${fee.balance > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>GH₵{Math.abs(fee.balance).toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Inject fonts + base ledger styling (only once, shared with Payment Management)
if (!document.getElementById('students-ledger-styles')) {
  const style = document.createElement('style');
  style.id = 'students-ledger-styles';
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
    .ledger-root { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; animation: ledgerFadeIn 0.35s ease-out; }
    .ledger-display { font-family: 'Fraunces', serif; font-weight: 500; }
    .ledger-mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
    @keyframes ledgerFadeIn { from { opacity: 0; } to { opacity: 1; } }
  `;
  document.head.appendChild(style);
}

export default StudentsPage;