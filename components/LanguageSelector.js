"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { setUserLocale } from "@/i18n/services";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Check, Globe } from "lucide-react";

const LANGUAGES = [
  {
    value: "en",
    code: "EN",
    flag: "🇬🇧",
    label: "English",
    nativeLabel: "English",
  },
  {
    value: "ka",
    code: "KA",
    flag: "🇬🇪",
    label: "Georgian",
    nativeLabel: "ქართული",
  },
];

export default function LanguageSelector() {
  const router = useRouter();
  const activeLocale = useLocale();
  const t = useTranslations("LanguageSelector");
  const [currentLocale, setCurrentLocale] = useState(activeLocale || "en");

  useEffect(() => {
    if (activeLocale) {
      setCurrentLocale(activeLocale);
    }
  }, [activeLocale]);

  const changeLanguage = async (newLocale) => {
    if (newLocale === currentLocale) return;
    setCurrentLocale(newLocale);
    if (typeof document !== "undefined") {
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    }
    await setUserLocale(newLocale);
    router.refresh();
  };

  const activeLang = LANGUAGES.find((l) => l.value === currentLocale) || LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/80 px-2.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-100 hover:text-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          aria-label="Select Language"
        >
          <span className="text-sm leading-none">{activeLang.flag}</span>
          <span className="font-bold font-mono text-[11px] tracking-wider">{activeLang.code}</span>
          <ChevronDown className="h-3 w-3 opacity-60 text-slate-400" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-44 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {t("language") || "Language"}
        </div>
        {LANGUAGES.map((lang) => {
          const isSelected = lang.value === currentLocale;
          return (
            <DropdownMenuItem
              key={lang.value}
              onClick={() => changeLanguage(lang.value)}
              className="flex cursor-pointer items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{lang.flag}</span>
                <span>{lang.nativeLabel}</span>
              </div>
              {isSelected && <Check className="h-3.5 w-3.5 text-amber-500 stroke-[2.5]" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
