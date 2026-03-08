import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, Polygon } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// Fix for Leaflet marker icons in React
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const GeofencingPage = () => {
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingArea, setEditingArea] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        polygon: null,
        tierPricing: {
            1: 999, 2: 899, 3: 799, 4: 699, 5: 599,
            6: 499, 7: 399, 8: 299, 9: 199, 10: 99
        },
        isActive: true
    });

    useEffect(() => {
        fetchAreas();
    }, []);

    const fetchAreas = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/areas`);
            setAreas(res.data);
        } catch (err) {
            console.error('Error fetching areas:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreated = (e) => {
        const { layerType, layer } = e;
        if (layerType === 'polygon') {
            const latlngs = layer.getLatLngs()[0];
            const coords = latlngs.map(latlng => [latlng.lng, latlng.lat]);

            // Close the polygon by repeating the first point per GeoJSON spec
            coords.push(coords[0]);

            setFormData({
                name: '',
                polygon: {
                    type: 'Polygon',
                    coordinates: [coords]
                },
                tierPricing: {
                    1: 999, 2: 899, 3: 799, 4: 699, 5: 599,
                    6: 499, 7: 399, 8: 299, 9: 199, 10: 99
                },
                isActive: true
            });
            setEditingArea(null);
            setShowModal(true);

            // Remove the temporary layer from the map to let React render it once saved
            layer.remove();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingArea) {
                await axios.put(`${process.env.REACT_APP_API_URL}/api/areas/${editingArea._id}`, formData);
            } else {
                await axios.post(`${process.env.REACT_APP_API_URL}/api/areas`, formData);
            }
            setShowModal(false);
            setEditingArea(null);
            fetchAreas();
        } catch (err) {
            console.error('Error saving area:', err.response?.data || err.message);
            alert(err.response?.data?.msg || 'Failed to save area');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this area?')) return;
        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/api/areas/${id}`);
            fetchAreas();
        } catch (err) {
            console.error('Error deleting area:', err);
        }
    };

    const handleEdit = (area) => {
        setEditingArea(area);
        setFormData({
            name: area.name,
            polygon: area.polygon,
            tierPricing: area.tierPricing,
            isActive: area.isActive
        });
        setShowModal(true);
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
                    <h1 className="text-2xl font-bold text-gray-900">Geofenced Priority Areas</h1>
                    <p className="text-gray-600">Manage visibility priority zones and custom pricing by drawing on the map.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 border border-gray-100">
                <div style={{ height: '500px', width: '100%' }} className="rounded-lg overflow-hidden border shadow-inner">
                    <MapContainer center={[20.932, 77.752]} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <FeatureGroup>
                            <EditControl
                                position="topright"
                                onCreated={handleCreated}
                                draw={{
                                    rectangle: false,
                                    circle: false,
                                    polyline: false,
                                    circlemarker: false,
                                    marker: false,
                                }}
                            />
                        </FeatureGroup>
                        {areas.map(area => (
                            <Polygon
                                key={area._id}
                                positions={area.polygon.coordinates[0].map(coord => [coord[1], coord[0]])}
                                pathOptions={{
                                    color: area.isActive ? 'indigo' : 'gray',
                                    fillColor: area.isActive ? 'indigo' : 'gray',
                                    fillOpacity: 0.2
                                }}
                            />
                        ))}
                    </MapContainer>
                </div>
                <div className="mt-2 text-xs text-gray-400 italic">
                    * Click the polygon tool in the top right of the map to draw a new area.
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {areas.map(area => (
                    <div key={area._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold text-gray-900">{area.name}</h3>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${area.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {area.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="space-y-1 mb-6 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Tier 1 (Premium)</span>
                                <span className="font-semibold text-indigo-600">₹{area.tierPricing[1]}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Tier 5 (Standard)</span>
                                <span className="font-semibold text-indigo-600">₹{area.tierPricing[5]}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Tier 10 (Free/Entry)</span>
                                <span className="font-semibold text-indigo-600">₹{area.tierPricing[10]}</span>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-50 text-sm font-medium">
                            <button onClick={() => handleEdit(area)} className="text-indigo-600 hover:text-indigo-900">Edit Details</button>
                            <button onClick={() => handleDelete(area._id)} className="text-red-500 hover:text-red-700">Delete</button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[1000] flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">
                                {editingArea ? 'Edit Priority Area' : 'Configure New Area'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Area Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="e.g. Downtown Core"
                                />
                            </div>

                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Listing Tier Pricing (₹)</h4>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(tier => (
                                        <div key={tier} className="flex items-center space-x-3">
                                            <span className="text-sm font-medium text-gray-600 w-12">Tier {tier}:</span>
                                            <input
                                                type="number"
                                                required
                                                value={formData.tierPricing[tier]}
                                                onChange={e => setFormData({
                                                    ...formData,
                                                    tierPricing: { ...formData.tierPricing, [tier]: parseInt(e.target.value) }
                                                })}
                                                className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 font-medium">
                                    Enable this area (Shop owners can purchase priority here)
                                </label>
                            </div>

                            <div className="flex justify-end space-x-3 mt-8 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
                                >
                                    {editingArea ? 'Save Changes' : 'Create Priority Area'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GeofencingPage;
