'use client';
import { Button, Grid, TextField, Typography } from "@mui/material";
import { useState } from "react";
import RoomZone from "./components/RoomDropzone";
import DraggableRoom from "./components/DraggableRoom";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { CheckCircle } from "@mui/icons-material";
import { roomMatcher } from "./utils/algo";
// @ts-ignore
import * as Papa from 'papaparse';

export type Room = {
    name: string,
    patientCount: number,
}
export default function Home() {
    const [nurseName, setNurseName] = useState<string>('');
    const [room, setRoom] = useState<Room>({ name: '', patientCount: 0 });

    const [nurseList, setNurseList] = useState<string[]>([]);
    const [roomList, setRoomList] = useState<Room[]>([]);

    const averagePatientCount = Math.ceil(roomList.reduce((prev, curr) => prev + curr.patientCount, 0) / nurseList.length);
    const [nurseAssignments, setNurseAssignments] = useState<Record<string, Room[]>>({});

    const unassignedRooms = roomList.filter(room => !Object.values(nurseAssignments).flat().map(val => val.name).includes(room.name));

    const isRoomNameDuplicate = room.name !== '' && roomList.find(existingRoom => existingRoom.name === room.name) ? true : false;

    const handleAddRoom = () => {
        setRoomList([...roomList, room])
        setRoom({ name: '', patientCount: 0 })
    }

    const handleUpdateRoomPatientCount = (name: string, patientCount: number) => {
        const foundRoomIndex = roomList.findIndex(room => room.name === name);
        if (foundRoomIndex !== -1) {
            const newRoomList = [...roomList];
            newRoomList.splice(foundRoomIndex, 1, { name, patientCount });
            setRoomList(newRoomList);
            let newNurseAssignments = { ...nurseAssignments };
            for (const [nurseName, roomList] of Object.entries(newNurseAssignments)) {
                if (roomList.find(room => room.name === name)) {
                    const newList = roomList.filter(room => room.name !== name);
                    newList.push({ name, patientCount });
                    newNurseAssignments[nurseName] = newList;
                }
            }
            setNurseAssignments(newNurseAssignments);
        }
    }

    const handleDeleteNurse = (id: number, name: string) => {
        const newList = [...nurseList];
        newList.splice(id, 1);
        setNurseList(newList);
        const newNurseAssignments = { ...nurseAssignments };
        delete newNurseAssignments[name];
        setNurseAssignments(newNurseAssignments);
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

    const handleSaveToLocal = () => {
        localStorage.setItem("nurses", JSON.stringify(nurseList))
        localStorage.setItem("rooms", JSON.stringify(roomList))
        localStorage.setItem("nurseAssignments", JSON.stringify(nurseAssignments))
    }

    const handleLoadLocal = () => {
        const nurses = localStorage.getItem("nurses");
        const rooms = localStorage.getItem("rooms");
        const assignments = localStorage.getItem("nurseAssignments");
        if (nurses) setNurseList(JSON.parse(nurses));
        if (rooms) setRoomList(JSON.parse(rooms));
        if (assignments) setNurseAssignments(JSON.parse(assignments));
    }

    const handleExport = () => {
        const data = {
            fields: ['Nurse', 'Room', 'Patient Count'],
            data: Object.entries(nurseAssignments).map(assignmentTuple => [assignmentTuple[0], assignmentTuple[1].map(assignment => assignment.name), assignmentTuple[1].map(assignment => assignment.patientCount)])
        }
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8,' });
        console.log({ csv, blob })
        const objUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', objUrl);
        link.setAttribute('download', 'schedule.csv');
        link.click();
    }

    const handleAutoAssign = () => {
        const { assignments } = roomMatcher(nurseList, roomList);
        setNurseAssignments(assignments);
    }

    const handleResetAssignments = () => {
        setNurseAssignments({});
    }

    return (
        <main>
            <DndContext onDragEnd={handleDragEnd}>
                <Grid container direction='row' justifyContent='space-between' alignItems='center' className='bg-black text-white p-4'>
                    <Typography variant="h1">Room Assigner</Typography>
                    <Grid item>
                        <Button variant="contained" onClick={handleSaveToLocal} className='h-12 mr-4'>Save</Button>
                        <Button variant="contained" onClick={handleLoadLocal} className='h-12'>Load</Button>
                        <Button variant="contained" onClick={handleExport} className='h-12'>Export</Button>
                    </Grid>
                </Grid>
                <Grid
                    container
                    direction='row'
                    className='p-4'
                >
                    <Grid
                        item
                        container
                        direction='column'
                        xs={3}
                        className='h-dvh'
                    >
                        <Grid item container direction='column'>
                            <Typography variant='h4'>Nurses</Typography>
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
                                    <Grid key={id} item container direction='row' alignItems='center'>
                                        <Typography>
                                            {nurse}
                                        </Typography>
                                        <Button onClick={() => handleDeleteNurse(id, nurse)}>
                                            Delete
                                        </Button>
                                    </Grid>
                                )
                            })}
                        </Grid>
                        <Grid item container direction='column'>
                            <Typography variant='h4'>Rooms</Typography>
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
                                // TODO: add an "update" functionality for the patient count
                                return (
                                    <Grid key={id} item container direction='row' alignItems='center' justifyContent='space-between'>
                                        <Typography>
                                            {room.name}
                                        </Typography>
                                        <Grid item container justifyContent='flex-end' alignItems='center' xs={9}>
                                            <TextField
                                                type='number'
                                                value={room.patientCount}
                                                onChange={(e) => handleUpdateRoomPatientCount(room.name, parseInt(e.currentTarget.value))}
                                                className='w-16'
                                            />
                                            <Typography variant='body1'>patients</Typography>
                                            <Button onClick={() => handleDeleteRoom(id, room.name)}>
                                                Delete
                                            </Button>
                                        </Grid>
                                    </Grid>
                                )
                            })}
                        </Grid>
                    </Grid>
                    <Grid
                        direction='column'
                        xs={9}
                    >
                        <Grid
                            item
                            container
                            direction='row'
                            justifyContent='space-between'
                            xs={12}
                            className='p-2 h-24'
                        >
                            <Grid item container direction='row' xs={9} className='pl-6'>
                                {
                                    unassignedRooms.length
                                        ? unassignedRooms.map(room => {
                                            return (
                                                <DraggableRoom key={`room-${room.name}`} roomId={room.name}>{room.name}: {room.patientCount}</DraggableRoom>
                                            )
                                        })
                                        : (
                                            <>
                                                <CheckCircle className='text-green-500' />
                                                <Typography>All Assigned</Typography>
                                            </>
                                        )
                                }
                            </Grid>
                            <Grid
                                item
                                container
                                direction='row'
                                justifyContent='flex-end'
                                xs={3}
                            >
                                <Button
                                    variant='outlined'
                                    onClick={handleResetAssignments}
                                    className='h-12'
                                >
                                    Reset Assignments
                                </Button>
                                <Button
                                    variant='contained'
                                    onClick={handleAutoAssign}
                                    className='h-12 ml-4'
                                >
                                    Quick-fill
                                </Button>
                            </Grid>
                        </Grid>
                        <Typography variant='h4' className='pl-6 mb-4'>Target patient count: {averagePatientCount}</Typography>
                        <Grid
                            item
                            container
                            direction='row'
                            xs={12}
                        >
                            {
                                nurseList.map(nurse => (
                                    <RoomZone
                                        key={nurse}
                                        nurseId={nurse}
                                        patientCount={nurseAssignments[nurse] ? nurseAssignments[nurse].reduce((prev, curr) => prev + curr.patientCount, 0) : 0}
                                        averagePatientCount={averagePatientCount}
                                    >
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
