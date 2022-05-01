import TicketMessage from '../models/ticketMessage.js';

export const getTickets = async (req, res) => {
    try {
       const ticketMessages = await TicketMessage.find();

       res.status(200).json(ticketMessages);
    } catch (error) {
        res.status(404).json({ error: error.message });        
    }
}

export const createTicket = async (req, res) => {
    const ticket = req.body;

    const newTicket = new TicketMessage(ticket);

    try {
        await newTicket.save();

        res.status(201).json(newTicket);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
}