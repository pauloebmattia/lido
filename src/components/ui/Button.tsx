import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'link' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 hover:brightness-110';

        const variants = {
            primary: 'bg-ink text-paper hover:bg-stone-800 rounded-full',
            secondary: 'bg-stone-100 text-ink hover:bg-stone-200 rounded-full',
            ghost: 'border border-ink text-ink hover:bg-ink hover:text-paper rounded-full',
            link: 'text-accent underline-offset-4 hover:underline p-0',
            outline: 'border border-stone-200 bg-transparent hover:bg-stone-50 text-ink rounded-full',
        };

        const sizes = {
            sm: 'h-8 px-4 text-sm',
            md: 'h-10 px-6 text-sm',
            lg: 'h-12 px-8 text-base',
        };

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={cn(baseStyles, variants[variant], variant !== 'link' && sizes[size], className)}
                {...props}
            >
                {isLoading ? (
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : null}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export { Button };
