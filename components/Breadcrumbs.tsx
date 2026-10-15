'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface LabelApiResponse {
  label?: string;
}

const fetchLabel = async (segment: string, path: string): Promise<string> => {
  // Extract collection name from the path
  const pathParts = path.split('/').filter(Boolean);
  const segmentIndex = pathParts.findIndex((part) => part === segment);
  const collectionName = segmentIndex > 0 ? pathParts[segmentIndex - 1] : '';

  try {
    // Pass collection name as a query parameter
    const response = await fetch(`/api/getLabel/${segment}?collection=${collectionName}`);

    if (!response.ok) {
      console.warn(`Failed to fetch label for ${segment}: ${response.status}`);
      return segment;
    }

    const data = (await response.json()) as LabelApiResponse;
    return data.label || segment;
  } catch (error: unknown) {
    console.error(`Error fetching label for ${segment}:`, error);
    return segment;
  }
};

const Breadcrumbs: React.FC = () => {
  const t = useTranslations('Breadcrumbs');
  const pathname = usePathname();
  const [labels, setLabels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const pathSegments = useMemo(() => pathname.split('/').filter(Boolean), [pathname]);

  useEffect(() => {
    const fetchLabels = async () => {
      setIsLoading(true);
      try {
        const newLabels = await Promise.all(
          pathSegments.map(async (segment, index) => {
            // Check if the segment is a MongoDB ObjectId
            if (/^[0-9a-fA-F]{24}$/.test(segment)) {
              // Pass the current path to extract collection context
              const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
              return await fetchLabel(segment, path);
            }
            return segment.charAt(0).toUpperCase() + segment.slice(1);
          })
        );
        setLabels(newLabels);
      } catch (error: unknown) {
        console.error('Error in fetchLabels:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLabels();
  }, [pathname, pathSegments]);

  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(segment);
    const segmentKey = segment.toLowerCase();
    const translatedSegment = !isObjectId && t.has(segmentKey) ? t(segmentKey) : null;
    const capitalSegment = segment.charAt(0).toUpperCase() + segment.slice(1);
    return {
      label: labels[index] || translatedSegment || capitalSegment,
      href,
    };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">{t.has('home') ? t('home') : 'Home'}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbs.map((breadcrumb, index) => (
          <React.Fragment key={breadcrumb.href}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                {index === breadcrumbs.length - 1 ? (
                  <Link className="text-slate-900 dark:text-slate-100 font-bold" href={breadcrumb.href}>
                    {isLoading && /^[0-9a-fA-F]{24}$/.test(pathSegments[index])
                      ? t.has('loading')
                        ? t('loading')
                        : 'Loading...'
                      : breadcrumb.label}
                  </Link>
                ) : (
                  <Link href={breadcrumb.href}>{breadcrumb.label}</Link>
                )}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default Breadcrumbs;
