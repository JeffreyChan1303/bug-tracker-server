import express from 'express';

import { getAllTickets, getAllTicketsBySearch, getMyTickets, getMyTicketsBySearch, createTicket, updateTicket, getTicketDetails, deleteTicket } from '../controllers/tickets.js';

import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/allTickets', getAllTickets);
router.get('/allTickets/search', getAllTicketsBySearch);
router.get('/myTickets', auth, getMyTickets);
router.get('/myTickets/search', auth, getMyTicketsBySearch);
router.post('/createTicket', auth, createTicket);
router.patch('/updateTicket/:id', auth, updateTicket);
router.get('/ticketDetails/:id', auth, getTicketDetails);
router.delete('/deleteTicket/:id', auth, deleteTicket);

export default router;