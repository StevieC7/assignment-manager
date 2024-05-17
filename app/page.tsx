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

    const [nurseAssignments, setNurseAssignments] = useState<Record<string, Room[]>>({});

    // TODO: handle delete nurse (specifically, handle updating parent list and user assignment list when nurse deleted)

    // TODO: room name validation (prevent adding room name that already exists)
    const isRoomNameDuplicate = room.name !== '' && roomList.find(existingRoom => existingRoom.name === room.name) ? true : false;

    const handleAddRoom = () => {
        setRoomList([...roomList, room])
        setRoom({ name: '', patientCount: 0 })
    }

    const handleDeleteRoom = (id: number, name: string) => {
        const newList = [...roomList];
        newList.splice(id, 1);
        setRoomList(newList);
        let newUserAssigned = { ...nurseAssignments };
        for (const [nurseName, roomList] of Object.entries(newUserAssigned)) {
            const newList = roomList.filter(room => room.name !== name);
            newUserAssigned[nurseName] = newList;
        }
        setNurseAssignments(newUserAssigned);
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { over, active } = event;
        const parentTuple = Object.entries(nurseAssignments).find(nurse => nurse[1].map(room => room.name).includes(active.id as string));
        const parent = parentTuple ? parentTuple[0] : undefined;
        if (over && parent && over.id === parent) {
            return;
        }
        if (over) {
            let updatedAssigned = { ...nurseAssignments };
            if (parent) {
                const updatedOldNurse = nurseAssignments[parent].filter(assignment => assignment.name !== active.id);
                updatedAssigned[parent] = updatedOldNurse;
            }
            const activeRoom = roomList.find(room => room.name === active.id);
            const alreadyAssigned = nurseAssignments[over.id] || [];
            updatedAssigned[over.id] = activeRoom ? [...alreadyAssigned, activeRoom] : alreadyAssigned;
            setNurseAssignments(updatedAssigned);
        } else {
            if (parent) {
                let updatedAssigned = { ...nurseAssignments };
                const updatedOldNurse = nurseAssignments[parent].filter(assignment => assignment.name !== active.id);
                updatedAssigned[parent] = updatedOldNurse;
                setNurseAssignments(updatedAssigned);
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
                                error={isRoomNameDuplicate}
                            />
                            <TextField type='number' placeholder="0" value={room.patientCount} onChange={e => setRoom({ name: room.name, patientCount: parseInt(e.currentTarget.value) })} />
                            <Button
                                variant="contained"
                                onClick={handleAddRoom}
                                disabled={isRoomNameDuplicate}
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
                        <Grid item container direction='row' xs={12} className='p-2 h-24'>
                            {
                                roomList.filter(room => !Object.values(nurseAssignments).flat().includes(room)).map(room => {
                                    return (
                                        <DraggableRoom key={`room-${room.name}`} roomId={room.name}>{room.name}: {room.patientCount}</DraggableRoom>
                                    )
                                })
                            }
                        </Grid>
                        <Grid item container direction='row' xs={12}>
                            {
                                nurseList.map(nurse => (
                                    <RoomZone key={nurse} nurseId={nurse} patientCount={nurseAssignments[nurse] ? nurseAssignments[nurse].reduce((prev, curr) => prev + curr.patientCount, 0) : 0}>
                                        {
                                            Object.entries(nurseAssignments).map(([key, val]) => {
                                                const rooms = val;
                                                if (rooms.length && key === nurse) {
                                                    const roomList = rooms.map(room => {
                                                        return (
                                                            <DraggableRoom key={`room-${room.name}`} roomId={room.name}>{room.name}: {room.patientCount}</DraggableRoom>
                                                        )
                                                    })
                                                    return roomList;
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
