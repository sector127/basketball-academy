import mongoose, { Schema, type Model, type Types } from 'mongoose';

export type UserRole = 'admin' | 'staff' | 'coach' | 'player' | 'guardian';

export interface IUser {
  email: string;
  name: string;
  lastName: string;
  password?: string;
  role: UserRole | string;
  image?: string;
  isActive: boolean;
  phone?: string;
  specialty?: string;
  bio?: string;
  experience?: string;
  players: Types.ObjectId[];
  pendingApproval: boolean;
  registrationNote?: string;
  passwordResetRequestedAt?: Date | null;
  passwordResetTokenHash?: string | null;
  passwordResetExpires?: Date | null;
  passwordChangedAt?: Date | null;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  lastName: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'staff' },
  image: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  phone: { type: String, default: '' },
  specialty: { type: String, default: 'Head Coach' },
  bio: { type: String, default: '' },
  experience: { type: String, default: '' },
  players: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
  pendingApproval: { type: Boolean, default: false },
  registrationNote: { type: String, default: '' },
  passwordResetRequestedAt: { type: Date, default: null },
  passwordResetTokenHash: { type: String, default: null, index: { sparse: true } },
  passwordResetExpires: { type: Date, default: null },
  passwordChangedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

if (mongoose.models.User) {
  delete mongoose.models.User;
}

// Any password change signs out existing sessions and invalidates reset links
userSchema.pre('save', function (next) {
  if (this.isModified('password') && !this.isNew) {
    this.passwordChangedAt = new Date();
    this.passwordResetTokenHash = null;
    this.passwordResetExpires = null;
    this.passwordResetRequestedAt = null;
  }
  next();
});

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
export default User;
