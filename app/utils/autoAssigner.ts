import { Provider } from "../page";

export function autoAssigner(nurseList: string[], roomList: string[], providerList: Provider[], existingRoomParents?: Record<string, string | null>, existingProviderParents?: Record<string, { am: string | null, pm: string | null }>) {
    const roomParents: Record<string, string | null> = {};
    const providerParents: Record<string, { am: string | null, pm: string | null }> = {};

    /*
    * Begin by initializing the parents objects if there are parents passed in
    */

    // Assign providers to rooms for AM, skipping assignment if patientCount = 0 and keeping patientCount as even as possible
    let providerPointerAM = 0;
    const providerGroupingsAM: { name: string, amCount: number }[][] = new Array(roomList.length);
    roomList.forEach(() => providerGroupingsAM.push([]));
    providerList.sort((a, z) => z.patientCount.am - a.patientCount.am);
    while (providerPointerAM < providerList.length) {
        if (providerList[providerPointerAM].patientCount.am === 0) {
            providerPointerAM++;
            continue;
        }
        providerGroupingsAM.sort((a, z) => (a.length ? a.reduce((p, c) => p + c.amCount, 0) : 0) - (z.length ? z.reduce((p, c) => p + c.amCount, 0) : 0));
        providerGroupingsAM[0].push({ name: providerList[providerPointerAM].name, amCount: providerList[providerPointerAM].patientCount.am });
        providerPointerAM++;
    }

    // Assign providers to rooms for PM, skipping assignment if patientCount = 0, maintaining same room if already in a room for AM, and keeping patientCount as even as possible
    let providerPointerPM = 0;
    const providerGroupingsPM: { name: string, pmCount: number }[][] = new Array(roomList.length);
    roomList.forEach(() => providerGroupingsPM.push([]));
    providerList.sort((a, z) => z.patientCount.pm - a.patientCount.pm);
    while (providerPointerPM < providerList.length) {
        if (providerList[providerPointerPM].patientCount.pm === 0) {
            providerPointerPM++;
            continue;
        }
        providerGroupingsPM.sort((a, z) => (a.length ? a.reduce((p, c) => p + c.pmCount, 0) : 0) - (z.length ? z.reduce((p, c) => p + c.pmCount, 0) : 0));
        providerGroupingsPM[0].push({ name: providerList[providerPointerPM].name, pmCount: providerList[providerPointerPM].patientCount.pm });
        providerPointerPM++;
    }


    // Build provider parents object instead
    let providerGroupingsAMPointer = 0;
    let roomPointerAM = 0;
    let nursePointerAM = 0;
    while (providerGroupingsAMPointer < providerGroupingsAM.length && roomPointerAM < roomList.length) {
        if (nursePointerAM >= nurseList.length) nursePointerAM = 0;
        const providerAMList = providerGroupingsAM[providerGroupingsAMPointer];
        for (const providerAM of providerAMList) {
            providerParents[providerAM.name] = { am: roomList[roomPointerAM], pm: null }
            roomParents[roomList[roomPointerAM]] = nurseList[nursePointerAM];
            roomPointerAM++;
        }
        nursePointerAM++;
        providerGroupingsAMPointer++;
    }

    let providerGroupingsPMPointer = 0;
    let roomPointerPM = 0;
    let nursePointerPM = 0;
    while (providerGroupingsPMPointer < providerGroupingsPM.length && roomPointerPM < roomList.length) {
        if (nursePointerPM >= nurseList.length) nursePointerPM = 0;
        const providerPMList = providerGroupingsPM[providerGroupingsPMPointer];
        for (const providerPM of providerPMList) {
            providerParents[providerPM.name] = { am: providerParents[providerPM.name].am, pm: roomList[roomPointerPM] }
            roomParents[roomList[roomPointerPM]] = nurseList[nursePointerPM];
            roomPointerPM++;
        }
        nursePointerPM++;
        providerGroupingsPMPointer++;
    }

    return { providerParents, roomParents };
}
