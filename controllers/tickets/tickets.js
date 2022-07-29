import mongoose from 'mongoose';
import {
  TicketMessage,
  TicketArchive,
  SupportTicket,
} from '../../models/ticketModels.js';
import { ProjectMessage } from '../../models/projectModels.js';

export const getAllTicketsBySearch = async (req, res) => {
  const { page, searchQuery } = req.query;

  try {
    const title = new RegExp(searchQuery, 'i'); // 'i' stands for ignore case
    const itemsPerPage = 8;
    const startIndex = (Number(page) - 1) * itemsPerPage;
    const total = await TicketMessage.countDocuments({ $or: [{ title }] });

    // $or means: either find me the title or other things in the array
    const tickets = await TicketMessage.find({ $or: [{ title }] })
      .sort({ _id: -1 })
      .limit(itemsPerPage)
      .skip(startIndex);

    res.status(200).json({
      data: tickets,
      currentPage: Number(page),
      numberOfPages: Math.ceil(total / itemsPerPage),
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getMyTicketsBySearch = async (req, res) => {
  const { page, searchQuery } = req.query;

  const { userId } = req;

  try {
    const title = new RegExp(searchQuery, 'i'); // 'i' stands for ignore case
    const itemsPerPage = 8;
    const startIndex = (Number(page) - 1) * itemsPerPage;

    const total = await TicketMessage.countDocuments({
      $and: [
        { $or: [{ creator: userId }, { 'developer._id': userId }] },
        { title },
      ],
    });

    // $or means: either find me the title or other things in the array
    const tickets = await TicketMessage.find({
      $and: [
        { $or: [{ creator: userId }, { 'developer._id': userId }] },
        { title },
      ],
    })
      .sort({ _id: -1 })
      .limit(itemsPerPage)
      .skip(startIndex);

    return res.status(200).json({
      data: tickets,
      currentPage: Number(page),
      numberOfPages: Math.ceil(total / itemsPerPage),
    });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

export const createTicket = async (req, res) => {
  const ticket = req.body;

  const newTicket = new TicketMessage({
    ...ticket,
    creator: req.userId,
    status: 'Unassigned',
  });
  console.log(newTicket);

  try {
    // Check how many tickets the user has
    let numberOfTickets = await TicketMessage.find(
      {
        creator: req.userId,
      },
      'creator'
    ).countDocuments();
    numberOfTickets += await TicketArchive.find(
      { creator: req.userId },
      'creator'
    ).countDocuments();
    if (numberOfTickets > 100) {
      return res
        .status(400)
        .json({ message: 'You have exeeded the 100 ticket limit' });
    }

    // save the ticket
    await newTicket.save();

    // add new ticket id into project
    await ProjectMessage.findByIdAndUpdate(
      ticket.project._id,
      {
        $push: {
          tickets: newTicket._id,
        },
      },
      { new: true }
    );

    return res.status(201).json(newTicket);
  } catch (error) {
    return res.status(409).json({ message: error.message });
  }
};

export const updateTicket = async (req, res) => {
  const { ticketId } = req.params;
  const newTicket = req.body;
  const { userId } = req;

  if (!mongoose.Types.ObjectId.isValid(ticketId)) {
    return res.status(404).send('No post with that ID');
  }

  try {
    const oldTicket = await TicketMessage.findById(ticketId);
    // check if the user is developer or the creator of the project
    if (oldTicket.creator !== userId && oldTicket.developer._id !== userId) {
      return res.status(401).json({
        message: 'User is not the creator or the developer of the ticket',
      });
    }

    // !!! we could add a property the ticket history rememvers who modified the ticket!!
    // update with this new ticket history
    newTicket.creator = oldTicket.creator;
    newTicket.ticketHistory = oldTicket.ticketHistory;
    newTicket.updatedAt = new Date();
    newTicket.ticketHistory.push({
      title: oldTicket.title,
      description: oldTicket.description,
      priority: oldTicket.priority,
      status: oldTicket.status,
      type: oldTicket.type,
      updatedAt: oldTicket.updatedAt,
      developer: oldTicket.developer,
    });

    const updatedTicket = await TicketMessage.findByIdAndUpdate(
      ticketId,
      newTicket,
      { new: true }
    );

    return res.status(200).json(updatedTicket);
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: error.message });
  }
};

export const getTicketDetails = async (req, res) => {
  const { id: _id } = req.params;
  let ticket = {};

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send('No ticket with that ID');
  }

  try {
    const isArchivedTicket = await TicketArchive.exists({ _id });
    const isSupportTicket = await SupportTicket.exists({ _id });

    if (isArchivedTicket) {
      ticket = await TicketArchive.findById(_id);
    } else if (isSupportTicket) {
      ticket = await SupportTicket.findById(_id);
    } else {
      ticket = await TicketMessage.findById(_id);
    }

    return res.status(200).json(ticket);
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
};


export const addTicketComment = async (req, res) => {
  const comment = req.body;
  console.log(comment);
  const { ticketId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(ticketId)) {
    return res.status(404).send('No ticket with that ID');
  }

  try {
    const isSupportTicket = await SupportTicket.exists({ _id: ticketId });

    if (isSupportTicket) {
      await SupportTicket.findByIdAndUpdate(
        ticketId,
        { $push: { comments: { ...comment, createdAt: new Date() } } },
        { new: true }
      );
    } else {
      await TicketMessage.findByIdAndUpdate(
        ticketId,
        { $push: { comments: { ...comment, createdAt: new Date() } } },
        { new: true }
      );
    }

    return res.status(200).json({ message: 'Comment successfully added' });
  } catch (error) {
    console.log(error);
    return res.status(501).json({ message: error.message });
  }
};

export const deleteTicketComment = async (req, res) => {
  try {
    let { commentCreatedAt } = req.body;
    const { ticketId } = req.params;
    commentCreatedAt = new Date(commentCreatedAt);

    await TicketMessage.findByIdAndUpdate(
      ticketId,
      {
        $pull: {
          comments: {
            createdAt: commentCreatedAt,
          },
        },
      },
      { new: true }
    );

    return res.status(200).json({ message: 'Comment successfully deleted' });
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: error.message });
  }
};

export const getActiveTickets = async (req, res) => {
  try {
    const numberOfActiveTickets = await TicketMessage.find({
      $or: [{ 'developer._id': req.userId }, { creator: req.userId }],
    }).countDocuments();

    return res.status(200).json(numberOfActiveTickets);
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: error.message });
  }
};

