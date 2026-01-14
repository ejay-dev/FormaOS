'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface AnalyticsDashboardProps {
  orgId: string;
}

export function AnalyticsDashboard({ orgId }: AnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [orgId]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics?orgId=${orgId}`);
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    const response = await fetch(`/api/analytics/export?orgId=${orgId}`);
    const csv = await response.text();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  const chartData = {
    labels: metrics?.trend?.map((t: any) => t.date) || [],
    datasets: [
      {
        label: 'Completed Tasks',
        data: metrics?.trend?.map((t: any) => t.value) || [],
        fill: true,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgb(59, 130, 246)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Compliance Trend (Last 30 Days)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Analytics Dashboard
        </h2>
        <button
          onClick={exportData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          Export Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Completion Rate */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {metrics?.compliance?.completionRate}%
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            {metrics?.compliance?.activeCertificates}/
            {metrics?.compliance?.totalCertificates} active
          </p>
        </div>

        {/* Active Members */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Members</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {metrics?.team?.activeMembers}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            out of {metrics?.team?.totalMembers} total
          </p>
        </div>

        {/* Risk Score */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Risk Score</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {metrics?.risk?.overall}/100
              </p>
            </div>
            <div
              className={`p-3 rounded-full ${metrics?.risk?.overall > 50 ? 'bg-red-100' : 'bg-yellow-100'}`}
            >
              <AlertTriangle
                className={`h-6 w-6 ${metrics?.risk?.overall > 50 ? 'text-red-600' : 'text-yellow-600'}`}
              />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            {metrics?.risk?.overall < 30
              ? 'Low risk'
              : metrics?.risk?.overall < 70
                ? 'Medium risk'
                : 'High risk'}
          </p>
        </div>

        {/* Avg Completion Time */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Completion</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {metrics?.compliance?.averageCompletionTime}d
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">days per task</p>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Risk Factors */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Risk Factors
        </h3>
        <div className="space-y-4">
          {metrics?.risk?.factors?.map((factor: any, index: number) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      factor.impact === 'high'
                        ? 'bg-red-100 text-red-800'
                        : factor.impact === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {factor.impact}
                  </span>
                  <span className="font-medium text-gray-900">
                    {factor.name}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {factor.description}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {factor.score}
                </p>
                <p className="text-xs text-gray-500">score</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top Performers
        </h3>
        <div className="space-y-3">
          {metrics?.team?.topPerformers?.map(
            (performer: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500 h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {performer.email}
                    </p>
                    <p className="text-sm text-gray-500">
                      {performer.completedTasks} tasks completed
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-green-600">
                    {Math.round(performer.complianceRate)}%
                  </p>
                  <p className="text-xs text-gray-500">completion</p>
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
