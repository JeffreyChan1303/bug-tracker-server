import mongoose from 'mongoose';

const projectSchema = mongoose.Schema({
    title: String, 
    description: String,
    creator: String,
    status: String,
    tags: [String],
    team: String,

    createdAt: {
        type: Date,
        default: new Date(),
    },
    updatedAt: Date,
});

const ProjectMessage = mongoose.model('ProjectMessage', projectSchema);

export default ProjectMessage;