// backend/daos/principal.dao.js
import {postgresInstance} from "#db/postgres.js";
import Principal from "#models/principal.model.js";

class PrincipalDAO {
    constructor() {
        this.tableName = 'Principal';
    }

    async getById(principalId, trx = null) {
        const queryBuilder = trx || postgresInstance;
        try {
            const principalRow = await queryBuilder(this.tableName).where({principalId}).first();
            return principalRow ? Principal.fromDbRow(principalRow) : null;
        } catch (error) {
            console.error(`[PrincipalDAO] Error fetching principal by ID ${principalId}:`, error);
            throw error;
        }
    }

    async getByAccountId(accountId, trx = null) {
        const queryBuilder = trx || postgresInstance;
        try {
            const principalRow = await queryBuilder(this.tableName).where({accountId}).first();
            return principalRow ? Principal.fromDbRow(principalRow) : null;
        } catch (error) {
            console.error(`[PrincipalDAO] Error fetching principal by Account ID ${accountId}:`, error);
            throw error;
        }
    }

    async getByProfileId(profileId, trx = null) {
        const queryBuilder = trx || postgresInstance;
        try {
            const principalRow = await queryBuilder(this.tableName).where({profileId}).first();
            return principalRow ? Principal.fromDbRow(principalRow) : null;
        } catch (error) {
            console.error(`[PrincipalDAO] Error fetching principal by Account ID ${accountId}:`, error);
            throw error;
        }
    }

    async create(principal, trx = null) {
        const queryBuilder = trx || postgresInstance;
        const {principalId, ...insertData} = principal;
        try {
            const insertedRows = await queryBuilder(this.tableName).insert(insertData).returning("*");
            if (!insertedRows || insertedRows.length === 0) {
                throw new Error("Principal creation in DAO failed: No data returned.");
            }
            return Principal.fromDbRow(insertedRows[0]);
        } catch (error) {
            console.error('[PrincipalDAO] Error creating principal:', error);
            throw error;
        }
    }
}

export default new PrincipalDAO();