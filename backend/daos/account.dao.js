// backend/daos/account.dao.js
import {postgresInstance} from '#db/postgres.js';
import Account from '#models/account.model.js'; // Ensure Account model has fromDbRow

class AccountDAO {
    constructor() {
        this.tableName = 'Account';
    }

    async getById(accountId, trx = null) { // Allow transaction to be passed
        const queryBuilder = trx || postgresInstance;
        try {
            const accountRow = await queryBuilder(this.tableName).where({accountId}).first();
            return accountRow ? Account.fromDbRow(accountRow) : null;
        } catch (error) {
            console.error(`[AccountDAO] Error finding account by ID ${accountId}:`, error);
            throw error; // Let service layer handle this (e.g., as InternalServerError)
        }
    }

    async getByUsername(username, trx = null) {
        const queryBuilder = trx || postgresInstance;
        try {
            const accountRow = await queryBuilder(this.tableName).where({username}).first();
            return accountRow ? Account.fromDbRow(accountRow) : null;
        } catch (error) {
            console.error(`[AccountDAO] Error finding account by username ${username}:`, error);
            throw error;
        }
    }

    async getByEmail(email, trx = null) {
        const queryBuilder = trx || postgresInstance;
        try {
            const accountRow = await queryBuilder(this.tableName).where({email}).first();
            return accountRow ? Account.fromDbRow(accountRow) : null;
        } catch (error) {
            console.error(`[AccountDAO] Error finding account by email ${email}:`, error);
            throw error;
        }
    }

    async create(account, trx = null) {
        const queryBuilder = trx || postgresInstance;
        // Ensure model instances are plain objects for Knex or destructure them
        const {accountId, created, updatedAt, ...insertData} = account;
        try {
            const insertedRows = await queryBuilder(this.tableName).insert(insertData).returning('*');
            if (!Array.isArray(insertedRows) || insertedRows.length === 0) {
                // This case should ideally be caught by DB constraints or Knex errors earlier
                throw new Error('Account creation failed: No data returned from insert operation.');
            }
            return Account.fromDbRow(insertedRows[0]);
        } catch (error) {
            console.error('[AccountDAO] Error creating account:', error);
            // Check for specific DB errors like unique constraint violation if needed
            // e.g., if (error.code === '23505' && error.constraint === 'account_username_key') { ... }
            throw error; // Re-throw for service layer
        }
    }
}

export default new AccountDAO();
