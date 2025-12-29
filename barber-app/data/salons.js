export const salonsData = [
  {
    id: '1',
    name: 'Glamour Studio',
    rating: 4.9,
    reviews: 300,
    customersServed: 1800,
    address: '101 Fashion St, City',
    avgAppointmentTime: '60 min',
    tag: 'Highly Rated',
    listingTier: 'Premium', // Added listingTier
    totalServices: 10,
    image: require('../Uploads/images1.jpeg'), // Corrected path
    services: [
      { id: 'ws1', name: 'Haircut & Style', price: '₹800' },
      { id: 'ws2', name: 'Manicure', price: '₹400' },
      { id: 'ws3', name: 'Pedicure', 'price': '₹500' },
    ],
  },
  {
    id: '2',
    name: 'Beauty Haven',
    rating: 4.7,
    reviews: 220,
    customersServed: 1400,
    address: '202 Style Ave, Town',
    avgAppointmentTime: '90 min',
    tag: 'Verified Pro',
    listingTier: 'Gold', // Added listingTier
    totalServices: 15,
    image: require('../Uploads/images2.jpeg'), // Corrected path
    services: [
      { id: 'ws4', name: 'Facial', price: '₹1200' },
      { id: 'ws5', name: 'Waxing', price: '₹600' },
    ],
  },
  {
    id: '3',
    name: 'Chic Cuts',
    rating: 4.6,
    reviews: 190,
    customersServed: 1100,
    address: '303 Elegance Ln, Village',
    avgAppointmentTime: '45 min',
    tag: 'Popular Choice',
    listingTier: 'Silver', // Added listingTier
    totalServices: 8,
    image: require('../Uploads/images3.jpeg'), // Corrected path
    services: [
      { id: 'ws6', name: 'Hair Coloring', price: '₹2000' },
      { id: 'ws7', name: 'Bridal Makeup', price: '₹5000' },
    ],
  },
  {
    id: '4',
    name: 'Radiant Glow',
    rating: 4.8,
    reviews: 280,
    customersServed: 1700,
    address: '404 Sparkle Rd, Metro',
    avgAppointmentTime: '75 min',
    tag: 'Top Rated',
    listingTier: 'Bronze', // Added listingTier
    totalServices: 12,
    image: require('../Uploads/images4.jpeg'), // Corrected path
    services: [
      { id: 'ws8', name: 'Spa Package', price: '₹3000' },
      { id: 'ws9', name: 'Body Massage', price: '₹1500' },
    ],
  },
];
