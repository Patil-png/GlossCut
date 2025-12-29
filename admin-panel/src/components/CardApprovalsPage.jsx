import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CardApprovalsPage = () => {
  const [pendingCards, setPendingCards] = useState({ barberCards: [], shops: [], deleteRequests: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(null);

  const fetchPendingCards = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      else setLoading(true);

      const timestamp = new Date().getTime();

      console.log('Fetching pending cards and delete requests...');

      // Fetch both card approvals and delete requests
      const [cardsRes, deleteRequestsRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/admin/cards?t=${timestamp}`),
        axios.get(`${process.env.REACT_APP_API_URL}/api/admin/delete-requests?t=${timestamp}`)
      ]);

      console.log('Cards response:', cardsRes.data);
      console.log('Delete requests response:', deleteRequestsRes.data);

      setPendingCards({
        ...cardsRes.data,
        deleteRequests: deleteRequestsRes.data
      });
    } catch (err) {
      console.error('Error fetching pending cards:', err);
      console.error('Error details:', err.response?.data || err.message);
      alert('Failed to load pending requests. Check console for details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPendingCards();
  }, []);

  const handleApprove = async (type, id) => {
    if (!window.confirm(`Are you sure you want to approve this ${type}?`)) return;

    setProcessing({ type, id, action: 'approve' });
    try {
      const endpoint = type === 'barber' ? `/api/admin/cards/barber/${id}/approve` : `/api/admin/cards/shop/${id}/approve`;
      await axios.put(`${process.env.REACT_APP_API_URL}${endpoint}`);
      await fetchPendingCards(true);
    } catch (err) {
      console.error('Error approving card:', err);
      alert('Failed to approve card');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (type, id) => {
    const reason = window.prompt('Enter rejection reason:');
    if (!reason) return;

    setProcessing({ type, id, action: 'reject' });
    try {
      let endpoint;
      if (type === 'delete') {
        endpoint = `/api/admin/delete-requests/${id}/reject`;
      } else {
        endpoint = type === 'barber' ? `/api/admin/cards/barber/${id}/reject` : `/api/admin/cards/shop/${id}/reject`;
      }
      await axios.put(`${process.env.REACT_APP_API_URL}${endpoint}`, { rejectionReason: reason });
      await fetchPendingCards(true);
    } catch (err) {
      console.error('Error rejecting card:', err);
      alert('Failed to reject card');
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this delete request? The barber card will be permanently deleted.')) return;

    setProcessing({ type: 'delete', id, action: 'approve' });
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/admin/delete-requests/${id}/approve`);
      await fetchPendingCards(true);
    } catch (err) {
      console.error('Error approving delete request:', err);
      alert('Failed to approve delete request');
    } finally {
      setProcessing(null);
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
      {/* Page Header with Refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Card Approvals</h1>
          <p className="text-gray-600">Review and approve barber cards and shops</p>
        </div>
        <button
          onClick={() => fetchPendingCards(true)}
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-blue-800 mb-1">Pending Barber Cards</h3>
              <p className="text-3xl font-bold text-blue-600">{pendingCards.barberCards.length}</p>
              <p className="text-xs text-blue-600 mt-2">Awaiting approval</p>
            </div>
            <div className="text-4xl">💇‍♂️</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-green-800 mb-1">Pending Shops</h3>
              <p className="text-3xl font-bold text-green-600">{pendingCards.shops.length}</p>
              <p className="text-xs text-green-600 mt-2">Awaiting approval</p>
            </div>
            <div className="text-4xl">🏪</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-purple-800 mb-1">Total Pending</h3>
              <p className="text-3xl font-bold text-purple-600">{pendingCards.barberCards.length + pendingCards.shops.length}</p>
              <p className="text-xs text-purple-600 mt-2">Cards to review</p>
            </div>
            <div className="text-4xl">📋</div>
          </div>
        </div>
      </div>

      {/* Barber Cards Section */}
      {pendingCards.barberCards.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Pending Barber Cards ({pendingCards.barberCards.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barber</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingCards.barberCards.map(card => (
                  <tr key={card._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{card.name}</div>
                      <div className="text-xs text-gray-500">{card.barberId?.name || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {card.services?.length || 0} services
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(card.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleApprove('barber', card._id)}
                        disabled={processing?.type === 'barber' && processing?.id === card._id && processing?.action === 'approve'}
                        className="text-green-600 hover:text-green-900 mr-3 disabled:opacity-50"
                      >
                        {processing?.type === 'barber' && processing?.id === card._id && processing?.action === 'approve' ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleReject('barber', card._id)}
                        disabled={processing?.type === 'barber' && processing?.id === card._id && processing?.action === 'reject'}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {processing?.type === 'barber' && processing?.id === card._id && processing?.action === 'reject' ? 'Rejecting...' : 'Reject'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shops Section */}
      {pendingCards.shops.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Pending Shops ({pendingCards.shops.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingCards.shops.map(shop => (
                  <tr key={shop._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{shop.name}</div>
                      <div className="text-xs text-gray-500">{shop.address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {shop.owner?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {shop.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(shop.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleApprove('shop', shop._id)}
                        disabled={processing?.type === 'shop' && processing?.id === shop._id && processing?.action === 'approve'}
                        className="text-green-600 hover:text-green-900 mr-3 disabled:opacity-50"
                      >
                        {processing?.type === 'shop' && processing?.id === shop._id && processing?.action === 'approve' ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleReject('shop', shop._id)}
                        disabled={processing?.type === 'shop' && processing?.id === shop._id && processing?.action === 'reject'}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {processing?.type === 'shop' && processing?.id === shop._id && processing?.action === 'reject' ? 'Rejecting...' : 'Reject'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Requests Section */}
      {pendingCards.deleteRequests && pendingCards.deleteRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Pending Delete Requests ({pendingCards.deleteRequests.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barber Card</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barber</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingCards.deleteRequests.map(request => (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{request.barberCardId?.name || 'Unknown Card'}</div>
                      <div className="text-xs text-gray-500">
                        {request.barberCardId?.services?.length || 0} services
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.barberId?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.shopId?.name || 'No Shop'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {request.reason || 'No reason provided'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.requestedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteApprove(request._id)}
                        disabled={processing?.type === 'delete' && processing?.id === request._id && processing?.action === 'approve'}
                        className="text-red-600 hover:text-red-900 mr-3 disabled:opacity-50"
                      >
                        {processing?.type === 'delete' && processing?.id === request._id && processing?.action === 'approve' ? 'Deleting...' : 'Delete Card'}
                      </button>
                      <button
                        onClick={() => handleReject('delete', request._id)}
                        disabled={processing?.type === 'delete' && processing?.id === request._id && processing?.action === 'reject'}
                        className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                      >
                        {processing?.type === 'delete' && processing?.id === request._id && processing?.action === 'reject' ? 'Rejecting...' : 'Reject'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {pendingCards.barberCards.length === 0 && pendingCards.shops.length === 0 && (!pendingCards.deleteRequests || pendingCards.deleteRequests.length === 0) && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
          <p className="text-gray-500">No pending cards require approval at this time.</p>
        </div>
      )}
    </div>
  );
};

export default CardApprovalsPage;
