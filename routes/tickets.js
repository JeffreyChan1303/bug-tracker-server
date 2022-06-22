import express from 'express';

import { getAllTickets, getAllTicketsBySearch, getMyTickets, getMyTicketsBySearch, createTicket, updateTicket, getTicketDetails, moveTicketToArchive, getArchivedTickets, getArchivedTicketsBySearch, deleteTicketFromArchive} from '../controllers/tickets.js';

import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/allTickets', getAllTickets);
router.get('/allTickets/search', getAllTicketsBySearch);
router.get('/myTickets', auth, getMyTickets);
router.get('/myTickets/search', auth, getMyTicketsBySearch);
router.get('/archivedTickets', auth, getArchivedTickets);
router.get('/archivedTickets/search', auth, getArchivedTicketsBySearch);


router.post('/createTicket', auth, createTicket);
router.patch('/updateTicket/:id', auth, updateTicket);
router.get('/ticketDetails/:id', auth, getTicketDetails);
router.put('/moveTicketToArchive/:id', auth, moveTicketToArchive);
router.delete('/deleteTicketFromArchive/:id', auth, deleteTicketFromArchive);

export default router;