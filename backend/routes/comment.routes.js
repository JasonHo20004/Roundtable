import express from 'express';
import CommentController from "#controllers/comment.controller.js";
import {checkCommentOwnership, isAuthenticated} from "#middlewares/auth.mdw.js";

const router = express.Router();

router.get('/', CommentController.getComments);
router.patch('/:commentId', isAuthenticated, checkCommentOwnership, CommentController.updateComment);
router.delete('/:commentId', isAuthenticated, checkCommentOwnership, CommentController.deleteComment);
router.post('/:commentId/replies', isAuthenticated, CommentController.replyToComment);
router.post('/:commentId/vote', isAuthenticated, CommentController.castVote);

export default router;