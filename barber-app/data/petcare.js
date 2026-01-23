export const petCareProvidersData = [
  {
    id: '1',
    name: 'Happy Paws Pet Care',
    rating: 4.9,
    reviews: 150,
    customersServed: 700,

    address: '789 Animal Rd, City',
    avgAppointmentTime: '60 min',
    tag: 'Top Rated',
    listingTier: 'Premium', // Added listingTier
    totalServices: 8,
    image: require('../Uploads/images1.jpeg'), // Corrected path
    services: [
      { id: 'pc1', name: 'Dog Grooming', price: '₹1000' },
      { id: 'pc2', name: 'Cat Grooming', price: '₹800' },
      { id: 'pc3', name: 'Pet Sitting (Daily)', price: '₹700' },
    ],
  },
  {
    id: '2',
    name: 'Furry Friends Services',
    rating: 4.8,
    reviews: 120,
    customersServed: 550,
    address: '101 Pet Ln, Town',
    avgAppointmentTime: '45 min',
    tag: 'Experienced',
    listingTier: 'Gold', // Added listingTier
    totalServices: 10,
    image: require('../Uploads/images2.jpeg'), // Corrected path
    services: [
      { id: 'pc4', name: 'Dog Walking (30 min)', price: '₹300' },
      { id: 'pc5', name: 'Veterinary Check-up', price: '₹1500' },
    ],
  },
  {
    id: '3',
    name: 'Critter Comforts',
    rating: 4.7,
    reviews: 90,
    customersServed: 400,
    address: '202 Bark Ave, Village',
    avgAppointmentTime: '30 min',
    tag: 'Affordable',
    listingTier: 'Silver', // Added listingTier
    totalServices: 6,
    image: require('../Uploads/images3.jpeg'), // Corrected path
    services: [
      { id: 'pc6', name: 'Pet Boarding (Nightly)', price: '₹1200' },
      { id: 'pc7', name: 'Basic Training Session', price: '₹2000' },
    ],
  },
  {
    id: '4',
    name: 'Pet Paradise',
    rating: 4.9,
    reviews: 180,
    customersServed: 800,
    address: '303 Meow St, Metro',
    avgAppointmentTime: '90 min',
    tag: 'Luxury Care',
    listingTier: 'Bronze', // Added listingTier
    totalServices: 12,
    image: require('../Uploads/images4.jpeg'), // Corrected path
    services: [
      { id: 'pc8', name: 'Spa Day for Pets', price: '₹2500' },
      { id: 'pc9', name: 'Pet Photography', price: '₹1800' },
    ],
  },
];
