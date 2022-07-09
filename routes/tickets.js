import express from 'express';

import { getAllTickets, getAllTicketsBySearch, getMyTicketsBySearch, createTicket, updateTicket, getTicketDetails, moveTicketToArchive, getArchivedTickets, getArchivedTicketsBySearch, deleteTicketFromArchive, restoreTicketFromArchive, addTicketComment, deleteTicketComment, getActiveTickets, getUnassignedTicketsBySearch } from '../controllers/tickets.js';

import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/allTickets', getAllTickets);
router.get('/allTickets/search', getAllTicketsBySearch);
router.get('/myTickets/search', auth, getMyTicketsBySearch);
router.get('/archivedTickets', auth, getArchivedTickets);
router.get('/archivedTickets/search', auth, getArchivedTicketsBySearch);


router.post('/createTicket', auth, createTicket);
router.patch('/updateTicket/:ticketId', auth, updateTicket);
router.get('/ticketDetails/:id', auth, getTicketDetails);
router.put('/moveTicketToArchive/:id', auth, moveTicketToArchive);
router.put('/restoreTicketFromArchive/:id', auth, restoreTicketFromArchive);
router.delete('/deleteTicketFromArchive/:id', auth, deleteTicketFromArchive);

router.patch('/addTicketComment/:ticketId', auth, addTicketComment);
router.patch('/deleteTicketComment/:ticketId', auth, deleteTicketComment);


router.get('/activeTickets', auth, getActiveTickets);

router.get('/unassignedTickets', auth, getUnassignedTicketsBySearch);

export default router;