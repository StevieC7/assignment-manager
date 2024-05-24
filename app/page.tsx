'use client';
import { Button, Drawer, Grid, Menu, MenuItem, Paper, Select, Snackbar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { FormEvent, MouseEvent, useState } from "react";
import DraggableProvider from "./components/DraggableProvider";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { ArrowDownward, ArrowRight, CheckCircle, Delete, Lock, LockOpen } from "@mui/icons-material";
// @ts-ignore
import * as Papa from 'papaparse';
import RoomZone from "./components/RoomDropzone";
import DraggableRoom from "./components/DraggableRoom";
import { autoAssigner } from "./utils/autoAssigner";
import dayjs, { Dayjs } from "dayjs";
import exportHelper from "./utils/exportHelper";

export type Provider = {
    name: string,
    patientCount: {
        am: {
            inPerson: number,
            virtual: number
        },
        pm: {
            inPerson: number,
            virtual: number
        },
    },
}

export type ShiftSlots = {
    am: Provider | null,
    pm: Provider | null,
};
export type Rooms = Record<string, ShiftSlots>;
export type NurseAssignments = Record<string, Rooms>;

export default function Home() {
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [roomsLocked, setRoomsLocked] = useState<boolean>(false);

    const [dateValue, setDateValue] = useState<Dayjs>(dayjs(new Date()));
    const [nurseTeamName, setNurseTeamName] = useState<string>('');
    const [nurseName, setNurseName] = useState<string>('');
    const [room, setRoom] = useState<string>('');
    const [provider, setProvider] = useState<Provider>({ name: '', patientCount: { am: { inPerson: 0, virtual: 0 }, pm: { inPerson: 0, virtual: 0 } } });

    const [nurseList, setNurseList] = useState<string[]>([]);
    const [roomList, setRoomList] = useState<string[]>([]);
    const [providerList, setProviderList] = useState<Provider[]>([]);

    const [nurseTeamList, setNurseTeamList] = useState<string[]>([]);
    const [nurseTeamChildren, setNurseTeamChildren] = useState<Record<string, (string | null)[]>>({});

    const [roomParents, setRoomParents] = useState<Record<string, string | null>>({});
    const [providerParents, setProviderParents] = useState<Record<string, { am: string | null, pm: string | null }>>({});

    const activeNurseTeams = [...nurseTeamList].filter(nurseTeam => nurseTeamChildren[nurseTeam] && nurseTeamChildren[nurseTeam].length);
    const activeNurses = [...nurseList].filter(nurse => !Object.values(nurseTeamChildren).flat().includes(nurse));
    const allActiveNurseGroupings = [...activeNurseTeams, ...activeNurses];
    const patientTotalAM = providerList.reduce((prev, curr) => prev + curr.patientCount.am.inPerson, 0);
    const patientTotalPM = providerList.reduce((prev, curr) => prev + curr.patientCount.pm.inPerson, 0);
    const averagePatientCountAM = Math.ceil(providerList.reduce((prev, curr) => prev + curr.patientCount.am.inPerson, 0) / allActiveNurseGroupings.length);
    const averagePatientCountPM = Math.ceil(providerList.reduce((prev, curr) => prev + curr.patientCount.pm.inPerson, 0) / allActiveNurseGroupings.length);

    const assignNurses = () => {
        const nurseRecord: NurseAssignments = {};
        for (const nurse of [...nurseList, ...nurseTeamList]) {
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
    let nurseAssignments = assignNurses();

    const unassignedRooms = roomList.filter(room => !roomParents[room]);
    const unassignedProvidersAM = providerList.filter(provider => !providerParents[provider.name]?.am);
    const unassignedProvidersPM = providerList.filter(provider => !providerParents[provider.name]?.pm);

    const assignedPatientTotalAM = Object.values(nurseAssignments).map(room => Object.values(room).map(shiftSlots => shiftSlots?.am?.patientCount?.am?.inPerson ?? 0)).flat().reduce((prev, curr) => prev + curr, 0);
    const assignedPatientTotalPM = Object.values(nurseAssignments).map(room => Object.values(room).map(shiftSlots => shiftSlots?.pm?.patientCount?.pm?.inPerson ?? 0)).flat().reduce((prev, curr) => prev + curr, 0);
    const anyAssignedGreaterThanTargetAM = Object.values(nurseAssignments).map(room => Object.values(room).map(shiftSlots => shiftSlots?.am?.patientCount?.am?.inPerson ?? 0).reduce((prev, curr) => prev + curr)).some(val => val > averagePatientCountAM);
    const anyAssignedGreaterThanTargetPM = Object.values(nurseAssignments).map(room => Object.values(room).map(shiftSlots => shiftSlots?.pm?.patientCount?.pm?.inPerson ?? 0).reduce((prev, curr) => prev + curr)).some(val => val > averagePatientCountPM);

    const isProviderNameDuplicate = provider.name !== '' && providerList.find(existingProvider => existingProvider.name === provider.name) ? true : false;

    const handleAddNurseTeam = (e: FormEvent) => {
        e.preventDefault();
        setNurseTeamList([...nurseTeamList, nurseTeamName]);
        setNurseTeamName('');
    }

    const handleAddNurse = (e: FormEvent) => {
        e.preventDefault();
        setNurseList([...nurseList, nurseName])
        setNurseName('')
    }

    const handleAddNurseToTeam = (nurse: string, nurseTeam: string) => {
        const newNurseTeamChildren = { ...nurseTeamChildren }
        const existingNurseTeamMembers = nurseTeamChildren[nurseTeam];
        if (nurseTeam === '') {
            const nursePreviousTeamEntry = Object.entries(newNurseTeamChildren).find(([nurseTeam, children]) => children.includes(nurse));
            if (nursePreviousTeamEntry) {
                const newPreviousTeamChildrenValue = nursePreviousTeamEntry[1].filter(teamChild => teamChild !== nurse) ?? [];
                if (!newPreviousTeamChildrenValue.length) {
                    delete newNurseTeamChildren[nursePreviousTeamEntry[0]]
                    setNurseTeamChildren(newNurseTeamChildren);
                    return;
                }
                setNurseTeamChildren({ ...newNurseTeamChildren, [nursePreviousTeamEntry[0]]: newPreviousTeamChildrenValue });
                return;
            }
        }
        if (!existingNurseTeamMembers) {
            newNurseTeamChildren[nurseTeam] = [nurse]
        } else {
            newNurseTeamChildren[nurseTeam] = [nurse, ...existingNurseTeamMembers]
        }
        setNurseTeamChildren(newNurseTeamChildren);

        const newRoomParents = { ...roomParents };
        const newProviderParents = { ...providerParents };
        for (const [room, parentNurse] of Object.entries(newRoomParents)) {
            if (parentNurse === nurse) {
                delete newRoomParents[room];
                for (const [provider, { am, pm }] of Object.entries(newProviderParents)) {
                    if (am === room) newProviderParents[provider].am = null;
                    if (pm === room) newProviderParents[provider].pm = null;
                }
            }
        }
        setRoomParents(newRoomParents);
        setProviderParents(newProviderParents);
    }

    const handleAddRoom = (e: FormEvent) => {
        e.preventDefault();
        setRoomList([...roomList, room])
        setRoom('')
    }

    const handleAddProvider = (e: FormEvent) => {
        e.preventDefault();
        setProviderList([...providerList, provider])
        setProvider({ name: '', patientCount: { am: { inPerson: 0, virtual: 0 }, pm: { inPerson: 0, virtual: 0 } } })
        document.getElementById('providerNameInput')?.focus();
    }

    const handleUpdateProviderPatientCount = (name: string, patientCount: Provider['patientCount']) => {
        const foundProviderIndex = providerList.findIndex(provider => provider.name === name);
        if (foundProviderIndex !== -1) {
            const newProviderList = [...providerList];
            newProviderList.splice(foundProviderIndex, 1, { name, patientCount });
            setProviderList(newProviderList);
        }
    }

    const handleDeleteNurse = (nurseToDelete: string) => {
        const newRoomParents = { ...roomParents };
        const newProviderParents = { ...providerParents };
        const newNurseTeamChildren = { ...nurseTeamChildren };
        for (const [room, nurse] of Object.entries(newRoomParents)) {
            if (nurse === nurseToDelete) {
                delete newRoomParents[room]
                for (const [provider, { am, pm }] of Object.entries(newProviderParents)) {
                    if (am === room) newProviderParents[provider].am = null;
                    if (pm === room) newProviderParents[provider].pm = null;
                }
            }
        }
        for (const [team, children] of Object.entries(newNurseTeamChildren)) {
            if (children.includes(nurseToDelete)) {
                const newTeamChildren = children.filter(nurse => nurse !== nurseToDelete);
                newNurseTeamChildren[team] = newTeamChildren;
            }
        }
        const newList = [...nurseList].filter(nurse => nurse !== nurseToDelete);
        setNurseList(newList);
        setRoomParents(newRoomParents);
        setProviderParents(newProviderParents);
        setNurseTeamChildren(newNurseTeamChildren);
    }

    const handleDeleteNurseTeam = (teamToDelete: string) => {
        const newNurseTeamList = [...nurseTeamList].filter(team => team !== teamToDelete);
        setNurseTeamList(newNurseTeamList);
        const newNurseTeamChildren = { ...nurseTeamChildren };
        delete newNurseTeamChildren[teamToDelete];
        setNurseTeamChildren(newNurseTeamChildren);
    }

    const handleDeleteRoom = (id: number) => {
        const newRoomParents = { ...roomParents };
        const newProviderParents = { ...providerParents };
        const roomToDelete = roomList[id];
        delete newRoomParents[roomToDelete];
        for (const [provider, { am, pm }] of Object.entries(newProviderParents)) {
            if (am === roomToDelete) newProviderParents[provider].am = null;
            if (pm === roomToDelete) newProviderParents[provider].pm = null;
        }
        const newList = [...roomList];
        newList.splice(id, 1);
        setRoomList(newList);
        setRoomParents(newRoomParents);
        setProviderParents(newProviderParents);
    }

    const handleDeleteProvider = (id: number) => {
        const newList = [...providerList];
        newList.splice(id, 1);
        setProviderList(newList);
    }

    const handleDragEnd = (event: DragEndEvent) => {
        // over id format: nurse-{nurseName} | nurse-{nurseName}-room-{roomName}-shift-{shiftType}
        // active id format: room-{roomName} | provider-{providerName}-shift-{shiftType}
        const { over, active } = event;
        const splitOver = over && (over.id as string).split('-');
        const overNurse = splitOver && splitOver[1];
        const overRoom = splitOver && splitOver.length > 3 ? splitOver[3] : null;
        const overShift = splitOver && splitOver.length > 5 ? splitOver[5] : null;
        const splitActive = active && (active.id as string).split('-');
        const activeType = splitActive[0];
        const activeValue = splitActive[1];
        const activeShift = splitActive && splitActive.length > 3 ? splitActive[3] : null;
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
                            am: overShift === 'am' ? parentRoom.am : (newSetting[existingProvider]['am'] ?? null)
                            , pm: overShift === 'pm' ? parentRoom.pm : (newSetting[existingProvider]['pm'] ?? null)
                        }
                    };
                }
                setProviderParents(newSetting);
            } else {
                setProviderParents({
                    ...providerParents,
                    [activeValue]: {
                        am: activeShift === 'am' ? null : providerParents[activeValue]['am'],
                        pm: activeShift === 'pm' ? null : providerParents[activeValue]['pm'],
                    }
                })
            }
        } else if (activeType === 'room') {
            if (roomsLocked) {
                setSnackbarMessage('Unlock rooms to make edits.')
                setSnackbarOpen(true)
                return
            }
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
        localStorage.setItem("dateValue", dateValue.toISOString());
        localStorage.setItem("nurses", JSON.stringify(nurseList));
        localStorage.setItem("rooms", JSON.stringify(roomList));
        localStorage.setItem("providers", JSON.stringify(providerList));
        localStorage.setItem("roomParents", JSON.stringify(roomParents));
        localStorage.setItem("providerParents", JSON.stringify(providerParents));
        localStorage.setItem("roomsLocked", JSON.stringify(roomsLocked));
        localStorage.setItem("nurseTeamList", JSON.stringify(nurseTeamList));
        localStorage.setItem("nurseTeamChildren", JSON.stringify(nurseTeamChildren));
    }

    const handleLoadLocal = () => {
        const dateValue = localStorage.getItem("dateValue");
        const nurses = localStorage.getItem("nurses");
        const rooms = localStorage.getItem("rooms");
        const providers = localStorage.getItem("providers");
        const roomParents = localStorage.getItem("roomParents");
        const providerParents = localStorage.getItem("providerParents");
        const roomsLocked = localStorage.getItem("roomsLocked");
        const nurseTeamList = localStorage.getItem("nurseTeamList");
        const nurseTeamChildren = localStorage.getItem("nurseTeamChildren");
        if (dateValue) setDateValue(dayjs(dateValue));
        if (nurses) setNurseList(JSON.parse(nurses));
        if (rooms) setRoomList(JSON.parse(rooms));
        if (providers) setProviderList(JSON.parse(providers));
        if (roomParents) setRoomParents(JSON.parse(roomParents));
        if (providerParents) setProviderParents(JSON.parse(providerParents));
        if (roomsLocked) setRoomsLocked(JSON.parse(roomsLocked));
        if (nurseTeamList) setNurseTeamList(JSON.parse(nurseTeamList));
        if (nurseTeamChildren) setNurseTeamChildren(JSON.parse(nurseTeamChildren));
    }

    const handleExport = () => {
        // TODO: fix this
        const data = exportHelper(nurseAssignments);
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8,' });
        const objUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', objUrl);
        link.setAttribute('download', `schedule_${dayjs(dateValue).format('MM_DD_YYYY')}.csv`);
        link.click();
    }

    const handleAutoAssign = () => {
        const { providerParents, roomParents: newRoomParents, warningMessage } = autoAssigner(allActiveNurseGroupings, roomList, providerList, Object.keys(roomParents).length ? roomParents : undefined);
        if (newRoomParents['undefined']) delete newRoomParents['undefined'];
        setRoomParents(newRoomParents);
        setProviderParents(providerParents);
        if (warningMessage) {
            setSnackbarMessage(warningMessage);
            setSnackbarOpen(true);
        } else {
            setSnackbarMessage('Auto-assign successful!');
            setSnackbarOpen(true);
        }
    }

    enum ResetOptions {
        ALL,
        PROVIDERS,
    }
    const handleOpenMenu = (event: MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    }
    const handleCloseMenu = () => {
        setAnchorEl(null);
    }
    const handleMenuOptions = (item: ResetOptions) => {
        switch (item) {
            case ResetOptions.ALL:
                setRoomParents({});
                setProviderParents({});
                setRoomsLocked(false);
                break;
            case ResetOptions.PROVIDERS:
                setProviderParents({});
                break;
        }
    }

    return (
        <main>
            <DndContext onDragEnd={handleDragEnd}>
                <Grid container direction='row' justifyContent='space-between' alignItems='center' className='bg-black text-white p-4 fixed top-0'>
                    <Typography variant="h1" fontSize={36}>Assignment Manager</Typography>
                    <Grid item>
                        <Button variant="contained" onClick={handleSaveToLocal} className='h-12 mr-4'>Save</Button>
                        <Button variant="contained" onClick={handleLoadLocal} className='h-12'>Load</Button>
                        <Button variant="contained" onClick={handleExport} className='h-12'>Export</Button>
                    </Grid>
                </Grid>
                <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} anchor='right'>
                    <Grid
                        item
                        container
                        direction='column'
                        sx={{ height: 'auto', width: '25rem', padding: '1rem' }}
                    >
                        <Grid item container direction='column' sx={{ mb: '2rem' }}>
                            <Typography variant='h4'>Date</Typography>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    value={dateValue}
                                    onChange={(newVal) => setDateValue(dayjs(newVal))}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item container direction='column' sx={{ mb: '2rem' }}>
                            <Typography variant='h4'>Teams</Typography>
                            <form onSubmit={handleAddNurseTeam}>
                                <Grid item container>
                                    <Grid item container xs={8}>
                                        <TextField
                                            placeholder="Team name"
                                            value={nurseTeamName}
                                            onChange={e => setNurseTeamName(e.currentTarget.value)}
                                            sx={{ width: '100%' }}
                                        />
                                    </Grid>
                                    <Grid item container justifyContent='center' alignItems='center' xs={4}>
                                        <Button
                                            type='submit'
                                            variant='contained'
                                            sx={{ width: '100%', height: '100%' }}
                                        >
                                            Save
                                        </Button>
                                    </Grid>
                                </Grid>
                            </form>
                            <Grid item>
                                {
                                    nurseTeamList.map((nurseTeam, id) => {
                                        return (
                                            <Grid key={id} item container direction='row' alignItems='center'>
                                                <Typography>
                                                    {nurseTeam}
                                                </Typography>
                                                <Button onClick={() => handleDeleteNurseTeam(nurseTeam)}>
                                                    Delete
                                                </Button>
                                            </Grid>
                                        )
                                    })
                                }
                            </Grid>
                            <Typography variant='h4'>Nurses</Typography>
                            <form onSubmit={handleAddNurse}>
                                <Grid item container>
                                    <Grid item container xs={8}>
                                        <TextField
                                            placeholder="Nurse name"
                                            value={nurseName}
                                            onChange={e => setNurseName(e.currentTarget.value)}
                                            sx={{ width: '100%' }}
                                        />
                                    </Grid>
                                    <Grid item container justifyContent='center' alignItems='center' xs={4}>
                                        <Button
                                            type='submit'
                                            variant='contained'
                                            sx={{ width: '100%', height: '100%' }}
                                        >
                                            Save
                                        </Button>
                                    </Grid>
                                </Grid>
                            </form>
                            <Grid item>
                                {
                                    Object.entries(nurseTeamChildren).map(([team, nurses]) => {
                                        if (!nurses.length) return null;
                                        return (
                                            <Grid key={team} item container sx={{ border: '2px solid black', padding: '1rem' }}>
                                                <Typography variant='h5'>{team}</Typography>
                                                {
                                                    nurses.map((nurse, id) => {
                                                        if (!nurse) return null;
                                                        return (
                                                            <Grid key={id} item container direction='row' alignItems='center'>
                                                                <Typography>
                                                                    {nurse}
                                                                </Typography>
                                                                <Select sx={{ width: '5rem' }}>
                                                                    <MenuItem key='none' value='' onClick={() => handleAddNurseToTeam(nurse, '')}>None</MenuItem>
                                                                    {
                                                                        nurseTeamList.map(nurseTeam => {
                                                                            if (nurseTeam === team) return null;
                                                                            return (
                                                                                <MenuItem key={nurseTeam} value={nurseTeam} onClick={() => handleAddNurseToTeam(nurse, nurseTeam)}>{nurseTeam}</MenuItem>
                                                                            )
                                                                        })
                                                                    }
                                                                </Select>
                                                                <Button onClick={() => handleDeleteNurse(nurse)}>
                                                                    Delete
                                                                    {/* TODO: fix delete by passing a unique identifier instead of iterator index */}
                                                                </Button>
                                                            </Grid>
                                                        )

                                                    })
                                                }
                                            </Grid>
                                        )
                                    })
                                }
                                {
                                    nurseList.map((nurse, id) => {
                                        if (Object.values(nurseTeamChildren).flat().includes(nurse)) {
                                            return null;
                                        } else {
                                            return (
                                                <Grid key={id} item container direction='row' alignItems='center'>
                                                    <Typography>
                                                        {nurse}
                                                    </Typography>
                                                    <Select sx={{ width: '5rem' }}>
                                                        {
                                                            nurseTeamList.map(nurseTeam => {
                                                                return (
                                                                    <MenuItem key={nurseTeam} value={nurseTeam} onClick={() => handleAddNurseToTeam(nurse, nurseTeam)}>{nurseTeam}</MenuItem>
                                                                )
                                                            })
                                                        }
                                                    </Select>
                                                    <Button onClick={() => handleDeleteNurse(nurse)}>
                                                        Delete
                                                    </Button>
                                                </Grid>
                                            )
                                        }
                                    })
                                }
                            </Grid>
                        </Grid>
                        <Grid item container direction='column' sx={{ mb: '2rem' }}>
                            <Typography variant='h4'>Rooms</Typography>
                            <form onSubmit={handleAddRoom}>
                                <Grid item container>
                                    <Grid item container xs={8}>
                                        <TextField
                                            placeholder="Room Name"
                                            value={room}
                                            onChange={e => setRoom(e.currentTarget.value)}
                                            sx={{ width: '100%' }}
                                        />
                                    </Grid>
                                    <Grid item container justifyContent='center' alignItems='center' xs={4}>
                                        <Button
                                            type='submit'
                                            variant='contained'
                                            sx={{ width: '100%', height: '100%' }}
                                        >
                                            Save
                                        </Button>
                                    </Grid>
                                </Grid>
                            </form>
                            <Grid item>
                                {
                                    roomList.map((room, id) => {
                                        return (
                                            <Grid key={id} item container direction='row' alignItems='center'>
                                                <Typography>
                                                    {room}
                                                </Typography>
                                                <Button onClick={() => handleDeleteRoom(id)}>
                                                    Delete
                                                </Button>
                                            </Grid>
                                        )
                                    })
                                }
                            </Grid>
                        </Grid>
                        <Grid item container direction='column'>
                            <form onSubmit={handleAddProvider}>
                                <Typography variant='h4'>Providers</Typography>
                                <TextField
                                    id='providerNameInput'
                                    placeholder="Provider Name"
                                    value={provider.name}
                                    onChange={e => setProvider({ name: e.currentTarget.value, patientCount: provider.patientCount })}
                                    error={isProviderNameDuplicate}
                                />
                                <Grid container>
                                    <Grid item container xs={6}>
                                        <Grid item xs={6}>
                                            <TextField
                                                type='number'
                                                placeholder="AM Patients"
                                                value={provider.patientCount.am.inPerson}
                                                onChange={e => setProvider({
                                                    name: provider.name,
                                                    patientCount: {
                                                        am: {
                                                            ...provider.patientCount.am,
                                                            inPerson: parseInt(e.currentTarget.value)
                                                        },
                                                        pm: provider.patientCount.pm
                                                    }
                                                })}
                                            />
                                        </Grid>
                                        <Grid item container justifyContent='center' alignItems='center' xs={6}>
                                            AM
                                        </Grid>
                                    </Grid>
                                    <Grid item container xs={6}>
                                        <Grid item xs={6}>
                                            <TextField
                                                type='number'
                                                placeholder="PM Patients"
                                                value={provider.patientCount.pm.inPerson}
                                                onChange={e => setProvider({
                                                    name: provider.name,
                                                    patientCount: {
                                                        am: provider.patientCount.am,
                                                        pm: {
                                                            ...provider.patientCount.pm,
                                                            inPerson: parseInt(e.currentTarget.value)
                                                        }
                                                    }
                                                })}
                                            />
                                        </Grid>
                                        <Grid item container justifyContent='center' alignItems='center' xs={6}>
                                            PM
                                        </Grid>
                                    </Grid>
                                </Grid>
                                <Grid container>
                                    <Grid item container xs={6}>
                                        <Grid item xs={6}>
                                            <TextField
                                                type='number'
                                                placeholder="AM Patients"
                                                value={provider.patientCount.am.virtual}
                                                onChange={e => setProvider({
                                                    name: provider.name,
                                                    patientCount: {
                                                        am: {
                                                            ...provider.patientCount.am,
                                                            virtual: parseInt(e.currentTarget.value)
                                                        },
                                                        pm: provider.patientCount.pm
                                                    }
                                                })}
                                            />
                                        </Grid>
                                        <Grid item container justifyContent='center' alignItems='center' xs={6}>
                                            AM Virtual
                                        </Grid>
                                    </Grid>
                                    <Grid item container xs={6}>
                                        <Grid item xs={6}>
                                            <TextField
                                                type='number'
                                                placeholder="PM Patients"
                                                value={provider.patientCount.pm.virtual}
                                                onChange={e => setProvider({
                                                    name: provider.name,
                                                    patientCount: {
                                                        am: provider.patientCount.am,
                                                        pm: {
                                                            ...provider.patientCount.pm,
                                                            virtual: parseInt(e.currentTarget.value)
                                                        }
                                                    }
                                                })}
                                            />
                                        </Grid>
                                        <Grid item container justifyContent='center' alignItems='center' xs={6}>
                                            PM Virtual
                                        </Grid>
                                    </Grid>
                                </Grid>
                                <Button
                                    variant="contained"
                                    type='submit'
                                    disabled={isProviderNameDuplicate}
                                    className='mb-6'
                                >
                                    Save
                                </Button>
                            </form>
                            <Grid item container>
                                {providerList.map((provider, id) => {
                                    return (
                                        <Grid key={id} item container direction='column' alignItems='center' justifyContent='space-between' className='mb-6 border-2 p-2'>
                                            <Grid item container justifyContent='space-between' sx={{ mb: '1rem' }}>
                                                <Typography variant='h5'>
                                                    {provider.name}
                                                </Typography>
                                                <Delete color='warning' onMouseDown={() => handleDeleteProvider(id)} sx={{ cursor: 'pointer' }} />
                                            </Grid>
                                            <Grid item container justifyContent='space-between' alignItems='center'>
                                                <TextField
                                                    type='number'
                                                    value={provider.patientCount.am.inPerson}
                                                    onChange={(e) => handleUpdateProviderPatientCount(provider.name, { am: { ...provider.patientCount.am, inPerson: parseInt(e.currentTarget.value) }, pm: provider.patientCount.pm })}
                                                    InputProps={{ sx: { height: '2rem', width: '4rem' } }}
                                                />
                                                <Typography variant='body1'>AM patients</Typography>
                                                <TextField
                                                    type='number'
                                                    value={provider.patientCount.pm.inPerson}
                                                    onChange={(e) => handleUpdateProviderPatientCount(provider.name, { am: provider.patientCount.am, pm: { ...provider.patientCount.pm, inPerson: parseInt(e.currentTarget.value) } })}
                                                    InputProps={{ sx: { height: '2rem', width: '4rem' } }}
                                                />
                                                <Typography variant='body1'>PM patients</Typography>
                                            </Grid>
                                            <Grid item container justifyContent='space-between' alignItems='center'>
                                                <TextField
                                                    type='number'
                                                    value={provider.patientCount.am.virtual}
                                                    onChange={(e) => handleUpdateProviderPatientCount(provider.name, { am: { ...provider.patientCount.am, virtual: parseInt(e.currentTarget.value) }, pm: provider.patientCount.pm })}
                                                    InputProps={{ sx: { height: '2rem', width: '4rem' } }}
                                                />
                                                <Typography variant='body1'>AM virtual</Typography>
                                                <TextField
                                                    type='number'
                                                    value={provider.patientCount.pm.virtual}
                                                    onChange={(e) => handleUpdateProviderPatientCount(provider.name, { am: provider.patientCount.am, pm: { ...provider.patientCount.pm, virtual: parseInt(e.currentTarget.value) } })}
                                                    InputProps={{ sx: { height: '2rem', width: '4rem' } }}
                                                />
                                                <Typography variant='body1'>PM virtual</Typography>
                                            </Grid>
                                        </Grid>
                                    )
                                })}
                            </Grid>
                        </Grid>
                    </Grid>
                </Drawer>
                <Grid
                    container
                    direction='row'
                    sx={{ position: 'absolute', top: '80px', zIndex: -1 }}
                >
                    <Grid item direction='column' xs={9} sx={{ padding: '1rem' }}>
                        <Grid item container direction='row' alignItems='center'>
                            <Typography variant='h4'>Summary</Typography>
                            {dayjs(dateValue).format('MM/DD/YYYY')}
                        </Grid>
                        {/* ----CONDENSED VIEW---- */}
                        <TableContainer sx={{ maxWidth: '100%' }} component={Paper}>
                            <Table size='small'>
                                <TableHead>
                                    <TableRow>
                                        <TableCell></TableCell>
                                        <TableCell sx={{ backgroundColor: '#eeeeee', fontWeight: 'bold' }}>Total</TableCell>
                                        <TableCell sx={{ backgroundColor: '#eeeeee', fontWeight: 'bold' }}>Assigned</TableCell>
                                        <TableCell sx={{ backgroundColor: '#eeeeee', fontWeight: 'bold' }}>Pt/Team</TableCell>
                                        {
                                            activeNurseTeams.map((nurseTeam, index) => {
                                                return (
                                                    <TableCell key={'nurse-team' + index}>{nurseTeam}</TableCell>
                                                )
                                            })
                                        }
                                        {
                                            activeNurses.map((nurse, index) => {
                                                return (
                                                    <TableCell key={'nurse' + index}>{nurse}</TableCell>
                                                )
                                            })
                                        }
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow>
                                        <TableCell sx={{ backgroundColor: '#eeeeee', fontWeight: 'bold' }}>AM</TableCell>
                                        <TableCell>{patientTotalAM}</TableCell>
                                        <TableCell className={`${assignedPatientTotalAM < patientTotalAM ? 'bg-yellow-100' : 'bg-inherit'}`}>{assignedPatientTotalAM}</TableCell>
                                        <TableCell className={`${anyAssignedGreaterThanTargetAM ? 'bg-yellow-100' : 'bg-inherit'}`}>{averagePatientCountAM}</TableCell>
                                        {
                                            activeNurseTeams.map((nurseTeam, index) => {
                                                const nurseProviders = nurseAssignments[nurseTeam] ? Object.entries(nurseAssignments[nurseTeam]).map(([_, provider]) => provider) : [];
                                                const patientCountAM = nurseAssignments[nurseTeam] ? nurseProviders.reduce((prev, curr) => prev + (curr?.am?.patientCount?.am?.inPerson ?? 0), 0) : 0;
                                                return (
                                                    <TableCell className={`${patientCountAM > averagePatientCountAM ? 'bg-yellow-100' : 'bg-inherit'}`} key={index}>{patientCountAM}</TableCell>
                                                )
                                            })
                                        }
                                        {
                                            activeNurses.map((nurse, index) => {
                                                const nurseProviders = nurseAssignments[nurse] ? Object.entries(nurseAssignments[nurse]).map(([_, provider]) => provider) : [];
                                                const patientCountAM = nurseAssignments[nurse] ? nurseProviders.reduce((prev, curr) => prev + (curr?.am?.patientCount?.am?.inPerson ?? 0), 0) : 0;
                                                return (
                                                    <TableCell className={`${patientCountAM > averagePatientCountAM ? 'bg-yellow-100' : 'bg-inherit'}`} key={index}>{patientCountAM}</TableCell>
                                                )
                                            })
                                        }
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ backgroundColor: '#eeeeee', fontWeight: 'bold' }}>PM</TableCell>
                                        <TableCell>{patientTotalPM}</TableCell>
                                        <TableCell className={`${assignedPatientTotalPM < patientTotalPM ? 'bg-yellow-100' : 'bg-inherit'}`}>{assignedPatientTotalPM}</TableCell>
                                        <TableCell className={`${anyAssignedGreaterThanTargetPM ? 'bg-yellow-100' : 'bg-inherit'}`}>{averagePatientCountPM}</TableCell>
                                        {
                                            activeNurseTeams.map((nurseTeam, index) => {
                                                const nurseProviders = nurseAssignments[nurseTeam] ? Object.entries(nurseAssignments[nurseTeam]).map(([_, provider]) => provider) : [];
                                                const patientCountPM = nurseAssignments[nurseTeam] ? nurseProviders.reduce((prev, curr) => prev + (curr?.pm?.patientCount?.pm?.inPerson ?? 0), 0) : 0;
                                                return (
                                                    <TableCell className={`${patientCountPM > averagePatientCountPM ? 'bg-yellow-100' : 'bg-inherit'}`} key={index}>{patientCountPM}</TableCell>
                                                )
                                            })
                                        }
                                        {
                                            activeNurses.map((nurse, index) => {
                                                const nurseProviders = nurseAssignments[nurse] ? Object.entries(nurseAssignments[nurse]).map(([_, provider]) => provider) : [];
                                                const patientCountPM = nurseAssignments[nurse] ? nurseProviders.reduce((prev, curr) => prev + (curr?.pm?.patientCount?.pm?.inPerson ?? 0), 0) : 0;
                                                return (
                                                    <TableCell className={`${patientCountPM > averagePatientCountPM ? 'bg-yellow-100' : 'bg-inherit'}`} key={index}>{patientCountPM}</TableCell>
                                                )
                                            })
                                        }
                                    </TableRow>
                                    <TableRow sx={{ borderTop: '2px solid black' }}>
                                        <TableCell sx={{ backgroundColor: '#eeeeee', fontWeight: 'bold' }}>Total</TableCell>
                                        <TableCell>{patientTotalAM + patientTotalPM}</TableCell>
                                        <TableCell className={`${assignedPatientTotalPM + assignedPatientTotalAM < patientTotalPM + patientTotalAM ? 'bg-yellow-100' : 'bg-inherit'}`}>{assignedPatientTotalPM + assignedPatientTotalAM}</TableCell>
                                        <TableCell>{Math.ceil((assignedPatientTotalAM + assignedPatientTotalPM) / allActiveNurseGroupings.length)}</TableCell>
                                        {
                                            activeNurseTeams.map((nurseTeam, index) => {
                                                const nurseProviders = nurseAssignments[nurseTeam] ? Object.entries(nurseAssignments[nurseTeam]).map(([_, provider]) => provider) : [];
                                                const patientCountTotal = nurseAssignments[nurseTeam] ? nurseProviders.reduce((prev, curr) => prev + (curr?.am?.patientCount?.am?.inPerson ?? 0) + (curr?.pm?.patientCount?.pm?.inPerson ?? 0), 0) : 0;
                                                return (
                                                    <TableCell key={index}>{patientCountTotal}</TableCell>
                                                )
                                            })
                                        }
                                        {
                                            activeNurses.map((nurse, index) => {
                                                const nurseProviders = nurseAssignments[nurse] ? Object.entries(nurseAssignments[nurse]).map(([_, provider]) => provider) : [];
                                                const patientCountTotal = nurseAssignments[nurse] ? nurseProviders.reduce((prev, curr) => prev + (curr?.am?.patientCount?.am?.inPerson ?? 0) + (curr?.pm?.patientCount?.pm?.inPerson ?? 0), 0) : 0;
                                                return (
                                                    <TableCell key={index}>{patientCountTotal}</TableCell>
                                                )
                                            })
                                        }
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                        {/* ----END CONDENSED VIEW---- */}
                        <Typography variant='h4' className='pl-5 mb-2'>Assignments</Typography>
                        <Grid
                            item
                            container
                            direction='row'
                            xs={12}
                        >
                            {
                                activeNurseTeams.map((nurse, index) => {
                                    const nurseProviders = nurseAssignments[nurse] ? Object.entries(nurseAssignments[nurse]).map(([_, provider]) => provider) : [];
                                    const patientCountAM = nurseAssignments[nurse] ? nurseProviders.reduce((prev, curr) => prev + (curr?.am?.patientCount?.am?.inPerson ?? 0), 0) : 0;
                                    const patientCountPM = nurseAssignments[nurse] ? nurseProviders.reduce((prev, curr) => prev + (curr?.pm?.patientCount?.pm?.inPerson ?? 0), 0) : 0;
                                    return (
                                        <Grid key={`${index}-${nurse}`} item container className='ml-6 mb-6 p-6 w-4/12 min-w-96 max-w-lg bg-white' direction='column'>
                                            <Typography variant='h5' className="w-fit">{nurse}</Typography>
                                            <Grid container>
                                                {
                                                    nurseTeamChildren[nurse].map((teamMember, index) => (
                                                        <Grid key={teamMember} item mr={1}>{index > 0 ? `/ ${teamMember}` : teamMember}</Grid>
                                                    ))
                                                }
                                            </Grid>
                                            <Grid item container direction='row'>
                                                <Grid item xs={4}></Grid>
                                                {
                                                    patientCountAM > 0
                                                        ? (
                                                            <Grid item container xs={4} justifyContent='space-between'>
                                                                AM
                                                                <Typography className={`w-8 text-center border-1-2 ${patientCountAM <= averagePatientCountAM ? patientCountAM === 0 ? 'bg-red-100' : 'bg-green-100' : 'bg-yellow-100'}`}>{patientCountAM}</Typography>
                                                            </Grid>
                                                        )
                                                        : <Grid item xs={4} />
                                                }
                                                {
                                                    patientCountPM > 0
                                                        ? (
                                                            <Grid item container xs={4} justifyContent='space-between'>
                                                                PM
                                                                <Typography className={`w-8 text-center border-1-2 ${patientCountPM <= averagePatientCountPM ? patientCountPM === 0 ? 'bg-red-100' : 'bg-green-100' : 'bg-yellow-100'}`}>{patientCountPM}</Typography>
                                                            </Grid>
                                                        )
                                                        : <Grid item xs={4} />
                                                }
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
                            {
                                activeNurses.map((nurse, index) => {
                                    const nurseProviders = nurseAssignments[nurse] ? Object.entries(nurseAssignments[nurse]).map(([_, provider]) => provider) : [];
                                    const patientCountAM = nurseAssignments[nurse] ? nurseProviders.reduce((prev, curr) => prev + (curr?.am?.patientCount?.am?.inPerson ?? 0), 0) : 0;
                                    const patientCountPM = nurseAssignments[nurse] ? nurseProviders.reduce((prev, curr) => prev + (curr?.pm?.patientCount?.pm?.inPerson ?? 0), 0) : 0;
                                    return (
                                        <Grid key={`${index}-${nurse}`} item container className='ml-6 mb-6 p-6 w-4/12 min-w-96 max-w-lg bg-white' direction='column'>
                                            <Typography variant='h5' className="w-fit">{nurse}</Typography>
                                            <Grid item container direction='row'>
                                                <Grid item xs={4}></Grid>
                                                {
                                                    patientCountAM > 0
                                                        ? (
                                                            <Grid item container xs={4} justifyContent='space-between'>
                                                                AM
                                                                <Typography className={`w-8 text-center border-1-2 ${patientCountAM <= averagePatientCountAM ? patientCountAM === 0 ? 'bg-red-100' : 'bg-green-100' : 'bg-yellow-100'}`}>{patientCountAM}</Typography>
                                                            </Grid>
                                                        )
                                                        : <Grid item xs={4} />
                                                }
                                                {
                                                    patientCountPM > 0
                                                        ? (
                                                            <Grid item container xs={4} justifyContent='space-between'>
                                                                PM
                                                                <Typography className={`w-8 text-center border-1-2 ${patientCountPM <= averagePatientCountPM ? patientCountPM === 0 ? 'bg-red-100' : 'bg-green-100' : 'bg-yellow-100'}`}>{patientCountPM}</Typography>
                                                            </Grid>
                                                        )
                                                        : <Grid item xs={4} />
                                                }
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
                    <Grid item container direction='column' xs={3} sx={{ paddingTop: '1rem', paddingRight: '1rem' }}>
                        <Grid item container direction='column'>
                            <Button onClick={() => setDrawerOpen(true)} variant='contained' color='primary' className='mb-6' endIcon={<ArrowRight />}>
                                Staff Setup
                            </Button>
                        </Grid>
                        <Grid item container mb={'2rem'}>
                            <Grid item xs={6}>
                                <Button variant='outlined' color='warning' endIcon={<ArrowDownward />} onClick={e => handleOpenMenu(e)} sx={{ height: '3rem', width: '90%' }}>
                                    Reset
                                </Button>
                                <Menu open={!!anchorEl} anchorEl={anchorEl} onClose={handleCloseMenu}>
                                    <MenuItem onClick={() => handleMenuOptions(ResetOptions.PROVIDERS)}>
                                        Reset Providers
                                    </MenuItem>
                                    <MenuItem onClick={() => handleMenuOptions(ResetOptions.ALL)}>
                                        Reset All
                                    </MenuItem>
                                </Menu>
                            </Grid>
                            <Grid item xs={6}>
                                <Button
                                    variant='outlined'
                                    onClick={handleAutoAssign}
                                    sx={{ height: '3rem', width: '90%', ml: '10%' }}
                                >
                                    Quick-fill
                                </Button>
                            </Grid>
                        </Grid>
                        <Grid item container justifyContent='space-between' mb={'2rem'}>
                            <Typography variant='h4'>Rooms</Typography>
                            {
                                roomsLocked
                                    ? <Lock onMouseDown={() => setRoomsLocked(false)} sx={{ cursor: 'pointer' }} />
                                    : <LockOpen onMouseDown={() => setRoomsLocked(true)} sx={{ cursor: 'pointer' }} />
                            }
                        </Grid>
                        <Grid item container direction='row' mb={'2rem'}>
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
                        <Typography variant='h4' mb={'2rem'}>AM Providers</Typography>
                        <Grid item container mb={'2rem'}>
                            {
                                unassignedProvidersAM.length
                                    ? unassignedProvidersAM.map(provider => {
                                        return (
                                            <DraggableProvider key={`provider-${provider.name}-am`} providerId={provider.name} shift='am'>{provider.name}: {provider.patientCount.am?.inPerson}</DraggableProvider>
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
                        <Typography variant='h4' mb={'2rem'}>PM Providers</Typography>
                        <Grid item container>
                            {
                                unassignedProvidersPM.length
                                    ? unassignedProvidersPM.map(provider => {
                                        return (
                                            <DraggableProvider key={`provider-${provider.name}-pm`} providerId={provider.name} shift='pm'>{provider.name}: {provider.patientCount.pm?.inPerson}</DraggableProvider>
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
                    </Grid>
                    <Snackbar
                        open={snackbarOpen}
                        autoHideDuration={5000}
                        onClose={() => {
                            setSnackbarOpen(false)
                            setSnackbarMessage('')
                        }}
                        message={snackbarMessage}
                    />
                </Grid>
            </DndContext>
        </main >
    );
}
