import { useDroppable, DragOverlayProps } from "@dnd-kit/core"
import { Grid, Typography } from "@mui/material"
type Props = {
    nurseId: string
    children: DragOverlayProps['children']
}
export default function RoomZone({ nurseId, children }: Props) {
    const { isOver, setNodeRef } = useDroppable({
        id: `nurse-${nurseId}`
    })
    return (
        <div ref={setNodeRef} className={`border-2 h-96 flex flex-col`}>
            <Grid container>
                {children}
            </Grid>
            <Grid container direction='row' justifyContent='center' alignItems='center' className={`border-dotted border-2 ${isOver && 'bg-green-100'} flex-grow`}>
                <Typography className="w-fit">+</Typography>
            </Grid>
        </div>
    )
}
