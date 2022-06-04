import mongoose from 'mongoose';
import TicketMessage from '../models/ticketMessage.js';
import User from '../models/user.js';


export const getAllTickets = async (req, res) => {
    try {
       const ticketMessages = await TicketMessage.find();

       res.status(200).json(ticketMessages);
    } catch (error) {
        res.status(404).json({ error: error.message });        
    }
}

export const createTicket = async (req, res) => {
    const ticket = req.body;

    if (!req.userId) return res.JSON({ message: 'Unauthenticated' });
    
    const newTicket = new TicketMessage({ ...ticket, creator: req.userId });
    console.log(newTicket)

    try {
        await newTicket.save();

        res.status(201).json(newTicket);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
}

export const updateTicket = async (req, res) => {
    const { id: _id } = req.params;
    const ticket = req.body;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(404).send('No post with that ID');
    }

    const updatedTicket = await TicketMessage.findByIdAndUpdate(_id, ticket, {new: true })

    res.json(updatedTicket);
}

export const getTicketDetails = async (req, res) => {
    const { id: _id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(404).send('No ticket with that ID');
    }

    try {
        const ticketMessages = await TicketMessage.findById(_id)

        res.status(200).json(ticketMessages)
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
}

export const deleteTicket = async (req, res) => {
    const { id: _id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(404).send('No ticket with that ID');
    }

    try {
        await TicketMessage.findByIdAndRemove(_id)

        res.json({ message: "Ticket deleted successfully." });
    } catch (error) {
        res.status(409).json({ message: error.message }); // this res.status is randomly put in, may want to learn more about status codes and put in the correct one!!!
    }


}