// src/pages/StudentsPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

// --- Helper Functions ---
const getPaymentStatus = (student) => {
  if (student.total_balance <= 0) return 'paid';
  if (student.total_paid > 0) return 'partial';
  return 'unpaid';
};

const getStatusColor = (status) => {
  switch (status) {
    case 'paid': return 'bg-emerald-100 text-emerald-800';
    case 'partial': return 'bg-amber-100 text-amber-800';
    case 'unpaid': return 'bg-rose-100 text-rose-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

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
      <div className="flex items-center justify-center h-96">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          <p className="mt-4 text-sm text-gray-500 animate-pulse">Loading intelligence...</p>
        </div>
      </div>
    );
  }

  if (error && !selectedClass) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center glass-card p-8 rounded-2xl">
          <div className="text-rose-500 mb-4 text-sm">{error}</div>
          <button onClick={fetchClasses} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-indigo-500/20 transition-all">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fadeInUp p-4 md:p-5 max-w-[1600px] mx-auto">
      {/* Header - Compact & Sleek */}
      <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-2xl p-4 transition-all duration-500">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-100/30 to-transparent rounded-full blur-3xl -z-0" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              {selectedClass ? `🎓 ${classInfo?.name}` : '📊 Student Intelligence Hub'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5 tracking-wide">
              {selectedClass ? 'Deep dive analytics & fee breakdown' : 'Select a class to explore granular insights'}
            </p>
          </div>
          {selectedClass && (
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100/80 rounded-lg p-0.5 backdrop-blur-sm">
                <button onClick={() => setViewMode('summary')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'summary' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>Summary</button>
                <button onClick={() => setViewMode('detailed')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'detailed' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>Detailed</button>
              </div>
              <button onClick={handleBackToClasses} className="group flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-900/5 hover:bg-gray-900/10 rounded-xl transition-all duration-300">
                <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                <span>Back to Classes</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modals (unchanged logic, sleek styling) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl p-5 animate-scaleUp">
            <div className="flex items-center justify-center w-10 h-10 mx-auto bg-rose-100 rounded-full"><svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg></div>
            <h3 className="text-base font-semibold text-center mt-3">Delete Student</h3>
            <p className="text-xs text-gray-500 text-center mt-1">Remove <span className="font-medium">{studentToDelete?.first_name} {studentToDelete?.last_name}</span> permanently.</p>
            {studentToDelete?.student_fees?.length > 0 && <div className="bg-rose-50 rounded-xl p-3 my-4 text-xxs text-rose-700">⚠️ {studentToDelete.student_fees.length} fee records will be lost.</div>}
            <div className="flex gap-3 mt-4"><button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2 text-xs font-medium bg-gray-100 rounded-xl">Cancel</button><button onClick={confirmDelete} className="flex-1 py-2 text-xs font-medium bg-rose-600 text-white rounded-xl shadow">Delete</button></div>
          </div>
        </div>
      )}

      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl animate-scaleUp">
            <h3 className="text-base font-bold text-center">⚠️ Final Confirmation</h3>
            <p className="text-xs text-gray-600 text-center mt-2">Deleting <b>{studentToDelete?.first_name} {studentToDelete?.last_name}</b> will erase all associated data. This is irreversible.</p>
            <div className="flex gap-3 mt-6"><button onClick={() => {setShowDeleteConfirmModal(false); setStudentToDelete(null);}} className="flex-1 py-2 text-xs bg-gray-100 rounded-xl">Cancel</button><button onClick={handleDeleteStudent} disabled={deletingStudent} className="flex-1 py-2 text-xs bg-rose-600 text-white rounded-xl shadow disabled:opacity-50">{deletingStudent ? 'Deleting...' : 'Permanently Delete'}</button></div>
          </div>
        </div>
      )}

      {!selectedClass ? (
        <ClassOverviewDashboard classes={classes} onClassSelect={handleClassSelect} error={error} />
      ) : (
        <StudentDetailsEnhanced
          students={filteredStudents}
          allStudents={students}
          classInfo={classInfo}
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
          getStatusColor={getStatusColor}
        />
      )}
    </div>
  );
};

