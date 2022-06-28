import express from 'express';

import auth from '../middleware/auth.js';
import { signin, signup, getAllUsers, getAllUsersBySearch, getUserNotifications, createUsersNotification } from '../controllers/users.js'

const router = express.Router();

router.post('/signin', signin);
router.post('/signup', signup);

router.get('/allUsers', auth, getAllUsers)
router.get('/allUsers/search', auth, getAllUsersBySearch);

router.get('/notifications', auth, getUserNotifications);
router.put('/createUsersNotification', auth, createUsersNotification);

export default router;