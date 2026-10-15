'use client';
import React from 'react';

export interface CoachCardProps {
  name: string;
  lastname: string;
  position: string;
}

const CoachCard: React.FC<CoachCardProps> = ({ name, lastname, position }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-4">
      <h2 className="text-xl font-semibold mb-2">Name: {name}</h2>
      <h2 className="text-xl font-semibold mb-2">Last name: {lastname}</h2>
      <p className="text-gray-700">{position}</p>
    </div>
  );
};

export default CoachCard;
