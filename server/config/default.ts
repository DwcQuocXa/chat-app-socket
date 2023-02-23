require('dotenv').config()

export default {
    corsOrigin: process.env.FRONTEND_URL,
    port: parseInt(process.env.PORT || '3001'),
    host: process.env.HOST,
};
