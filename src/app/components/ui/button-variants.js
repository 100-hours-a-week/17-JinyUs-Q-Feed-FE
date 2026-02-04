import { cva } from "class-variance-authority";

export const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] text-[15px] font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    {
        variants: {
            variant: {
                default: "bg-gradient-to-br from-[#FF6B8A] to-[#E84D6E] text-white hover:shadow-[0_6px_16px_rgba(232,77,110,0.3)] active:shadow-[0_2px_8px_rgba(232,77,110,0.2)] shadow-[0_4px_12px_rgba(232,77,110,0.25)]",
                destructive:
                    "bg-[#F44336] text-white hover:bg-[#E53935] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
                outline:
                    "border border-[#EEEEEE] bg-white text-[#424242] hover:bg-[#FAFAFA] hover:border-[#E0E0E0] dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
                secondary:
                    "bg-[#FFE4E9] text-[#E84D6E] hover:bg-[#FFCCD5] border-none",
                ghost:
                    "bg-transparent text-[#616161] border border-[#EEEEEE] hover:bg-[#FAFAFA] hover:border-[#E0E0E0] dark:hover:bg-accent/50",
                link: "text-[#FF6B8A] underline-offset-4 hover:underline bg-transparent",
            },
            size: {
                default: "h-[48px] px-6 py-3 has-[>svg]:px-4",
                sm: "h-8 rounded-[12px] gap-1.5 px-3 has-[>svg]:px-2.5 text-[14px]",
                lg: "h-[56px] rounded-[12px] px-8 has-[>svg]:px-6 text-[16px]",
                icon: "size-[48px] rounded-[12px]",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);
