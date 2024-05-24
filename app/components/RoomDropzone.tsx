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
        <div ref={setNodeRef} className={`flex flex-col flex-grow`}>
            <Grid container>
                {children}
            </Grid>
            <Grid container direction='row' justifyContent='center' alignItems='center' className={`h-16 border-dotted border-2 ${isOver && 'bg-green-100'} flex-grow`}>
                <Typography className="w-fit">+</Typography>
            </Grid>
        </div>
    )
}
