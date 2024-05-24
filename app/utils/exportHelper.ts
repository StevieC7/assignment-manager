import { NurseAssignments } from "../page";

type CSVDataFields = {
    fields: string[],
    data: string[][]
}

export default function exportHelper(nurseAssignments: NurseAssignments): CSVDataFields {
    // each inner array of data represents a row, with columns corresponding to columns specified in fields
    const data: string[][] = [];
    for (const [nurse, rooms] of Object.entries(nurseAssignments)) {
        const newArea: string[][] = [];
        for (const [room, shiftSlots] of Object.entries(rooms)) {
            // Desired shape of new area rows [room, am provider, am patients, nurse, pm provider, pm patients]
            if (newArea.length === 0) {
                newArea.push([]);
                if (shiftSlots.am) {
                    newArea[0].push(room, shiftSlots.am.name, shiftSlots.am.patientCount.am.inPerson.toString(), nurse)
                } else {
                    newArea[0].push('', '', '', nurse)
                }
                if (shiftSlots.pm) newArea[0].push(shiftSlots.pm.name, shiftSlots.pm.patientCount.pm.inPerson.toString())
                continue;
            }
            const newRow = [];
            if (shiftSlots.am) newRow.push(room, shiftSlots.am.name, shiftSlots.am.patientCount.am.inPerson.toString(), '')
            if (shiftSlots.pm) newRow.push(shiftSlots.pm.name, shiftSlots.pm.patientCount.pm.inPerson.toString())
            newArea.push(newRow);
        }
        newArea.forEach(row => data.push(row))
        data.push(new Array().fill(''))
        data.push(['Room', 'AM Provider', 'AM PatientCount', 'Nurse', 'PM Provider', 'PM PatientCount'])
    }
    data.pop();
    data.pop();

    return {
        fields: ['Room', 'AM Provider', 'AM PatientCount', 'Nurse', 'PM Provider', 'PM PatientCount'],
        data
    }
}
