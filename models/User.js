import mongoose from 'mongoose';


const userSchema = new mongoose.Schema({
    email: {type: String, required: true, unique: true},
    name: {type: String, required: true},
    lastName: {type: String, required: true},
    password: {type: String, required: true},
    role: {type: String, default: 'staff'},
    image: {type: String, default: ''},
    isActive: {type: Boolean, default: true},
    phone: {type: String, default: ''},
    specialty: {type: String, default: 'Head Coach'},
    bio: {type: String, default: ''},
    experience: {type: String, default: ''},
    // Player records this account belongs to: the player's own record for role
    // 'player', their children for role 'guardian'
    players: [{type: mongoose.Schema.Types.ObjectId, ref: 'Player'}],
    // Self-registered accounts wait (inactive) until an admin approves them
    pendingApproval: {type: Boolean, default: false},
    registrationNote: {type: String, default: ''},
    // Set by "forgot password" when email isn't configured; an admin sets a new password and clears it
    passwordResetRequestedAt: {type: Date, default: null},
    // Emailed reset link (hash of a one-time token) when email is configured
    passwordResetTokenHash: {type: String, default: null, index: {sparse: true}},
    passwordResetExpires: {type: Date, default: null},
    // Sessions issued before this are rejected (set whenever the password changes)
    passwordChangedAt: {type: Date, default: null},
    createdAt: {type: Date, default: Date.now},
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

const User = mongoose.model('User', userSchema);
export default User;