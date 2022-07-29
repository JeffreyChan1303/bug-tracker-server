import mongoose from 'mongoose';
import { ProjectMessage, ProjectArchive } from '../../models/projectModels.js';
import UserModel from '../../models/user.js';

export const getProjectUsers = async (req, res) => {
  const { projectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(404).send('No project with that ID');
  }

  try {
    const isArchivedProject = await ProjectArchive.exists({ _id: projectId });
    let project;
    if (isArchivedProject) {
      project = await ProjectArchive.findById(projectId, 'users');
    } else {
      project = await ProjectMessage.findById(projectId, 'users');
    }

    const projectUsers = project.users;

    return res.status(200).json(projectUsers);
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: error.message });
  }
};

export const updateUsersRoles = async (req, res) => {
  const { id: projectId } = req.params; // this is the project Id
  const users = req.body;
  const { userId } = req;
  // console.log(projectId, users);
  if (!userId)
    return res
      .status(401)
      .json({ severity: 'error', message: 'Unauthenticated' });

  try {
    // check if user is a admin or project manager

    // Get my projects function will query for the projects that the user is in
    const oldProject = await ProjectMessage.findById(
      projectId,
      'users creator title'
    );
    // check if the user is in the project
    if (!oldProject.users[userId]) {
      return res.status(404).json({ message: 'A user is not in the project' });
    }

    // check if the user's role is allowed to assign roles to users
    const assignedRole = users[Object.keys(users)[0]].role;
    const assignerRole = oldProject.users[userId].role;
    console.log(assignedRole, assignerRole);
    // can only assign admin if they are a admin
    if (assignedRole === 'Admin' && assignerRole !== 'Admin') {
      return res.status(401).json({
        message: 'User is not a Admin. Unable to assign Admin role to others',
      });
    }

    // if a defeloper, you cann't assign role
    if (assignerRole === 'Developer') {
      return res.status(401).json({
        message: 'User is a developer in the project. Unable to assign roles',
      });
    }

    // check if the creator is in the project, if they are, change thier role to admin
    if (users[userId]) {
      users[userId].role = 'Admin';
    }

    const updatedProject = await ProjectMessage.findByIdAndUpdate(
      projectId,
      { users: { ...oldProject.users, ...users } },
      { new: true }
    );
    console.log(updatedProject);

    // Make a new notification for the users
    const newNotification = {
      title: `${req.userName} has changed your role in a project`,
      description: `${req.userName} has changed your role to ${assignedRole} in project: ${oldProject.title}.`,
      createdAt: new Date(),
      createdBy: req.userId,
      isRead: false,
    };

    await UserModel.updateMany(
      { _id: { $in: Object.keys(users) } },
      {
        $push: { notifications: newNotification },
        $inc: { unreadNotifications: 1 },
      },
      { new: true }
    );

    const userArr = Object.keys(users);
    let usersString = '';
    for (let i = 0; i < userArr.length; i += 1) {
      if (i === 0) {
        usersString += users[userArr[i]].name;
      } else {
        usersString += `, ${users[userArr[i]].name}`;
      }
    }

    return res.status(200).json({
      message: `Successfully updated roles of ${usersString} in project ${oldProject.title}`,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({ message: error.message });
  }
};

export const deleteUsersFromProject = async (req, res) => {
  // We need to notification when a user is deleted from the project!!
  const { projectId } = req.params;
  const users = req.body;

  const usersObject = {};
  Object.keys(users).map((element) => {
    usersObject[`users.${element}`] = '';
    return null;
  });

  try {
    const { users: oldProjectUsers, title: projectTitle } =
      await ProjectMessage.findById(projectId, 'users');
    // This guards against users who are not a admin of the project
    if (oldProjectUsers[req.userId]?.role !== 'Admin') {
      return res.status(401).json({
        message:
          'You do not have permission to delete users in this project. Not a admin.',
      });
    }

    // delete the users from the project
    let user;
    Object.keys(users).map(async (userId) => {
      console.log('userId: ', userId);
      user = await UserModel.findByIdAndUpdate(userId);
      console.log(user);
    });

    await ProjectMessage.findByIdAndUpdate(
      projectId,
      {
        $unset: usersObject,
      },
      { new: true }
    );

    // create a notification of deletion
    const newNotification = {
      title: `${req.userName} has deleted you from a project`,
      description: `${req.userName} has deleted you from project: ${projectTitle}.`,
      createdAt: new Date(),
      createdBy: req.userId,
      isRead: false,
    };

    await UserModel.updateMany(
      { _id: { $in: Object.keys(users) } },
      {
        $push: { notifications: newNotification },
        $inc: { unreadNotifications: 1 },
      },
      { new: true }
    );

    return res
      .status(200)
      .json({ message: 'Project Users deleted successfully' });
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: error.message });
  }
};

