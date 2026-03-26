const whatsappService = require('./backend/utils/whatsappService');

console.log('Testing WhatsApp Service Initialization...');

// The service initializes on import. 
// We'll wait a bit to see if it triggers 'qr' or 'ready'.

setTimeout(() => {
    if (whatsappService.isReady) {
        console.log('✅ Success: WhatsApp Service is Ready!');
    } else {
        console.log('ℹ️ WhatsApp Service is still initializing or needs QR scan.');
    }
    process.exit(0);
}, 10000);
