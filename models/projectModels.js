import mongoose from 'mongoose';

const projectSchema = mongoose.Schema({
    title: String, 
    description: String,
    name: String,
    creator: String,
    status: String,
    team: Array,

    createdAt: {
        type: Date,
        default: new Date(),
    },
    updatedAt: Date,
});

export const ProjectMessage = mongoose.model('ProjectMessage', projectSchema);
export const ProjectArchive = mongoose.model('ProjectArchive', projectSchema);