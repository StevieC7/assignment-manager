'use client';
import { Button, Divider, Grid, Paper, TextField, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import { roomMatcher, dummyRooms, dummyNurses } from "./utils/algo";
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

    const [parent, setParent] = useState<UniqueIdentifier | null>(null);
    const [parentList, setParentList] = useState<Record<string, UniqueIdentifier | null>>({});
    // key will be the room id and parent will be the nurse id

    const { assignments, exceptions, averageAssignments } = roomMatcher(nurseList, roomList);
    const [userAssigned, setUserAssigned] = useState<Record<string, Room[]>>({});

    const handleDragEnd = (event: DragEndEvent) => {
        const { over, active } = event;
        if (over && parent && over.id === parent) {
            return;
        }
        if (over) {
            let updatedAssigned = { ...userAssigned };
            if (parent) {
                const updatedOldNurse = userAssigned[parent].filter(assignment => assignment.name !== active.id);
                updatedAssigned[parent] = updatedOldNurse;
            }
            const activeRoom = dummyRooms.find(room => room.name === active.id);
            const alreadyAssigned = userAssigned[over.id] || [];
            updatedAssigned[over.id] = activeRoom ? [...alreadyAssigned, activeRoom] : alreadyAssigned;
            setUserAssigned(updatedAssigned);
            setParent(over.id);
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
            setParent(null)
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
                            onClick={() => {
                                setRoomList([...roomList, room])
                                setRoom({ name: '', patientCount: 0 })
                            }}
                        >
                            Save
                        </Button>
                        {roomList.map((room, id) => {
                            return (
                                <>
                                    <Typography key={id}>
                                        {room.name}: {room.patientCount}
                                    </Typography>
                                    <Button onClick={() => {
                                        const newList = [...roomList];
                                        newList.splice(id, 1);
                                        setRoomList(newList);
                                    }}>
                                        Delete
                                    </Button>
                                </>
                            )
                        })}
                    </Grid>
                    <Grid item container direction='column'>
                        <Typography>Target Average Patient Count: {averageAssignments}</Typography>
                        <Typography variant="h2">Assignments</Typography>
                        <Grid item container direction="row">
                            {assignments.map(assignment => {
                                return (
                                    <Paper key={assignment.nurse} elevation={1} sx={{ mr: 5, minWidth: '15rem', padding: '2rem' }}>
                                        <Typography variant="h5">{assignment.nurse}</Typography>
                                        <Typography variant="subtitle2">{assignment.rooms.reduce((prev, curr) => prev + curr.patientCount, 0)} patients</Typography>
                                        <Divider sx={{ mb: 2 }} />
                                        {
                                            assignment.rooms.map(room => {
                                                return (
                                                    <Tooltip key={room.name} title={`${room.patientCount} patients`}>
                                                        <Typography variant="body1">Room {room.name}</Typography>
                                                    </Tooltip>
                                                )
                                            })
                                        }
                                    </Paper>
                                )
                            })}
                        </Grid>
                        <Typography>Exceptions</Typography>
                        {exceptions.map(exception => {
                            return (
                                <Typography key={exception.name}>{exception.name}: {exception.patientCount}</Typography>
                            )
                        })}
                    </Grid>
                    {
                        !parent && (
                            <DraggableRoom roomId={'4&5'}>Drag me</DraggableRoom>
                        )
                    }
                    {
                        dummyNurses.map(nurse => (
                            <RoomZone key={nurse} nurseId={nurse} patientCount={userAssigned[nurse] ? userAssigned[nurse].reduce((prev, curr) => prev + curr.patientCount, 0) : 0}>
                                {parent === nurse && (
                                    <DraggableRoom roomId={'4&5'}>Rooms 4&5</DraggableRoom>
                                )}
                            </RoomZone>
                        ))
                    }
                </Grid>
            </DndContext>
        </main >
    );
}
