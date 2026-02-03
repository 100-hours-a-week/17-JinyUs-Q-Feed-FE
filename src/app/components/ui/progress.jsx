import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "./utils";

function Progress({
    className,
    value,
    ...props
}) {
    return (
        <ProgressPrimitive.Root
            data-slot="progress"
            className={cn(
                "bg-[#F5F5F5] relative h-2 w-full overflow-hidden rounded-[8px]",
                className,
            )}
            {...props}
        >
            <ProgressPrimitive.Indicator
                data-slot="progress-indicator"
                className="bg-gradient-to-r from-[#FF8FA3] to-[#FF6B8A] h-full w-full flex-1 transition-all duration-500 ease-out rounded-[8px]"
                style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
            />
        </ProgressPrimitive.Root>
    );
}

export { Progress };
