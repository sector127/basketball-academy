'use client'

import {CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import React, {useEffect, useState} from "react";
import {Select as SelectUI, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {formatDateTime} from "@/hooks/use-dateTime";
import Select from 'react-select'


const PracticeForm = ({register, setValue, initialValues}) => {
    const [venues, setVenues] = useState([])
    const [teams, setTeams] = useState([])
    const [selectedTeam, setSelectedTeam] = useState()

    useEffect(() => {
            if (initialValues) {

                setValue('title', initialValues.title)
                setValue('startTime', formatDateTime(initialValues.startTime))
                setValue('endTime', formatDateTime(initialValues.endTime))
                setValue('focusAreas', initialValues.focusAreas)
                setValue('venue', initialValues?.venue?._id)
                setValue('equipmentNeeded', initialValues.equipmentNeeded)
                setSelectedTeam({
                    value: initialValues?.team._id,
                    label: initialValues?.team.name
                } || [])
            } else {
                setValue('title', '')
                setValue('startTime', '')
                setValue('endTime', '')
                setValue('focusAreas', '')
                setValue('venue', '')
                setValue('equipmentNeeded', '')
                setTeams([])
            }
        }, [initialValues, setValue]
    )

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const response = await fetch('/api/admin/teams');
                const data = await response.json();
                setTeams(data || []);
            } catch (error) {
                console.error('Error fetching team:', error);
            }
        };
        fetchTeams();
    }, []);


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

    const handleTeamChange = (selectedOptions) => {
        setSelectedTeam(selectedOptions);
        console.log(selectedOptions)
        setValue('team', selectedOptions.value);
    };

    const teamOptions = teams.map(team => ({
        value: team._id,
        label: team.name
    }));

    return (
        <div className="space-y-4">
            <CardHeader>
                <CardTitle>Practice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Practice Title</Label>
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

                <div className="space-y-2">
                    <Label htmlFor="focusAreas">Focus Areas</Label>
                    <Textarea
                        id="focusAreas"
                        name="focusAreas"
                        {...register("focusAreas")}
                        placeholder="Main areas of focus for this practice..."
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="venue">Venue</Label>
                    <SelectUI onValueChange={(value) => setValue("venue", value)}
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
                    </SelectUI>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="players">Team</Label>
                    <Select
                        options={teamOptions}
                        value={selectedTeam}
                        onChange={handleTeamChange}
                        placeholder="Select team..."
                    />
                </div>
            </CardContent>
        </div>
    );
}

export default PracticeForm;