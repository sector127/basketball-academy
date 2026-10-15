import bcrypt from "bcrypt";
import mongoose from "mongoose";
import connectToDatabase from "./lib/mongoose.js";
import User from "./models/User.js";
import Team from "./models/Team.js";
import Player from "./models/Player.js";
import Venue from "./models/Venue.js";
import Event from "./models/Event.js";
import GameResult from "./models/GameResult.js";

async function seedDummyData() {
  try {
    await connectToDatabase();
    console.log("Connected to MongoDB for seeding dummy data...");

    // 1. Find or verify Coach Nika
    let coachNika = await User.findOne({ email: "nika@bba.ge" });
    if (!coachNika) {
      const hashedPassword = await bcrypt.hash("password123", 10);
      coachNika = await User.create({
        email: "nika@bba.ge",
        name: "Nikoloz",
        lastName: "Mskhalaia",
        password: hashedPassword,
        role: "coach",
        image: "/uploads/nika.jpg",
      });
      console.log("Created Coach Nika Mskhalaia");
    } else {
      coachNika.image = "/uploads/nika.jpg";
      coachNika.role = "coach";
      await coachNika.save();
      console.log("Updated Coach Nika Mskhalaia profile");
    }

    // 2. Create or verify Assistant Coach Guga
    let assistantCoach = await User.findOne({ email: "guga@bba.ge" });
    if (!assistantCoach) {
      const hashedPassword = await bcrypt.hash("password123", 10);
      assistantCoach = await User.create({
        email: "guga@bba.ge",
        name: "Guga",
        lastName: "Chanturia",
        password: hashedPassword,
        role: "coach",
        image: "/uploads/guga.jpg",
      });
      console.log("Created Assistant Coach Guga Chanturia");
    }

    // 3. Create Venues
    const venuesData = [
      {
        name: "BBA Main Arena - Olympic Palace",
        address: "6 University St, Saburtalo, Tbilisi",
        location: { type: "Point", coordinates: [44.7788, 41.7225] },
      },
      {
        name: "BBA Practice Facility - Vake",
        address: "24 Chavchavadze Ave, Vake, Tbilisi",
        location: { type: "Point", coordinates: [44.7612, 41.7105] },
      },
      {
        name: "Tbilisi Sports Complex",
        address: "1 Tamar Mepe Ave, Didube, Tbilisi",
        location: { type: "Point", coordinates: [44.795, 41.725] },
      },
    ];

    const venues = [];
    for (const vData of venuesData) {
      let venue = await Venue.findOne({ name: vData.name });
      if (!venue) {
        venue = await Venue.create(vData);
        console.log(`Created venue: ${venue.name}`);
      }
      venues.push(venue);
    }

    // 4. Create Teams for Coach Nika
    let teamU18 = await Team.findOne({ name: "BBA U18 Elite", coach: coachNika._id });
    if (!teamU18) {
      teamU18 = await Team.create({
        name: "BBA U18 Elite",
        description: "Brooklyn Basketball Academy Under-18 Championship Team",
        coach: coachNika._id,
        assistantCoach: assistantCoach._id,
      });
      console.log("Created team: BBA U18 Elite");
    }

    let teamU16 = await Team.findOne({ name: "BBA U16 Development", coach: coachNika._id });
    if (!teamU16) {
      teamU16 = await Team.create({
        name: "BBA U16 Development",
        description: "Brooklyn Basketball Academy Under-16 Competitive Squad",
        coach: coachNika._id,
        assistantCoach: assistantCoach._id,
      });
      console.log("Created team: BBA U16 Development");
    }

    // Clean existing players for these teams to ensure exact roster and positions
    await Player.deleteMany({ team: { $in: [teamU18._id, teamU16._id] } });

    // 5. Seed Players for BBA U18 Elite (10 players: 5 starters + 5 bench)
    const u18Players = [
      // Starting 5 (PG, SG, SF, PF, C)
      {
        name: "Zuka",
        lastname: "Beridze",
        position: "Point Guard",
        jerseyNum: 7,
        height: 186,
        dateOfBirth: new Date("2008-04-12"),
        isFirstTeam: true,
        profilePicture: "/uploads/1737652587434-zuka.jpg",
        tel: "+995599100001",
        guardian: "Father",
        guardianTel: "+995599200001",
        address: "Chavchavadze Ave 12, Tbilisi",
        team: teamU18._id,
        isActive: true,
      },
      {
        name: "Sandro",
        lastname: "Kalandadze",
        position: "Shooting Guard",
        jerseyNum: 11,
        height: 193,
        dateOfBirth: new Date("2008-01-25"),
        isFirstTeam: true,
        profilePicture: "/uploads/1739040439615-U18_Player.png",
        tel: "+995599100002",
        guardian: "Mother",
        guardianTel: "+995599200002",
        address: "Pekini Ave 5, Tbilisi",
        team: teamU18._id,
        isActive: true,
      },
      {
        name: "Luka",
        lastname: "Javakhishvili",
        position: "Small Forward",
        jerseyNum: 23,
        height: 201,
        dateOfBirth: new Date("2008-06-18"),
        isFirstTeam: true,
        profilePicture: "/uploads/1738250725918-U18_Player.png",
        tel: "+995599100003",
        guardian: "Father",
        guardianTel: "+995599200003",
        address: "Vazha-Pshavela Ave 30, Tbilisi",
        team: teamU18._id,
        isActive: true,
      },
      {
        name: "Giorgi",
        lastname: "Tsiklauri",
        position: "Power Forward",
        jerseyNum: 34,
        height: 206,
        dateOfBirth: new Date("2008-03-05"),
        isFirstTeam: true,
        profilePicture: "/uploads/1738005374485-acount_pic.jpg",
        tel: "+995599100004",
        guardian: "Mother",
        guardianTel: "+995599200004",
        address: "Kazbegi Ave 14, Tbilisi",
        team: teamU18._id,
        isActive: true,
      },
      {
        name: "Tornike",
        lastname: "Shengelia Jr.",
        position: "Center",
        jerseyNum: 15,
        height: 211,
        dateOfBirth: new Date("2008-09-14"),
        isFirstTeam: true,
        profilePicture: "/uploads/1737483340817-acount_pic.jpg",
        tel: "+995599100005",
        guardian: "Father",
        guardianTel: "+995599200005",
        address: "Kostava St 42, Tbilisi",
        team: teamU18._id,
        isActive: true,
      },
      // Bench
      {
        name: "Dachi",
        lastname: "Gelashvili",
        position: "Point Guard",
        jerseyNum: 3,
        height: 182,
        dateOfBirth: new Date("2009-02-10"),
        isFirstTeam: false,
        profilePicture: "/uploads/1737482793116-acount_pic-1.jpg",
        tel: "+995599100006",
        guardian: "Mother",
        guardianTel: "+995599200006",
        address: "Nutsubidze St 77, Tbilisi",
        team: teamU18._id,
        isActive: true,
      },
      {
        name: "Nikoloz",
        lastname: "Dvali",
        position: "Shooting Guard",
        jerseyNum: 8,
        height: 190,
        dateOfBirth: new Date("2008-11-22"),
        isFirstTeam: false,
        profilePicture: "/uploads/1739040439615-U18_Player.png",
        tel: "+995599100007",
        guardian: "Father",
        guardianTel: "+995599200007",
        address: "Tsereteli Ave 80, Tbilisi",
        team: teamU18._id,
        isActive: true,
      },
      {
        name: "Erekle",
        lastname: "Tabatadze",
        position: "Small Forward",
        jerseyNum: 14,
        height: 198,
        dateOfBirth: new Date("2008-08-30"),
        isFirstTeam: false,
        profilePicture: "/uploads/1738250725918-U18_Player.png",
        tel: "+995599100008",
        guardian: "Other",
        guardianTel: "+995599200008",
        address: "Beliashvili St 21, Tbilisi",
        team: teamU18._id,
        isActive: true,
      },
      {
        name: "Saba",
        lastname: "Gogoladze",
        position: "Power Forward",
        jerseyNum: 21,
        height: 203,
        dateOfBirth: new Date("2008-12-04"),
        isFirstTeam: false,
        profilePicture: "/uploads/1738005374485-acount_pic.jpg",
        tel: "+995599100009",
        guardian: "Mother",
        guardianTel: "+995599200009",
        address: "Tamarashvili St 10, Tbilisi",
        team: teamU18._id,
        isActive: true,
      },
      {
        name: "Irakli",
        lastname: "Maisuradze",
        position: "Center",
        jerseyNum: 44,
        height: 208,
        dateOfBirth: new Date("2008-05-19"),
        isFirstTeam: false,
        profilePicture: "/uploads/1737483340817-acount_pic.jpg",
        tel: "+995599100010",
        guardian: "Father",
        guardianTel: "+995599200010",
        address: "Abashidze St 33, Tbilisi",
        team: teamU18._id,
        isActive: true,
      },
    ];

    const insertedU18 = await Player.insertMany(u18Players);
    console.log(`Created ${insertedU18.length} players for BBA U18 Elite`);

    // 6. Seed Players for BBA U16 Development (7 players: 5 starters + 2 bench)
    const u16Players = [
      {
        name: "Aleksandre",
        lastname: "Lomidze",
        position: "Point Guard",
        jerseyNum: 5,
        height: 178,
        dateOfBirth: new Date("2010-03-15"),
        isFirstTeam: true,
        profilePicture: "/uploads/1737652587434-zuka.jpg",
        tel: "+995599100011",
        guardian: "Mother",
        guardianTel: "+995599200011",
        address: "Paliashvili St 45, Tbilisi",
        team: teamU16._id,
        isActive: true,
      },
      {
        name: "Vato",
        lastname: "Kipiani",
        position: "Shooting Guard",
        jerseyNum: 10,
        height: 185,
        dateOfBirth: new Date("2010-07-20"),
        isFirstTeam: true,
        profilePicture: "/uploads/1739040439615-U18_Player.png",
        tel: "+995599100012",
        guardian: "Father",
        guardianTel: "+995599200012",
        address: "Mosashvili St 8, Tbilisi",
        team: teamU16._id,
        isActive: true,
      },
      {
        name: "Mate",
        lastname: "Chkheidze",
        position: "Small Forward",
        jerseyNum: 12,
        height: 192,
        dateOfBirth: new Date("2010-01-11"),
        isFirstTeam: true,
        profilePicture: "/uploads/1738250725918-U18_Player.png",
        tel: "+995599100013",
        guardian: "Mother",
        guardianTel: "+995599200013",
        address: "Barnovi St 62, Tbilisi",
        team: teamU16._id,
        isActive: true,
      },
      {
        name: "Demetre",
        lastname: "Janashia",
        position: "Power Forward",
        jerseyNum: 33,
        height: 196,
        dateOfBirth: new Date("2010-09-08"),
        isFirstTeam: true,
        profilePicture: "/uploads/1738005374485-acount_pic.jpg",
        tel: "+995599100014",
        guardian: "Father",
        guardianTel: "+995599200014",
        address: "Kekelidze St 18, Tbilisi",
        team: teamU16._id,
        isActive: true,
      },
      {
        name: "Giorgi",
        lastname: "Abashidze",
        position: "Center",
        jerseyNum: 55,
        height: 202,
        dateOfBirth: new Date("2010-05-24"),
        isFirstTeam: true,
        profilePicture: "/uploads/1737483340817-acount_pic.jpg",
        tel: "+995599100015",
        guardian: "Other",
        guardianTel: "+995599200015",
        address: "Marjanishvili St 29, Tbilisi",
        team: teamU16._id,
        isActive: true,
      },
      {
        name: "Konstantine",
        lastname: "Melikidze",
        position: "Point Guard",
        jerseyNum: 2,
        height: 176,
        dateOfBirth: new Date("2010-10-01"),
        isFirstTeam: false,
        profilePicture: "/uploads/1737482793116-acount_pic-1.jpg",
        tel: "+995599100016",
        guardian: "Mother",
        guardianTel: "+995599200016",
        address: "Aghmashenebeli Ave 112, Tbilisi",
        team: teamU16._id,
        isActive: true,
      },
      {
        name: "Beka",
        lastname: "Gurgenidze",
        position: "Shooting Guard",
        jerseyNum: 9,
        height: 184,
        dateOfBirth: new Date("2010-08-17"),
        isFirstTeam: false,
        profilePicture: "/uploads/1739040439615-U18_Player.png",
        tel: "+995599100017",
        guardian: "Father",
        guardianTel: "+995599200017",
        address: "Gorgasali St 7, Tbilisi",
        team: teamU16._id,
        isActive: true,
      },
    ];

    const insertedU16 = await Player.insertMany(u16Players);
    console.log(`Created ${insertedU16.length} players for BBA U16 Development`);

    // Clean existing events for these teams
    const existingEvents = await Event.find({ team: { $in: [teamU18._id, teamU16._id] } });
    const existingEventIds = existingEvents.map(e => e._id);
    await GameResult.deleteMany({ event: { $in: existingEventIds } });
    await Event.deleteMany({ team: { $in: [teamU18._id, teamU16._id] } });

    // 7. Seed Events & Games
    const now = new Date();
    const tomorrow10am = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0, 0);
    const tomorrow12pm = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12, 0, 0);

    const tomorrow2pm = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 14, 0, 0);
    const tomorrow4pm = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 16, 0, 0);

    const dayAfterTomorrow11am = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 11, 0, 0);
    const dayAfterTomorrow1230pm = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 12, 30, 0);

    const in3Days6pm = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 18, 0, 0);
    const in3Days8pm = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 20, 0, 0);

    const yesterday6pm = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 18, 0, 0);
    const yesterday8pm = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 20, 0, 0);

    const twoDaysAgo3pm = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 15, 0, 0);
    const twoDaysAgo5pm = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 17, 0, 0);
    const fourDaysAgo5pm = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 4, 17, 0, 0);
    const fourDaysAgo7pm = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 4, 19, 0, 0);
    const sevenDaysAgo6pm = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 18, 0, 0);
    const sevenDaysAgo8pm = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 20, 0, 0);
    const tenDaysAgo4pm = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10, 16, 0, 0);
    const tenDaysAgo6pm = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10, 18, 0, 0);
    const fourteenDaysAgo6pm = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14, 18, 0, 0);
    const fourteenDaysAgo8pm = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14, 20, 0, 0);
    // Event 1: Practice U18
    await Event.create({
      eventType: "practice",
      title: "BBA U18 Full Court Press & Transition",
      description: "High intensity defensive transitions and fastbreak execution drills.",
      startTime: tomorrow10am,
      endTime: tomorrow12pm,
      isAwayGame: false,
      venue: venues[0]._id,
      team: teamU18._id,
      players: insertedU18.map(p => p._id),
    });

    // Event 2: Practice U16
    await Event.create({
      eventType: "practice",
      title: "BBA U16 Offensive Spacing & Fundamentals",
      description: "Motion offense installation and pick & roll fundamentals.",
      startTime: tomorrow2pm,
      endTime: tomorrow4pm,
      isAwayGame: false,
      venue: venues[1]._id,
      team: teamU16._id,
      players: insertedU16.map(p => p._id),
    });

    // Event 3: Individual Training
    await Event.create({
      eventType: "individualTraining",
      title: "Zuka Beridze - Guard Skills & Shooting",
      description: "Shooting off the dribble and rim decision making.",
      startTime: dayAfterTomorrow11am,
      endTime: dayAfterTomorrow1230pm,
      isAwayGame: false,
      venue: venues[1]._id,
      team: teamU18._id,
      players: [insertedU18[0]._id],
    });

    // Event 4: Upcoming Game
    const upcomingGameEvent = await Event.create({
      eventType: "game",
      title: "BBA U18 vs Rustavi U18",
      description: "National Youth Championship Regular Season Match",
      opponent: "Rustavi U18",
      startTime: in3Days6pm,
      endTime: in3Days8pm,
      isAwayGame: false,
      venue: venues[0]._id,
      team: teamU18._id,
      players: insertedU18.map(p => p._id),
    });

    await GameResult.create({
      event: upcomingGameEvent._id,
      status: "scheduled",
      periodScores: [
        { period: 1, homeScore: 0, awayScore: 0 },
        { period: 2, homeScore: 0, awayScore: 0 },
        { period: 3, homeScore: 0, awayScore: 0 },
        { period: 4, homeScore: 0, awayScore: 0 },
      ],
    });

    // Event 5: Completed Game U18 vs Dinamo Tbilisi
    const completedGameU18 = await Event.create({
      eventType: "game",
      title: "BBA U18 vs Dinamo Tbilisi U18",
      description: "Tbilisi Youth League Derby",
      opponent: "Dinamo Tbilisi U18",
      startTime: yesterday6pm,
      endTime: yesterday8pm,
      isAwayGame: false,
      venue: venues[0]._id,
      team: teamU18._id,
      players: insertedU18.map(p => p._id),
    });

    await GameResult.create({
      event: completedGameU18._id,
      status: "completed",
      homeTeamScore: 95,
      awayTeamScore: 81,
      periodScores: [
        { period: 1, homeScore: 24, awayScore: 18 },
        { period: 2, homeScore: 22, awayScore: 20 },
        { period: 3, homeScore: 26, awayScore: 21 },
        { period: 4, homeScore: 23, awayScore: 22 },
      ],
    });

    // Event 6: Completed Game U16 vs Wings Basketball
    const completedGameU16 = await Event.create({
      eventType: "game",
      title: "BBA U16 vs Wings Basketball U16",
      description: "Youth Cup Group Stage",
      opponent: "Wings Basketball U16",
      startTime: twoDaysAgo3pm,
      endTime: twoDaysAgo5pm,
      isAwayGame: false,
      venue: venues[1]._id,
      team: teamU16._id,
      players: insertedU16.map(p => p._id),
    });

    await GameResult.create({
      event: completedGameU16._id,
      status: "completed",
      homeTeamScore: 82,
      awayTeamScore: 74,
      periodScores: [
        { period: 1, homeScore: 18, awayScore: 15 },
        { period: 2, homeScore: 20, awayScore: 19 },
        { period: 3, homeScore: 19, awayScore: 22 },
        { period: 4, homeScore: 25, awayScore: 18 },
      ],
    });
    // Additional historical games for U18
    const u18PastGame1 = await Event.create({
      eventType: "game",
      title: "BBA U18 vs Overtime Academy U18",
      description: "National Youth Championship Round 4",
      opponent: "Overtime Academy U18",
      startTime: fourDaysAgo5pm,
      endTime: fourDaysAgo7pm,
      isAwayGame: false,
      venue: venues[0]._id,
      team: teamU18._id,
      players: insertedU18.map(p => p._id),
    });
    await GameResult.create({
      event: u18PastGame1._id,
      status: "completed",
      homeTeamScore: 88,
      awayTeamScore: 79,
      periodScores: [
        { period: 1, homeScore: 22, awayScore: 19 },
        { period: 2, homeScore: 24, awayScore: 20 },
        { period: 3, homeScore: 20, awayScore: 21 },
        { period: 4, homeScore: 22, awayScore: 19 },
      ],
    });

    const u18PastGame2 = await Event.create({
      eventType: "game",
      title: "BBA U18 vs Batumi Youth U18",
      description: "National Youth Championship Round 3",
      opponent: "Batumi Youth U18",
      startTime: sevenDaysAgo6pm,
      endTime: sevenDaysAgo8pm,
      isAwayGame: true,
      location: "Batumi Sport Complex Arena",
      team: teamU18._id,
      players: insertedU18.map(p => p._id),
    });
    await GameResult.create({
      event: u18PastGame2._id,
      status: "completed",
      homeTeamScore: 80,
      awayTeamScore: 76,
      periodScores: [
        { period: 1, homeScore: 20, awayScore: 18 },
        { period: 2, homeScore: 18, awayScore: 21 },
        { period: 3, homeScore: 21, awayScore: 17 },
        { period: 4, homeScore: 21, awayScore: 20 },
      ],
    });

    const u18PastGame3 = await Event.create({
      eventType: "game",
      title: "BBA U18 vs Tbilisi Bulls U18",
      description: "National Youth Championship Round 2",
      opponent: "Tbilisi Bulls U18",
      startTime: tenDaysAgo4pm,
      endTime: tenDaysAgo6pm,
      isAwayGame: false,
      venue: venues[0]._id,
      team: teamU18._id,
      players: insertedU18.map(p => p._id),
    });
    await GameResult.create({
      event: u18PastGame3._id,
      status: "completed",
      homeTeamScore: 102,
      awayTeamScore: 68,
      periodScores: [
        { period: 1, homeScore: 28, awayScore: 14 },
        { period: 2, homeScore: 26, awayScore: 18 },
        { period: 3, homeScore: 25, awayScore: 16 },
        { period: 4, homeScore: 23, awayScore: 20 },
      ],
    });

    const u18PastGame4 = await Event.create({
      eventType: "game",
      title: "BBA U18 vs Sokhumi Youth U18",
      description: "National Youth Championship Season Opener",
      opponent: "Sokhumi Youth U18",
      startTime: fourteenDaysAgo6pm,
      endTime: fourteenDaysAgo8pm,
      isAwayGame: false,
      venue: venues[0]._id,
      team: teamU18._id,
      players: insertedU18.map(p => p._id),
    });
    await GameResult.create({
      event: u18PastGame4._id,
      status: "completed",
      homeTeamScore: 91,
      awayTeamScore: 84,
      periodScores: [
        { period: 1, homeScore: 25, awayScore: 22 },
        { period: 2, homeScore: 21, awayScore: 20 },
        { period: 3, homeScore: 22, awayScore: 21 },
        { period: 4, homeScore: 23, awayScore: 21 },
      ],
    });
    console.log("Created events, practices, games, and game results!");
    console.log("\nDummy data seeding for nika@bba.ge completed successfully!");
  } catch (err) {
    console.error("Error seeding dummy data:", err);
  } finally {
    await mongoose.disconnect();
  }
}

seedDummyData();
