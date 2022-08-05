import express from 'express';

import {
  getAllTicketsBySearch,
  getMyTicketsBySearch,
  createTicket,
  updateTicket,
  getTicketDetails,
  addTicketComment,
  deleteTicketComment,
  getActiveTickets,
  getUnassignedTicketsBySearch,
  getTicketStatistics,
} from '../controllers/tickets/tickets.js';
import {
  moveTicketToArchive,
  getArchivedTicketsBySearch,
  deleteTicketFromArchive,
  restoreTicketFromArchive,
} from '../controllers/tickets/archivedTickets.js';
import {
  getSupportTicketsBySearch,
  createSupportTicket,
  deleteSupportTicket,
} from '../controllers/tickets/supportTickets.js';
import claimTicket from '../controllers/tickets/claimTicket.js';

import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/allTickets/search', auth, getAllTicketsBySearch);
router.get('/myTickets/search', auth, getMyTicketsBySearch);
router.get('/archivedTickets/search', auth, getArchivedTicketsBySearch);

router.post('/createTicket', auth, createTicket);
router.patch('/updateTicket/:ticketId', auth, updateTicket);
router.get('/ticketDetails/:id', auth, getTicketDetails);
router.put('/moveTicketToArchive/:ticketId', auth, moveTicketToArchive);
router.put(
  '/restoreTicketFromArchive/:ticketId',
  auth,
  restoreTicketFromArchive
);
router.delete(
  '/deleteTicketFromArchive/:ticketId',
  auth,
  deleteTicketFromArchive
);

router.patch('/addTicketComment/:ticketId', auth, addTicketComment);
router.patch('/deleteTicketComment/:ticketId', auth, deleteTicketComment);

router.get('/activeTickets', auth, getActiveTickets);

router.get('/unassignedTickets', auth, getUnassignedTicketsBySearch);

router.get('/myTicketStatistics', auth, getTicketStatistics);

router.patch('/claimTicket/:ticketId', auth, claimTicket);

router.get('/supportTickets/search', auth, getSupportTicketsBySearch);
router.post('/createSupportTicket', auth, createSupportTicket);
router.delete('/deleteSupportTicket/:ticketId', auth, deleteSupportTicket);

export default router;
