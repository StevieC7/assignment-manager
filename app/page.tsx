'use client';
import { Button, Divider, Grid, Paper, TextField, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import { roomMatcher, dummyRooms } from "./utils/algo";
import RoomZone from "./components/RoomDropzone";
import DraggableRoom from "./components/DraggableRoom";
import { DndContext } from "@dnd-kit/core";

export type Room = {
    name: string,
    patientCount: number,
}
export default function Home() {
    const [parent, setParent] = useState(null);
    const [nurseList, setNurseList] = useState<string[]>([]);
    const [nurseName, setNurseName] = useState<string>('');
    const [roomList, setRoomList] = useState<Room[]>([]);
    const [room, setRoom] = useState<Room>({ name: '', patientCount: 0 });
    const { assignments, exceptions, averageAssignments } = roomMatcher(nurseList, roomList);
    const handleDragEnd = (event: any) => {
        const { over } = event;
        setParent(over ? over.id : null)
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
                    {/* <Grid item>
                    <Typography>Rooms</Typography>
                    {dummyRooms.map(room => {
                        const foundAssignment = assignments.find(assignment => assignment.rooms.includes(room));
                        return (
                            <>
                                <Typography>{room.name}</Typography>
                                {foundAssignment && foundAssignment.nurse}
                            </>
                        )
                    })}
                </Grid> */}
                    {
                        !parent && (
                            <DraggableRoom roomId={'1'}>Drag me</DraggableRoom>
                        )
                    }
                    {
                        dummyRooms.map(room => (
                            <RoomZone key={room.name} nurseId={room.name}>
                                {parent === room.name ? (
                                    <DraggableRoom roomId={'1'}>Drag me</DraggableRoom>
                                ) : '+'}
                            </RoomZone>
                        ))
                    }
                </Grid>
            </DndContext>
        </main >
    );
}
