import React, {forwardRef} from 'react';

const Card = forwardRef(function Card({title, description, onClick}, ref) {
    return (
        <div
            ref={ref}
            onClick={onClick}
            className="flex transition-all duration-300 text-gray-700 dark:text-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 bg-white hover:shadow-md rounded-lg p-6 mb-4 w-56 h-64 cursor-pointer items-center flex-col justify-between hover:text-black">
            <h2 className="text-8xl font-semibold mb-2">{title}</h2>
            <p className="text-gray-700 dark:text-slate-50">{description}</p>
        </div>
    );
});

// Add display name explicitly
Card.displayName = 'Card';

export default Card;