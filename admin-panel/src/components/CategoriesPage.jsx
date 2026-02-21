import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CategoriesPage = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        emoji: '✨',
        color: '#6366F1',
        isActive: true
    });

    const fetchCategories = async (showRefreshIndicator = false) => {
        try {
            if (showRefreshIndicator) setRefreshing(true);
            else setLoading(true);

            const timestamp = new Date().getTime();
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/categories?t=${timestamp}`);
            setCategories(res.data);
        } catch (err) {
            console.error('Error fetching categories:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleCreate = () => {
        setEditingCategory(null);
        setFormData({
            name: '',
            emoji: '✨',
            color: '#6366F1',
            isActive: true
        });
        setShowModal(true);
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name || '',
            emoji: category.emoji || '✨',
            color: category.color || '#6366F1',
            isActive: category.isActive !== undefined ? category.isActive : true
        });
        setShowModal(true);
    };

    const handleDelete = async (categoryId) => {
        if (!window.confirm('Are you sure you want to delete this category? Service assignments might be affected.')) return;

        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/api/admin/categories/${categoryId}`);
            await fetchCategories(true);
        } catch (err) {
            console.error('Error deleting category:', err);
            alert('Failed to delete category');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingCategory) {
                await axios.put(`${process.env.REACT_APP_API_URL}/api/admin/categories/${editingCategory._id}`, formData);
            } else {
                await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/categories`, formData);
            }

            setShowModal(false);
            await fetchCategories(true);
        } catch (err) {
            console.error('Error saving category:', err);
            alert('Failed to save category');
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
                    <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
                    <p className="text-gray-600">Manage service groupings, emojis, and styling</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => fetchCategories(true)}
                        disabled={refreshing}
                        className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                    <button
                        onClick={handleCreate}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Create Category
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map(category => (
                    <div key={category._id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner"
                                    style={{ backgroundColor: `${category.color}20`, border: `2px solid ${category.color}` }}
                                >
                                    {category.emoji}
                                </div>
                                <div className="flex space-x-2">
                                    <button onClick={() => handleEdit(category)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg">Edit</button>
                                    <button onClick={() => handleDelete(category._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">Delete</button>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">{category.name}</h3>
                            <div className="mt-2 flex items-center">
                                <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {category.isActive ? 'Active' : 'Inactive'}
                                </span>
                                <span className="ml-2 text-sm text-gray-400 font-mono">{category.color}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                    <div className="relative p-6 border w-full max-w-md shadow-2xl rounded-2xl bg-white m-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">
                            {editingCategory ? 'Edit Category' : 'Create Category'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Category Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="e.g., Hair, Beard, Facial"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Emoji</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.emoji}
                                        onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center text-xl"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Color</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={formData.color}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                            className="h-11 w-full p-1 rounded-xl bg-white border border-gray-300 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center pt-2">
                                <input
                                    type="checkbox"
                                    id="catActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                                />
                                <label htmlFor="catActive" className="ml-2 text-sm font-bold text-gray-700">Category is Active</label>
                            </div>

                            <div className="flex justify-end space-x-3 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                                >
                                    {editingCategory ? 'Save Changes' : 'Create Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoriesPage;
