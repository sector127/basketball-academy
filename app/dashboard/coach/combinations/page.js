'use client'

import DashboardLayout from "@/components/DashboardLayout";
import BasketballPlaysVisualizer from "@/components/BasketballPlaysVisualizer";
import {combinations} from "@/lib/combinationsCheatSheet";
import React, {useState} from "react";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import Image from "next/image";
import {Button} from "@/components/ui/button";
import {motion} from "framer-motion";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";

export default function CombinationsPage() {
    const [combination, setCombination] = useState(combinations[0]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleCombinationSelection = (combination) => {
        setCombination(combination);
        setIsDialogOpen(true);
    }

    return (
        <DashboardLayout>
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5}}
            >
                <div className="container mx-auto py-6">
                    <div className='flex justify-between items-center'>
                        <h1 className="text-3xl font-bold mb-8">Combinations</h1>
                        <Button variant='default'>Add Combination</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {combinations.length > 0 ? (
                                combinations.map((combination, index) => (
                                    <motion.div key={index} whileHover={{scale: 1.05}} whileTap={{scale: 0.95}}>
                                        <Card
                                            className="h-full hover:shadow-md transition-shadow duration-300 border-2 hover:border-primary/20"
                                            key={index}>
                                            <CardHeader>
                                                <CardTitle>
                                                    {combination.name}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="flex items-center justify-center">
                                                <Image
                                                    src="/assets/images/logo.png"
                                                    alt="BBA-logo"
                                                    width={150}
                                                    height={150}
                                                    className="object-contain transition-all duration-700"
                                                    priority
                                                />
                                            </CardContent>
                                            <CardFooter className='flex justify-end'>
                                                <Button variant='default'
                                                        onClick={() => handleCombinationSelection(combination)}>Detailed</Button>
                                            </CardFooter>
                                        </Card>
                                    </motion.div>
                                ))
                            )
                            : (
                                <p>No combinations found</p>
                            )}
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogContent className="max-w-6xl h-[90vh] overflow-auto">
                            <DialogHeader>
                                <DialogTitle></DialogTitle>
                            </DialogHeader>
                            <BasketballPlaysVisualizer combination={combination}/>
                        </DialogContent>
                    </Dialog>
                </div>
            </motion.div>
        </DashboardLayout>
    )
}