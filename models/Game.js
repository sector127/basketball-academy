import mongoose from 'mongoose';
import {format, parse} from 'date-fns';

const GameSchema = new mongoose.Schema({
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team', // Reference to the Team model
        required: true,
    },
    opponent: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        enum: ['Home', 'Away'],
        required: true,
    },
    venue: {
        type: String, // Name of the venue (e.g., "City Arena")
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    startTime: {
        type: String, // Format: "HH:mm" (e.g., "19:30")
        required: true,
    },
    score: {
        ourTeam: {
            type: Number,
            required: true,
        },
        opponentTeam: {
            type: Number,
            required: true,
        },
    },
    players: [
        {
            playerId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Player', // Reference to the Player model
                required: true,
            },
            minutesPlayed: {
                type: Number,
                required: true,
            },
            points: {
                type: Number,
                default: 0,
            },
            assists: {
                type: Number,
                default: 0,
            },
            rebounds: {
                type: Number,
                default: 0,
            },
            steals: {
                type: Number,
                default: 0,
            },
            blocks: {
                type: Number,
                default: 0,
            },
            turnovers: {
                type: Number,
                default: 0,
            },
            fouls: {
                type: Number,
                default: 0,
            },
        },
    ],
    notes: {
        type: String, // Optional notes about the game
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

// Virtual for total team stats in the game
GameSchema.virtual('totalTeamStats').get(function () {
    return this.players.reduce(
        (acc, player) => {
            acc.points += player.points;
            acc.assists += player.assists;
            acc.rebounds += player.rebounds;
            acc.steals += player.steals;
            acc.blocks += player.blocks;
            acc.turnovers += player.turnovers;
            acc.fouls += player.fouls;
            return acc;
        },
        {
            points: 0,
            assists: 0,
            rebounds: 0,
            steals: 0,
            blocks: 0,
            turnovers: 0,
            fouls: 0,
        }
    );
});

GameSchema.virtual('gameResult').get(function () {
    if (this.score.ourTeam !== null && this.score.opponentTeam !== null) {
        return `${this.score.ourTeam} - ${this.score.opponentTeam}`;
    }
    return null;
})

GameSchema.add({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
    },
})

GameSchema.post('save', async function (doc) {
    try {
        const startDate = parse(doc.startTime, 'HH:mm', doc.date);
        const endDate = new Date(startDate.getTime() + 90 * 60 * 1000); // 1.5 hour game

        const eventData = {
            title: `${doc.location}\n ${doc.team.name} Game vs ${doc.opponent}`,
            type: 'game',
            start: startDate,
            end: endDate,
            venue: doc.location === 'Home' ? doc.venue : 'Away',
            team: doc.team,
            game: doc._id,
            status: doc.score.ourTeam !== null && doc.score.opponentTeam !== null
                ? 'completed'
                : 'scheduled'
        };

        if (doc.event) {
            await mongoose.model('Event').findByIdAndUpdate(doc.event, eventData);
        } else {
            const newEvent = await mongoose.model('Event').create(eventData);
            doc.event = newEvent._id;
            await doc.save();
        }
    } catch (error) {
        console.error('Event sync error:', error);
    }
});

// Add validation for startTime format
GameSchema.path('startTime').validate(function (value) {
    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
}, 'Invalid time format. Use HH:mm');

// Add indexes for common query patterns
GameSchema.index({team: 1});
GameSchema.index({date: 1});
GameSchema.index({venue: 1});
GameSchema.index({location: 1});

// Add static method for venue conflict checking
GameSchema.statics.checkVenueConflict = async function (date, startTime, venue) {
    const gameDate = parse(startTime, 'HH:mm', date);
    const endDate = new Date(gameDate.getTime() + 90 * 60 * 1000); // 1.5h game

    return this.findOne({
        venue,
        date: {$lte: endDate},
        $or: [
            {
                date: {$eq: gameDate},
                $expr: {
                    $gt: [
                        {$add: ["$date", {$multiply: [{$toInt: {$substr: ["$startTime", 0, 2]}}, 60 * 60 * 1000]}]},
                        gameDate
                    ]
                }
            }
        ]
    });
};

// Add virtual for game status
GameSchema.virtual('status').get(function () {
    return this.score.ourTeam !== null && this.score.opponentTeam !== null
        ? 'completed'
        : 'scheduled';
});

// Add validation to prevent modifying completed games
// GameSchema.pre('save', function (next) {
//     if (this.isModified('score') && this.status === 'completed') {
//         throw new Error('Cannot modify completed games');
//     }
//     next();
// });

// Add duration validation in post-save hook
GameSchema.post('save', async function (doc) {
    try {
        // Validate date/time combination
        const startDate = parse(doc.startTime, 'HH:mm', doc.date);
        if (isNaN(startDate)) {
            throw new Error('Invalid date/time combination');
        }

        // Rest of existing post-save logic...

    } catch (error) {
        console.error('Event sync error:', error);
        // Consider adding error handling that affects the save operation
    }
});

// Add default values for score to allow empty games
GameSchema.path('score.ourTeam').default(null);
GameSchema.path('score.opponentTeam').default(null);
GameSchema.path('score.ourTeam').required(false);
GameSchema.path('score.opponentTeam').required(false);

// Add virtual population for easier event access
GameSchema.virtual('calendarEvent', {
    ref: 'Event',
    localField: 'event',
    foreignField: '_id',
    justOne: true
});

GameSchema.post('remove', async function (doc) {
    await mongoose.model('Event').findByIdAndDelete(doc.event);
});

const Game = mongoose.models.Game || mongoose.model('Game', GameSchema);

export default Game;