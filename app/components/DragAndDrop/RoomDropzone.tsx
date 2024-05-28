import { useDroppable, DragOverlayProps } from "@dnd-kit/core"
import { Grid, Typography } from "@mui/material"
type Props = {
    nurseId: string
    children: DragOverlayProps['children']
}
export default function RoomZone({ nurseId, children }: Props) {
    const { isOver, active, setNodeRef } = useDroppable({
        id: `nurse-${nurseId}`
    })
    return (
        <Grid
            container
            direction='column'
            ref={setNodeRef}
        >
            <Grid item container>
                {children}
            </Grid>
            <Grid
                item
                container
                direction='row'
                justifyContent='center'
                alignItems='center'
                sx={{
                    height: '3rem',
                    border: '2px dotted gray',
                    backgroundColor: isOver && active?.id.toString().includes('room') ? 'lightgreen' : undefined
                }}
            >
                <Typography sx={{ width: 'fit-content' }}>+</Typography>
            </Grid>
        </Grid>
    )
}
