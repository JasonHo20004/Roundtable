

class Media {
    /**
     * @param {string | null} mediaId
     * @param {string } uploaderUserId
     * @param {string | null} [url=null]
     * @param {string | null} [mediaType = null]
     * @param {string | null} [mimeType = null]
     * @param {Int | null} [fileSize=null]
     * @param {Date |null } [createdAt=null]
     */
    constructor(mediaId, uploaderUserId, url = null, mediaType = null, mimeType = null, fileSize = null, createdAt = null) {
        /** @type {string | null} */
        this.mediaId = mediaId;

        /** @type {string} */
        this.uploaderUserId = uploaderUserId;

        /** @type {string | null} */
        this.url = url;

        /** @type {string | null} */
        this.mediaType = mediaType;

        /** @type {string | null} */
        this.mimeType = mimeType;

        /** @type {Int | null} */
        this.fileSize = fileSize;

        /** @type {Date | null} */
        this.createdAt = createdAt instanceof Date ? createdAt : (createdAt ? new Date(createdAt) : null);
    }
    static fromDbRow(row) {
        if (!row) {
            return null;
        }

        // Handle potential snake_case and provide fallbacks
        const mediaIdFromRow = row.mediaId || row.media_id;
        const uploaderUserIdFromRow = row.uploaderUserId || row.uploader_user_id;
        const createdAtFromRow = row.createdAt || row.created_at;

        return new Media(
            mediaIdFromRow,
            uploaderUserIdFromRow,
            row.url,
            row.mediaType,
            row.mimeType,
            row.fileSize,
            createdAtFromRow
        );
    }
}
export default Media;