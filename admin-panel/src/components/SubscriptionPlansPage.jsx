import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SubscriptionPlansPage = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        durationDays: 30,
        features: '',
        isActive: true
    });

    const fetchPlans = async (showRefreshIndicator = false) => {
        try {
            if (showRefreshIndicator) setRefreshing(true);
            else setLoading(true);

            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/subscription-plans`);
            setPlans(res.data);

            // Also fetch stats
            const statsRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/subscription-stats`);
            setStats(statsRes.data);
        } catch (err) {
            console.error('Error fetching plans or stats:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleCreate = () => {
        setEditingPlan(null);
        setFormData({
            name: '',
            price: '',
            durationDays: 30,
            features: '',
            isActive: true
        });
        setShowModal(true);
    };

    const handleEdit = (plan) => {
        setEditingPlan(plan);
        setFormData({
            name: plan.name || '',
            price: plan.price || '',
            durationDays: plan.durationDays || 30,
            features: plan.features?.join(', ') || '',
            isActive: plan.isActive !== undefined ? plan.isActive : true
        });
        setShowModal(true);
    };

    const handleDelete = async (planId) => {
        if (!window.confirm('Are you sure you want to deactivate this plan?')) return;

        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/api/admin/subscription-plans/${planId}`);
            await fetchPlans(true);
        } catch (err) {
            console.error('Error deleting plan:', err);
            alert('Failed to delete plan');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            features: formData.features.split(',').map(f => f.trim()).filter(f => f !== '')
        };

        try {
            if (editingPlan) {
                await axios.put(`${process.env.REACT_APP_API_URL}/api/admin/subscription-plans/${editingPlan._id}`, payload);
            } else {
                await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/subscription-plans`, payload);
            }

            setShowModal(false);
            await fetchPlans(true);
        } catch (err) {
            console.error('Error saving plan:', err);
            alert(err.response?.data?.msg || 'Failed to save plan');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
                    <p className="text-gray-600">Manage monthly plans for barbers</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => fetchPlans(true)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Refresh
                    </button>
                    <button
                        onClick={handleCreate}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Create Plan
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <div key={plan._id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
                        <div className={`p-1 ${plan.isActive ? 'bg-indigo-500' : 'bg-gray-400'}`}></div>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${plan.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                    {plan.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <p className="text-3xl font-extrabold text-indigo-600 mb-2">₹{plan.price}</p>
                            <p className="text-sm text-gray-500 mb-4">{plan.durationDays} Days</p>

                            <div className="space-y-2 mb-6 min-h-[100px]">
                                {plan.features?.map((feature, i) => (
                                    <div key={i} className="flex items-center text-sm text-gray-600">
                                        <svg className="h-4 w-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {feature}
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end space-x-3 border-t pt-4">
                                <button
                                    onClick={() => handleEdit(plan)}
                                    className="text-indigo-600 hover:text-indigo-900 font-medium"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(plan._id)}
                                    className="text-red-600 hover:text-red-900 font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-8">
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">
                            {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="e.g., Premium Monthly"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Days)</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.durationDays}
                                        onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Features (Comma separated)</label>
                                <textarea
                                    required
                                    value={formData.features}
                                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Earnings Access, Map Visibility, Push Notifications"
                                />
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 font-medium">
                                    Active
                                </label>
                            </div>

                            <div className="flex justify-end space-x-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Save Plan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionPlansPage;
