import { Grid, Paper, Typography } from "@mui/material"
import RoomZone from "./DragAndDrop/RoomDropzone"
import DraggableRoom from "./DragAndDrop/DraggableRoom"
import { NurseAssignments } from "../types/types"

type Props = {
    nurse: string
    nurseTeamChildren: Record<string, (string | null)[]>
    averagePatientCountAM: number
    averagePatientCountPM: number
    nurseAssignments: NurseAssignments
}

export default function NurseTeamCard({
    nurse,
    nurseTeamChildren,
    averagePatientCountAM,
    averagePatientCountPM,
    nurseAssignments
}: Props) {

    const nurseProviders = nurseAssignments[nurse] ? Object.entries(nurseAssignments[nurse]).map(([_, provider]) => provider) : [];
    const patientCountAM = nurseAssignments[nurse] ? nurseProviders.reduce((prev, curr) => prev + (curr?.am?.patientCount?.am?.inPerson ?? 0), 0) : 0;
    const patientCountPM = nurseAssignments[nurse] ? nurseProviders.reduce((prev, curr) => prev + (curr?.pm?.patientCount?.pm?.inPerson ?? 0), 0) : 0;

    return (
        <Grid
            item
            container
            xs={6}
            direction='column'
        >
            <Paper sx={{ p: 2 }}>
                <Typography variant='h5' sx={{ width: 'fit-content' }}>{nurse}</Typography>
                <Grid container>
                    {
                        nurseTeamChildren[nurse]
                        && nurseTeamChildren[nurse].map((teamMember, index) => (
                            <Grid key={teamMember} item mr={1}>{index > 0 ? `/ ${teamMember}` : teamMember}</Grid>
                        ))
                    }
                </Grid>
                <Grid item container direction='row'>
                    <Grid item xs={4}></Grid>
                    {
                        patientCountAM > 0
                            ? (
                                <Grid item container xs={4} justifyContent='space-between'>
                                    AM
                                    <Typography
                                        sx={(theme) => ({
                                            width: '2rem',
                                            textAlign: 'center',
                                            borderTop: '1px solid gray',
                                            borderRight: '1px solid gray',
                                            borderLeft: '1px solid gray',
                                            backgroundColor: patientCountAM <= averagePatientCountAM ? theme.palette.success.light : theme.palette.warning.light
                                        })}
                                    >
                                        {patientCountAM}
                                    </Typography>
                                </Grid>
                            )
                            : <Grid item xs={4} />
                    }
                    {
                        patientCountPM > 0
                            ? (
                                <Grid item container xs={4} justifyContent='space-between'>
                                    PM
                                    <Typography
                                        sx={(theme) => ({
                                            width: '2rem',
                                            textAlign: 'center',
                                            borderTop: '1px solid gray',
                                            borderRight: '1px solid gray',
                                            borderLeft: '1px solid gray',
                                            backgroundColor: patientCountPM <= averagePatientCountPM ? theme.palette.success.light : theme.palette.warning.light
                                        })}
                                    >
                                        {patientCountPM}
                                    </Typography>
                                </Grid>
                            )
                            : <Grid item xs={4} />
                    }
                </Grid>
                <RoomZone nurseId={nurse}>
                    {
                        nurseAssignments[nurse] && Object.keys(nurseAssignments[nurse]).map((room, index) => {
                            return (
                                <DraggableRoom key={`${index}-${room}`} roomId={room} nurseName={nurse} nurseAssignments={nurseAssignments} />
                            )
                        })
                    }
                </RoomZone>
            </Paper>
        </Grid>
    )
}
