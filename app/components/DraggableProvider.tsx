import React from 'react';
import { useDraggable, DragOverlayProps } from '@dnd-kit/core';
import { DragIndicator } from '@mui/icons-material';

type Props = {
    providerId: string
    shift: 'am' | 'pm'
    children: DragOverlayProps['children']
}

export default function DraggableProvider({ providerId, shift, children }: Props) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `provider-${providerId}-shift-${shift}`,
    });
    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;


    return (
        <button ref={setNodeRef} style={style} {...listeners} {...attributes} className={`${shift === 'am' ? 'bg-orange-100' : 'bg-blue-100'} p-4 rounded-full h-12 items-center flex`}>
            <DragIndicator sx={{ mr: '0.25rem' }} />
            {children}
        </button>
    );
}
