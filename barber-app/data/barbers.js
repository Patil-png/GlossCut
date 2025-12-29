export const barbersData = [
  {
    id: '1',
    name: 'KGN Salon',
    rating: 4.8,
    reviews: 250,
    customersServed: 1200,
    address: 'WQ7C+G6F, Dastur Nagar, Amravati, Maharashtra 444605, India.',
    latitude: 20.9138039,
    longitude: 77.7705332,
    avgAppointmentTime: '30 min',
    tag: 'Highly Rated',
    totalServices: 15,
    image: require('../Uploads/images1.jpeg'),
    services: [
      { id: 's1', name: 'Classic Haircut', price: '₹300' },
      { id: 's2', name: 'Beard Trim', price: '₹150' },
      { id: 's3', name: 'Hot Towel Shave', price: '₹250' },
    ],
  },
  {
    id: '2',
    name: 'Saitirth Hair Salon',
    rating: 4.5,
    reviews: 180,
    customersServed: 950,
    address: 'Deorao Rambhajirao Deshmukh Rd, Sindhu Nagar, Dastur Nagar, Amravati, Maharashtra 444605, India.',
    latitude: 20.9157331,
    longitude: 77.7650772,
    avgAppointmentTime: '45 min',
    tag: 'Verified Pro',
    totalServices: 12,
    image: require('../Uploads/images2.jpeg'),
    services: [
      { id: 's4', name: 'Modern Fade', price: '₹350' },
      { id: 's5', name: 'Head Shave', price: '₹200' },
    ],
  },
  {
    id: '3',
    name: 'Gentleman\'s Quarters', // Keeping this as a placeholder since Jawed Habib coordinates are not verified
    rating: 4.9,
    reviews: 320,
    customersServed: 1500,
    address: '789 Pine Ln, Village', // Keeping this as a placeholder since Jawed Habib coordinates are not verified
    latitude: 20.9138039, // Using KGN Salon's latitude as a placeholder
    longitude: 77.7705332, // Using KGN Salon's longitude as a placeholder
    avgAppointmentTime: '60 min',
    tag: '1K+ Customers',
    totalServices: 20,
    image: require('../Uploads/images3.jpeg'),
    services: [
      { id: 's6', name: 'Gentleman\'s Cut', price: '₹400' },
      { id: 's7', name: 'Beard Sculpting', price: '₹250' },
      { id: 's8', name: 'Hair Coloring', price: '₹500' },
    ],
  },
  {
    id: '4',
    name: 'Modern Barber', // Keeping this as a placeholder
    rating: 4.7,
    reviews: 210,
    customersServed: 1100,
    address: '101 Elm Rd, Metro', // Keeping this as a placeholder
    latitude: 20.9157331, // Using Saitirth Hair Salon's latitude as a placeholder
    longitude: 77.7650772, // Using Saitirth Hair Salon's longitude as a placeholder
    avgAppointmentTime: '30 min',
    tag: 'Quick Service',
    totalServices: 18,
    image: require('../Uploads/images4.jpeg'),
    services: [
      { id: 's9', name: 'Buzz Cut', price: '₹200' },
      { id: 's10', name: 'Kids Haircut', price: '₹250' },
    ],
  },
  {
    id: '5',
    name: 'OP Bolo',
    rating: 2.5,
    reviews: 2010,
    customersServed: 11000,
    address: 'MIDC Road ,Amt',
    latitude: 37.795, // Placeholder latitude
    longitude: -122.450, // Placeholder longitude
    avgAppointmentTime: '25 min',
    tag: 'Mast Service',
    totalServices: 18,
    image: require('../Uploads/images3.jpeg'),
    services: [
      { id: 's11', name: 'Buzz Cut kahde', price: '₹2060' },
      { id: 's12', name: 'Haircut', price: '₹2590' },
    ],
  },
];
