
'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

export default function DashboardRedirectPage() {
    const router = useRouter();

    React.useEffect(() => {
        router.replace(`/khpanel/dashboard`);
    }, [router]);

    return (
        <div className="flex h-screen items-center justify-center">
            <div>در حال انتقال به داشبورد...</div>
        </div>
    );
}
