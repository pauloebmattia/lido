import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Setup worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
    url: string;
    initialPage?: number;
    onProgressChange?: (page: number, progress: number) => void;
}

export default function PDFViewer({ url, initialPage = 1, onProgressChange }: PDFViewerProps) {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(initialPage);
    const [scale, setScale] = useState(1.0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setPageNumber(initialPage);
    }, [initialPage]);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setIsLoading(false);
    }

    const changePage = (offset: number) => {
        setPageNumber((prev) => {
            const newPage = Math.min(Math.max(1, prev + offset), numPages || 1);
            return newPage;
        });
    };

    // Report progress when page changes
    useEffect(() => {
        if (numPages && onProgressChange) {
            const progress = (pageNumber / numPages) * 100;
            onProgressChange(pageNumber, progress);
        }
    }, [pageNumber, numPages, onProgressChange]);

    const changeScale = (offset: number) => {
        setScale((prev) => Math.min(Math.max(0.5, prev + offset), 3.0));
    };

    return (
        <div className="flex flex-col items-center gap-4 bg-stone-100 min-h-[calc(100vh-64px)] p-8">
            {/* Toolbar */}
            <div className="flex items-center gap-4 bg-white px-6 py-2 rounded-full shadow-sm sticky top-4 z-10">
                <div className="flex items-center gap-1 border-r border-stone-200 pr-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => changePage(-1)}
                        disabled={pageNumber <= 1}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronLeft size={18} />
                    </Button>
                    <span className="text-sm font-medium text-ink min-w-[3rem] text-center">
                        {pageNumber} / {numPages || '-'}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => changePage(1)}
                        disabled={numPages === null || pageNumber >= numPages}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronRight size={18} />
                    </Button>
                </div>

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => changeScale(-0.1)} className="h-8 w-8 p-0">
                        <ZoomOut size={18} />
                    </Button>
                    <span className="text-sm font-medium text-ink min-w-[3rem] text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => changeScale(0.1)} className="h-8 w-8 p-0">
                        <ZoomIn size={18} />
                    </Button>
                </div>
            </div>

            {/* Document */}
            <div className="shadow-lg max-w-full overflow-auto bg-white min-h-[500px]">
                <Document
                    file={url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                        <div className="h-[800px] w-[600px] flex items-center justify-center">
                            <Loader2 className="animate-spin text-accent" />
                        </div>
                    }
                    className="flex flex-col items-center"
                >
                    <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="shadow-sm"
                    />
                </Document>
            </div>
        </div>
    );
}
