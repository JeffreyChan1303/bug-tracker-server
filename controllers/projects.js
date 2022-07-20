import mongoose from 'mongoose';
import { ProjectMessage, ProjectArchive } from '../models/projectModels.js';
import { TicketArchive, TicketMessage } from '../models/ticketModels.js';
import UserModel from '../models/user.js';

export const getAllProjectsBySearch = async (req, res) => {
  const { page, searchQuery } = req.query;

  try {
    const title = new RegExp(searchQuery, 'i'); // 'i' stands for ignore case
    const itemsPerPage = 8;
    const startIndex = (Number(page) - 1) * itemsPerPage;
    const total = await ProjectMessage.countDocuments({ $or: [{ title }] });

    // $or means: either find me the title or other things in the array
    const projects = await ProjectMessage.find({ $or: [{ title }] })
      .sort({ _id: -1 })
      .limit(itemsPerPage)
      .skip(startIndex);

    res.status(200).json({
      data: projects,
      currentPage: Number(page),
      numberOfPages: Math.ceil(total / itemsPerPage),
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getMyProjectsBySearch = async (req, res) => {
  const { page, searchQuery } = req.query;

  if (!req.userId) return res.status(401).json({ message: 'Unauthenticated' });
  const { userId } = req;
  const userName = `users.${req.userId}.name`;

  try {
    const title = new RegExp(searchQuery, 'i'); // 'i' stands for ignore case
    const itemsPerPage = 8;
    const startIndex = (Number(page) - 1) * itemsPerPage;

    const total = await ProjectMessage.countDocuments({
      $and: [
        { $or: [{ creator: userId }, { [userName]: RegExp('') }] },
        { title },
      ],
    });

    // THIS IS THE empty string regular expression:   /(?:)/

    const projects = await ProjectMessage.find({
      $and: [
        { $or: [{ creator: userId }, { [userName]: RegExp('') }] },
        { title },
      ],
    })
      .sort({ _id: -1 })
      .limit(itemsPerPage)
      .skip(startIndex);

    return res.status(200).json({
      data: projects,
      currentPage: Number(page),
      numberOfPages: Math.ceil(total / itemsPerPage),
    });
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: error.message });
  }
};

export const getArchivedProjectsBySearch = async (req, res) => {
  const { page, searchQuery } = req.query;

  if (!req.userId) return res.status(401).json({ message: 'Unauthenticated' });

  try {
    const title = new RegExp(searchQuery, 'i'); // 'i' stands for ignore case
    const itemsPerPage = 8;
    const startIndex = (Number(page) - 1) * itemsPerPage;
    const userName = `users.${req.userId}.name`;

    const total = await ProjectArchive.countDocuments({
      $and: [
        { $or: [{ creator: req.userId }, { [userName]: RegExp('') }] },
        { title },
      ],
    });

    // $or means: either find me the title or other things in the array
    const projects = await ProjectArchive.find({
      $and: [
        { $or: [{ creator: req.userId }, { [userName]: RegExp('') }] },
        { title },
      ],
    })
      .sort({ _id: -1 })
      .limit(itemsPerPage)
      .skip(startIndex);

    return res.status(200).json({
      data: projects,
      currentPage: Number(page),
      numberOfPages: Math.ceil(total / itemsPerPage),
    });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

export const createProject = async (req, res) => {
  const project = req.body;

  if (!req.userId) return res.JSON({ message: 'Unauthenticated' });

  try {
    // this gets rid of the password from the object
    const { name, email } = await UserModel.findById(req.userId);

    const newProject = new ProjectMessage({
      ...project,
      status: 'Active',
      creator: req.userId,
      users: { [req.userId]: { name, email, role: 'Admin' } },
    });
    console.log(newProject);

    await newProject.save();

    return res.status(201).json(newProject);
  } catch (error) {
    console.log(error);
    return res.status(409).json({ message: error.message });
  }
};

export const updateProject = async (req, res) => {
  const { id: _id } = req.params;
  const project = req.body;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send('No project with that ID');
  }

  try {
    const updatedProject = await ProjectMessage.findByIdAndUpdate(
      _id,
      project,
      { new: true }
    );
    console.log(updatedProject);

    return res.status(200).json(updatedProject);
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: error.message });
  }
};

export const getProjectDetails = async (req, res) => {
  const { projectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(404).send('No project with that ID');
  }

  try {
    const isArchivedProject = await ProjectArchive.exists({ _id: projectId });
    let projectMessages;

    if (isArchivedProject) {
      projectMessages = await ProjectArchive.findById(
        projectId,
        '-users -tickets'
      );
    } else {
      projectMessages = await ProjectMessage.findById(
        projectId,
        '-users -tickets'
      );
    }

    return res.status(200).json(projectMessages);
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
};

export const getProjectUsers = async (req, res) => {
  const { projectId } = req.params;

  if (!req.userId) return res.status(401).json({ message: 'Unauthenticated' });
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

// I will need to add is archived project in here so if it is archived, we get all the ticket ids from archive
export const getProjectTickets = async (req, res) => {
  const { projectId } = req.params;
  if (!req.userId) return res.status(401).json({ message: 'Unauthenticated' });

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(404).send('No project with that ID');
  }

  try {
    const isArchivedProject = await ProjectArchive.exists({ _id: projectId });
    let project;
    if (isArchivedProject) {
      project = await ProjectArchive.findById(projectId, 'tickets');
    } else {
      project = await ProjectMessage.findById(projectId, 'tickets');
    }
    const projectTicketIds = project.tickets;

    let tickets = await TicketMessage.find(
      { _id: { $in: projectTicketIds } },
      'title name creator priority status type updatedAt developer'
    );
    tickets = [
      ...(await TicketArchive.find({ _id: { $in: projectTicketIds } })),
      ...tickets,
    ];

    // we can sort them here?

    return res.status(200).json(tickets);
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: error.message });
  }
};

