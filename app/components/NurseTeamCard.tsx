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
                <Typography variant='h5' className="w-fit">{nurse}</Typography>
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
                                    <Typography className={`w-8 text-center border-1-2 ${patientCountAM <= averagePatientCountAM ? patientCountAM === 0 ? 'bg-red-100' : 'bg-green-100' : 'bg-yellow-100'}`}>{patientCountAM}</Typography>
                                </Grid>
                            )
                            : <Grid item xs={4} />
                    }
                    {
                        patientCountPM > 0
                            ? (
                                <Grid item container xs={4} justifyContent='space-between'>
                                    PM
                                    <Typography className={`w-8 text-center border-1-2 ${patientCountPM <= averagePatientCountPM ? patientCountPM === 0 ? 'bg-red-100' : 'bg-green-100' : 'bg-yellow-100'}`}>{patientCountPM}</Typography>
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
