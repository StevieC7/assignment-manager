'use client';
import { Button, Grid, Snackbar, Typography } from "@mui/material";
import { useState } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { FileDownload, FileOpen, Save, Sort } from "@mui/icons-material";
// @ts-ignore
import * as Papa from 'papaparse';
import { autoAssigner } from "./utils/autoAssigner";
import dayjs, { Dayjs } from "dayjs";
import exportHelper from "./utils/exportHelper";
import { sortNursesByPatientCount } from "./utils/sorting";
import SummaryTable from "./components/SummaryTable";
import StaffSetupSidebar from "./components/StaffSetupSidebar";
import MainSidebar from "./components/MainSidebar";
import NurseTeamCard from "./components/NurseTeamCard";
import { NurseAssignments, Provider, ResetOptions, SortOptions } from "./types/types";

export default function Home() {
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [roomsLocked, setRoomsLocked] = useState<boolean>(false);

    const [nurseSortSetting, setNurseSortSetting] = useState<SortOptions>(SortOptions.NONE);
    const [sortedActiveNurses, setSortedActiveNurses] = useState<string[]>([]);
    const [sortedActiveNurseTeams, setSortedActiveNurseTeams] = useState<string[]>([]);

    const [dateValue, setDateValue] = useState<Dayjs>(dayjs(new Date()));

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
    const averagePatientCountAM = Math.ceil(providerList.reduce((prev, curr) => prev + curr.patientCount.am.inPerson, 0) / allActiveNurseGroupings.length);
    const averagePatientCountPM = Math.ceil(providerList.reduce((prev, curr) => prev + curr.patientCount.pm.inPerson, 0) / allActiveNurseGroupings.length);

    const handleSortNursesAndTeams = (sortMode: SortOptions) => {
        switch (sortMode) {
            case SortOptions.NONE:
                setNurseSortSetting(SortOptions.NONE)
                setSortedActiveNurses([])
                setSortedActiveNurseTeams([])
                break;
            case SortOptions.ASCENDING_BY_PATIENT_COUNT:
                const sortedActiveNurseListByPatientCountAscending = sortNursesByPatientCount(activeNurses, nurseAssignments, 'asc')
                const sortedActiveNurseTeamListByPatientCountAscending = sortNursesByPatientCount(activeNurseTeams, nurseAssignments, 'asc')
                setSortedActiveNurses(sortedActiveNurseListByPatientCountAscending)
                setSortedActiveNurseTeams(sortedActiveNurseTeamListByPatientCountAscending)
                setNurseSortSetting(SortOptions.ASCENDING_BY_PATIENT_COUNT)
                break;
            case SortOptions.DESCENDING_BY_PATIENT_COUNT:
                const sortedActiveNurseListByPatientCountDescending = sortNursesByPatientCount(activeNurses, nurseAssignments, 'desc')
                const sortedActiveNurseTeamListByPatientCountDescending = sortNursesByPatientCount(activeNurseTeams, nurseAssignments, 'desc')
                setSortedActiveNurses(sortedActiveNurseListByPatientCountDescending)
                setSortedActiveNurseTeams(sortedActiveNurseTeamListByPatientCountDescending)
                setNurseSortSetting(SortOptions.DESCENDING_BY_PATIENT_COUNT)
                break;
        }
    }


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
                const existingProvider = Object.entries(providerParents)?.find(([_, room]) => room[overShift as 'am' | 'pm'] === overRoom)?.[0];
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
        setSnackbarMessage(`Saved schedule for ${dayjs(dateValue).format('MM/DD/YYYY')}`);
        setSnackbarOpen(true);
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
        setSnackbarMessage(`Loaded schedule for ${dayjs(dateValue).format('MM/DD/YYYY')}`);
        setSnackbarOpen(true);
    }

    const handleExport = () => {
        const data = exportHelper(nurseAssignments, nurseTeamChildren);
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8,' });
        const objUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', objUrl);
        link.setAttribute('download', `schedule_${dayjs(dateValue).format('MM_DD_YYYY')}.csv`);
        link.click();
        setSnackbarMessage(`Exported schedule for ${dayjs(dateValue).format('MM/DD/YYYY')}`);
        setSnackbarOpen(true);
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

    const handleReset = (item: ResetOptions) => {
        switch (item) {
            case ResetOptions.ALL:
                setRoomParents({});
                setProviderParents({});
                setRoomsLocked(false);
                setSnackbarMessage(`Reset successful`);
                setSnackbarOpen(true);
                break;
            case ResetOptions.PROVIDERS:
                setProviderParents({});
                setSnackbarMessage(`Providers have been reset`);
                setSnackbarOpen(true);
                break;
        }
    }

    return (
        <main>
            <DndContext onDragEnd={handleDragEnd}>
                <Grid container direction='row' justifyContent='space-between' alignItems='center' className='bg-black text-white p-4 fixed top-0'>
                    <Typography variant="h1" fontSize={36}>Assignment Manager</Typography>
                    <Grid item>
                        <Save onClick={handleSaveToLocal} sx={{ cursor: 'pointer', mr: 2 }} />
                        <FileOpen onClick={handleLoadLocal} sx={{ cursor: 'pointer', mr: 2 }} />
                        <FileDownload onClick={handleExport} sx={{ cursor: 'pointer' }} />
                    </Grid>
                </Grid>
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
                        <SummaryTable
                            activeNurses={activeNurses}
                            activeNurseTeams={activeNurseTeams}
                            nurseAssignments={nurseAssignments}
                            providerList={providerList}
                            averagePatientCountAM={averagePatientCountAM}
                            averagePatientCountPM={averagePatientCountPM}
                        />
                        <Grid item container justifyContent='space-between'>
                            <Typography variant='h4' className='pl-5 mb-2'>Assignments</Typography>
                            <Grid item container xs={3} justifyContent='flex-end'>
                                <Button
                                    onMouseDown={() => handleSortNursesAndTeams(nurseSortSetting === SortOptions.ASCENDING_BY_PATIENT_COUNT ? SortOptions.DESCENDING_BY_PATIENT_COUNT : SortOptions.ASCENDING_BY_PATIENT_COUNT)}
                                    startIcon={
                                        <Sort
                                            sx={{ transform: `${nurseSortSetting === SortOptions.ASCENDING_BY_PATIENT_COUNT ? 'none' : 'rotate(180deg) scaleX(-1)'}` }}
                                        />
                                    }
                                >
                                    Sort by # Patients
                                </Button>
                            </Grid>
                        </Grid>
                        <Grid
                            item
                            container
                            direction='row'
                            xs={12}
                            spacing={2}
                        >
                            {
                                nurseSortSetting !== SortOptions.NONE
                                    ? sortedActiveNurseTeams.map((nurse, index) => {
                                        return (
                                            <NurseTeamCard
                                                key={`${index}-${nurse}`}
                                                nurse={nurse}
                                                nurseTeamChildren={nurseTeamChildren}
                                                averagePatientCountAM={averagePatientCountAM}
                                                averagePatientCountPM={averagePatientCountPM}
                                                nurseAssignments={nurseAssignments}
                                            />
                                        )
                                    })
                                    : activeNurseTeams.map((nurse, index) => {
                                        return (
                                            <NurseTeamCard
                                                key={`${index}-${nurse}`}
                                                nurse={nurse}
                                                nurseTeamChildren={nurseTeamChildren}
                                                averagePatientCountAM={averagePatientCountAM}
                                                averagePatientCountPM={averagePatientCountPM}
                                                nurseAssignments={nurseAssignments}
                                            />
                                        )
                                    })
                            }
                            {
                                nurseSortSetting !== SortOptions.NONE
                                    ? sortedActiveNurses.map((nurse, index) => {
                                        return (
                                            <NurseTeamCard
                                                key={`${index}-${nurse}`}
                                                nurse={nurse}
                                                nurseTeamChildren={nurseTeamChildren}
                                                averagePatientCountAM={averagePatientCountAM}
                                                averagePatientCountPM={averagePatientCountPM}
                                                nurseAssignments={nurseAssignments}
                                            />
                                        )
                                    })
                                    : activeNurses.map((nurse, index) => {
                                        return (
                                            <NurseTeamCard
                                                key={`${index}-${nurse}`}
                                                nurse={nurse}
                                                nurseTeamChildren={nurseTeamChildren}
                                                averagePatientCountAM={averagePatientCountAM}
                                                averagePatientCountPM={averagePatientCountPM}
                                                nurseAssignments={nurseAssignments}
                                            />
                                        )
                                    })
                            }
                        </Grid>
                    </Grid>
                    <MainSidebar
                        setDrawerOpen={setDrawerOpen}
                        handleAutoAssign={handleAutoAssign}
                        handleReset={handleReset}
                        roomsLocked={roomsLocked}
                        setRoomsLocked={setRoomsLocked}
                        roomList={roomList}
                        providerList={providerList}
                        roomParents={roomParents}
                        providerParents={providerParents}
                        nurseAssignments={nurseAssignments}
                    />
                    <StaffSetupSidebar
                        open={drawerOpen}
                        setOpen={setDrawerOpen}
                        dateValue={dateValue}
                        setDateValue={setDateValue}
                        nurseTeamList={nurseTeamList}
                        setNurseTeamList={setNurseTeamList}
                        nurseList={nurseList}
                        setNurseList={setNurseList}
                        nurseTeamChildren={nurseTeamChildren}
                        setNurseTeamChildren={setNurseTeamChildren}
                        roomList={roomList}
                        setRoomList={setRoomList}
                        providerList={providerList}
                        setProviderList={setProviderList}
                        roomParents={roomParents}
                        setRoomParents={setRoomParents}
                        providerParents={providerParents}
                        setProviderParents={setProviderParents}
                    />
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
