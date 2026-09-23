'use client';

import React, {useState, useEffect} from 'react';
import {Calendar, momentLocalizer} from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import EventForm from '@/components/EventForm';
import DashboardLayout from "@/components/DashboardLayout";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {AlertCircle, MapPin, Clock, Users, Plus} from 'lucide-react';
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";

const localizer = momentLocalizer(moment);


// Map Tailwind CSS color classes to their corresponding hex values
const EventTypeColors = {
    game: "#3b82f6", // bg-blue-500
    individualTraining: "#22c55e", // bg-green-500
    practice: "#a855f7", // bg-purple-500
    other: "#6b7280" // bg-gray-500
};

const CalendarPage = () => {
    const [events, setEvents] = useState([]);
    const [isAddingEvent, setIsAddingEvent] = useState(false);
    const [isEditingEvent, setIsEditingEvent] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/admin/events');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const formattedEvents = data.map(event => ({
                ...event,
                start: new Date(event.startTime),
                end: new Date(event.endTime),
            }));
            setEvents(formattedEvents);
        } catch (error) {
            setError("Failed to load events. Please try again later.");
            console.error("Failed to fetch events:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEventCreated = (newEvent) => {
        fetchEvents();
        setIsAddingEvent(false);
    };

    const handleEditEvent = (event) => {
        setSelectedEvent(event);
        setIsEditingEvent(true);
    };

    const eventStyleGetter = (event) => {
        const style = {
            backgroundColor: EventTypeColors[event.eventType] || '#806b6b',
            borderRadius: '4px',
            border: 'none',
            color: 'white',
            padding: '2px 5px',
            fontSize: '0.875rem', // text-sm
            fontWeight: '500', // font-medium
        };
        return {style};
    };

    const formatEventType = (str) => {
        return str
            .replace(/([A-Z])/g, ' $1') // Add a space before uppercase letters
            .replace(/^./, (match) => match.toUpperCase()); // Capitalize the first letter
    };


    const EventDetails = ({event}) => (
        <Card className="mt-4">
            <CardContent className="pt-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold">{event.title}</h3>
                        <Badge variant="outline"
                               style={{backgroundColor: EventTypeColors[event.eventType], color: 'white'}}>
                            {formatEventType(event.eventType)}
                        </Badge>
                    </div>

                    {event.description && (
                        <p className="text-gray-600">{event.description}</p>
                    )}

                    <div className="grid gap-3">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500"/>
                            <span>
                                {moment(event.start).format('MMM D, YYYY h:mm A')} -
                                {moment(event.end).format('h:mm A')}
                            </span>
                        </div>

                        {event.venue && (
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-500"/>
                                <span>{event.venue?.name}</span>
                            </div>
                        )}

                        {event.eventType === 'game' && (
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-500"/>
                                <span>vs {event.opponent}</span>
                                {event.isAwayGame && <Badge variant="outline">Away Game</Badge>}
                            </div>
                        )}
                    </div>
                    <div className='flex justify-between'>
                        <Button variant='outline' onClick={() => handleEditEvent(event)}>Edit</Button>
                        <Button variant='destructive'>Delete</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <DashboardLayout>
            <div className="container mx-auto py-6">
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Academy Calendar</h1>
                            <p className="text-gray-600">Manage your schedule and events</p>
                        </div>
                        <Button
                            onClick={() => setIsAddingEvent(true)}
                            className="gap-2"
                        >
                            <Plus className="mr-2 h-4 w-4"/>
                            <span className="hidden sm:inline">Add Event</span>
                            <span className="sm:hidden">Add</span>
                        </Button>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4"/>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Dialog open={isAddingEvent || isEditingEvent} onOpenChange={(open) => {
                        if (!open) {
                            setIsAddingEvent(false);
                            setIsEditingEvent(false);
                            setSelectedEvent(null);
                        }
                    }}>
                        <DialogContent className='w-full'>
                            <DialogHeader>
                                <DialogTitle>{selectedEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
                            </DialogHeader>
                            <EventForm
                                event={selectedEvent} // Pass event for editing
                                onEventCreated={handleEventCreated}
                                onClose={() => {
                                    setIsAddingEvent(false);
                                    setIsEditingEvent(false);
                                    setSelectedEvent(null);
                                }}
                            />
                        </DialogContent>
                    </Dialog>

                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="md:col-span-3">
                            <Card>
                                <CardContent className="p-4">
                                    <div className="h-[600px]">
                                        <Calendar
                                            localizer={localizer}
                                            events={events}
                                            startAccessor="start"
                                            endAccessor="end"
                                            titleAccessor="title"
                                            eventPropGetter={eventStyleGetter}
                                            onSelectEvent={setSelectedEvent}
                                            className={isLoading ? 'opacity-50' : ''}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="md:col-span-1">
                            <div className="space-y-4">
                                <Card>
                                    <CardContent className="p-4">
                                        <h3 className="font-semibold mb-3">Event Types</h3>
                                        <div className="space-y-2">
                                            {Object.entries(EventTypeColors).map(([type, color]) => (
                                                <div key={type} className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded" style={{backgroundColor: color}}/>
                                                    <span
                                                        className="capitalize">{type.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {selectedEvent && <EventDetails event={selectedEvent}/>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default CalendarPage;