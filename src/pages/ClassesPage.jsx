// src/pages/ClassesPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';

// --- Helper Functions ---
const getStudentPaymentStatus = (student) => {
  if (student.total_balance <= 0) return 'paid';
  if (student.total_paid > 0) return 'partial';
  return 'unpaid';
};

const getStatusColor = (status) => {
  switch (status) {
    case 'paid': return 'bg-emerald-100 text-emerald-800';
    case 'partial': return 'bg-amber-100 text-amber-800';
    case 'unpaid': return 'bg-rose-100 text-rose-800';
    default: return 'bg-slate-100 text-slate-800';
  }
};

const formatMoney = (amount) => `GH₵${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-10 h-10 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="mt-3 text-xxs text-slate-400 animate-pulse">Loading classes...</p>
        </div>
      </div>
    );
  }

  if (error && !selectedClass) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card rounded-2xl p-6 text-center">
          <p className="text-rose-500 text-sm mb-3">{error}</p>
          <button onClick={fetchClasses} className="px-4 py-1.5 bg-indigo-600 text-white text-xs rounded-xl shadow hover:shadow-md transition-all">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 md:p-5 max-w-[1600px] mx-auto animate-fadeInUp">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-white/70 backdrop-blur-sm border border-white/30 shadow-lg p-4">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-indigo-100/40 to-transparent rounded-full blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              {selectedClass ? `🎓 ${classInfo?.name}` : '📚 Class Intelligence'}
            </h1>
            <p className="text-xxs text-slate-500 mt-0.5">
              {selectedClass ? 'Granular student & fee analytics' : 'Overview of all classes, collections & payment distribution'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!selectedClass && (
              <button onClick={() => setShowAddClassModal(true)} className="group relative flex items-center gap-1.5 px-3 py-1.5 text-xxs font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg shadow hover:shadow-md transition-all hover:scale-[1.02]">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                <span>Add Class</span>
              </button>
            )}
            {selectedClass && (
              <>
                <div className="flex bg-slate-100/80 rounded-lg p-0.5">
                  <button onClick={() => setViewMode('summary')} className={`px-2.5 py-1 text-xxs font-medium rounded-md transition-all ${viewMode === 'summary' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Summary</button>
                  <button onClick={() => setViewMode('detailed')} className={`px-2.5 py-1 text-xxs font-medium rounded-md transition-all ${viewMode === 'detailed' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Detailed</button>
                </div>
                <button onClick={handleBackToClasses} className="flex items-center gap-1 px-3 py-1.5 text-xxs bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-all">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  <span>Back</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals - Sleek & Compact */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowAddClassModal(false)} />
          <div className="relative bg-white rounded-xl w-full max-w-sm shadow-2xl p-5 animate-scaleUp">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Create New Class</h3>
            <form onSubmit={handleAddClass} className="space-y-3">
              <input type="text" required value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="e.g., Primary 1, Grade 2" className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-400" />
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowAddClassModal(false)} className="flex-1 py-1.5 text-xs bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={addingClass} className="flex-1 py-1.5 text-xs bg-amber-600 text-white rounded-lg disabled:opacity-50">{addingClass ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-center w-8 h-8 mx-auto bg-rose-100 rounded-full"><svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg></div>
            <h3 className="text-sm font-semibold text-center mt-2">Delete Class</h3>
            <p className="text-xxs text-slate-600 text-center mt-1">Delete <span className="font-medium">{classToDelete?.name}</span>? This action is irreversible.</p>
            {classToDelete?.total_students > 0 && <p className="text-xxs bg-rose-50 text-rose-700 p-2 rounded-lg mt-3">⚠️ {classToDelete.total_students} student(s) will be affected.</p>}
            <div className="flex gap-2 mt-4"><button onClick={() => setShowDeleteModal(false)} className="flex-1 py-1.5 text-xs bg-slate-100 rounded-lg">Cancel</button><button onClick={confirmDelete} className="flex-1 py-1.5 text-xs bg-rose-600 text-white rounded-lg">Delete</button></div>
          </div>
        </div>
      )}

      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-xl max-w-md w-full p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-center">⚠️ Final Warning</h3>
            <p className="text-xxs text-slate-700 text-center mt-2">You are about to permanently delete <b>{classToDelete?.name}</b> and all its students, fees, and payment history.</p>
            <div className="flex gap-2 mt-5"><button onClick={() => setShowDeleteConfirmModal(false)} className="flex-1 py-1.5 text-xs bg-slate-100 rounded-lg">Keep Class</button><button onClick={handleDeleteClass} disabled={deletingClass} className="flex-1 py-1.5 text-xs bg-rose-600 text-white rounded-lg">{deletingClass ? 'Deleting...' : 'Delete Permanently'}</button></div>
          </div>
        </div>
      )}

      {!selectedClass ? (
        <ClassOverviewDashboard classes={classes} onClassSelect={handleClassSelect} onAddClass={() => setShowAddClassModal(true)} onDeleteClass={openDeleteModal} globalPaymentSummary={globalPaymentSummary} loadingSummary={loadingSummary} />
      ) : (
        <StudentDetailsView students={filteredStudents} allStudents={students} classInfo={classInfo} loading={loadingStudents} viewMode={viewMode} expandedStudent={expandedStudent} onToggleExpansion={toggleStudentExpansion} onRefresh={() => fetchStudentsByClass(selectedClass.id)} searchTerm={searchTerm} onSearchChange={(e) => setSearchTerm(e.target.value)} onClearSearch={() => setSearchTerm('')} getPaymentStatus={getStudentPaymentStatus} getStatusColor={getStatusColor} />
      )}
    </div>
  );
};

// --- Class Overview with Charts & Metrics ---
const ClassOverviewDashboard = ({ classes, onClassSelect, onAddClass, onDeleteClass, globalPaymentSummary, loadingSummary }) => {
  const totalStats = {
    classes: classes.length,
    students: classes.reduce((sum, c) => sum + c.total_students, 0),
    due: classes.reduce((sum, c) => sum + c.total_due, 0),
    paid: classes.reduce((sum, c) => sum + c.total_paid, 0),
    balance: classes.reduce((sum, c) => sum + c.total_balance, 0),
  };

  const pieData = [
    { name: 'Fully Paid', value: globalPaymentSummary.paid, color: '#10b981' },
    { name: 'Partial', value: globalPaymentSummary.partial, color: '#f59e0b' },
    { name: 'Unpaid', value: globalPaymentSummary.unpaid, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const collectionData = classes.map(c => ({ name: c.name.length > 10 ? c.name.slice(0,8)+'..' : c.name, rate: c.collection_rate }));

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total Classes" value={totalStats.classes} icon="🏛️" trend="active" />
        <MetricCard label="Enrolled Students" value={totalStats.students} icon="👥" trend="total" />
        <MetricCard label="Collected" value={formatMoney(totalStats.paid)} icon="💰" trend="+ revenue" />
        <MetricCard label="Outstanding" value={formatMoney(totalStats.balance)} icon="⚖️" trend="due" />
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-3 transition-all hover:shadow-md">
          <h3 className="text-xxs font-semibold text-slate-500 mb-2">📊 Payment Distribution (All Classes)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2} stroke="none">
                {pieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(val) => `${val} students`} contentStyle={{ fontSize: '9px', borderRadius: '8px' }} />
              <Legend iconSize={6} wrapperStyle={{ fontSize: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card rounded-xl p-3 transition-all hover:shadow-md">
          <h3 className="text-xxs font-semibold text-slate-500 mb-2">📈 Collection Rate by Class</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={collectionData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs><linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.7}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
              <XAxis dataKey="name" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 8 }} unit="%" />
              <Tooltip formatter={(val) => `${val.toFixed(1)}%`} contentStyle={{ fontSize: '9px' }} />
              <Area type="monotone" dataKey="rate" stroke="#6366f1" fill="url(#rateGrad)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Class Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Add new class tile */}
        <div onClick={onAddClass} className="group cursor-pointer bg-white/60 backdrop-blur-sm border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center transition-all hover:border-amber-300 hover:shadow-md min-h-[220px]">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center group-hover:scale-110 transition"><svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg></div>
          <p className="text-xs font-medium text-slate-600 mt-2">Add New Class</p>
          <p className="text-xxs text-slate-400 text-center mt-1">Create a class to manage students & fees</p>
        </div>

        {classes.map((cls, idx) => (
          <div key={cls.id} className="group relative bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5 animate-fadeIn" style={{animationDelay: `${idx * 40}ms`}}>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"><button onClick={(e) => { e.stopPropagation(); onDeleteClass(cls); }} className="p-1 text-slate-400 hover:text-rose-500 rounded-md"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></div>
            <div onClick={() => onClassSelect(cls)} className="p-4 cursor-pointer">
              <div className="flex justify-between items-start"><h4 className="text-sm font-semibold text-slate-800">{cls.name}</h4><span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-xxs rounded-full">{cls.total_students} std</span></div>
              <div className="grid grid-cols-3 gap-1 mt-3 text-xxs">
                <div><p className="text-slate-400">Due</p><p className="font-medium">{formatMoney(cls.total_due)}</p></div>
                <div><p className="text-slate-400">Paid</p><p className="font-medium text-emerald-600">{formatMoney(cls.total_paid)}</p></div>
                <div><p className="text-slate-400">Balance</p><p className={`font-medium ${cls.total_balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{formatMoney(cls.total_balance)}</p></div>
              </div>
              <div className="mt-3"><div className="flex justify-between text-xxs mb-0.5"><span>Collection</span><span className="font-medium">{cls.collection_rate.toFixed(0)}%</span></div><div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-700" style={{ width: `${Math.min(cls.collection_rate, 100)}%` }}></div></div></div>
            </div>
          </div>
        ))}
        {classes.length === 0 && (<div className="col-span-full text-center py-12 glass-card rounded-xl"><p className="text-sm text-slate-500">No classes yet. Click "Add Class" to begin.</p></div>)}
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, icon, trend }) => (
  <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-white/30 p-3 shadow-sm transition-all hover:shadow">
    <div className="flex items-center justify-between"><span className="text-base">{icon}</span><span className="text-xxs text-emerald-600 bg-emerald-50 px-1.5 rounded-full">{trend}</span></div>
    <p className="text-xxs text-slate-500 mt-1">{label}</p>
    <p className="text-sm font-bold text-slate-800">{value}</p>
  </div>
);

