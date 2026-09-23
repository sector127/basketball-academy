import React, {useState, useRef, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Play, Pause, SkipForward, SkipBack, Info} from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Slider} from "@/components/ui/slider";
import {ScrollArea} from "@/components/ui/scroll-area";

const BasketballPlaysVisualizer = ({combination}) => {
    const [currentPlay, setCurrentPlay] = useState(combination || {});
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [animationSpeed, setAnimationSpeed] = useState(2);
    const [courtDimensions, setCourtDimensions] = useState({width: 0, height: 0});
    const courtRef = useRef(null);
    const playIntervalRef = useRef(null);

    useEffect(() => {
        setCurrentPlay(combination);
    }, [combination]);

    // Update court dimensions on resize
    useEffect(() => {
        const updateCourtDimensions = () => {
            if (courtRef.current) {
                setCourtDimensions({
                    width: courtRef.current.offsetWidth,
                    height: courtRef.current.offsetHeight
                });
            }
        };

        updateCourtDimensions();
        window.addEventListener('resize', updateCourtDimensions);

        return () => window.removeEventListener('resize', updateCourtDimensions);
    }, []);

    // Start automatic playback
    const startPlayback = () => {
        if (currentStep >= currentPlay.steps.length - 1) {
            setCurrentStep(0);
        }

        setIsPlaying(true);
        playIntervalRef.current = setInterval(() => {
            setCurrentStep(prev => {
                if (prev >= currentPlay.steps.length - 1) {
                    clearInterval(playIntervalRef.current);
                    setIsPlaying(false);
                    return prev;
                }
                return prev + 1;
            });
        }, 3000 / animationSpeed);
    };

    // Pause playback
    const pausePlayback = () => {
        clearInterval(playIntervalRef.current);
        setIsPlaying(false);
    };

    // Step forward
    const stepForward = () => {
        if (currentStep < currentPlay.steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    // Step backward
    const stepBackward = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    // Clean up interval on unmount
    useEffect(() => {
        return () => {
            if (playIntervalRef.current) {
                clearInterval(playIntervalRef.current);
            }
        };
    }, []);

    // Get current and previous step data
    const currentStepData = currentPlay.steps && currentPlay.steps[currentStep];
    const prevStepData = currentStep > 0 && currentPlay.steps ? currentPlay.steps[currentStep - 1] : null;

    // Function to ensure players stay within court bounds (10% margin from edges)
    const ensureWithinBounds = (position) => {
        const x = Math.max(10, Math.min(90, position.x));
        const y = Math.max(10, Math.min(90, position.y));
        return {x, y};
    };

    return (
        <Card className="w-full h-full bg-white overflow-hidden border-0 shadow-none">
            <CardHeader className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-4">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-2xl font-bold">{currentPlay.name || "Basketball Play"}</CardTitle>
                        <CardDescription className="text-blue-100 mt-1 font-medium">
                            {currentPlay.description}
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-blue-600 text-white border-blue-400 px-3 py-1">
                        {currentPlay.category || "Offensive Play"}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row">
                    {/* Basketball court visualization */}
                    <div className="flex flex-col w-full lg:w-3/5 p-6">
                        <div
                            className="relative w-full h-96 bg-amber-50 border-2 border-amber-300 rounded-md shadow-inner"
                            ref={courtRef}>
                            {/* Court markings */}
                            <div className="absolute inset-2">
                                {/* Baseline (bottom) */}
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-800"></div>

                                {/* Sidelines */}
                                <div className="absolute left-0 h-full w-0.5 bg-amber-800"></div>
                                <div className="absolute right-0 h-full w-0.5 bg-amber-800"></div>

                                {/* Three-point line (semi-circle) */}
                                <div
                                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-96 h-48 border-t-2 border-l-2 border-r-2 rounded-t-full border-amber-800"></div>

                                {/* Free-throw line */}
                                <div
                                    className="absolute bottom-24 left-1/2 transform -translate-x-1/2 w-40 h-0.5 bg-amber-800"></div>

                                {/* Free-throw semi-circle */}
                                <div
                                    className="absolute bottom-24 left-1/2 transform -translate-x-1/2 w-24 h-12 border-2 rounded-t-full border-amber-800"></div>

                                {/* Paint/Key */}
                                <div
                                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-40 h-40 border-t-2 border-l-2 border-r-2 border-amber-800"></div>

                                {/* Basket */}
                                <div
                                    className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-amber-800 rounded-md"></div>
                                <div
                                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full border-2 border-amber-800"></div>

                                {/* Half-court line */}
                                <div className="absolute top-0 left-0 w-full h-0.5 bg-amber-800"></div>

                                {/* Center circle (partial) */}
                                <div
                                    className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-16 border-2 rounded-b-full border-amber-800"></div>
                            </div>

                            {/* Players */}
                            <AnimatePresence>
                                {currentStepData && (
                                    <>
                                        {/* Our team players */}
                                        {currentStepData.playerPositions.ourTeam.map((player) => {
                                            const prevPlayers = prevStepData?.playerPositions.ourTeam;
                                            const boundedPosition = ensureWithinBounds(player);
                                            const prevPlayer = prevPlayers ? prevPlayers.find(p => p.id === player.id) : null;
                                            const prevBounded = prevPlayer ? ensureWithinBounds(prevPlayer) : boundedPosition;

                                            return (
                                                <TooltipProvider key={`our-${player.id}`}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <motion.div
                                                                className="absolute flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white font-bold shadow-lg z-10 border-2 border-white"
                                                                initial={{
                                                                    left: `${prevBounded.x}%`,
                                                                    top: `${prevBounded.y}%`,
                                                                    x: '-50%',
                                                                    y: '-50%'
                                                                }}
                                                                animate={{
                                                                    left: `${boundedPosition.x}%`,
                                                                    top: `${boundedPosition.y}%`,
                                                                    x: '-50%',
                                                                    y: '-50%'
                                                                }}
                                                                transition={{
                                                                    type: "spring",
                                                                    damping: 20,
                                                                    stiffness: 100,
                                                                    duration: 0.8
                                                                }}
                                                            >
                                                                {player.id}
                                                                {player.hasBall && (
                                                                    <div
                                                                        className="absolute -right-1 -top-1 w-5 h-5 bg-orange-500 rounded-full border-2 border-white"></div>
                                                                )}
                                                            </motion.div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="font-medium">Player {player.id}</p>
                                                            <p className="text-xs">{player.position || "Position N/A"}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            );
                                        })}

                                        {/* Opponent team players */}
                                        {currentStepData.playerPositions.opponents.map((player) => {
                                            const prevPlayers = prevStepData?.playerPositions.opponents;
                                            const boundedPosition = ensureWithinBounds(player);
                                            const prevPlayer = prevPlayers ? prevPlayers.find(p => p.id === player.id) : null;
                                            const prevBounded = prevPlayer ? ensureWithinBounds(prevPlayer) : boundedPosition;

                                            return (
                                                <TooltipProvider key={`opp-${player.id}`}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <motion.div
                                                                className="absolute flex items-center justify-center w-12 h-12 rounded-full bg-red-600 text-white font-bold shadow-lg z-10 border-2 border-white"
                                                                initial={{
                                                                    left: `${prevBounded.x}%`,
                                                                    top: `${prevBounded.y}%`,
                                                                    x: '-50%',
                                                                    y: '-50%'
                                                                }}
                                                                animate={{
                                                                    left: `${boundedPosition.x}%`,
                                                                    top: `${boundedPosition.y}%`,
                                                                    x: '-50%',
                                                                    y: '-50%'
                                                                }}
                                                                transition={{
                                                                    type: "spring",
                                                                    damping: 20,
                                                                    stiffness: 100,
                                                                    duration: 0.8
                                                                }}
                                                            >
                                                                {player.id}
                                                            </motion.div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="font-medium">Defender {player.id}</p>
                                                            <p className="text-xs">{player.position || "Position N/A"}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            );
                                        })}

                                        {/* Ball movement */}
                                        {currentStepData.ballMovement && (
                                            <motion.div
                                                className="absolute w-6 h-6 bg-orange-500 rounded-full shadow-md z-20 border-2 border-white"
                                                initial={{
                                                    left: `${currentStepData.ballMovement.from.x}%`,
                                                    top: `${currentStepData.ballMovement.from.y}%`,
                                                    x: '-50%',
                                                    y: '-50%'
                                                }}
                                                animate={[
                                                    ...(currentStepData.ballMovement.through?.map(point => ({
                                                        left: `${point.x}%`,
                                                        top: `${point.y}%`,
                                                        x: '-50%',
                                                        y: '-50%',
                                                        scale: 1.2
                                                    })) || []),
                                                    {
                                                        left: `${currentStepData.ballMovement.to.x}%`,
                                                        top: `${currentStepData.ballMovement.to.y}%`,
                                                        x: '-50%',
                                                        y: '-50%',
                                                        scale: 1
                                                    }
                                                ]}
                                                transition={{
                                                    duration: 1.2,
                                                    ease: "easeInOut"
                                                }}
                                            />
                                        )}
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Playbook sidebar */}
                    <div className="w-full lg:w-2/5 lg:border-l lg:border-gray-200">
                        <div className="p-4">
                            <h3 className="text-lg font-semibold mb-3 text-blue-800">Complete Play Sequence</h3>
                            <ScrollArea className="h-96 rounded-md border p-2">
                                {currentPlay.steps && currentPlay.steps.map((step, stepIndex) => (
                                    <div
                                        key={step.id}
                                        className={`mb-3 p-3 rounded-md transition-all duration-300 cursor-pointer hover:bg-blue-50 ${
                                            stepIndex === currentStep
                                                ? 'bg-blue-100 border-l-4 border-blue-600 shadow-sm'
                                                : 'border border-gray-200'
                                        }`}
                                        onClick={() => setCurrentStep(stepIndex)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Badge variant={stepIndex === currentStep ? "default" : "outline"}
                                                   className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                                                {stepIndex + 1}
                                            </Badge>
                                            <h5 className={`font-medium ${
                                                stepIndex === currentStep ? 'text-blue-800' : 'text-gray-700'
                                            }`}>
                                                {step.description}
                                            </h5>
                                        </div>
                                        {stepIndex === currentStep && (
                                            <ul className="list-disc pl-8 mt-2 space-y-1 text-gray-700 text-sm">
                                                {step.annotations.map((annotation, idx) => (
                                                    <li key={idx}>{annotation}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </ScrollArea>
                        </div>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span
                            className="text-sm font-medium text-gray-700">Step {currentStep + 1} of {currentPlay.steps ? currentPlay.steps.length : 0}</span>
                        <div className="h-5 w-px bg-gray-300"></div>
                        <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-700 mr-2">Speed:</span>
                            <Slider
                                value={[animationSpeed]}
                                min={1}
                                max={4}
                                step={1}
                                onValueChange={(values) => setAnimationSpeed(values[0])}
                                className="w-24"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-center space-x-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={stepBackward}
                            disabled={currentStep <= 0}
                            className="h-8 w-8"
                        >
                            <SkipBack size={16}/>
                        </Button>

                        <Button
                            variant={isPlaying ? "secondary" : "default"}
                            size="icon"
                            onClick={isPlaying ? pausePlayback : startPlayback}
                            className="h-10 w-10 rounded-full"
                        >
                            {isPlaying ? <Pause size={20}/> : <Play size={20}/>}
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={stepForward}
                            disabled={!currentPlay.steps || currentStep >= currentPlay.steps.length - 1}
                            className="h-8 w-8"
                        >
                            <SkipForward size={16}/>
                        </Button>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
};

export default BasketballPlaysVisualizer;