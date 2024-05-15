'use client';
import { Button, Grid, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { roomMatcher } from "./utils/algo";

export type Room = {
    name: string,
    patientCount: number,
}
export default function Home() {
    const [nurseList, setNurseList] = useState<string[]>([]);
    const [nurseName, setNurseName] = useState<string>('');
    const [roomList, setRoomList] = useState<Room[]>([]);
    const [room, setRoom] = useState<Room>({ name: '', patientCount: 0 });
    const { assignments, exceptions, averageAssignments } = roomMatcher(nurseList, roomList);
    return (
        <main>
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
                <Grid item>
                    <Typography>Target Average Patient Count: {averageAssignments}</Typography>
                    <Typography>Assignments</Typography>
                    {assignments.map(assignment => {
                        return (
                            <>
                                <Typography>{assignment.nurse}</Typography>
                                {
                                    assignment.rooms.map(room => {
                                        return (
                                            <Typography key={room.name}>{room.name}: {room.patientCount}</Typography>
                                        )
                                    })
                                }
                            </>
                        )
                    })}
                    <Typography>Exceptions</Typography>
                    {exceptions.map(exception => {
                        return (
                            <Typography key={exception.name}>{exception.name}: {exception.patientCount}</Typography>
                        )
                    })}
                </Grid>
            </Grid>
        </main >
    );
}