// --- Class Overview with Charts & Graph Cards ---
const ClassOverviewDashboard = ({ classes, onClassSelect, error }) => {
  const totalAggregate = classes.reduce((acc, cls) => ({
    totalDue: acc.totalDue + cls.total_due,
    totalPaid: acc.totalPaid + cls.total_paid,
    totalBalance: acc.totalBalance + cls.total_balance,
    totalStudents: acc.totalStudents + cls.total_students,
  }), { totalDue: 0, totalPaid: 0, totalBalance: 0, totalStudents: 0 });

  const chartData = classes.map(cls => ({ name: cls.name.length > 12 ? cls.name.slice(0,10)+'..' : cls.name, Due: cls.total_due, Paid: cls.total_paid, Balance: cls.total_balance }));

  const collectionData = classes.map(cls => ({ name: cls.name.slice(0,10), Rate: cls.collection_rate }));

  if (error) return <div className="text-center text-rose-500 p-8 bg-white/50 rounded-2xl">{error}</div>;

  return (
    <div className="space-y-5 animate-fadeInUp">
      {/* KPI Strip - Ultra compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total Classes" value={classes.length} icon="🏛️" trend="active" />
        <MetricCard label="Total Students" value={totalAggregate.totalStudents} icon="👥" trend="enrolled" />
        <MetricCard label="Total Revenue" value={`GH₵${totalAggregate.totalPaid.toFixed(1)}k`} icon="💰" trend="+12%" />
        <MetricCard label="Outstanding" value={`GH₵${totalAggregate.totalBalance.toFixed(1)}k`} icon="⚖️" trend="attention" />
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="glass-card rounded-2xl p-4 transition-all duration-300 hover:shadow-xl">
          <div className="flex items-center justify-between mb-2"><h3 className="text-sm font-semibold text-gray-700">📊 Financial Overview by Class</h3><span className="text-xxs text-gray-400">GH₵</span></div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} width={35} />
              <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px', border: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="Due" stackId="a" fill="#94a3b8" radius={[4,4,0,0]} />
              <Bar dataKey="Paid" stackId="a" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="Balance" stackId="a" fill="#f97316" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card rounded-2xl p-4 transition-all duration-300 hover:shadow-xl">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">📈 Collection Rate Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={collectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs><linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="%" />
              <Tooltip formatter={(value) => `${value.toFixed(1)}%`} contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
              <Area type="monotone" dataKey="Rate" stroke="#6366f1" fillOpacity={1} fill="url(#colorRate)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Class Grid - Smaller fonts, animated cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls, idx) => (
          <div key={cls.id} onClick={() => onClassSelect(cls)} className="group cursor-pointer bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-indigo-100/50 transition-all duration-300 hover:-translate-y-1 animate-scaleUp" style={{animationDelay: `${idx * 50}ms`}}>
            <div className="flex justify-between items-start"><h4 className="font-semibold text-sm text-gray-800 group-hover:text-indigo-600 transition">{cls.name}</h4><span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xxs rounded-full">{cls.total_students} std</span></div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-xxs">
              <div><p className="text-gray-400">Due</p><p className="font-semibold">GH₵{cls.total_due.toFixed(0)}</p></div>
              <div><p className="text-gray-400">Paid</p><p className="font-semibold text-emerald-600">GH₵{cls.total_paid.toFixed(0)}</p></div>
              <div><p className="text-gray-400">Balance</p><p className="font-semibold text-amber-600">GH₵{cls.total_balance.toFixed(0)}</p></div>
            </div>
            <div className="mt-3"><div className="flex justify-between text-xxs mb-0.5"><span>Collection</span><span className="font-medium">{cls.collection_rate.toFixed(0)}%</span></div><div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-700" style={{ width: `${Math.min(cls.collection_rate, 100)}%` }}></div></div></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, icon, trend }) => (
  <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-100 shadow-sm transition-all hover:shadow-md">
    <div className="flex items-center justify-between"><span className="text-lg">{icon}</span><span className="text-xxs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{trend}</span></div>
    <p className="text-xs text-gray-500 mt-1">{label}</p>
    <p className="text-lg font-bold text-gray-800 leading-tight">{value}</p>
  </div>
);

// --- Enhanced Student Details with Charts & Animations ---
const StudentDetailsEnhanced = ({
  students, allStudents, classInfo, loading, viewMode, expandedStudent, onToggleExpansion,
  onDeleteStudent, onRefresh, searchTerm, onSearchChange, onClearSearch, getPaymentStatus, getStatusColor
}) => {
  if (loading) return (<div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div></div>);

  const classSummary = allStudents.reduce((acc, s) => {
    acc.totalDue += s.total_due || 0;
    acc.totalPaid += s.total_paid || 0;
    acc.totalBalance += s.total_balance || 0;
    const status = getPaymentStatus(s);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, { totalDue: 0, totalPaid: 0, totalBalance: 0, paid: 0, partial: 0, unpaid: 0 });

  const statusChartData = [
    { name: 'Fully Paid', value: classSummary.paid, color: '#10b981' },
    { name: 'Partial', value: classSummary.partial, color: '#f59e0b' },
    { name: 'Unpaid', value: classSummary.unpaid, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const topDebtors = [...allStudents].sort((a,b) => b.total_balance - a.total_balance).slice(0, 6).map(s => ({ name: `${s.first_name} ${s.last_name?.charAt(0)}.`, balance: s.total_balance }));

  return (
    <div className="space-y-5 animate-fadeInUp">
      {/* Compact Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <StatCard label="Students" value={allStudents.length} icon="👩‍🎓" />
        <StatCard label="Total Due" value={`GH₵${classSummary.totalDue.toFixed(0)}`} icon="📋" />
        <StatCard label="Collected" value={`GH₵${classSummary.totalPaid.toFixed(0)}`} icon="✅" color="text-emerald-600" />
        <StatCard label="Outstanding" value={`GH₵${classSummary.totalBalance.toFixed(0)}`} icon="⚠️" color="text-amber-600" />
        <StatCard label="Fully Paid" value={classSummary.paid} icon="🏆" />
        <StatCard label="Has Balance" value={classSummary.partial + classSummary.unpaid} icon="📉" />
      </div>

      {/* Charts Row: Donut + Bar */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="glass-card rounded-xl p-3 transition-all duration-300">
          <h3 className="text-xs font-semibold text-gray-600 mb-1">Payment Status Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusChartData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} stroke="none">
                {statusChartData.map((entry, idx) => <Cell key={`cell-${idx}`} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(val) => `${val} students`} contentStyle={{ fontSize: '10px', borderRadius: '12px' }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '9px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card rounded-xl p-3 transition-all duration-300">
          <h3 className="text-xs font-semibold text-gray-600 mb-1">⚡ Top Outstanding Balances</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={topDebtors} layout="vertical" margin={{ left: 30, right: 10 }}>
              <XAxis type="number" tick={{ fontSize: 9 }} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={50} axisLine={false} />
              <Tooltip formatter={(val) => `GH₵${val.toFixed(0)}`} />
              <Bar dataKey="balance" fill="#f97316" radius={[0, 8, 8, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Search & Controls */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/30 p-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full max-w-sm">
            <svg className="absolute left-3 top-2 h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" value={searchTerm} onChange={onSearchChange} placeholder="Search by name, ID, parent..." className="w-full pl-8 pr-8 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-indigo-200 focus:border-indigo-300" />
            {searchTerm && <button onClick={onClearSearch} className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600">✕</button>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xxs text-gray-500">{students.length} / {allStudents.length} shown</span>
            <button onClick={onRefresh} className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
          </div>
        </div>
      </div>

      {/* Student Table - Compact, enhanced */}
      <div className="bg-white/90 rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xxs">
            <thead className="bg-gray-50/80 text-gray-500 text-xxs">
              <tr><th className="px-4 py-2 text-left font-medium">Student</th><th className="px-4 py-2 text-left font-medium">ID</th><th className="px-4 py-2 text-left font-medium">Parent</th><th className="px-4 py-2 text-right font-medium">Due</th><th className="px-4 py-2 text-right font-medium">Paid</th><th className="px-4 py-2 text-right font-medium">Balance</th><th className="px-4 py-2 text-center font-medium">Status</th><th className="px-4 py-2 text-center font-medium">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((student, idx) => (
                <React.Fragment key={student.id}>
                  <tr className="hover:bg-indigo-50/30 transition-all duration-150 group animate-fadeIn" style={{animationDelay: `${idx * 20}ms`}}>
                    <td className="px-4 py-2.5 whitespace-nowrap"><div className="font-medium text-gray-800 text-xs">{student.first_name} {student.last_name}</div>{student.other_names && <div className="text-xxs text-gray-400">{student.other_names}</div>}</td>
                    <td className="px-4 py-2.5 text-xxs text-gray-500">{student.student_id} PIN-{student.pin}</td>
                    <td className="px-4 py-2.5"><div className="text-xxs">{student.parent_name}</div><div className="text-xxs text-gray-400">{student.parent_contact}</div></td>
                    <td className="px-4 py-2.5 text-right text-xs">GH₵{student.total_due?.toFixed(0)}</td>
                    <td className="px-4 py-2.5 text-right text-emerald-600 text-xs">GH₵{student.total_paid?.toFixed(0)}</td>
                    <td className="px-4 py-2.5 text-right"><span className={`text-xs font-medium ${student.total_balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>GH₵{Math.abs(student.total_balance).toFixed(0)}</span></td>
                    <td className="px-4 py-2.5 text-center"><span className={`inline-flex px-2 py-0.5 rounded-full text-xxs font-medium ${getStatusColor(getPaymentStatus(student))}`}>{getPaymentStatus(student)}</span></td>
                    <td className="px-4 py-2.5 text-center"><div className="flex justify-center gap-2"><button onClick={() => onToggleExpansion(student.id)} className="text-indigo-500 hover:text-indigo-700 transition"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expandedStudent === student.id ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} /></svg></button><button onClick={() => onDeleteStudent(student)} className="text-rose-400 hover:text-rose-600 transition"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></div></td>
                  </tr>
                  {expandedStudent === student.id && (
                    <tr><td colSpan="8" className="px-4 py-3 bg-gray-50/50"><StudentFeeExpanded student={student} /></td></tr>
                  )}
                </React.Fragment>
              ))}
              {students.length === 0 && (<tr><td colSpan="8" className="text-center py-12 text-gray-400 text-xs">✨ No students match your criteria</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color = "text-gray-800" }) => (
  <div className="bg-white/80 rounded-xl p-2.5 border border-white/20 shadow-sm transition-all hover:shadow-md">
    <div className="flex justify-between items-start"><span className="text-base">{icon}</span><span className="text-xxs text-gray-400">⏺</span></div>
    <p className="text-[11px] text-gray-500 mt-1">{label}</p>
    <p className={`text-sm font-bold leading-tight ${color}`}>{value}</p>
  </div>
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

  return (<div className="space-y-2"><h4 className="text-xs font-semibold text-gray-600">📑 Fee Breakdown</h4>{Object.values(groupedFees).map((group, idx) => (<div key={idx} className="bg-white rounded-lg border p-2 shadow-sm"><div className="flex justify-between text-xxs font-medium"><span>{group.academic_year} - {group.term}</span><span>Due: GH₵{group.total_due.toFixed(0)} | Paid: GH₵{group.total_paid.toFixed(0)}</span></div><div className="mt-1 space-y-1">{group.fees.map(fee => (<div key={fee.id} className="flex justify-between text-xxs border-t pt-1"><span>{fee.fee_item?.name}</span><span className={fee.balance > 0 ? 'text-amber-600' : 'text-emerald-600'}>Bal: GH₵{Math.abs(fee.balance).toFixed(0)}</span></div>))}</div></div>))}</div>);
};

// Add these global animations via style or tailwind config; adding style tag for brevity
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes scaleUp { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
  .animate-fadeInUp { animation: fadeInUp 0.4s ease-out forwards; }
  .animate-scaleUp { animation: scaleUp 0.25s ease-out forwards; }
  .glass-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.4); }
  .text-xxs { font-size: 0.65rem; line-height: 1rem; }
`;
document.head.appendChild(style);

export default StudentsPage;