// src/pages/StudentsPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';

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

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    // Filter students whenever search term or students change
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

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/main/class-overview/');
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError('Failed to load classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsByClass = async (classId) => {
    try {
      setLoadingStudents(true);
      setError('');
      const response = await api.get(`/main/students-by-class/${classId}/`);
      setStudents(response.data.students);
      setFilteredStudents(response.data.students); // Initialize filtered students
      setClassInfo(response.data.class_info);
      setExpandedStudent(null);
      setSearchTerm(''); // Reset search when class changes
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load students. Please try again.');
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

  const getPaymentStatus = (student) => {
    if (student.total_balance <= 0) return 'paid';
    if (student.total_paid > 0) return 'partial';
    return 'unpaid';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'unpaid': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading classes...</p>
        </div>
      </div>
    );
  }

  if (error && !selectedClass) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button 
            onClick={fetchClasses}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedClass ? `Students - ${classInfo?.name}` : 'Student Management'}
            </h1>
            <p className="text-gray-600 mt-1">
              {selectedClass 
                ? `Comprehensive overview of students and their individual fee items in ${classInfo?.name}`
                : 'Select a class to view students and their detailed fee breakdown'
              }
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {selectedClass && (
              <>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('summary')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      viewMode === 'summary'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Summary
                  </button>
                  <button
                    onClick={() => setViewMode('detailed')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      viewMode === 'detailed'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Detailed
                  </button>
                </div>
                <button
                  onClick={handleBackToClasses}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Back to Classes</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {!selectedClass ? (
        <ClassSelector 
          classes={classes} 
          onClassSelect={handleClassSelect}
          error={error}
        />
      ) : (
        <StudentDetails 
          students={filteredStudents}
          allStudents={students}
          classInfo={classInfo}
          loading={loadingStudents}
          viewMode={viewMode}
          expandedStudent={expandedStudent}
          onToggleExpansion={toggleStudentExpansion}
          onRefresh={() => fetchStudentsByClass(selectedClass.id)}
          getPaymentStatus={getPaymentStatus}
          getStatusColor={getStatusColor}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onClearSearch={clearSearch}
        />
      )}
    </div>
  );
};

// Class Selector Component
const ClassSelector = ({ classes, onClassSelect, error }) => {
  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {classes.map((classItem) => (
        <div
          key={classItem.id}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onClassSelect(classItem)}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{classItem.name}</h3>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              {classItem.total_students} students
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Due</span>
              <span className="text-sm font-semibold">GH₵{classItem.total_due.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Paid</span>
              <span className="text-sm font-semibold text-green-600">GH₵{classItem.total_paid.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Balance</span>
              <span className={`text-sm font-semibold ${
                classItem.total_balance > 0 ? 'text-red-600' : 'text-gray-900'
              }`}>
                GH₵{classItem.total_balance.toFixed(2)}
              </span>
            </div>
            
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Collection Rate</span>
                <span className={`text-sm font-semibold ${
                  classItem.collection_rate >= 80 ? 'text-green-600' : 
                  classItem.collection_rate >= 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {classItem.collection_rate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    classItem.collection_rate >= 80 ? 'bg-green-500' : 
                    classItem.collection_rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(classItem.collection_rate, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              View Students
            </button>
          </div>
        </div>
      ))}
      
      {classes.length === 0 && (
        <div className="col-span-full text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 14l9-5-9-5-9 5 9 5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Available</h3>
          <p className="text-gray-600">There are no classes set up yet.</p>
        </div>
      )}
    </div>
  );
};

// Student Details Component with Search
const StudentDetails = ({ 
  students, 
  allStudents,
  classInfo, 
  loading, 
  viewMode,
  expandedStudent,
  onToggleExpansion,
  onRefresh,
  getPaymentStatus,
  getStatusColor,
  searchTerm,
  onSearchChange,
  onClearSearch
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  const classSummary = allStudents.reduce(
    (summary, student) => {
      summary.totalDue += student.total_due || 0;
      summary.totalPaid += student.total_paid || 0;
      summary.totalBalance += student.total_balance || 0;
      
      const status = getPaymentStatus(student);
      summary[status] = (summary[status] || 0) + 1;
      
      return summary;
    },
    { totalDue: 0, totalPaid: 0, totalBalance: 0, paid: 0, partial: 0, unpaid: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Class Summary */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-600">Total Students</p>
          <p className="text-2xl font-bold text-gray-900">{allStudents.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-600">Total Due</p>
          <p className="text-2xl font-bold text-gray-900">GH₵{classSummary.totalDue.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-600">Total Paid</p>
          <p className="text-2xl font-bold text-green-600">GH₵{classSummary.totalPaid.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-600">Outstanding</p>
          <p className="text-2xl font-bold text-red-600">GH₵{classSummary.totalBalance.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-600">Fully Paid</p>
          <p className="text-2xl font-bold text-green-600">{classSummary.paid}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-600">With Balance</p>
          <p className="text-2xl font-bold text-red-600">{classSummary.partial + classSummary.unpaid}</p>
        </div>
      </div>

      {/* Search Bar and Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={onSearchChange}
                placeholder="Search students by name, ID, or parent..."
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {searchTerm && (
                <button
                  onClick={onClearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600">
              Showing {students.length} of {allStudents.length} students
            </div>
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Search Summary */}
        {searchTerm && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-blue-800">
                  Search results for "{searchTerm}"
                </span>
                <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs font-medium rounded-full">
                  {students.length} found
                </span>
              </div>
              <button
                onClick={onClearSearch}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear search
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Students List</h3>
          <p className="text-sm text-gray-600 mt-1">
            {viewMode === 'summary' ? 'Summary view - click on students to see fee details' : 'Detailed fee breakdown view'}
          </p>
        </div>
        
        {students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parent Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Due
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <StudentRow 
                    key={student.id} 
                    student={student} 
                    viewMode={viewMode}
                    isExpanded={expandedStudent === student.id}
                    onToggleExpansion={onToggleExpansion}
                    getPaymentStatus={getPaymentStatus}
                    getStatusColor={getStatusColor}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            {searchTerm ? (
              <>
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                <p className="text-gray-600">No students match your search criteria.</p>
                <button
                  onClick={onClearSearch}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
                <p className="text-gray-600">There are no students in this class.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Individual Student Row Component with Expandable Fee Details
const StudentRow = ({ student, viewMode, isExpanded, onToggleExpansion, getPaymentStatus, getStatusColor }) => {
  const status = getPaymentStatus(student);
  const statusColor = getStatusColor(status);
  
  // Group fees by academic year and term
  const groupedFees = student.student_fees?.reduce((groups, fee) => {
    const key = `${fee.academic_year}-${fee.term}`;
    if (!groups[key]) {
      groups[key] = {
        academic_year: fee.academic_year,
        term: fee.term,
        fees: [],
        total_due: 0,
        total_paid: 0,
        total_balance: 0
      };
    }
    groups[key].fees.push(fee);
    groups[key].total_due += parseFloat(fee.amount_due || 0);
    groups[key].total_paid += parseFloat(fee.amount_paid || 0);
    groups[key].total_balance += parseFloat(fee.balance || 0);
    return groups;
  }, {}) || {};

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors text-sm text-gray-900">
        {/* Student Name */}
        <td className="px-6 py-4 whitespace-nowrap align-middle">
          <div>
            <div className="font-medium">
              {student.first_name} {student.last_name}
            </div>
            {student.other_names && (
              <div className="text-gray-500">{student.other_names}</div>
            )}
          </div>
        </td>

        {/* Student ID & PIN */}
        <td className="px-6 py-4 whitespace-nowrap align-middle">
          <div>ID - {student.student_id}</div>
          {student.pin && <div>PIN - {student.pin}</div>}
        </td>

        {/* Parent Info */}
        <td className="px-6 py-4 whitespace-nowrap align-middle">
          <div>{student.parent_name}</div>
          <div className="text-gray-500">{student.parent_contact}</div>
        </td>

        {/* Total Due */}
        <td className="px-6 py-4 whitespace-nowrap align-middle text-gray-900">
          GH₵{student.total_due?.toFixed(2) || '0.00'}
        </td>

        {/* Total Paid */}
        <td className="px-6 py-4 whitespace-nowrap align-middle text-green-600">
          GH₵{student.total_paid?.toFixed(2) || '0.00'}
        </td>

        {/* Total Balance */}
        <td className="px-6 py-4 whitespace-nowrap align-middle">
          <span
            className={`font-semibold ${
              student.total_balance > 0 ? 'text-red-600' : 'text-green-600'
            }`}
          >
            GH₵{Math.abs(student.total_balance || 0).toFixed(2)}
          </span>
        </td>

        {/* Status */}
        <td className="px-6 py-4 whitespace-nowrap align-middle">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </td>

        {/* View Details Button */}
        <td className="px-6 py-4 whitespace-nowrap align-middle font-medium">
          <button
            onClick={() => onToggleExpansion(student.id)}
            className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
          >
            <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
            <svg
              className={`w-4 h-4 transform transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </td>
      </tr>

      
      {/* Expanded Fee Details */}
      {isExpanded && (
        <tr>
          <td colSpan="8" className="px-6 py-4 bg-gray-50">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Fee Item Breakdown</h4>
              
              {Object.values(groupedFees).map((group, index) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                    <h5 className="font-medium text-gray-900">
                      {group.academic_year} - {group.term}
                    </h5>
                    <div className="text-sm text-gray-600 flex space-x-4">
                      <span>Due: GH₵{group.total_due.toFixed(2)}</span>
                      <span>Paid: GH₵{group.total_paid.toFixed(2)}</span>
                      <span>Balance: GH₵{group.total_balance.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {group.fees.map((fee) => (
                      <div key={fee.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-gray-900">
                              {fee.fee_item?.name || 'Unknown Fee Item'}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              fee.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                              fee.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {fee.payment_status}
                            </span>
                          </div>
                          {fee.fee_structure && (
                            <div className="text-xs text-gray-500 mt-1">
                              Fee Structure: {fee.fee_structure.name}
                            </div>
                          )}
                        </div>
                        <div className="text-right space-y-1">
                          <div className="text-sm text-gray-900">
                            Due: GH₵{parseFloat(fee.amount_due || 0).toFixed(2)}
                          </div>
                          <div className="text-sm text-green-600">
                            Paid: GH₵{parseFloat(fee.amount_paid || 0).toFixed(2)}
                          </div>
                          <div className={`text-sm font-semibold ${
                            fee.balance > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            Balance: GH₵{Math.abs(parseFloat(fee.balance || 0)).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {student.student_fees?.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No fee items assigned to this student.
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default StudentsPage;