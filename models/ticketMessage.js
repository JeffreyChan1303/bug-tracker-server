import mongoose from 'mongoose';

const ticketSchema = mongoose.Schema({
    title: String, 
    description: String,
    creator: String,
    priority: String,
    status: String,
    tags: [String],
    likeCount: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: new Date(),
    },
    updatedAt: Date,
});

const TicketMessage = mongoose.model('TicketMessage', ticketSchema);

export default TicketMessage;