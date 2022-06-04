import mongoose from 'mongoose';

const ticketSchema = mongoose.Schema({
    title: String, 
    description: String,
    name: String,
    creator: String,
    developor: String,
    priority: String,
    status: String,
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

const TicketMessage = mongoose.model('TicketMessage', ticketSchema);

export default TicketMessage;