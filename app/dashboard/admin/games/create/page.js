import GameForm from '@/components/GameForm';
import DashboardLayout from "@/components/DashboardLayout";

export default function CreateGamePage() {
    return (
        <div>
            <DashboardLayout>
                <h1 className="text-3xl font-bold text-center my-6">Create a New Game</h1>
                <GameForm/>
            </DashboardLayout>
        </div>
    );
}