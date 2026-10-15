import {formatAcademyTime} from '@/lib/timezone';

/**
 * Scores from the academy's point of view. GameResult stores home/away scores;
 * for away games the academy is the away side.
 */
export function getAcademyScores(event) {
    const result = event.gameResult;
    const status = result?.status || 'scheduled';
    if (status !== 'completed') {
        return {status, ourTeam: null, opponentTeam: null};
    }
    const isAway = Boolean(event.isAwayGame);
    return {
        status,
        ourTeam: (isAway ? result?.awayTeamScore : result?.homeTeamScore) ?? null,
        opponentTeam: (isAway ? result?.homeTeamScore : result?.awayTeamScore) ?? null,
    };
}

/**
 * Game list item built from a populated game Event (team, venue, gameResult).
 */
export function toGameSummary(event) {
    const isAway = Boolean(event.isAwayGame);
    const {status, ourTeam, opponentTeam} = getAcademyScores(event);
    return {
        _id: event._id,
        team: event.team || {name: 'BBA Team'},
        opponent: event.opponent || 'Opponent',
        location: isAway ? 'Away' : 'Home',
        isAwayGame: isAway,
        venue: event.venue?.name || event.location || (isAway ? 'Away Court' : 'BBA Court'),
        date: event.startTime,
        endDate: event.endTime,
        startTime: formatAcademyTime(event.startTime),
        status,
        score: {ourTeam, opponentTeam},
        event: event._id,
    };
}

export function buildGameTitle(teamName, opponent) {
    return `${teamName || 'BBA'} vs ${opponent}`;
}
