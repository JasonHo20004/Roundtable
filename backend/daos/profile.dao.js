// backend/daos/profile.dao.js
import {postgresInstance} from '#db/postgres.js';
import Profile from '#models/profile.model.js';

class ProfileDAO {
    constructor() {
        this.tableName = 'Profile';
    }

    async getById(profileId, trx = null) {
        const queryBuilder = trx || postgresInstance;
        try {
            const profileRow = await queryBuilder(this.tableName).where({profileId}).first();
            return profileRow ? Profile.fromDbRow(profileRow) : null;
        } catch (error) {
            console.error(`[ProfileDAO] Error fetching profile by ID ${profileId}:`, error);
            throw error;
        }
    }

    async create(profile, trx = null) {
        const queryBuilder = trx || postgresInstance;
        const {profileId, ...insertData} = profile;
        try {
            const insertedRows = await queryBuilder(this.tableName).insert(insertData).returning('*');
            if (!insertedRows || insertedRows.length === 0) {
                throw new Error('Profile creation in DAO failed: No data returned.');
            }
            return Profile.fromDbRow(insertedRows[0]);
        } catch (error) {
            console.error('[ProfileDAO] Error creating profile:', error);
            throw error;
        }
    }

    async update(profileId, updateData, trx) {

        const queryBuilder = trx ? trx : postgresInstance;
        try {
            // Thực hiện cập nhật và trả về dữ liệu đã cập nhật
            const updatedRows = await queryBuilder(this.tableName)
                .where({profileId})
                .update(updateData)
                .returning('*');

            // Kiểm tra kết quả trả về
            if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
                return null;
            }

            // Trả về đối tượng Profile đã cập nhật
            return Profile.fromDbRow(updatedRows[0]);
        } catch (error) {
            console.error('Error updating profile:', error);
            // Re-throw the original error
            throw error;
        }
    }

    async delete(profileId, trx) {
        const queryBuilder = trx ? trx : postgresInstance;
        try {
            // .del() returns the number of affected rows
            const affectedRows = await queryBuilder(this.tableName).where({profileId}).del();
            // Return true if 1 or more rows were deleted, false otherwise
            return affectedRows > 0;
        } catch (error) {
            console.error('Error deleting profile:', error);
            // Re-throw the original error
            throw error;
        }
    }
}

export default new ProfileDAO();