import mongoose from 'mongoose';
import { ProjectMessage, ProjectArchive } from '../../models/projectModels.js';
import { TicketArchive, TicketMessage } from '../../models/ticketModels.js';
import UserModel from '../../models/user.js';

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

    // THIS IS THE empty string regular expression:   /(?:)/ need to test this

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

  try {
    // checks how many projects the user has created
    let numberOfProjects = await ProjectMessage.find(
      {
        creator: req.userId,
      },
      'creator'
    ).countDocuments();
    numberOfProjects += await ProjectArchive.find(
      { creator: req.userId },
      'creator'
    ).countDocuments();
    if (numberOfProjects > 5) {
      return res
        .status(400)
        .json({ message: 'You have exeeded the 5 project limit' });
    }
    console.log(numberOfProjects);

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
  const { id: projectId } = req.params;
  const project = req.body;
  const { userId } = req;

  if (!userId) return res.status(401).json({ message: 'Unauthenticated' });
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(404).send('No project with that ID');
  }

  try {
    const oldProject = await ProjectMessage.findById(projectId, 'users');

    // check if the user is in the project and is an admin
    if (oldProject.users[userId]?.role !== 'Admin') {
      return res.status(401).json({
        message:
          'User is not an Admin of the project, unable to update the project',
      });
    }

    const updatedProject = await ProjectMessage.findByIdAndUpdate(
      projectId,
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


export const getProjectTickets = async (req, res) => {
  const { projectId } = req.params;

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
  const { userId } = req;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(404).send('No project with that ID');
  }

  try {
    const project = await ProjectMessage.findById(projectId, 'tickets users');
    // check if the user is in the project and is an admin
    if (project.creator !== userId) {
      if (project.users[userId]?.role !== 'Admin') {
        return res.status(401).json({
          message:
            'User is not an admin of the project, unable to move the project to the archive',
        });
      }
    }

    // get all tickets and move all of them into the archive.
    const projectTicketIds = project.tickets;
    console.log(projectTicketIds);
    await TicketMessage.find({ _id: { $in: projectTicketIds } }).then(
      (result) => {
        let swap;
        for (let i = 0; i < result.length; i += 1) {
          swap = { ...result[i].toJSON(), status: 'Archived' };
          console.log(swap);
          swap = new TicketArchive(swap); // or result.toObject

          result[i].remove();
          swap.save();
        }
      }
    );

    // then move the project into the archive.
    console.log('before the project sawp');
    await ProjectMessage.findOne({ _id: projectId }).then((result) => {
      console.log(result);
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
  const { projectId } = req.params;
  const { userId } = req;

  if (!userId) return res.status(401).json({ message: 'Unauthenticated' });

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(404).send('No project with that ID');
  }

  try {
    const project = await ProjectArchive.findById(projectId, 'users');
    // check if the user is in the project and is an admin
    if (project.users[userId]?.role !== 'Admin' || project.creator === userId) {
      return res.status(401).json({
        message:
          'User is not an admin of the project, unable to delete the project from the archive',
      });
    }

    await ProjectArchive.findByIdAndRemove(projectId);

    return res.status(204).json({ message: 'Project deleted successfully.' });
  } catch (error) {
    return res.status(409).json({ message: error.message });
  }
};


export const getActiveProjects = async (req, res) => {
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

