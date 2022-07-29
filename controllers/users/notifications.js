import UserModel from '../../models/user.js';

export const getUserNotificationsBySearch = async (req, res) => {
  const { page, searchQuery } = req.query;
  const { userId } = req;

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

export const deleteUserNotification = async (req, res) => {
  const { userId } = req;
  let { createdAt } = req.body;
  createdAt = new Date(createdAt);

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
