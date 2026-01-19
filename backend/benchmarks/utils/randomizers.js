/**
 * Random Data Generators for Benchmarking
 * Provides realistic test data for the GlossCut/SetKarr ecosystem.
 */

const firstNames = [
    'Aarav', 'Vihaan', 'Aditya', 'Sai', 'Arjun', 'Rohan', 'Ishaan', 'Kabir',
    'Diya', 'Saanvi', 'Ananya', 'Aadhya', 'Kiara', 'Myra', 'Pari', 'Riya'
];

const lastNames = [
    'Patel', 'Sharma', 'Singh', 'Kumar', 'Gupta', 'Verma', 'Mehta', 'Reddy',
    'Nair', 'Iyer', 'Khan', 'Joshi', 'Chopra', 'Malhotra', 'Bhat'
];

const shopNames = [
    'GlossCut Prime', 'Style Studio', 'Elite Gents Salon', 'Urban Cuts',
    'The Barber Shop', 'Scissors & Razors', 'Luxe Salon', 'Grooming Station'
];

const serviceList = [
    { name: 'Haircut', price: 150, duration: 30 },
    { name: 'Shave', price: 100, duration: 20 },
    { name: 'Head Massage', price: 200, duration: 25 },
    { name: 'Beard Trim', price: 80, duration: 15 },
    { name: 'Facial', price: 500, duration: 45 },
    { name: 'Hair Color', price: 800, duration: 60 }
];

module.exports = {
    // Get random item from array
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],

    // Generate random Indian name
    getName: () => `${module.exports.pick(firstNames)} ${module.exports.pick(lastNames)}`,

    // Generate unique email based on timestamp
    getEmail: (prefix) => `${prefix}${Date.now()}${Math.floor(Math.random() * 100)}@gmail.com`,

    // Generate random phone number
    getPhone: () => `9${Math.floor(Math.random() * 1000000000).toString().padEnd(9, '0')}`,

    // Generate Shop Name
    getShopName: () => `${module.exports.pick(shopNames)} ${Math.floor(Math.random() * 100)}`,

    // Get random services (1 to 3 items)
    getServices: () => {
        const count = Math.floor(Math.random() * 3) + 1;
        const services = [];
        for (let i = 0; i < count; i++) {
            services.push(module.exports.pick(serviceList));
        }
        return services;
    },

    // Random sleep/think time in ms
    sleep: (min, max) => new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min)),

    // Random future date
    futureDate: () => {
        const d = new Date();
        d.setDate(d.getDate() + Math.floor(Math.random() * 7)); // Next 7 days
        return d.toISOString().split('T')[0];
    },

    // Random time slot
    timeSlot: () => {
        const hour = Math.floor(Math.random() * 12) + 9; // 9 AM to 9 PM
        return `${hour.toString().padStart(2, '0')}:00`;
    }
};
