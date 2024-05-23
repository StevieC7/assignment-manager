import { useDraggable } from "@dnd-kit/core";
import ProviderZone from "./ProviderDropzone";
import { NurseAssignments } from "../page";
import DraggableProvider from "./DraggableProvider";
import { Typography } from "@mui/material";
type Props = {
    roomId: string,
    nurseName: string | null,
    nurseAssignments: NurseAssignments,
    isMinimized?: boolean,
}
export default function DraggableRoom({ roomId, nurseName, nurseAssignments, isMinimized }: Props) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `room-${roomId}`,
    });
    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;
    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={`flex flex-row ${isMinimized ? 'h-12 w-36 rounded-full bg-purple-100 justify-center items-center' : 'h-16 w-full justify-between'}`}>
            <Typography variant='h6' className={`${isMinimized ? '' : 'w-4/12'}`}>{roomId}</Typography>
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
                                                    <DraggableProvider key={`provider-${providerName}-am`} shift='am' providerId={providerName}>{providerName}: {patientCount?.am}</DraggableProvider>
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
                                                    <DraggableProvider key={`provider-${providerName}-pm`} shift='pm' providerId={providerName}>{providerName}: {patientCount?.pm}</DraggableProvider>
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
        </div>
    )
}
