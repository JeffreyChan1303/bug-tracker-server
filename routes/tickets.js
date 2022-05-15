import express from 'express';

import { getAllTickets, createTicket, updateTicket, getTicketDetails, deleteTicket } from '../controllers/tickets.js';

const router = express.Router();

router.get('/allTickets', getAllTickets);
router.post('/createTicket', createTicket);
router.put('/updateTicket/:id', updateTicket);
router.get('/ticketDetails/:id', getTicketDetails);
router.delete('/deleteTicket/:id', deleteTicket);

export default router;