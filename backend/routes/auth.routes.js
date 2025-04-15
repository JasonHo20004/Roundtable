import express from 'express';
import authController from '#controllers/auth.controller.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/verify-email', authController.verifyEmail);

export default router;