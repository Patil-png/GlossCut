import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdsPage = () => {
  const [listingTiers, setListingTiers] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchListingTiers = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      else setLoading(true);

      const timestamp = new Date().getTime();
      const [tiersRes, adsRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/admin/listing-tiers?t=${timestamp}`),
        axios.get(`${process.env.REACT_APP_API_URL}/api/admin/ads?t=${timestamp}`)
      ]);
      setListingTiers(tiersRes.data);
      setAds(adsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchListingTiers();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString();
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
      {/* Page Header with Refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Listing Tier Earnings</h1>
          <p className="text-gray-600">View all listing tier purchases and earnings</p>
        </div>
        <button
          onClick={() => fetchListingTiers(true)}
          disabled={refreshing}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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
              Refresh Data
            </>
          )}
        </button>
      </div>

      {/* Listing Tier Earnings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Listing Tier Earnings</h3>

        {/* Listing Tier Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { id: 1, name: 'Premium', price: 999, color: 'from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-800' },
            { id: 2, name: 'Gold', price: 899, color: 'from-yellow-50 to-yellow-100 border-yellow-300 text-yellow-700' },
            { id: 3, name: 'Silver', price: 799, color: 'from-gray-50 to-gray-100 border-gray-300 text-gray-700' },
            { id: 4, name: 'Bronze', price: 699, color: 'from-orange-50 to-orange-100 border-orange-300 text-orange-700' },
            { id: 5, name: 'Standard', price: 599, color: 'from-blue-50 to-blue-100 border-blue-300 text-blue-700' },
            { id: 6, name: 'Basic', price: 499, color: 'from-green-50 to-green-100 border-green-300 text-green-700' },
            { id: 7, name: 'Entry', price: 399, color: 'from-purple-50 to-purple-100 border-purple-300 text-purple-700' },
            { id: 8, name: 'Starter', price: 299, color: 'from-pink-50 to-pink-100 border-pink-300 text-pink-700' },
            { id: 9, name: 'Lite', price: 199, color: 'from-indigo-50 to-indigo-100 border-indigo-300 text-indigo-700' },
            { id: 10, name: 'Free', price: 99, color: 'from-red-50 to-red-100 border-red-300 text-red-700' }
          ].map(tier => {
            const count = listingTiers.filter(lt => lt.tierId === tier.id).length;
            return (
              <div key={tier.id} className={`bg-gradient-to-r ${tier.color} p-3 rounded-lg border text-center`}>
                <h4 className="text-xs font-medium mb-1">{tier.name}</h4>
                <p className="text-lg font-bold">{count}</p>
                <p className="text-xs opacity-75">₹{tier.price}</p>
              </div>
            );
          })}
        </div>

        {/* Listing Tier Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barber</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchased</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {listingTiers.map(tier => (
                <tr key={tier._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{tier.lockedBy?.name}</div>
                    <div className="text-sm text-gray-500">{tier.lockedBy?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{tier.tierDetails?.name} Tier</div>
                    <div className="text-xs text-gray-500">{tier.tierDetails?.place} Place</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(tier.tierDetails?.price || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {tier.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(tier.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {listingTiers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No listing tier purchases found.</p>
          </div>
        )}

        {/* Listing Tier Revenue Summary */}
        {listingTiers.length > 0 && (
          <div className="mt-6 bg-green-50 rounded-lg p-6 border border-green-200">
            <div className="text-center mb-4">
              <h4 className="text-lg font-semibold text-green-800 mb-2">Total Listing Tier Revenue</h4>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(listingTiers.reduce((sum, tier) => sum + (tier.tierDetails?.price || 0), 0))}
              </p>
              <p className="text-xs text-green-500 mt-1">
                From {listingTiers.length} listing tier purchases
              </p>
            </div>

            {/* Category Breakdown */}
            <div className="space-y-2 text-sm">
              {['Barber', 'Women\'s Salon', 'Pet Care'].map(category => {
                const categoryTiers = listingTiers.filter(tier => tier.category === category);
                const revenue = categoryTiers.reduce((sum, tier) => sum + (tier.tierDetails?.price || 0), 0);
                if (categoryTiers.length === 0) return null;
                return (
                  <div key={category} className="flex justify-between items-center text-green-700">
                    <span>{category} listings ({((categoryTiers.length / listingTiers.length) * 100).toFixed(1)}%):</span>
                    <span className="font-medium">{categoryTiers.length} purchases = {formatCurrency(revenue)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Ad Placements */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Ad Placements</h3>

        {/* Ad Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Total Ads</h4>
            <p className="text-2xl font-bold text-blue-600">{ads.length}</p>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <h4 className="text-sm font-medium text-green-800 mb-2">Active Ads</h4>
            <p className="text-2xl font-bold text-green-600">{ads.filter(ad => ad.status === 'active').length}</p>
          </div>
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">Pending Ads</h4>
            <p className="text-2xl font-bold text-yellow-600">{ads.filter(ad => ad.status === 'pending').length}</p>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <h4 className="text-sm font-medium text-purple-800 mb-2">Total Revenue</h4>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(ads.filter(ad => ad.status === 'active' || ad.status === 'expired').reduce((sum, ad) => sum + ad.price, 0))}
            </p>
          </div>
        </div>

        {/* Ad Placements Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barber</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Media Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ads.map(ad => (
                <tr key={ad._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{ad.barberId?.name}</div>
                    <div className="text-sm text-gray-500">{ad.barberId?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="capitalize">{ad.mediaType || 'N/A'}</div>
                    {ad.videoUrl && <div className="text-xs text-blue-600">YouTube</div>}
                    {ad.mediaUrl && <div className="text-xs text-green-600">Uploaded</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{formatDate(ad.startDate)}</div>
                    <div className="text-xs">to</div>
                    <div>{formatDate(ad.endDate)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(ad.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      ad.status === 'active' ? 'bg-green-100 text-green-800' :
                      ad.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      ad.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {ad.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(ad.bookedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {ads.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No ad placements found.</p>
          </div>
        )}

        {/* Ad Placements Revenue Summary */}
        {ads.length > 0 && (
          <div className="mt-6 bg-indigo-50 rounded-lg p-6 border border-indigo-200">
            <div className="text-center mb-4">
              <h4 className="text-lg font-semibold text-indigo-800 mb-2">Total Ad Placement Revenue</h4>
              <p className="text-3xl font-bold text-indigo-600">
                {formatCurrency(ads.filter(ad => ad.status === 'active' || ad.status === 'expired').reduce((sum, ad) => sum + ad.price, 0))}
              </p>
              <p className="text-xs text-indigo-500 mt-1">
                From {ads.filter(ad => ad.status === 'active' || ad.status === 'expired').length} completed ad placements
              </p>
            </div>

            {/* Status Breakdown */}
            <div className="space-y-2 text-sm">
              {ads.filter(ad => ad.status === 'active').length > 0 && (
                <div className="flex justify-between items-center text-indigo-700">
                  <span>Active ads ({((ads.filter(ad => ad.status === 'active').length / ads.length) * 100).toFixed(1)}%):</span>
                  <span className="font-medium">{ads.filter(ad => ad.status === 'active').length} ads = {formatCurrency(ads.filter(ad => ad.status === 'active').reduce((sum, ad) => sum + ad.price, 0))}</span>
                </div>
              )}
              {ads.filter(ad => ad.status === 'expired').length > 0 && (
                <div className="flex justify-between items-center text-indigo-700">
                  <span>Expired ads ({((ads.filter(ad => ad.status === 'expired').length / ads.length) * 100).toFixed(1)}%):</span>
                  <span className="font-medium">{ads.filter(ad => ad.status === 'expired').length} ads = {formatCurrency(ads.filter(ad => ad.status === 'expired').reduce((sum, ad) => sum + ad.price, 0))}</span>
                </div>
              )}
              {ads.filter(ad => ad.status === 'pending').length > 0 && (
                <div className="flex justify-between items-center text-indigo-700">
                  <span>Pending ads ({((ads.filter(ad => ad.status === 'pending').length / ads.length) * 100).toFixed(1)}%):</span>
                  <span className="font-medium">{ads.filter(ad => ad.status === 'pending').length} ads pending approval</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdsPage;
