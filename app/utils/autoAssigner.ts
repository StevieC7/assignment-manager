import { NurseAssignments, Provider } from "../page";

export function autoAssigner(nurseList: string[], roomList: string[], providerList: Provider[], roomParents?: Record<string, string | null>): NurseAssignments {
    const nurseAssignments: NurseAssignments = {};
    /*
    * Begin by initializing the nurse assignments if there are already rooms assigned to nurses.
    * This is for use case when nurses are always assigned to rooms but providers are moved around.
    */
    if (roomParents) {
        for (const [room, nurse] of Object.entries(roomParents)) {
            if (nurse && !nurseAssignments[nurse]) nurseAssignments[nurse] = {};
            if (nurse && nurseAssignments[nurse]) {
                nurseAssignments[nurse] = {
                    ...nurseAssignments[nurse],
                    [room]: { am: null, pm: null }
                }
            }
        }
    }

    // Assign rooms equally to nurses
    let roomPointer = 0;
    let nursePointer = 0;
    while (roomPointer < roomList.length) {
        if (nursePointer >= nurseList.length) nursePointer = 0;
        nurseAssignments[nurseList[nursePointer]] = { [roomList[roomPointer]]: { am: null, pm: null } };
        nursePointer++;
        roomPointer++;
    }

    // Assign providers to rooms for AM, skipping assignment if patientCount = 0 and keeping patientCount as even as possible
    let providerPointerAM = 0;
    const providerGroupingsAM: number[][] = new Array(roomList.length);
    roomList.forEach(() => providerGroupingsAM.push([]));
    providerList.sort((a, z) => z.patientCount.am - a.patientCount.am);
    while (providerPointerAM < providerList.length) {
        if (providerList[providerPointerAM].patientCount.am === 0) {
            providerPointerAM++;
            continue;
        }
        providerGroupingsAM.sort((a, z) => (a.length ? a.reduce((p, c) => p + c) : 0) - (z.length ? z.reduce((p, c) => p + c) : 0));
        providerGroupingsAM[0].push(providerList[providerPointerAM].patientCount.am);
        providerPointerAM++;
    }

    // Assign providers to rooms for PM, skipping assignment if patientCount = 0, maintaining same room if already in a room for AM, and keeping patientCount as even as possible
    let providerPointerPM = 0;
    const providerGroupingsPM: number[][] = new Array(roomList.length);
    roomList.forEach(() => providerGroupingsPM.push([]));
    providerList.sort((a, z) => z.patientCount.pm - a.patientCount.pm);
    while (providerPointerPM < providerList.length) {
        if (providerList[providerPointerPM].patientCount.pm === 0) {
            providerPointerPM++;
            continue;
        }
        providerGroupingsPM.sort((a, z) => (a.length ? a.reduce((p, c) => p + c) : 0) - (z.length ? z.reduce((p, c) => p + c) : 0));
        providerGroupingsPM[0].push(providerList[providerPointerPM].patientCount.pm);
        providerPointerPM++;
    }

    console.log({ providerGroupingsAM, providerGroupingsPM, nurseAssignments })
    return {
        'Elizabeth': {
            'Room A': {
                am: {
                    name: 'Doc Mike'
                    , patientCount: {
                        am: 5,
                        pm: 7
                    }
                },
                pm: {
                    name: 'Doc Mike'
                    , patientCount: {
                        am: 5,
                        pm: 7
                    }
                }
            }
        }
    }
}