export const moveProjectToArchive = async (req, res) => {
  const { projectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(404).send('No project with that ID');
  }

  try {
    // get all tickets and move all of them into the archive.
    const project = await ProjectMessage.findById(projectId, 'tickets');
    const projectTicketIds = project.tickets;
    console.log(projectTicketIds);
    await TicketMessage.find({ _id: { $in: projectTicketIds } }).then(
      (result) => {
        let swap;
        for (let i = 0; i < result.length; i += 1) {
          console.log('result: ', result);

          swap = { ...result[i].toJSON(), status: 'Archived' };
          swap = new TicketArchive(swap); // or result.toObject

          result[i].remove();
          swap.save();
        }
      }
    );

    // then move the project into the archive.
    console.log('before the project sawp');
    await ProjectMessage.findOne({ projectId }).then((result) => {
      const swap = new ProjectArchive({
        ...result.toJSON(),
        status: 'Archived',
      }); // or result.toObject

      result.remove();
      swap.save();
    });

    return res.status(200).json({ message: 'Project deleted successfully.' });
  } catch (error) {
    console.log(error);
    return res.status(409).json({ message: error.message });
  }
};

export const restoreProjectFromArchive = async (req, res) => {
  const { projectId } = req.params;

  if (!req.userId) return res.status(401).json({ message: 'Unauthenticated' });
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(404).send('No project with that ID');
  }

  try {
    ProjectArchive.findOne({ _id: projectId }, (err, result) => {
      const swap = new ProjectMessage({
        ...result.toJSON(),
        status: 'Active',
        updatedAt: new Date(),
      });

      result.remove();
      swap.save();
    });

    return res
      .status(200)
      .json({ message: 'Successfully restored project from archive' });
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: error.message });
  }
};

export const deleteProjectFromArchive = async (req, res) => {
  const { id: _id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send('No project with that ID');
  }

  try {
    await ProjectArchive.findByIdAndRemove(_id);

    return res.status(204).json({ message: 'Project deleted successfully.' });
  } catch (error) {
    return res.status(409).json({ message: error.message });
  }
};

export const updateUsersRoles = async (req, res) => {
  const { id: projectId } = req.params; // this is the project Id
  const users = req.body;
  // console.log(projectId, users);
  if (!req.userId)
    return res
      .status(401)
      .json({ severity: 'error', message: 'Unauthenticated' });

  try {
    // Get my projects function will query for the projects that the user is in
    const oldProject = await ProjectMessage.findById(projectId, 'users');

    if (!oldProject.users[req.userId]) {
      return res.status(404).json({ message: 'A user is not in the project' });
    }

    const updatedProject = await ProjectMessage.findByIdAndUpdate(
      projectId,
      { users: { ...oldProject.users, ...users } },
      { new: true }
    );
    console.log(updatedProject);

    return res
      .status(200)
      .json({ message: 'Project Users updated successfully' });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({ message: error.message });
  }
};

export const deleteUsersFromProject = async (req, res) => {
  // We need to notification when a user is deleted from the project!!
  const { projectId } = req.params;
  const users = req.body;
  console.log(users);

  if (!req.userId) return res.status(401).json({ message: 'unauthenticated' });

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
      notificationType: 'kicked',
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

export const getActiveProjects = async (req, res) => {
  if (!req.userId) return res.status(401).json({ message: 'Unauthenticated' });
  const user = `users.${req.userId}.name`;

  try {
    // RegExp('') means any value can be in the parameter
    const numberOfActiveProjects = await ProjectMessage.find({
      [user]: RegExp(),
    }).countDocuments();

    return res.status(200).json(numberOfActiveProjects);
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: error.message });
  }
};

export const inviteUsersToProject = async (req, res) => {
  const { projectId } = req.params;
  const { users, role } = req.body;
  try {
    if (!req.userId)
      return res.status(401).json({ message: 'Unauthenticated' });
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
        projectUsers[req.userId]?.role !== 'Admin' ||
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
    const userArr = Object.keys(users);
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

    // this adds the notification to the user's database
    await UserModel.updateMany(
      { _id: { $in: Object.keys(users) } },
      {
        $push: { notifications: newNotification },
        $inc: { unreadNotifications: 1 },
      },
      { new: true }
    );

    // const updatedProject = await ProjectMessage.findByIdAndUpdate(
    //   projectId,
    //   { users: { ...oldProject.users, ...users } },
    //   { new: true }
    // );
    return res
      .status(200)
      .json({ message: 'Successfully invited users to project' });
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: error.message });
  }
};

export const acceptProjectInvite = async (req, res) => {
  const notification = req.body;
  console.log(notification);

  if (!req.userId) return res.status(401).json({ message: 'Unauthenticated' });

  try {
    // check if the user actually has an invitation
    const { notifications: userNotifications } = await UserModel.findById(
      req.userId,
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
          [req.userId]: {
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

    return res
      .status(200)
      .json({ message: 'Successfully accepted the project invite' });
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: error.message });
  }
};
