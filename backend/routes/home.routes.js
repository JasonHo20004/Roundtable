import express from 'express';
import homeController from '#controllers/home.controller.js';
import {isAuthenticated} from "#middlewares/auth.mdw.js";
import {isNotAuthenticated} from "#middlewares/auth.mdw.js";
const router = express.Router();


router.get('/posts', homeController.getHomePosts);

export default router;