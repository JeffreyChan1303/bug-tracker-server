import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import UserModel from '../models/user.js';

export const signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await UserModel.findOne({ email });

    if (!existingUser)
      return res.status(404).json({ message: "User doesn't exist!." });

    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!isPasswordCorrect)
      return res.status(400).json({ message: 'Invalid credentials.' });

    const token = jwt.sign(
      {
        email: existingUser.email,
        id: existingUser._id,
        name: existingUser.name,
      },
      process.env.TOKEN_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(200).json({ userObject: existingUser, token });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Something went wrong in the signin controller' });
  }
};

export const signup = async (req, res) => {
  const { email, password, confirmPassword, firstName, lastName } = req.body;
  console.log(password);
  console.log(confirmPassword);

  try {
    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords dont match.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const userObject = await UserModel.create({
      email,
      password: hashedPassword,
      name: `${firstName} ${lastName}`,
    });

    const token = jwt.sign(
      { email: userObject.email, id: userObject._id, name: userObject.name },
      process.env.TOKEN_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(200).json({ userObject, token });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Something went wrong in the signup controller' });
  }
};

export const getAllUsersBySearch = async (req, res) => {
  const { page, searchQuery } = req.query;

  try {
    const search = new RegExp(searchQuery, 'i'); // 'i' stands for ignore case
    const itemsPerPage = 8;
    const startIndex = (Number(page) - 1) * itemsPerPage;
    const total = await UserModel.countDocuments({
      $or: [{ name: search }, { email: search }],
    });

    // $or means: either find me the title or other things in the array
    const users = await UserModel.find(
      { $or: [{ name: search }, { email: search }] },
      '-notifications'
    )
      .sort({ _id: -1 })
      .limit(itemsPerPage)
      .skip(startIndex);

    return res.status(200).json({
      data: users,
      currentPage: Number(page),
      numberOfPages: Math.ceil(total / itemsPerPage),
    });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

export const getUserNotificationsBySearch = async (req, res) => {
  const { page, searchQuery } = req.query;
  const { userId } = req;
  if (!userId) return res.JSON({ message: 'Unauthenticated' });

  try {
    const itemsPerPage = 8;
    const startIndex = (Number(page) - 1) * itemsPerPage;
    let { notifications } = await UserModel.findOne(
      { _id: userId },
      'notifications'
    );
    // find search query within the title. This also reverses the array
    const tempArr = [];
    for (let i = 0; i < notifications.length; i += 1) {
      if (
        notifications[i].title
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        notifications[i].description
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ) {
        tempArr.push(notifications[i]);
      }
    }
    notifications = tempArr;
    // sort by date
    notifications = notifications.sort(
      (objA, objB) => Number(objB.createdAt) - Number(objA.createdAt)
    );

    const total = notifications.length;

    notifications = notifications.splice(startIndex, itemsPerPage);

    return res.status(200).json({
      notifications,
      currentPage: Number(page),
      numberOfPages: Math.ceil(total / itemsPerPage),
    });
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: error.message });
  }
};

export const createUsersNotification = async (req, res) => {
  const { users, title, description } = req.body;

  if (!req.userId) return res.JSON({ message: 'Unauthenticated' });

  const newNotification = {
    title,
    description,
    createdAt: new Date(),
    createdBy: req.userId,
    isRead: false,
  };

  try {
    await UserModel.updateMany(
      { _id: { $in: users } },
      {
        $push: { notifications: newNotification },
        $inc: { unreadNotifications: 1 },
      },
      { new: true }
    );

    return res.status(200);
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: error.message });
  }
};

export const deleteUserNotification = async (req, res) => {
  const { userId } = req;
  let { createdAt } = req.body;
  createdAt = new Date(createdAt);

  if (!req.userId) return res.JSON({ message: 'Unauthenticated' });

  try {
    // this can be improved with conditional query in mongodb.
    // find if notification was read
    const { notifications } = await UserModel.findById(userId, 'notifications');

    let notification;
    let notificationIsRead = true;
    // find if the notification was read
    for (let i = 0; i < notifications.length; i += 1) {
      notification = notifications[i];
      if (
        notification.createdAt.getTime() === new Date(createdAt).getTime() &&
        notification.isRead === false
      ) {
        notificationIsRead = false;
        break;
      }
    }

    // if notification is not read, decrement unread notifications
    if (notificationIsRead) {
      await UserModel.findByIdAndUpdate(userId, {
        $pull: {
          notifications: {
            createdAt,
          },
        },
      });
    } else {
      await UserModel.findByIdAndUpdate(userId, {
        $pull: {
          notifications: {
            createdAt,
          },
        },
        $inc: {
          unreadNotifications: -1,
        },
      });
    }

    return res.status(200);
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: error.message });
  }
};

export const getUnreadNotifications = async (req, res) => {
  if (!req.userId) return res.JSON({ message: 'Unauthenticated' });

  try {
    const user = await UserModel.findById(req.userId, 'unreadNotifications');
    const numberOfUnreadNotifications = user.unreadNotifications;

    return res.status(200).json(numberOfUnreadNotifications);
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: error.message });
  }
};

export const readNotification = async (req, res) => {
  if (!req.userId) return res.JSON({ message: 'Unauthenticated' });

  // This can be improved with experience in mongoose and mongodb. find out howt project or a conditional update within mongodb
  // so we don't have to make two calls hand have less date being transfered when acessing user notifications

  const { createdAt } = req.body;
  const { userId } = req;

  try {
    const { notifications } = await UserModel.findById(userId, 'notifications');

    let notification;
    let notificationIsRead = true;
    // find if the notification was read
    for (let i = 0; i < notifications.length; i += 1) {
      notification = notifications[i];
      if (
        notification.createdAt.getTime() === new Date(createdAt).getTime() &&
        notification.isRead === false
      ) {
        notificationIsRead = false;
        break;
      }
    }
    // if the notification is not read, update the notification
    if (!notificationIsRead) {
      await UserModel.updateOne(
        {
          _id: userId,
          'notifications.createdAt': createdAt,
        },
        {
          $set: {
            'notifications.$.isRead': true,
          },
          $inc: {
            unreadNotifications: -1,
          },
        }
      );
    }

    return res
      .status(200)
      .json({ message: 'notification was successfully read' });
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: error.message });
  }
};

export const readAllNotifications = async (req, res) => {
  if (!req.userId) return res.json({ message: 'Unauthenticated' });

  try {
    await UserModel.updateOne(
      { _id: req.userId },
      {
        $set: {
          'notifications.$[].isRead': true,
        },
        unreadNotifications: 0,
      }
    );

    return res
      .status(200)
      .json({ message: 'Successfullly read all notifications' });
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: error.message });
  }
};
