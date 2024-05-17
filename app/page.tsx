'use client';
import { Button, Divider, Grid, Paper, TextField, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import RoomZone from "./components/RoomDropzone";
import DraggableRoom from "./components/DraggableRoom";
import { DndContext, DragEndEvent, UniqueIdentifier } from "@dnd-kit/core";

export type Room = {
    name: string,
    patientCount: number,
}
export default function Home() {
    const [nurseName, setNurseName] = useState<string>('');
    const [room, setRoom] = useState<Room>({ name: '', patientCount: 0 });

    const [nurseList, setNurseList] = useState<string[]>([]);
    const [roomList, setRoomList] = useState<Room[]>([]);

    const [parentList, setParentList] = useState<Record<string, UniqueIdentifier | null>>({});
    // key will be the room id and parent will be the nurse id

    const [userAssigned, setUserAssigned] = useState<Record<string, Room[]>>({});

    const handleAddRoom = () => {
        setRoomList([...roomList, room])
        setRoom({ name: '', patientCount: 0 })
        setParentList({ ...parentList, [room.name]: null })
    }

    const handleDeleteRoom = (id: number, name: string) => {
        const newList = [...roomList];
        newList.splice(id, 1);
        setRoomList(newList);
        let newUserAssigned = { ...userAssigned };
        for (const [nurseName, roomList] of Object.entries(newUserAssigned)) {
            const newList = roomList.filter(room => room.name !== name);
            newUserAssigned[nurseName] = newList;
        }
        setUserAssigned(newUserAssigned);
        const newParentList = { ...parentList };
        delete newParentList[name];
        setParentList(newParentList);
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { over, active } = event;
        const parent = parentList[active.id];
        if (over && parent && over.id === parent) {
            return;
        }
        if (over) {
            let updatedAssigned = { ...userAssigned };
            if (parent) {
                const updatedOldNurse = userAssigned[parent].filter(assignment => assignment.name !== active.id);
                updatedAssigned[parent] = updatedOldNurse;
            }
            const activeRoom = roomList.find(room => room.name === active.id);
            const alreadyAssigned = userAssigned[over.id] || [];
            updatedAssigned[over.id] = activeRoom ? [...alreadyAssigned, activeRoom] : alreadyAssigned;
            setUserAssigned(updatedAssigned);
            if (activeRoom) {
                const newParentList = { ...parentList, [activeRoom.name]: over.id }
                setParentList(newParentList);
            }
        } else {
            if (parent) {
                let updatedAssigned = { ...userAssigned };
                const updatedOldNurse = userAssigned[parent].filter(assignment => assignment.name !== active.id);
                updatedAssigned[parent] = updatedOldNurse;
                setUserAssigned(updatedAssigned);
            }
            if (active.id) {
                setParentList({ ...parentList, [active.id]: null })
            }
        }
    }

    return (
        <main>
            <DndContext onDragEnd={handleDragEnd}>
                <h1>Room Assigner</h1>
                <Grid
                    container
                    direction='row'
                >
                    <Grid
                        container
                        direction='column'
                        xs={3}
                        className='h-dvh'
                    >
                        <Grid item container direction='column' xs={6}>
                            <TextField
                                placeholder="Nurse Name"
                                value={nurseName}
                                onChange={e => setNurseName(e.currentTarget.value)}
                            />
                            <Button
                                onClick={() => {
                                    setNurseList([...nurseList, nurseName])
                                    setNurseName('')
                                }}
                            >
                                Save
                            </Button>
                            {nurseList.map((nurse, id) => {
                                return (
                                    <>
                                        <Typography key={id}>
                                            {nurse}
                                        </Typography>
                                        <Button onClick={() => {
                                            const newList = [...nurseList];
                                            newList.splice(id, 1);
                                            setNurseList(newList);
                                        }}>
                                            Delete
                                        </Button>
                                    </>
                                )
                            })}
                        </Grid>
                        <Grid item container direction='column' xs={6}>
                            <TextField
                                placeholder="Room Name"
                                value={room.name}
                                onChange={e => setRoom({ name: e.currentTarget.value, patientCount: room.patientCount })}
                            />
                            <TextField type='number' placeholder="0" value={room.patientCount} onChange={e => setRoom({ name: room.name, patientCount: parseInt(e.currentTarget.value) })} />
                            <Button
                                onClick={handleAddRoom}
                            >
                                Save
                            </Button>
                            {roomList.map((room, id) => {
                                return (
                                    <>
                                        <Typography key={id}>
                                            {room.name}: {room.patientCount}
                                        </Typography>
                                        <Button onClick={() => handleDeleteRoom(id, room.name)}>
                                            Delete
                                        </Button>
                                    </>
                                )
                            })}
                        </Grid>
                    </Grid>
                    <Grid
                        direction='column'
                        xs={9}
                    >
                        {
                            Object.entries(parentList).map(([key, val]) => {
                                const roomId = key;
                                const parentId = val;
                                if (parentId) {
                                    return null;
                                } else {
                                    return (
                                        <DraggableRoom key={`room-${roomId}`} roomId={roomId}>{roomId}</DraggableRoom>
                                    )
                                }
                            })
                        }
                        <Grid item container direction='row' xs={12}>
                            {
                                nurseList.map(nurse => (
                                    <RoomZone key={nurse} nurseId={nurse} patientCount={userAssigned[nurse] ? userAssigned[nurse].reduce((prev, curr) => prev + curr.patientCount, 0) : 0}>
                                        {
                                            Object.entries(parentList).map(([key, val]) => {
                                                const roomId = key;
                                                const parentId = val;
                                                if (parentId === nurse) {
                                                    return (
                                                        <DraggableRoom key={`room-${roomId}`} roomId={roomId}>{roomId}</DraggableRoom>
                                                    )
                                                } else {
                                                    return null;
                                                }
                                            })
                                        }
                                    </RoomZone>
                                ))
                            }
                        </Grid>
                    </Grid>
                </Grid>
            </DndContext>
        </main >
    );
}
