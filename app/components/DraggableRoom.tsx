import React from 'react';
import { useDraggable, DragOverlayProps } from '@dnd-kit/core';

type Props = {
    roomId: string
    children: DragOverlayProps['children']
}

export default function DraggableRoom({ roomId, children }: Props) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: roomId,
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
