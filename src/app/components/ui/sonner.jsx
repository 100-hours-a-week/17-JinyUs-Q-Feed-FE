import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

const Toaster = ({
    position = "top-center",
    swipeDirections = ["top", "left", "right"],
    ...props
}) => {
    const { theme = "system" } = useTheme();

    return (
        <Sonner
            theme={theme}
            position={position}
            swipeDirections={swipeDirections}
            className="toaster group"
            style={
                {
                    "--normal-bg": "var(--popover)",
                    "--normal-text": "var(--popover-foreground)",
                    "--normal-border": "var(--border)",
                }
            }
            {...props}
        />
    );
};

export { Toaster };
