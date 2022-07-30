import express from 'express';
import auth from '../middleware/auth.js';
import {
  signin,
  googleSignin,
  signup,
  verifyEmail,
  sendVerification,
} from '../controllers/users/auth.js';
import {
  getUserNotificationsBySearch,
  deleteUserNotification,
  getUnreadNotifications,
  readNotification,
  readAllNotifications,
} from '../controllers/users/notifications.js';
import getAllUsersBySearch from '../controllers/users/users.js';

const router = express.Router();

router.post('/signin', signin);
router.post('/googleSignin', googleSignin);
router.post('/signup', signup);
router.post('/sendVerification', sendVerification);
router.patch('/verification/:token', verifyEmail);

router.get('/allUsers/search', auth, getAllUsersBySearch);

router.get('/notifications/search', auth, getUserNotificationsBySearch);
router.put('/deleteUserNotification', auth, deleteUserNotification);
router.get('/unreadNotifications', auth, getUnreadNotifications);
router.patch('/readNotification', auth, readNotification);
router.patch('/readAllNotifications', auth, readAllNotifications);

export default router;
