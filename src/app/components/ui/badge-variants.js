import { cva } from "class-variance-authority";

export const badgeVariants = cva(
    "inline-flex items-center justify-center rounded-[6px] border px-[10px] py-1 text-[11px] font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-[#FFE4E9] text-[#E84D6E] [a&]:hover:bg-[#FFCCD5]",
                secondary:
                    "border-transparent bg-[#FFF7ED] text-[#E84D6E] [a&]:hover:bg-[#FFECD9]",
                destructive:
                    "border-transparent bg-[#FFEBEE] text-[#F44336] [a&]:hover:bg-[#FFCDD2] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
                outline:
                    "text-[#424242] border-[#EEEEEE] [a&]:hover:bg-[#FAFAFA] [a&]:hover:text-[#212121]",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    },
);