export const getUnassignedTicketsBySearch = async (req, res) => {
  const { page, searchQuery } = req.query;

  const user = `users.${req.userId}.name`;

  try {
    // this function gets all the tickets that are in the projects that the user is in
    const myProjects = await ProjectMessage.find(
      { $or: [{ creator: req.userId }, { [user]: RegExp('') }] },
      'tickets users'
    );

    // make an array of all of the user's ticket ids
    let projectTicketIds = [];
    for (let i = 0; i < myProjects.length; i += 1) {
      projectTicketIds = [...projectTicketIds, ...myProjects[i].tickets];
    }

    // query the database for the ticket ids and check for unnassigned tickets
    const title = new RegExp(searchQuery, 'i'); // 'i' stands for ignore case
    const unassignedTickets = await TicketMessage.find(
      {
        $and: [{ _id: { $in: projectTicketIds } }, { title }],
        status: 'Unassigned',
      },
      'title name priority status type updatedAt developer'
    );

    // get page
    const itemsPerPage = 8;
    const startIndex = (Number(page) - 1) * itemsPerPage;
    const total = unassignedTickets.length;
    // ! i need to somehow sort these tickets by date!!!

    return res.status(200).json({
      tickets: unassignedTickets.splice(startIndex, 8),
      numberOfTickets: total,
      currentPage: Number(page),
      numberOfPages: Math.ceil(total / itemsPerPage),
    });
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: error.message });
  }
};

export const getTicketStatistics = async (req, res) => {
  const { userId } = req;

  try {
    const tickets = await TicketMessage.find({
      $or: [{ creator: userId }, { 'developer._id': userId }],
    });

    const myTicketsStats = {
      numberOfBugTickets: 0,
      numberOfFeatureTickets: 0,
      lowPriority: 0,
      mediumPriority: 0,
      highPriority: 0,
    };
    for (let i = 0; i < tickets.length; i += 1) {
      if (tickets[i].type === 'Bug') {
        myTicketsStats.numberOfBugTickets += 1;
      }
      if (tickets[i].type === 'Feature') {
        myTicketsStats.numberOfFeatureTickets += 1;
      }
      if (tickets[i].priority === 'Low') {
        myTicketsStats.lowPriority += 1;
      }
      if (tickets[i].priority === 'Medium') {
        myTicketsStats.mediumPriority += 1;
      }
      if (tickets[i].priority === 'High') {
        myTicketsStats.highPriority += 1;
      }
    }

    return res.status(200).json(myTicketsStats);
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: error.message });
  }
};


