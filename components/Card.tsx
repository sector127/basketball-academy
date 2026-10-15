import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface DashboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}

const Card = forwardRef<HTMLDivElement, DashboardCardProps>(function Card(
  { title, description, onClick, className, children, badge, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      onClick={onClick}
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300',
        'hover:-translate-y-1 hover:border-amber-500/30 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-amber-500/20 cursor-pointer min-h-[160px]',
        className
      )}
      {...props}
    >
      <div>
        {badge && (
          <span className="inline-block px-2.5 py-0.5 mb-2 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            {badge}
          </span>
        )}
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors mb-1.5">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
