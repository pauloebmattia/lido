import { ReactReader } from 'react-reader';
import { useState, useRef, useEffect } from 'react';

interface EpubViewerProps {
    url: string;
    title: string;
    initialLocation?: string | number;
    onProgressChange?: (location: string, progress: number) => void;
}

export default function EpubViewer({ url, title, initialLocation = 0, onProgressChange }: EpubViewerProps) {
    const [location, setLocation] = useState<string | number>(initialLocation);
    // Use a ref to track if we've initialized to avoid overwrites
    const hasInitialized = useRef(false);

    // We need to use a ref to access the rendition object to get percentage
    const renditionRef = useRef<any>(null);

    useEffect(() => {
        if (!hasInitialized.current && initialLocation) {
            setLocation(initialLocation);
            hasInitialized.current = true;
        }
    }, [initialLocation]);

    const handleLocationChange = (epubcifi: string | number) => {
        setLocation(epubcifi);

        if (renditionRef.current && onProgressChange) {
            // @ts-ignore
            const currentLocation = renditionRef.current.currentLocation();
            if (currentLocation && currentLocation.start) {
                const percentage = currentLocation.start.percentage;
                onProgressChange(epubcifi.toString(), Math.round(percentage * 100));
            }
        }
    };

    return (
        <div className="h-[calc(100vh-64px)] bg-paper">
            <ReactReader
                url={url}
                title={title}
                location={location}
                locationChanged={handleLocationChange}
                getRendition={(rendition) => {
                    renditionRef.current = rendition;
                }}
                epubOptions={{
                    flow: 'scrolled',
                    manager: 'continuous',
                }}
            />
        </div>
    );
}
