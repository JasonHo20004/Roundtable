import knex from 'knex';
import dotenv from 'dotenv';

dotenv.config();

class PostgresDB {
    // static instance = null;

    constructor() {
        throw new Error('Use PostgresDB.getInstance() instead of instantiating.');
    }

    static getInstance() {
        if (!PostgresDB.instance) {
            PostgresDB.instance = knex({
                client: 'pg',
                connection: {
                    host: process.env.DATABASE_HOST,
                    port: Number(process.env.DATABASE_PORT),
                    user: process.env.POSTGRES_USER,
                    password: process.env.POSTGRES_PASSWORD,
                    database: process.env.POSTGRES_DB,
                    ssl: {
                        rejectUnauthorized: true
                    }
                },
                pool: {min: 0, max: 7},
            });
        }

        return PostgresDB.instance;
    }

    static async destroy() {
        if (PostgresDB.instance) {
            await PostgresDB.instance.destroy();
            PostgresDB.instance = null;
        }
    }
}

export const postgresInstance = PostgresDB.getInstance();
export default PostgresDB;
