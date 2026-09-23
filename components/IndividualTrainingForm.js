'use client'

import {CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Select as SelectUI, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import React, {useEffect, useState} from "react";
import {formatDateTime} from "@/hooks/use-dateTime";
import Select from 'react-select'; // Import react-select

const IndividualTrainingForm = ({register, setValue, initialValues}) => {
    const [venues, setVenues] = useState([]);
    const [players, setPlayers] = useState([]);
    const [selectedPlayers, setSelectedPlayers] = useState([]);

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

    // Fetch players
    useEffect(() => {
        const fetchPlayers = async () => {
            try {
                const response = await fetch('/api/admin/players');
                const data = await response.json();
                setPlayers(data || []);
            } catch (error) {
                console.error('Error fetching players:', error);
            }
        };
        fetchPlayers();
    }, []);

    // Set initial values for the form fields
    useEffect(() => {
        if (initialValues) {
            setValue('title', initialValues.title);
            setValue('startTime', formatDateTime(initialValues.startTime));
            setValue('endTime', formatDateTime(initialValues.endTime));
            setValue('trainingType', initialValues.trainingType);
            setValue('venue', initialValues.venue._id);
            setSelectedPlayers(initialValues.players.map(player => ({
                value: player._id,
                label: `${player.name} ${player.lastname}`
            })) || []);
        } else {
            setValue('title', '');
            setValue('startTime', '');
            setValue('endTime', '');
            setValue('trainingType', '');
            setValue('venue', '');
            setSelectedPlayers([]);
        }
    }, [initialValues, setValue]);

    // Handle player selection change
    const handlePlayerChange = (selectedOptions) => {
        setSelectedPlayers(selectedOptions);
        setValue('players', selectedOptions.map(option => option.value));
    };

    // Convert players to the format required by react-select
    const playerOptions = players.map(player => ({
        value: player._id,
        label: `${player.name} ${player.lastname}`
    }));

    return (
        <div className="space-y-4">
            <CardHeader>
                <CardTitle>Individual Training Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Session Title</Label>
                    <Input
                        id="title"
                        name="title"
                        {...register("title")}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input
                            id="startTime"
                            name="startTime"
                            type="datetime-local"
                            {...register("startTime")}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="endTime">End Time</Label>
                        <Input
                            id="endTime"
                            name="endTime"
                            type="datetime-local"
                            {...register("endTime")}
                        />
                    </div>
                </div>

                <div className='flex space-x-4'>
                    <div className="space-y-2 w-1/3">
                        <Label htmlFor="trainingType">Training Type</Label>
                        <SelectUI
                            id="trainingType"
                            onValueChange={(value) => setValue("trainingType", value)}
                            defaultValue={initialValues?.trainingType}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select training type"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="strength">Strength Training</SelectItem>
                                <SelectItem value="conditioning">Conditioning</SelectItem>
                                <SelectItem value="skills">Skills Development</SelectItem>
                                <SelectItem value="recovery">Recovery Session</SelectItem>
                            </SelectContent>
                        </SelectUI>
                    </div>
                    <div className="space-y-2 w-2/3">
                        <Label htmlFor="venue">Venue</Label>
                        <SelectUI
                            onValueChange={(value) => setValue("venue", value)}
                            defaultValue={initialValues?.venue._id}
                        >
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
                        </SelectUI>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="players">Players</Label>
                    <Select
                        isMulti
                        options={playerOptions}
                        value={selectedPlayers}
                        onChange={handlePlayerChange}
                        placeholder="Select players..."
                    />
                </div>
            </CardContent>
        </div>
    );
}

export default IndividualTrainingForm;