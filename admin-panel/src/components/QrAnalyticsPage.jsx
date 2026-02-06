import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const QrAnalyticsPage = () => {
    const { admin } = useAdminAuth();
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Assuming admin middleware or similar protection on backend
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/qr/stats`);
                setStats(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch QR stats", err);
                setError("Could not load analytics data.");
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
            </div>
        );
    }

    const totalScans = stats.reduce((acc, curr) => acc + curr.total_scans, 0);
    const totalScansWeek = stats.reduce((acc, curr) => acc + curr.scans_this_week, 0);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">QR Standee Analytics</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total All-Time Scans</div>
                    <div className="mt-2 text-3xl font-bold text-gray-900">{totalScans}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Scans This Week</div>
                    <div className="mt-2 text-3xl font-bold text-indigo-600">{totalScansWeek}</div>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-96">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Performing Salons</h2>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={stats.slice(0, 10)} // Top 10
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        layout="vertical"
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" />
                        <YAxis dataKey="shop_name" type="category" width={150} tick={{ fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Legend />
                        <Bar dataKey="total_scans" name="Total Scans" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={20} />
                        <Bar dataKey="scans_this_week" name="This Week" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Detailed Table */}
            <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-medium text-gray-900">Salon Details</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Salon Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Scans
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last 7 Days
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {stats.map((stat, idx) => (
                                <tr key={stat._id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {stat.shop_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {stat.total_scans}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${stat.scans_this_week > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {stat.scans_this_week}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {stat.total_scans > 10 ?
                                            <span className="text-green-600">Active</span> :
                                            <span className="text-yellow-600">Needs Promotion</span>
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default QrAnalyticsPage;
