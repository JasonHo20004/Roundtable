import redis from 'redis';

const client = await redis.createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        tls: process.env.NODE_ENV === 'production' ? {
            rejectUnauthorized: true
        } : undefined
    },
    password: process.env.REDIS_PASSWORD
})
    .on('error', (err) => console.log('Redis Client Error', err))
    .on('connect', () => console.log('Redis Client Connected'))
    .on('ready', () => console.log('Redis Client Ready'))
    .on('end', () => console.log('Redis Client Disconnected'))
    .connect()

export default client;

