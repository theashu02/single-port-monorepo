import { toast } from "sonner";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { motion } from "framer-motion";

type ToastType = "success" | "error" | "warning" | "info";

export const customToast = (message: string, type: ToastType = "success", description?: string) => {
  return toast.custom((t) => {
    const config = {
      success: {
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
      },
      error: {
        icon: <XCircle className="w-5 h-5 text-destructive" />,
        bg: "bg-destructive/10",
        border: "border-destructive/20",
      },
      warning: {
        icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
      },
      info: {
        icon: <Info className="w-5 h-5 text-blue-500" />,
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
      },
    };

    const { icon, bg, border } = config[type];

    return (
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`relative flex w-fit min-w-[300px] max-w-[400px] items-center gap-3 rounded-full border ${border} bg-background/80 py-2.5 pl-3 pr-2 shadow-2xl backdrop-blur-xl`}
      >
        {/* Icon Container */}
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bg}`}>
          {icon}
        </div>

        {/* Text Content */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{message}</p>
          {description && (
            <p className="text-[10px] text-muted-foreground leading-none opacity-80 truncate">
              {description}
            </p>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => toast.dismiss(t)}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-muted transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {/* Subtle Bottom Glow */}
        <div className="absolute -bottom-px left-1/2 -translate-x-1/2 w-1/2 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />
      </motion.div>
    );
  }, {
    duration: 2000,
  });
};