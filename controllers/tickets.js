import mongoose from 'mongoose';
import { TicketMessage, TicketArchive } from '../models/ticketModels.js';
import { ProjectMessage } from '../models/projectModels.js';


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
    console.log(newTicket);

    try {
        await newTicket.save();

        const { project, ticketHistory, comments, ...projectTicket } = ticket
        const newProject = await ProjectMessage.findByIdAndUpdate(ticket.project._id, {
            $push: {
                tickets: { 
                    ...projectTicket,
                    creator: req.userId,
                    createdAt: newTicket.createdAt,
                    _id: newTicket._id,
                }
            } 
        }, { new: true })
        console.log(newProject)

        res.status(201).json(newTicket);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
}

export const updateTicket = async (req, res) => {
    const { ticketId } = req.params;
    const newTicket = req.body;

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
        return res.status(404).send('No post with that ID');
    }

    try {
        const oldTicket = await TicketMessage.findById(ticketId);

        // console.log(oldTicket)
        // update with this new ticket history
        newTicket.creator = oldTicket.creator
        newTicket.ticketHistory = oldTicket.ticketHistory;
        newTicket.updatedAt = new Date;
        newTicket.ticketHistory.push({
            title: oldTicket.title,
            description: oldTicket.description, // THIS IS WHERE I LEFT OFF. I NEED TO GO TO THE BATHROOM THO!!!!
            priority: oldTicket.priority,
            status: oldTicket.status,
            updatedAt: oldTicket.updatedAt,
        }) 

        const updatedTicket = await TicketMessage.findByIdAndUpdate(ticketId, newTicket, {new: true })

        // delete old ticket from project
        const testProject = await ProjectMessage.findByIdAndUpdate(oldTicket.project._id, {
            $pull: {
                tickets: {
                    _id: ticketId
                }
            }
        }, { new: true })


        // destructure ticket to get rid of unneccessary content. add back into project ticket array. this keeps the sorted property of the array.
        const { title, name, priority, status, updatedAt, createdAt } = updatedTicket
        const updatedProject = await ProjectMessage.findByIdAndUpdate(oldTicket.project._id, {
            $push: {
                tickets: {
                    _id: ticketId, title, name, priority, status, updatedAt, createdAt,
                }
            }
        }, { new: true })
        console.log('this is the updated Project: ', updatedProject)

        res.status(200).json(updatedTicket);
    } catch (error) {
        console.log(error);
        res.status(404).json({ message: error.message });
    }
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

export const addTicketComment = async (req, res) => {
    const comment = req.body;
    console.log(comment)
    const { ticketId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
        return res.status(404).send('No ticket with that ID');
    }

    if (!req.userId) return res.status(401).json({ message: "Unauthenticated" });

    try {
        const newTicket = await TicketMessage.findByIdAndUpdate(ticketId, { $push: { comments: { ...comment, createdAt: new Date } } }, { new: true });

        res.status(200).json({ message: "Comment successfully added" });
    } catch (error) {
        console.log(error);
        res.status(501).json({ message: error.message });
    }
}

export const deleteTicketComment = async (req, res) => {
    try {
        let { commentCreatedAt } = req.body;
        const { ticketId } = req.params;
        commentCreatedAt = new Date(commentCreatedAt);

        const newTicket = await TicketMessage.findByIdAndUpdate(ticketId, {
            $pull: {
                comments: {
                    createdAt: commentCreatedAt,
                }
            }
        }, { new: true })

        res.status(200).json({ message: "Comment successfully deleted" });
    } catch (error) {
        console.log(error)
        res.status(404).json({ message: error.message })
    }
}