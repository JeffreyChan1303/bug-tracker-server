import { SupportTicket } from '../../models/ticketModels.js';

export const getSupportTicketsBySearch = async (req, res) => {
  const { page, searchQuery } = req.query;

  try {
    const title = new RegExp(searchQuery, 'i'); // 'i' stands for ignore case
    const itemsPerPage = 8;
    const startIndex = (Number(page) - 1) * itemsPerPage;
    const total = await SupportTicket.countDocuments({ $or: [{ title }] });

    // $or means: either find me the title or other things in the array
    const tickets = await SupportTicket.find({ $or: [{ title }] })
      .sort({ _id: -1 })
      .limit(itemsPerPage)
      .skip(startIndex);

    return res.status(200).json({
      data: tickets,
      currentPage: Number(page),
      numberOfPages: Math.ceil(total / itemsPerPage),
    });
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: error.message });
  }
};

export const createSupportTicket = async (req, res) => {
  const ticket = req.body;

  try {
    const newTicket = new SupportTicket({
      ...ticket,
      creator: req.userId,
      type: 'Support',
      project: {
        title: 'Juicy Bug Tracker',
      },
    });

    await newTicket.save();

    return res.status(201).json(newTicket);
  } catch (error) {
    return res.status(409).json({ message: error.message });
  }
};

export const deleteSupportTicket = async (req, res) => {
  const { userId } = req;
  const { ticketId } = req.params;

  try {
    // check if they are the creator of the ticket
    const oldTicket = await SupportTicket.findById(ticketId, 'creator') 
    if (userId !== oldTicket.creator) {
      return res.status(401).json({ message: 'You are not the creator of this ticket. Unable to delete the ticket' });
    }

    await SupportTicket.findByIdAndRemove(ticketId);

    return res
      .status(200)
      .json({ message: 'Successfully deleted support ticket' });
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: 'Failed to delete support ticket' });
  }
};
