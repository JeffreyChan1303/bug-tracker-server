import mongoose from 'mongoose';

const projectSchema = mongoose.Schema({
  title: String,
  description: String,
  name: String,
  creator: String,
  users: Object, // array of user ids
  tickets: Array, // array of ticket ids
  status: String,
  createdAt: {
    type: Date,
    default: new Date(),
  },
  updatedAt: {
    type: Date,
    default: new Date(),
  },
});

export const ProjectMessage = mongoose.model('Project', projectSchema);
export const ProjectArchive = mongoose.model('ProjectArchive', projectSchema);
