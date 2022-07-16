import express from 'express';

import auth from '../middleware/auth.js';
import {
  signin,
  signup,
  getAllUsersBySearch,
  getUserNotificationsBySearch,
  createUsersNotification,
  deleteUserNotification,
  getUnreadNotifications,
  readNotification,
  readAllNotifications,
} from '../controllers/users.js';

const router = express.Router();

router.post('/signin', signin);
router.post('/signup', signup);

router.get('/allUsers/search', auth, getAllUsersBySearch);

router.get('/notifications/search', auth, getUserNotificationsBySearch);

router.put('/createUsersNotification', auth, createUsersNotification);
router.put('/deleteUserNotification', auth, deleteUserNotification);

router.get('/unreadNotifications', auth, getUnreadNotifications);

router.patch('/readNotification', auth, readNotification);
router.patch('/readAllNotifications', auth, readAllNotifications);

export default router;
