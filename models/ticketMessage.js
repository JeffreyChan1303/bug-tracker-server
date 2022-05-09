import mongoose from 'mongoose';

const ticketSchema = mongoose.Schema({
    title: String, 
    description: String,
    creator: String,
    priority: String,
    status: String,
    // tags: [String],
    createdAt: {
        type: Date,
        default: new Date(),
    },
    updatedAt: Date,
});

const TicketMessage = mongoose.model('TicketMessage', ticketSchema);

export default TicketMessage;