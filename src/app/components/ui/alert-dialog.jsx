import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

import { cn } from "./utils";
import { buttonVariants } from "./button-variants";

function AlertDialog({
    ...props
}) {
    return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger({
    ...props
}) {
    return (
        <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
    );
}

function AlertDialogPortal({
    ...props
}) {
    return (
        <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
    );
}

const AlertDialogOverlay = React.forwardRef(({ className, ...props }, ref) => {
    return (
        <AlertDialogPrimitive.Overlay
            ref={ref}
            data-slot="alert-dialog-overlay"
            className={cn(
                "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
                className,
            )}
            {...props}
        />
    );
});
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

function AlertDialogContent({
    className,
    ...props
}) {
    return (
        <AlertDialogPortal>
            <AlertDialogOverlay />
            <AlertDialogPrimitive.Content
                data-slot="alert-dialog-content"
                className={cn(
                    "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 grid w-[calc(100%-12px)] max-w-[calc(32rem-12px)] gap-4 rounded-lg border p-6 shadow-lg duration-200",
                    className,
                )}
                {...props}
            />
        </AlertDialogPortal>
    );
}

function AlertDialogHeader({
    className,
    ...props
}) {
    return (
        <div
            data-slot="alert-dialog-header"
            className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
            {...props}
        />
    );
}

function AlertDialogFooter({
    className,
    ...props
}) {
    return (
        <div
            data-slot="alert-dialog-footer"
            className={cn(
                "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
                className,
            )}
            {...props}
        />
    );
}

function AlertDialogTitle({
    className,
    ...props
}) {
    return (
        <AlertDialogPrimitive.Title
            data-slot="alert-dialog-title"
            className={cn("text-lg font-semibold", className)}
            {...props}
        />
    );
}

function AlertDialogDescription({
    className,
    ...props
}) {
    return (
        <AlertDialogPrimitive.Description
            data-slot="alert-dialog-description"
            className={cn("text-muted-foreground text-sm", className)}
            {...props}
        />
    );
}

function AlertDialogAction({
    className,
    ...props
}) {
    return (
        <AlertDialogPrimitive.Action
            className={cn(buttonVariants(), className)}
            {...props}
        />
    );
}

function AlertDialogCancel({
    className,
    ...props
}) {
    return (
        <AlertDialogPrimitive.Cancel
            className={cn(buttonVariants({ variant: "outline" }), className)}
            {...props}
        />
    );
}

export {
    AlertDialog,
    AlertDialogPortal,
    AlertDialogOverlay,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
};
