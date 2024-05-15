import { Room } from "../page";
type Assignment = {
    nurse: string,
    rooms: Room[]
}
export const dummyNurses = ['Elizabeth', 'Gerry', 'Trace', 'Ajo', 'Jessica', 'Shayne'];
export const dummyRooms: Room[] = [
    {
        name: '4&5'
        , patientCount: 4
    }
    , {
        name: '7&8'
        , patientCount: 3
    }
    , {
        name: '9&10'
        , patientCount: 2
    }
    , {
        name: '11&12'
        , patientCount: 3
    }
    , {
        name: '13&14'
        , patientCount: 5
    }
    , {
        name: '15&16'
        , patientCount: 4
    }
    , {
        name: '17&18'
        , patientCount: 5
    }
    , {
        name: '19&20'
        , patientCount: 5
    }
    , {
        name: '21&22'
        , patientCount: 1
    }
    , {
        name: '23&24'
        , patientCount: 2
    }
    , {
        name: '25&26'
        , patientCount: 2
    }
    , {
        name: '27&28'
        , patientCount: 2
    }
    , {
        name: '29&30'
        , patientCount: 4
    }
    , {
        name: '32&33'
        , patientCount: 1
    }
    , {
        name: '34&35'
        , patientCount: 3
    }
]
export function roomMatcher(nurses: string[], rooms: Room[]) {
    const assignments: Assignment[] = [];
    const exceptions: Room[] = [];
    const totalAssignments = dummyRooms.reduce((prev, curr) => prev + curr.patientCount, 0);
    const averageAssignments = Math.floor(totalAssignments / dummyNurses.length);

    const usedRooms: Room[] = [];
    for (const nurse of dummyNurses) {
        let runningPatientCount = 0;
        const nurseRooms: Room[] = [];
        for (const room of dummyRooms) {
            if (!usedRooms.find(usedRoom => usedRoom == room) && runningPatientCount + room.patientCount <= averageAssignments) {
                usedRooms.push(room);
                runningPatientCount += room.patientCount;
                nurseRooms.push(room);
            }
        }
        assignments.push({ nurse, rooms: nurseRooms });
    }
    for (const room of dummyRooms) {
        if (!usedRooms.find(usedRoom => usedRoom == room)) {
            exceptions.push(room);
        }
    }

    return { assignments, exceptions, averageAssignments };
}
