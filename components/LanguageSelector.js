"use client";

import {useEffect, useState} from "react";
import {useTranslations} from "next-intl";
import {getUserLocale, setUserLocale} from "@/i18n/services";
import {Button} from "@/components/ui/button";

const LANGUAGES = [
    {
        value: "en",
        flag: "🇬🇧",
        label: "English",
    },
    {
        value: "ka",
        flag: "🇬🇪",
        label: "Georgian",
    },
];

export default function LanguageSelector() {
    const t = useTranslations("LanguageSelector");
    const [currentLocale, setCurrentLocale] = useState(null);

    useEffect(() => {
        getUserLocale().then(setCurrentLocale);
    }, []);

    const changeLanguage = (newLocale) => {
        const typedLocale = newLocale;
        setUserLocale(typedLocale);
        setCurrentLocale(typedLocale);
    };

    if (!currentLocale) return null;

    return (
        <div>
            {LANGUAGES.map((lang) => (
                lang.value !== currentLocale && (
                    <Button
                        key={lang.value}
                        variant="outline"
                        onClick={() => changeLanguage(lang.value)}
                        aria-label={lang.label}
                        className="bg-gray-200 dark:bg-gray-800"
                    >
                        <span>{lang.flag}</span>
                    </Button>
                )
            ))}
        </div>
    );
}