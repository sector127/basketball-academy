"use client";

import React, {useEffect} from "react";
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {usePathname} from "next/navigation";
import Link from "next/link";

const fetchLabel = async (segment, path) => {
    // Extract collection name from the path
    const pathParts = path.split('/').filter(part => part);
    const segmentIndex = pathParts.findIndex(part => part === segment);
    const collectionName = segmentIndex > 0 ? pathParts[segmentIndex - 1] : "";

    try {
        // Pass collection name as a query parameter
        const response = await fetch(`/api/getLabel/${segment}?collection=${collectionName}`);

        if (!response.ok) {
            console.warn(`Failed to fetch label for ${segment}: ${response.status}`);
            return segment;
        }

        const data = await response.json();
        return data.label || segment;
    } catch (error) {
        console.error(`Error fetching label for ${segment}:`, error);
        return segment;
    }
}

const Breadcrumbs = () => {
    const pathname = usePathname();
    const pathSegments = pathname.split("/").filter((segment) => segment);
    const [labels, setLabels] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);

    useEffect(() => {
        const fetchLabels = async () => {
            setIsLoading(true);
            try {
                const newLabels = await Promise.all(
                    pathSegments.map(async (segment, index) => {
                        // Check if the segment is a MongoDB ObjectId
                        if (/^[0-9a-fA-F]{24}$/.test(segment)) {
                            // Pass the current path to extract collection context
                            const path = `/${pathSegments.slice(0, index + 1).join("/")}`;
                            return await fetchLabel(segment, path);
                        }
                        return segment.charAt(0).toUpperCase() + segment.slice(1);
                    })
                );
                setLabels(newLabels);
            } catch (error) {
                console.error("Error in fetchLabels:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLabels();
    }, [pathname]);

    const breadcrumbs = pathSegments.map((segment, index) => {
        const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
        const capitalSegment = segment.charAt(0).toUpperCase() + segment.slice(1);
        return {
            label: labels[index] || capitalSegment,
            href,
        };
    });

    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link href="/">Home</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbs.map((breadcrumb, index) => (
                    <React.Fragment key={breadcrumb.href}>
                        <BreadcrumbSeparator/>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                {index === breadcrumbs.length - 1 ? (
                                    <Link className="text-black font-bold" href={breadcrumb.href}>
                                        {isLoading && /^[0-9a-fA-F]{24}$/.test(pathSegments[index])
                                            ? "Loading..."
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