// --- Student Details View (Compact, with expandable fees) ---
const StudentDetailsView = ({ students, allStudents, classInfo, loading, viewMode, expandedStudent, onToggleExpansion, onRefresh, searchTerm, onSearchChange, onClearSearch, getPaymentStatus, getStatusColor }) => {
  if (loading) return (<div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>);

  const classSummary = allStudents.reduce((acc, s) => {
    acc.totalDue += s.total_due || 0;
    acc.totalPaid += s.total_paid || 0;
    acc.totalBalance += s.total_balance || 0;
    const status = getPaymentStatus(s);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, { totalDue: 0, totalPaid: 0, totalBalance: 0, paid: 0, partial: 0, unpaid: 0 });

  const statusChartData = [{ name: 'Paid', value: classSummary.paid, color: '#10b981' }, { name: 'Partial', value: classSummary.partial, color: '#f59e0b' }, { name: 'Unpaid', value: classSummary.unpaid, color: '#ef4444' }].filter(d => d.value > 0);

  return (
    <div className="space-y-4">
      {/* Quick Stats + Mini Donut */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Students" value={allStudents.length} icon="👩‍🎓" />
        <StatCard label="Total Due" value={formatMoney(classSummary.totalDue)} icon="📋" />
        <StatCard label="Collected" value={formatMoney(classSummary.totalPaid)} icon="✅" color="text-emerald-600" />
        <StatCard label="Outstanding" value={formatMoney(classSummary.totalBalance)} icon="⚠️" color="text-amber-600" />
        <div className="bg-white/70 rounded-xl p-2 flex items-center justify-between">
          <div><p className="text-xxs text-slate-500">Payment Status</p><div className="flex gap-1 mt-1 text-xxs"><span className="text-emerald-600">P:{classSummary.paid}</span><span className="text-amber-500">Pa:{classSummary.partial}</span><span className="text-rose-500">U:{classSummary.unpaid}</span></div></div>
          <div className="w-10 h-10 relative"><div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(from 0deg, #10b981 0deg ${(classSummary.paid/allStudents.length||0)*360}deg, #f59e0b ${(classSummary.paid/allStudents.length||0)*360}deg ${((classSummary.paid+classSummary.partial)/allStudents.length||0)*360}deg, #ef4444 ${((classSummary.paid+classSummary.partial)/allStudents.length||0)*360}deg 360deg)` }}></div></div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 flex flex-wrap gap-3 items-center justify-between">
        <div className="relative w-full max-w-xs"><svg className="absolute left-2 top-1.5 h-3 w-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg><input type="text" value={searchTerm} onChange={onSearchChange} placeholder="Search students..." className="w-full pl-7 pr-7 py-1.5 text-xxs border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-300" />{searchTerm && <button onClick={onClearSearch} className="absolute right-2 top-1.5 text-slate-400">✕</button>}</div>
        <div className="flex items-center gap-2"><span className="text-xxs text-slate-500">{students.length}/{allStudents.length}</span><button onClick={onRefresh} className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button></div>
      </div>

      {/* Student Table */}
      <div className="bg-white/80 rounded-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xxs">
            <thead className="bg-slate-50/80 text-slate-500"><tr><th className="px-3 py-2 text-left">Student</th><th className="px-3 py-2 text-left">ID</th><th className="px-3 py-2 text-left">Parent</th><th className="px-3 py-2 text-right">Due</th><th className="px-3 py-2 text-right">Paid</th><th className="px-3 py-2 text-right">Balance</th><th className="px-3 py-2 text-center">Status</th><th className="px-3 py-2 text-center"></th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student, idx) => (
                <React.Fragment key={student.id}>
                  <tr className="hover:bg-slate-50/50 transition-all group animate-fadeIn" style={{animationDelay: `${idx * 20}ms`}}>
                    <td className="px-3 py-2"><div className="font-medium text-slate-800 text-xs">{student.first_name} {student.last_name}</div>{student.other_names && <div className="text-xxs text-slate-400">{student.other_names}</div>}</td>
                    <td className="px-3 py-2 text-xxs text-slate-500">{student.student_id} PIN-{student.pin}</td>
                    <td className="px-3 py-2"><div className="text-xxs">{student.parent_name}</div><div className="text-xxs text-slate-400">{student.parent_contact}</div></td>
                    <td className="px-3 py-2 text-right text-xs">{formatMoney(student.total_due)}</td>
                    <td className="px-3 py-2 text-right text-emerald-600 text-xs">{formatMoney(student.total_paid)}</td>
                    <td className="px-3 py-2 text-right"><span className={`text-xs font-medium ${student.total_balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{formatMoney(Math.abs(student.total_balance))}</span></td>
                    <td className="px-3 py-2 text-center"><span className={`px-1.5 py-0.5 rounded-full text-xxs font-medium ${getStatusColor(getPaymentStatus(student))}`}>{getPaymentStatus(student)}</span></td>
                    <td className="px-3 py-2 text-center"><button onClick={() => onToggleExpansion(student.id)} className="text-indigo-500 hover:text-indigo-700"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expandedStudent === student.id ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} /></svg></button></td>
                  </tr>
                  {expandedStudent === student.id && (<tr><td colSpan="8" className="px-3 py-2 bg-slate-50/70"><StudentFeeExpanded student={student} /></td></tr>)}
                </React.Fragment>
              ))}
              {students.length === 0 && (<tr><td colSpan="8" className="text-center py-10 text-xxs text-slate-400">No students match your search</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color = "text-slate-800" }) => (
  <div className="bg-white/70 rounded-xl p-2 shadow-sm"><div className="flex justify-between items-start"><span className="text-base">{icon}</span><span className="text-xxs text-slate-400">⏺</span></div><p className="text-xxs text-slate-500 mt-1">{label}</p><p className={`text-sm font-bold leading-tight ${color}`}>{value}</p></div>
);

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
  return (<div className="space-y-2"><h4 className="text-xxs font-semibold text-slate-600">📑 Fee Breakdown</h4>{Object.values(groupedFees).map((group, idx) => (<div key={idx} className="bg-white rounded-lg border p-2"><div className="flex justify-between text-xxs"><span>{group.academic_year} - {group.term}</span><span>Due: {formatMoney(group.total_due)} | Paid: {formatMoney(group.total_paid)}</span></div>{group.fees.map(fee => (<div key={fee.id} className="flex justify-between text-xxs border-t mt-1 pt-1"><span>{fee.fee_item?.name}</span><span className={fee.balance > 0 ? 'text-amber-600' : 'text-emerald-600'}>Bal: {formatMoney(Math.abs(fee.balance))}</span></div>))}</div>))}</div>);
};

// Inject global animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes scaleUp { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .animate-fadeInUp { animation: fadeInUp 0.3s ease-out forwards; }
  .animate-scaleUp { animation: scaleUp 0.2s ease-out forwards; }
  .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
  .glass-card { background: rgba(255,255,255,0.6); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.5); }
  .text-xxs { font-size: 0.65rem; line-height: 1rem; }
`;
document.head.appendChild(style);

export default ClassesPage;