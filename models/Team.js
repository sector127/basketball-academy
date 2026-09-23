import mongoose from 'mongoose';

const TeamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    coach: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assistantCoach: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }
});

const Team = mongoose.models.Team || mongoose.model('Team', TeamSchema)

export default Team