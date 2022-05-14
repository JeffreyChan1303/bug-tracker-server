import express from 'express';

import { getAllTickets, createTicket } from '../controllers/tickets.js';

const router = express.Router();

router.get('/allTickets', getAllTickets);
router.post('/createTicket', createTicket);


export default router;