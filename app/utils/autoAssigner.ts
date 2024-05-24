// TODO: fix room name "undefined" sometimes being returned with a provider attached
import { Provider } from "../page";

export function autoAssigner(nurseList: string[], roomList: string[], providerList: Provider[], existingRoomParents?: Record<string, string | null>) {
    const roomParents: Record<string, string | null> = existingRoomParents ?? {};
    const providerParents: Record<string, { am: string | null, pm: string | null }> = {};
    const usableRoomList = Object.keys(roomParents).length ? Object.keys(roomParents) : roomList;
    let warningMessage = '';
    if (providerList.length > usableRoomList.length) warningMessage = 'Not enough rooms for all providers.';

    // Assign providers to groups for AM, skipping assignment if patientCount = 0 and keeping patientCount as even as possible
    let providerPointerAM = 0;
    const providerGroupingsAM: { name: string, amCount: number }[][] = new Array();
    /*
         If room groupings already exist, then the group sizes have already been determined.
         We can find these by iterating over nurses and creating a grouping for each with max length
         determined by the number of rooms each nurse has been assigned.
    */
    if (Object.keys(roomParents).length) {
        nurseList.forEach(nurse => {
            let nurseRoomCount = 0;
            Object.entries(roomParents).forEach(([room, nurseParent]) => {
                if (nurseParent === nurse) {
                    nurseRoomCount++;
                }
            })
            if (nurseRoomCount > 0) {
                const nurseRoomArray = new Array();
                providerGroupingsAM.push(nurseRoomArray);
            }
        })
    } else {
        nurseList.forEach(() => providerGroupingsAM.push([]));
    }

    providerList.sort((a, z) => z.patientCount.am.inPerson - a.patientCount.am.inPerson);
    while (providerPointerAM < providerList.length) {
        if (providerList[providerPointerAM].patientCount.am.inPerson === 0) {
            providerPointerAM++;
            continue;
        }
        providerGroupingsAM.sort((a, z) => (a.length ? a.reduce((p, c) => p + c.amCount, 0) : 0) - (z.length ? z.reduce((p, c) => p + c.amCount, 0) : 0));
        providerGroupingsAM[0].push({ name: providerList[providerPointerAM].name, amCount: providerList[providerPointerAM].patientCount.am.inPerson });
        providerPointerAM++;
    }

    // Assign providers to groups for PM, skipping assignment if patientCount = 0, maintaining same room if already in a room for AM, and keeping patientCount as even as possible
    let providerPointerPM = 0;
    const providerGroupingsPM: { name: string, pmCount: number }[][] = new Array();
    /*
         If room groupings already exist, then the group sizes have already been determined.
         We can find these by iterating over nurses and creating a grouping for each with max length
         determined by the number of rooms each nurse has been assigned.
    */
    if (Object.keys(roomParents).length) {
        nurseList.forEach(nurse => {
            let nurseRoomCount = 0;
            Object.entries(roomParents).forEach(([room, nurseParent]) => {
                if (nurseParent === nurse) {
                    nurseRoomCount++;
                }
            })
            if (nurseRoomCount > 0) {
                const nurseRoomArray = new Array();
                providerGroupingsPM.push(nurseRoomArray);
            }
        })
    } else {
        nurseList.forEach(() => providerGroupingsPM.push([]));
    }

    providerList.sort((a, z) => z.patientCount.pm.inPerson - a.patientCount.pm.inPerson);
    while (providerPointerPM < providerList.length) {
        if (providerList[providerPointerPM].patientCount.pm.inPerson === 0) {
            providerPointerPM++;
            continue;
        }
        providerGroupingsPM.sort((a, z) => (a.length ? a.reduce((p, c) => p + c.pmCount, 0) : 0) - (z.length ? z.reduce((p, c) => p + c.pmCount, 0) : 0));
        providerGroupingsPM[0].push({ name: providerList[providerPointerPM].name, pmCount: providerList[providerPointerPM].patientCount.pm.inPerson });
        providerPointerPM++;
    }

    // Build provider parents object instead
    let providerGroupingsAMPointer = 0;
    let roomPointerAM = 0;
    let nursePointerAM = 0;
    while (providerGroupingsAMPointer < providerGroupingsAM.length && roomPointerAM < usableRoomList.length) {
        if (nursePointerAM >= nurseList.length) nursePointerAM = 0;
        const providerGrouping = providerGroupingsAM[providerGroupingsAMPointer] ?? [];
        for (const provider of providerGrouping) {
            providerParents[provider.name] = { am: usableRoomList[roomPointerAM], pm: null };
            if (!roomParents[usableRoomList[roomPointerAM]]) roomParents[usableRoomList[roomPointerAM]] = nurseList[nursePointerAM];
            roomPointerAM++;
        }
        nursePointerAM++;
        providerGroupingsAMPointer++;
    }

    let providerGroupingsPMPointer = 0;
    let roomPointerPM = 0;
    let nursePointerPM = 0;
    while (providerGroupingsPMPointer < providerGroupingsPM.length && roomPointerPM < usableRoomList.length) {
        if (nursePointerPM >= nurseList.length) nursePointerPM = 0;
        const providerPMList = providerGroupingsPM[providerGroupingsPMPointer] ?? [];
        for (const providerPM of providerPMList) {
            providerParents[providerPM.name] = { am: providerParents[providerPM.name]?.am ?? null, pm: usableRoomList[roomPointerPM] }
            if (!roomParents[usableRoomList[roomPointerPM]]) roomParents[usableRoomList[roomPointerPM]] = nurseList[nursePointerPM];
            roomPointerPM++;
        }
        nursePointerPM++;
        providerGroupingsPMPointer++;
    }

    return { providerParents, roomParents, warningMessage };
}
