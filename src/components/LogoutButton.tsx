import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <Button 
      onClick={handleLogout}
      variant="ghost" 
      size="sm"
      className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
    >
      <LogOut className="h-4 w-4" />
      Logout
    </Button>
  );
}
