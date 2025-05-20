import {postgresInstance} from '#db/postgres.js';
import Media from '#models/media.model.js';

class MediaDAO {
    constructor() {
        if (!postgresInstance) {
            throw new Error('Postgres instance is not initialized.');
        }
        this.tableName = 'Media';
    }
    /**
     * @param {string} mediaId
     * @returns {Promise<Media | null>}
     */
    async getById(mediaId) {
        try {
            console.log('mediaDao:', mediaId);
            const mediaRow = await postgresInstance(this.tableName)
                                    .where({mediaId})
                                    .first();
            return Media.fromDbRow(mediaRow);
        } catch (error) {
            console.error('Error fetching media by ID:', error);
            throw new InternalServerError('Database error');
        }
    }
    /**
     * @param {string} uploadUserId
     * @param {string} url
     * @param {string} mediaType
     * @param {string} mimeType
     * @param {number} fileSize
     * @returns {Promise<Media>}
     */
    async create(media,trx = null) {
        const queryBuilder = trx || postgresInstance;
        const { mediaId, createdAt, ...insertData } = media;
        console.log('insertData', insertData);
        

        try {
            const insertRows = await queryBuilder(this.tableName)
                                .insert(insertData)
                                .returning('*');
            return Media.fromDbRow(insertRows[0]);
        } catch (error) {
            console.error('Error creating media:', error);
            throw new InternalServerError('Database error');
        }
    }
}
export default new MediaDAO();