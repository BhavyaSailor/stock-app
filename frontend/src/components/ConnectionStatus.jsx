import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";

function ConnectionStatus({ connected }) {
  return (
    <Badge
      variant={connected ? "default" : "destructive"}
      className="gap-1.5"
    >
      {connected ? (
        <>
          <Wifi className="h-3.5 w-3.5" />
          Connected
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          Disconnected
        </>
      )}
    </Badge>
  );
}

export default ConnectionStatus;