import mongoose from 'mongoose';

const PeriodScoreSchema = new mongoose.Schema({
    period: {
        type: Number,
        required: true
    },
    homeScore: {
        type: Number,
        default: 0
    },
    awayScore: {
        type: Number,
        default: 0
    }
});
const PlayerBoxScoreSchema = new mongoose.Schema({
    player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
        required: true,
    },
    minutesPlayed: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    rebounds: { type: Number, default: 0 },
    steals: { type: Number, default: 0 },
    blocks: { type: Number, default: 0 },
    turnovers: { type: Number, default: 0 },
    fouls: { type: Number, default: 0 },
});

const GameResultSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
        unique: true // One result per event
    },
    homeTeamScore: {
        type: Number,
        default: 0
    },
    awayTeamScore: {
        type: Number,
        default: 0
    },
    periodScores: [PeriodScoreSchema],
    boxScores: [PlayerBoxScoreSchema],
    status: {
        type: String,
        enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
        default: 'scheduled'
    },
}, {
    timestamps: true
});

// Update total scores when period scores change
GameResultSchema.pre('save', function (next) {
    if (this.periodScores && this.periodScores.length > 0) {
        this.homeTeamScore = this.periodScores.reduce((sum, period) => sum + period.homeScore, 0);
        this.awayTeamScore = this.periodScores.reduce((sum, period) => sum + period.awayScore, 0);
    }
    next();
});

const GameResult = mongoose.models.GameResult || mongoose.model('GameResult', GameResultSchema);

export default GameResult;