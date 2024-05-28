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
    const { isOver, active, setNodeRef } = useDroppable({
        id: `nurse-${nurseId}-room-${roomId}-shift-${shift}`
    })
    return (
        <Grid
            component={'div'}
            container
            direction='column'
            ref={setNodeRef}
            sx={(theme) => ({
                border: '2px solid gray',
                backgroundColor: theme.palette.common.white,
                height: '100%'
            })}
            xs={4}
        >
            <Grid
                item
                container
            >
                {children}
            </Grid>
            {
                !isFull
                && (
                    <Grid
                        item
                        container
                        direction='row'
                        justifyContent='center'
                        alignItems='center'
                        sx={{
                            backgroundColor: isOver && active?.id.toString().includes('provider') ? 'lightgreen' : undefined,
                            height: '100%'
                        }}
                    >
                        <Typography sx={{ width: 'fit-content' }}>+</Typography>
                    </Grid>
                )
            }
        </Grid>
    )
}
