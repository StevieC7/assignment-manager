import React from 'react';
import { useDraggable, DragOverlayProps } from '@dnd-kit/core';

type Props = {
    providerId: string
    children: DragOverlayProps['children']
}

export default function DraggableProvider({ providerId, children }: Props) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: providerId,
    });
    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;


    return (
        <button ref={setNodeRef} style={style} {...listeners} {...attributes} className='bg-blue-100 p-4 rounded-full h-12 items-center flex'>
            {children}
        </button>
    );
}
