import { useDraggable } from "@dnd-kit/core";
import ProviderZone from "./ProviderDropzone";
import { ProviderRooms } from "../page";
import DraggableProvider from "./DraggableProvider";
import { Typography } from "@mui/material";
type Props = {
    roomId: string,
    nurseName: string | null,
    nurseAssignments: Record<string, ProviderRooms[]>
}
export default function DraggableRoom({ roomId, nurseName, nurseAssignments }: Props) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `room-${roomId}`,
    });
    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;
    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} >
            <Typography variant='h5' className={'h-16 w-16'}>{roomId}</Typography>
            {
                nurseName
                && (
                    <ProviderZone
                        key={`nurse-room-${roomId}`}
                        roomId={roomId}
                        nurseId={nurseName}
                    >
                        {
                            Object.entries(nurseAssignments).map(([key, val]) => {
                                const providerRooms = val;
                                if (providerRooms.length && key === nurseName) {
                                    const providerList = providerRooms.map(pr => {
                                        const providerName = pr.provider?.name;
                                        const roomName = pr.room;
                                        if (providerName && roomName === roomId) {
                                            return (
                                                <DraggableProvider key={`provider-${providerName}`} providerId={providerName}>{providerName}: {pr.provider?.patientCount}</DraggableProvider>
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
