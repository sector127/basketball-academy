'use client'

import React, {useEffect, useState} from "react";
import {CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

export default function TeamAddEditForm({register, setValue, initialValues}) {
    const [coaches, setCoaches] = useState([])

    useEffect(() => {
        const fetchCoaches = async () => {
            try {
                const response = await fetch('/api/admin/coaches');
                const data = await response.json();
                setCoaches(data || []);
            } catch (error) {
                console.error('Error fetching coach:', error);
            }
        };
        fetchCoaches();
    }, [])

    useEffect(() => {
        if (initialValues) {
            setValue('name', initialValues.name)
            setValue('description', initialValues.description)
            setValue('coach', initialValues?.coach)
        } else {
            setValue('name', '')
            setValue('description', '')
            setValue('coach', '')
        }
    }, [initialValues, setValue])

    return (
        <div className='space-y-4'>
            <CardHeader>
                <CardTitle>Team Details</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
                <div className='space-y-2'>
                    <Label htmlFor='name'>Team Name</Label>
                    <Input name='name' id='name' {...register('name')} />
                </div>

                <div className='space-y-2'>
                    <Label htmlFor='description'>Description</Label>
                    <Input name='description' id='description' {...register('description')} />
                </div>

                <div className='space-y-2'>
                    <Label htmlFor='coach'>Coach</Label>
                    <Select onValueChange={(value) => setValue("coach", value)}
                            defaultValue={initialValues?.coach}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select coach"/>
                        </SelectTrigger>
                        <SelectContent>
                            {coaches.map((coach) => (
                                <SelectItem key={coach._id} value={coach._id}>
                                    {coach.name} {coach.lastName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </div>
    );
}