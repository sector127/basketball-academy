'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface EntityMeta {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
}

interface EntityCardProps {
  title: string;
  subtitle?: string;
  image?: string;
  badge?: string;
  meta?: EntityMeta[];
  href?: string;
  onClick?: () => void;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function EntityCard({
  title,
  subtitle,
  image,
  badge,
  meta,
  href,
  onClick,
  actions,
  className,
  children,
}: EntityCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 h-full',
        'hover:-translate-y-1 hover:border-amber-500/30 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-amber-500/20',
        (href || onClick) && 'cursor-pointer',
        className
      )}
    >
      {/* Top section: Badge + Media Preview */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
              {href ? (
                <Link
                  href={href}
                  className="focus:outline-none"
                  tabIndex={actions ? -1 : 0}
                >
                  <span className="absolute inset-0" aria-hidden="true" />
                  {title}
                </Link>
              ) : (
                title
              )}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {subtitle}
              </p>
            )}
          </div>

          {badge && (
            <Badge
              variant="outline"
              className="relative z-10 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[11px] font-semibold px-2 py-0.5 shrink-0"
            >
              {badge}
            </Badge>
          )}
        </div>

        {/* Media / Image area */}
        {image && (
          <div className="relative my-3 h-36 w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}

        {/* Metadata items */}
        {meta && meta.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            {meta.map((item, idx) => (
              <div key={idx} className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  {item.icon && <item.icon className="h-3 w-3" />}
                  {item.label}
                </span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate mt-0.5">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {children && <div className="relative z-10">{children}</div>}
      </div>

      {/* Actions footer */}
      {actions && (
        <div className="relative z-10 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
