import Link from 'next/link';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg';
    linkToHome?: boolean;
}

const sizes = {
    sm: 'text-xl tracking-[0.2em]',
    md: 'text-2xl tracking-[0.25em]',
    lg: 'text-4xl tracking-[0.3em]',
};

/**
 * LIDO Logo Component
 * Wordmark tipográfico moderno e editorial
 * Font: Plus Jakarta Sans (uppercase, medium weight, wide tracking)
 */
export function Logo({ size = 'md', linkToHome = true }: LogoProps) {
    const logoContent = (
        <span
            className={`
        font-serif font-bold tracking-widest
        text-ink select-none
        ${sizes[size]}
      `}
        >
            Lido.
        </span>
    );

    if (linkToHome) {
        return (
            <Link
                href="/"
                className="inline-flex items-center hover:opacity-80 transition-opacity"
                aria-label="Lido - Página inicial"
            >
                {logoContent}
            </Link>
        );
    }

    return logoContent;
}

/**
 * Tagline component
 */
export function Tagline({ className = '' }: { className?: string }) {
    return (
        <p className={`font-serif italic text-fade text-sm ${className}`}>
            Onde as histórias ficam.
        </p>
    );
}
