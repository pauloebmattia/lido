import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/settings/', '/read/'], // Don't index admin or private reading pages
        },
        sitemap: 'https://lido.app/sitemap.xml', // Replace with actual domain
    };
}
