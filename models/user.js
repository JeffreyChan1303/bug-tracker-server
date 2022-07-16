import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  id: { type: String },
  notifications: [
    {
      title: String,
      description: String,
      createdAt: Date,
      createdBy: mongoose.Types.ObjectId,
      isRead: Boolean,
    },
  ],
  unreadNotifications: {
    type: Number,
    default: 0,
  },
});

export default mongoose.model('User', userSchema);
