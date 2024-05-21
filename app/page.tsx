// TODO: split average patient count into AM and PM
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
import { autoAssigner } from "./utils/algo";

export type Provider = {
    name: string,
    patientCount: {
        am: number,
        pm: number,
    },
}

export type ShiftSlots = {
    am: Provider | null,
    pm: Provider | null,
};
export type Rooms = Record<string, ShiftSlots>;
export type NurseAssignments = Record<string, Rooms>;

export default function Home() {
    const [nurseName, setNurseName] = useState<string>('');
    const [room, setRoom] = useState<string>('');
    const [provider, setProvider] = useState<Provider>({ name: '', patientCount: { am: 0, pm: 0 } });

    const [nurseList, setNurseList] = useState<string[]>([]);
    const [roomList, setRoomList] = useState<string[]>([]);
    const [providerList, setProviderList] = useState<Provider[]>([]);

    const [roomParents, setRoomParents] = useState<Record<string, string | null>>({});
    const [providerParents, setProviderParents] = useState<Record<string, { am: string | null, pm: string | null }>>({});

    const averagePatientCountAM = Math.ceil(providerList.reduce((prev, curr) => prev + curr.patientCount.am, 0) / nurseList.length);
    const averagePatientCountPM = Math.ceil(providerList.reduce((prev, curr) => prev + curr.patientCount.pm, 0) / nurseList.length);
    const assignNurses = () => {
        const nurseRecord: NurseAssignments = {};
        for (const nurse of nurseList) {
            for (const [room, roomParent] of Object.entries(roomParents)) {
                if (roomParent === nurse) {
                    if (!nurseRecord[nurse]) nurseRecord[nurse] = {};
                    nurseRecord[nurse][room] = { am: null, pm: null };
                    for (const [provider, providerParent] of Object.entries(providerParents)) {
                        for (const shiftSlot of Object.keys(providerParent) as ('am' | 'pm')[]) {
                            if (providerParent[shiftSlot] === room) {
                                nurseRecord[nurse][room][shiftSlot] = providerList.find(prov => prov.name === provider) ?? null;
                            }
                        }
                    }
                }
            }
        }
        return nurseRecord;
    }
    const nurseAssignments = assignNurses();

    const unassignedRooms = roomList.filter(room => !roomParents[room]);
    const unassignedProvidersAM = providerList.filter(provider => !providerParents[provider.name]?.am);
    const unassignedProvidersPM = providerList.filter(provider => !providerParents[provider.name]?.pm);

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
        setProvider({ name: '', patientCount: { am: 0, pm: 0 } })
    }

    const handleUpdateProviderPatientCount = (name: string, patientCount: { am: number, pm: number }) => {
        const foundProviderIndex = providerList.findIndex(provider => provider.name === name);
        if (foundProviderIndex !== -1) {
            const newProviderList = [...providerList];
            newProviderList.splice(foundProviderIndex, 1, { name, patientCount });
            setProviderList(newProviderList);
        }
    }

    const handleDeleteNurse = (id: number, name: string) => {
        const newList = [...nurseList];
        newList.splice(id, 1);
        setNurseList(newList);
    }

    const handleDeleteProvider = (id: number, name: string) => {
        const newList = [...providerList];
        newList.splice(id, 1);
        setProviderList(newList);
    }

    const handleDragEnd = (event: DragEndEvent) => {
        // over id format: nurse-{nurseName} | nurse-{nurseName}-room-{roomName}-shift-{shiftType}
        // active id format: room-{roomName} | provider-{providerName}
        const { over, active } = event;
        const splitOver = over && (over.id as string).split('-');
        const overNurse = splitOver && splitOver[1];
        const overRoom = splitOver && splitOver.length > 3 ? splitOver[3] : null;
        const overShift = splitOver && splitOver.length > 5 ? splitOver[5] : null;
        const splitActive = active && (active.id as string).split('-');
        const activeType = splitActive[0];
        const activeValue = splitActive[1];
        if (active && overRoom === null && activeType === 'provider' && !providerParents[activeValue]) {
            return;
        }
        if (activeType === 'provider') {
            const parentRoom = providerParents[activeValue];
            if (over && parentRoom && overShift && overRoom === parentRoom[overShift as 'am' | 'pm']) {
                return;
            }
            if (overNurse && overRoom) {
                const existingProvider = Object.entries(providerParents)?.find(([providerName, room]) => room[overShift as 'am' | 'pm'] === overRoom)?.[0];
                let newSetting = {
                    ...providerParents
                    , [activeValue]: {
                        am: overShift === 'am' ? overRoom : (providerParents[activeValue] ? providerParents[activeValue]['am'] : null)
                        , pm: overShift === 'pm' ? overRoom : (providerParents[activeValue] ? providerParents[activeValue]['pm'] : null)
                    }
                }
                if (existingProvider) {
                    newSetting = {
                        ...newSetting
                        , [existingProvider]: {
                            am: overShift === 'am' ? null : (newSetting[existingProvider]['am'] ?? null)
                            , pm: overShift === 'pm' ? null : (newSetting[existingProvider]['pm'] ?? null)
                        }
                    };
                }
                setProviderParents(newSetting);
            } else {
                setProviderParents({
                    ...providerParents,
                    [activeValue]: {
                        am: null,
                        pm: null,
                    }
                })
            }
        } else if (activeType === 'room') {
            const parentNurse = roomParents[activeValue];
            if (over && parentNurse && overNurse === parentNurse) {
                return;
            }
            if (overNurse) {
                setRoomParents({ ...roomParents, [activeValue]: overNurse })
            } else {
                if (parentNurse) {
                    // Handle providers attached to rooms
                    setRoomParents({ ...roomParents, [activeValue]: null })
                    const dependentProviders = Object.entries(providerParents)?.filter(([providerName, room]) => room[overShift as 'am' | 'pm'] === activeValue).map(tuple => tuple[0])
                    let newProviderParents = { ...providerParents };
                    dependentProviders.forEach(provider => {
                        newProviderParents[provider] = { am: null, pm: null };
                    })
                    setProviderParents(newProviderParents);
                }
            }
        }

    }

    const handleSaveToLocal = () => {
        localStorage.setItem("nurses", JSON.stringify(nurseList));
        localStorage.setItem("rooms", JSON.stringify(roomList));
        localStorage.setItem("providers", JSON.stringify(providerList));
        localStorage.setItem("roomParents", JSON.stringify(roomParents));
        localStorage.setItem("providerParents", JSON.stringify(providerParents));
    }

    const handleLoadLocal = () => {
        const nurses = localStorage.getItem("nurses");
        const rooms = localStorage.getItem("rooms");
        const providers = localStorage.getItem("providers");
        const roomParents = localStorage.getItem("roomParents");
        const providerParents = localStorage.getItem("providerParents");
        if (nurses) setNurseList(JSON.parse(nurses));
        if (rooms) setRoomList(JSON.parse(rooms));
        if (providers) setProviderList(JSON.parse(providers));
        if (roomParents) setRoomParents(JSON.parse(roomParents));
        if (providerParents) setProviderParents(JSON.parse(providerParents));
    }

    const handleExport = () => {
        // TODO: fix this
        // const data = {
        //     fields: ['Nurse', 'Provider', 'Patient Count'],
        //     data: Object.entries(nurseAssignments).map(assignmentTuple => [assignmentTuple[0], assignmentTuple[1].map(assignment => assignment.provider?.name), assignmentTuple[1].map(assignment => assignment.provider?.patientCount)])
        // }
        // const csv = Papa.unparse(data);
        // const blob = new Blob([csv], { type: 'text/csv;charset=utf-8,' });
        // const objUrl = URL.createObjectURL(blob);
        // const link = document.createElement('a');
        // link.setAttribute('href', objUrl);
        // link.setAttribute('download', 'schedule.csv');
        // link.click();
    }

    const handleAutoAssign = () => {
        // TODO: fix this
        // const { roomAssignments } = providerMatcher(nurseList, providerList, roomList, averagePatientCount);
        // setNurseAssignments(roomAssignments);
    }

    const handleResetAssignments = () => {
        setRoomParents({});
        setProviderParents({});
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
                            <TextField type='number' placeholder="0" value={provider.patientCount.am} onChange={e => setProvider({ name: provider.name, patientCount: { am: parseInt(e.currentTarget.value), pm: provider.patientCount.pm } })} />
                            <TextField type='number' placeholder="0" value={provider.patientCount.pm} onChange={e => setProvider({ name: provider.name, patientCount: { am: provider.patientCount.am, pm: parseInt(e.currentTarget.value) } })} />
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
                                                    value={provider.patientCount.am}
                                                    onChange={(e) => handleUpdateProviderPatientCount(provider.name, { am: parseInt(e.currentTarget.value), pm: provider.patientCount.pm })}
                                                    className='w-16'
                                                />
                                                <Typography variant='body1'>AM patients</Typography>
                                                <TextField
                                                    type='number'
                                                    value={provider.patientCount.pm}
                                                    onChange={(e) => handleUpdateProviderPatientCount(provider.name, { am: provider.patientCount.am, pm: parseInt(e.currentTarget.value) })}
                                                    className='w-16'
                                                />
                                                <Typography variant='body1'>PM patients</Typography>
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
                                    unassignedProvidersAM.length
                                        ? unassignedProvidersAM.map(provider => {
                                            return (
                                                <DraggableProvider key={`provider-${provider.name}-am`} providerId={provider.name} shift='am'>{provider.name}: {provider.patientCount.am}</DraggableProvider>
                                            )
                                        })
                                        : (
                                            <>
                                                <CheckCircle className='text-green-500' />
                                                <Typography>All Assigned</Typography>
                                            </>
                                        )
                                }
                                {
                                    unassignedProvidersPM.length
                                        ? unassignedProvidersPM.map(provider => {
                                            return (
                                                <DraggableProvider key={`provider-${provider.name}-pm`} providerId={provider.name} shift='pm'>{provider.name}: {provider.patientCount.pm}</DraggableProvider>
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
                                                <DraggableRoom key={`room-${room}`} roomId={room} nurseName={null} nurseAssignments={nurseAssignments} isMinimized />
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
                        <Typography variant='h4' className='pl-6 mb-4'>Target patient count AM: {averagePatientCountAM}</Typography>
                        <Typography variant='h4' className='pl-6 mb-4'>Target patient count PM: {averagePatientCountPM}</Typography>
                        <Grid
                            item
                            container
                            direction='row'
                            xs={12}
                        >
                            {
                                nurseList.map((nurse, index) => {
                                    const nurseProviders = nurseAssignments[nurse] ? Object.entries(nurseAssignments[nurse]).map(([_, provider]) => provider) : [];
                                    const patientCount = nurseAssignments[nurse] ? nurseProviders.reduce((prev, curr) => prev + (curr?.am?.patientCount?.am ?? 0) + (curr?.pm?.patientCount?.pm ?? 0), 0) : 0;
                                    return (
                                        <Grid key={`${index}-${nurse}`}>
                                            <Grid container direction='row' justifyContent='space-between' className='border-b-2'>
                                                <Typography variant='h5' className="w-fit">{nurse}</Typography>
                                                <Typography variant='h5' className={`w-8 text-center border-l-2 ${patientCount <= averagePatientCountAM + averagePatientCountPM ? patientCount === 0 ? 'bg-red-100' : 'bg-green-100' : 'bg-yellow-100'}`}>{patientCount}</Typography>
                                            </Grid>
                                            <RoomZone nurseId={nurse}>
                                                {
                                                    nurseAssignments[nurse] && Object.keys(nurseAssignments[nurse]).map((room, index) => {
                                                        return (
                                                            <DraggableRoom key={`${index}-${room}`} roomId={room} nurseName={nurse} nurseAssignments={nurseAssignments} />
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
