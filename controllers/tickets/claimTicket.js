import { TicketMessage, TicketArchive } from '../../models/ticketModels.js';
import { ProjectMessage } from '../../models/projectModels.js';

// This function is a combination of claim ticket and assign ticket function.
const claimTicket = async (req, res) => {
  const { ticketId } = req.params;
  const { userId } = req.body; // this is the other user that is send in the body when admin is assigning tickets.

  try {
    const ticketIsArchived = await TicketArchive.exists({ _id: ticketId });
    // check if the ticket is archived
    if (ticketIsArchived) {
      return res
        .status(404)
        .json({ message: 'Cannot assign an archived ticket' });
    }
    const oldTicket = await TicketMessage.findById(ticketId);
    // check if the project is archived
    const projectIsArchived = await ProjectMessage.exists({
      _id: oldTicket.project,
    });
    if (projectIsArchived) {
      return res
        .status(404)
        .json({ message: 'Cannot assign ticket in a archived project' });
    }
    const project = await ProjectMessage.findById(
      oldTicket.project,
      `users creator`
    );

    // this logic guards against unauthorized claims since req.userId needs to be in the project scope
    if (!project.users[req.userId]) {
      return res
        .status(401)
        .json({ message: 'User is not part of the project' });
    }
    // this checks if the someone is assigning a ticket! and if the request is from an admin or project manager of the project
    let developerId;
    let developerName;
    if (userId) {
      const assigneeRole = project.users[userId]?.role;
      const assignerRole = project.users[req.userId]?.role;
      if (assigneeRole === 'Admin') {
        return res
          .status(401)
          .json({ message: 'You cannot assign an admin a ticket' });
      }
      if (assigneeRole === 'Project Manager' && assignerRole !== 'Admin') {
        return res.status(401).json({
          message:
            'You need to be an Admin to assign a ticket to a Project Manager',
        });
      }
      if (assignerRole === 'Developer') {
        return res
          .status(401)
          .json({ message: 'Developers can not assign tickets' });
      }
      developerId = userId;
      developerName = project.users[userId].name;
      // ! Make a notification here since a user is assigning a ticket to someone! create the ticket and have a link to the ticket ID!!!
    } else {
      developerId = req.userId;
      developerName = req.userName;
    }

    // claim ticket. update the ticket
    await TicketMessage.findByIdAndUpdate(
      ticketId,
      {
        'developer._id': developerId,
        'developer.name': developerName,
        status: 'Development',
        updatedAt: new Date(),
        $push: {
          ticketHistory: {
            title: oldTicket.title,
            description: oldTicket.description,
            priority: oldTicket.priority,
            status: oldTicket.status,
            type: oldTicket.type,
            developer: oldTicket.developer,
            updatedAt: oldTicket.updatedAt,
          },
        },
      },
      { new: true }
    );

    // check if someone is assigning a ticket. if so, send anotification to the users

    return res.status(200).json({ message: 'successfully claimed the ticket' });
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: error.message });
  }
};

export default claimTicket;