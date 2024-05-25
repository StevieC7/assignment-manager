import { useDroppable, DragOverlayProps } from "@dnd-kit/core"
import { Grid, Typography } from "@mui/material"
type Props = {
    nurseId: string
    roomId: string
    shift: 'am' | 'pm'
    isFull: boolean
    children: DragOverlayProps['children']
}
export default function ProviderZone({ nurseId, roomId, shift, isFull, children }: Props) {
    const { isOver, setNodeRef } = useDroppable({
        id: `nurse-${nurseId}-room-${roomId}-shift-${shift}`
    })
    return (
        <div ref={setNodeRef} className={`border-2 bg-white flex flex-col w-4/12 h-full`}>
            <Grid container>
                {children}
            </Grid>
            {
                !isFull
                && (
                    <Grid container direction='row' justifyContent='center' alignItems='center' className={`border-dotted border-2 ${isOver && 'bg-green-100'} flex-grow`}>
                        <Typography className="w-fit">+</Typography>
                    </Grid>
                )
            }
        </div>
    )
}
