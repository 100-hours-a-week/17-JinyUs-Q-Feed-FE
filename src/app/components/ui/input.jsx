import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex h-[48px] w-full min-w-0 rounded-[12px] border border-[#EEEEEE] px-4 py-[14px] text-[15px] bg-[#FAFAFA] transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
                "focus-visible:border-[#FF8FA3] focus-visible:ring-[#FFE4E9] focus-visible:ring-[3px] focus-visible:shadow-none",
                "aria-invalid:ring-[#FFEBEE] aria-invalid:border-[#F44336] dark:aria-invalid:ring-destructive/40",
                className,
            )}
            {...props}
        />
    );
}

export { Input };
