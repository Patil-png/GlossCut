const axios = require('axios');
const rand = require('../utils/randomizers');
const metrics = require('./MetricsCollector');

class BarberBot {
    constructor(id, baseUrl) {
        this.id = id;
        this.baseUrl = baseUrl;
        this.token = null;
        this.barberId = null;
        this.userData = {
            name: `Barber ${rand.getName()}`,
            email: rand.getEmail(`barber${id}`),
            password: 'password123',
            role: 'barber',
            phone: rand.getPhone()
        };
        this.shopData = {
            name: rand.getShopName(),
            address: '123 Benchmark St, Test City',
            phone: rand.getPhone(),
            category: 'Barber'
        };
    }

    async request(method, url, data = null) {
        const start = Date.now();
        try {
            const headers = this.token ? { 'x-auth-token': this.token } : {};
            const response = await axios({
                method,
                url: `${this.baseUrl}${url}`,
                data,
                headers,
                timeout: 5000
            });
            metrics.record(Date.now() - start, true);
            return response.data;
        } catch (err) {
            const duration = Date.now() - start;
            const msg = err.response ? `${err.response.status} ${err.response.statusText}` : err.message;
            metrics.record(duration, false, msg);
            throw err;
        }
    }

    async setup() {
        // 1. Register
        try {
            await this.request('post', '/auth/register', this.userData);
        } catch (e) { }

        // 2. Login
        const res = await this.request('post', '/auth/login', {
            email: this.userData.email,
            password: this.userData.password
        });
        this.token = res.token;

        // 3. Get ID
        const user = await this.request('get', '/auth/user');
        this.barberId = user._id;

        // 4. Create Shop (if not exists)
        // We try to fetch shop first. If 404/null, create.
        try {
            const shopRes = await this.request('get', '/shop/me'); // Assuming /shop/me endpoint exists or similar
            if (!shopRes) throw new Error('No shop');
        } catch (e) {
            // Create shop
            await this.request('post', '/shop', this.shopData);
            // console.log(`[BarberBot ${this.id}] Shop Created`);
        }
    }

    async checkBookings() {
        if (!this.token) return;

        // Simulate refreshing bookings page
        try {
            const bookings = await this.request('get', '/booking/barber/all');

            // Find pending bookings and accept them
            const pending = bookings.filter(b => b.status === 'Pending');

            for (const booking of pending) {
                // think time
                await rand.sleep(200, 500);
                // Accept
                await this.request('put', `/booking/accept/${booking._id}`);
                // console.log(`[BarberBot ${this.id}] Accepted Booking ${booking._id}`);
            }
        } catch (e) {
            // console.error(`[BarberBot ${this.id}] Check Bookings Failed`);
        }
    }
}

module.exports = BarberBot;
