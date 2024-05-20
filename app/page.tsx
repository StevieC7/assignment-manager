'use client';
import { Button, Grid, TextField, Typography } from "@mui/material";
import { useState } from "react";
import DraggableProvider from "./components/DraggableProvider";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { CheckCircle } from "@mui/icons-material";
// @ts-ignore
import * as Papa from 'papaparse';
import RoomZone from "./components/RoomDropzone";
import DraggableRoom from "./components/DraggableRoom";

export type Provider = {
    name: string,
    patientCount: number,
}
export type ProviderRooms = {
    provider: Provider | null,
    room: string,
}

export default function Home() {
    const [nurseName, setNurseName] = useState<string>('');
    const [room, setRoom] = useState<string>('');
    const [provider, setProvider] = useState<Provider>({ name: '', patientCount: 0 });

    const [nurseList, setNurseList] = useState<string[]>([]);
    const [roomList, setRoomList] = useState<string[]>([]);
    const [providerList, setProviderList] = useState<Provider[]>([]);

    const averagePatientCount = Math.ceil(providerList.reduce((prev, curr) => prev + curr.patientCount, 0) / nurseList.length);
    const [nurseAssignments, setNurseAssignments] = useState<Record<string, ProviderRooms[]>>({});
    console.log({ nurseAssignments })

    const unassignedRooms = roomList.filter(room => !Object.values(nurseAssignments).flat().map(val => val.room).includes(room));
    const unassignedProviders = providerList.filter(provider => !Object.values(nurseAssignments).flat().map(val => val.provider?.name).includes(provider.name));

    const isProviderNameDuplicate = provider.name !== '' && providerList.find(existingProvider => existingProvider.name === provider.name) ? true : false;

    const handleAddNurse = () => {
        setNurseList([...nurseList, nurseName])
        setNurseName('')
    }

    const handleAddRoom = () => {
        setRoomList([...roomList, room])
        setRoom('')
    }

    const handleAddProvider = () => {
        setProviderList([...providerList, provider])
        setProvider({ name: '', patientCount: 0 })
    }

    const handleUpdateProviderPatientCount = (name: string, patientCount: number) => {
        const foundProviderIndex = providerList.findIndex(provider => provider.name === name);
        if (foundProviderIndex !== -1) {
            const newProviderList = [...providerList];
            newProviderList.splice(foundProviderIndex, 1, { name, patientCount });
            setProviderList(newProviderList);
            let newNurseAssignments = { ...nurseAssignments };
            for (const [nurseName, providerRoomsList] of Object.entries(newNurseAssignments)) {
                const existingProviderRoom = providerRoomsList.find(providerRoom => providerRoom.provider?.name === name);
                if (existingProviderRoom) {
                    const newList = providerRoomsList.filter(providerRoom => providerRoom.provider?.name !== name);
                    newList.push({ provider: { name, patientCount }, room: existingProviderRoom.room });
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

    const handleDeleteProvider = (id: number, name: string) => {
        const newList = [...providerList];
        newList.splice(id, 1);
        setProviderList(newList);
        let newUserAssigned = { ...nurseAssignments };
        for (const [nurseName, providerList] of Object.entries(newUserAssigned)) {
            const newList = providerList.filter(providerRoom => providerRoom.provider?.name !== name);
            newUserAssigned[nurseName] = newList;
        }
        setNurseAssignments(newUserAssigned);
    }

    const handleDragEnd = (event: DragEndEvent) => {
        // over id format: nurse-{nurseName} | nurse-{nurseName}-room-{roomName}
        // active id format: room-{roomName} | provider-{providerName}
        const { over, active } = event;
        const splitOver = over && (over.id as string).split('-');
        const overNurse = splitOver && splitOver[1];
        const overRoom = splitOver && splitOver.length > 2 ? splitOver[3] : null;
        const splitActive = active && (active.id as string).split('-');
        const activeType = splitActive[0];
        const activeValue = splitActive[1];
        if (over && active && overRoom === null && activeType === 'provider') {
            return;
        }
        if (activeType === 'provider') {
            const parentTuple = Object.entries(nurseAssignments).find(nurse => nurse[1].map(providerRoom => providerRoom.provider?.name).includes(activeValue));
            const parentNurse = parentTuple ? parentTuple[0] : undefined;
            const parentRoom = parentTuple ? parentTuple[1].find(pr => pr.provider?.name === activeValue)?.room : undefined;
            if (over && parentRoom && overRoom === parentRoom) {
                return;
            }
            if (overNurse && overRoom) {
                let updatedAssigned = { ...nurseAssignments };
                // TODO: handle moving to other providers
                if (parentRoom) {
                    const indexToUpdate = updatedAssigned[overNurse].findIndex(val => val.room === parentRoom);
                    updatedAssigned[overNurse].splice(indexToUpdate, 1, { room: parentRoom, provider: null });
                }
                const activeProvider = providerList.find(provider => provider.name === activeValue);
                const allProviderRoomsButActive = updatedAssigned[overNurse].filter(pr => pr.room !== overRoom);
                if (activeProvider && allProviderRoomsButActive) {
                    updatedAssigned[overNurse] = [...allProviderRoomsButActive, { provider: activeProvider, room: overRoom }]
                    setNurseAssignments(updatedAssigned)
                }
            } else {
                if (parentRoom && parentNurse) {
                    let updatedAssigned = { ...nurseAssignments };
                    const updatedProviderRoom = nurseAssignments[parentNurse].find(pr => pr.provider?.name === activeValue);
                    if (updatedProviderRoom?.room) {
                        const updatedOldNurse = [...nurseAssignments[parentNurse].filter(pr => pr.provider?.name !== activeValue), { provider: null, room: updatedProviderRoom.room }]
                        updatedAssigned[parentNurse] = updatedOldNurse;
                        setNurseAssignments(updatedAssigned);
                    }
                }
            }
        } else if (activeType === 'room') {
            const parentTuple = Object.entries(nurseAssignments).find(nurse => nurse[1].map(providerRoom => providerRoom.room).includes(activeValue));
            const parentVal = parentTuple ? parentTuple[0] : undefined;
            if (over && parentVal && overNurse === parentVal) {
                return;
            }
            if (overNurse) {
                let updatedAssigned = { ...nurseAssignments };
                // TODO: handle moving to other rooms
                if (parentVal) {
                    const updatedOldNurse = nurseAssignments[parentVal].filter(providerRoom => providerRoom.room !== activeValue);
                    updatedAssigned[parentVal] = updatedOldNurse;
                }
                const alreadyAssigned = nurseAssignments[overNurse] || [];
                updatedAssigned[overNurse] = activeValue ? [...alreadyAssigned, { provider: alreadyAssigned.find(room => room.room === activeValue)?.provider ?? null, room: activeValue }] : alreadyAssigned;
                setNurseAssignments(updatedAssigned);
            } else {
                if (parentVal) {
                    let updatedAssigned = { ...nurseAssignments };
                    const updatedOldNurse = nurseAssignments[parentVal].filter(assignment => assignment.room !== activeValue);
                    updatedAssigned[parentVal] = updatedOldNurse;
                    setNurseAssignments(updatedAssigned);
                }
            }
        }

    }

    const handleSaveToLocal = () => {
        localStorage.setItem("nurses", JSON.stringify(nurseList))
        localStorage.setItem("providers", JSON.stringify(providerList))
        localStorage.setItem("nurseAssignments", JSON.stringify(nurseAssignments))
    }

    const handleLoadLocal = () => {
        const nurses = localStorage.getItem("nurses");
        const providers = localStorage.getItem("providers");
        const assignments = localStorage.getItem("nurseAssignments");
        if (nurses) setNurseList(JSON.parse(nurses));
        if (providers) setProviderList(JSON.parse(providers));
        if (assignments) setNurseAssignments(JSON.parse(assignments));
    }

    const handleExport = () => {
        const data = {
            fields: ['Nurse', 'Provider', 'Patient Count'],
            data: Object.entries(nurseAssignments).map(assignmentTuple => [assignmentTuple[0], assignmentTuple[1].map(assignment => assignment.provider?.name), assignmentTuple[1].map(assignment => assignment.provider?.patientCount)])
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
        // TODO: fix this to work with new data model
        // const { assignments } = providerMatcher(nurseList, providerList, averagePatientCount);
        // setNurseAssignments(assignments);
        console.log("Happy birthday idiot")
    }

    const handleResetAssignments = () => {
        setNurseAssignments({});
    }

    return (
        <main>
            <DndContext onDragEnd={handleDragEnd}>
                <Grid container direction='row' justifyContent='space-between' alignItems='center' className='bg-black text-white p-4'>
                    <Typography variant="h1">Provider Assigner</Typography>
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
                            <Typography variant='h4'>Team</Typography>
                            <TextField
                                placeholder="Team Members"
                                value={nurseName}
                                onChange={e => setNurseName(e.currentTarget.value)}
                            />
                            <Button
                                onClick={handleAddNurse}
                            >
                                Save
                            </Button>
                            <Grid item className='overflow-y-scroll max-h-96'>
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
                        </Grid>
                        <Grid item container direction='column'>
                            <Typography variant='h4'>Rooms</Typography>
                            <TextField
                                placeholder="Team Members"
                                value={room}
                                onChange={e => setRoom(e.currentTarget.value)}
                            />
                            <Button
                                onClick={handleAddRoom}
                            >
                                Save
                            </Button>
                            <Grid item className='overflow-y-scroll max-h-96'>
                                {roomList.map((room, id) => {
                                    return (
                                        <Grid key={id} item container direction='row' alignItems='center'>
                                            <Typography>
                                                {room}
                                            </Typography>
                                            <Button onClick={() => handleDeleteNurse(id, room)}>
                                                Delete
                                            </Button>
                                        </Grid>
                                    )
                                })}
                            </Grid>
                        </Grid>
                        <Grid item container direction='column'>
                            <Typography variant='h4'>Providers</Typography>
                            <TextField
                                placeholder="Provider Name"
                                value={provider.name}
                                onChange={e => setProvider({ name: e.currentTarget.value, patientCount: provider.patientCount })}
                                error={isProviderNameDuplicate}
                            />
                            <TextField type='number' placeholder="0" value={provider.patientCount} onChange={e => setProvider({ name: provider.name, patientCount: parseInt(e.currentTarget.value) })} />
                            <Button
                                variant="contained"
                                onClick={handleAddProvider}
                                disabled={isProviderNameDuplicate}
                            >
                                Save
                            </Button>
                            <Grid item container className='overflow-y-scroll max-h-96'>
                                {providerList.map((provider, id) => {
                                    return (
                                        <Grid key={id} item container direction='row' alignItems='center' justifyContent='space-between'>
                                            <Typography>
                                                {provider.name}
                                            </Typography>
                                            <Grid item container justifyContent='flex-end' alignItems='center' xs={9}>
                                                <TextField
                                                    type='number'
                                                    value={provider.patientCount}
                                                    onChange={(e) => handleUpdateProviderPatientCount(provider.name, parseInt(e.currentTarget.value))}
                                                    className='w-16'
                                                />
                                                <Typography variant='body1'>patients</Typography>
                                                <Button onClick={() => handleDeleteProvider(id, provider.name)}>
                                                    Delete
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    )
                                })}
                            </Grid>
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
                                    unassignedProviders.length
                                        ? unassignedProviders.map(provider => {
                                            return (
                                                <DraggableProvider key={`provider-${provider.name}`} providerId={provider.name}>{provider.name}: {provider.patientCount}</DraggableProvider>
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
                            <Grid item container direction='row' xs={9} className='pl-6'>
                                {
                                    unassignedRooms.length
                                        ? unassignedRooms.map(room => {
                                            return (
                                                <DraggableRoom key={`room-${room}`} roomId={room} nurseName={null} nurseAssignments={nurseAssignments} />
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
                                nurseList.map((nurse, index) => {
                                    const patientCount = nurseAssignments[nurse] ? nurseAssignments[nurse].reduce((prev, curr) => prev + (curr.provider?.patientCount ?? 0), 0) : 0;
                                    return (
                                        <Grid key={`${index}-${nurse}`}>
                                            <Grid container direction='row' justifyContent='space-between' className='border-b-2'>
                                                <Typography variant='h5' className="w-fit">{nurse}</Typography>
                                                <Typography variant='h5' className={`w-8 text-center border-l-2 ${patientCount <= averagePatientCount ? patientCount === 0 ? 'bg-red-100' : 'bg-green-100' : 'bg-yellow-100'}`}>{patientCount}</Typography>
                                            </Grid>
                                            <RoomZone nurseId={nurse}>
                                                {
                                                    nurseAssignments[nurse] && nurseAssignments[nurse].map((pr, index) => {
                                                        return (
                                                            <DraggableRoom key={`${index}-${room}`} roomId={pr.room} nurseName={nurse} nurseAssignments={nurseAssignments} />
                                                        )
                                                    })
                                                }
                                            </RoomZone>
                                        </Grid>
                                    )
                                })
                            }
                        </Grid>
                    </Grid>
                </Grid>
            </DndContext>
        </main >
    );
}