export const inviteUsersToProject = async (req, res) => {
  const { projectId } = req.params;
  const { users, role } = req.body;
  try {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(404).send('No project with that ID');
    }
    // check if user is in and has authority in the project
    const {
      users: projectUsers,
      title: projectTitle,
      creator: projectCreator,
    } = await ProjectMessage.findById(projectId, 'users title creator');

    if (projectCreator !== req.userId) {
      if (
        projectUsers[req.userId]?.role !== 'Admin' &&
        projectUsers[req.userId]?.role !== 'Project Manager'
      ) {
        return res.status(404).json({
          message: 'User is not admin or project manager in the project',
        });
      }
    }

    const newNotification = {
      title: `${req.userName} has invited you to thier project`,
      description: `${req.userName} has invited you to project: ${projectTitle}, as a ${role}`,
      createdAt: new Date(),
      createdBy: req.userId,
      isRead: false,
      notificationType: 'project invite',
      invite: {
        inviterId: req.userId,
        projectId,
        role,
      },
    };

    // check if user has notification already
    let userArr = Object.keys(users);
    const checkForNotification = async () => {
      const databaseUsers = await UserModel.find(
        { _id: { $in: userArr } },
        'notifications'
      );
      for (let i = 0; i < databaseUsers.length; i += 1) {
        for (let j = 0; j < databaseUsers[i].notifications.length; j += 1) {
          const invite1 = databaseUsers[i].notifications[j].invite;
          const invite2 = newNotification.invite;
          console.log(
            invite1.inviterId === invite2.inviterId &&
              invite1.projectId === invite2.projectId &&
              invite1.role === invite2.role
          );
          if (
            invite1.inviterId === invite2.inviterId &&
            invite1.projectId === invite2.projectId &&
            invite1.role === invite2.role
          ) {
            // this deletes the user that was already invited form the invite list
            delete users[userArr[i]];
            break;
          }
        }
      }
    };
    await checkForNotification();

    console.log('invited users: ', users);

    userArr = Object.keys(users);
    if (Object.keys(users).length === 0) {
      return res
        .status(200)
        .json({ message: 'Users have already been invited' });
    }

    let usersString = '';
    for (let i = 0; i < userArr.length; i += 1) {
      usersString += `, ${users[userArr[i]].name}`;
    }

    // this adds the notification to the user's database
    await UserModel.updateMany(
      { _id: { $in: Object.keys(users) } },
      {
        $push: { notifications: newNotification },
        $inc: { unreadNotifications: 1 },
      },
      { new: true }
    );

    return res
      .status(200)
      .json({ message: `Successfully invited${usersString} to project` });
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: error.message });
  }
};

export const acceptProjectInvite = async (req, res) => {
  const notification = req.body;
  console.log(notification);

  const { userId } = req;
  if (!userId) return res.status(401).json({ message: 'Unauthenticated' });

  try {
    // check if the user actually has an invitation
    const { notifications: userNotifications } = await UserModel.findById(
      userId,
      'notifications'
    );

    let hasNotification = false;
    for (let i = 0; i < userNotifications.length; i += 1) {
      const invite1 = userNotifications[i].invite;
      const invite2 = notification.invite;
      console.log(
        invite1.inviterId === invite2.inviterId &&
          invite1.proiectId === invite2.proiectId &&
          invite1.role === invite2.role
      );
      if (
        invite1.inviterId === invite2.inviterId &&
        invite1.proiectId === invite2.proiectId &&
        invite1.role === invite2.role
      ) {
        // this deletes the user that was already invited form the invite list
        hasNotification = true;
        break;
      }
    }

    if (!hasNotification)
      return res
        .status(404)
        .json({ message: 'User does not have an invitation' });

    // get previous users and update new useres with previous users. Im not sure if mongoose has a function to do a update without
    // changing the old values
    const oldProject = await ProjectMessage.findById(
      notification.invite.projectId,
      'users'
    );
    const updatedProject = await ProjectMessage.findByIdAndUpdate(
      notification.invite.projectId,
      {
        users: {
          ...oldProject.users,
          [userId]: {
            name: req.userName,
            email: req.userEmail,
            role: notification.invite.role,
          },
        },
      },
      { new: true }
    );
    console.log(updatedProject);

    // Now delete the invite notification so the user doesn't have access when they are kicked out.. implement this!!

    await UserModel.findByIdAndUpdate(userId, {
      $pull: {
        notifications: {
          createdAt: notification.createdAt,
        },
      },
    });

    return res
      .status(200)
      .json({ message: 'Successfully accepted the project invite' });
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: error.message });
  }
};
