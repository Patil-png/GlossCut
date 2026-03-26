const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

/**
 * WhatsApp Service for GlossCut
 * Implements safety measures to avoid being banned:
 * 1. Randomized Delays (5-15s)
 * 2. Spintax (Text Variation)
 * 3. Session Persistence (LocalAuth)
 */

class WhatsAppService {
    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth({
                dataPath: './.wwebjs_auth'
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process', // <- this one element can help a lot with memory
                    '--disable-gpu'
                ]
            }
        });

        this.isReady = false;

        this.client.on('qr', (qr) => {
            console.log('--- WHATSAPP LOGIN REQUIRED ---');
            qrcode.generate(qr, { small: true });
            console.log('Scan the QR code above to log in to WhatsApp.');
        });

        this.client.on('ready', () => {
            console.log('✅ WhatsApp Client is Ready!');
            this.isReady = true;
        });

        this.client.on('authenticated', () => {
            console.log('✅ WhatsApp Authenticated!');
        });

        this.client.on('auth_failure', (msg) => {
            console.error('❌ WhatsApp Authentication Failure:', msg);
        });

        this.client.on('disconnected', (reason) => {
            console.log('❌ WhatsApp Client Disconnected:', reason);
            this.isReady = false;
        });

        this.client.initialize();
    }

    /**
     * Sleep helper for randomized delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get a random element from an array
     */
    getRandom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    /**
     * Generate a safe OTP message using spintax
     */
    generateMessage(otp) {
        const greetings = [
            "Hi!", "Hello,", "Hey there!", "Greetings from GlossCut!", 
            "Welcome to GlossCut!", "Hi there,"
        ];

        const footers = [
            "Enjoy premium grooming at your doorstep. ✨",
            "Book top-rated professionals in seconds. ✂️",
            "Experience the future of grooming with GlossCut. 🚀",
            "Quality service, transparent pricing, always. 💎"
        ];

        const advantages = `
*Why GlossCut?*
✅ *Express Grooming:* At home or in-salon, your choice.
✅ *Top Professionals:* Only the best, vetted experts.
✅ *Instant Booking:* Hassle-free scheduling in seconds.
✅ *Transparent Pricing:* No hidden costs, ever.
        `.trim();

        const selectedGreeting = this.getRandom(greetings);
        const selectedFooter = this.getRandom(footers);

        const message = `
${selectedGreeting}

Your *GlossCut* verification code is: *${otp}*

This code is valid for 5 minutes. Please do not share it with anyone.

${advantages}

${selectedFooter}
        `.trim();

        return message;
    }

    /**
     * Send OTP safely with randomized delays
     */
    async sendSafeOTP(phone, otp) {
        if (!this.isReady) {
            console.warn('⚠️ WhatsApp client is not ready yet. Cannot send OTP.');
            return { success: false, error: 'WhatsApp client not ready' };
        }

        try {
            // Standardize phone number format for WhatsApp (e.g., 91XXXXXXXXXX)
            let formattedPhone = phone.replace(/[^\d]/g, '');
            if (formattedPhone.length === 10) {
                formattedPhone = `91${formattedPhone}`;
            }
            const chatId = `${formattedPhone}@c.us`;

            // Randomized delay between 5 to 15 seconds
            const randomDelay = Math.floor(Math.random() * (15000 - 5000 + 1) + 5000);
            console.log(`⏳ Waiting ${randomDelay}ms before sending OTP to ${formattedPhone}...`);
            await this.sleep(randomDelay);

            // Simulate "Typing" state to look more human
            const chat = await this.client.getChatById(chatId);
            await chat.sendStateTyping();
            await this.sleep(3000); // "Type" for 3 seconds

            const message = this.generateMessage(otp);
            await this.client.sendMessage(chatId, message);
            
            console.log(`✅ WhatsApp OTP sent to ${formattedPhone}`);
            return { success: true };
        } catch (error) {
            console.error('❌ Error sending WhatsApp OTP:', error);
            return { success: false, error: error.message };
        }
    }
}

// Export as a singleton
module.exports = new WhatsAppService();
