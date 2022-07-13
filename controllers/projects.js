import mongoose from 'mongoose';
import { ProjectMessage, ProjectArchive } from '../models/projectModels.js';
import { TicketMessage } from '../models/ticketModels.js';
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

  try {
    const title = new RegExp(searchQuery, 'i'); // 'i' stands for ignore case
    const itemsPerPage = 8;
    const startIndex = (Number(page) - 1) * itemsPerPage;

    const total = await ProjectMessage.countDocuments({
      $and: [{ creator: userId }, { title }],
    });

    const userName = `users.${req.userId}.name`;

    // THIS IS THE empty string regular expression:   /(?:)/

    const projects = await ProjectMessage.find({
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

    const total = await ProjectArchive.countDocuments({ $and: [{ title }] });

    // $or means: either find me the title or other things in the array
    const projects = await ProjectArchive.find({ $and: [{ title }] })
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
    const projectMessages = await ProjectMessage.findById(
      projectId,
      '-users -tickets'
    );

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
    const project = await ProjectMessage.findById(projectId, 'users');
    const projectUsers = project.users;

    return res.status(200).json(projectUsers);
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: error.message });
  }
};
export const getProjectTickets = async (req, res) => {
  const { projectId } = req.params;
  if (!req.userId) return res.status(401).json({ message: 'Unauthenticated' });

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(404).send('No project with that ID');
  }

  try {
    const project = await ProjectMessage.findById(projectId, 'tickets');
    const projectTicketIds = project.tickets;

    const tickets = await TicketMessage.find(
      { _id: { $in: projectTicketIds } },
      'title name creator priority status type updatedAt developer'
    );

    return res.status(200).json(tickets);
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: error.message });
  }
};

export const moveProjectToArchive = async (req, res) => {
  const { id: _id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send('No project with that ID');
  }

  try {
    // await ProjectMessage.findByIdAndRemove(_id)

    ProjectMessage.findOne({ _id }, (err, result) => {
      const swap = new ProjectArchive(result.toJSON()); // or result.toObject

      result.remove();
      swap.save();
    });

    return res.json({ message: 'Project deleted successfully.' });
  } catch (error) {
    return res.status(409).json({ message: error.message });
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

  try {
    // Get my projects function will query for the projects that the user is in
    const oldProject = await ProjectMessage.findById(projectId);
    console.log(oldProject.users);
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
  // We need to notification when a use is deleted from the project!!
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
    let user;
    Object.keys(users).map(async (userId) => {
      console.log('userId: ', userId);
      user = await UserModel.findByIdAndUpdate(userId);
      console.log(user);
    });

    const updatedProject = await ProjectMessage.findByIdAndUpdate(
      projectId,
      {
        $unset: usersObject,
      },
      { new: true }
    );

    console.log('newProject: ', updatedProject);

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
