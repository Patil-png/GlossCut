import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'General',
    isActive: true
  });
  const [categories, setCategories] = useState([]);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catFormData, setCatFormData] = useState({ name: '', emoji: '✨', color: '#6366F1', isActive: true });

  const fetchServices = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      else setLoading(true);

      const timestamp = new Date().getTime();
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/services?t=${timestamp}`);
      setServices(res.data);
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServices();
    const fetchCats = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/categories`);
        setCategories(res.data);
      } catch (err) {
        console.error('Error fetching categories for dropdown:', err);
      }
    };
    fetchCats();
  }, []);

  const handleCreate = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      category: 'General',
      isActive: true
    });
    setShowModal(true);
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name || '',
      description: service.description || '',
      category: service.category || 'General',
      isActive: service.isActive !== undefined ? service.isActive : true
    });
    setShowModal(true);
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;

    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/admin/services/${serviceId}`);
      await fetchServices(true);
    } catch (err) {
      console.error('Error deleting service:', err);
      alert('Failed to delete service');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingService) {
        await axios.put(`${process.env.REACT_APP_API_URL}/api/admin/services/${editingService._id}`, formData);
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/services`, formData);
      }

      setShowModal(false);
      await fetchServices(true);
    } catch (err) {
      console.error('Error saving service:', err);
      if (err.response?.data?.msg) {
        alert(err.response.data.msg);
      } else {
        alert('Failed to save service');
      }
    }
  };

  const handleCatEdit = (cat) => {
    setEditingCat(cat);
    setCatFormData({
      name: cat.name,
      emoji: cat.emoji || '✨',
      color: cat.color || '#6366F1',
      isActive: cat.isActive !== undefined ? cat.isActive : true
    });
  };

  const handleCatSubmit = async (e) => {
    e.preventDefault();
    if (!catFormData.name.trim()) return alert('Name is required');
    try {
      if (editingCat) {
        await axios.put(`${process.env.REACT_APP_API_URL}/api/admin/categories/${editingCat._id}`, catFormData);
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/categories`, catFormData);
      }
      setEditingCat(null);
      setCatFormData({ name: '', emoji: '✨', color: '#6366F1', isActive: true });
      // Fetch updated categories
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/categories`);
      setCategories(res.data);
    } catch (err) {
      alert('Failed to save category');
    }
  };

  const handleSyncCategories = async () => {
    const uniqueCats = [...new Set(services.map(s => s.category))].filter(Boolean);
    const missingCats = uniqueCats.filter(name => !categories.find(c => c.name === name));

    if (missingCats.length === 0) return alert('All categories are already synced!');

    try {
      setLoading(true);
      for (const name of missingCats) {
        await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/categories`, { name, emoji: '💈', color: '#6366F1' });
      }
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/categories`);
      setCategories(res.data);
      alert(`Synced ${missingCats.length} new categories!`);
    } catch (err) {
      alert('Sync failed');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
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
      {/* Page Header with Refresh and Create */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600">Manage barber services available for selection</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => fetchServices(true)}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {refreshing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </>
            )}
          </button>
          <button
            onClick={() => setShowCatModal(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
          >
            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
            Manage Categories
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Service
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-blue-800 mb-1">Total Services</h3>
              <p className="text-3xl font-bold text-blue-600">{services.length}</p>
              <p className="text-xs text-blue-600 mt-2">All services</p>
            </div>
            <div className="text-4xl">✂️</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-green-800 mb-1">Active Services</h3>
              <p className="text-3xl font-bold text-green-600">{services.filter(s => s.isActive).length}</p>
              <p className="text-xs text-green-600 mt-2">Available for barbers</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>

        <div
          onClick={() => setShowCatModal(true)}
          className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-lg border border-purple-200 cursor-pointer hover:shadow-xl transition-shadow duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-purple-800 mb-1">Categories</h3>
              <p className="text-3xl font-bold text-purple-600">
                {new Set(services.map(s => s.category)).size}
              </p>
              <p className="text-xs text-purple-600 mt-2">Click to manage</p>
            </div>
            <div className="text-4xl">📂</div>
          </div>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Services ({services.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {services.map(service => (
                <tr key={service._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{service.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate">{service.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {service.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(service.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(service)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(service._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {services.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No services found. Create your first service to get started.</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingService ? 'Edit Service' : 'Create New Service'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., Hair Cut, Beard Trim"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="General">General</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Describe the service"
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
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active (available for barbers to select)
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    {editingService ? 'Update Service' : 'Create Service'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Category Management Modal */}
      {showCatModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-purple-50 rounded-t-xl">
              <h3 className="text-xl font-bold text-gray-900">Manage Service Categories</h3>
              <button onClick={() => setShowCatModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Sync Section */}
              <div className="bg-white border-2 border-dashed border-purple-200 p-6 rounded-xl text-center">
                <h4 className="font-bold text-purple-900 mb-2">Auto-Sync with Services</h4>
                <p className="text-sm text-gray-600 mb-4">Automatically discover category names from your existing services and add them to your settings list.</p>
                <button
                  onClick={handleSyncCategories}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors"
                >
                  Start Sync
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Editor */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    {editingCat ? 'Update Category' : 'Quick Add Category'}
                  </h4>
                  <form onSubmit={handleCatSubmit} className="space-y-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">NAME</label>
                        <input
                          type="text"
                          required
                          value={catFormData.name}
                          onChange={(e) => setCatFormData({ ...catFormData, name: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 font-bold"
                          placeholder="e.g. Hair Cut"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-center">EMOJI</label>
                        <input
                          type="text"
                          value={catFormData.emoji}
                          onChange={(e) => setCatFormData({ ...catFormData, emoji: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md text-center text-xl"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">SELECT COLOR</label>
                      <div className="grid grid-cols-5 gap-3 mb-4">
                        {[
                          '#6366F1', '#F43F5E', '#10B981', '#F59E0B',
                          '#0EA5E9', '#8B5CF6', '#D946EF', '#64748B',
                          '#FB923C', '#14B8A6'
                        ].map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setCatFormData({ ...catFormData, color })}
                            style={{ backgroundColor: color }}
                            className={`h-10 w-full rounded-lg border-4 transition-all ${catFormData.color === color ? 'border-purple-200 ring-2 ring-purple-600 scale-110' : 'border-transparent hover:scale-105'}`}
                          >
                            {catFormData.color === color && (
                              <svg className="w-6 h-6 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={catFormData.color}
                          onChange={(e) => setCatFormData({ ...catFormData, color: e.target.value })}
                          className="h-10 w-16 border rounded-md p-1 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={catFormData.color}
                          onChange={(e) => setCatFormData({ ...catFormData, color: e.target.value })}
                          className="flex-1 px-3 py-2 border rounded-md font-mono text-sm"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button type="submit" className="flex-1 bg-gray-900 text-white py-2 rounded-md font-bold hover:bg-black">
                        {editingCat ? 'Update' : 'Add'}
                      </button>
                      {editingCat && (
                        <button
                          type="button"
                          onClick={() => { setEditingCat(null); setCatFormData({ name: '', emoji: '✨', color: '#6366F1', isActive: true }); }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* List */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Defined Mappings</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {categories.map(cat => (
                      <div key={cat._id} className="flex items-center p-3 bg-white border border-gray-200 rounded-lg group hover:border-purple-300 transition-colors">
                        <div style={{ backgroundColor: `${cat.color}20`, borderColor: cat.color }} className="w-10 h-10 rounded border flex items-center justify-center text-xl mr-3">
                          {cat.emoji}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800">{cat.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{cat.color}</p>
                        </div>
                        <button
                          onClick={() => handleCatEdit(cat)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 text-right">
              <button
                onClick={() => setShowCatModal(false)}
                className="px-6 py-2 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-900"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
