"use client";

import {useTheme} from "next-themes";
import {MdOutlineLightMode, MdOutlineDarkMode} from "react-icons/md";
import {Button} from "@/components/ui/button";

export default function ThemeToggle() {
    const {theme, setTheme} = useTheme();

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    }

    return (
        <Button
            onClick={toggleTheme}
            variant="outline"
            className="bg-gray-200 dark:bg-gray-800 w-auto"
        >
            <span>
            {theme === "dark" ? <MdOutlineLightMode/> : <MdOutlineDarkMode/>}
            </span>
        </Button>
    );
}