export interface PlayerPositionPoint {
  id: string;
  x: number;
  y: number;
  hasBall?: boolean;
}

export interface BallMovement {
  from: { x: number; y: number };
  to: { x: number; y: number };
  through?: Array<{ x: number; y: number }>;
}

export interface CombinationStep {
  id: number;
  description: string;
  annotations?: string[];
  playerPositions: {
    ourTeam: PlayerPositionPoint[];
    opponents: PlayerPositionPoint[];
  };
  ballMovement?: BallMovement;
}

export interface Combination {
  name: string;
  description: string;
  steps: CombinationStep[];
}

export const combinations: Combination[] = [
    {
        name: "Pick and Roll with Wing Screen",
        description: "Basic pick and roll action with a wing screen to create multiple scoring options",
        steps: [
            {
                id: 1,
                description: "Point guard (PG) starts with the ball at the top of the key",
                annotations: ["PG calls the play", "Other players get into position"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 50, y: 25, hasBall: true},
                        {id: "SG", x: 75, y: 35},
                        {id: "SF", x: 25, y: 35},
                        {id: "PF", x: 65, y: 65},
                        {id: "C", x: 35, y: 65}
                    ],
                    opponents: [
                        {id: "OPG", x: 50, y: 30},
                        {id: "OSG", x: 75, y: 40},
                        {id: "OSF", x: 25, y: 40},
                        {id: "OPF", x: 65, y: 70},
                        {id: "OC", x: 35, y: 70}
                    ]
                }
            },
            {
                id: 2,
                description: "Center (C) moves up to set a screen for PG",
                annotations: ["C communicates screen is coming", "PG prepares to use screen"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 50, y: 25, hasBall: true},
                        {id: "SG", x: 75, y: 35},
                        {id: "SF", x: 25, y: 35},
                        {id: "PF", x: 65, y: 65},
                        {id: "C", x: 45, y: 40}
                    ],
                    opponents: [
                        {id: "OPG", x: 50, y: 30},
                        {id: "OSG", x: 75, y: 40},
                        {id: "OSF", x: 25, y: 40},
                        {id: "OPF", x: 65, y: 70},
                        {id: "OC", x: 45, y: 45}
                    ]
                }
            },
            {
                id: 3,
                description: "PG uses screen and drives to basket",
                annotations: ["PG reads the defense", "C rolls to basket after screen"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 60, y: 45, hasBall: true},
                        {id: "SG", x: 75, y: 35},
                        {id: "SF", x: 25, y: 35},
                        {id: "PF", x: 65, y: 65},
                        {id: "C", x: 50, y: 50}
                    ],
                    opponents: [
                        {id: "OPG", x: 55, y: 40},
                        {id: "OSG", x: 75, y: 40},
                        {id: "OSF", x: 25, y: 40},
                        {id: "OPF", x: 65, y: 70},
                        {id: "OC", x: 45, y: 55}
                    ]
                }
            },
            {
                id: 4,
                description: "C rolls to basket, SF shifts to wing for spacing",
                annotations: ["Defense may collapse on drive", "Creates passing options"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 65, y: 60, hasBall: true},
                        {id: "SG", x: 75, y: 40},
                        {id: "SF", x: 30, y: 30},
                        {id: "PF", x: 65, y: 65},
                        {id: "C", x: 55, y: 75}
                    ],
                    opponents: [
                        {id: "OPG", x: 60, y: 55},
                        {id: "OSG", x: 75, y: 45},
                        {id: "OSF", x: 30, y: 35},
                        {id: "OPF", x: 65, y: 70},
                        {id: "OC", x: 60, y: 70}
                    ]
                }
            },
            {
                id: 5,
                description: "PG passes to rolling C for layup",
                annotations: ["PG makes decision based on help defense", "C finishes at rim"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 65, y: 60},
                        {id: "SG", x: 75, y: 40},
                        {id: "SF", x: 30, y: 30},
                        {id: "PF", x: 65, y: 65},
                        {id: "C", x: 50, y: 85, hasBall: true}
                    ],
                    opponents: [
                        {id: "OPG", x: 60, y: 55},
                        {id: "OSG", x: 75, y: 45},
                        {id: "OSF", x: 30, y: 35},
                        {id: "OPF", x: 60, y: 75},
                        {id: "OC", x: 55, y: 80}
                    ]
                },
                ballMovement: {
                    from: {x: 65, y: 60},
                    to: {x: 50, y: 85},
                    through: [{x: 58, y: 70}]
                }
            }
        ]
    },
    {
        name: "Pick and Pop",
        description: "A variation of the pick and roll where the screener pops out for a jump shot",
        steps: [
            {
                id: 1,
                description: "Point guard (PG) starts with the ball at the top of the key",
                annotations: ["PG calls the play", "Other players get into position"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 50, y: 25, hasBall: true},
                        {id: "SG", x: 75, y: 35},
                        {id: "SF", x: 25, y: 35},
                        {id: "PF", x: 65, y: 65},
                        {id: "C", x: 35, y: 65}
                    ],
                    opponents: [
                        {id: "OPG", x: 50, y: 30},
                        {id: "OSG", x: 75, y: 40},
                        {id: "OSF", x: 25, y: 40},
                        {id: "OPF", x: 65, y: 70},
                        {id: "OC", x: 35, y: 70}
                    ]
                }
            },
            {
                id: 2,
                description: "Power forward (PF) sets a screen for PG",
                annotations: ["PF communicates screen is coming", "PG prepares to use screen"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 50, y: 25, hasBall: true},
                        {id: "SG", x: 75, y: 35},
                        {id: "SF", x: 25, y: 35},
                        {id: "PF", x: 55, y: 40},
                        {id: "C", x: 35, y: 65}
                    ],
                    opponents: [
                        {id: "OPG", x: 50, y: 30},
                        {id: "OSG", x: 75, y: 40},
                        {id: "OSF", x: 25, y: 40},
                        {id: "OPF", x: 60, y: 45},
                        {id: "OC", x: 35, y: 70}
                    ]
                }
            },
            {
                id: 3,
                description: "PG uses screen and drives to basket",
                annotations: ["PG reads the defense", "PF pops out to three-point line"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 60, y: 45, hasBall: true},
                        {id: "SG", x: 75, y: 35},
                        {id: "SF", x: 25, y: 35},
                        {id: "PF", x: 70, y: 30},
                        {id: "C", x: 35, y: 65}
                    ],
                    opponents: [
                        {id: "OPG", x: 55, y: 40},
                        {id: "OSG", x: 75, y: 40},
                        {id: "OSF", x: 25, y: 40},
                        {id: "OPF", x: 65, y: 35},
                        {id: "OC", x: 35, y: 70}
                    ]
                }
            },
            {
                id: 4,
                description: "PG passes to PF for a three-point shot",
                annotations: ["PG makes decision based on help defense", "PF shoots if open"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 65, y: 60},
                        {id: "SG", x: 75, y: 40},
                        {id: "SF", x: 25, y: 35},
                        {id: "PF", x: 70, y: 30, hasBall: true},
                        {id: "C", x: 35, y: 65}
                    ],
                    opponents: [
                        {id: "OPG", x: 60, y: 55},
                        {id: "OSG", x: 75, y: 45},
                        {id: "OSF", x: 25, y: 40},
                        {id: "OPF", x: 65, y: 35},
                        {id: "OC", x: 35, y: 70}
                    ]
                },
                ballMovement: {
                    from: {x: 65, y: 60},
                    to: {x: 70, y: 30},
                    through: [{x: 68, y: 45}]
                }
            }
        ]
    },
    {
        name: "Horns Set",
        description: "A versatile set that creates multiple scoring options from the high post",
        steps: [
            {
                id: 1,
                description: "PG starts with the ball at the top of the key, PF and C at the elbows",
                annotations: ["PG calls the play", "PF and C set up at high post"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 50, y: 25, hasBall: true},
                        {id: "SG", x: 75, y: 35},
                        {id: "SF", x: 25, y: 35},
                        {id: "PF", x: 40, y: 50},
                        {id: "C", x: 60, y: 50}
                    ],
                    opponents: [
                        {id: "OPG", x: 50, y: 30},
                        {id: "OSG", x: 75, y: 40},
                        {id: "OSF", x: 25, y: 40},
                        {id: "OPF", x: 40, y: 55},
                        {id: "OC", x: 60, y: 55}
                    ]
                }
            },
            {
                id: 2,
                description: "PG passes to PF at the elbow",
                annotations: ["PF can shoot, drive, or pass", "C sets a screen for SG"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 50, y: 25},
                        {id: "SG", x: 75, y: 35},
                        {id: "SF", x: 25, y: 35},
                        {id: "PF", x: 40, y: 50, hasBall: true},
                        {id: "C", x: 60, y: 50}
                    ],
                    opponents: [
                        {id: "OPG", x: 50, y: 30},
                        {id: "OSG", x: 75, y: 40},
                        {id: "OSF", x: 25, y: 40},
                        {id: "OPF", x: 40, y: 55},
                        {id: "OC", x: 60, y: 55}
                    ]
                },
                ballMovement: {
                    from: {x: 50, y: 25},
                    to: {x: 40, y: 50},
                    through: [{x: 45, y: 35}]
                }
            },
            {
                id: 3,
                description: "PF drives to the basket or passes to C rolling to the rim",
                annotations: ["PF reads the defense", "C rolls if PF drives"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 50, y: 25},
                        {id: "SG", x: 75, y: 35},
                        {id: "SF", x: 25, y: 35},
                        {id: "PF", x: 45, y: 60, hasBall: true},
                        {id: "C", x: 55, y: 70}
                    ],
                    opponents: [
                        {id: "OPG", x: 50, y: 30},
                        {id: "OSG", x: 75, y: 40},
                        {id: "OSF", x: 25, y: 40},
                        {id: "OPF", x: 45, y: 65},
                        {id: "OC", x: 55, y: 75}
                    ]
                }
            }
        ]
    },
    {
        name: "Give and Go",
        description: "A simple two-man play involving a quick pass and cut to the basket",
        steps: [
            {
                id: 1,
                description: "PG starts with the ball at the top of the key",
                annotations: ["PG calls the play", "SG prepares to cut"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 50, y: 25, hasBall: true},
                        {id: "SG", x: 75, y: 35},
                        {id: "SF", x: 25, y: 35},
                        {id: "PF", x: 65, y: 65},
                        {id: "C", x: 35, y: 65}
                    ],
                    opponents: [
                        {id: "OPG", x: 50, y: 30},
                        {id: "OSG", x: 75, y: 40},
                        {id: "OSF", x: 25, y: 40},
                        {id: "OPF", x: 65, y: 70},
                        {id: "OC", x: 35, y: 70}
                    ]
                }
            },
            {
                id: 2,
                description: "PG passes to SG on the wing",
                annotations: ["SG must be ready to receive the pass", "PG prepares to cut"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 50, y: 25},
                        {id: "SG", x: 75, y: 35, hasBall: true},
                        {id: "SF", x: 25, y: 35},
                        {id: "PF", x: 65, y: 65},
                        {id: "C", x: 35, y: 65}
                    ],
                    opponents: [
                        {id: "OPG", x: 50, y: 30},
                        {id: "OSG", x: 75, y: 40},
                        {id: "OSF", x: 25, y: 40},
                        {id: "OPF", x: 65, y: 70},
                        {id: "OC", x: 35, y: 70}
                    ]
                },
                ballMovement: {
                    from: {x: 50, y: 25},
                    to: {x: 75, y: 35},
                    through: [{x: 60, y: 30}]
                }
            },
            {
                id: 3,
                description: "PG cuts to the basket, SG looks for the return pass",
                annotations: ["PG must time the cut", "SG reads the defense"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 60, y: 50},
                        {id: "SG", x: 75, y: 35, hasBall: true},
                        {id: "SF", x: 25, y: 35},
                        {id: "PF", x: 65, y: 65},
                        {id: "C", x: 35, y: 65}
                    ],
                    opponents: [
                        {id: "OPG", x: 55, y: 45},
                        {id: "OSG", x: 75, y: 40},
                        {id: "OSF", x: 25, y: 40},
                        {id: "OPF", x: 65, y: 70},
                        {id: "OC", x: 35, y: 70}
                    ]
                }
            },
            {
                id: 4,
                description: "SG passes back to PG for a layup",
                annotations: ["SG makes the pass if PG is open", "PG finishes at the rim"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 65, y: 75, hasBall: true},
                        {id: "SG", x: 75, y: 35},
                        {id: "SF", x: 25, y: 35},
                        {id: "PF", x: 65, y: 65},
                        {id: "C", x: 35, y: 65}
                    ],
                    opponents: [
                        {id: "OPG", x: 60, y: 70},
                        {id: "OSG", x: 75, y: 40},
                        {id: "OSF", x: 25, y: 40},
                        {id: "OPF", x: 65, y: 70},
                        {id: "OC", x: 35, y: 70}
                    ]
                },
                ballMovement: {
                    from: {x: 75, y: 35},
                    to: {x: 65, y: 75},
                    through: [{x: 70, y: 55}]
                }
            }
        ]
    },
    {
        name: "Flare Screen",
        description: "A screen set away from the ball to free up a shooter",
        steps: [
            {
                id: 1,
                description: "PG starts with the ball at the top of the key",
                annotations: ["PG calls the play", "SG prepares to use the flare screen"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 50, y: 25, hasBall: true},
                        {id: "SG", x: 75, y: 35},
                        {id: "SF", x: 25, y: 35},
                        {id: "PF", x: 65, y: 65},
                        {id: "C", x: 35, y: 65}
                    ],
                    opponents: [
                        {id: "OPG", x: 50, y: 30},
                        {id: "OSG", x: 75, y: 40},
                        {id: "OSF", x: 25, y: 40},
                        {id: "OPF", x: 65, y: 70},
                        {id: "OC", x: 35, y: 70}
                    ]
                }
            },
            {
                id: 2,
                description: "PF sets a flare screen for SG",
                annotations: ["PF communicates screen is coming", "SG prepares to use screen"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 50, y: 25, hasBall: true},
                        {id: "SG", x: 75, y: 35},
                        {id: "SF", x: 25, y: 35},
                        {id: "PF", x: 80, y: 30},
                        {id: "C", x: 35, y: 65}
                    ],
                    opponents: [
                        {id: "OPG", x: 50, y: 30},
                        {id: "OSG", x: 75, y: 40},
                        {id: "OSF", x: 25, y: 40},
                        {id: "OPF", x: 80, y: 35},
                        {id: "OC", x: 35, y: 70}
                    ]
                }
            },
            {
                id: 3,
                description: "SG uses the flare screen to get open for a three-point shot",
                annotations: ["SG reads the defense", "PG passes to SG if open"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 50, y: 25, hasBall: true},
                        {id: "SG", x: 85, y: 30},
                        {id: "SF", x: 25, y: 35},
                        {id: "PF", x: 80, y: 30},
                        {id: "C", x: 35, y: 65}
                    ],
                    opponents: [
                        {id: "OPG", x: 50, y: 30},
                        {id: "OSG", x: 80, y: 35},
                        {id: "OSF", x: 25, y: 40},
                        {id: "OPF", x: 80, y: 35},
                        {id: "OC", x: 35, y: 70}
                    ]
                }
            },
            {
                id: 4,
                description: "PG passes to SG for a three-point shot",
                annotations: ["PG makes the pass if SG is open", "SG shoots if open"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 50, y: 25},
                        {id: "SG", x: 85, y: 30, hasBall: true},
                        {id: "SF", x: 25, y: 35},
                        {id: "PF", x: 80, y: 30},
                        {id: "C", x: 35, y: 65}
                    ],
                    opponents: [
                        {id: "OPG", x: 50, y: 30},
                        {id: "OSG", x: 80, y: 35},
                        {id: "OSF", x: 25, y: 40},
                        {id: "OPF", x: 80, y: 35},
                        {id: "OC", x: 35, y: 70}
                    ]
                },
                ballMovement: {
                    from: {x: 50, y: 25},
                    to: {x: 85, y: 30},
                    through: [{x: 65, y: 30}]
                }
            }
        ]
    },
    {
        name: "Backdoor Cut",
        description: "A cut to the basket when the defender overplays the passing lane",
        steps: [
            {
                id: 1,
                description: "PG starts with the ball at the top of the key",
                annotations: ["PG calls the play", "SG prepares to backdoor cut"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 50, y: 25, hasBall: true},
                        {id: "SG", x: 75, y: 35},
                        {id: "SF", x: 25, y: 35},
                        {id: "PF", x: 65, y: 65},
                        {id: "C", x: 35, y: 65}
                    ],
                    opponents: [
                        {id: "OPG", x: 50, y: 30},
                        {id: "OSG", x: 75, y: 40},
                        {id: "OSF", x: 25, y: 40},
                        {id: "OPF", x: 65, y: 70},
                        {id: "OC", x: 35, y: 70}
                    ]
                }
            },
            {
                id: 2,
                description: "SG fakes a move to the wing, then cuts backdoor",
                annotations: ["SG reads the defense", "PG looks for the pass"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 50, y: 25, hasBall: true},
                        {id: "SG", x: 60, y: 50},
                        {id: "SF", x: 25, y: 35},
                        {id: "PF", x: 65, y: 65},
                        {id: "C", x: 35, y: 65}
                    ],
                    opponents: [
                        {id: "OPG", x: 50, y: 30},
                        {id: "OSG", x: 65, y: 45},
                        {id: "OSF", x: 25, y: 40},
                        {id: "OPF", x: 65, y: 70},
                        {id: "OC", x: 35, y: 70}
                    ]
                }
            },
            {
                id: 3,
                description: "PG passes to SG for a layup",
                annotations: ["PG makes the pass if SG is open", "SG finishes at the rim"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 50, y: 25},
                        {id: "SG", x: 65, y: 75, hasBall: true},
                        {id: "SF", x: 25, y: 35},
                        {id: "PF", x: 65, y: 65},
                        {id: "C", x: 35, y: 65}
                    ],
                    opponents: [
                        {id: "OPG", x: 50, y: 30},
                        {id: "OSG", x: 60, y: 70},
                        {id: "OSF", x: 25, y: 40},
                        {id: "OPF", x: 65, y: 70},
                        {id: "OC", x: 35, y: 70}
                    ]
                },
                ballMovement: {
                    from: {x: 50, y: 25},
                    to: {x: 65, y: 75},
                    through: [{x: 55, y: 50}]
                }
            }
        ]
    },
    {
        name: "Dribble Handoff",
        description: "A quick handoff between the ball handler and a teammate to create a scoring opportunity",
        steps: [
            {
                id: 1,
                description: "PG starts with the ball at the top of the key",
                annotations: ["PG calls the play", "SG prepares to receive the handoff"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 50, y: 25, hasBall: true},
                        {id: "SG", x: 75, y: 35},
                        {id: "SF", x: 25, y: 35},
                        {id: "PF", x: 65, y: 65},
                        {id: "C", x: 35, y: 65}
                    ],
                    opponents: [
                        {id: "OPG", x: 50, y: 30},
                        {id: "OSG", x: 75, y: 40},
                        {id: "OSF", x: 25, y: 40},
                        {id: "OPF", x: 65, y: 70},
                        {id: "OC", x: 35, y: 70}
                    ]
                }
            },
            {
                id: 2,
                description: "PG dribbles towards SG for a handoff",
                annotations: ["SG must be ready to receive the handoff", "PG prepares to screen"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 60, y: 30, hasBall: true},
                        {id: "SG", x: 75, y: 35},
                        {id: "SF", x: 25, y: 35},
                        {id: "PF", x: 65, y: 65},
                        {id: "C", x: 35, y: 65}
                    ],
                    opponents: [
                        {id: "OPG", x: 55, y: 35},
                        {id: "OSG", x: 75, y: 40},
                        {id: "OSF", x: 25, y: 40},
                        {id: "OPF", x: 65, y: 70},
                        {id: "OC", x: 35, y: 70}
                    ]
                }
            },
            {
                id: 3,
                description: "SG receives the handoff and drives to the basket",
                annotations: ["SG reads the defense", "PG sets a screen if needed"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 65, y: 35},
                        {id: "SG", x: 70, y: 40, hasBall: true},
                        {id: "SF", x: 25, y: 35},
                        {id: "PF", x: 65, y: 65},
                        {id: "C", x: 35, y: 65}
                    ],
                    opponents: [
                        {id: "OPG", x: 60, y: 35},
                        {id: "OSG", x: 70, y: 45},
                        {id: "OSF", x: 25, y: 40},
                        {id: "OPF", x: 65, y: 70},
                        {id: "OC", x: 35, y: 70}
                    ]
                }
            },
            {
                id: 4,
                description: "SG finishes at the rim or passes to an open teammate",
                annotations: ["SG makes the decision based on the defense", "PG rolls to the basket"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 70, y: 50},
                        {id: "SG", x: 75, y: 60, hasBall: true},
                        {id: "SF", x: 25, y: 35},
                        {id: "PF", x: 65, y: 65},
                        {id: "C", x: 35, y: 65}
                    ],
                    opponents: [
                        {id: "OPG", x: 65, y: 45},
                        {id: "OSG", x: 70, y: 55},
                        {id: "OSF", x: 25, y: 40},
                        {id: "OPF", x: 65, y: 70},
                        {id: "OC", x: 35, y: 70}
                    ]
                }
            }
        ]
    },
    {
        name: "Post-Up Play",
        description: "A play designed to get the ball to a post player for a scoring opportunity",
        steps: [
            {
                id: 1,
                description: "PG starts with the ball at the top of the key",
                annotations: ["PG calls the play", "C prepares to post up"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 50, y: 25, hasBall: true},
                        {id: "SG", x: 75, y: 35},
                        {id: "SF", x: 25, y: 35},
                        {id: "PF", x: 65, y: 65},
                        {id: "C", x: 35, y: 65}
                    ],
                    opponents: [
                        {id: "OPG", x: 50, y: 30},
                        {id: "OSG", x: 75, y: 40},
                        {id: "OSF", x: 25, y: 40},
                        {id: "OPF", x: 65, y: 70},
                        {id: "OC", x: 35, y: 70}
                    ]
                }
            },
            {
                id: 2,
                description: "C establishes position in the low post",
                annotations: ["C communicates for the ball", "PG looks to pass"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 50, y: 25, hasBall: true},
                        {id: "SG", x: 75, y: 35},
                        {id: "SF", x: 25, y: 35},
                        {id: "PF", x: 65, y: 65},
                        {id: "C", x: 35, y: 75}
                    ],
                    opponents: [
                        {id: "OPG", x: 50, y: 30},
                        {id: "OSG", x: 75, y: 40},
                        {id: "OSF", x: 25, y: 40},
                        {id: "OPF", x: 65, y: 70},
                        {id: "OC", x: 35, y: 75}
                    ]
                }
            },
            {
                id: 3,
                description: "PG passes to C in the post",
                annotations: ["C must seal the defender", "PG looks to cut after the pass"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 50, y: 25},
                        {id: "SG", x: 75, y: 35},
                        {id: "SF", x: 25, y: 35},
                        {id: "PF", x: 65, y: 65},
                        {id: "C", x: 35, y: 75, hasBall: true}
                    ],
                    opponents: [
                        {id: "OPG", x: 50, y: 30},
                        {id: "OSG", x: 75, y: 40},
                        {id: "OSF", x: 25, y: 40},
                        {id: "OPF", x: 65, y: 70},
                        {id: "OC", x: 35, y: 75}
                    ]
                },
                ballMovement: {
                    from: {x: 50, y: 25},
                    to: {x: 35, y: 75},
                    through: [{x: 40, y: 50}]
                }
            },
            {
                id: 4,
                description: "C scores in the post or kicks out to an open teammate",
                annotations: ["C reads the defense", "Teammates must be ready to shoot"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 50, y: 25},
                        {id: "SG", x: 75, y: 35},
                        {id: "SF", x: 25, y: 35},
                        {id: "PF", x: 65, y: 65},
                        {id: "C", x: 35, y: 75, hasBall: true}
                    ],
                    opponents: [
                        {id: "OPG", x: 50, y: 30},
                        {id: "OSG", x: 75, y: 40},
                        {id: "OSF", x: 25, y: 40},
                        {id: "OPF", x: 65, y: 70},
                        {id: "OC", x: 35, y: 75}
                    ]
                }
            }
        ]
    },
    {
        name: "Double Screen",
        description: "Two screens set simultaneously to free up a shooter or ball handler",
        steps: [
            {
                id: 1,
                description: "PG starts with the ball at the top of the key",
                annotations: ["PG calls the play", "SG and SF prepare to set screens"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 50, y: 25, hasBall: true},
                        {id: "SG", x: 75, y: 35},
                        {id: "SF", x: 25, y: 35},
                        {id: "PF", x: 65, y: 65},
                        {id: "C", x: 35, y: 65}
                    ],
                    opponents: [
                        {id: "OPG", x: 50, y: 30},
                        {id: "OSG", x: 75, y: 40},
                        {id: "OSF", x: 25, y: 40},
                        {id: "OPF", x: 65, y: 70},
                        {id: "OC", x: 35, y: 70}
                    ]
                }
            },
            {
                id: 2,
                description: "SG and SF set a double screen for PG",
                annotations: ["SG and SF communicate the screens", "PG prepares to use screens"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 50, y: 25, hasBall: true},
                        {id: "SG", x: 60, y: 30},
                        {id: "SF", x: 40, y: 30},
                        {id: "PF", x: 65, y: 65},
                        {id: "C", x: 35, y: 65}
                    ],
                    opponents: [
                        {id: "OPG", x: 50, y: 30},
                        {id: "OSG", x: 60, y: 35},
                        {id: "OSF", x: 40, y: 35},
                        {id: "OPF", x: 65, y: 70},
                        {id: "OC", x: 35, y: 70}
                    ]
                }
            },
            {
                id: 3,
                description: "PG uses the double screen to drive or shoot",
                annotations: ["PG reads the defense", "SG and SF roll to the basket"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 65, y: 40, hasBall: true},
                        {id: "SG", x: 60, y: 50},
                        {id: "SF", x: 40, y: 50},
                        {id: "PF", x: 65, y: 65},
                        {id: "C", x: 35, y: 65}
                    ],
                    opponents: [
                        {id: "OPG", x: 60, y: 35},
                        {id: "OSG", x: 60, y: 45},
                        {id: "OSF", x: 40, y: 45},
                        {id: "OPF", x: 65, y: 70},
                        {id: "OC", x: 35, y: 70}
                    ]
                }
            },
            {
                id: 4,
                description: "PG scores or passes to an open teammate",
                annotations: ["PG makes the decision based on the defense", "Teammates must be ready to shoot"],
                playerPositions: {
                    ourTeam: [
                        {id: "PG", x: 70, y: 50, hasBall: true},
                        {id: "SG", x: 60, y: 50},
                        {id: "SF", x: 40, y: 50},
                        {id: "PF", x: 65, y: 65},
                        {id: "C", x: 35, y: 65}
                    ],
                    opponents: [
                        {id: "OPG", x: 65, y: 45},
                        {id: "OSG", x: 60, y: 45},
                        {id: "OSF", x: 40, y: 45},
                        {id: "OPF", x: 65, y: 70},
                        {id: "OC", x: 35, y: 70}
                    ]
                }
            }
        ]
    },
]

