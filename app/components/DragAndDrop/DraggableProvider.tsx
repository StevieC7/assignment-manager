import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { DragIndicator } from '@mui/icons-material';
import { Button, Tooltip, Typography } from '@mui/material';

type Props = {
    providerName: string
    shift: 'am' | 'pm'
    patientCount: {
        inPerson: number
        virtual: number
    }
    inSidebar?: boolean
}

export default function DraggableProvider({ providerName, shift, patientCount, inSidebar }: Props) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `provider-${providerName}-shift-${shift}`,
    });

    return (
        <Button
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            sx={(theme) => ({
                p: '1rem',
                m: '0.5rem',
                borderRadius: '20px 20px 20px 20px',
                height: '2rem',
                alignItems: 'center',
                display: 'flex',
                backgroundColor: inSidebar ? shift === 'am' ? theme.palette.warning.light : theme.palette.secondary.light : theme.palette.grey[200],
                color: theme.palette.grey[800],
                transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
                ":hover": {
                    backgroundColor: shift === 'am' ? theme.palette.warning.light : theme.palette.secondary.light,
                    color: theme.palette.grey[800],
                    boxShadow: '2px 2px 2px rgba(0,0,0,0.5)',
                }
            })}
        >
            <DragIndicator sx={{ mr: '0.25rem' }} />
            <Tooltip title={providerName}>
                <Typography
                    variant='body2'
                    noWrap
                >
                    {providerName}: {patientCount.inPerson} {patientCount.virtual ? `(+${patientCount.virtual})` : null}
                </Typography>
            </Tooltip>
        </Button>
    );
}
