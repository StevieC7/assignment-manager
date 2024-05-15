import { Room } from "../page";
type Assignment = {
    nurse: string,
    rooms: Room[]
}
export function roomMatcher(nurses: string[], rooms: Room[]) {
    const assignments: Assignment[] = [];
    const exceptions: Room[] = [];
    const totalAssignments = rooms.reduce((prev, curr) => prev + curr.patientCount, 0);
    const averageAssignments = Math.floor(totalAssignments / nurses.length);

    // give each nurse rooms until reaching averageAssignments
    // raise exceptions which would put any nurse over the averageAssignments to the user
    let runningPatientCount = 0;
    let nurseRooms: Room[] = [];
    let nursePointer = 0;
    let roomPointer = 0;
    while (nursePointer < nurses.length && roomPointer < rooms.length) {
        // Edge cases:
        // Nurse's only room is the last room

        // Nurse has no rooms, automatically they should be getting one
        if (nurseRooms.length === 0) {
            nurseRooms.push(rooms[roomPointer]);
            runningPatientCount += rooms[roomPointer].patientCount;
            roomPointer++;
            if (roomPointer === rooms.length) {
                assignments.push({ nurse: nurses[nursePointer], rooms: nurseRooms })
            }
            continue;
        }
        // Nurse can add more patients before going over average
        if (runningPatientCount + rooms[roomPointer].patientCount <= averageAssignments) {
            // add the room to nurseRooms array
            nurseRooms.push(rooms[roomPointer]);
            // add to the running patient count
            runningPatientCount += rooms[roomPointer].patientCount;
            // advance the room pointer
            roomPointer++;
            continue;
        }
        // nurse has no rooms and pointer is sitting on currently unused room
        // use the room for this nurse
        if (nurseRooms.length === 0 && roomPointer === rooms.length - 1) {
            assignments.push({ nurse: nurses[nursePointer], rooms: [rooms[roomPointer]] })
            roomPointer++;
            continue;
        }
        // If we are here, this means we cannot add the current room to the assignment
        // If there are no nurses left to consider, this would be an exception and we should store it and continue at the next room
        if (nursePointer === nurses.length - 1 && runningPatientCount + rooms[roomPointer].patientCount > averageAssignments) {
            console.log({ nurse: nurses[nursePointer], room: rooms[roomPointer], runningPatientCount })
            exceptions.push(rooms[roomPointer]);
            roomPointer++;
            if (roomPointer === rooms.length - 1) {
                assignments.push({ nurse: nurses[nursePointer], rooms: nurseRooms });
            }
            continue;
        }
        assignments.push({ nurse: nurses[nursePointer], rooms: nurseRooms });
        runningPatientCount = 0;
        nursePointer++;
        nurseRooms = [];
    }

    return { assignments, exceptions, averageAssignments };
}
