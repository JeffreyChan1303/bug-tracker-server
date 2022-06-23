import mongoose from 'mongoose';

const ticketSchema = mongoose.Schema({
    title: String, 
    description: String,
    name: String,
    creator: String,
    priority: String,
    status: String,
    projectId: String,
    projectName: String,
    developers: Array,
    ticketHistory: Array, // the previous ticket data shoulb be stored at a ticket in the ticket History!!
    // tags: [String],
    createdAt: {
        type: Date,
        default: new Date(),
    },
    updatedAt: {
        type: Date,
        default: new Date(),
    }
});

export const TicketMessage = mongoose.model('TicketMessage', ticketSchema);
export const TicketArchive = mongoose.model('TicketArchive', ticketSchema);
