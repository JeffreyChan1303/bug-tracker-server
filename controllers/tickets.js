import mongoose from 'mongoose';
import { TicketMessage, TicketArchive } from '../models/ticketModels.js';


export const getAllTickets = async (req, res) => {
    const { page } = req.query;
    
    try {
        const itemsPerPage = 8;
        const startIndex = (Number(page) - 1) * itemsPerPage; // gets the starting index for the page in the database
        const total = await TicketMessage.countDocuments({}); // this is to know the last page we can go to

        const tickets = await TicketMessage.find().sort({ updatedAt: -1 }).limit(itemsPerPage).skip(startIndex);


        res.status(200).json({ data: tickets, currentPage: Number(page), numberOfPages: Math.ceil(total / itemsPerPage) });
    } catch (error) {
        res.status(404).json({ error: error.message });        
    }
}

export const getAllTicketsBySearch = async (req, res) => {
    const { page, searchQuery } = req.query;

    try {
        const title = new RegExp(searchQuery, "i"); // 'i' stands for ignore case
        const itemsPerPage = 8;
        const startIndex = (Number(page) - 1) * itemsPerPage;
        const total = await TicketMessage.countDocuments({ $or: [ { title } ] }); 

        // $or means: either find me the title or other things in the array
        const tickets = await TicketMessage.find({ $or: [ { title } ] }).sort({ _id: -1 }).limit(itemsPerPage).skip(startIndex);

        res.status(200).json({ data: tickets, currentPage: Number(page), numberOfPages: Math.ceil(total / itemsPerPage) });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const getMyTickets = async (req, res) => {
    const { page } = req.query;

    // checks if there is a user asking for the tickets
    if (!req.userId) return res.status(401).json({ message: 'Unauthenticated' });
    const userId = req.userId;

    try {
        const itemsPerPage = 8;
        const startIndex = (Number(page) - 1) * itemsPerPage; // gets the starting index for the page in the database
        const total = await TicketMessage.find({ creator: userId }).countDocuments({}); // this is to know the last page we can go to

        const tickets = await TicketMessage.find({ creator: userId }).sort({ _id: -1 }).limit(itemsPerPage).skip(startIndex);


        res.status(200).json({ data: tickets, currentPage: Number(page), numberOfPages: Math.ceil(total / itemsPerPage) });
    } catch (error) {
        res.status(404).json({ error: error.message });        
    }
}

export const getMyTicketsBySearch = async (req, res) => {
    const { page, searchQuery } = req.query;

    if (!req.userId) return res.status(401).json({ message: 'Unauthenticated' });
    const userId = req.userId;

    try {
        const title = new RegExp(searchQuery, "i"); // 'i' stands for ignore case
        const itemsPerPage = 8;
        const startIndex = (Number(page) - 1) * itemsPerPage;

        const total = await TicketMessage.countDocuments({ $and: [{ creator: userId }, { title } ] }); 

        // $or means: either find me the title or other things in the array
        const tickets = await TicketMessage.find({ $and: [{ creator: userId }, { title: title }] }).sort({ _id: -1 }).limit(itemsPerPage).skip(startIndex);

        res.status(200).json({ data: tickets, currentPage: Number(page), numberOfPages: Math.ceil(total / itemsPerPage) });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const getArchivedTickets = async (req, res) => {
    const { page } = req.query;

    // checks if there is a user asking for the tickets
    if (!req.userId) return res.status(401).json({ message: 'Unauthenticated' });
    const userId = req.userId;

    try {
        const itemsPerPage = 8;
        const startIndex = (Number(page) - 1) * itemsPerPage; // gets the starting index for the page in the database
        const total = await TicketArchive.find().countDocuments({}); // this is to know the last page we can go to

        const tickets = await TicketArchive.find().sort({ updatedAt: -1 }).limit(itemsPerPage).skip(startIndex);


        res.status(200).json({ data: tickets, currentPage: Number(page), numberOfPages: Math.ceil(total / itemsPerPage) });
    } catch (error) {
        res.status(404).json({ error: error.message });        
    }
}

export const getArchivedTicketsBySearch = async (req, res) => {
    const { page, searchQuery } = req.query;

    if (!req.userId) return res.status(401).json({ message: 'Unauthenticated' });
    const userId = req.userId;

    try {
        const title = new RegExp(searchQuery, "i"); // 'i' stands for ignore case
        const itemsPerPage = 8;
        const startIndex = (Number(page) - 1) * itemsPerPage;

        const total = await TicketArchive.countDocuments({ $and: [ { title } ] }); 

        // $or means: either find me the title or other things in the array
        const tickets = await TicketArchive.find({ $and: [{ title: title }] }).sort({ _id: -1 }).limit(itemsPerPage).skip(startIndex);

        res.status(200).json({ data: tickets, currentPage: Number(page), numberOfPages: Math.ceil(total / itemsPerPage) });
    } catch (error) {
        res.status(404).json({ message: error.message });
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
    let ticket = {}

    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(404).send('No ticket with that ID');
    }

    try {
        const ticketExists = await TicketMessage.exists({ _id: _id });

        if (ticketExists) {
            ticket = await TicketMessage.findById(_id);
        } else {
            ticket = await TicketArchive.findById(_id);
        }
        res.status(200).json(ticket)
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
}

export const moveTicketToArchive = async (req, res) => {
    const { id: _id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(404).send('No ticket with that ID');
    }

    try {
        TicketMessage.findOne({ _id: _id }, function(err, result) {
            let swap = new (TicketArchive)({...result.toJSON(), status: 'Archived', updatedAt: new Date }) //or result.toObject
        
            result.remove()
            swap.save()
        })

        res.json({ message: "Ticket moved to ticket archive successfully." });
    } catch (error) {
        res.status(409).json({ message: error.message }); 
    }
}

export const restoreTicketFromArchive = async (req, res) => {
    const { id: _id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(404).send('No ticket with that ID');
    }

    try {
        TicketArchive.findOne({ _id: _id }, function(err, result) {
            let swap = new (TicketMessage)({...result.toJSON(), status: 'Unassigned', updatedAt: new Date }) 
        
            result.remove()
            swap.save()
        })

        res.json({ message: "Ticket restored from archive successfully." });
    } catch (error) {
        res.status(409).json({ message: error.message }); 
    }
}

export const deleteTicketFromArchive = async (req, res) => {
    const { id: _id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(404).send('No ticket with that ID');
    }

    try {
        await TicketArchive.findByIdAndRemove(_id);

        res.status(204).json({ message: "Ticket deleted successfully." });
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
}