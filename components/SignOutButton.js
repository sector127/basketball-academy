import {signOut} from "next-auth/react";
import {useTranslations} from "next-intl";

const SignOutButton = () => {
    const t = useTranslations("Dashboard");

    const handleSignOut = async () => {
        await signOut({redirectTo: "/login",}); // Redirect to sign-in page after sign-out
    };

    return (
        <button onClick={handleSignOut} className='cursor-pointer text-black dark:text-slate-50'>
            {t("signOut")}
        </button>
    );
};

export default SignOutButton;