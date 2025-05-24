import express from 'express';
import AuthController from '#controllers/auth.controller.js';
import {isNotAuthenticated} from "#middlewares/auth.mdw.js";
import upload from "#middlewares/upload.mdw.js"; // Assuming you have a multer middleware for file uploads


const router = express.Router();

router.post('/register', AuthController.register);
router.post('/verify-email', AuthController.verifyEmail);
router.post('/login', isNotAuthenticated, AuthController.login);
router.get('/session', AuthController.checkSession);
router.post('/logout', AuthController.logout);
router.put('/profile', upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'banner', maxCount: 1 }
    ]), AuthController.updateProfile);

export default router;