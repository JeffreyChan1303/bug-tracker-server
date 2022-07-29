import UserModel from '../../models/user.js';

export const addNotificationToUser = async (
  userId,
  { user, title, description }
) => {
  const newNotification = {
    title,
    description,
    createdAt: new Date(),
    createdBy: userId,
    isRead: false,
  };

  await UserModel.updateOne(
    { _id: user },
    {
      $push: { notifications: newNotification },
      $inc: { unreadNotifications: 1 },
    },
    { new: true }
  );
};

export const addNotificationToUsers = async (
  userId,
  { users, title, description }
) => {
  const newNotification = {
    title,
    description,
    createdAt: new Date(),
    createdBy: userId,
    isRead: false,
  };

  await UserModel.updateMany(
    { _id: { $in: users } },
    {
      $push: { notifications: newNotification },
      $inc: { unreadNotifications: 1 },
    },
    { new: true }
  );
};
