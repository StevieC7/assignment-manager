import { ArrowDownward, ArrowRight, CheckCircle, Lock, LockOpen } from "@mui/icons-material"
import { Button, Grid, Menu, MenuItem, Typography } from "@mui/material"
import DraggableRoom from "./DragAndDrop/DraggableRoom"
import DraggableProvider from "./DragAndDrop/DraggableProvider"
import { Dispatch, MouseEvent, useState } from "react"
import { NurseAssignments, Provider, ResetOptions } from "../types/types"

type Props = {
    setDrawerOpen: Dispatch<boolean>
    handleAutoAssign: () => void
    handleReset: (item: ResetOptions) => void
    roomsLocked: boolean
    setRoomsLocked: Dispatch<boolean>
    roomList: string[]
    providerList: Provider[]
    roomParents: Record<string, string | null>
    providerParents: Record<string, { am: string | null, pm: string | null }>
    nurseAssignments: NurseAssignments
}

export default function MainSidebar({
    setDrawerOpen,
    handleAutoAssign,
    handleReset,
    roomsLocked,
    setRoomsLocked,
    roomList,
    providerList,
    roomParents,
    providerParents,
    nurseAssignments
}: Props) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const unassignedRooms = roomList.filter(room => !roomParents[room]);
    const unassignedProvidersAM = providerList.filter(provider => !providerParents[provider.name]?.am);
    const unassignedProvidersPM = providerList.filter(provider => !providerParents[provider.name]?.pm);

    const handleOpenMenu = (event: MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    }
    const handleCloseMenu = () => {
        setAnchorEl(null);
    }

    return (
        <Grid item container direction='column' xs={3} sx={{ paddingTop: '3rem', paddingRight: '3rem' }}>
            <Grid item container direction='column'>
                <Button onClick={() => setDrawerOpen(true)} variant='contained' color='primary' sx={{ mb: '1rem' }} endIcon={<ArrowRight />}>
                    Staff Setup
                </Button>
            </Grid>
            <Grid
                item
                container
                justifyContent='flex-end'
                sx={{ mb: '2rem' }}
            >
                <Grid item>
                    <Button variant='outlined' color='warning' endIcon={<ArrowDownward />} onClick={e => handleOpenMenu(e)} sx={{ height: '3rem', width: '10rem' }}>
                        Reset
                    </Button>
                    <Menu
                        open={!!anchorEl}
                        anchorEl={anchorEl}
                        onClose={handleCloseMenu}
                        slotProps={{
                            paper: {
                                sx: {
                                    width: '10rem'
                                }
                            }
                        }}
                    >
                        <MenuItem onClick={() => handleReset(ResetOptions.PROVIDERS)}>
                            Reset Providers
                        </MenuItem>
                        <MenuItem onClick={() => handleReset(ResetOptions.ALL)}>
                            Reset All
                        </MenuItem>
                    </Menu>
                </Grid>
                <Grid item>
                    <Button
                        variant='outlined'
                        onClick={handleAutoAssign}
                        sx={{
                            height: '3rem',
                            width: '10rem',
                            ml: '1rem'
                        }}
                    >
                        Quick-fill
                    </Button>
                </Grid>
            </Grid>
            <Grid item container justifyContent='space-between' mb={'2rem'}>
                <Typography variant='h4'>Rooms</Typography>
                {
                    roomsLocked
                        ? <Lock onMouseDown={() => setRoomsLocked(false)} sx={{ cursor: 'pointer' }} />
                        : <LockOpen onMouseDown={() => setRoomsLocked(true)} sx={{ cursor: 'pointer' }} />
                }
            </Grid>
            <Grid item container direction='row' mb={'2rem'}>
                {
                    unassignedRooms.length
                        ? unassignedRooms.map(room => {
                            return (
                                <DraggableRoom key={`room-${room}`} roomId={room} nurseName={null} nurseAssignments={nurseAssignments} isMinimized />
                            )
                        })
                        : (
                            <>
                                <CheckCircle sx={(theme) => ({ color: theme.palette.success.light })} />
                                <Typography>All Assigned</Typography>
                            </>
                        )
                }
            </Grid>
            <Typography variant='h4' mb={'2rem'}>AM Providers</Typography>
            <Grid item container mb={'2rem'}>
                {
                    unassignedProvidersAM.length
                        ? unassignedProvidersAM.map(provider => {
                            return (
                                <DraggableProvider
                                    key={`provider-${provider.name}-am`}
                                    providerName={provider.name}
                                    shift='am'
                                    patientCount={{
                                        inPerson: provider.patientCount.am.inPerson,
                                        virtual: provider.patientCount.am.virtual
                                    }}
                                    inSidebar
                                />
                            )
                        })
                        : (
                            <>
                                <CheckCircle sx={(theme) => ({ color: theme.palette.success.light })} />
                                <Typography>All Assigned</Typography>
                            </>
                        )
                }
            </Grid>
            <Typography variant='h4' mb={'2rem'}>PM Providers</Typography>
            <Grid item container>
                {
                    unassignedProvidersPM.length
                        ? unassignedProvidersPM.map(provider => {
                            return (
                                <DraggableProvider
                                    key={`provider-${provider.name}-pm`}
                                    providerName={provider.name}
                                    shift='pm'
                                    patientCount={{
                                        inPerson: provider.patientCount.pm.inPerson,
                                        virtual: provider.patientCount.pm.virtual
                                    }}
                                    inSidebar
                                />
                            )
                        })
                        : (
                            <>
                                <CheckCircle sx={(theme) => ({ color: theme.palette.success.light })} />
                                <Typography>All Assigned</Typography>
                            </>
                        )
                }
            </Grid>
        </Grid >
    )
}
