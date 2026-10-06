import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

function PullButton({ pulling, onClick }) {
  return (
    <Button
      onClick={onClick}
      disabled={pulling}
      className="gap-2"
    >
      <RefreshCw
        className={`h-4 w-4 ${pulling ? "animate-spin" : ""}`}
      />

      {pulling ? "Pulling Trades..." : "Pull Trades"}
    </Button>
  );
}

export default PullButton;