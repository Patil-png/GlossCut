export const barbers = [
  {
    _id: '1',
    shopName: 'The Gentlemen\'s Cut',
    address: '123 Main St, Anytown',
    rating: 4.8,
    reviewCount: 120,
    description: 'A classic barbershop experience with modern twists.',
    location: {
      type: 'Point',
      coordinates: [77.7680 + 0.005, 20.9136 + 0.005], // Slightly offset from map center
    }},
  {
    _id: '2',
    shopName: 'Sharp Edge Barbers',
    address: '456 Oak Ave, Anytown',
    rating: 4.5,
    reviewCount: 85,
    description: 'Precision cuts and shaves for the discerning gentleman.',
    location: {
      type: 'Point',
      coordinates: [77.7680 - 0.003, 20.9136 + 0.002], // Slightly offset from map center
    }},
  {
    _id: '3',
    shopName: 'Urban Fade Studio',
    address: '789 Pine Ln, Anytown',
    rating: 4.9,
    reviewCount: 200,
    description: 'Trendy styles and fresh fades in a vibrant atmosphere.',
    location: {
      type: 'Point',
      coordinates: [77.7680 + 0.002, 20.9136 - 0.004], // Slightly offset from map center
    }},
  {
    _id: '4',
    shopName: 'Classic Cuts & Co.',
    address: '101 Elm St, Anytown',
    rating: 4.7,
    reviewCount: 95,
    description: 'Timeless haircuts and grooming services.',
    location: {
      type: 'Point',
      coordinates: [77.7680 - 0.006, 20.9136 - 0.001], // Slightly offset from map center
    }},
];
