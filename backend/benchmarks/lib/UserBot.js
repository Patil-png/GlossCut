const axios = require('axios');
const rand = require('../utils/randomizers');
const metrics = require('./MetricsCollector');

class UserBot {
    constructor(id, baseUrl) {
        this.id = id;
        this.baseUrl = baseUrl;
        this.token = null;
        this.userData = {
            name: rand.getName(),
            email: rand.getEmail(`user${id}`),
            password: 'password123',
            role: 'customer'
        };
        this.userId = null;
    }

    async runDelay() {
        // Random startup delay to avoid stampede
        await rand.sleep(100, 2000);
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
                timeout: 5000 // 5s timeout simulates user patience
            });
            metrics.record(Date.now() - start, true);
            return response.data;
        } catch (err) {
            const duration = Date.now() - start;
            const msg = err.response ? `${err.response.status} ${err.response.statusText}` : err.message;
            metrics.record(duration, false, msg);
            // console.log(`[UserBot ${this.id}] Error ${method} ${url}: ${msg}`);
            throw err;
        }
    }

    async register() {
        try {
            await this.request('post', '/auth/register', this.userData);
            // console.log(`[UserBot ${this.id}] Registered: ${this.userData.email}`);
        } catch (e) { /* Ignore registration errors (duplicate email etc) */ }
    }

    async login() {
        try {
            const res = await this.request('post', '/auth/login', {
                email: this.userData.email,
                password: this.userData.password
            });
            this.token = res.token;
            // Get own ID from profile if needed, or decode token. Assuming token works.
            const userRes = await this.request('get', '/auth/user');
            this.userId = userRes._id;
            // console.log(`[UserBot ${this.id}] Logged In`);
        } catch (e) {
            // console.error(`[UserBot ${this.id}] Login Failed`);
            throw e;
        }
    }

    async browseAndBook(targetBarberId) {
        if (!this.token) return;

        // Simulate "Think Time" (Browsing)
        await rand.sleep(500, 1500);

        // 1. Get User Profile (Home Screen load)
        await this.request('get', '/auth/user');

        // 2. View a Shop/Barber (The target)
        // Note: In real app we search first, but here we target specific ID for test
        try {
            // 3. Create Booking
            const services = rand.getServices();
            const totalPrice = services.reduce((sum, s) => sum + s.price, 0);

            const bookingPayload = {
                barberId: targetBarberId,
                date: rand.futureDate(),
                time: rand.timeSlot(),
                services: services,
                totalPrice: totalPrice,
                appointmentType: 'Basic',
                isOfflineBooking: false,
                customerInfo: {
                    name: this.userData.name,
                    phone: rand.getPhone()
                }
            };

            await this.request('post', '/booking', bookingPayload);
            // console.log(`[UserBot ${this.id}] Booking Created`);
        } catch (e) {
            // console.error(`[UserBot ${this.id}] Booking Failed`);
        }
    }
}

module.exports = UserBot;
