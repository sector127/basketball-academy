import mongoose from "mongoose";

const CoachSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    position: {
        type: String,
        required: true
    }
})

const Coach = mongoose.models.Coach || mongoose.model('Coach', CoachSchema);

export default Coach;