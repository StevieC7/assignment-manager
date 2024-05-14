'use client';
import { Button, TextField, Typography } from "@mui/material";
import { useState } from "react";
export default function Home() {
    const [nurseList, setNurseList] = useState<string[]>([]);
    const [nurseName, setNurseName] = useState<string>('');
    return (
        <main>
            <h1>Room Assigner</h1>
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
        </main >
    );
}
