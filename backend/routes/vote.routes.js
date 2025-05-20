// backend/routes/vote.routes.js
import express from 'express';
import {checkVoteOwnership, isAuthenticated} from "#middlewares/auth.mdw.js";
// Import controller instance AND the middleware
import VoteController from "#controllers/vote.controller.js";

const router = express.Router();

router.get('/', VoteController.getVotedItems);

router.patch(
    '/:voteId',
    isAuthenticated,
    checkVoteOwnership, // Check ownership before allowing update
    VoteController.updateVote
);

router.delete(
    '/:voteId',
    isAuthenticated,
    checkVoteOwnership, // Check ownership before allowing delete
    VoteController.deleteVote
);

export default router;