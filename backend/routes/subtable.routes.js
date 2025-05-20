import express from 'express';
import SubtableController from "#controllers/subtable.controller.js";
import {isAuthenticated} from "#middlewares/auth.mdw.js";
import upload from "#middlewares/upload.mdw.js"; // Assuming you have a multer middleware for file uploads


const router = express.Router();


router.post('/',isAuthenticated,upload.fields([
        { name: 'iconFile', maxCount: 1 },
        { name: 'bannerFile', maxCount: 1 }
    ]),SubtableController.createSubtable);
router.get('/search', SubtableController.searchSubtables);
router.get('/subscribed', isAuthenticated, SubtableController.getSubscribedSubtables);

router.post('/user/:subtableId',SubtableController.followSubtable);
router.delete('/user/:subtableId',SubtableController.unfollowSubtable);
router.get('/user/:subtableId',SubtableController.getJoinSubtable)

router.get('/:subtableName', SubtableController.getSubtableDetails);
router.get('/:subtableName/posts', SubtableController.getSubtablePosts);
router.get('/:subtableName/:mediaId', SubtableController.getSubtableMedia);


export default router;