import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ReviewsPage = () => {
  const [barberReviews, setBarberReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedBarbers, setExpandedBarbers] = useState(new Set());

  useEffect(() => {
    const fetchBarberReviews = async () => {
      try {
        console.log('Fetching barber reviews...');
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/barber-reviews`);
        console.log('Barber reviews response:', res.data);
        setBarberReviews(res.data);
      } catch (err) {
        console.error('Error fetching barber reviews:', err);
        console.error('Error details:', err.response?.data || err.message);
      }
      setLoading(false);
    };

    fetchBarberReviews();
  }, []);

  const toggleBarberExpansion = (barberId) => {
    const newExpanded = new Set(expandedBarbers);
    if (newExpanded.has(barberId)) {
      newExpanded.delete(barberId);
    } else {
      newExpanded.add(barberId);
    }
    setExpandedBarbers(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const totalReviews = barberReviews.reduce((sum, barber) => sum + barber.totalReviews, 0);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Reviews Management ({totalReviews})</h2>
      </div>

      <div className="p-6">
        {barberReviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No reviews found
          </div>
        ) : (
          <div className="space-y-6">
            {barberReviews.map((barberData) => (
              <div key={barberData.barberId} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                {/* Barber Header */}
                <div
                  className="px-6 py-4 bg-white border-b border-gray-200 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleBarberExpansion(barberData.barberId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <h3 className="text-lg font-semibold text-gray-800">{barberData.barberName}</h3>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900 mr-1">{barberData.averageRating}</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`text-sm ${i < Math.floor(barberData.averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">({barberData.totalReviews} reviews)</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {/* Rating Distribution */}
                      <div className="flex items-center space-x-3">
                        {[5, 4, 3, 2, 1].map(rating => (
                          <div key={rating} className="flex items-center space-x-1 text-xs">
                            <span className="text-yellow-500 font-medium">{rating}★</span>
                            <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              {barberData.ratingDistribution[rating]}
                            </span>
                          </div>
                        ))}
                      </div>
                      <button className="text-gray-400 hover:text-gray-600 p-1">
                        {expandedBarbers.has(barberData.barberId) ? '▼' : '▶'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Individual Reviews */}
                {expandedBarbers.has(barberData.barberId) && (
                  <div className="divide-y divide-gray-200">
                    {barberData.reviews.map((review) => (
                      <div key={review._id} className="px-6 py-4 bg-white">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                            <span className="font-medium text-gray-900">{review.userId?.name || 'Anonymous'}</span>
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-900 mr-1">{review.rating}/5</span>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <span key={i} className={`text-sm ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                                  ))}
                                </div>
                              </div>
                              <span className="text-sm text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-700 text-sm">{review.comment}</p>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button className="text-indigo-600 hover:text-indigo-900 text-sm">View</button>
                            <button className="text-red-600 hover:text-red-900 text-sm">Delete</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsPage;
