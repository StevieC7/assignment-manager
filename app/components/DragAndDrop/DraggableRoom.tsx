import { useDraggable } from "@dnd-kit/core";
import ProviderZone from "./ProviderDropzone";
import { NurseAssignments } from "../../types/types";
import DraggableProvider from "./DraggableProvider";
import { Grid, SxProps, Theme, Typography } from "@mui/material";
import { DragIndicator } from "@mui/icons-material";
type Props = {
    roomId: string,
    nurseName: string | null,
    nurseAssignments: NurseAssignments,
    isMinimized?: boolean,
}
export default function DraggableRoom({ roomId, nurseName, nurseAssignments, isMinimized }: Props) {

    const { attributes, listeners, setNodeRef, transform: dragTransform } = useDraggable({
        id: `room-${roomId}`,
    });

    const sxStyle: SxProps<Theme> = (theme: Theme) => {
        const common: SxProps = {
            transform: dragTransform ? `translate3d(${dragTransform.x}px, ${dragTransform.y}px, 0)` : undefined,
            borderRadius: '12px 12px 12px 12px',
            alignItems: 'center',
        }
        const minimized: SxProps = {
            height: '2rem',
            width: '6rem',
            backgroundColor: theme.palette.primary.light,
            justifyContent: 'center',
            ...common
        }
        const expanded: SxProps = {
            height: '3rem',
            width: '100%',
            backgroundColor: theme.palette.common.white,
            justifyContent: 'space-between',
            ...common
        }
        return isMinimized ? minimized : expanded;
    }
    return (
        <Grid
            container
            ref={setNodeRef}
            sx={sxStyle}
            {...listeners}
            {...attributes}
        >
            <Grid
                container
                xs={isMinimized ? 12 : 4}
                sx={{
                    height: '100%',
                    alignItems: 'center',
                }}
            >
                <Grid
                    item
                    container
                    justifyContent='center'
                    alignItems='center'
                    sx={(theme) => ({
                        backgroundColor: isMinimized ? 'inherit' : theme.palette.grey[200],
                        width: '2rem',
                        height: '100%',
                        borderBottomLeftRadius: '12px',
                        borderTopLeftRadius: '12px',
                        cursor: 'pointer',
                        ":hover": {
                            color: isMinimized ? 'inherit' : theme.palette.primary.main,
                        }
                    })}
                >
                    <DragIndicator />
                </Grid>
                <Typography
                    variant='h6'
                    sx={{
                        width: isMinimized ? undefined : '33%',
                        pl: '1rem'
                    }}
                >
                    {roomId}
                </Typography>
            </Grid>
            {
                nurseName
                && (
                    <>
                        <ProviderZone
                            key={`nurse-room-${roomId}-am`}
                            isFull={!!nurseAssignments[nurseName][roomId]['am']}
                            roomId={roomId}
                            nurseId={nurseName}
                            shift={'am'}
                        >
                            {
                                Object.entries(nurseAssignments).map(([nurse, rooms]) => {
                                    if (rooms && nurse === nurseName) {
                                        const providerList = Object.entries(rooms).map(([room, shiftSlots]) => {
                                            const providerName = shiftSlots.am?.name;
                                            const patientCount = shiftSlots.am?.patientCount;
                                            if (providerName && room === roomId) {
                                                return (
                                                    <DraggableProvider
                                                        key={`provider-${providerName}-am`}
                                                        shift='am'
                                                        providerName={providerName}
                                                        patientCount={{
                                                            inPerson: patientCount?.am.inPerson ?? 0,
                                                            virtual: patientCount?.am.virtual ?? 0
                                                        }}
                                                    />
                                                )
                                            }
                                        })
                                        return providerList;
                                    } else {
                                        return null;
                                    }
                                })
                            }
                        </ProviderZone>
                        <ProviderZone
                            key={`nurse-room-${roomId}-pm`}
                            isFull={!!nurseAssignments[nurseName][roomId]['pm']}
                            roomId={roomId}
                            nurseId={nurseName}
                            shift={'pm'}
                        >
                            {
                                Object.entries(nurseAssignments).map(([nurse, rooms]) => {
                                    if (rooms && nurse === nurseName) {
                                        const providerList = Object.entries(rooms).map(([room, shiftSlots]) => {
                                            const providerName = shiftSlots.pm?.name;
                                            const patientCount = shiftSlots.pm?.patientCount;
                                            if (providerName && room === roomId) {
                                                return (
                                                    <DraggableProvider
                                                        key={`provider-${providerName}-pm`}
                                                        shift='pm'
                                                        providerName={providerName}
                                                        patientCount={{
                                                            inPerson: patientCount?.pm.inPerson ?? 0,
                                                            virtual: patientCount?.pm.virtual ?? 0,
                                                        }}
                                                    />
                                                )
                                            }
                                        })
                                        return providerList;
                                    } else {
                                        return null;
                                    }
                                })
                            }
                        </ProviderZone>
                    </>
                )
            }
        </Grid>
    )
}
