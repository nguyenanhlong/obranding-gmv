'use client';

import {useRouter} from 'next/navigation';
import {useTransition, type ChangeEvent} from 'react';

type Props = {
    value: number;
    basePath: string;
    query: string;
    options?: number[];
}

export function PageSizeSelect({value, basePath, query, options = [10, 20, 30]}: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const onChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const nextSize = Number(e.target.value);
        startTransition(() => {
            router.push(`${basePath}?${query}&page=1&pageSize=${nextSize}`, {scroll: false});
        });
    };
    return (
        <label className="flex items-center gap-2 text-sm">
            <select
                value={value}
                onChange={onChange}
                disabled={isPending}
                className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                >
                    {options.map((size) => (
                        <option key={size} value={size}> Hiển thị: {size}</option>
                    ))}
                </select>
        </label>
    );
}