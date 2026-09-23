import React, {useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Label} from "@/components/ui/label";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import GameForm from "@/components/GameForm";
import PracticeForm from "@/components/PracticeForm";
import IndividualTrainingForm from "@/components/IndividualTrainingForm";
import {useToast} from "@/hooks/use-toast";

const EventForm = ({event, onEventCreated, onClose}) => {
    const [step, setStep] = useState(1);
    const [eventType, setEventType] = useState(event?.eventType || '');
    const {register, handleSubmit, setValue} = useForm({
        defaultValues: event || {}
    });
    const {toast} = useToast()

    useEffect(() => {
        if (event) {
            setEventType(event.eventType);  // Set the event type from the existing event
            setStep(2);  // Skip to the form step
        }
    }, [event]);

    const handleEventTypeSelect = (type) => {
        setEventType(type);
        setStep(2);
    };


    const onSubmit = async (data) => {
        try {
            const requestOptions = {
                method: event ? 'PUT' : 'POST',  // Use PUT for edits
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({...data, eventType}),
            };

            const response = await fetch(event ? `/api/admin/events/${event._id}` : '/api/admin/events', requestOptions);
            const result = await response.json();

            if (response.ok) {
                toast({
                    title: 'Success',
                    description: `Event ${event ? 'updated' : 'created'} successfully!`,
                    variant: 'newSuccess',
                });
                onEventCreated();
                onClose();
            } else {
                toast({title: 'Error', description: result.error || 'Failed to save event', variant: 'destructive'});
            }
        } catch (error) {
            toast({title: 'Error', description: 'Server error. Try again.', variant: 'destructive'});
        }
    };

    const EventTypeSelection = () => (
        <div className="space-y-4">
            <CardHeader>
                <CardTitle>Select Event Type</CardTitle>
            </CardHeader>
            <CardContent>
                <RadioGroup
                    value={eventType}
                    onValueChange={handleEventTypeSelect}
                    className="grid grid-cols-1 gap-4 md:grid-cols-3"
                >
                    <Label
                        htmlFor="game"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                    >
                        <RadioGroupItem value="game" id="game" className="sr-only"/>
                        <span className="text-lg font-semibold">Game</span>
                    </Label>
                    <Label
                        htmlFor="practice"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                    >
                        <RadioGroupItem value="practice" id="practice" className="sr-only"/>
                        <span className="text-lg font-semibold">Practice</span>
                    </Label>
                    <Label
                        htmlFor="individualTraining"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                    >
                        <RadioGroupItem value="individualTraining" id="individualTraining" className="sr-only"/>
                        <span className="text-lg font-semibold">Individuals</span>
                    </Label>
                </RadioGroup>
            </CardContent>
        </div>
    );

    return (
        <Card className="w-full max-w-2xl mx-auto">
            {step === 1 && <EventTypeSelection/>}
            {step === 2 && (
                <form onSubmit={handleSubmit(onSubmit)}>
                    {eventType === 'game' && <GameForm register={register} setValue={setValue} initialValues={event}/>}
                    {eventType === 'practice' &&
                        <PracticeForm register={register} setValue={setValue} initialValues={event}/>}
                    {eventType === 'individualTraining' &&
                        <IndividualTrainingForm register={register} setValue={setValue} initialValues={event}/>}
                    <CardFooter className="flex justify-between">
                        {!event && <Button variant="outline" onClick={() => setStep(1)}>
                            Back
                        </Button>}
                        <div className="flex w-full gap-2 justify-end">
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {event ? 'Edit event' : 'Add event'}
                            </Button>
                        </div>
                    </CardFooter>
                </form>
            )}
        </Card>
    );
};

export default EventForm;