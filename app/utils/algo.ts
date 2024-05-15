import { Room } from "../page";
export function roomMatcher(nurses: string[], rooms: Room[]) {
    const nursePatientCount = new Map();
    for (const nurse of nurses) {
        nursePatientCount.set(nurse, { rooms: [], patientCount: 0 });
    }
    const unusedRooms = [...rooms];
    const totalPatientCount = rooms.reduce((prev, curr) => prev + curr.patientCount, 0);
    let unassignedPatientCount = totalPatientCount;

    while (unassignedPatientCount > 0) {
        const nursePtCounts = [...nursePatientCount.entries()];
        let lowest = Number.MAX_VALUE;
        let nurseWithLeastPatients = nursePtCounts[0][0];
        for (const [nurse, data] of nursePtCounts) {
            const ptCount = data.patientCount;
            console.log(nurse, ptCount)
            if (ptCount < lowest) {
                lowest = ptCount;
                nurseWithLeastPatients = nurse;
            }
        }
        const nurseExistingPtCount = nursePatientCount.get(nurseWithLeastPatients) ? nursePatientCount.get(nurseWithLeastPatients).patientCount : 0;
        const nurseExistingRooms = nursePatientCount.get(nurseWithLeastPatients) ? nursePatientCount.get(nurseWithLeastPatients).rooms : [];
        const roomToUse = unusedRooms[0];
        nursePatientCount.set(nurseWithLeastPatients, { rooms: [...nurseExistingRooms, roomToUse.name], patientCount: nurseExistingPtCount + roomToUse.patientCount });
        unassignedPatientCount -= roomToUse.patientCount;
        unusedRooms.shift();
    }

    return nursePatientCount;
}
