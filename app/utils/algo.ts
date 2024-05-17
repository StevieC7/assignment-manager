import { Room } from "../page";

export function roomMatcher(nurses: string[], rooms: Room[], averageAssignments: number) {
    const assignments: Record<string, Room[]> = {};

    const usedRooms: Room[] = [];
    for (const nurse of nurses) {
        let runningPatientCount = 0;
        const nurseRooms: Room[] = [];
        for (const room of rooms) {
            if (!usedRooms.find(usedRoom => usedRoom == room) && runningPatientCount + room.patientCount <= averageAssignments) {
                usedRooms.push(room);
                runningPatientCount += room.patientCount;
                nurseRooms.push(room);
            }
        }
        assignments[nurse] = nurseRooms;
    }

    return { assignments };
}
