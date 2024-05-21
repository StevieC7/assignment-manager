import { useDraggable } from "@dnd-kit/core";
import ProviderZone from "./ProviderDropzone";
import { NurseAssignments, ProviderRooms } from "../page";
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
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={`flex flex-row ${isMinimized ? 'w-fit' : 'w-full'} justify-between`}>
            <Typography variant='h5' className={'h-16 w-fit'}>{roomId}</Typography>
            {
                nurseName
                && (
                    <ProviderZone
                        key={`nurse-room-${roomId}`}
                        isFull={!!nurseAssignments[nurseName][roomId]}
                        roomId={roomId}
                        nurseId={nurseName}
                    >
                        {
                            Object.entries(nurseAssignments).map(([nurse, rooms]) => {
                                if (rooms && nurse === nurseName) {
                                    const providerList = Object.entries(rooms).map(([room, provider]) => {
                                        const providerName = provider?.name;
                                        const patientCount = provider?.patientCount;
                                        if (providerName && room === roomId) {
                                            return (
                                                <DraggableProvider key={`provider-${providerName}`} providerId={providerName}>{providerName}: {patientCount}</DraggableProvider>
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
                )
            }
        </div>
    )
}
