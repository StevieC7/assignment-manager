import { NurseAssignments } from "../page";

type CSVDataFields = {
    fields: string[],
    data: string[][]
}

export default function exportHelper(nurseAssignments: NurseAssignments): CSVDataFields {
    // each inner array of data represents a row, with columns corresponding to columns specified in fields
    const data: string[][] = [];
    for (const [nurse, rooms] of Object.entries(nurseAssignments)) {
        for (const [room, shiftSlots] of Object.entries(rooms)) {
            if (shiftSlots.am) data.push(['am', nurse, room, shiftSlots.am.name, shiftSlots.am.patientCount.am.inPerson.toString()])
            if (shiftSlots.pm) data.push(['pm', nurse, room, shiftSlots.pm.name, shiftSlots.pm.patientCount.pm.inPerson.toString()])
        }
        data.push(new Array().fill(''))
    }

    return {
        fields: ['Shift', 'Nurse Team', 'Room', 'Provider', 'Patient Count'],
        data
    }
}
