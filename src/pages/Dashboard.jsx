// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import api from '../api'
import StatsGrid from '../components/dashboard/StatsGrid';
import RecentPayments from '../components/dashboard/RecentPayments';
import OutstandingStudents from '../components/dashboard/OutstandingStudents';
import ClassSummary from '../components/dashboard/ClassSummary';
import QuickActions from '../components/dashboard/QuickActions';
import ActiveFeeStructures from '../components/dashboard/ActiveFeeStructures';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);
  const [outstandingStudents, setOutstandingStudents] = useState([]);
  const [classSummary, setClassSummary] = useState([]);
  const [activeFeeStructures, setActiveFeeStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [overviewRes, paymentsRes, studentsRes, classRes, feeStructuresRes, schoolClassesRes] = await Promise.all([
        api.get('/main/dashboard/overview/'),
        api.get('/main/dashboard/recent-payments-grouped/'),
        api.get('/main/dashboard/outstanding-students/'),
        api.get('/main/dashboard/class-summary/'),
        api.get('/main/fee_structure/'),  // Use the new endpoint name
        api.get('/main/school_class/')   // Use the new endpoint name
      ]);

      setStats(overviewRes.data);
      setRecentPayments(paymentsRes.data);
      setOutstandingStudents(studentsRes.data);
      setClassSummary(classRes.data);
      
      // Filter active fee structures and ensure they have proper class data
      const activeStructures = feeStructuresRes.data.filter(structure => 
        structure.is_active && structure.school_class
      );
      setActiveFeeStructures(activeStructures);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Don't show error for permission issues, just log them
      if (error.response?.status !== 403) {
        setError('Failed to load dashboard data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button 
            onClick={fetchDashboardData}
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
            <h1 className="text-2xl font-bold text-gray-900">School Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Comprehensive overview of your school's financial performance and student management
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
            <button 
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Main Stats - Only render if we have stats data */}
      {stats && Object.keys(stats).length > 0 && <StatsGrid stats={stats} />}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="xl:col-span-2 space-y-6">
          {/* Class Performance - Only render if we have class summary data */}
          {classSummary && classSummary.length > 0 && <ClassSummary data={classSummary} />}
          
          {/* Active Fee Structures - Using actual data from API */}
          {activeFeeStructures && activeFeeStructures.length > 0 && (
            <ActiveFeeStructures structures={activeFeeStructures} />
          )}
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Recent Payments - Only render if we have payments data */}
          {recentPayments && recentPayments.length > 0 && <RecentPayments payments={recentPayments} />}
          
          {/* Outstanding Students - Only render if we have outstanding students data */}
          {outstandingStudents && outstandingStudents.length > 0 && (
            <OutstandingStudents students={outstandingStudents} />
          )}
        </div>
      </div>

      {/* Empty state if no data */}
      {(!stats || Object.keys(stats).length === 0) && 
       (!recentPayments || recentPayments.length === 0) && 
       (!outstandingStudents || outstandingStudents.length === 0) && 
       (!classSummary || classSummary.length === 0) &&
       (!activeFeeStructures || activeFeeStructures.length === 0) && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600">There's no data to display on the dashboard yet.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;