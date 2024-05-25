import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { DragIndicator } from '@mui/icons-material';
import { Tooltip, Typography } from '@mui/material';

type Props = {
    providerName: string
    shift: 'am' | 'pm'
    patientCount: {
        inPerson: number
        virtual: number
    }
}

export default function DraggableProvider({ providerName, shift, patientCount }: Props) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `provider-${providerName}-shift-${shift}`,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    const truncate = (name: string, length: number) => {
        if (name.length > length) {
            return `${name.slice(0, length)}...`
        } else {
            return name
        }
    }

    return (
        <button ref={setNodeRef} style={style} {...listeners} {...attributes} className={`${shift === 'am' ? 'bg-orange-100' : 'bg-blue-100'} p-4 rounded-full h-12 items-center flex`}>
            <DragIndicator sx={{ mr: '0.25rem' }} />
            <Tooltip title={providerName.length > 6 ? providerName : ''}>
                <Typography variant='body2'>
                    {truncate(providerName, 6)}: {patientCount.inPerson} {patientCount.virtual ? `(+${patientCount.virtual})` : null}
                </Typography>
            </Tooltip>
        </button>
    );
}
