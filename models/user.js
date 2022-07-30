import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  id: { type: String },
  verified: {
    type: Boolean,
    default: false,
  },
  googleUser: {
    type: Boolean,
  },
  notifications: [
    {
      title: String,
      description: String,
      createdAt: Date,
      createdBy: mongoose.Types.ObjectId,
      notificationType: String,
      invite: {
        inviterId: String,
        projectId: String,
        role: String,
      },
      isRead: Boolean,
    },
  ],
  unreadNotifications: {
    type: Number,
    default: 0,
  },
});

export default mongoose.model('User', userSchema);
