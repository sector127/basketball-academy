import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
    eventType: {
        type: String,
        enum: ['practice', 'individualTraining', 'game'],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: String,
    startTime: {
        type: Date,
        required: true,
    },
    endTime: {
        type: Date,
        required: true,
    },
    isAwayGame: {
        type: Boolean,
        default: false,
    },
    venue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue',
        required: function () {
            return !this.isAwayGame
        },
    },
    location: {
        type: String,
        required: function () {
            return this.isAwayGame
        }
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
    },
    opponent: {
        type: String,
        required: function () {
            return this.eventType === 'game';
        }
    },
    players: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
    }],
    attendance: [{
        player: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Player',
            required: true,
        },
        status: {
            type: String,
            enum: ['present', 'absent', 'excused', 'injured'],
            default: 'present',
        },
        notes: { type: String, default: '' },
    }],
    isRecurring: {
        type: Boolean,
        default: false,
    },
    recurringGroupId: {
        type: String,
        index: true,
        default: null,
    },
    recurrenceRule: {
        daysOfWeek: [{ type: Number }],
        seasonEndDate: { type: Date },
        frequencyPerWeek: { type: Number },
    },
}, {
    timestamps: true,
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

// Virtual populate for game result
EventSchema.virtual('gameResult', {
    ref: 'GameResult',
    localField: '_id',
    foreignField: 'event',
    justOne: true
});

if (mongoose.models.Event) {
    delete mongoose.models.Event;
}
const Event = mongoose.model('Event', EventSchema);

export default Event;