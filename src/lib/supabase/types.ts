// =============================================================================
// Supabase Database Types
// Auto-generated types for the Lido database schema
// =============================================================================

export type ReadingStatus = 'want_to_read' | 'reading' | 'read' | 'dnf';

export type ActivityType =
    | 'user_reviewed'
    | 'user_started_reading'
    | 'user_finished_book'
    | 'user_added_to_list'
    | 'user_followed'
    | 'book_trending';

export interface Profile {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    favorite_genre: string | null;
    xp_points: number;
    level: number;
    books_read: number;
    reviews_count: number;
    followers_count: number;
    following_count: number;
    created_at: string;
    updated_at: string;
}

export interface Book {
    id: string;
    isbn: string | null;
    google_books_id: string | null;
    title: string;
    subtitle: string | null;
    authors: string[];
    publisher: string | null;
    published_date: string | null;
    description: string | null;
    page_count: number | null;
    language: string;
    cover_url: string | null;
    cover_thumbnail: string | null;
    categories: string[];
    avg_rating: number;
    ratings_count: number;
    reviews_count: number;
    added_by: string | null;
    is_verified: boolean;
    created_at: string;
    updated_at: string;
}

export interface Vibe {
    id: number;
    name: string;
    slug: string;
    emoji: string;
    color: string;
    description: string | null;
    created_at: string;
}

export interface Review {
    id: string;
    user_id: string;
    book_id: string;
    rating: number;
    content: string | null;
    contains_spoilers: boolean;
    started_reading_at: string | null;
    finished_reading_at: string | null;
    likes_count: number;
    comments_count: number;
    created_at: string;
    updated_at: string;
    // Joined data
    vibes?: Vibe[];
    user?: Profile;
    book?: Book;
}

export interface UserBook {
    id: string;
    user_id: string;
    book_id: string;
    status: ReadingStatus;
    current_page: number;
    progress_percent: number;
    added_at: string;
    started_at: string | null;
    finished_at: string | null;
}

export interface ActivityFeedItem {
    id: string;
    user_id: string;
    activity_type: ActivityType;
    book_id: string | null;
    review_id: string | null;
    target_user_id: string | null;
    metadata: Record<string, unknown>;
    is_public: boolean;
    created_at: string;
    // Joined from view
    username?: string;
    display_name?: string;
    avatar_url?: string;
    book_title?: string;
    book_cover?: string;
}

export interface EarlyAccessBook {
    id: string;
    book_id: string;
    author_id: string;
    file_path: string;
    file_type: 'pdf' | 'epub';
    file_size_bytes: number | null;
    is_free: boolean;
    download_count: number;
    xp_bonus: number;
    is_approved: boolean;
    approved_by: string | null;
    approved_at: string | null;
    created_at: string;
    updated_at: string;
}

export type NotificationType = 'like_review' | 'comment_review' | 'new_follower' | 'system_alert';

export interface Notification {
    id: string;
    user_id: string;
    type: NotificationType;
    actor_id: string | null;
    resource_id: string | null;
    data: {
        link?: string;
        message?: string;
        [key: string]: any;
    };
    read: boolean;
    created_at: string;
    // Joined
    actor?: Profile;
}
