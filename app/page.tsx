'use client';
import { Button, Grid, TextField, Typography } from "@mui/material";
import { useState } from "react";
import ProviderZone from "./components/ProviderDropzone";
import DraggableProvider from "./components/DraggableProvider";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { CheckCircle } from "@mui/icons-material";
import { providerMatcher } from "./utils/algo";
// @ts-ignore
import * as Papa from 'papaparse';

export type Provider = {
    name: string,
    patientCount: number,
}
export default function Home() {
    const [nurseName, setNurseName] = useState<string>('');
    const [provider, setProvider] = useState<Provider>({ name: '', patientCount: 0 });

    const [nurseList, setNurseList] = useState<string[]>([]);
    const [providerList, setProviderList] = useState<Provider[]>([]);

    const averagePatientCount = Math.ceil(providerList.reduce((prev, curr) => prev + curr.patientCount, 0) / nurseList.length);
    const [nurseAssignments, setNurseAssignments] = useState<Record<string, Provider[]>>({});

    const unassignedProviders = providerList.filter(provider => !Object.values(nurseAssignments).flat().map(val => val.name).includes(provider.name));

    const isProviderNameDuplicate = provider.name !== '' && providerList.find(existingProvider => existingProvider.name === provider.name) ? true : false;

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
            for (const [nurseName, providerList] of Object.entries(newNurseAssignments)) {
                if (providerList.find(provider => provider.name === name)) {
                    const newList = providerList.filter(provider => provider.name !== name);
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

    const handleDeleteProvider = (id: number, name: string) => {
        const newList = [...providerList];
        newList.splice(id, 1);
        setProviderList(newList);
        let newUserAssigned = { ...nurseAssignments };
        for (const [nurseName, providerList] of Object.entries(newUserAssigned)) {
            const newList = providerList.filter(provider => provider.name !== name);
            newUserAssigned[nurseName] = newList;
        }
        setNurseAssignments(newUserAssigned);
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { over, active } = event;
        const parentTuple = Object.entries(nurseAssignments).find(nurse => nurse[1].map(provider => provider.name).includes(active.id as string));
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
            const activeProvider = providerList.find(provider => provider.name === active.id);
            const alreadyAssigned = nurseAssignments[over.id] || [];
            updatedAssigned[over.id] = activeProvider ? [...alreadyAssigned, activeProvider] : alreadyAssigned;
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
        const { assignments } = providerMatcher(nurseList, providerList, averagePatientCount);
        setNurseAssignments(assignments);
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
                                onClick={() => {
                                    setNurseList([...nurseList, nurseName])
                                    setNurseName('')
                                }}
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
                                    // TODO: add an "update" functionality for the patient count
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
                                    <ProviderZone
                                        key={nurse}
                                        nurseId={nurse}
                                        patientCount={nurseAssignments[nurse] ? nurseAssignments[nurse].reduce((prev, curr) => prev + curr.patientCount, 0) : 0}
                                        averagePatientCount={averagePatientCount}
                                    >
                                        {
                                            Object.entries(nurseAssignments).map(([key, val]) => {
                                                const providers = val;
                                                if (providers.length && key === nurse) {
                                                    const providerList = providers.map(provider => {
                                                        return (
                                                            <DraggableProvider key={`provider-${provider.name}`} providerId={provider.name}>{provider.name}: {provider.patientCount}</DraggableProvider>
                                                        )
                                                    })
                                                    return providerList;
                                                } else {
                                                    return null;
                                                }
                                            })
                                        }
                                    </ProviderZone>
                                ))
                            }
                        </Grid>
                    </Grid>
                </Grid>
            </DndContext>
        </main >
    );
}
