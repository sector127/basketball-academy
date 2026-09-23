import mongoose from 'mongoose';


const userSchema = new mongoose.Schema({
    email: {type: String, required: true, unique: true},
    name: {type: String, required: true},
    lastName: {type: String, required: true},
    password: {type: String, required: true},
    role: {type: String, default: 'staff'},
    image: {type: String},
    createdAt: {type: Date, default: Date.now},
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;