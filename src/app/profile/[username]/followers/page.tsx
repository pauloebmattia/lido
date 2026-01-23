'use client';

import { use } from 'react';
import { ConnectionsList } from '../ConnectionsList';

export default function FollowersPage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = use(params);
    return <ConnectionsList username={username} type="followers" />;
}
