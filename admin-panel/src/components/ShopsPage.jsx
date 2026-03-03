import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ShopsPage = () => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Location Editing State
    const [editingShop, setEditingShop] = useState(null);
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [savingLocation, setSavingLocation] = useState(false);

    useEffect(() => {
        fetchShops();
    }, []);

    const fetchShops = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/shops`);
            setShops(response.data);
        } catch (err) {
            console.error('Error fetching shops:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEditLocation = (shop) => {
        setEditingShop(shop);
        // Pre-fill existing coordinates if available
        if (shop.location && shop.location.coordinates && shop.location.coordinates.length === 2) {
            setLongitude(shop.location.coordinates[0]);
            setLatitude(shop.location.coordinates[1]);
        } else {
            setLatitude('');
            setLongitude('');
        }
    };

    const handleSaveLocation = async (e) => {
        e.preventDefault();
        if (!latitude || !longitude) {
            alert("Please enter both latitude and longitude.");
            return;
        }

        setSavingLocation(true);
        try {
            await axios.put(`${process.env.REACT_APP_API_URL}/api/admin/shops/${editingShop._id}/location`, {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude)
            });
            alert('Location updated successfully!');
            setEditingShop(null);
            fetchShops(); // Refresh the list
        } catch (err) {
            console.error('Failed to update location:', err);
            alert('Failed to update location.');
        } finally {
            setSavingLocation(false);
        }
    };

    // Filter shops
    const filteredShops = shops.filter(shop =>
        shop.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    <h1 className="text-2xl font-bold text-gray-900">Manage Shops</h1>
                    <p className="text-gray-600">View and update shop locations and settings</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search by shop name or owner name..."
                        className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Coordinates</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredShops.map(shop => (
                                <tr key={shop._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{shop.name}</div>
                                        <div className="text-xs text-gray-500">{shop.address}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {shop.owner?.name || 'Unknown'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${shop.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {shop.approvalStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 font-mono text-xs">
                                        {shop.location?.coordinates && shop.location.coordinates.length === 2 && (shop.location.coordinates[0] !== 0 || shop.location.coordinates[1] !== 0)
                                            ? `${shop.location.coordinates[1].toFixed(5)}, ${shop.location.coordinates[0].toFixed(5)}`
                                            : <span className="text-red-500 shrink">Not Set (0,0)</span>
                                        }
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium">
                                        <button
                                            onClick={() => handleEditLocation(shop)}
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            Update Location
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredShops.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                        No shops found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Location Modal */}
            {editingShop && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Update Shop Location</h3>
                            <button
                                onClick={() => setEditingShop(null)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveLocation}>
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-4">
                                    Setting precise coordinates for <strong>{editingShop.name}</strong>. These will be used for map routing and fast $geoNear distance sorting.
                                </p>

                                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    required
                                    value={latitude}
                                    onChange={(e) => setLatitude(e.target.value)}
                                    placeholder="e.g. 20.932"
                                    className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
                                />

                                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    required
                                    value={longitude}
                                    onChange={(e) => setLongitude(e.target.value)}
                                    placeholder="e.g. 77.752"
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setEditingShop(null)}
                                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                                    disabled={savingLocation}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                    disabled={savingLocation}
                                >
                                    {savingLocation ? 'Saving...' : 'Save Location'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ShopsPage;
