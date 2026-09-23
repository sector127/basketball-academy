'use client';

import {CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {Switch} from "@/components/ui/switch";
import {Textarea} from "@/components/ui/textarea";
import React, {useEffect, useState} from "react";
import {formatDateTime} from "@/hooks/use-dateTime";

const GameForm = ({register, setValue, initialValues}) => {
    const [loading, setLoading] = useState(true);
    const [teams, setTeams] = useState([]);
    const [venues, setVenues] = useState([]);
    const [isAwayGame, setIsAwayGame] = useState(initialValues ? initialValues.isAwayGame : false); // State to track if it's an away game

    // Fetch teams
    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const response = await fetch('/api/admin/teams');
                const data = await response.json();
                setTeams(data || []);
            } catch (error) {
                console.error('Error fetching teams:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTeams();
    }, []);

    // Fetch venues
    useEffect(() => {
        const fetchVenues = async () => {
            try {
                const response = await fetch('/api/admin/venues');
                const data = await response.json();
                setVenues(data || []);
            } catch (error) {
                console.error('Error fetching venues:', error);
            }
        };
        fetchVenues();
    }, []);

    // Set default values for the form fields
    useEffect(() => {
        if (initialValues) {
            setValue("team", initialValues.team);
            setValue("opponent", initialValues.opponent);
            setValue("startTime", formatDateTime(initialValues.startTime));
            setValue("endTime", formatDateTime(initialValues.endTime));
            setValue("venue", initialValues.venue?._id);
            setValue("location", initialValues.location); // Add location field
            setValue("description", initialValues.description);
            setIsAwayGame(initialValues.isAwayGame);
        } else {
            setValue("team", "");
            setValue("opponent", "");
            setValue("startTime", "");
            setValue("endTime", "");
            setValue("venue", "");
            setValue("location", ""); // Add location field
            setValue("isAwayGame", false);
            setValue("description", "");
        }
    }, [initialValues, setValue]);

    // Handle isAwayGame toggle
    const handleAwayGameToggle = (checked) => {
        setIsAwayGame(checked);
        setValue("isAwayGame", checked);
        // Clear the other field when toggling
        if (checked) {
            setValue("venue", ""); // Clear venue if it's an away game
        } else {
            setValue("location", ""); // Clear location if it's a home game
        }
    };

    return (
        <div className="space-y-4">
            <CardHeader>
                <CardTitle>Game Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Team and Opponent */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="team">Team</Label>
                        <Select onValueChange={(value) => setValue("team", value)}
                                defaultValue={initialValues?.team._id}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a team"/>
                            </SelectTrigger>
                            <SelectContent>
                                {teams.map((team) => (
                                    <SelectItem key={team._id} value={team._id}>
                                        {team.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="opponent">Opponent</Label>
                        <Input id="opponent" {...register("opponent")} />
                    </div>
                </div>

                {/* Start Time and End Time */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input
                            id="startTime"
                            type="datetime-local"
                            {...register("startTime")}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="endTime">End Time</Label>
                        <Input
                            id="endTime"
                            type="datetime-local"
                            {...register("endTime")}
                        />
                    </div>
                </div>

                {/* Venue or Location */}
                {isAwayGame ? (
                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                            id="location"
                            {...register("location")}
                            placeholder="Enter the location for the away game"
                        />
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Label htmlFor="venue">Venue</Label>
                        <Select onValueChange={(value) => setValue("venue", value)}
                                defaultValue={initialValues?.venue?._id}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a Venue"/>
                            </SelectTrigger>
                            <SelectContent>
                                {venues.map((venue) => (
                                    <SelectItem key={venue._id} value={venue._id}>
                                        {venue.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Away Game Toggle */}
                <div className="flex items-center space-x-2">
                    <Switch
                        id="isAwayGame"
                        checked={isAwayGame}
                        onCheckedChange={handleAwayGameToggle}
                    />
                    <Label htmlFor="isAwayGame">Away Game</Label>
                </div>

                {/* Additional Notes */}
                <div className="space-y-2">
                    <Label htmlFor="description">Additional Notes</Label>
                    <Textarea
                        id="description"
                        {...register("description")}
                        placeholder="Any special instructions or notes..."
                    />
                </div>
            </CardContent>
        </div>
    );
};

export default GameForm;