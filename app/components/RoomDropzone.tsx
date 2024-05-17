import { useDroppable, DragOverlayProps } from "@dnd-kit/core"
import { Grid, Typography } from "@mui/material"
type Props = {
    nurseId: string
    patientCount: number
    children: DragOverlayProps['children']
}
export default function RoomZone({ nurseId, patientCount, children }: Props) {
    const { isOver, setNodeRef } = useDroppable({
        id: nurseId
    })
    return (
        <div ref={setNodeRef} className={`border-2 w-96 ml-6 h-96 bg-white flex flex-col`}>
            <Grid container direction='row' justifyContent='space-between' className='border-b-2'>
                <Typography variant='h5' className="w-fit">{nurseId}</Typography>
                <Typography variant='h5' className={'w-fit border-l-2'}>{patientCount}</Typography>
            </Grid>
            <Grid container>
                {children}
            </Grid>
            <Grid container direction='row' justifyContent='center' alignItems='center' className={`border-dotted border-2 ${isOver && 'bg-green-100'} flex-grow`}>
                <Typography className="w-fit">+</Typography>
            </Grid>
        </div>
    )
}
