'use client';

import * as React from 'react';
import { cn } from '@/lib/utils'; // Assuming cn exists, if not I'll just use template literals or check utils.

// Simple Context-based Tabs implementation to match Radix UI API roughly
const TabsContext = React.createContext<{
    activeTab: string;
    setActiveTab: (value: string) => void;
} | null>(null);

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
    defaultValue: string;
    onValueChange?: (value: string) => void;
}

export function Tabs({ defaultValue, onValueChange, className, children, ...props }: TabsProps) {
    const [activeTab, setActiveTabState] = React.useState(defaultValue);

    const setActiveTab = (value: string) => {
        setActiveTabState(value);
        onValueChange?.(value);
    };

    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab }}>
            <div className={cn('w-full', className)} {...props}>
                {children}
            </div>
        </TabsContext.Provider>
    );
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> { }

export function TabsList({ className, children, ...props }: TabsListProps) {
    return (
        <div
            className={cn(
                'inline-flex h-10 items-center justify-center rounded-md bg-stone-100 p-1 text-stone-500',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    value: string;
}

export function TabsTrigger({ className, value, children, ...props }: TabsTriggerProps) {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error('TabsTrigger must be used within Tabs');

    const isActive = context.activeTab === value;

    return (
        <button
            type="button"
            onClick={() => context.setActiveTab(value)}
            data-state={isActive ? 'active' : 'inactive'}
            className={cn(
                'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
                isActive && 'bg-white text-stone-950 shadow-sm',
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
    value: string;
}

export function TabsContent({ className, value, children, ...props }: TabsContentProps) {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error('TabsContent must be used within Tabs');

    if (context.activeTab !== value) return null;

    return (
        <div
            className={cn(
                'mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
