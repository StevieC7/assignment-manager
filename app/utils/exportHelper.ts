import { NurseAssignments } from "../types/types";

type CSVDataFields = {
    fields: string[],
    data: string[][]
}

export default function exportHelper(nurseAssignments: NurseAssignments, nurseTeamChildren: Record<string, (string | null)[]>): CSVDataFields {
    // each inner array of data represents a row, with columns corresponding to columns specified in fields
    const data: string[][] = [];
    let nurseTeamMemberCount = 0;
    for (const [nurse, rooms] of Object.entries(nurseAssignments)) {
        const newArea: string[][] = [];
        const nurseTeamMembers = nurseTeamChildren[nurse];
        if (nurseTeamMembers) {
            nurseTeamMembers.forEach(() => nurseTeamMemberCount++);
        } else {
            nurseTeamMemberCount++;
        }
        for (const [room, shiftSlots] of Object.entries(rooms)) {
            if (newArea.length === 0) {
                newArea.push([]);
                if (shiftSlots.am) {
                    newArea[0].push(room, shiftSlots.am.name, `${shiftSlots.am.patientCount.am.inPerson.toString()}${shiftSlots.am.patientCount.am.virtual > 0 ? `(${shiftSlots.am.patientCount.am.virtual.toString()}v)` : ''}`, nurse)
                } else {
                    newArea[0].push('', '', '', nurse)
                }
                if (shiftSlots.pm) newArea[0].push(shiftSlots.pm.name, `${shiftSlots.pm.patientCount.pm.inPerson.toString()}${shiftSlots.pm.patientCount.pm.virtual > 0 ? `(${shiftSlots.pm.patientCount.pm.virtual.toString()}v)` : ''}`)
                continue;
            }
            const newRow = [];
            if (shiftSlots.am) newRow.push(room, shiftSlots.am.name, `${shiftSlots.am.patientCount.am.inPerson.toString()}${shiftSlots.am.patientCount.am.virtual > 0 ? `(${shiftSlots.am.patientCount.am.virtual.toString()}v)` : ''}`, '')
            if (shiftSlots.pm) newRow.push(shiftSlots.pm.name, `${shiftSlots.pm.patientCount.pm.inPerson.toString()}${shiftSlots.pm.patientCount.pm.virtual > 0 ? `(${shiftSlots.pm.patientCount.pm.virtual.toString()}v)` : ''}`)
            newArea.push(newRow);
        }
        let nurseTeamMemberPointer = 0;
        for (let i = 0; i < nurseTeamMemberCount; i++) {
            if (newArea[i]) {
                newArea[i][3] = nurseTeamMembers[nurseTeamMemberPointer] ?? '';
                nurseTeamMemberPointer++;
            } else {
                newArea.push(['', '', '', nurseTeamMembers[nurseTeamMemberPointer] ?? '']);
                nurseTeamMemberPointer++;
            }
        }
        newArea.forEach(row => data.push(row))
        data.push(new Array().fill(''))
        data.push(['Room', 'AM Provider', 'AM PatientCount', 'Nurses', 'PM Provider', 'PM PatientCount'])
        nurseTeamMemberCount = 0;
    }
    data.pop();
    data.pop();

    return {
        fields: ['Room', 'AM Provider', 'AM PatientCount', 'Nurses', 'PM Provider', 'PM PatientCount'],
        data
    }
}
