import mongoose from 'mongoose';
import { ProjectMessage, ProjectArchive } from '../../models/projectModels.js';
import {
  TicketMessage,
  TicketArchive,
  SupportTicket,
} from '../../models/ticketModels.js';

export const getArchivedTicketsBySearch = async (req, res) => {
  const { page, searchQuery } = req.query;

  const { userId } = req;

  try {
    const title = new RegExp(searchQuery, 'i'); // 'i' stands for ignore case
    const itemsPerPage = 8;
    const startIndex = (Number(page) - 1) * itemsPerPage;

    const total = await TicketArchive.countDocuments({
      $and: [
        { $or: [{ creator: userId }, { 'developer._id': userId }] },
        { title },
      ],
    });

    const tickets = await TicketArchive.find({
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

export const moveTicketToArchive = async (req, res) => {
  const { ticketId } = req.params;
  const { userId } = req;

  if (!mongoose.Types.ObjectId.isValid(ticketId)) {
    return res.status(404).send('No ticket with that ID');
  }

  try {
    const isArchivedTicket = await TicketArchive.exists({ _id: ticketId });
    const isSupportTicket = await SupportTicket.exists({ _id: ticketId });

    const oldTicket = await TicketMessage.findById(ticketId);
    const oldProject = await ProjectMessage.findById(
      oldTicket.project._id,
      'users'
    );
    const userRole = oldProject.users[userId]?.role;
    // check if the user is the creator, Admin or Project Manager of the project
    if (
      oldTicket.creator !== userId &&
      userRole !== 'Admin' &&
      userRole !== 'Project Manager'
    ) {
      return res.status(401).json({
        message:
          'User is not the creator, an Admin, or Project Manager of the project that the ticket is in',
      });
    }

    // FOR SUpport tickets, only let owner delete?? or JUiCY project admin?

    if (isArchivedTicket) {
      // delete from database
      await TicketArchive.findByIdAndRemove(ticketId);
    } else if (isSupportTicket) {
      // delete from database
      await SupportTicket.findByIdAndRemove(ticketId);
    } else {
      // move to archived tickets
      TicketMessage.findOne({ ticketId }, (err, result) => {
        const swap = new TicketArchive({
          ...result.toJSON(),
          status: 'Archived',
          updatedAt: new Date(),
        }); // or result.toObject

        result.remove();
        swap.save();
      });
    }

    return res.json({
      message: 'Ticket moved to ticket archive successfully.',
    });
  } catch (error) {
    return res.status(409).json({ message: error.message });
  }
};

export const restoreTicketFromArchive = async (req, res) => {
  const { ticketId } = req.params;
  const { userId } = req;

  if (!mongoose.Types.ObjectId.isValid(ticketId)) {
    return res.status(404).send('No ticket with that ID');
  }

  try {
    const oldTicket = await TicketArchive.findById(ticketId);
    const oldProject = await ProjectMessage.findById(
      oldTicket.project._id,
      'users'
    );
    const userRole = oldProject.users[userId]?.role;
    // check if the user is the creator, Admin or Project Manager of the project
    if (
      oldTicket.creator !== userId &&
      userRole !== 'Admin' &&
      userRole !== 'Project Manager'
    ) {
      return res.status(401).json({
        message:
          'User is not the creator, an Admin, or Project Manager of the project',
      });
    }

    const ticket = await TicketArchive.findOne({ _id: ticketId });
    // check if the project is archived
    if (await ProjectArchive.exists({ _id: ticket.project._id })) {
      return res.status(200).json({
        message:
          'Project is archived. Please resotre project before restoring ticket',
      });
    }

    await TicketArchive.findOne({ _id: ticketId }).then((result) => {
      const swap = new TicketMessage({
        ...result.toJSON(),
        status: 'Unassigned',
        updatedAt: new Date(),
      });

      result.remove();
      swap.save();
    });

    return res.json({ message: 'Ticket restored from archive successfully.' });
  } catch (error) {
    console.log(error);
    return res.status(409).json({ message: error.message });
  }
};

export const deleteTicketFromArchive = async (req, res) => {
  const { ticketId } = req.params;
  const { userId } = req;

  if (!mongoose.Types.ObjectId.isValid(ticketId)) {
    return res.status(404).send('No ticket with that ID');
  }

  try {
    const oldTicket = await TicketArchive.findById(ticketId);

    const isProjectArchived = await ProjectArchive.exists({
      _id: oldTicket.project._id,
    });
    // check if the project is archived or not
    let oldProject;
    if (isProjectArchived) {
      oldProject = await ProjectArchive.findById(
        oldTicket.project._id,
        'users'
      );
    } else {
      oldProject = await ProjectMessage.findById(
        oldTicket.project._id,
        'users'
      );
    }

    const userRole = oldProject.users[userId]?.role;
    // check if the user is the creator, Admin or Project Manager of the project
    if (
      oldTicket.creator !== userId &&
      userRole !== 'Admin' &&
      userRole !== 'Project Manager'
    ) {
      return res.status(401).json({
        message:
          'User is not the creator, an Admin, or Project Manager of the project',
      });
    }

    await TicketArchive.findByIdAndRemove(ticketId);

    return res.status(204).json({ message: 'Ticket deleted successfully.' });
  } catch (error) {
    return res.status(409).json({ message: error.message });
  }
};
