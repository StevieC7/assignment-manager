import dayjs, { Dayjs } from "dayjs"
import { Dispatch, FormEvent, useState } from "react"
import { Provider } from "../page"
import { Button, Drawer, Grid, MenuItem, Select, TextField, Typography } from "@mui/material"
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import { Delete } from "@mui/icons-material"

type Props = {
    open: boolean
    setOpen: Dispatch<boolean>
    dateValue: Dayjs
    setDateValue: Dispatch<Dayjs>
    nurseTeamList: string[]
    setNurseTeamList: Dispatch<string[]>
    nurseList: string[]
    setNurseList: Dispatch<string[]>
    nurseTeamChildren: Record<string, (string | null)[]>
    setNurseTeamChildren: Dispatch<Record<string, (string | null)[]>>
    roomList: string[]
    setRoomList: Dispatch<string[]>
    providerList: Provider[]
    setProviderList: Dispatch<Provider[]>
    roomParents: Record<string, string | null>
    setRoomParents: Dispatch<Record<string, string | null>>
    providerParents: Record<string, { am: string | null, pm: string | null }>
    setProviderParents: Dispatch<Record<string, { am: string | null, pm: string | null }>>
}

export default function StaffSetupSidebar({
    open,
    setOpen,
    dateValue,
    setDateValue,
    nurseTeamList,
    setNurseTeamList,
    nurseList,
    setNurseList,
    nurseTeamChildren,
    setNurseTeamChildren,
    roomList,
    setRoomList,
    providerList,
    setProviderList,
    roomParents,
    setRoomParents,
    providerParents,
    setProviderParents
}: Props) {

    const [nurseTeamName, setNurseTeamName] = useState<string>('');
    const [nurseName, setNurseName] = useState<string>('');
    const [room, setRoom] = useState<string>('');
    const [provider, setProvider] = useState<Provider>({ name: '', patientCount: { am: { inPerson: 0, virtual: 0 }, pm: { inPerson: 0, virtual: 0 } } });

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
        const nursePreviousTeamEntry = Object.entries(newNurseTeamChildren).find(([_, children]) => children.includes(nurse));
        if (nursePreviousTeamEntry) {
            const newPreviousTeamChildrenValue = nursePreviousTeamEntry[1].filter(teamChild => teamChild !== nurse) ?? [];
            if (!newPreviousTeamChildrenValue.length) {
                delete newNurseTeamChildren[nursePreviousTeamEntry[0]]
                if (!nurseTeam) {
                    setNurseTeamChildren(newNurseTeamChildren);
                    return;
                }
            } else {
                newNurseTeamChildren[nursePreviousTeamEntry[0]] = newPreviousTeamChildrenValue;
                if (!nurseTeam) {
                    setNurseTeamChildren(newNurseTeamChildren);
                    return;
                }
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

    return (
        <Drawer open={open} onClose={() => setOpen(false)} anchor='right'>
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
    )
}
