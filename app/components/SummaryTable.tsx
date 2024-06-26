import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { NurseAssignments, Provider } from "../types/types";
type Props = {
    activeNurseTeams: string[]
    activeNurses: string[]
    nurseAssignments: NurseAssignments
    providerList: Provider[]
    averagePatientCountAM: number
    averagePatientCountPM: number
}
export default function SummaryTable({
    activeNurseTeams,
    activeNurses,
    nurseAssignments,
    providerList,
    averagePatientCountAM,
    averagePatientCountPM
}: Props) {

    const patientTotalAM = providerList.reduce((prev, curr) => prev + curr.patientCount.am.inPerson, 0);
    const patientTotalPM = providerList.reduce((prev, curr) => prev + curr.patientCount.pm.inPerson, 0);

    const assignedPatientTotalAM = Object.values(nurseAssignments).map(room => Object.values(room).map(shiftSlots => shiftSlots?.am?.patientCount?.am?.inPerson ?? 0)).flat().reduce((prev, curr) => prev + curr, 0);
    const assignedPatientTotalPM = Object.values(nurseAssignments).map(room => Object.values(room).map(shiftSlots => shiftSlots?.pm?.patientCount?.pm?.inPerson ?? 0)).flat().reduce((prev, curr) => prev + curr, 0);

    const anyAssignedGreaterThanTargetAM = Object.values(nurseAssignments).map(room => Object.values(room).map(shiftSlots => shiftSlots?.am?.patientCount?.am?.inPerson ?? 0).reduce((prev, curr) => prev + curr)).some(val => val > averagePatientCountAM);
    const anyAssignedGreaterThanTargetPM = Object.values(nurseAssignments).map(room => Object.values(room).map(shiftSlots => shiftSlots?.pm?.patientCount?.pm?.inPerson ?? 0).reduce((prev, curr) => prev + curr)).some(val => val > averagePatientCountPM);

    const allActiveNurseGroupings = [...activeNurseTeams, ...activeNurses];

    return (
        <TableContainer sx={{ maxWidth: '100%', mb: '2rem' }}
            component={Paper}
        >
            <Table size='small'>
                <TableHead>
                    <TableRow>
                        <TableCell></TableCell>
                        <TableCell sx={{ backgroundColor: '#eeeeee', fontWeight: 'bold' }}>Total</TableCell>
                        <TableCell sx={{ backgroundColor: '#eeeeee', fontWeight: 'bold' }}>Assigned</TableCell>
                        <TableCell sx={{ backgroundColor: '#eeeeee', fontWeight: 'bold' }}>Pt/Team</TableCell>
                        {
                            activeNurseTeams.map((nurseTeam, index) => {
                                return (
                                    <TableCell key={'nurse-team' + index}>{nurseTeam}</TableCell>
                                )
                            })
                        }
                        {
                            activeNurses.map((nurse, index) => {
                                return (
                                    <TableCell key={'nurse' + index}>{nurse}</TableCell>
                                )
                            })
                        }
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <TableCell sx={{ backgroundColor: '#eeeeee', fontWeight: 'bold' }}>AM</TableCell>
                        <TableCell>{patientTotalAM}</TableCell>
                        <TableCell sx={(theme) => ({ backgroundColor: assignedPatientTotalAM < patientTotalAM ? theme.palette.warning.light : 'inherit' })}>{assignedPatientTotalAM}</TableCell>
                        <TableCell sx={(theme) => ({ backgroundColor: anyAssignedGreaterThanTargetAM ? theme.palette.warning.light : 'inherit' })}>{averagePatientCountAM}</TableCell>
                        {
                            activeNurseTeams.map((nurseTeam, index) => {
                                const nurseProviders = nurseAssignments[nurseTeam] ? Object.entries(nurseAssignments[nurseTeam]).map(([_, provider]) => provider) : [];
                                const patientCountAM = nurseAssignments[nurseTeam] ? nurseProviders.reduce((prev, curr) => prev + (curr?.am?.patientCount?.am?.inPerson ?? 0), 0) : 0;
                                return (
                                    <TableCell
                                        sx={(theme) => ({ backgroundColor: patientCountAM > averagePatientCountAM ? theme.palette.warning.light : 'inherit' })}
                                        key={index}
                                    >
                                        {patientCountAM}
                                    </TableCell>
                                )
                            })
                        }
                        {
                            activeNurses.map((nurse, index) => {
                                const nurseProviders = nurseAssignments[nurse] ? Object.entries(nurseAssignments[nurse]).map(([_, provider]) => provider) : [];
                                const patientCountAM = nurseAssignments[nurse] ? nurseProviders.reduce((prev, curr) => prev + (curr?.am?.patientCount?.am?.inPerson ?? 0), 0) : 0;
                                return (
                                    <TableCell
                                        sx={(theme) => ({ backgroundColor: patientCountAM > averagePatientCountAM ? theme.palette.warning.light : 'inherit' })}
                                        key={index}
                                    >
                                        {patientCountAM}
                                    </TableCell>
                                )
                            })
                        }
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ backgroundColor: '#eeeeee', fontWeight: 'bold' }}>PM</TableCell>
                        <TableCell>{patientTotalPM}</TableCell>
                        <TableCell sx={(theme) => ({ backgroundColor: assignedPatientTotalPM < patientTotalPM ? theme.palette.warning.light : 'inherit' })}>{assignedPatientTotalPM}</TableCell>
                        <TableCell sx={(theme) => ({ backgroundColor: anyAssignedGreaterThanTargetPM ? theme.palette.warning.light : 'inherit' })}>{averagePatientCountPM}</TableCell>
                        {
                            activeNurseTeams.map((nurseTeam, index) => {
                                const nurseProviders = nurseAssignments[nurseTeam] ? Object.entries(nurseAssignments[nurseTeam]).map(([_, provider]) => provider) : [];
                                const patientCountPM = nurseAssignments[nurseTeam] ? nurseProviders.reduce((prev, curr) => prev + (curr?.pm?.patientCount?.pm?.inPerson ?? 0), 0) : 0;
                                return (
                                    <TableCell
                                        sx={(theme) => ({ backgroundColor: patientCountPM > averagePatientCountPM ? theme.palette.warning.light : 'inherit' })}
                                        key={index}
                                    >
                                        {patientCountPM}
                                    </TableCell>
                                )
                            })
                        }
                        {
                            activeNurses.map((nurse, index) => {
                                const nurseProviders = nurseAssignments[nurse] ? Object.entries(nurseAssignments[nurse]).map(([_, provider]) => provider) : [];
                                const patientCountPM = nurseAssignments[nurse] ? nurseProviders.reduce((prev, curr) => prev + (curr?.pm?.patientCount?.pm?.inPerson ?? 0), 0) : 0;
                                return (
                                    <TableCell
                                        sx={(theme) => ({ backgroundColor: patientCountPM > averagePatientCountPM ? theme.palette.warning.light : 'inherit' })}
                                        key={index}
                                    >
                                        {patientCountPM}
                                    </TableCell>
                                )
                            })
                        }
                    </TableRow>
                    <TableRow sx={{ borderTop: '2px solid black' }}>
                        <TableCell sx={{ backgroundColor: '#eeeeee', fontWeight: 'bold' }}>Total</TableCell>
                        <TableCell>{patientTotalAM + patientTotalPM}</TableCell>
                        <TableCell sx={(theme) => ({ backgroundColor: assignedPatientTotalPM + assignedPatientTotalAM < patientTotalPM + patientTotalAM ? theme.palette.warning.light : 'inherit' })}>{assignedPatientTotalPM + assignedPatientTotalAM}</TableCell>
                        <TableCell>
                            {
                                isNaN(Math.ceil((assignedPatientTotalAM + assignedPatientTotalPM) / allActiveNurseGroupings.length))
                                    ? 0
                                    : Math.ceil((assignedPatientTotalAM + assignedPatientTotalPM) / allActiveNurseGroupings.length)
                            }
                        </TableCell>
                        {
                            activeNurseTeams.map((nurseTeam, index) => {
                                const nurseProviders = nurseAssignments[nurseTeam] ? Object.entries(nurseAssignments[nurseTeam]).map(([_, provider]) => provider) : [];
                                const patientCountTotal = nurseAssignments[nurseTeam] ? nurseProviders.reduce((prev, curr) => prev + (curr?.am?.patientCount?.am?.inPerson ?? 0) + (curr?.pm?.patientCount?.pm?.inPerson ?? 0), 0) : 0;
                                return (
                                    <TableCell key={index}>{patientCountTotal}</TableCell>
                                )
                            })
                        }
                        {
                            activeNurses.map((nurse, index) => {
                                const nurseProviders = nurseAssignments[nurse] ? Object.entries(nurseAssignments[nurse]).map(([_, provider]) => provider) : [];
                                const patientCountTotal = nurseAssignments[nurse] ? nurseProviders.reduce((prev, curr) => prev + (curr?.am?.patientCount?.am?.inPerson ?? 0) + (curr?.pm?.patientCount?.pm?.inPerson ?? 0), 0) : 0;
                                return (
                                    <TableCell key={index}>{patientCountTotal}</TableCell>
                                )
                            })
                        }
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    )
}
