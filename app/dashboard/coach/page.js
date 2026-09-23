'use client';

import React from 'react';
import {useTranslations} from "next-intl";
import DashboardLayout from "@/components/DashboardLayout";

const Dashboard = () => {
    const t = useTranslations("Dashboard");
    return (

        <DashboardLayout>
            <h1 className="text-3xl font-bold mb-8">{t('home')}</h1>
            <p>{t('subtitle')}</p>
        </DashboardLayout>
    );
};

export default Dashboard;