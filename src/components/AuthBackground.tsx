'use client';

import { useState, useEffect } from 'react';

const IMAGES = [
    '/auth-backgrounds/Gemini_Generated_Image_1xodhy1xodhy1xod.png',
    '/auth-backgrounds/Gemini_Generated_Image_cuxbpccuxbpccuxb.png',
    '/auth-backgrounds/Gemini_Generated_Image_dhvu1vdhvu1vdhvu.png',
    '/auth-backgrounds/Gemini_Generated_Image_kgideukgideukgid.png',
    '/auth-backgrounds/Gemini_Generated_Image_qc0vb1qc0vb1qc0v.png',
    '/auth-backgrounds/bg.png',
];

const QUOTES = [
    { text: "Um leitor vive mil vidas antes de morrer. O homem que nunca lê vive apenas uma.", author: "George R.R. Martin" },
    { text: "Os livros são os amigos mais silenciosos e constantes; são os conselheiros mais acessíveis e os professores mais pacientes.", author: "Charles W. Eliot" },
    { text: "Não há amigo tão leal quanto um livro.", author: "Ernest Hemingway" },
    { text: "A leitura é para a mente o que o exercício é para o corpo.", author: "Joseph Addison" },
    { text: "Muitos homens iniciaram uma nova era na sua vida a partir da leitura de um livro.", author: "Henry David Thoreau" },
    { text: "Ler é sonhar pela mão de outrem.", author: "Fernando Pessoa" },
    { text: "A casa sem livros é corpo sem alma.", author: "Cícero" }
];

export function AuthBackground() {
    const [mounted, setMounted] = useState(false);
    const [image, setImage] = useState(IMAGES[0]);
    const [quote, setQuote] = useState(QUOTES[0]);

    useEffect(() => {
        // Random select only on client to avoid hydration mismatch
        setImage(IMAGES[Math.floor(Math.random() * IMAGES.length)]);
        setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
        setMounted(true);
    }, []);

    return (
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-stone-900">
            {/* Image with Fade In transition */}
            <div
                className={`absolute inset-0 transition-opacity duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}
            >
                <img
                    src={image}
                    alt="Legal, não é?"
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

            {/* Quote */}
            <div className="absolute bottom-12 left-12 right-12 z-10">
                <blockquote className="font-serif text-xl md:text-2xl lg:text-3xl text-white/95 italic leading-normal drop-shadow-sm">
                    "{quote.text}"
                </blockquote>
                <div className="flex items-center gap-3 mt-4">
                    <div className="h-px w-6 bg-accent/80"></div>
                    <p className="text-white/80 font-medium tracking-wide uppercase text-xs">{quote.author}</p>
                </div>
            </div>
        </div>
    );
}
